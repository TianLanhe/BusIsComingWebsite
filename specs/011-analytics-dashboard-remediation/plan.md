# 实施计划：监控 Dashboard 体验修复

**分支**：`feat/011-analytics-dashboard-remediation` | **日期**：2026-07-23 | **规格**：[spec.md](./spec.md)

**输入**：来自 `/specs/011-analytics-dashboard-remediation/spec.md` 的功能规格

## 摘要

本功能修复 010 匿名访问统计上线后的可用性与信息正确性，不改变采集范围、隐私边界、单份 SQLite 明细、长期保留、无备份、私有 loopback 访问或公开业务 fail-open。公开主页 Vite dev/preview 只为精确根路径增加 302 到 `/zh-hant/`；Dashboard 把预设和自定义范围统一为香港自然日，并让手动与 60 秒自动刷新重新锚定当前时刻。

监控前端在现有 React/Vite 私有构建中建立日期模型、40/36px 指标字号体系和可复用 Recharts 时间序列组件，删除指标卡装饰，区分持平/无同期/关闭比较；流量页使用逐日热力图，总览按四类事件显示成功请求 P95；事件、访客、性能和系统四个页面恢复 Pulse v1.1 信息架构并套用 v1.2 差异设计。后端继续使用现有 analytics DDD bounded context 和七个私有端点，只扩展 overview、traffic、events、visitor 响应，不新增表或 endpoint。OpenAPI 3.1 先行，随后同步 shared 契约和中文 API UI。

## 技术背景

**前端语言/版本**：TypeScript 5.7.2、React 18.3.1、浏览器 ES modules、Vite 6.0.5

**后端语言/版本**：Go 1.26.3

**主要依赖**：现有 React、React DOM、Lucide React、Recharts 3.10.0、Gin 1.12.0、`database/sql`、modernc SQLite 1.54.0；不新增日期库、图表库、路由库、ORM、缓存或独立数据库服务

**数据与存储**：继续使用单份 SQLite `analytics_events` 明细和进程内 runtime health；不新增 migration、汇总表、缓存表、定时聚合、清理或备份

**测试**：Go `testing`、SQLite integration/performance tests、Vitest 2.1.8、Testing Library、Playwright 1.49.1、Redocly CLI 2.32.2、固定数据视觉回归、OpenAPI/隐私契约测试

**目标平台**：现代手机与桌面浏览器；Linux amd64 单机 Go 服务；公开 Vite dev/preview；同一 Go 进程的 public `127.0.0.1:8080` 与 private `127.0.0.1:18081` 保持隔离

**项目类型**：前后端分离 Web 应用

**性能目标**：日增不超过 1,000、长期不超过 1,000,000 明细时，核心 Dashboard 查询和单 visitor 时间线 95% 在 1 秒内完成；日期/图表交互在普通桌面与手机上无明显卡顿；总览成功载入后 60 秒刷新且不叠加请求；监控改动对公开业务新增失败为 0

**约束**：不记录 IP、指纹、完整 Cookie/UA/Referrer、请求 URL/query/body、查询词、地点、坐标、token 或第三方原始响应；不新增事件类型、公开 endpoint、数据导出/删除/编辑；不虚构系统队列、备份或健康值；不以 0、旧缓存或 Figma 示例掩盖缺失数据；服务端不以 panic 作为业务控制流；不得编造 v1.2 导入批次锚点 `80:151` 下尚未机器读取的子画板 ID

**规模/范围**：1 个公开 Vite 根路径行为、7/30/90 与自定义日期、1 个通用折线组件、1 个逐日热力图、4 类事件 P95、4 个详细工作区、4 个私有响应 schema 增量、3 种语言、桌面/手机两类布局；既有七个私有 operation 和一张事实表数量不变

**i18n 范围**：日期预设/校验、比较状态、PV/UV 标签、图例、Tooltip、热力图、事件/访客/性能/系统区块和局部降级文案覆盖 `zh-Hant`、`zh-Hans`、`en`。`zh-Hant` 使用香港监控与交通产品常用书面语，`en` 使用自然克制的产品表达；数值、日期和耗时使用当前 locale 格式化，香港时间语义不随浏览器时区改变。

**前后端契约**：

- [analytics-monitoring-api.openapi.yaml](./contracts/analytics-monitoring-api.openapi.yaml)：七个既有私有 endpoint 的完整 OpenAPI 3.1 权威源；新增 `latencyByEvent`、逐日 `HeatmapCell`、`EventRangeSummary`、visitor `eventComposition/commonPlatform`。
- [dashboard-ui.contract.md](./contracts/dashboard-ui.contract.md)：OpenAPI 无法表达的 Vite 302、日期/刷新、指标、图表、热力图、详细页面、三语、响应式和局部降级契约。
- 私有成功/错误继续使用 `{requestId,data,error}` envelope；visitor ID 精确检索继续只用 `X-Analytics-Visitor-ID` header，不进入 URL/query/body。
- 兼容策略：保留路径、operationId、统一错误码和 OverviewData 旧 `latency` 字段；响应只做向后兼容增加，旧 `weekday/hour` 热力图由新逐日结构替换，前后端在同一发布中升级。

**OpenAPI 接口文档**：feature 权威源为 `specs/011-analytics-dashboard-remediation/contracts/analytics-monitoring-api.openapi.yaml`；实现阶段单向同步到 `shared/contracts/openapi/analytics-monitoring-api.openapi.yaml`，更新 `frontend/package.json` feature lint/bundle 路径为 011，运行 Redocly lint/bundle，并生成 `shared/contracts/openapi/docs/analytics-monitoring-api.html` 中文 API UI。API UI 只作私有预览，不进入公网产物。

**服务端 DDD 边界**：

- `domain`：香港日桶、Metric 空值、EventType、Outcome、分位值和 30 分钟会话等业务规则，不依赖 Gin/SQL/前端。
- `application`：QueryOverview/QueryDetails 组织逐日热力图、事件维度 P95、事件摘要和 visitor 分布；端口表达完整筛选摘要，不暴露 SQL。
- `infrastructure/sqlite`：复用 query builder 执行分页项目和完整范围聚合，负责 `COUNT(DISTINCT visitor_id)` 与性能索引；不新增表。
- `interfaces/http`：保持七个 operation，只映射 query/header、DTO、envelope 与现有错误；不得计算业务统计。
- 依赖方向保持 interfaces/infrastructure → application → domain；前端只消费 OpenAPI DTO。

**服务端稳健性与可观测性**：沿用 public/private engine 的 logger → analytics/recovery → handler 约束和 panic 集成测试。本功能不新增 goroutine；日期/聚合/存储错误通过返回值传播，不 panic。事件摘要或 visitor 查询失败映射既有脱敏错误；日志只保留 request ID、route template、operationId、status、duration 等白名单，不记录 Visitor ID 全值、IP、URL query、路径、密钥或原始错误。性能页 system 辅助请求失败只在前端局部降级；监控失败继续不改变公开主页、试查或下载响应。

**代码注释与可读性**：用中文注释说明香港半开日期边界、历史结束日/今天差异、上一等长周期、日热力图首尾桶、Metric 的 `null` 与零差异、事件摘要和分页共享过滤、visitor commonPlatform 空值、四类成功 P95、Recharts 键盘 active index、system 动态状态与配置事实、Vite 精确根路径。简单字段转发和直观 CSS 不加噪音注释。

**UI 可视化产物**：`docs/superpowers/prototypes/2026-07-23-analytics-dashboard-remediation-figma-import/` 的 HTML、manifest、tokens 与四张已验证截图；完整页面仍引用 010 的 13 张 Pulse v1.1 画板。映射和导入状态见 [figma.md](./figma.md)。

**Figma 设计引用**：[权威文件](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec)、v1.1 完整页面真实锚点 [63:2118](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=63-2118)、补充状态真实锚点 [67:672](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=67-672)，以及用户已导入的 v1.2 差异画板批次锚点 [80:151](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=80-151&t=pXavKmVnFOvABrsi-0)。四张子画板独立 ID 未机器读取时不虚构 ID。

**双端适配范围**：桌面基准 1440×1200，保留六列 KPI、高密度图表和语义表格；手机以 390×844 交互视口和 390×1640 full-page 验证 36px 指标、两列/单列卡、key-value 事件、纵向会话、44px 操作与底部导航。页面不整体横向滚动，只有热力图绘图区允许局部横向滚动。

**用户故事交付顺序**：先建立 OpenAPI、日期/比较、token 和通用测试基础；US1 修复时间正确性与自定义范围；US2 完成指标/图表/热力图/事件 P95；US3 恢复四个调查工作区和后端摘要；US4 最后加入隔离的公开 Vite 302。US1+US2 形成可独立验收的监控正确性 MVP，US3 完成调查闭环，US4 为本地入口便利性。Figma v1.2 真实批次锚点 `80:151` 已回填，视觉追溯门禁已满足。

## 宪法检查

*门禁：第 0 阶段研究前已通过；第 1 阶段设计后的复查见文末。*

| 门禁 | 结果 | 证据或后续动作 |
|------|------|----------------|
| 产品定位与范围边界：覆盖软件介绍、试用查询、下载 App，反馈和联系为次要功能 | 通过 | 本功能只修复主页访问、香港巴士试查和 APK 下载的既有匿名监控，不增加公众能力。 |
| 范围排除：不提供完整出行路线规划，也不提供地铁等其他交通工具查询 | 通过 | spec FR-029 与 UI contract 不增加新交通或规划功能。 |
| 前后端分离与契约优先：边界、契约和错误格式已记录 | 通过 | OpenAPI 3.1 + Dashboard UI contract 分别约束 HTTP 与前端行为；DDD/前端边界明确。 |
| OpenAPI 驱动的服务端接口文档：服务端 HTTP API 已有 OpenAPI 3.1 YAML、中文 API UI、共享沉淀路径和验证方式 | 通过 | `contracts/analytics-monitoring-api.openapi.yaml` 已建立；shared、Redocly 与中文 docs 路径已列出。 |
| 三语国际化 | 通过 | 新增文案范围、香港繁中和自然英文审校、key 完整性与 1440/390 验证已定义。 |
| 试用查询与可靠降级 | 通过 | 不改变外部巴士服务；监控失败与性能页辅助失败均有 fail-open/局部降级。 |
| 现代界面与可视化评审 | 通过 | v1.1 两个真实锚点、v1.2 四张 HTML/截图和真实导入批次锚点 `80:151` 均可追溯。 |
| 电脑与手机双端一致可用 | 通过 | 1440×1200、390×844/1640 的字号、布局、事件卡、滚动和触摸目标已约束。 |
| Figma 驱动的前端规格 | 通过 | 权威文件、v1.1 真实锚点、v1.2 逻辑画板/版本/交互和真实批次锚点 `80:151` 已记录在 `figma.md`。 |
| 服务端 DDD 架构 | 通过 | analytics domain/application/infrastructure/interfaces 职责和依赖方向已定义，无 handler 直接 SQL。 |
| 服务端稳健性与可观测性 | 通过 | 无新 goroutine，保持双 engine recovery/logger、错误返回与脱敏日志；公开业务不受监控失败影响。 |
| 中文注释与代码可读性 | 通过 | 复杂日期、空值、聚合、键盘交互、配置事实和重定向规则已列为中文注释点。 |
| 可验证交付与自动提交 | 通过 | quickstart 包含契约、Go、Vitest、Playwright、性能、Figma 和隔离检查；本 skill 验证后自动提交。 |
| Spec Kit 产物语言 | 通过 | spec/plan/research/data-model/quickstart/contracts 人读内容均为简体中文。 |

## 项目结构

### 文档（本功能）

```text
specs/011-analytics-dashboard-remediation/
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
└── tasks.md                         # /speckit-tasks 生成
```

### 源码（仓库根目录）

```text
frontend/
├── vite.config.ts                    # 仅 public 安装 root redirect plugin
├── viteRootRedirect.ts               # dev/preview 共享 302 middleware
├── vite.monitor.config.ts            # 保持不安装重定向插件
├── package.json                      # feature OpenAPI 路径更新到 011
├── src/
│   ├── monitoring/
│   │   ├── app/
│   │   │   └── FilterProvider.tsx    # selection、refresh anchor、共享筛选
│   │   ├── model/
│   │   │   ├── dateRange.ts
│   │   │   └── comparisonState.ts
│   │   ├── components/
│   │   │   ├── charts/
│   │   │   │   ├── AccessibleChartFrame.tsx
│   │   │   │   ├── TimeSeriesChart.tsx
│   │   │   │   ├── TrafficChart.tsx
│   │   │   │   ├── Heatmap.tsx
│   │   │   │   └── MetricCard.tsx
│   │   │   ├── filters/GlobalFilters.tsx
│   │   │   ├── tables/
│   │   │   └── timeline/
│   │   ├── pages/                    # overview/traffic/events/visitor/performance/system
│   │   ├── services/                 # OpenAPI 对齐的 types/clients
│   │   ├── content/                  # 三语 copy/types
│   │   └── styles/                   # token/dashboard/responsive/mobile
│   └── tests/viteRootRedirect.test.ts
├── playwright-monitor/               # 时间、工作区、三语、双端和视觉回归
└── playwright/                        # public dev/preview 根路径回归

backend/
├── internal/analytics/
│   ├── domain/                        # 日期桶、Metric/分位规则
│   ├── application/
│   │   ├── dto.go                     # 新读模型字段
│   │   ├── ports.go                   # 事件完整范围摘要端口
│   │   ├── query_overview.go          # 四类成功 P95
│   │   └── query_details.go           # 逐日热力图、visitor 摘要
│   ├── infrastructure/sqlite/
│   │   ├── query_builder.go           # 分页与摘要复用 where
│   │   └── query_events_visitor.go    # summary + page；表结构不变
│   └── interfaces/http/               # DTO/envelope/contract tests；路由不变
└── downloads/android/                 # 用户现有改动，不纳入本功能提交

shared/contracts/openapi/
├── analytics-monitoring-api.openapi.yaml
├── analytics-monitoring-api.bundle.yaml
└── docs/analytics-monitoring-api.html

docs/superpowers/prototypes/
└── 2026-07-23-analytics-dashboard-remediation-figma-import/
```

**结构决策**：继续复用 010 的单前端依赖仓/双 Vite 产物和单 Go 进程/双 Gin engine，不改变部署拓扑。新增 `monitoring/model` 隔离日期与比较纯规则；通用图表只依赖前端读模型，不知道 API endpoint。analytics 应用层负责所有统计口径，SQLite 只实现端口并复用过滤器，HTTP 层保持薄适配。系统固定配置事实留在前端受控常量，不伪装为动态 API 数据。

## 复杂度跟踪

本功能没有新增宪法违规。Recharts 通用组件和事件摘要 SQL 是为满足已确认可访问交互与完整范围统计而增加的局部复杂度，均复用现有依赖和 bounded context；不引入新服务、表、队列或缓存。

## 第 0 阶段输出

- [research.md](./research.md)：13 项已决技术选择，覆盖日期、刷新、Recharts、逐日桶、P95、事件摘要、visitor、性能局部降级、系统事实、Vite、视觉、OpenAPI 和 Figma。
- 未保留 `[NEEDS CLARIFICATION]`，所有技术未知项均已解决。

## 第 1 阶段输出

- [data-model.md](./data-model.md)：前端选择/求值/比较模型，以及逐日热力图、四类 P95、事件摘要、visitor 和 system 组合读模型；确认无持久化变更。
- [contracts/analytics-monitoring-api.openapi.yaml](./contracts/analytics-monitoring-api.openapi.yaml)：七个既有私有 operation 的完整 OpenAPI 3.1 与增量 schema。
- [contracts/dashboard-ui.contract.md](./contracts/dashboard-ui.contract.md)：Vite、日期、指标、图表、热力图、工作区、三语、响应式和错误行为。
- [quickstart.md](./quickstart.md)：契约、TDD、Go/Vitest/Playwright、本地三进程、Figma、性能和隐私验证。
- [AGENTS.md](../../AGENTS.md)：通过 agent-context hook 把受管 Spec Kit 指针更新为本计划。

## 第 1 阶段后宪法复查

| 门禁 | 结果 | 设计后证据 |
|------|------|------------|
| 产品定位与范围边界 | 通过 | 数据模型只扩展既有四类匿名事件读模型，未增加产品功能或采集字段。 |
| 范围排除 | 通过 | 两份契约无完整规划、非巴士交通、账号、指纹、导出或删除能力。 |
| 前后端分离与契约优先 | 通过 | OpenAPI 定义 HTTP；UI contract 定义浏览器行为；应用端口隔离 SQLite。 |
| OpenAPI 驱动的服务端接口文档 | 通过 | 011 完整 YAML 可独立 lint/bundle；shared 和中文 docs 同步步骤已确定。 |
| 三语国际化 | 通过 | UI contract 明确全部新文案、locale 格式和繁中/英文审校；quickstart 覆盖 key 完整性。 |
| 试用查询与可靠降级 | 通过 | 统计响应扩展不接触公开业务用例；system 辅助失败局部降级，存储失败保持公开 fail-open。 |
| 现代界面与可视化评审 | 通过 | 四张 v1.2 差异截图已按 1440/390 manifest 渲染和检查；v1.1 完整页面真实锚点保留。 |
| 电脑与手机双端一致可用 | 通过 | UI contract、数据模型和 quickstart 覆盖双端字号、事件卡、44px 目标与局部滚动。 |
| Figma 驱动的前端规格 | 通过 | `figma.md` 含权威文件、v1.1 真实锚点、v1.2 逻辑节点、交互、版本与真实导入批次锚点 `80:151`；不虚构子画板 ID。 |
| 服务端 DDD 架构 | 通过 | data model 与项目结构把统计规则、应用编排、SQLite 聚合和 HTTP DTO 分开。 |
| 服务端稳健性与可观测性 | 通过 | 无新 goroutine/端点；保持 recovery/logger、错误返回、敏感信息禁止与公开 fail-open 测试。 |
| 中文注释与代码可读性 | 通过 | research/plan 列出需中文注释的复杂日期、null、SQL、图表焦点、配置事实和重定向规则。 |
| 可验证交付与自动提交 | 通过 | quickstart 提供可运行命令、预期和性能/隐私门禁；本 plan 通过检查后独立 commit。 |
| Spec Kit 产物语言 | 通过 | 第 0/1 阶段人读产物全部为简体中文，代码标识和协议字段保留原文。 |
