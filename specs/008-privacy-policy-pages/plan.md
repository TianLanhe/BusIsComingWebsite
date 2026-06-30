# 实施计划：隐私政策页面

**分支**：`codex/008-privacy-policy-pages` | **日期**：2026-06-30 | **规格**：[spec.md](./spec.md)

**输入**：来自 `/specs/008-privacy-policy-pages/spec.md` 的功能规格

**说明**：本计划由 `/speckit-plan` 生成。所有面向人阅读的阶段产物使用简体中文。

## 摘要

本功能为 BusIsComing 网站新增三语隐私政策页面：`/zh-hant/privacy/`、`/zh-hans/privacy/`、`/en/privacy/`。页面用于官网信任信息展示，并为未来 Android App 隐私政策跳转和 Google Play Console 隐私政策 URL 提供稳定目标。本轮只修改网站，不修改 Android App。

技术路线保持前后端分离但本轮仅涉及前端静态内容、页面渲染、SEO 页面组、sitemap 和站内 footer 入口。现有 SEO 模型需要从“按语言首页”升级为“页面类型 + 语言”的页面组模型，使首页和隐私政策页分别拥有独立 canonical、description、Open Graph/Twitter 元信息和 hreflang 互链。后端 Go 服务、下载 API、路线查询 API、OpenAPI 契约、服务端 DDD 分层和运行时日志策略均不变。

## 技术背景

**前端语言/版本**：TypeScript 5.7、React 18、Vite 6；以 `frontend/package.json` 与锁定依赖为准。

**后端语言/版本**：Go 1.26.3；本功能不修改后端代码。

**主要依赖**：React、CSS Modules、lucide-react、Vitest、Testing Library、Playwright、Ajv、Redocly CLI。无需新增生产依赖。

**数据与存储**：静态三语隐私政策内容、SEO 页面组配置、sitemap XML、Figma 设计引用和 UI/内容契约。不新增数据库、服务端持久化或新的浏览器存储。既有网站语言偏好本地存储逻辑保持不变。

**测试**：Vitest 覆盖隐私政策内容完整性、i18n 完整性、SEO 页面组、footer 入口和 sitemap；Playwright 覆盖桌面与手机隐私页首屏、摘要卡、正文分节、隐藏语言切换、footer 入口和无溢出；构建验证使用 `npm run build`，必要时运行 `npm run test:e2e`。

**目标平台**：桌面浏览器、手机浏览器、Vite 本地开发服务、现有静态前端 + Go API 服务部署入口、搜索引擎爬虫和未来 Android App Web 跳转。

**项目类型**：前后端分离 Web 应用。

**性能目标**：隐私页不新增大型依赖，不引入额外运行时数据请求；三语页面可静态生成；页面文本在手机和桌面首屏可读，不造成横向溢出；构建后产出三个隐私页 `index.html`。

**约束**：三语 i18n；`zh-Hant` 使用香港本地“私隱政策”语境；`en` 使用自然克制的政策表达；隐私页不显示语言切换控件；footer 只提供当前语言隐私入口；不修改 Android App；不新增主导航或 FAQ 入口；不提供完整出行路线规划或非 Citybus 查询能力。

**规模/范围**：3 个隐私政策 URL；1 套三语隐私政策内容；4 个首屏摘要卡；5 个正文章节；1 个 footer 隐私入口；1 组 SEO 页面组与 sitemap 更新；1 份 Figma 引用与 fallback 插件计划；1 组内容/UI/SEO 契约。服务端代码、Android App、OpenAPI、下载能力和在线查询能力不在本轮范围。

**i18n 范围**：新增或修改的用户可见文字必须覆盖 `zh-Hant`、`zh-Hans`、`en`，包括隐私页标题、首屏说明、摘要卡、正文五章、footer 隐私入口、页面元信息、可访问标签和返回首页链接。`zh-Hant` 按香港实用书面语独立撰写，`en` 避免中文句式直译，`zh-Hans` 使用自然简体中文。

**前后端契约**：本 feature 契约位于 `specs/008-privacy-policy-pages/contracts/`。`privacy-policy-pages.contract.md` 固定页面、SEO、footer、语言和范围不变量；`privacy-policy-content.schema.json` 固定隐私政策内容与 SEO 页面组字段。实现阶段如需长期共享，可同步到 `shared/contracts/`，但不得改变 HTTP API 契约。

**OpenAPI 接口文档**：N/A。本功能不新增、修改或移除服务端 HTTP API；既有下载 API 与路线查询 API 继续以 `shared/contracts/openapi/download-api.openapi.yaml`、`shared/contracts/openapi/route-query-api.openapi.yaml` 为权威来源。实现阶段如未触碰服务端 API，无需生成新的 OpenAPI 文档或中文 API UI。

**服务端 DDD 边界**：N/A。本功能不新增后端 bounded context，不修改 `downloads` 或 `routes` 领域、应用、基础设施和接口适配层。

**服务端稳健性与可观测性**：N/A。本功能不新增服务端入口、goroutine、后台任务、外部实时调用或日志输出。既有在线试查短期服务日志事实只作为隐私文案依据。

**代码注释与可读性**：实现阶段需要用清晰命名区分页面类型、语言和 SEO 页面组。仅在 SEO 页面组匹配、当前页面类型推导、构建时多页面生成或隐藏隐私页语言切换这类非显而易见边界处补充中文注释；普通内容映射和样式不加噪音注释。

**UI 可视化产物**：已沉淀 Superpowers 设计记录 [2026-06-30-privacy-policy-pages-design.md](../../docs/superpowers/specs/2026-06-30-privacy-policy-pages-design.md)。本计划新增 [figma.md](./figma.md) 与 `figma-plugin/` 作为 Figma 设计源 fallback。

**Figma 设计引用**：目标文件沿用 [BusIsComing Website Homepage v1 Spec](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=38-2)。用户已手工导入 fallback 设计并调整为最终设计稿；计划页面为 `Privacy Policy Pages - 008`，关键节点为 `Desktop 1440 / Privacy Policy Page`、`Mobile 390 / Privacy Policy Page`、`Footer Privacy Link States`、`SEO Hreflang Notes`、`Spec Notes`。真实 frame 节点链接已补录到 [figma.md](./figma.md)，实现阶段必须作为视觉和交互参考。

**双端适配范围**：桌面以 1440px 宽为主要视觉基准，手机以 390px 宽为主要视觉基准。验证首屏标题、范围说明、摘要卡、正文五章、footer 入口、隐藏语言切换和返回首页链接在两端均可读可用。

## 宪法检查

*门禁：必须在第 0 阶段研究前通过；第 1 阶段设计后必须复查。*

| 门禁 | 结果 | 证据或后续动作 |
|------|------|----------------|
| 产品定位与范围边界：覆盖软件介绍、试用查询、下载 App，反馈和联系为次要功能 | 通过 | 隐私页服务官网信任、下载前信息透明和未来 App 隐私跳转，不新增业务能力。 |
| 范围排除：不提供完整出行路线规划，也不提供地铁等其他交通工具查询 | 通过 | spec FR-018、FR-019 和正文范围均不新增路线规划或非 Citybus 查询。 |
| 前后端分离与契约优先：边界、契约和错误格式已记录 | 通过 | 前端负责静态页面、内容、SEO 和入口；后端 N/A；contracts 固定 UI/SEO/内容不变量。 |
| OpenAPI 驱动的服务端接口文档：服务端 HTTP API 已有 OpenAPI 3.1 YAML、中文 API UI、共享沉淀路径和验证方式 | 通过 | 本轮无 HTTP API 变更；下载和路线 OpenAPI 保持权威。 |
| 三语国际化：所有用户可见文字覆盖 `zh-Hant`、`zh-Hans`、`en`，且 `zh-Hant` 与 `en` 已按自然语气审校、未机械直译 | 通过 | research、data-model、contracts、quickstart 要求三语内容与语气审校。 |
| 试用查询与可靠降级：外部服务、缓存、超时和失败状态已设计 | 通过 | 隐私页不实时调用外部服务；外部服务不可用不影响页面完整展示。 |
| 现代界面与可视化评审：UI 讨论和展示有图片、截图、设计稿或可视化 mock | 通过 | 已完成 Superpowers mock 方案比较，选择“摘要卡 + 正文分节”。 |
| 电脑与手机双端一致可用：布局、交互和内容展示同时覆盖手机与电脑 | 通过 | 计划和 quickstart 覆盖桌面 1440px 与手机 390px。 |
| Figma 驱动的前端规格：前端/UI 功能已有 Figma 文件或链接作为后续阶段参考 | 通过 | figma.md 记录目标文件、计划节点、fallback 插件和已补录的真实 frame 链接。 |
| 服务端 DDD 架构：新增或重构的服务端代码按 DDD 层级、模块边界和依赖方向组织 | 通过 | 本轮不涉及服务端代码，DDD 为 N/A。 |
| 服务端稳健性与可观测性：panic/recover、协程安全和脱敏日志策略已定义 | 通过 | 本轮不涉及服务端入口或并发任务，沿用既有策略。 |
| 中文注释与代码可读性：复杂逻辑、领域规则和边界处理已有中文注释策略 | 通过 | 计划限定仅在 SEO 页面组、路径推导和构建生成边界处补充中文注释。 |
| 可验证交付与自动提交：验证命令、浏览器检查和本次 Spec Kit skill 后提交策略已定义 | 通过 | quickstart 定义测试、构建、浏览器和 GSC 检查；plan 完成后提交。 |
| Spec Kit 产物语言：本功能的 spec、plan、tasks 使用简体中文 | 通过 | spec、plan、research、data-model、contracts、quickstart、figma 均使用简体中文。 |

## 项目结构

### 文档（本功能）

```text
specs/008-privacy-policy-pages/
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
│   ├── privacy-policy-content.schema.json
│   └── privacy-policy-pages.contract.md
├── checklists/
│   └── requirements.md
└── visual-review/
```

### 源码（仓库根目录）

```text
frontend/
├── public/
│   └── sitemap.xml
├── scripts/
│   └── generate-locale-pages.mjs
├── src/
│   ├── app/
│   │   └── App.tsx
│   ├── components/
│   │   ├── privacy/
│   │   │   ├── PrivacyPolicyPage.tsx
│   │   │   └── PrivacyPolicyPage.module.css
│   │   ├── sections/
│   │   │   ├── FooterContact.tsx
│   │   │   └── Header.tsx
│   │   └── seo/
│   │       └── SeoHead.tsx
│   ├── content/
│   │   ├── privacyPolicyContent.ts
│   │   ├── seoPages.json
│   │   ├── seo.ts
│   │   └── types.ts
│   └── tests/
│       ├── content-contract.test.ts
│       ├── i18n-completeness.test.tsx
│       ├── privacy-policy-page.test.tsx
│       └── seo-routing.test.tsx
└── playwright/
    └── privacy-policy-pages.spec.ts

backend/
└── N/A，本功能不修改服务端代码。

shared/
└── contracts/
    └── N/A，本 plan 阶段不新增长期共享 HTTP API 契约；实现阶段可按需要同步内容 schema。
```

**结构决策**：前端新增 `components/privacy` 承载隐私政策页面展示；内容进入 `content/privacyPolicyContent.ts` 或等价内容模块；SEO 继续由 `content/seo.ts`、`seoPages.json` 和 `components/seo/SeoHead.tsx` 管理，但模型升级为页面组；构建脚本扩展为生成首页与隐私页的静态 HTML。服务端与共享 OpenAPI 不进入本轮实现范围。

## 复杂度跟踪

| 违规或复杂点 | 为什么必要 | 被拒绝的更简单方案 |
|--------------|------------|--------------------|
| SEO 从单一语言首页模型升级为页面类型 + 语言页面组 | 隐私页必须拥有自身 canonical/hreflang，不能 canonical 到首页，也不能与首页 hreflang 混组 | 只把 privacy 当首页子路由复用现有 `canonicalUrlForLocale`。这会导致隐私页 canonical/hreflang 错误。 |
| Figma 节点先采用本地插件 fallback，后续补录真实 frame 链接 | 宪法要求前端 UI spec 有 Figma 设计源；前期用本地插件导入并经用户调整为最终稿，连接恢复后已补录真实 frame 链接 | 只保留文字说明或伪造 Figma node ID。前者不足以满足门禁，后者不可追溯。 |

## 第 0 阶段输出

- [research.md](./research.md)：隐私页范围、信息架构、SEO 页面组、隐藏语言切换、footer 入口、短期服务日志表述、Figma fallback 决策。

## 第 1 阶段输出

- [data-model.md](./data-model.md)：隐私政策页面、摘要卡、政策章节、SEO 页面组、footer 隐私入口、Figma 设计引用。
- [contracts/privacy-policy-pages.contract.md](./contracts/privacy-policy-pages.contract.md)：页面、内容、SEO、footer、语言、范围和非 API 不变量。
- [contracts/privacy-policy-content.schema.json](./contracts/privacy-policy-content.schema.json)：三语隐私政策内容与 SEO 页面组配置的可校验 schema。
- [figma.md](./figma.md)：目标 Figma 文件、关键真实 frame 链接、本地插件 fallback 和实现引用要求。
- [figma-plugin/](./figma-plugin/)：用于生成 `Privacy Policy Pages - 008` 设计节点的本地 Figma 插件。
- [quickstart.md](./quickstart.md)：实现完成后的验证步骤与部署后 GSC 操作。
- [AGENTS.md](../../AGENTS.md)：Spec Kit 当前 plan 指向本文件。

## 第 1 阶段后宪法复查

| 门禁 | 结果 | 证据或后续动作 |
|------|------|----------------|
| 产品定位与范围边界 | 通过 | data-model 和 contracts 均限定为官网信任页与未来 App 隐私跳转目标，不新增查询能力。 |
| 范围排除 | 通过 | contracts 明确不新增完整出行规划、非 Citybus 查询或 Android App 行为。 |
| 前后端分离与契约优先 | 通过 | 本功能契约位于 `specs/008-privacy-policy-pages/contracts/`；后端 N/A。 |
| OpenAPI 驱动的服务端接口文档 | 通过 | 无服务端 HTTP API 变更；quickstart 记录 OpenAPI 未漂移检查条件。 |
| 三语国际化 | 通过 | data-model、schema 和 quickstart 要求 `zh-Hant`、`zh-Hans`、`en` 完整覆盖与语气审校。 |
| 试用查询与可靠降级 | 通过 | 隐私页不实时依赖外部服务；查询日志仅作为说明事实。 |
| 现代界面与可视化评审 | 通过 | 已有 Superpowers 设计记录、figma.md 和本地插件 fallback。 |
| 电脑与手机双端一致可用 | 通过 | quickstart 要求桌面 1440px 和手机 390px 验证。 |
| Figma 驱动的前端规格 | 通过 | figma.md 和 figma-plugin 已作为计划阶段设计源，认证恢复后已补录真实 frame 链接。 |
| 服务端 DDD 架构 | 通过 | 本轮不涉及服务端代码，DDD 为 N/A。 |
| 服务端稳健性与可观测性 | 通过 | 本轮不涉及服务端入口或并发任务，沿用既有策略。 |
| 中文注释与代码可读性 | 通过 | 计划限定 SEO 页面组和路径推导等复杂边界需中文注释。 |
| 可验证交付与自动提交 | 通过 | quickstart 给出测试、构建、浏览器、SEO 和 GSC 检查；plan 完成后提交。 |
| Spec Kit 产物语言 | 通过 | 008 产物均使用简体中文。 |
