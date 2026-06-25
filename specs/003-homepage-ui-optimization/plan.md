# 实施计划：首页 UI 优化

**分支**：`main`（`setup-plan.sh` 未返回专用分支） | **日期**：2026-06-16 | **规格**：[spec.md](./spec.md)

**输入**：来自 `/specs/003-homepage-ui-optimization/spec.md` 的功能规格

**说明**：本计划由 `/speckit-plan` 生成。所有面向人阅读的阶段产物使用简体中文；代码标识符、API 名称和第三方原文保持原文。

## 摘要

本功能把首页从“静态占位 + 平台分段下载”调整为更直接、更可信的 App 主页体验：首屏主按钮直接下载 Android APK，下载区改为 Android 详情卡；首屏右侧展示区改为 4 个核心功能点自动轮播，无左右箭头，并使用真实 App 截图的脱敏副本；同一功能点内的多张截图以堆叠形式展示，由用户手动切换；页面文案统一收窄为 Citybus / 城巴 查询，并把繁体中文重写为自然、清楚、符合香港语境的文案。

技术路线保持既有前后端分离：前端继续使用 React + Vite + TypeScript 承载首页、i18n、下载入口、轮播、截图图集和视觉资产；后端继续使用现有 Go + Gin 下载服务，本轮不修改下载 API 路径或下载业务语义，只允许把监听地址配置从回环地址扩展为所有本机网络接口。共享契约以 feature contracts 描述首页内容、截图资产和 UI 状态；既有下载 OpenAPI 3.1 YAML 继续作为下载接口权威来源，不新增服务端 HTTP API。

## 技术背景

**前端语言/版本**：TypeScript 5.7、React 18、Vite 6；以 `frontend/package.json` 和 lockfile 为准。

**后端语言/版本**：Go 1.26.3；现有下载服务位于 `backend/cmd/server` 与 `backend/internal/downloads`。

**主要依赖**：前端沿用 React、Vite、lucide-react、Vitest、Playwright、Ajv；后端沿用 Gin、Go 单元测试、`httptest`；OpenAPI 预览和 lint 沿用 Redocly CLI。

**数据与存储**：前端静态内容、i18n 文案、脱敏截图资产和截图资产 manifest。截图资产必须沉淀到 `frontend/src/assets/app-screenshots/real/` 后再被前端引用，不得直接引用项目外原图目录。下载 APK 继续使用 `backend/downloads/android/BusIsComing.apk` 和现有元数据。

**测试**：Vitest 覆盖内容契约、i18n 完整性、下载入口状态、轮播暂停和截图图集状态；Playwright 覆盖桌面 1440px、手机 390px、下载直触发、外层自动轮播、内层手动切换、语言切换状态保持和截图证据；Go 测试继续覆盖下载服务；`curl`/同局域网访问用于验证监听地址；Redocly lint 用于确认既有下载 OpenAPI 未破坏。

**目标平台**：桌面浏览器、手机浏览器、Vite 本地开发服务、Go API 服务、正式静态前端 + API 服务部署入口。

**项目类型**：前后端分离 Web 应用。

**性能目标**：首屏主内容在常规本地开发环境中 2 秒内可交互；4 个核心功能点在 10 秒内至少完成 1 次自动切换；轮播动画约 600-700ms，减少动态效果偏好下停止或降级非必要动画；脱敏截图需压缩到适合首屏展示的体积，避免因一次性加载全部原始大图拖慢首屏；桌面 1440px 和手机 390px 下关键文字不重叠、不截断。

**约束**：三语 i18n；`zh-Hant` 独立香港文案；现代、简洁、优雅；真实截图进入前端前必须脱敏；价格、时间、ETA 数值保留；页面口径聚焦城巴 / Citybus；不提供九巴、港铁、铁路、渡轮、其他交通工具或完整出行规划；不新增 iPhone 下载或历史版本选择；不展示完整 SHA-256；不修改下载 API 路径和下载业务语义。

**规模/范围**：1 个首页首屏下载入口改造；1 个下载区详情卡改造；1 个首屏功能展示模块重构；4 个核心功能展示项；4 组截图图集；6 个功能卡片中的价格卡片文案调整；三语文案覆盖；前端和后端监听地址配置；不新增服务端 HTTP endpoint。

**i18n 范围**：必须覆盖 `zh-Hant`、`zh-Hans` 和 `en`。新增或修改文案包括首屏下载按钮、APK 元信息、iPhone 状态、下载区详情卡、4 个核心功能标题和说明、6 个功能卡片、在线查询范围说明、FAQ 范围说明、下载失败提示和访问/部署提示。

**前后端契约**：本 feature 契约位于 `specs/003-homepage-ui-optimization/contracts/`，描述首页 v2 内容、截图资产、轮播/图集状态、下载入口 UI 不变量和监听入口要求。实现阶段需要同步更新或扩展 `shared/contracts/homepage-content.schema.json`、`shared/contracts/ui-state-contract.md`，但不得改变既有下载 OpenAPI 的 endpoint 或响应语义。

**OpenAPI 接口文档**：本轮不新增、修改或移除服务端 HTTP API；OpenAPI 新建或变更为 N/A。既有下载接口继续以 `specs/002-android-apk-download/contracts/download-api.openapi.yaml` 和 `shared/contracts/openapi/download-api.openapi.yaml` 为权威来源。实现阶段若仅调整监听地址，仍需运行既有 `npm --prefix frontend run openapi:lint` 或等价检查，确认接口契约未漂移。

**服务端 DDD 边界**：不新增后端 bounded context；既有 `downloads` bounded context 不重开。若实现阶段修改 Go 服务监听地址，只能在 `backend/cmd/server/main.go` 或接口入口配置层处理，保持 `domain -> application -> infrastructure/interfaces` 的依赖方向，不把监听配置或 HTTP 细节移入领域层。

**服务端稳健性与可观测性**：保留 Gin 请求日志和 panic recovery。监听地址配置错误、端口占用或启动失败通过普通 error 和日志表达，不以 `panic` 作为业务控制流；本轮不新增 goroutine、后台任务或外部实时服务。日志不得输出密钥、完整私有路径或未经脱敏的用户截图内容。

**代码注释与可读性**：截图堆叠状态、外层自动轮播暂停/恢复、减少动态效果、本地化抽查、截图脱敏例外、监听地址配置和标准 HTTP 入口需要中文注释解释边界；简单赋值和显而易见条件不加噪音注释。

**UI 可视化产物**：已产出 Superpowers browser companion mock，路径为 `docs/superpowers/specs/2026-06-16-homepage-ui-optimization-design.md` 和 `.superpowers/brainstorm/43374-1781582320/content/*.html`；实现阶段还需保存桌面与手机截图证据到 `specs/003-homepage-ui-optimization/visual-review/`。

**Figma 设计引用**：继续使用 [BusIsComing Website - Homepage v1 Spec](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU)。本计划阶段已通过 Figma MCP 创建页面 `Homepage v2 Plan - 003 UI Optimization`（page `10:2`），关键节点为桌面 `10:3`、手机 `10:44`、下载状态 `10:75`、功能轮播与截图栈 `10:87`、实现约束说明 `10:176`。创建后第二次只读校验触发 Figma Starter MCP 调用额度限制；节点 ID 来自成功创建调用，截图级验证必须在实现或下一次 Figma 可用时补充。

**双端适配范围**：桌面主要验证 1440px 宽，手机主要验证 390px 宽；需要额外检查窄屏下下载按钮、在线查询按钮、APK 元信息、iPhone 状态、截图堆叠露出区域、功能文案和下载区详情卡不重叠、不截断、可操作。

## 宪法检查

*门禁：必须在第 0 阶段研究前通过；第 1 阶段设计后必须复查。*

| 门禁 | 结果 | 证据或后续动作 |
|------|------|----------------|
| 产品定位与范围边界：覆盖软件介绍、试用查询、下载 App，反馈和联系为次要功能 | 通过 | 本功能只优化首页核心介绍、城巴查询理解和下载入口，不新增次要业务。 |
| 范围排除：不提供完整出行路线规划，也不提供地铁等其他交通工具查询 | 通过 | `spec.md` FR-017、FR-018 明确收窄为 Citybus / 城巴，并排除九巴、港铁、铁路、渡轮和完整规划。 |
| 前后端分离与契约优先：边界、契约和错误格式已记录 | 通过 | 前端负责 UI、文案、截图和状态；后端只保留既有下载服务与监听配置；feature contracts 记录 UI/内容/资产契约。 |
| OpenAPI 驱动的服务端接口文档：服务端 HTTP API 已有 OpenAPI 3.1 YAML、中文 API UI、共享沉淀路径和验证方式 | 通过 | 本轮无新增或变更 HTTP API；既有下载 OpenAPI 继续作为权威来源，quickstart 要求 lint 现有契约。 |
| 三语国际化：所有用户可见文字覆盖 `zh-Hant`、`zh-Hans`、`en` | 通过 | 技术背景和 contracts 要求所有新增/修改文案三语覆盖，且 `zh-Hant` 独立香港文案。 |
| 试用查询与可靠降级：外部服务、缓存、超时和失败状态已设计 | 通过 | 不接入新外部服务；在线查询仍为既有静态演示；下载失败沿用既有不可用状态。 |
| 现代界面与可视化评审：UI 讨论和展示有图片、截图、设计稿或可视化 mock | 通过 | Superpowers mock 与 Figma v2 节点已记录；实现阶段补充桌面/手机截图证据。 |
| 电脑与手机双端一致可用：布局、交互和内容展示同时覆盖手机与电脑 | 通过 | Figma v2 桌面/手机节点和 quickstart viewport 验证覆盖双端。 |
| Figma 驱动的前端规格：前端/UI 功能已有 Figma 文件或链接作为后续阶段参考 | 通过 | Figma page `10:2` 与关键节点 `10:3`、`10:44`、`10:75`、`10:87`、`10:176` 已创建并记录在 `figma.md`。 |
| 服务端 DDD 架构：新增或重构的服务端代码按 DDD 层级、模块边界和依赖方向组织 | 通过 | 本轮不新增领域功能；监听配置只允许留在入口层，不触碰 `downloads` 领域规则。 |
| 服务端稳健性与可观测性：panic/recover、协程安全和脱敏日志策略已定义 | 通过 | 保留请求日志和 recovery；不新增 goroutine；启动错误用普通 error/log 表达。 |
| 中文注释与代码可读性：复杂逻辑、领域规则和边界处理已有中文注释策略 | 通过 | 已列出轮播、截图栈、脱敏例外、i18n 抽查和监听配置需要中文注释。 |
| 可验证交付与自动提交：验证命令、浏览器检查和本次 Spec Kit skill 后提交策略已定义 | 通过 | `quickstart.md` 定义验证步骤；本次 plan 完成后只提交本 feature 规划产物。 |
| Spec Kit 产物语言：本功能的 spec、plan、tasks 使用简体中文 | 通过 | 当前 plan、research、data-model、contracts、quickstart、figma 均使用简体中文。 |

## 项目结构

### 文档（本功能）

```text
specs/003-homepage-ui-optimization/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── figma.md
├── contracts/
│   ├── homepage-content-v2.schema.json
│   ├── homepage-ui-v2.contract.md
│   └── screenshot-assets.manifest.schema.json
├── checklists/
│   └── requirements.md
└── visual-review/              # 实现阶段生成
```

### 源码（仓库根目录）

```text
frontend/
├── vite.config.ts
├── playwright.config.ts
├── package.json
├── src/
│   ├── assets/app-screenshots/
│   │   ├── README.md
│   │   └── real/               # 脱敏真实截图，实施阶段新增
│   ├── components/download/
│   ├── components/hero/
│   ├── components/sections/
│   ├── content/
│   │   ├── carouselSlides.ts    # 将演进为 4 个核心展示项 + 图集
│   │   ├── downloadManifest.ts
│   │   ├── homepageContent.ts
│   │   ├── sectionsContent.ts
│   │   └── types.ts
│   ├── styles/
│   └── tests/
└── playwright/

backend/
├── cmd/server/main.go           # 仅允许调整监听 host 配置
├── downloads/android/
└── internal/downloads/
    ├── domain/
    ├── application/
    ├── infrastructure/
    └── interfaces/

shared/
└── contracts/
    ├── homepage-content.schema.json
    ├── ui-state-contract.md
    └── openapi/download-api.openapi.yaml
```

**结构决策**：本轮以 `frontend/src/content` 作为首页 v2 内容和状态的来源，`frontend/src/components/hero` 承载外层自动轮播和内层手动截图栈，`frontend/src/components/download` 与 `frontend/src/components/sections/DownloadSection.tsx` 承载直接下载与详情卡。真实截图资产统一沉淀到 `frontend/src/assets/app-screenshots/real/` 并记录 manifest，前端不得引用项目外原图目录。后端只调整入口监听配置，保持下载领域、应用、基础设施和 HTTP 适配层边界不变。

## 复杂度跟踪

无宪法违规。必要复杂度如下：

| 复杂点 | 为什么必要 | 被拒绝的更简单方案 |
|--------|------------|--------------------|
| 建立截图脱敏副本和 manifest，而不是直接引用原图 | 用户明确要求使用真实截图且先脱敏；规格要求价格、时间、ETA 保留但地点/路线等真实信息移除 | 直接引用未纳入项目资产目录的原图会泄露真实地点、路线号、搜索记录和系统无关内容 |
| 拆分外层自动轮播与内层手动截图栈状态 | 用户确认 4 个核心功能点自动轮播，同功能点图集只能手动切换 | 用一个通用 carousel 同时处理功能点和截图会混淆暂停、动画和状态保持规则 |
| 同时调整前端与后端监听入口 | 用户要求本地开发可通过本机 IP 访问，且正式前端支持标准 HTTP 入口 | 只改 Vite 或只改 Go 服务会导致手机端验收仍卡在另一个回环地址 |

## 第 0 阶段输出

- [research.md](./research.md)：内容模型、截图脱敏、轮播/图集交互、i18n、监听入口、OpenAPI 不变更、验证策略决策。

## 第 1 阶段输出

- [data-model.md](./data-model.md)：核心功能展示项、截图图集、截图资产、下载入口状态、本地化文案项、访问入口和状态转换。
- [contracts/homepage-content-v2.schema.json](./contracts/homepage-content-v2.schema.json)：首页 v2 静态内容与图集数据契约。
- [contracts/homepage-ui-v2.contract.md](./contracts/homepage-ui-v2.contract.md)：下载入口、自动轮播、手动截图栈、响应式和可访问性 UI 不变量。
- [contracts/screenshot-assets.manifest.schema.json](./contracts/screenshot-assets.manifest.schema.json)：脱敏截图资产 manifest 契约。
- [figma.md](./figma.md)：Figma 文件、v2 页面、节点、状态和后续验证说明。
- [quickstart.md](./quickstart.md)：实现完成后的验证步骤。
- [AGENTS.md](../../AGENTS.md)：Spec Kit 当前 plan 指向本文件。

## 第 1 阶段后宪法复查

| 门禁 | 结果 | 证据或后续动作 |
|------|------|----------------|
| 产品定位与范围边界 | 通过 | 数据模型和 contracts 均聚焦首页介绍、城巴查询理解和 Android 下载。 |
| 范围排除 | 通过 | UI contract 明确页面不得暗示覆盖九巴、港铁、铁路、渡轮或完整规划。 |
| 前后端分离与契约优先 | 通过 | 首页 v2 内容、UI 状态和截图资产 contracts 已定义；后端只保留既有下载契约。 |
| OpenAPI 驱动的服务端接口文档 | 通过 | 本轮无服务端 HTTP API 变更；quickstart 要求 lint 既有下载 OpenAPI，若后续变更必须另行更新契约。 |
| 三语国际化 | 通过 | `homepage-content-v2.schema.json` 和 `homepage-ui-v2.contract.md` 要求所有用户可见文案三语覆盖。 |
| 试用查询与可靠降级 | 通过 | 不新增外部实时服务；下载失败和在线查询静态演示边界已记录。 |
| 现代界面与可视化评审 | 通过 | Superpowers mock 与 Figma v2 节点已沉淀；实现阶段补桌面/手机截图。 |
| 电脑与手机双端一致可用 | 通过 | UI contract 与 quickstart 覆盖桌面 1440px、手机 390px 和同局域网访问。 |
| Figma 驱动的前端规格 | 通过 | `figma.md` 记录 Figma page `10:2` 和关键节点；MCP 额度限制导致二次读回未完成，已转为后续截图验证门禁。 |
| 服务端 DDD 架构 | 通过 | 后端不新增领域能力，监听配置保留在入口层。 |
| 服务端稳健性与可观测性 | 通过 | 计划和 quickstart 要求保留 Gin logger/recovery，不新增 goroutine，启动错误脱敏记录。 |
| 中文注释与代码可读性 | 通过 | 需要注释的交互状态、脱敏边界和监听配置已记录。 |
| 可验证交付与自动提交 | 通过 | quickstart 给出验证命令；本 plan 产物验证后提交。 |
| Spec Kit 产物语言 | 通过 | 本阶段产物使用简体中文。 |
