# 实施计划：首页体验精修

**分支**：`codex/005-homepage-experience-polish` | **日期**：2026-06-24 | **规格**：[spec.md](./spec.md)

**输入**：来自 `/specs/005-homepage-experience-polish/spec.md` 的功能规格

**说明**：本计划由 `/speckit-plan` 生成。所有面向人阅读的阶段产物必须使用简体中文。

## 摘要

本功能把首页已有的 UI v2 做一次聚焦体验精修：首屏功能轮播从“主图 + 底部缩略图堆叠”改为低旋转阶梯牌堆，3 秒按功能场景自动切换，支持左右滑动/拖动切换场景，支持点击场景点点切换到对应场景，同一场景多图只通过点击后方牌堆图片切换主图，去掉 `01/02/03/04` 编号，并把“禁止底部缩略图、胶片条、图片按钮组、常驻箭头”的验收要求写入契约。品牌区改用 Android App 真实图标前景中的巴士主体，裁掉 launcher 背景底板；导航和页脚从“支持我们”语义改为“联系我们”，底部邮箱改为 `hezhenyu966@gmail.com`。

技术路线保持前后端分离但本轮仅改前端：首页 React/Vite 内容模型、轮播组件、品牌资产、三语文案、测试与视觉验收。后端下载服务和在线查询 API 不新增、不修改、不移除；既有 OpenAPI 契约保持不变。计划阶段生成首页体验契约、内容/品牌数据模型、Figma 设计引用和验证 quickstart。计划阶段曾使用一次性本地导入工具生成 Figma 节点；实际节点信息已回填，临时工具文件已删除。

## 技术背景

**前端语言/版本**：TypeScript 5.7、React 18、Vite 6；以 `frontend/package.json` 和 `frontend/package-lock.json` 为准。

**后端语言/版本**：Go 1.26.3；本功能不修改后端代码，仍以现有 `backend/go.mod` 为准。

**主要依赖**：前端沿用 React、Vite、lucide-react、Vitest、Playwright、Ajv、Sharp。Sharp 可用于导出透明 logo 资产；Playwright 用于双端截图和轮播交互验证；Ajv 用于内容/资产契约校验。

**数据与存储**：静态首页内容、三语 i18n 文案、真实脱敏截图 manifest、品牌 logo 静态资产和 Figma 设计引用。不新增数据库或服务端持久化。

**测试**：Vitest 覆盖内容契约、i18n 完整性、轮播行为、logo 来源、联系邮箱和旧文案清除；Playwright 覆盖桌面 1440px、手机 390px 的首屏轮播、滑动/拖动、无底部缩略图、无编号、真实 logo、联系入口和邮箱；构建验证使用前端 `npm run build`。

**目标平台**：桌面浏览器、手机浏览器、Vite 本地开发服务、后续静态前端 + API 服务部署入口。

**项目类型**：前后端分离 Web 应用。

**性能目标**：首屏轮播自动切换间隔约 3 秒；轮播切换动画控制在用户可感知但不拖沓的 300-700ms；新增 logo 资产保持小体积透明图，避免替换后增加明显首屏负担；桌面 1440px 和手机 390px 下 header、hero、轮播、语言切换和联系入口无重叠、无截断、可操作。

**约束**：三语 i18n；`zh-Hant` 独立香港实用书面语；`en` 使用自然克制的英语产品表达；
三语不得机械直译、逐句搬运、过度口语化或过分官方严肃；现代、简洁、优雅；禁止底部缩略图
堆叠、胶片条、图片按钮组和常驻箭头；同场景多图必须使用低旋转阶梯牌堆，桌面约 5 度、手机
可收敛，后方图片底部不得低于主图底部；logo 必须来自 Android 真实图标前景主体；当前聚焦
Citybus / 城巴，不提供九巴、港铁、铁路、渡轮或完整出行规划；不新增服务端 HTTP API。

**规模/范围**：1 个首页首屏功能轮播重构；1 组品牌 logo 资产替换；header/footer 联系入口和邮箱更新；全站用户可见文案三语审校；2 份 feature 契约；1 份 Figma 设计引用；桌面和手机两类视觉验收截图。服务端代码、下载 API 和在线查询 API 均不在本轮范围。

**i18n 范围**：必须覆盖 `zh-Hant`、`zh-Hans` 和 `en`。审校范围包括 header、hero、轮播、功能卡、
在线查询区、下载区、FAQ、footer、按钮、状态提示、错误提示、图片 alt 和 aria 文案。`zh-Hant`
采用香港实用书面语；`en` 使用自然克制的英语产品表达；`zh-Hans` 使用自然简体中文。三语保持
同一产品事实，但不得机械直译、逐句搬运、过度口语化或过分官方严肃。

**前后端契约**：本 feature 契约位于 `specs/005-homepage-experience-polish/contracts/`。`homepage-experience-polish.contract.md` 固定轮播、logo、联系方式、文案和视觉验收不变量；`homepage-experience-content.schema.json` 固定可检查的内容、品牌和交互配置字段。实现阶段如需同步长期共享契约，更新 `shared/contracts/homepage-content.schema.json` 和 `shared/contracts/ui-state-contract.md`，但不得改变服务端 API 契约。

**OpenAPI 接口文档**：N/A。本功能不新增、修改或移除服务端 HTTP API；既有下载 API 和路线查询 API 继续以 `shared/contracts/openapi/download-api.openapi.yaml`、`shared/contracts/openapi/route-query-api.openapi.yaml` 为权威来源。实现阶段可运行现有 OpenAPI lint 作为“未漂移”检查，但本 feature 不生成新的 OpenAPI 文档。

**服务端 DDD 边界**：N/A。本功能不新增后端 bounded context，不修改 `downloads` 或 `routes` 领域、应用、基础设施和接口适配层。

**服务端稳健性与可观测性**：N/A。本功能不新增服务端入口、goroutine、后台任务或外部实时服务。既有 HTTP recovery、请求日志和脱敏策略保持不变。

**代码注释与可读性**：实现阶段需要用中文注释解释非显而易见的轮播状态机、滑动/拖动阈值、自动暂停/恢复、减少动态效果、logo 裁切来源和文案审校边界。普通样式、简单赋值、直接文案映射不加噪音注释。

**UI 可视化产物**：最终 Superpowers 牌堆原型已沉淀在 [轮播牌堆设计记录](../../docs/superpowers/specs/2026-06-25-homepage-carousel-stair-deck-design.md)，对应可打开原型 [HTML](../../docs/superpowers/prototypes/2026-06-25-homepage-carousel-stair-deck.html)。Figma 设计引用沉淀在 `figma.md`。

**Figma 设计引用**：目标文件沿用 [BusIsComing Website - Homepage v1 Spec](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU)。页面为 `Homepage Experience Polish - 005`，关键节点为 `Desktop 1440 / Stair Card Deck`（`29:3`）、`Mobile 390 / Stair Card Deck`（`29:44`）、`Carousel States / Scene Dots and Deck Click`（`29:83`）、`Brand Contact States`（`29:101`）、`Spec Notes`（`29:108`）。

**双端适配范围**：桌面以 1440px 宽为主要视觉基准，手机以 390px 宽为主要视觉基准。验证覆盖 header logo、语言切换、hero 文案、轮播主图、低旋转牌堆、手动滑动/拖动、下载入口、在线查询入口和页脚联系入口。

## 宪法检查

*门禁：必须在第 0 阶段研究前通过；第 1 阶段设计后必须复查。*

| 门禁 | 结果 | 证据或后续动作 |
|------|------|----------------|
| 产品定位与范围边界：覆盖软件介绍、试用查询、下载 App，反馈和联系为次要功能 | 通过 | 本功能只精修首页软件介绍、下载前信任和联系入口，不新增业务能力。 |
| 范围排除：不提供完整出行路线规划，也不提供地铁等其他交通工具查询 | 通过 | `spec.md` FR-020 和文案策略要求继续明确 Citybus / 城巴范围与排除项。 |
| 前后端分离与契约优先：边界、契约和错误格式已记录 | 通过 | 前端负责 UI、内容和资产；后端 N/A；feature contracts 固定 UI 与内容不变量。 |
| OpenAPI 驱动的服务端接口文档：服务端 HTTP API 已有 OpenAPI 3.1 YAML、中文 API UI、共享沉淀路径和验证方式 | 通过 | 本轮无 HTTP API 变更；既有下载和路线 OpenAPI 保持权威，quickstart 可运行未漂移检查。 |
| 三语国际化：所有用户可见文字覆盖 `zh-Hant`、`zh-Hans`、`en` | 通过 | i18n 范围覆盖所有用户可见文字；contracts 和 quickstart 要求三语检查。 |
| 试用查询与可靠降级：外部服务、缓存、超时和失败状态已设计 | 通过 | 不新增实时外部服务；在线查询区只改文案和页面呈现，路线查询降级策略沿用 `004`。 |
| 现代界面与可视化评审：UI 讨论和展示有图片、截图、设计稿或可视化 mock | 通过 | 已有 Superpowers mock；本计划新增 Figma 设计引用和后续 visual-review 截图要求。 |
| 电脑与手机双端一致可用：布局、交互和内容展示同时覆盖手机与电脑 | 通过 | 桌面 1440px 与手机 390px 轮播和联系入口均进入 quickstart 验证。 |
| Figma 驱动的前端规格：前端/UI 功能已有 Figma 文件或链接作为后续阶段参考 | 通过 | 已记录目标 Figma 文件、页面和真实节点 ID。 |
| 服务端 DDD 架构：新增或重构的服务端代码按 DDD 层级、模块边界和依赖方向组织 | 通过 | 本轮不新增或重构服务端代码，DDD 为 N/A。 |
| 服务端稳健性与可观测性：panic/recover、协程安全和脱敏日志策略已定义 | 通过 | 本轮不触碰服务端入口或并发任务，沿用既有 recovery/logging。 |
| 中文注释与代码可读性：复杂逻辑、领域规则和边界处理已有中文注释策略 | 通过 | 计划列出轮播状态、手势阈值、logo 来源和文案审校边界需要中文注释。 |
| 可验证交付与自动提交：验证命令、浏览器检查和本次 Spec Kit skill 后提交策略已定义 | 通过 | quickstart 定义 Vitest、build、Playwright、Figma 节点和截图验收；本 plan 完成后提交。 |
| Spec Kit 产物语言：本功能的 spec、plan、tasks 使用简体中文 | 通过 | 当前 spec、plan、research、data-model、contracts、quickstart、figma 使用简体中文；代码标识和第三方原文保持原文。 |

## 项目结构

### 文档（本功能）

```text
specs/005-homepage-experience-polish/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── figma.md
├── contracts/
│   ├── homepage-experience-content.schema.json
│   └── homepage-experience-polish.contract.md
├── checklists/
│   └── requirements.md
└── visual-review/
```

### 源码（仓库根目录）

```text
frontend/
├── src/
│   ├── assets/
│   │   ├── app-screenshots/real/
│   │   └── brand/
│   ├── components/
│   │   ├── hero/
│   │   │   ├── AppPreviewCarousel.tsx
│   │   │   ├── AppPreviewCarousel.module.css
│   │   │   ├── ScreenshotStack.tsx
│   │   │   └── ScreenshotStack.module.css
│   │   └── sections/
│   │       ├── Header.tsx
│   │       ├── Header.module.css
│   │       ├── FooterContact.tsx
│   │       └── FooterContact.module.css
│   ├── content/
│   │   ├── carouselSlides.ts
│   │   ├── homepageContent.ts
│   │   ├── onlineQueryDemo.ts
│   │   ├── sectionsContent.ts
│   │   ├── sourceReferences.ts
│   │   ├── types.ts
│   │   └── uiCopy.ts
│   └── tests/
│       ├── content-contract.test.ts
│       ├── hero-carousel.test.tsx
│       ├── i18n-completeness.test.tsx
│       └── sections-content.test.ts
└── playwright/
    ├── hero-carousel.spec.ts
    ├── homepage-hero.spec.ts
    └── homepage-sections.spec.ts

backend/
└── N/A，本功能不修改服务端代码。

shared/
└── contracts/
    ├── homepage-content.schema.json
    └── ui-state-contract.md
```

**结构决策**：前端继续在现有 `components/hero` 和 `content` 模块内演进，不新建页面或改动路由。`ScreenshotStack` 负责低旋转阶梯牌堆的主图、后方图和点击区域，功能场景切换状态仍归 `AppPreviewCarousel` 负责。品牌资产进入 `frontend/src/assets/brand/`，README 必须记录 Android 前景图标来源。共享契约先在 feature contracts 中定义，若实现改变长期内容结构，则同步 `shared/contracts/`。

## 复杂度跟踪

无宪法违规。需要接受的复杂度来自两点：一是计划阶段 Figma 写入工具不可用，不能伪造节点 ID，必须先导入真实设计节点再回填；二是轮播必须支持自动播放、手动滑动/拖动、暂停和减少动态效果，不能用简单图片替换。被拒绝的更简单方案包括只把间隔改为 3 秒、只隐藏底部缩略图、只替换邮箱、或继续使用 launcher 背景图标；这些方案无法防止再次偏离用户确认的 A 方案，也无法满足项目 Figma、三语和视觉验收门禁。

## 第 0 阶段输出

- [research.md](./research.md)：轮播交互、手势与可访问性、logo 资产管线、香港繁中文案策略、Figma 节点沉淀、契约与验证策略决策。

## 第 1 阶段输出

- [data-model.md](./data-model.md)：功能轮播页、截图组、品牌 logo 资产、联系入口、本地化文案项、视觉验收证据和状态转换。
- [contracts/homepage-experience-polish.contract.md](./contracts/homepage-experience-polish.contract.md)：轮播、logo、联系方式、i18n、响应式、Figma 和验证不变量。
- [contracts/homepage-experience-content.schema.json](./contracts/homepage-experience-content.schema.json)：可校验的首页体验内容、品牌和交互配置契约。
- [figma.md](./figma.md)：目标 Figma 文件、页面、真实节点 ID 和版本说明。
- [quickstart.md](./quickstart.md)：实现完成后的验证步骤。
- [AGENTS.md](../../AGENTS.md)：Spec Kit 当前 plan 指向本文件。

## 第 1 阶段后宪法复查

| 门禁 | 结果 | 证据或后续动作 |
|------|------|----------------|
| 产品定位与范围边界 | 通过 | data-model 和 contracts 均限定在首页介绍、下载前信任和联系入口。 |
| 范围排除 | 通过 | UI contract 要求所有范围说明继续排除九巴、港铁、铁路、渡轮和完整规划。 |
| 前后端分离与契约优先 | 通过 | 前端契约与内容 schema 已生成；后端 N/A 写明。 |
| OpenAPI 驱动的服务端接口文档 | 通过 | 无 API 变更；quickstart 记录可选未漂移检查。 |
| 三语国际化 | 通过 | schema、UI contract、copy review 和 quickstart 均要求 `zh-Hant`、`zh-Hans`、`en` 覆盖，并检查 `zh-Hant`/`en` 非机械直译和自然克制语气。 |
| 试用查询与可靠降级 | 通过 | 不改变在线查询外部服务；文案仍限制为 Citybus / 城巴试用查询。 |
| 现代界面与可视化评审 | 通过 | Superpowers mock、Figma 节点引用和 visual-review 截图要求已沉淀。 |
| 电脑与手机双端一致可用 | 通过 | figma.md、UI contract 和 quickstart 覆盖 1440px 与 390px。 |
| Figma 驱动的前端规格 | 通过 | 提供目标 Figma 文件、页面和真实节点 ID。 |
| 服务端 DDD 架构 | 通过 | 本轮不涉及服务端代码，DDD 为 N/A。 |
| 服务端稳健性与可观测性 | 通过 | 本轮不涉及服务端入口或并发任务，沿用既有策略。 |
| 中文注释与代码可读性 | 通过 | 复杂轮播状态、手势、logo 来源和文案审校边界已列入注释策略。 |
| 可验证交付与自动提交 | 通过 | quickstart 给出验证命令；本 plan 阶段完成后提交。 |
| Spec Kit 产物语言 | 通过 | plan、research、data-model、contracts、quickstart、figma 均使用简体中文。 |
