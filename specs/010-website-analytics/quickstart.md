# 快速验证：网站匿名访问统计与监控面板

本文用于实现完成后的可复现验收，不包含完整实现代码。接口字段以
[公开下载契约](./contracts/download-api.openapi.yaml)、
[路线查询契约](./contracts/route-query-api.openapi.yaml)、
[私有监控契约](./contracts/analytics-monitoring-api.openapi.yaml) 和
[数据模型](./data-model.md) 为准。

## 1. 前置条件

- Go 1.26.3 可用。
- Node.js/npm 可安装 `frontend/package-lock.json` 中锁定依赖。
- 本机端口 `8080`、`18081` 可用。
- 如执行浏览器 Cookie 连续性测试，使用测试 TLS；不得为本地 HTTP 方便而降低生产
  `Secure`/`__Host-` Cookie 属性。
- 默认自动化使用临时 SQLite 与受控 fixture，不依赖生产服务器、Citybus live 或真实访客数据。

安装前端依赖：

```bash
npm --prefix frontend ci
```

## 2. OpenAPI 3.1 契约验证

先验证 feature 契约：

```bash
cd frontend
./node_modules/.bin/redocly lint \
  ../specs/010-website-analytics/contracts/download-api.openapi.yaml \
  ../specs/010-website-analytics/contracts/route-query-api.openapi.yaml \
  ../specs/010-website-analytics/contracts/analytics-monitoring-api.openapi.yaml
```

实现阶段同步到 `shared/contracts/openapi/` 后执行：

```bash
npm --prefix frontend run openapi:lint
npm --prefix frontend run openapi:bundle
npm --prefix frontend run openapi:routes:lint
npm --prefix frontend run openapi:routes:bundle
npm --prefix frontend run openapi:analytics:lint
npm --prefix frontend run openapi:analytics:bundle
npm --prefix frontend run openapi:docs
```

预期结果：

- 三份 feature OpenAPI 无 error/warning，并可 bundle。
- `shared/contracts/openapi/download-api.openapi.yaml` 包含 metadata 与现有下载 operation。
- `shared/contracts/openapi/analytics-monitoring-api.openapi.yaml` 只声明
  `http://127.0.0.1:18081` 和七个只读 operation。
- 既有 route OpenAPI 的业务 body 不变，只增加允许的 source header、匿名 Cookie 响应说明和
  打点扩展。
- 生成 API UI 的标题、分组、参数、响应、错误和示例说明均为中文；私有 API UI 只用于本地
  预览，不进入 Caddy 公网静态目录。

## 3. 后端单元、集成与 race 测试

```bash
cd backend
go test ./...
go test -race ./internal/analytics/... ./internal/platform/httpserver/... ./cmd/server
```

预期覆盖：

- visitor Cookie 首签、复用、篡改、过期、随机性、常量时间验证及全部属性。
- Google/Bing/social preview/headless/crawler 等已知机器人得到 0 个 Cookie、0 条事件、0 条
  bot 标记或专门机器人明细日志；真实 desktop/mobile/tablet UA 反例不会误杀。机器人仍产生
  一条与普通请求相同的通用脱敏请求日志，且其中没有 bot 标记、UA、IP、Cookie 或身份线索。
- metadata 成功与失败都可记录 `page_view`；缺少合法主页上下文、隐私页或直接 API 调用不记 PV。
- 地点和路线的非法 JSON、限流、token 错误、外部失败、panic 和成功各记录一次正确事件；ETA
  始终为 0 条。
- 下载成功使用本次实际响应版本/大小；失败版本为空；指标不声称安装完成。
- SQLite 不可写、锁冲突、查询超时或迁移失败时，公开业务 status、headers、JSON/APK bytes
  与统计正常时保持同一语义；`droppedSinceStart` 正确增加。
- 30 分钟（正好 30 分钟仍同会话）边界、两个有序漏斗、上一等长周期、P50/P95、无数据/
  无筛选结果和 opaque cursor 均与人工 fixture 结果一致。
- 同毫秒多事件的 keyset 分页无重复、无遗漏；完整 visitor ID 只从私有 header 精确匹配。
- 基础 public engine factory 用无副作用 `gin.HandlerFunc` stub 验证 logger → injected analytics →
  recovery → handler；private factory 验证 logger → recovery → handler。US1 只注入真实 tracking，
  不重建 engine 或重复替换 logger/recovery；真实 handler panic 形成受控 500 和 failure 事件。
- `ANALYTICS_WRITE_TIMEOUT_MS` 未配置时为 50ms；10、50、200 均合法；9、201、0、负数和非整数
  均使 analytics 以 `invalid_write_timeout` 受控原因降级为 no-op，public server 仍存活。
- 阻塞 writer 获得的独立 context deadline 不超过已校验值或 200ms；只调用一次，只增加一次
  `droppedSinceStart`，公开 status、headers、JSON/APK bytes 与 no-op analytics 基线一致。
- analytics domain 不依赖 Gin、SQL、文件系统或前端类型；存储适配器通过应用端口接入。

定向执行 deadline 与 engine 装配测试：

```bash
go -C backend test ./cmd/server -run 'TestAnalyticsWriteTimeoutConfig|TestEngineMiddlewareOrder' -count=1
go -C backend test ./internal/analytics/application -run 'TestRecordEventDeadline|TestRecordEventDropsOnce' -count=1
go -C backend test ./internal/analytics/interfaces/http -run 'TestAnalyticsFailOpen' -count=1
```

## 4. 隐私 sentinel 验证

测试向 HTTP 请求的 IP、UA、Referrer、Cookie、query、地点、坐标、token、body 和模拟上游响应
分别放入唯一 sentinel，再检查捕获日志、SQLite 主文件、WAL/SHM 和私有 API 响应。

预期结果：

- 每个受禁 sentinel 在日志、数据库和监控响应中的出现次数均为 0。
- 事件表只出现 `data-model.md` 定义的字段；Cookie 签名和 secret 均不存在。
- 自有 request logger 只记录服务端 request ID、method、route template、operationId、bounded
  context、status、duration 和 body size；不调用或输出 ClientIP，不记录实际 URI/query。
- 机器人通用请求日志与普通请求使用相同 schema，不包含 bot 标记；bot 判断后没有追加事件或
  专门日志。
- recovery 不 dump request，不输出 panic 原值、Cookie、私有路径或 stack 中的受禁上下文。
- 既有路线日志不再输出起终点名称、坐标、用户 query 或客户端 requestId。

### 4.1 US1 实施验收记录（2026-07-22）

实现阶段使用以下命令复核 synthetic 路由、Cookie、机器人、fail-open、SQLite 锁冲突、隐私
sentinel 和前端有限来源 header；这些测试不访问 Citybus live，也不写入生产统计库：

```bash
go -C backend test ./internal/analytics/infrastructure/signing \
  ./internal/analytics/infrastructure/classification \
  ./internal/analytics/interfaces/http \
  ./internal/platform/httpserver ./cmd/server -count=1
go -C backend test -race ./internal/analytics/... ./internal/platform/httpserver/... ./cmd/server
npm --prefix frontend test -- --run
```

验收期望与实现结果：

- `ANALYTICS_WRITE_TIMEOUT_MS` 的 unset/10/50/200 均启用；9/201/0/负数/小数/文本均以
  `invalid_write_timeout` no-op 降级，公开 engine 仍可响应。
- metadata 成功/失败、地点与路线的成功及受控失败、下载成功/失败各形成一条事件；ETA 为 0 条。
- Google/Bing/social preview/headless/CLI 已知机器人不签发 Cookie、不写事件，也不增加 bot
  专门日志；通用请求日志仍使用与普通请求相同的脱敏 schema。
- 关闭 SQLite、持有写锁和阻塞 writer 时只尝试一次；`droppedSinceStart` 只增加一次，业务
  status、JSON/body 和业务 header 与 no-op 基线一致；写锁等待受 200ms 硬上限约束。
- 注入 IP、UA、Referrer、Cookie、URI/query/body、地点、坐标、token、客户端 requestId 和
  panic sentinel 后，捕获日志、事件对象、SQLite 主文件、WAL/SHM 与公开响应均为零命中。
- 浏览器只产生 `direct/search/referral/internal/unknown`，路线请求不发送主页 locale 或原始
  Referrer；三语隐私正文和 noscript fallback 与长期保留、无备份、无退出控制事实一致。

## 5. SQLite、迁移和 100 万行性能门禁

先验证 CGo-free 构建与 SQLite runtime：

```bash
cd backend
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -o /tmp/busiscoming-analytics-server ./cmd/server
file /tmp/busiscoming-analytics-server
go test ./internal/analytics/infrastructure/sqlite -run 'TestSQLiteVersion|TestMigrations|TestWALConfiguration'
```

预期结果：

- 二进制为静态 Linux amd64；不需要系统 SQLite 或 CGO。
- `sqlite_version()` 为 3.51.3 或官方已回移 WAL-reset 修复的版本。
- 每个连接应用 WAL、`synchronous=NORMAL` 与 `busy_timeout`；保持默认自动 checkpoint。
- migration 可重复执行，索引与 [data-model.md](./data-model.md) 一致，旧 release 可读取 additive
  schema。

执行显式性能 fixture（不作为每次快速单元测试默认路径）：

```bash
cd backend
RUN_ANALYTICS_PERF=1 go test ./internal/analytics/infrastructure/sqlite -run TestAnalyticsMillionRows -count=1
```

预期结果：

- fixture 含 1,000,000 条四类、多访客、多结果、多维度事件。
- 近 30 天总览、流量、下载、失败性能和单 visitor 时间线的服务端结果均在 1 秒内返回。
- `EXPLAIN QUERY PLAN` 命中时间、事件、visitor、outcome 或 partial download/failure 索引；无证据
  不增加语言/设备/来源组合索引。
- 没有汇总表、自动删除、备份或清理任务。

## 6. 本地双 listener 冒烟

先构建两套前端：

```bash
npm --prefix frontend run build
```

使用临时统计目录启动同一个 Go 进程：

```bash
ANALYTICS_TEST_DIR="$(mktemp -d)"
export BUS_HTTP_HOST=127.0.0.1
export PORT=8080
export BUS_ANALYTICS_DB_PATH="${ANALYTICS_TEST_DIR}/analytics.sqlite"
export BUS_ANALYTICS_UI_ROOT="$(pwd)/frontend/dist-monitor"
export BUS_ANALYTICS_PRIVATE_PORT=18081
export BUS_ANALYTICS_VISITOR_SECRET="$(openssl rand -hex 32)"
export ANALYTICS_WRITE_TIMEOUT_MS=50
go -C backend run ./cmd/server
```

在另一终端请求公开 metadata：

```bash
curl -i http://127.0.0.1:8080/api/downloads/android/latest/metadata \
  -H 'X-BusIsComing-Home-Locale: zh-Hant' \
  -H 'X-BusIsComing-Traffic-Source: direct'
```

预期结果：

- 返回 200 白名单 JSON 和 `Cache-Control: no-store`；不含 sourcePath、relativePath、SHA256 或
  磁盘路径。
- 普通请求出现 `__Host-bic-visitor`，属性完整；visitor ID 不在 JSON、URL 或 request body。
- 将 manifest 读取故障注入 metadata use case 后，版本接口失败但
  `/api/downloads/android/latest` 仍按自身事实可下载。

请求私有状态：

```bash
curl -sS http://127.0.0.1:18081/api/analytics/system
curl -sS 'http://127.0.0.1:18081/api/analytics/overview?from=2026-06-21T00%3A00%3A00%2B08%3A00&to=2026-07-21T00%3A00%3A00%2B08%3A00&granularity=day&compare=true'
```

预期结果：

- 私有 listener 同时提供 Dashboard 和七个 API；响应均 `no-store`。
- 删除/锁定测试 DB 后，`system` 仍返回 200 且 `database.state=unavailable`，其他聚合返回结构化
  503；公开 8080 继续正常。
- 占用 18081 或注入私有 server panic 时，公开 server 不退出；日志只有脱敏错误类别。

## 7. 前端单元与构建验证

```bash
npm --prefix frontend run test
npm --prefix frontend run build
```

预期覆盖：

- 只有 `/zh-hant/`、`/zh-hans/`、`/en/` 精确主页在单次 document 生命周期请求一次 metadata；
  隐私页和未知路径不请求。
- React StrictMode、Hero 与 DownloadSection 共享单一 in-flight 请求，不重复 PV。
- metadata 成功后 `sizeBytes` 按当前 locale 格式化；语言切换不重新请求。
- metadata 失败后版本/大小显示三语“暂时不可用”，没有自动/手动重试或旧静态值，下载按钮仍
  指向稳定 URL。
- Dashboard 七个工作区、筛选序列化、上一周期、keyset 分页、visitor header、错误映射和
  四类页面状态的 Vitest 通过。
- 总览、详细调查和 APK metadata 各自的组件/E2E 测试同时覆盖桌面与 390px 手机；最终全量
  responsive suite 只做跨工作区回归，不承担首次移动布局实现。
- 总览每次成功加载 60 秒后刷新且不重叠；详细页 fake timer 前后不自动请求。
- `zh-Hant`、`zh-Hans`、`en` 文案 key 完整；繁中按香港产品语境、英文自然克制，隐私事实在
  三语中一致。
- `frontend/dist/` 与 `frontend/dist-monitor/` 均生成；monitor HTML/JS 不出现在 public dist。

## 8. Dashboard 双端、交互与视觉验证

```bash
npm --prefix frontend run test:e2e
npm --prefix frontend run test:e2e:monitor
```

使用固定 mock 数据核对：

- 1440×1200：七个桌面工作区、240px 侧栏、KPI、折线/柱状/环形图、两个漏斗、热力图、表格、
  筛选和更新时间。
- 390×844：移动导航、纵向卡片、两列 KPI、紧凑图表、事件/性能卡片和分页可达；另生成
  390×1640 full-page 视觉证据。
- `zh-Hant`、`zh-Hans`、`en` 三语下导航、筛选、图例、tooltip、表格、加载、无数据、筛选无
  结果、普通失败和 DB unavailable 均完整。
- 图表有文字摘要/数据列表，颜色不是唯一信息，焦点可见、触摸目标不小于 44px；
  `prefers-reduced-motion` 下关闭非必要动画。
- visitor 列表只显示截断 ID；精确检索详情才显示并复制完整值，复制结果通过 `aria-live` 反馈。

视觉基准：

- [Figma 权威文件与两批导入锚点 63:2118、67:672](./figma.md)
- `docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/manifest.json`
- `docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/tokens.json`
- `docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/screenshots/mobile-investigation.png`（390×1640）
- `docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/screenshots/mobile-apk.png`（390×1200）
- `docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/screenshots/query-failure.png`（1440×1000）

不得把原型中的 PV、UV、版本、大小或错误数写入生产代码，也不得虚构 Figma 子节点。

### US2 总览实现验证记录（2026-07-22）

- Go 领域、应用、SQLite 与私有 HTTP 契约测试全部通过；覆盖 30 分钟会话边界、顺序漏斗、
  香港时区缺失桶、上一等长周期、nearest-rank P50/P95、筛选作用域及 400/500/503 安全映射。
- 监控 client 与总览组件 9 项测试通过；五类页面状态可独立注入，自动刷新只在成功请求完成
  60 秒后安排，未完成请求不会重叠。
- `npm run build:monitor` 通过，监控入口只生成到 `frontend/dist-monitor/`。
- 固定 mock 数据的 Playwright 桌面/手机测试通过；证据分别为
  `frontend/playwright-monitor/__screenshots__/overview-desktop.png`（1440×1200）和
  `frontend/playwright-monitor/__screenshots__/overview-mobile.png`（390×844）。两张图均已人工
  查看，并与 Figma 节点 `63:2118` 的侧栏、KPI、趋势、漏斗、分布、响应时间和移动布局核对。

## 9. 隐私政策与三语事实验证

检查公开隐私政策和 noscript/SEO 生成内容，确认三语都明确说明：

- 使用一年有效的第一方匿名浏览器标识，UV 只代表同一浏览器。
- 匿名统计始终启用，不提供 DNT/GPC 退出控制。
- 明细长期保留，不提供自动删除或备份。
- 不记录 IP、完整 Cookie、完整 UA/Referrer、查询词、地点、坐标、token 或第三方原始响应。
- 统计用于主页访问、地点/路线试查和下载请求，不用于广告追踪或识别自然人。

同时修正现有“短期服务日志”与笼统“不收集个人资料”表述，避免与长期匿名明细冲突。

## 10. 部署与公网隔离验证

```bash
bash scripts/tests/deploy_test.sh
```

部署测试预期：

- release manifest 分别覆盖 `frontend/dist/**`、`frontend/dist-monitor/**` 和后端二进制；任一私有
  bundle 缺失或 checksum 不符都在发布前失败。
- `/opt/busiscoming/shared/analytics` 属主为运行用户、模式 0750；systemd 只增加该目录的
  `ReadWritePaths`，已有 env 补齐 DB path、private port、UI root 和独立 secret 而不覆盖旧值。
- `analytics.sqlite/-wal/-shm` 不进入 release，不被 switch、rollback 或 release cleanup 触碰。
- Caddyfile 不含 `18081`、`dist-monitor`、monitor route 或 `log`；公网 `/api/analytics/*` 和监控
  HTML 成功访问次数为 0。
- `ss` 或等价检查证明 18081 只绑定 `127.0.0.1`，UFW/安全组不开放该端口。
- 私有监控失败只作为 degraded warning，不改变公开 `/healthz`、主页、试查或下载发布门禁。

真实服务器通过 SSH 隧道访问：

```bash
ssh -N -L 18081:127.0.0.1:18081 <user>@<server>
```

然后打开 `http://127.0.0.1:18081/`。如本机 18081 已占用，可把本地端改为 18082，远端仍保持
`127.0.0.1:18081`。不得为方便访问新增 Caddy 路由或开放公网端口。

## 11. 提交前检查

```bash
git diff --check
git status --short
```

预期只出现当前 feature 的实现、测试、OpenAPI/生成契约、部署文档和必要共享契约更新；不包含
真实统计数据库、WAL/SHM、secret、用户 Cookie、浏览器导出数据或无关工作区改动。
