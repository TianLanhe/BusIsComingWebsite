# 研究记录：网站匿名访问统计与监控面板

## 决策 1：新增独立 `analytics` bounded context，并以应用端口隔离存储

**Decision**：服务端新增 `backend/internal/analytics/`，按 `domain`、`application`、
`infrastructure`、`interfaces` 分层。领域层只表达匿名事件、有限枚举、30 分钟派生会话和
统计口径；应用层提供事件记录及七类监控查询用例；基础设施层实现 SQLite、匿名 Cookie
签名和粗粒度分类；HTTP 适配层负责公开请求打点和私有 Dashboard API。应用层通过
`EventWriter` 与 `AnalyticsQueryStore` 端口访问存储，不暴露 SQL 或 `*sql.DB`。

**Rationale**：统计会同时接入下载与路线查询两个既有 bounded context，并包含未来替换
存储的明确要求。将业务口径放在领域/应用层、SQL 优化放在存储适配器，既能保护统计语义，
又能让 SQLite 在 100 万行规模内执行聚合、窗口函数和游标分页。

**Alternatives considered**：直接在现有 handler 内写 SQL；会把隐私规则、业务口径和存储
实现耦合到接口层。把所有明细读入浏览器或 Go 内存再汇总；会扩大私有 API 数据面并难以满足
1 秒目标。

## 决策 2：使用 `database/sql` + `modernc.org/sqlite`，不引入 ORM

**Decision**：实现阶段引入与 Go 1.26.3 兼容的 `modernc.org/sqlite` 稳定版本并锁定到
`go.mod/go.sum`；保持 `CGO_ENABLED=0` 的静态 Linux amd64 构建。SQLite 文件存放在本机
持久目录，启用 `journal_mode=WAL`、`synchronous=NORMAL`、每连接 `busy_timeout`、有限连接池
和默认自动 checkpoint，不创建 checkpoint 后台任务。实现必须通过 `SELECT sqlite_version()`
确认驱动内嵌 SQLite 至少包含 WAL-reset 修复（3.51.3 或官方回移修复版本）。

**Rationale**：[modernc.org/sqlite 官方包文档](https://pkg.go.dev/modernc.org/sqlite)明确其为
CGo-free 的 `database/sql` 驱动，符合仓库现有静态交叉编译门禁。SQLite 官方说明
[WAL 可让读取与写入并发](https://sqlite.org/wal.html)，适合单机、低写入量、按需聚合的场景；
用户已接受统计数据可能丢失，`NORMAL` 同步级别与该耐久性取舍一致。官方同时记录了旧版本
WAL-reset 问题，因此把运行时版本门禁纳入实现验证。

**Alternatives considered**：`mattn/go-sqlite3` 依赖 CGO，与当前静态构建冲突；独立 PostgreSQL
服务超出当前单机、最多 100 万行的规模；ORM 会扩大依赖和迁移抽象，但不能替代查询口径设计。

## 决策 3：只持久化一张事件事实表，不保存访客、会话或聚合事实

**Decision**：SQLite 只保存 `analytics_events` 明细表和必要的 schema migration 技术元数据。
匿名访客摘要由 `visitor_id` 分组计算，派生会话由事件时间顺序与 30 分钟静默边界计算，
Dashboard 指标、上一周期、漏斗、P50/P95 和分布均在查询时生成。不开启自动删除、压缩、
备份、汇总表或物化视图。

**Rationale**：这是用户确认的长期保留与“只保存明细”边界；目标规模允许通过时间、事件类型、
访客和结果索引直接查询。SQLite 自 3.25 起支持
[窗口函数](https://sqlite.org/windowfunctions.html)，可以在适配器内稳定派生会话和分位位置。

**Alternatives considered**：访客表会复制首次/最后访问等可派生事实；会话表和日汇总表会引入
重算、回填和一致性维护；自动清理、备份均违背已确认范围。

## 决策 4：统计写入采用短超时同步尝试，失败立即 fail-open

**Decision**：配置键为 `ANALYTICS_WRITE_TIMEOUT_MS`，未配置时使用 `50ms`，只接受闭区间
`10–200ms` 的整数毫秒值。公开请求完成并由 recovery 归一化后，统计 middleware 为每条允许事件
创建独立 context deadline 并同步尝试一次写入；传入 writer 的 deadline 不得超过已校验值或
`200ms` 上限。成功时更新进程内 `lastSuccessfulWrite`；失败、超时或存储不可用时把原子
`droppedSinceStart` 增加一次，只记录受控错误类别，然后返回原业务结果。不重试、不排队，不因
统计错误修改状态码、JSON、APK bytes 或响应头。

配置为 `9`、`201`、`0`、负数、非整数或其他无法解析值时，analytics 初始化降级为 no-op，
只记录不含原始配置值的 `invalid_write_timeout` 受控原因；public listener 继续启动，private
system 状态可解释该原因类别。`10`、`50`、`200` 均为合法边界值。

**Rationale**：日均不超过 1,000 条，单条本地 SQLite 写入足够；短超时同步写能保持事件顺序、
实现简单且没有内存队列积压。公开 handler 已经完成响应语义，统计失败只能造成可接受的数据
丢失。

**Alternatives considered**：后台队列可进一步隔离写入时延，但需要容量、溢出、停机排空、
panic 恢复和乱序规则，在当前负载下收益不足；阻塞重试会把统计故障放大到公开请求时延。

## 决策 5：匿名访客使用服务器签发的 `__Host-` Cookie

**Decision**：Cookie 名称使用 `__Host-bic-visitor`，值采用
`v1.<128-bit base64url random id>.<issued-at>.<HMAC-SHA256>`。HMAC 使用独立、长期稳定的
`BUS_ANALYTICS_VISITOR_SECRET`；验证使用常量时间比较。Cookie 设置 `HttpOnly`、`Secure`、
`SameSite=Lax`、`Path=/`、一年 `Max-Age/Expires`，不设置 `Domain`。数据库只保存随机 ID，
不保存签名或 Cookie 原文；格式非法、过期或签名无效时签发新 ID。

**Rationale**：浏览器自动通过 Cookie 携带通用匿名标识，不会污染任何业务 path、query 或
body；随机 ID 可以区分同一浏览器，但不宣称识别自然人。`__Host-` 前缀强化 host-only、
Secure 与根路径约束。

**Alternatives considered**：localStorage 需要前端显式添加字段，且不具备 HttpOnly 保护；
IP、指纹或完整 UA 违反隐私边界；把 visitor ID 加到每个请求 DTO 会污染业务契约。

## 决策 6：机器人过滤必须先于 Cookie 与明细记录

**Decision**：HTTP 适配层仅在内存中用本地、可审查的已知机器人 UA signature 集合判断
Google、Bing、社交预览、headless/crawler 等流量；先过滤，再验证/签发访客 Cookie。命中后
仍执行公开业务，但不签 Cookie、不创建事件，也不写 bot 标记或专门机器人明细日志。宪章要求的
通用脱敏 request logger 在 bot 判断前执行，所以仍可为该请求写一条与普通请求相同的日志；日志
只含服务端 request ID、method、route template、operationId、bounded context、status、duration
和 body size，不含 bot 标记、完整 UA、IP、Cookie 或其他身份线索。完整 UA 永不进入领域对象、
SQLite、日志或错误上下文。

**Rationale**：顺序可以保证统计明细和专门机器人明细均为 0，同时保留宪章要求的统一 HTTP
请求可观测性。本地规则便于测试真实浏览器反例和审查变更；机器人识别只用于排除已知流量，
不升级为浏览器指纹。

**Alternatives considered**：第三方 bot 服务会发送额外网络标识并扩大故障面；事后删除机器人
事件违反“不记录”；按 IP 过滤违反用户明确要求。

## 决策 7：只发送粗粒度分析上下文，原始 Referrer 留在浏览器

**Decision**：主页前端在一次 document 生命周期内把 `document.referrer` 归类为
`direct/search/referral/internal/unknown`，只通过可选
`X-BusIsComing-Traffic-Source` header 发送枚举；同时通过
`X-BusIsComing-Home-Locale` 发送 `zh-Hant/zh-Hans/en` 主页上下文。路线试查 fetch 复用同一
粗粒度 source header。服务端严格校验枚举，设备只由瞬时 UA 归类为
`desktop/mobile/tablet/other`，绝不保存原始值。普通直链下载无法添加 header 时，可继承同一
访客当前派生会话最近主页事件的 source；无可用事件时归为 `direct/internal/unknown`。

**Rationale**：metadata fetch 的 HTTP `Referer` 通常只显示当前同源主页，无法还原外部获取
来源；浏览器本地先分类可以提供有意义的来源面板，同时没有把原始 URL 发给服务端。这些是
跨切面 header，不是 APK、地点或路线业务字段，visitor ID 仍仅由 HttpOnly Cookie 携带。

**Alternatives considered**：发送完整 Referrer 会扩大敏感数据面；只看 metadata 请求 Referer
会把来源几乎都错误归为 internal；第二个持久来源 Cookie 会增加不必要的客户端状态。

## 决策 8：四个精确公开路由由统一 middleware 观测，ETA 明确排除

**Decision**：公开 Gin engine 的 middleware 顺序为脱敏请求日志 → 精确 analytics tracking →
自有 recovery → handler。tracking 只映射 metadata、地点查询、路线查询、Android 下载四个
固定 method/path；recovery 归一化 panic 后，tracking 读取最终状态、耗时和 request-scoped
白名单结果。既有 HTTP adapters 只可回填语言、受控失败分类和实际下载版本等允许字段，不能
回填 body、地点、坐标或 token。ETA 路由不挂统计映射。

基础阶段先建立 public/private engine factory：public factory 接收一个 `gin.HandlerFunc` analytics
参数并用无副作用 stub 验证最终顺序，private factory 不包含该注入点。US1 实现真实 tracking 和
带 deadline recorder 后，只把真实 middleware 注入既有 public factory；不重新创建 engine，也不
重复替换 logger 或 recovery。

**Rationale**：放在 application 成功路径会漏掉非法 JSON、限流、token 错误、外部失败和
panic。精确路由 middleware 能记录每次到达请求，又不改变 downloads/routes 领域层。

**Alternatives considered**：在每个 handler 复制计时代码容易口径漂移；全局记录所有 `/api`
会误收 ETA、health 与未来接口；读取和保存原始 body 会违反隐私规则。

## 决策 9：APK 元数据使用独立只读用例与白名单 DTO

**Decision**：新增 `GET /api/downloads/android/latest/metadata` 和独立 metadata use case，
只读取、校验当前 manifest 所需字段，不读取完整 APK bytes 或执行下载 checksum；响应显式映射
`platform/status/versionName/versionCode/fileName/sizeBytes/lastUpdated/downloadUrl`。所有成功和
失败响应使用 `Cache-Control: no-store`。请求带合法主页上下文到达时，无论 metadata 成功或
失败都记录 `page_view`；metadata 失败不修改稳定下载 URL，也不触发重试。

**Rationale**：当前 `CurrentAPK` 还含 `sourcePath`、`relativePath`、SHA256 等内部字段，直接
序列化有泄露风险；现有 `CurrentArtifact` 会读取完整 APK，辅助展示不应与 5 MB 文件读取和
checksum 耦合。部署流程已校验 manifest 与包，下载用例继续负责实际响应完整性。

**Alternatives considered**：复用完整下载 use case 会放大主页请求成本；继续硬编码前端版本和
大小会产生陈旧事实；metadata 失败禁用下载违背已确认降级策略。

## 决策 10：监控 API 由独立 loopback listener 提供

**Decision**：同一个 Go 进程使用两个显式 `http.Server`：公开服务继续监听
`127.0.0.1:8080`，私有服务固定为 `127.0.0.1:18081`，配置若不是 loopback 必须拒绝启动私有
listener。私有 engine 同源提供 Dashboard 静态资源与 `/api/analytics/*`，不启用 CORS，不在
公开 engine 注册任何监控路由。私有启动或数据库失败只标记 degraded；公开 listener 启动失败
才是进程致命错误。所有 serve goroutine 使用统一 recover wrapper，并支持两个 server 的有界
优雅关闭。

**Rationale**：当前 Caddy 会把公网 `/api/*` 全部代理到公开 8080，仅靠私有路径名不能隔离；
独立 router/listener 可从进程注册层保证公网 404，同时允许 SSH 本地转发访问。

**Alternatives considered**：公网路由加密码仍扩大攻击面且用户选择了 SSH；独立第二进程会增加
部署、版本和健康管理；只靠防火墙而在 `0.0.0.0` 监听不满足纵深隔离。

## 决策 11：私有 API 使用统一筛选、上一等长周期和 keyset 游标

**Decision**：七个只读 operation 分别提供总览、流量与试查、下载、事件分页、访客详情、
失败与性能、系统状态。时间范围使用 `[from,to)` RFC 3339，桶按 `Asia/Hong_Kong`，支持
hour/day/week/month 与上一等长周期；有限枚举筛选统一回显在响应 meta。事件按
`occurredAt DESC,eventId DESC` 使用 opaque keyset cursor，默认 50、最大 100。完整 visitor ID
精确检索通过私有 header `X-Analytics-Visitor-ID`，不进入 URL、query 或 body。

**Rationale**：统一 meta 可以让所有受影响卡片/图表清楚显示范围和更新时间；keyset 避免
100 万行深页 offset 退化；visitor header 延续用户对通用标识不污染业务字段的要求，也避免
进入浏览器历史和路径日志。

**Alternatives considered**：offset/page 简单但深页性能不稳定；visitor path/query 会进入 URL；
浏览器自行聚合会让口径和隐私边界不可控。

## 决策 12：监控前端采用独立 Vite 构建与 Recharts

**Decision**：在现有 React 18/TypeScript/Vite 工程中增加独立 `vite.monitor.config.ts` 和
monitor entry，输出 `frontend/dist-monitor/`；公网仍只输出/服务 `frontend/dist/`。监控应用
使用 hash 路由和轻量 fetch hooks，不新增 React Router 或请求状态库。图表采用与 React 18
兼容并由 lockfile 固定的 Recharts 3.x；折线、柱状、环形图使用 Recharts，漏斗、热力图、KPI、
状态和表格使用语义 HTML/CSS。Recharts 官方提供
[响应式容器](https://recharts.github.io/en-US/api/ResponsiveContainer/)和 SVG/React 组合模型，
适合现有技术栈。

**Rationale**：独立产物可以物理避免监控 HTML/JS 进入 Caddy 公网静态根；浏览器只接收后端
聚合后的有限序列，不加载百万明细。Recharts 减少坐标轴、tooltip 和响应式图表的重复实现，
HTML/CSS 仍保留漏斗和表格的可访问语义。

**Alternatives considered**：Vite 多页面同一 `dist` 会让监控资源公开可下载；纯手写 SVG 的
交互和可访问维护成本高；Chart.js Canvas 不如 SVG 便于语义补充；额外路由/查询库对七个低频
私有工作区收益不足。

## 决策 13：主页每个 document 只请求一次 metadata

**Decision**：只在 `/zh-hant/`、`/zh-hans/`、`/en/` 精确主页分支挂载共享
`DownloadMetadataProvider`，使用单一 in-flight promise 保证 React StrictMode 开发行为和多个
下载入口不会重复请求。语言切换只用 `Intl.NumberFormat` 重新格式化 `sizeBytes`，不重新请求。
状态为 `loading/ready/unavailable`；失败后无自动或手动重试，无静态版本/大小回退，稳定下载
按钮始终保留。

**Rationale**：metadata 请求就是主页 PV 触发器，单次 document 请求使“访问一次主页”与
“记录一次 page_view”保持一致；Hero 和 DownloadSection 共享事实可避免显示不一致。

**Alternatives considered**：每个组件独立 fetch 会重复 PV；语言切换重取会夸大访问；缓存旧
manifest 会展示错误版本；失败禁用下载会让辅助信息成为单点故障。

## 决策 14：重做请求日志与 recovery，清理既有地点日志

**Decision**：两个 Gin engine 都替换 `gin.Logger()` 与 `gin.Recovery()`，并显式安装同一套自有
logger/recovery：public 为 logger → analytics → recovery → handler，private 为 logger → recovery
→ handler；两个 engine 都用 handler panic 集成测试证明受控 500 和脱敏日志。自有请求日志只记录
服务端生成 request ID、method、Gin route template、operationId、bounded context、status、
duration 和 body size；404 使用固定 `unmatched`，不记录实际 URI/query。recovery 不 dump
请求、不记录 panic 原值，只记录受控 panic 类型和脱敏 stack/hash 并返回 500。同步删除现有
`QueryLogEvent` 中的起终点名称/坐标输出，不把客户端 requestId 当作可信日志关联 ID。

**Rationale**：Gin 默认日志包含客户端 IP；默认 recovery 可能输出请求信息。仓库当前路线日志
还会输出起终点名称，与新规格的数据库和日志共同禁止项直接冲突。

**Alternatives considered**：给默认 logger 加过滤器仍难以保证 query/IP 不出现；只清理统计
日志而保留路线日志无法满足“应用日志出现次数为 0”的成功标准。

## 决策 15：持久数据、私有 UI 和 secret 独立于 release

**Decision**：部署新增 `/opt/busiscoming/shared/analytics/analytics.sqlite`（含 SQLite 自动产生
的 `-wal/-shm`）和独立 visitor secret；release 同时包含 `frontend/dist` 与
`frontend/dist-monitor`。systemd 增加精确 `ReadWritePaths=/opt/busiscoming/shared/analytics`，
已有 `backend.env` 采用“补缺不覆盖”迁移。Caddy 继续只服务 `dist` 和反代公开 8080，配置中
不得出现 18081、`dist-monitor`、监控路由或 access log。release 清理、切换与回滚均不得触碰
analytics 目录，也不新增备份。

**Rationale**：当前 release 不可变、systemd `ProtectSystem=strict`，SQLite 必须位于共享可写
目录；私有 UI 与数据库都要跨代码 release 切换保留。用户明确只保留一份、允许统计数据丢失。

**Alternatives considered**：把 DB 放进 release 会在切换/清理时丢失或回滚；把 monitor 放入
public `dist` 会暴露页面资源；放宽整个 shared 或系统写权限不符合最小权限。

## 决策 16：验证以隐私 sentinel、确定性 fixture 和 100 万行基准为核心

**Decision**：Go 测试覆盖 Cookie、bot、分类、所有成功/失败打点、fail-open、会话、双漏斗、
上一周期、分位值、游标、DB 不可用、listener/recovery 与 race；使用显眼 sentinel 扫描 SQLite
主文件/WAL 和捕获日志，禁止字段命中必须为 0。Vitest/Playwright 覆盖 metadata 降级、三语、
60 秒刷新、七个工作区、四类状态、1440/390 viewport 和 Figma 视觉回归。部署测试验证两套
前端产物、loopback、Caddy 隔离和 shared DB。100 万行性能 fixture 运行常用查询与访客时间线，
要求服务端结果小于 1 秒并检查 `EXPLAIN QUERY PLAN`。

**Rationale**：该功能最重要的风险是“无意记录禁止数据”和“统计故障影响业务”，仅验证图表
是否渲染不足以证明安全与口径。离线 fixture 可让指标人工复核，容量基准直接对应成功标准。

**Alternatives considered**：只做浏览器冒烟无法覆盖 WAL、日志和敏感字段；只做单元测试无法
证明私有端口、公网隔离、静态产物和 Figma 双端一致性。
