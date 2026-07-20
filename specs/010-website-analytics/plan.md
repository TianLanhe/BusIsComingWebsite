# 实施计划：网站匿名访问统计与监控面板

**分支**：`feat/010-website-analytics` | **日期**：2026-07-21 | **规格**：[spec.md](./spec.md)

**输入**：来自 `/specs/010-website-analytics/spec.md` 的功能规格

## 摘要

为 BusIsComing 三语主页新增当前 Android APK 元数据展示，并在不记录 IP、完整网络标识、查询
内容或自然人身份的前提下，记录主页 metadata、地点查询、路线查询和下载请求四类匿名事件。
匿名 visitor 由服务器使用一年有效的 `__Host-` HttpOnly Cookie 签发，已知机器人在 Cookie 与
写入前排除。统计写入通过独立 `analytics` DDD bounded context 和可替换存储端口进入单份
SQLite 明细；全部 UV、上一周期、30 分钟会话、双漏斗和分位值在私有查询时计算，写入失败以
短超时 fail-open，不改变公开业务响应。

同一个 Go 进程提供两个完全分离的 Gin engine：公开 API 保持 `127.0.0.1:8080`，监控静态页面
与只读 API 固定绑定 `127.0.0.1:18081`，仅通过 SSH 隧道访问。前端在同一 React/Vite 工程中
输出公网 `dist/` 与私有 `dist-monitor/` 两套物理产物；Dashboard 依照 Figma `Pulse v1` 实现
七个工作区、丰富指标卡/折线/分布/漏斗/表格、三语和桌面/手机状态。公开元数据与私有监控 API
以 feature OpenAPI 3.1 为设计权威，实现阶段同步到 shared 契约并生成中文 API UI。

## 技术背景

**前端语言/版本**：TypeScript 5.7.2、React 18.3.1、浏览器 ES modules；现有 Vite 6.0.5

**后端语言/版本**：Go 1.26.3

**主要依赖**：现有 Gin 1.12.0、React、React DOM、Lucide；新增标准库 `database/sql`、
CGO-free `modernc.org/sqlite`（实现时锁定已验证稳定版本）、与 React 18 匹配的 Recharts 3.x；
不新增 ORM、React Router、TanStack Query 或独立数据库服务

**数据与存储**：单机 SQLite `analytics.sqlite` + WAL/SHM，只有 `analytics_events` 明细和迁移
元数据；进程内保存 `lastSuccessfulWrite`、`droppedSinceStart` 和 listener 状态；无预计算汇总、
自动删除、备份或恢复点

**测试**：Go `testing`、`go test -race`、临时 SQLite integration/performance fixture、Vitest
2.1.8、Testing Library、Playwright 1.49.1、Redocly CLI 2.32.2、部署 shell tests、固定数据视觉
回归与隐私 sentinel 扫描

**目标平台**：现代手机与桌面浏览器；Linux amd64 单机 systemd 服务；Caddy 公开静态站与 API
反代；同一静态 Go 二进制内的 public `127.0.0.1:8080` 和 private `127.0.0.1:18081`

**项目类型**：前后端分离 Web 应用

**性能目标**：日均不超过 1,000 条、长期不超过 1,000,000 条明细时，近 30 天常用 Dashboard
查询和单 visitor 时间线服务端结果均小于 1 秒；事件写入有独立短 deadline，统计故障对公开
业务新增失败为 0；总览成功载入后每 60 秒刷新，详细页不自动刷新

**约束**：不记录 IP、完整 Cookie/UA/Referrer、请求 URL/query/body、地点、坐标、token 或
第三方原始响应；不做指纹识别或广告追踪；匿名统计始终启用且不提供 DNT/GPC 退出控制；只
统计三个主页、地点/路线试查和下载请求，ETA 排除；元数据失败不阻断下载；机器人完全不留
明细；私有监控绝不走 Caddy；统计数据可丢失且不备份；服务端不以 panic 表达业务失败

**规模/范围**：4 类事件、1 张事实表、1 个新公开 metadata operation、7 个私有只读
operation、7 个 Dashboard 工作区、10 张 Figma 参考画板、3 种语言、桌面和移动两类布局；当前
下载平台仅 Android，枚举预留 iOS；不新增完整出行规划、非香港巴士查询、账号、自然人画像、
安装完成追踪、导出/删除/编辑统计数据

**i18n 范围**：主页版本/大小/不可用文案、Dashboard 导航、指标、筛选、图例、tooltip、表格、
状态、错误和隐私披露全部覆盖 `zh-Hant`、`zh-Hans`、`en`。`zh-Hant` 由香港网站和交通产品
语境独立审校，使用自然实用书面语；`en` 使用克制自然的产品表达；三语隐私事实逐项核对，
不从简体逐句机械翻译。数值、大小和日期使用 `Intl` 按当前 locale 格式化。

**前后端契约**：

- [download-api.openapi.yaml](./contracts/download-api.openapi.yaml)：公开 metadata + 既有稳定
  下载的完整 feature 契约；响应使用白名单 DTO 与既有下载错误语义。
- [analytics-monitoring-api.openapi.yaml](./contracts/analytics-monitoring-api.openapi.yaml)：固定
  loopback 的七个私有只读 operation、统一筛选、游标、响应 envelope 和错误码。
- [public-tracking-context.contract.md](./contracts/public-tracking-context.contract.md)：四个精确
  路由的 Cookie、有限枚举 header、request-scoped 白名单和 fail-open 语义。
- 公共成功/错误响应延续各自现有格式：route 使用 `{requestId,data,error}`，download 保持下载
  文件/JSON error；私有 monitor 使用 `{requestId,data,error}`。visitor ID 只由公开 HttpOnly
  Cookie 自动携带；私有精确检索只使用 `X-Analytics-Visitor-ID` header，不进入 URL/query/body。

**OpenAPI 接口文档**：feature 权威源为上述两份 YAML。实现阶段把公开契约同步到
`shared/contracts/openapi/download-api.openapi.yaml` 和兼容镜像
`shared/contracts/download-api.openapi.yaml`，把私有契约同步到
`shared/contracts/openapi/analytics-monitoring-api.openapi.yaml`，并在现有
`shared/contracts/openapi/route-query-api.openapi.yaml` 补充 source header、`Set-Cookie` 与打点
副作用而不修改业务 body。Redocly lint/bundle 后生成
`shared/contracts/openapi/docs/download-api.html` 与 `analytics-monitoring-api.html`；所有项目可控
内容使用中文，私有 HTML 仅用于本地预览且不打包进公网产物。

**服务端 DDD 边界**：新增 `analytics` bounded context。`domain` 定义事件、值对象、允许枚举、
会话和漏斗规则；`application` 编排 `RecordEvent`、overview/traffic/downloads/events/visitor/
performance/system 查询及 `EventWriter`/`AnalyticsQueryStore` 端口；`infrastructure` 实现 SQLite、
迁移、Cookie HMAC、bot/device/source 分类；`interfaces/http` 实现公开 tracking middleware、
request-scoped 白名单观察和私有 API。通用请求日志、recovery、server supervision 放在
`internal/platform/httpserver`。依赖方向为 interfaces/infrastructure → application → domain，
domain 不依赖 Gin、SQL、文件系统、加密库适配或前端契约。

**服务端稳健性与可观测性**：替换 `gin.Logger()` 和 `gin.Recovery()`。自有 request logger 只记
服务端 request ID、method、route template、operationId、bounded context、status、duration 和
body size，不读 ClientIP 或实际 URI/query；recovery 不 dump request 或 panic 原值，只记受控
类型和脱敏 stack/hash。清理既有路线日志的起终点名称/坐标和不受控客户端 requestId。统计写入
短超时、无重试、失败原子计数；DB 初始化失败时使用 no-op writer，私有数据 API 返回 503，
system API 仍解释状态。public 启动失败为致命，private/analytics 失败只降级；所有项目创建的
listener/signal goroutine 统一 recover、传递错误并有界 shutdown。本功能没有统计队列、定时
聚合、checkpoint、清理或备份 goroutine。

**代码注释与可读性**：实现阶段用中文注释解释 Cookie 格式/轮换、bot-before-cookie 顺序、
主页 PV 判定、原始 Referrer 本地粗分类、request-scoped 白名单、30 分钟正边界、两个有序漏斗、
上一周期、分位值、下载实际版本归因、SQLite 每连接 PRAGMA、短超时 fail-open、private listener
非致命监督和 Caddy 隔离；简单字段映射不添加噪音注释。

**UI 可视化产物**：
`docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/` 中的 HTML、manifest、
tokens 和 10 张已逐屏渲染画板；逻辑画板映射见 [figma.md](./figma.md)。

**Figma 设计引用**：[BusIsComing Website Homepage v1 Spec，节点 63:2118](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=63-2118&t=qpAv4G6q8c045NWj-0)，
设计版本 `BusIsComing Pulse v1 · 2026-07-20`。用户已确认 HTML 导入完成；Figma Starter MCP
额度无法读取子节点，因此实现以该锚点、manifest、tokens 和已验证画板为依据，不虚构子节点。

**双端适配范围**：桌面基准 1440×1200（状态画板 1440×1000），使用 240px 侧栏、高密度 KPI、
双栏图表和语义表格；`<=820px` 转为移动抽屉/底部导航、两列 KPI、纵向卡片、紧凑图表和
key-value 明细，核心验收为 390×844 交互与 390×1640 full-page 视觉证据。APK metadata 状态
参考 1200×760 画板。七个工作区和四类状态在两端同等可达。

## 宪法检查

*门禁：第 0 阶段研究前已通过；第 1 阶段设计后的复查见文末。*

| 门禁 | 结果 | 证据或后续动作 |
|------|------|----------------|
| 产品定位与范围边界：覆盖软件介绍、试用查询、下载 App，反馈和联系为次要功能 | 通过 | Android 产品事实已从 `/Users/hezhenyu/AndroidStudioProjects/BusIsComming/AGENTS.md`、`README.md` 和当前 APK manifest 复核；本功能只观察官网三项核心范围。 |
| 范围排除：不提供完整出行路线规划，也不提供地铁等其他交通工具查询 | 通过 | spec、research 和 contracts 均限定香港巴士地点/路线试查与 Android 下载；ETA 不打点，iOS 仅预留枚举。 |
| 前后端分离与契约优先：边界、契约和错误格式已记录 | 通过 | 三份 feature contract 划分主页、公开统计上下文、私有查询；前端只消费 DTO，后端不要求硬编码内部规则。 |
| OpenAPI 驱动的服务端接口文档：服务端 HTTP API 已有 OpenAPI 3.1 YAML、中文 API UI、共享沉淀路径和验证方式 | 通过 | `contracts/*.openapi.yaml` 已生成；计划记录 shared 路径、route header 同步、Redocly lint/bundle/docs 和私有 UI 不部署公网。 |
| 三语国际化：所有用户可见文字覆盖 `zh-Hant`、`zh-Hans`、`en`，且 `zh-Hant` 与 `en` 已按自然语气审校、未机械直译 | 通过 | 技术背景与 quickstart 明确首页、Dashboard、状态、隐私事实及独立语气审校；现有 i18n provider/locale 类型可复用。 |
| 试用查询与可靠降级：外部服务、缓存、超时和失败状态已设计 | 通过 | 不改变 Citybus/DATA.GOV.HK 业务语义；成功/失败均以脱敏类别记录，统计/metadata/monitor 失败不扩大为试查或下载失败。 |
| 现代界面与可视化评审：UI 讨论和展示有图片、截图、设计稿或可视化 mock | 通过 | 10 张高保真导入画板、manifest 与 tokens 已验证并由用户导入 Figma。 |
| 电脑与手机双端一致可用：布局、交互和内容展示同时覆盖手机与电脑 | 通过 | 1440 桌面、390 手机的布局差异、七个工作区、状态和 Playwright 截图门禁已定义。 |
| Figma 驱动的前端规格：前端/UI 功能已有 Figma 文件或链接作为后续阶段参考 | 通过 | 权威文件节点 `63:2118`、版本、画板映射、交互与 MCP 限制记录在 `figma.md`。 |
| 服务端 DDD 架构：新增或重构的服务端代码按 DDD 层级、模块边界和依赖方向组织 | 通过 | 新增 analytics 四层、应用端口与 platform/httpserver；downloads/routes 只在 HTTP adapter/组合根接入。 |
| 服务端稳健性与可观测性：panic/recover、协程安全和脱敏日志策略已定义 | 通过 | 自有 logger/recovery、短超时 fail-open、双 server supervision、goroutine recover、敏感日志清理和验证已记录。 |
| 中文注释与代码可读性：复杂逻辑、领域规则和边界处理已有中文注释策略 | 通过 | Cookie、bot、会话/漏斗、分位值、SQLite、降级、listener 与部署隔离均列为必注释点。 |
| 可验证交付与自动提交：验证命令、浏览器检查和本次 Spec Kit skill 后提交策略已定义 | 通过 | quickstart 覆盖 Go/race、OpenAPI、隐私 sentinel、100 万行、Vitest/Playwright、Figma、部署和公网隔离；本 skill 验证后自动提交。 |
| Spec Kit 产物语言：本功能的 spec、plan、tasks 使用简体中文 | 通过 | 当前 spec/plan/research/data-model/quickstart/contracts 的人读说明均为简体中文；代码标识和协议字段保留原文。 |

## 项目结构

### 文档（本功能）

```text
specs/010-website-analytics/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── figma.md
├── checklists/
│   └── requirements.md
├── contracts/
│   ├── download-api.openapi.yaml
│   ├── analytics-monitoring-api.openapi.yaml
│   └── public-tracking-context.contract.md
└── tasks.md                         # 后续 /speckit-tasks 生成
```

### 源码（仓库根目录）

```text
frontend/
├── monitor/
│   └── index.html                   # 私有 Vite 入口
├── vite.config.ts                   # 公网页面构建/开发代理
├── vite.monitor.config.ts           # 私有 Dashboard 构建，outDir=dist-monitor
├── src/
│   ├── app/App.tsx                  # 只在精确主页挂 metadata provider
│   ├── services/
│   │   ├── downloadMetadataClient.ts
│   │   └── analyticsSource.ts       # 只产生有限来源枚举
│   ├── components/download/
│   │   ├── DownloadMetadataProvider.tsx
│   │   └── DownloadSegmentedButton.tsx
│   ├── content/
│   │   ├── privacyPolicyContent.ts
│   │   ├── downloadManifest.ts      # 只保留稳定 URL/静态平台文案
│   │   └── ...
│   ├── monitoring/
│   │   ├── main.tsx
│   │   ├── app/                     # hash 路由、全局筛选和 60 秒总览刷新
│   │   ├── pages/                   # overview/traffic/downloads/events/visitor/performance/system
│   │   ├── components/              # layout/filters/charts/tables/states
│   │   ├── services/analyticsClient.ts
│   │   ├── content/                 # 三语 copy/types
│   │   └── styles/                  # Figma tokens 与响应式规则
│   └── tests/
├── playwright/                      # 公网页面 E2E
├── playwright.monitor.config.ts
├── playwright-monitor/              # 私有 Dashboard E2E/视觉证据
├── dist/                             # 生成：仅 Caddy 公网
└── dist-monitor/                     # 生成：仅私有 Go listener

backend/
├── cmd/server/
│   ├── main.go                       # 两个 engine/server 的 composition root
│   └── main_test.go
├── internal/
│   ├── analytics/
│   │   ├── domain/                   # Event、枚举、Filter、Session/Funnel 规则
│   │   ├── application/              # RecordEvent、七类 query use cases、ports/health
│   │   ├── infrastructure/
│   │   │   ├── sqlite/               # store、migrations、queries、PRAGMA
│   │   │   ├── classification/       # bot/device/source
│   │   │   └── signing/              # visitor Cookie HMAC
│   │   └── interfaces/http/          # tracking middleware、白名单观察、私有 API/静态 UI
│   ├── downloads/
│   │   ├── application/              # 新增只读 metadata use case，下载用例保持独立
│   │   └── interfaces/http/           # metadata DTO + 实际下载归因
│   ├── routes/
│   │   └── interfaces/http/           # 地点/路线允许值回填；业务 body 不变
│   └── platform/httpserver/            # 脱敏 logger、recovery、server supervisor
└── downloads/android/                 # 当前开发 APK/manifest；生产仍使用 shared downloads

shared/contracts/
├── openapi/
│   ├── download-api.openapi.yaml
│   ├── download-api.bundle.yaml
│   ├── route-query-api.openapi.yaml
│   ├── route-query-api.bundle.yaml
│   ├── analytics-monitoring-api.openapi.yaml
│   ├── analytics-monitoring-api.bundle.yaml
│   └── docs/                           # 生成的中文 API UI；不部署公网
└── download-api.openapi.yaml           # 兼容镜像

scripts/
├── deploy.sh                            # 构建/打包两套前端与静态后端
├── deploy-remote.sh                     # shared analytics、env、systemd、Caddy 隔离
└── tests/deploy_test.sh                 # release、loopback、ReadWritePaths、公网不可达

docs/
├── deployment.md                        # SSH 隧道和不备份/不开放端口说明
└── superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/
```

**结构决策**：前端仍是一个依赖仓，但用两个 Vite config 产生物理隔离的 public/private bundle；
后端仍是一个部署二进制，但用两个 Gin engine 和两个 `http.Server` 隔离路由。analytics 领域不
引用 downloads/routes 内部模型；composition root 与 HTTP 白名单观察是 bounded context 的唯一
集成点。SQLite 适配器可以在 SQL 内用 CTE、窗口函数和索引聚合，但只实现 application query
端口，不把 SQL/表结构暴露给领域或前端。monitor 静态资源由 private listener 提供，public
Caddy 永远只看到 `frontend/dist`。

## 复杂度跟踪

| 违规或复杂点 | 为什么必要 | 被拒绝的更简单方案 |
|--------------|------------|--------------------|
| 同一进程双 Gin engine / 双 listener | 必须从路由注册层保证 monitor HTML/API 只在 loopback，同时复用现有单服务部署与生命周期 | 在公开 8080 下增加 `/api/analytics` 再依赖 Caddy 不转发；当前 Caddy 会代理全部 `/api/*`，容易误暴露 |
| 同一前端仓双 Vite 构建产物 | 必须让监控 HTML/JS 不进入公网静态根，同时复用 React/i18n/token 与 lockfile | 同一 `dist` 多页面构建会使私有 Dashboard 资源可从公网下载 |
| 可替换查询端口 + SQLite 专用聚合实现 | 用户要求未来可换存储，同时 100 万行查询需要 SQL CTE/窗口函数和索引 | handler 直接写/查 SQLite 虽短，但会把隐私、会话/漏斗口径和表结构永久耦合 |

上述复杂度均用于满足隐私隔离、部署边界或明确扩展要求，不构成宪法违规。

## 第 0 阶段输出

- [research.md](./research.md)：16 项已决技术选择，覆盖 DDD/SQLite、Cookie、bot、粗粒度来源、
  精确打点、metadata、双 listener、私有 API、独立 Dashboard、日志/recovery、部署和验证。
- 所有技术背景中的未知项已解决，无待澄清项。

## 第 1 阶段输出

- [data-model.md](./data-model.md)：匿名凭据、唯一事件事实表、下载归因、粗分类、派生访客/
  会话/漏斗、查询、聚合、metadata、系统健康和索引。
- [contracts/download-api.openapi.yaml](./contracts/download-api.openapi.yaml)：公开 metadata + 下载
  OpenAPI 3.1。
- [contracts/analytics-monitoring-api.openapi.yaml](./contracts/analytics-monitoring-api.openapi.yaml)：
  七个私有只读 operation 的 OpenAPI 3.1。
- [contracts/public-tracking-context.contract.md](./contracts/public-tracking-context.contract.md)：
  四个精确公开入口的跨切面隐私/打点契约。
- [quickstart.md](./quickstart.md)：OpenAPI、Go/race、隐私 sentinel、SQLite/100 万行、双 listener、
  前端、Figma、三语、部署和 SSH 的端到端验证步骤。
- [AGENTS.md](../../AGENTS.md)：受管 Spec Kit plan 指针更新为本文件。

## 第 1 阶段后宪法复查

| 门禁 | 结果 | 设计后证据 |
|------|------|------------|
| 产品定位与范围边界 | 通过 | data model 只有官网主页、香港巴士地点/路线试查和 APK 下载事件；Android 主项目事实已复核。 |
| 范围排除 | 通过 | event enum 无 ETA、非巴士交通、完整规划、账号、指纹、广告或安装完成事件。 |
| 前后端分离与契约优先 | 通过 | 两份 OpenAPI + 跨切面 contract 固定 DTO、header、错误、筛选、游标和 fail-open；Dashboard 只消费私有 API 聚合。 |
| OpenAPI 驱动的服务端接口文档 | 通过 | feature YAML 已通过 Redocly 结构验证；shared 同步、bundle、中文 docs 和私有不部署路径已记录。 |
| 三语国际化 | 通过 | quickstart 覆盖首页、七工作区、四状态和隐私披露的三语 completeness 与繁中/英文独立审校。 |
| 试用查询与可靠降级 | 通过 | tracking 位于 HTTP adapter，不改变 Citybus/DATA.GOV.HK use case；DB/metadata/private listener 失败均保持公开响应语义。 |
| 现代界面与可视化评审 | 通过 | Figma node、10 张画板、manifest、tokens、Recharts/HTML 组件映射和视觉回归门禁齐全。 |
| 电脑与手机双端一致可用 | 通过 | 1440/390 信息架构、表格移动转译、导航、状态、交互和 screenshot 门禁明确。 |
| Figma 驱动的前端规格 | 通过 | `figma.md` 可定位文件、节点 63:2118、版本、viewport、状态和导入限制。 |
| 服务端 DDD 架构 | 通过 | data model、源码结构和端口定义明确 analytics 四层、platform 通用层及依赖方向。 |
| 服务端稳健性与可观测性 | 通过 | plan/quickstart 覆盖自有 recovery/logger、server goroutine recover、短超时写、dropped health 和敏感字段 0 命中。 |
| 中文注释与代码可读性 | 通过 | 复杂隐私、统计算法、SQLite、错误映射和降级边界均列出中文注释责任；不要求噪音注释。 |
| 可验证交付与自动提交 | 通过 | quickstart 包含可运行命令和预期；本 plan 产物 lint/diff/路径验证通过后按宪法自动 commit。 |
| Spec Kit 产物语言 | 通过 | 第 0/1 阶段产物为简体中文，代码标识、HTTP 字段和第三方原文保持原样。 |
