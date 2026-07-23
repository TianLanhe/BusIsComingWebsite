# 实施计划：监控 Dashboard 数据解释与技术监控增强

**分支**：`feat/012-analytics-dashboard-observability` | **日期**：2026-07-24 | **规格**：[spec.md](./spec.md)

**输入**：来自 `/specs/012-analytics-dashboard-observability/spec.md` 的功能规格

## 摘要

本功能修复监控 Dashboard 两个可信度问题：Recharts 鼠标 Tooltip 与自定义键盘 Tooltip 同时
显示，以及右上角“自定日期”不执行任何动作。前端在现有日期模型上增加开始/结束两步草稿状态，
用最近输入方式互斥两类 Tooltip，并让右上角、高级筛选和已应用范围共用一个权威状态。

业务和技术监控继续通过七个既有私有端点从单份 SQLite 明细即时统计：事件页增加完整范围四卡
同期指标，流量页增加主页/地点/路线六项 PV/UV，稳定性页提供局部 P50/P95 选择、四类事件 SLI
和端点 P50/P95 同期比较，系统页增加香港今日数量及非敏感 SQLite/进程信息，访客页按 Figma
恢复四卡和语言/平台/装置偏好。导航重组为业务监控、技术监控、数据明细三组。匿名字段、事件
类型、表、端点、公开响应、部署拓扑、长期明细、无备份和公开 fail-open 均不改变。

## 技术背景

**前端语言/版本**：TypeScript `^5.7.2`（lockfile 当前 5.9.3）、React 18.3.1、浏览器 ES
modules、Vite `^6.0.5`（lockfile 当前 6.4.3）

**后端语言/版本**：Go module 1.26.3；服务端 SQLite 使用 modernc driver 内嵌运行库，不以本机
`sqlite3` CLI 版本作为运行事实

**主要依赖**：现有 React、React DOM、Lucide React、Recharts 3.10.0、Gin 1.12.0、
`database/sql`、modernc SQLite 1.54.0；不新增日期库、图表库、状态库、路由库、ORM、缓存或
独立数据库服务

**数据与存储**：继续使用单份 SQLite `analytics_events` 明细和 `schema_migrations`；WAL、
`synchronous=NORMAL`、`busy_timeout=200ms` 与最多 4 个连接保持。默认不新增 migration，不
增加汇总表、缓存表、队列、清理或备份

**测试**：Go `testing`/race、SQLite integration 与显式 100 万行性能测试、Vitest 2、
Testing Library、Playwright monitor 双 viewport、Redocly CLI 2、OpenAPI/隐私/隔离/部署契约
测试，以及截图尺寸检查与人工 Figma 逐区块对照

**目标平台**：现代桌面和手机浏览器；Linux amd64 单机 Go 服务；开发期两个 Vite server；
生产期一个 Go 进程同时监听 public `127.0.0.1:8080` 和 private loopback（默认
`127.0.0.1:18081`），并由 private engine 提供 `frontend/dist-monitor`

**项目类型**：前后端分离 Web 应用

**性能目标**：日增不超过 1,000、长期不超过 1,000,000 明细时，常用私有监控查询 95% 在 1
秒内完成；合法自定义结束日期选定后 1 秒内完成范围同步；P50/P95 本地切换 1 秒内更新；图表
任意时刻最多一个 Tooltip；监控变更对公开主页、试查和下载新增失败为 0

**约束**：不记录或返回 IP、完整 Cookie/UA/Referrer、查询词、地点、坐标、请求 URL/body、
设备指纹、数据库路径、密钥或内部错误；不新增 endpoint、event type、表、goroutine、外部
服务、缓存、队列、后台聚合、备份、清理、导出、删除或编辑；不以 0、旧缓存或 Figma 示例掩盖
缺失；监控 bundle 当前已超过 Vite 默认 500kB 提示线，本功能不得再引入大型依赖

**规模/范围**：1 个两步日期控件、1 个单一 Tooltip 通用模型、3 组/7 页导航、事件 4 卡、流量
6 卡、2 张稳定性折线图、4 个端点的两种分位比较、12 项系统信息、1 个访客调查工作区、4 个
私有响应 schema 增量、3 种语言、1440/390 双端；七个 operation 和一张事实表数量不变

**i18n 范围**：业务/技术/数据三组导航、页面新名称、两步日期、比较七状态、P50/P95、SLI、
系统字段、六张流量卡、访客偏好和无数据文案全部覆盖 `zh-Hant`、`zh-Hans`、`en`。
`zh-Hant` 按香港监控产品常用书面语独立审校，`en` 使用自然克制的产品表达，禁止从简中机械
直译。切换语言时保持页面、日期步骤、已应用范围、筛选、分位选择和 Visitor 调查对象。

**前后端契约**：

- [analytics-monitoring-api.openapi.yaml](./contracts/analytics-monitoring-api.openapi.yaml)：
  七个既有私有 endpoint 的完整 OpenAPI 3.1 权威源；新增 event `summaryMetrics`、traffic 总
  UV、performance `sliSeries`/分位比较和 system 非敏感运行快照。
- [dashboard-ui.contract.md](./contracts/dashboard-ui.contract.md)：OpenAPI 无法表达的两步日期、
  Tooltip 互斥、比较好坏语义、页面信息架构、三语、响应式和隐私行为。
- 成功/错误继续使用 `{requestId,data,error}` envelope、`Cache-Control:no-store` 和既有错误码。
- Visitor ID 继续只用 `X-Analytics-Visitor-ID` header，不进入 path/query/body 或日志。
- 012 响应为 additive 增量，但 schema 使用 `additionalProperties:false`；feature 契约、后端和
  `dist-monitor` 作为同一发布物原子升级/整体回滚，不增加 URL 版本或旧新双写。

**OpenAPI 接口文档**：feature 权威源为
`specs/012-analytics-dashboard-observability/contracts/analytics-monitoring-api.openapi.yaml`；
实现阶段同步覆盖 `shared/contracts/openapi/analytics-monitoring-api.openapi.yaml`，更新
`frontend/package.json` 与 `analyticsContract.test.ts` 的 feature 指针到 012，运行 Redocly
lint/bundle，并生成 `shared/contracts/openapi/docs/analytics-monitoring-api.html`。API UI 的
标题、标签、摘要、参数、响应、错误和示例使用简体中文；HTML 仅用于私有预览，不进入公网产物。

**服务端 DDD 边界**：

- `domain`：香港日期边界、上一等长周期、Metric 空值/零基线、事件类型、分位、SLI 空桶和稳定
  并列规则；不依赖 Gin、SQL、文件系统或前端 DTO。
- `application`：编排当前/上期事件摘要、流量六指标、端点分位比较、SLI、香港今日和 system
  组合读模型；定义 storage/runtime/listener ports。
- `infrastructure/sqlite`：复用 query builder 完成完整范围摘要、今日数量、SQLite version、
  journal mode、schema version 和文件大小；每个 system 探测字段允许局部缺失，不暴露路径。
- `interfaces/http`：保持七条 route/operationId，只解析现有 query/header、映射 DTO/envelope/
  错误；events 恢复 compare 参数，不在 handler 计算统计。
- `cmd/server`：把实际 private loopback address 注入 listener 读模型；不再在应用层硬编码端口。
- 依赖方向保持 interfaces/infrastructure → application → domain；前端只消费 OpenAPI DTO。

**服务端稳健性与可观测性**：本功能不新增 goroutine、后台任务或并发回调。所有统计和 system
探测通过 context/error/nullable field 表达，不以 panic 控制业务；public/private engine 继续
使用 request logger、analytics middleware 和 recovery。日志只允许 request ID、route template、
operationId、status、duration、bounded context 和受控错误类型，不记录 Visitor ID header、
IP、query/body、数据库路径、密钥或原始错误。私有查询与单个 system 字段失败不得改变公开业务
响应。

**代码注释与可读性**：用中文注释解释日期草稿/已应用状态、`showPicker` 用户激活限制、Tooltip
最近输入互斥、比较零基线/缺失、失败与时延反向好坏、SLI null/0、events 摘要与分页共用筛选、
香港今日边界、SQLite 字段级降级、listener 实际地址和 visitor 并列规则；简单 JSX、字段转发和
自解释 CSS 不加噪音注释。

**UI 可视化产物**：

- `docs/superpowers/prototypes/2026-07-24-analytics-dashboard-v13-figma-import/`：5 张 HTML 画板、
  manifest、tokens、README 和已检查截图。
- `specs/012-analytics-dashboard-observability/visuals/dashboard-v13-remediation.svg`
- `specs/012-analytics-dashboard-observability/visuals/custom-date-flow.svg`
- 完整交互设计：
  `docs/superpowers/specs/2026-07-24-analytics-dashboard-observability-design.md`

**Figma 设计引用**：[权威文件](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec)；
v1.1 节点 `63:2118`/`67:672`、v1.2 节点 `80:151`、用户已导入的 v1.3 真实锚点
[89:1310](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=89-1310)。
版本、逻辑画板、交互状态和 viewport 见 [figma.md](./figma.md)。

**双端适配范围**：桌面 1440×1200 验证六列指标、稳定性双图、端点比较表和三组侧栏；手机
390×844 验证两步日期、两列/单列卡、单列图表、端点语义卡/局部滚动、七页导航和至少 44px
操作，并用 390px 长页面截图核对完整内容。页面不得整体横向滚动；现有热力图绘图区可局部滚动。

**用户故事交付顺序**：先完成契约、纯模型、三语 key 和测试 fixture；US1 修复日期/Tooltip
可信度；US2 完成稳定性、SLI、端点比较和 system Dropped 局部读取；US3 完成事件同期和流量
六卡；US4 扩展 system 技术快照；US5 重排访客与新导航。US1+US2 为调查主路径 MVP，后续故事
可在 foundational 完成后独立验收。

## 宪法检查

*门禁：第 0 阶段研究前已通过；第 1 阶段设计后的复查见文末。*

| 门禁 | 结果 | 证据或后续动作 |
|------|------|----------------|
| 产品定位与范围边界：覆盖软件介绍、试用查询、下载 App，反馈和联系为次要功能 | 通过 | 只增强主页、香港巴士试查和 APK 下载的私有匿名监控，不改变公开产品能力。 |
| 范围排除：不提供完整出行路线规划，也不提供地铁等其他交通工具查询 | 通过 | spec FR-055/056 和两份契约均不增加公开查询或交通能力。 |
| 前后端分离与契约优先：边界、契约和错误格式已记录 | 通过 | OpenAPI 约束 HTTP，UI contract 约束浏览器；应用 ports 隔离 SQLite，统一 envelope/错误码保留。 |
| OpenAPI 驱动的服务端接口文档：服务端 HTTP API 已有 OpenAPI 3.1 YAML、中文 API UI、共享沉淀路径和验证方式 | 通过 | 012 完整 YAML 已建立；shared、bundle、中文 docs 和 Redocly 命令已定义。 |
| 三语国际化：用户可见文字覆盖三语且独立审校 | 通过 | 新 key 范围、香港繁中/自然英文审校、状态保持和 key 完整性测试已定义。 |
| 试用查询与可靠降级 | 通过 | 不改变外部巴士服务；监控失败继续 fail-open，system 单字段和 Dropped 辅助查询局部降级。 |
| 现代界面与可视化评审 | 通过 | 5 张 v1.3 HTML/截图、两张 SVG、完整设计说明和真实 Figma `89:1310` 可追溯。 |
| 电脑与手机双端一致可用 | 通过 | 1440×1200、390×844/长页、44px、无整体横向滚动和七页导航已约束。 |
| Figma 驱动的前端规格 | 通过 | `figma.md` 已回填真实 v1.3 节点 `89:1310`，含画板、状态和 viewport。 |
| 服务端 DDD 架构 | 通过 | analytics domain/application/infrastructure/interfaces/cmd 职责和依赖方向已明确。 |
| 服务端稳健性与可观测性 | 通过 | 无新 goroutine；保留双 engine recovery/logger、受控 error、nullable 局部降级和脱敏日志。 |
| 中文注释与代码可读性 | 通过 | 日期、Tooltip、比较、SLI、SQL/system 降级、listener 和并列规则列为中文注释点。 |
| 可验证交付与自动提交 | 通过 | quickstart 覆盖契约、Go/Vitest/Playwright、性能、隐私、Figma、部署隔离；本 skill 后独立提交。 |
| Spec Kit 产物语言 | 通过 | spec/plan/research/data-model/quickstart/contracts 人读内容均为简体中文。 |

## 项目结构

### 文档（本功能）

```text
specs/012-analytics-dashboard-observability/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── figma.md
├── checklists/
│   └── requirements.md
├── contracts/
│   ├── analytics-monitoring-api.openapi.yaml
│   └── dashboard-ui.contract.md
├── visuals/
│   ├── custom-date-flow.svg
│   └── dashboard-v13-remediation.svg
└── tasks.md                         # /speckit-tasks 生成
```

### 源码（仓库根目录）

```text
frontend/
├── package.json                     # feature OpenAPI 指针更新到 012
├── src/monitoring/
│   ├── app/
│   │   └── FilterProvider.tsx       # 唯一已应用范围和全局查询状态
│   ├── model/
│   │   ├── dateRange.ts             # 既有香港日期纯模型
│   │   ├── dateRangeFlow.ts         # 新增两步草稿状态机
│   │   └── comparisonState.ts       # 七种比较状态与好坏策略
│   ├── components/
│   │   ├── charts/
│   │   │   ├── MetricCard.tsx
│   │   │   └── TimeSeriesChart.tsx  # pointer/keyboard 单一 Tooltip
│   │   ├── filters/
│   │   │   ├── DateRangeControl.tsx
│   │   │   └── GlobalFilters.tsx
│   │   └── layout/DashboardShell.tsx
│   ├── pages/
│   │   ├── EventsPage.tsx
│   │   ├── TrafficPage.tsx
│   │   ├── PerformancePage.tsx
│   │   ├── SystemPage.tsx
│   │   └── VisitorPage.tsx
│   ├── services/
│   │   ├── analyticsTypes.ts
│   │   ├── analyticsDetailsClient.ts
│   │   └── analyticsContract.test.ts
│   ├── content/
│   │   ├── copy.ts
│   │   └── types.ts
│   └── styles/
│       ├── dashboard.css
│       ├── responsive.css
│       └── mobile-components.css
└── playwright-monitor/
    ├── time-range.spec.ts
    ├── charts.spec.ts
    ├── investigation.spec.ts
    └── responsive-locales.spec.ts

backend/
├── cmd/server/
│   ├── main.go                      # 注入实际 private bind address
│   └── *_test.go
└── internal/analytics/
    ├── domain/
    │   ├── aggregation.go           # SLI/分位/稳定并列领域规则
    │   └── results.go
    ├── application/
    │   ├── dto.go                   # 新读模型字段
    │   ├── ports.go                 # 摘要/system 探测端口
    │   └── query_details.go         # 当前/上期、SLI、system 编排
    ├── infrastructure/sqlite/
    │   ├── query_builder.go         # 摘要复用相同 filter
    │   ├── query_events_visitor.go
    │   ├── query_performance_system.go
    │   └── performance_test.go
    └── interfaces/http/
        ├── detail_handlers.go
        ├── query_parser.go           # events 允许 compare
        └── private_handlers_test.go

shared/contracts/openapi/
├── analytics-monitoring-api.openapi.yaml
├── analytics-monitoring-api.bundle.yaml
└── docs/analytics-monitoring-api.html

docs/superpowers/prototypes/
└── 2026-07-24-analytics-dashboard-v13-figma-import/
```

**结构决策**：继续复用单前端依赖仓/双 Vite 产物和单 Go 进程/双 Gin engine，不改变部署拓扑。
`dateRangeFlow` 只管理未提交草稿，FilterProvider 仍是已应用全局状态；通用图表不知道 endpoint。
analytics 应用层编排统计和空值语义，SQLite 只实现 ports，HTTP 保持薄适配。system 动态字段
来自 API，固定隐私/保留事实不伪装为探测健康值。

## 复杂度跟踪

本功能没有新增宪法违规。两步日期状态和 Tooltip 输入方式是修复已确认交互缺陷所需的局部状态；
事件上一周期摘要、SLI、端点比较和 system probes 都复用既有 bounded context、端点和明细，不
引入新服务、表、goroutine 或后台任务。

## 第 0 阶段输出

- [research.md](./research.md)：14 项已决技术选择，覆盖日期、Tooltip、比较、流量、分位、SLI、
  端点、system、visitor、导航、存储、OpenAPI 和验证。
- 所有技术未知项已由仓库证据和并行只读研究解决，未保留待澄清标记。

## 第 1 阶段输出

- [data-model.md](./data-model.md)：日期草稿、Tooltip 输入方式、比较、事件/流量、分位、SLI、
  system、visitor 和导航读模型；确认持久化结构不变。
- [contracts/analytics-monitoring-api.openapi.yaml](./contracts/analytics-monitoring-api.openapi.yaml)：
  七个既有私有 operation 的完整 012 OpenAPI 3.1 契约。
- [contracts/dashboard-ui.contract.md](./contracts/dashboard-ui.contract.md)：浏览器交互、信息
  架构、比较语义、三语、响应式与隐私契约。
- [quickstart.md](./quickstart.md)：契约、TDD、本地三进程、Go/Vitest/Playwright、性能、隐私、
  Figma 与部署隔离验证。
- [AGENTS.md](../../AGENTS.md)：通过 agent-context hook 把受管 Spec Kit 指针更新到本计划。

## 第 1 阶段后宪法复查

| 门禁 | 结果 | 设计后证据 |
|------|------|------------|
| 产品定位与范围边界 | 通过 | 数据模型和契约只扩展既有匿名监控读模型，不增加公开产品能力。 |
| 范围排除 | 通过 | 两份契约无完整规划、非巴士交通、账号、指纹、导出、删除或编辑能力。 |
| 前后端分离与契约优先 | 通过 | OpenAPI、UI contract、应用 ports 和原子发布边界分别明确。 |
| OpenAPI 驱动的服务端接口文档 | 通过 | 012 YAML 可独立 lint/bundle；shared、中文 docs 与 feature 指针更新已列入实施。 |
| 三语国际化 | 通过 | UI contract 覆盖新 IA、两步日期、比较、SLI、system、visitor，并规定语气和状态保持。 |
| 试用查询与可靠降级 | 通过 | 统计不接触公开业务用例；system 字段和 Dropped 局部降级，不伪造事实。 |
| 现代界面与可视化评审 | 通过 | v1.3 五张截图、SVG、设计文档和 Figma `89:1310` 均可追溯。 |
| 电脑与手机双端一致可用 | 通过 | UI contract/quickstart 覆盖 1440/390、44px、双图/单列和无整体横向滚动。 |
| Figma 驱动的前端规格 | 通过 | 真实 v1.3 锚点、画板、交互和 viewport 已写入 `figma.md`。 |
| 服务端 DDD 架构 | 通过 | data model 与项目结构区分领域规则、应用编排、SQLite 探测和 HTTP 映射。 |
| 服务端稳健性与可观测性 | 通过 | 无新 goroutine/端点；保留 recovery/logger/error 返回和脱敏，局部缺失使用 null。 |
| 中文注释与代码可读性 | 通过 | research/plan 列出需中文注释的非显而易见状态、边界和降级规则。 |
| 可验证交付与自动提交 | 通过 | quickstart 提供可运行命令、预期、性能/隐私/Figma/部署门禁；本 plan 单独提交。 |
| Spec Kit 产物语言 | 通过 | 第 0/1 阶段人读产物全部为简体中文，代码标识和协议字段保留原文。 |
