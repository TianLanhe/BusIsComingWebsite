# 实施计划：首页 UI 体验优化补充

**分支**：`codex/007-homepage-ui-polish` | **日期**：2026-06-27 | **规格**：[spec.md](./spec.md)

**输入**：来自 `/specs/007-homepage-ui-polish/spec.md` 的功能规格

**说明**：本计划由 `/speckit-plan` 生成。所有面向人阅读的阶段产物使用简体中文。

## 摘要

本功能在现有首页体验精修基础上继续优化首屏和手机端体验：桌面 hero 右侧截图组采用中等放大，主图和后排堆叠图同等放大，点击主图进入可缩放的大图模式；截图区域和文字区域拆分手势目标，截图区只切同功能截图，文字区才切换整个功能；手机端功能介绍改为 2 列紧凑卡片，桌面端功能介绍保持现状；手机端路线结果卡片压缩为路线号/候车状态、站点路径或缺失提示、车费/耗时/步行标签值三层结构；费用相关文案改为“车费一眼看清”并覆盖三语。

技术路线保持前后端分离但本轮只修改前端：首页 React 组件、CSS Modules、内容模型、三语文案、单元测试和 Playwright 视觉/交互验证。后端 Go 服务、下载 API、路线查询 API 与 OpenAPI 契约均不变。计划阶段生成 UI 状态契约、数据模型、quickstart、Figma 引用和本地 Figma 插件 fallback；由于当前 Figma MCP 返回重新认证要求，本阶段不伪造节点 ID，后续认证恢复后必须运行插件或通过 MCP 创建节点并回填。

## 技术背景

**前端语言/版本**：TypeScript 5.7、React 18、Vite 6；以 `frontend/package.json` 与锁定依赖为准。

**后端语言/版本**：Go 1.26.3；本功能不修改后端代码，仅 Playwright 验证时沿用现有后端服务。

**主要依赖**：React、CSS Modules、lucide-react、Vitest、Testing Library、Playwright、Ajv、Redocly CLI。新增大图缩放优先使用原生 React 状态、Pointer/Wheel/Keyboard 事件和 CSS transform，不引入新的缩放库，避免增加首屏体积和维护面。

**数据与存储**：静态首页内容、三语 i18n 文案、真实脱敏 App 截图 manifest、Figma 设计引用和 UI 状态契约。不新增数据库、服务端持久化或浏览器端新存储。

**测试**：Vitest 覆盖内容契约、i18n 完整性、hero 轮播/截图组、大图模式、功能卡和在线查询路线卡；Playwright 覆盖桌面 1440px 与手机 390px 的 hero、功能介绍、路线卡、大图交互和无提示器约束；构建验证使用 `npm run build`。

**目标平台**：桌面浏览器、手机浏览器、Vite 本地开发服务、现有静态前端 + Go API 服务部署入口。

**项目类型**：前后端分离 Web 应用。

**性能目标**：不新增大型前端依赖；大图模式只在用户打开时渲染；桌面 hero 截图组放大后不导致首屏横向溢出；手机 390px 下功能区和路线卡高度明显低于当前单列展示；既有 3 秒功能轮播节奏不被大图状态误触发。

**约束**：三语 i18n；`zh-Hant` 香港实用书面语；`en` 自然克制产品表达；现代、简洁、优雅；手机和桌面同等可用；桌面功能介绍布局不变；手机功能介绍 2 列紧凑；路线卡项目名称和值必须有层级差异；大图模式只切同功能截图；生产页面不显示放大提示器；不扩大 Citybus / 城巴试查范围；不改服务端 API。

**规模/范围**：1 个 hero 截图展示/大图交互调整；1 个手机功能介绍布局调整；1 个手机路线结果卡布局调整；1 组费用相关三语文案更新；1 份 Figma fallback 插件；1 组 UI 契约与验证文档。服务端代码、OpenAPI、下载能力和路线查询能力不在本轮范围。

**i18n 范围**：新增或修改的用户可见文字必须覆盖 `zh-Hant`、`zh-Hans`、`en`，包括费用标题/说明、大图对话框标题、关闭/缩放/上一张/下一张控件、路线卡项目标签、站点资料缺失提示、图片 alt 和 aria 文案。`zh-Hant` 按香港交通产品语境独立审校，`en` 避免中文句式直译，`zh-Hans` 使用自然简体中文。

**前后端契约**：本 feature 契约位于 `specs/007-homepage-ui-polish/contracts/`。`homepage-ui-polish.contract.md` 固定 UI 状态、手势目标、三语、响应式和非 API 不变量；`homepage-ui-polish-content.schema.json` 固定可校验的内容与体验配置字段。实现阶段如需同步长期共享契约，可更新 `shared/contracts/homepage-content.schema.json` 与 `shared/contracts/ui-state-contract.md`，但不得改变 HTTP API 契约。

**OpenAPI 接口文档**：N/A。本功能不新增、修改或移除服务端 HTTP API；既有下载 API 与路线查询 API 继续以 `shared/contracts/openapi/download-api.openapi.yaml`、`shared/contracts/openapi/route-query-api.openapi.yaml` 为权威来源。实现阶段可运行现有 OpenAPI lint 作为未漂移检查，但本功能不生成新的 OpenAPI 文档或中文 API UI。

**服务端 DDD 边界**：N/A。本功能不新增后端 bounded context，不修改 `downloads` 或 `routes` 领域、应用、基础设施和接口适配层。

**服务端稳健性与可观测性**：N/A。本功能不新增服务端入口、goroutine、后台任务或外部实时服务。既有 HTTP recovery、请求日志和脱敏策略保持不变。

**代码注释与可读性**：实现阶段需要用中文注释解释非显而易见的手势区域分流、大图缩放/平移阈值、焦点限制、减少动态效果和截图状态保留规则。普通样式、简单文案映射和直接布局调整不加噪音注释。

**UI 可视化产物**：已沉淀 Superpowers 设计记录 [2026-06-27-homepage-ui-polish-followup-design.md](../../docs/superpowers/specs/2026-06-27-homepage-ui-polish-followup-design.md) 和稳定 HTML 原型 [2026-06-27-homepage-ui-polish-followup.html](../../docs/superpowers/prototypes/2026-06-27-homepage-ui-polish-followup.html)。本计划新增 `figma.md` 与 `figma-plugin/` 作为 Figma 设计源 fallback。

**Figma 设计引用**：目标文件沿用 [BusIsComing Website - Homepage v1 Spec](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec)。计划页面为 `Homepage UI Polish - 007`，关键节点为 `Desktop 1440 / Hero Medium Screenshot Deck`、`Desktop 1440 / Screenshot Lightbox`、`Mobile 390 / Compact Feature Grid`、`Mobile 390 / Compact Route Result Card`、`Interaction States / Split Gesture Zones`、`Spec Notes`。当前 MCP 需要重新认证，不能回填真实 node ID；后续认证恢复后必须运行插件或 MCP 写入并更新 `figma.md`。

**双端适配范围**：桌面以 1440px 宽为主要视觉基准，验证 hero 截图组放大、文字可读性、大图入口和无放大提示器；手机以 390px 宽为主要视觉基准，验证 2 列功能卡、路线卡标签值布局、长文案不溢出和触控可用。

## 宪法检查

*门禁：必须在第 0 阶段研究前通过；第 1 阶段设计后必须复查。*

| 门禁 | 结果 | 证据或后续动作 |
|------|------|----------------|
| 产品定位与范围边界：覆盖软件介绍、试用查询、下载 App，反馈和联系为次要功能 | 通过 | 本功能只优化首页软件介绍与在线试查展示，不新增业务能力。 |
| 范围排除：不提供完整出行路线规划，也不提供地铁等其他交通工具查询 | 通过 | `spec.md` FR-021 和本计划约束均保持 Citybus / 城巴范围边界。 |
| 前后端分离与契约优先：边界、契约和错误格式已记录 | 通过 | 前端负责 UI 与内容；后端 N/A；feature contracts 固定 UI 行为和内容不变量。 |
| OpenAPI 驱动的服务端接口文档：服务端 HTTP API 已有 OpenAPI 3.1 YAML、中文 API UI、共享沉淀路径和验证方式 | 通过 | 本轮无 HTTP API 变更；既有下载和路线 OpenAPI 保持权威，quickstart 记录未漂移检查。 |
| 三语国际化：所有用户可见文字覆盖 `zh-Hant`、`zh-Hans`、`en`，且 `zh-Hant` 与 `en` 已按自然语气审校、未机械直译 | 通过 | research、contracts、quickstart 要求费用文案、大图控件和路线标签三语覆盖并审校。 |
| 试用查询与可靠降级：外部服务、缓存、超时和失败状态已设计 | 通过 | 不改变在线查询外部服务；仅调整已有结果展示，缺失站点以受控提示降级。 |
| 现代界面与可视化评审：UI 讨论和展示有图片、截图、设计稿或可视化 mock | 通过 | 已有 Superpowers 原型和本地 Figma 插件 fallback。 |
| 电脑与手机双端一致可用：布局、交互和内容展示同时覆盖手机与电脑 | 通过 | 桌面 1440px 与手机 390px 均进入 quickstart 和 contracts。 |
| Figma 驱动的前端规格：前端/UI 功能已有 Figma 文件或链接作为后续阶段参考 | 通过 | 已记录目标 Figma 文件；MCP 需重新认证，计划阶段提供本地插件并要求后续回填真实节点。 |
| 服务端 DDD 架构：新增或重构的服务端代码按 DDD 层级、模块边界和依赖方向组织 | 通过 | 本轮不涉及服务端代码，DDD 为 N/A。 |
| 服务端稳健性与可观测性：panic/recover、协程安全和脱敏日志策略已定义 | 通过 | 本轮不涉及服务端入口或并发任务，沿用既有策略。 |
| 中文注释与代码可读性：复杂逻辑、领域规则和边界处理已有中文注释策略 | 通过 | 计划列出手势分流、大图缩放、焦点管理等复杂逻辑需中文注释。 |
| 可验证交付与自动提交：验证命令、浏览器检查和本次 Spec Kit skill 后提交策略已定义 | 通过 | quickstart 定义 Vitest、build、Playwright、OpenAPI 未漂移和视觉检查；本 plan 完成后提交。 |
| Spec Kit 产物语言：本功能的 spec、plan、tasks 使用简体中文 | 通过 | 本 plan、research、data-model、contracts、quickstart、figma 均使用简体中文。 |

## 项目结构

### 文档（本功能）

```text
specs/007-homepage-ui-polish/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── figma.md
├── figma-plugin/
│   ├── README.md
│   ├── code.js
│   ├── manifest.json
│   └── ui.html
├── contracts/
│   ├── homepage-ui-polish-content.schema.json
│   └── homepage-ui-polish.contract.md
├── checklists/
│   └── requirements.md
└── visual-review/
```

### 源码（仓库根目录）

```text
frontend/
├── src/
│   ├── components/
│   │   ├── hero/
│   │   │   ├── AppPreviewCarousel.tsx
│   │   │   ├── AppPreviewCarousel.module.css
│   │   │   ├── ScreenshotStack.tsx
│   │   │   └── ScreenshotStack.module.css
│   │   ├── online-demo/
│   │   │   ├── OnlineQueryDemo.tsx
│   │   │   └── OnlineQueryDemo.module.css
│   │   └── sections/
│   │       ├── FeatureGrid.tsx
│   │       └── FeatureGrid.module.css
│   ├── content/
│   │   ├── carouselSlides.ts
│   │   ├── homepageContent.ts
│   │   ├── sectionsContent.ts
│   │   ├── types.ts
│   │   └── uiCopy.ts
│   └── tests/
│       ├── content-contract.test.ts
│       ├── feature-gallery.test.tsx
│       ├── hero-carousel.test.tsx
│       ├── i18n-completeness.test.tsx
│       ├── online-query-demo.test.tsx
│       └── sections-content.test.ts
└── playwright/
    ├── feature-gallery.spec.ts
    ├── hero-carousel.spec.ts
    ├── homepage-experience-polish.spec.ts
    ├── homepage-sections.spec.ts
    └── online-query-demo.spec.ts

backend/
└── N/A，本功能不修改服务端代码；Playwright 仍启动现有 Go 服务用于页面集成验证。

shared/
└── contracts/
    ├── homepage-content.schema.json
    ├── ui-state-contract.md
    └── openapi/
        ├── download-api.openapi.yaml
        └── route-query-api.openapi.yaml
```

**结构决策**：前端继续在现有 `components/hero`、`components/sections`、`components/online-demo` 和 `content` 模块内演进，不新增路由或页面。大图查看可以作为 `components/hero` 内的聚焦组件由 `AppPreviewCarousel` 管理状态；`ScreenshotStack` 保持截图组展示与截图区手势边界；`FeatureGrid` 仅在手机断点调整为 2 列；`OnlineQueryDemo` 仅调整移动端 route card 结构和样式。服务端不进入本轮实现范围。

## 复杂度跟踪

| 复杂点 | 为什么必要 | 被拒绝的更简单方案 |
|--------|------------|--------------------|
| Figma MCP 当前需要重新认证，计划阶段采用本地 Figma 插件 fallback | 宪法要求前端 UI spec 提供 Figma 设计源；不能伪造 node ID，插件能让后续认证恢复后可复现生成节点 | 只记录 HTML 原型或伪造 Figma 节点 ID。前者不足以满足 Figma 门禁，后者不可追溯。 |
| 不引入第三方图片缩放库，使用本地 React 状态实现大图缩放 | 交互范围有限，引入新依赖会增加体积和维护面；现有前端已可用 Pointer/Wheel/Keyboard 实现 | 直接安装 pan/zoom 依赖。对本轮需求来说成本和风险偏高。 |

## 第 0 阶段输出

- [research.md](./research.md)：大图交互、手势分区、手机 2 列功能卡、路线卡标签值布局、费用文案和 Figma fallback 决策。

## 第 1 阶段输出

- [data-model.md](./data-model.md)：功能展示截图组、手势区域、大图查看会话、手机功能卡、路线结果卡、费用文案项和 Figma 设计引用。
- [contracts/homepage-ui-polish.contract.md](./contracts/homepage-ui-polish.contract.md)：UI 状态、手势、响应式、三语、Figma 和非 API 不变量。
- [contracts/homepage-ui-polish-content.schema.json](./contracts/homepage-ui-polish-content.schema.json)：可校验的首页 UI polish 配置契约。
- [figma.md](./figma.md)：目标 Figma 文件、计划节点、MCP 认证限制、本地插件和回填要求。
- [figma-plugin/](./figma-plugin/)：用于生成 `Homepage UI Polish - 007` 设计节点的本地 Figma 插件。
- [quickstart.md](./quickstart.md)：实现完成后的验证步骤。
- [AGENTS.md](../../AGENTS.md)：Spec Kit 当前 plan 指向本文件。

## 第 1 阶段后宪法复查

| 门禁 | 结果 | 证据或后续动作 |
|------|------|----------------|
| 产品定位与范围边界 | 通过 | data-model 和 contracts 均限定在首页介绍、在线试查展示和下载前信任。 |
| 范围排除 | 通过 | UI contract 要求不扩大 Citybus / 城巴试查范围。 |
| 前后端分离与契约优先 | 通过 | 前端 UI contract 与内容 schema 已生成；后端 N/A 写明。 |
| OpenAPI 驱动的服务端接口文档 | 通过 | 无 API 变更；quickstart 记录可选未漂移检查。 |
| 三语国际化 | 通过 | contracts 和 quickstart 要求新增文案覆盖三语，并检查 `zh-Hant`/`en` 非机械直译。 |
| 试用查询与可靠降级 | 通过 | 不改变在线查询外部服务；路线卡缺失站点采用前端受控降级提示。 |
| 现代界面与可视化评审 | 通过 | Superpowers 原型、Figma 插件和 visual-review 截图要求已沉淀。 |
| 电脑与手机双端一致可用 | 通过 | figma.md、UI contract 和 quickstart 覆盖 1440px 与 390px。 |
| Figma 驱动的前端规格 | 通过 | 目标 Figma 文件和本地插件已提供；MCP 认证限制已记录，后续需回填节点。 |
| 服务端 DDD 架构 | 通过 | 本轮不涉及服务端代码，DDD 为 N/A。 |
| 服务端稳健性与可观测性 | 通过 | 本轮不涉及服务端入口或并发任务，沿用既有策略。 |
| 中文注释与代码可读性 | 通过 | 手势分流、大图缩放和平移、焦点管理已列入注释策略。 |
| 可验证交付与自动提交 | 通过 | quickstart 给出验证命令；本 plan 阶段完成后提交。 |
| Spec Kit 产物语言 | 通过 | plan、research、data-model、contracts、quickstart、figma 均使用简体中文。 |
