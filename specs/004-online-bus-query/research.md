# 第 0 阶段研究：在线巴士路线查询

## Decision: 采用现有 React/Vite 前端与 Go/Gin 后端

**Rationale**：仓库当前前端已经使用 TypeScript 5.7、React 18 和 Vite 6，在线查询区也已有 `OnlineQueryDemo` 静态组件，重构成本低。后端已有 Go 1.26.3 + Gin 服务和 `downloads` DDD context，新增 `routes` context 可以复用 server 启动、请求日志和 recovery 约束。

**Alternatives considered**：新增 Node 后端或前端直连 Citybus。前者引入第二套后端技术栈，违背现有后端治理；后者会把第三方参数、裸经纬度和解析规则暴露给浏览器，也无法统一缓存、限流和日志。

## Decision: 拆分为地点、路线、ETA 三个 JSON API

**Rationale**：地点检索、路线摘要和实时 ETA 的延迟、失败模式和缓存策略不同。拆分后路线摘要可以先展示，ETA 失败时只影响候车状态，不清空路线结果。该方案也匹配用户确认的 `/api/routes/query_places`、`/api/routes/query_routes`、`/api/routes/query_etas`。

**Alternatives considered**：一个接口同步返回路线和 ETA。它让前端更简单，但任何 ETA 超时都会拖慢路线摘要，不符合“ETA 失败保留路线结果”的降级要求。

## Decision: API 使用 JSON body 和统一 envelope

**Rationale**：用户已确认所有业务参数放在 JSON body，响应也通过 body 中的 JSON 返回。统一 envelope `{ requestId, data, error }` 可以让前端稳定处理成功、业务错误、限流和外部失败，并用同一个 requestId 串联日志。

**Alternatives considered**：把 requestId 放 header 或查询参数。该方式不符合用户关于业务参数位置的要求，也不利于 API 示例统一。

## Decision: 地点和 ETA 使用 HMAC opaque token

**Rationale**：前端不提交裸经纬度；后端通过 `placeToken` 确认路线查询来自已选候选地点，通过 `etaToken` 封装首程 ETA 查询所需上下文。HMAC 签名和过期时间可以防止伪造和篡改，且不需要数据库。

**Alternatives considered**：把坐标、stopId 或 rawInfo 直接传给前端。该方案让前端耦合外部接口细节，也扩大篡改面；持久化 token 到数据库则超出 MVP 范围。

## Decision: `routes` bounded context 按 DDD 分层

**Rationale**：路线查询是独立业务能力，与 APK 下载不同。新增 `backend/internal/routes` 能清晰表达地点候选、路线选项、候车状态、token、错误、缓存和日志事件等领域概念，并保持 domain 不依赖 Gin、文件系统、HTTP 或第三方 SDK。

**Alternatives considered**：把路线 handler 直接加到 `cmd/server` 或复用 `downloads` context。前者会把解析、缓存、错误映射塞进接口层；后者混淆下载和路线查询边界。

## Decision: Citybus 语言参数映射为 `zh-Hant -> 0`、`en -> 1`、`zh-Hans -> 2`

**Rationale**：真实 endpoint 验证显示 `bsearch_p3.php` 和 `ppsearch_p3.php` 遵循该映射。前端语言切换时后端按当前语言重新查询，动态地点和站名只展示当前语言一种。

**Alternatives considered**：返回三语聚合数据。它会增加外部请求量和缓存复杂度，也不符合用户确认的“当前选择语言展示一种语言地点即可”。

## Decision: 用 DATA.GOV.HK stop API 补齐简体站名和 ETA

**Rationale**：`showstops2.php` 可帮助定位 Citybus stop id，但已验证的简体示例可能仍返回繁体；DATA.GOV.HK stop API 提供 `name_sc`，ETA API 提供 `dest_sc`。因此简体站名优先用 DATA.GOV.HK 补齐。

**Alternatives considered**：直接把繁体站名当简体展示。该方案会破坏三语体验。为所有结果预先查询三语站名则过重。

## Decision: 解析外部响应使用结构化解析器和集中适配器

**Rationale**：Citybus mobile endpoint 可能返回 HTML 或嵌入文本结构。后端应在 `infrastructure/citybus` 中集中解析，优先使用 `golang.org/x/net/html` 或明确结构化解析逻辑，并用 fixture 测试覆盖格式变化。复杂解析规则必须用中文注释解释。

**Alternatives considered**：在 handler 中用临时字符串拆分。该方案难测试、难观测，也容易被页面格式变化破坏。

## Decision: 缓存和限流使用进程内实现

**Rationale**：本功能是网站基础试用，不需要持久化查询历史。地点检索 5 分钟、路线摘要 1 分钟、站点映射 1 天、ETA 单请求内去重即可降低外部依赖压力；轻量内存限流能保护服务端和第三方接口。

**Alternatives considered**：引入 Redis 或数据库。当前范围没有跨实例一致性要求，引入外部存储会放大实施成本。

## Decision: 前端以查询状态机处理旧响应和失败保留

**Rationale**：用户快速输入、查询或切换语言时，旧响应不能覆盖新查询。前端使用 requestId 和本地 query version 判断响应是否仍属于当前选择。语言切换重查失败保留旧结果；起终点变更后的失败不展示旧结果。

**Alternatives considered**：只依赖浏览器 AbortController。Abort 可以减少请求，但不能完全覆盖已返回响应、ETA 分批合并和语言切换失败保留规则。

## Decision: 结构化 stdout 日志，部署层保留 7 天

**Rationale**：用户确认查询起终点名称和经纬度可记录，不与“不收集个人资料”冲突；同时明确不做配置，固定保留 7 天。应用层输出结构化 stdout 日志，部署层负责保留期，避免应用内文件轮转复杂度。

**Alternatives considered**：完全不记录坐标或实现应用内日志轮转。前者降低观测能力；后者超出当前部署约束并增加配置面。

## Decision: Figma 节点已导入并沉淀

**Rationale**：Figma 写入工具当时无法写入目标文件，但仓库宪法要求前端 plan 前必须有 Figma 节点。用户选择一次性本地导入方案后，已生成 `Online Query v2` 页面和桌面/移动节点，满足可追溯视觉门禁。节点沉淀后，仓库只保留 Figma 文件、页面和节点索引。

**Alternatives considered**：只生成 PNG/SVG 或文字说明。PNG/SVG 编辑性弱，文字说明不能满足 Figma 驱动规格要求。
