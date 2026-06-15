# 实施计划：Android APK 下载

**分支**：`main` | **日期**：2026-06-16 | **规格**：[spec.md](./spec.md)

**输入**：来自 `/specs/002-android-apk-download/spec.md` 的功能规格

**说明**：本模板由 `/speckit-plan` 填写。所有面向人阅读的阶段产物必须使用简体中文。

## 摘要

本功能把首页 Android 下载入口从“资源待接入”升级为真实可下载：将 Android 主项目的当前 `BusIsComing.apk` 复制到网站后端受管空间并纳入仓库管理，后端通过稳定下载入口返回当前 APK，前端只消费公开契约和同源下载路径。用户在首屏或下载区点击 Android 下载即可获得同一个当前 APK；iPhone 继续保持暂未支持。

技术路线采用最小前后端分离实现：前端仍为 React + Vite 首页，更新下载 manifest、三语文案、按钮测试和桌面/手机下载验证；后端新增 Go 1.26 + Gin 服务，只提供 APK 下载和当前文件校验，不引入数据库。后端代码按 DDD bounded context 组织，把当前 APK、校验规则和下载结果放在领域层，把下载用例放在应用层，把文件系统与哈希计算放在基础设施层，把 HTTP 路由放在接口适配层。共享契约记录下载 API、APK 元数据和 UI 状态，确保前端不依赖后端内部文件路径。

## 技术背景

**前端语言/版本**：TypeScript 5.7，React 18，Vite 6；以 `frontend/package.json` 和 lockfile 为准。

**后端语言/版本**：Go 1.26；本机验证版本为 `go1.26.3`。本功能新增最小 Go 后端服务。

**主要依赖**：前端沿用 React、Vite、lucide-react、Vitest、Playwright；后端采用 Gin 处理 HTTP 路由和响应。后端不引入 MySQL 或其他数据库。

**数据与存储**：文件系统中的当前 APK 与元数据 JSON。计划路径为 `backend/downloads/android/BusIsComing.apk` 和 `backend/downloads/android/current.json`；只保留一个当前 APK 文件。

**测试**：后端使用 Go 单元测试和 `httptest` 覆盖成功下载、文件缺失、校验失败和响应头；前端使用 Vitest 覆盖 manifest、三语文案和 iPhone 不下载；Playwright 覆盖桌面与手机下载入口、下载文件校验和截图证据；手动或脚本使用 `curl` 与 `shasum -a 256` 做端到端核验。

**目标平台**：手机浏览器、桌面浏览器、Vite 本地开发服务、Go API 服务、后续静态前端 + API 服务部署。

**项目类型**：前后端分离 Web 应用

**性能目标**：下载入口在正常本地或部署环境下 2 秒内开始返回 APK；当前 4.8 MB APK 不影响首页首屏渲染；下载前文件大小和 SHA-256 校验在 1 秒内完成；桌面 1440px 和手机 390px 下下载状态不重叠、不截断、不触发布局跳动。

**约束**：三语 i18n；现代、简洁、优雅；移动端和桌面端同时可用；后端必须采用 DDD 分层且 `domain` 不得依赖 Gin、文件系统、哈希实现或前端契约；后端不得泄露本机私有路径或内部地址；下载失败必须清楚降级；不得新增完整出行路线规划、非香港巴士查询、iPhone 下载或历史版本浏览。

**规模/范围**：1 个后端下载端点；1 个后端元数据文件；1 个 APK 文件；1 份下载 API 契约；1 份下载 manifest 契约；前端 2 个下载入口复用同一按钮组件；3 种语言；2 个主要 viewport 验证。

**i18n 范围**：必须覆盖 `zh-Hant`、`zh-Hans` 和 `en`。新增文案包括 Android 可下载描述、版本与大小、下载失败/不可用提示；iPhone 仍为暂未支持。

**前后端契约**：本功能契约位于 `specs/002-android-apk-download/contracts/`，实现阶段同步到 `shared/contracts/`。`download-api.openapi.yaml` 固定下载端点、响应头和错误格式；`download-manifest.schema.json` 固定前端下载 manifest 与 APK 元数据；`ui-state-contract.md` 固定下载按钮状态和双端不变量。

**服务端 DDD 边界**：bounded context 为 `downloads`。领域层包含当前 APK、APK 元数据、校验错误和下载结果等领域概念；应用层包含“下载当前 Android APK”用例和端口；基础设施层包含受管 APK 文件读取、元数据读取和 SHA-256 计算适配；接口适配层包含 Gin HTTP handler、路由注册和错误映射。依赖方向只能是 interfaces/infrastructure -> application -> domain，domain 不依赖外层。

**UI 可视化产物**：沿用首页 v1 Figma 下载按钮和双端首页节点；实现阶段需要保存桌面、手机、Android 可下载展开态、iPhone 暂未支持态截图到 `specs/002-android-apk-download/visual-review/`。

**Figma 设计引用**：[BusIsComing Website - Homepage v1 Spec](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU)。关键节点：`03 Download Button Interaction States`（node `4:326`）、`01 Desktop Homepage / 1440`（node `4:2`）、`02 Mobile Homepage / 390`（node `4:183`）。本功能不改变页面结构，只更新 Android 可用态和简短元数据。

**双端适配范围**：桌面 1440px 宽与手机 390px 宽为主要设计基准；实现需额外检查常见窄屏，确保首屏和下载区中的 Android 下载入口、iPhone 状态、版本和大小信息可读可操作。

## 宪法检查

*门禁：必须在第 0 阶段研究前通过；第 1 阶段设计后必须复查。*

| 门禁 | 结果 | 证据或后续动作 |
|------|------|----------------|
| 产品定位与范围边界：覆盖软件介绍、试用查询、下载 App，反馈和联系为次要功能 | 通过 | 本功能只增强“下载 App”核心范围；不改变首页其他信息架构。 |
| 范围排除：不提供完整出行路线规划，也不提供地铁等其他交通工具查询 | 通过 | `spec.md` FR-014 明确排除；计划不增加任何查询能力。 |
| 前后端分离与契约优先：边界、契约和错误格式已记录 | 通过 | 前端、后端和共享契约边界已记录；契约位于 `contracts/`。 |
| 三语国际化：所有用户可见文字覆盖 `zh-Hant`、`zh-Hans`、`en` | 通过 | 新增下载可用、版本大小、失败和不可用文案必须进入现有 i18n 内容模型。 |
| 试用查询与可靠降级：外部服务、缓存、超时和失败状态已设计 | 通过 | 不接入实时交通服务；APK 缺失或校验失败时返回错误并展示不可用状态。 |
| 现代界面与可视化评审：UI 讨论和展示有图片、截图、设计稿或可视化 mock | 通过 | 沿用 Figma 下载按钮设计；实现阶段保存双端截图证据。 |
| 电脑与手机双端一致可用：布局、交互和内容展示同时覆盖手机与电脑 | 通过 | 计划要求桌面 1440px 和手机 390px Playwright 验证。 |
| Figma 驱动的前端规格：前端/UI 功能已有 Figma 文件或链接作为后续阶段参考 | 通过 | Figma 文件与关键节点已记录在本计划和 `figma.md`。 |
| 服务端 DDD 架构：新增或重构的服务端代码按 DDD 层级、模块边界和依赖方向组织 | 通过 | bounded context 为 `downloads`；结构决策列出 domain、application、infrastructure、interfaces 层。 |
| 可验证交付与自动提交：验证命令、浏览器检查和本次 Spec Kit skill 后提交策略已定义 | 通过 | `quickstart.md` 定义后端、前端、端到端和哈希校验；本 skill 完成后提交。 |
| Spec Kit 产物语言：本功能的 spec、plan、tasks 使用简体中文 | 通过 | 当前 plan、research、data-model、quickstart、figma 使用简体中文；代码标识和协议名保留原文。 |

## 项目结构

### 文档（本功能）

```text
specs/002-android-apk-download/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── figma.md
├── contracts/
│   ├── download-api.openapi.yaml
│   ├── download-manifest.schema.json
│   └── ui-state-contract.md
└── tasks.md
```

### 源码（仓库根目录）

```text
frontend/
├── vite.config.ts
├── playwright.config.ts
├── src/
│   ├── components/download/
│   │   ├── DownloadSegmentedButton.tsx
│   │   └── DownloadSegmentedButton.module.css
│   ├── components/sections/
│   │   └── DownloadSection.tsx
│   ├── content/
│   │   ├── downloadManifest.ts
│   │   ├── types.ts
│   │   └── uiCopy.ts
│   └── tests/
└── playwright/

backend/
├── go.mod
├── go.sum
├── README.md
├── cmd/server/
│   └── main.go
├── downloads/android/
│   ├── BusIsComing.apk
│   └── current.json
└── internal/downloads/
    ├── domain/
    │   ├── artifact.go
    │   ├── checksum.go
    │   └── download_result.go
    ├── application/
    │   ├── download_current_apk.go
    │   └── ports.go
    ├── infrastructure/
    │   └── filesystem/
    │       ├── artifact_repository.go
    │       └── checksum_calculator.go
    └── interfaces/
        └── http/
            ├── handler.go
            └── routes.go

shared/
└── contracts/
    ├── download-api.openapi.yaml
    ├── download-manifest.schema.json
    └── ui-state-contract.md
```

**结构决策**：后端采用最小 Go 服务，APK 文件与元数据放在 `backend/downloads/android/`，入口放在 `backend/cmd/server/`，下载 bounded context 放在 `backend/internal/downloads/`。`domain` 只表达当前 APK、校验和下载结果等领域规则；`application` 编排下载当前 APK 用例；`infrastructure/filesystem` 读取文件、元数据并计算哈希；`interfaces/http` 只做 HTTP 协议转换和错误映射。本功能不需要数据库；MySQL 仍保留给后续真实查询或内容服务。前端继续通过现有下载按钮组件消费 manifest，不直接读取后端内部文件路径。

## 复杂度跟踪

无宪法违规。新增后端服务是必要复杂度，因为用户明确要求“从服务端下载 APK”，且项目宪法要求前后端边界清晰；按 DDD 分层会比单文件 handler 更重，但它是当前宪法要求的服务端默认结构。被拒绝的更简单方案是静态文件直链或把校验规则直接写进 handler，因为它们削弱错误处理、校验、测试和后续管理能力。

## 第 0 阶段输出

- [research.md](./research.md)：后端技术、DDD bounded context、受管 APK 布局、下载端点、校验策略、前端接入、测试和部署边界决策。

## 第 1 阶段输出

- [data-model.md](./data-model.md)：当前 APK、下载平台状态、下载 manifest、下载结果、错误状态和 DDD 层级边界实体。
- [contracts/download-api.openapi.yaml](./contracts/download-api.openapi.yaml)：Android APK 下载 API 契约。
- [contracts/download-manifest.schema.json](./contracts/download-manifest.schema.json)：前端下载 manifest 与 APK 元数据契约。
- [contracts/ui-state-contract.md](./contracts/ui-state-contract.md)：下载按钮 UI 状态、iPhone 不下载、双端和 i18n 不变量。
- [figma.md](./figma.md)：Figma 文件、节点、视觉验收和是否需要更新设计说明。
- [quickstart.md](./quickstart.md)：实现完成后的验证步骤。

## 第 1 阶段后宪法复查

| 门禁 | 结果 | 证据或后续动作 |
|------|------|----------------|
| 产品定位与范围边界 | 通过 | 数据模型和契约均限制为 Android App 下载。 |
| 范围排除 | 通过 | 契约没有任何路线规划、非巴士查询或 iPhone 下载能力。 |
| 前后端分离与契约优先 | 通过 | OpenAPI、manifest schema 和 UI 状态契约已定义；前端只使用公开下载 URL。 |
| 三语国际化 | 通过 | `downloadManifest` schema 要求所有用户可见文案覆盖三语。 |
| 试用查询与可靠降级 | 通过 | 不接入实时交通服务；下载错误格式覆盖缺失、不可读和校验失败。 |
| 现代界面与可视化评审 | 通过 | Figma 引用保留；quickstart 要求保存桌面与手机截图。 |
| 电脑与手机双端一致可用 | 通过 | UI 状态契约和 quickstart 覆盖桌面 1440px 与手机 390px。 |
| Figma 驱动的前端规格 | 通过 | `figma.md` 记录 Figma URL、节点和本 feature 的状态更新说明。 |
| 服务端 DDD 架构 | 通过 | `data-model.md` 记录领域概念，plan 记录 `downloads` bounded context、层级职责和依赖方向。 |
| 可验证交付与自动提交 | 通过 | quickstart 覆盖 Go、前端、Playwright、curl 和 SHA-256 验证；本次 plan 完成后提交。 |
| Spec Kit 产物语言 | 通过 | 本阶段产物使用简体中文，技术标识保持原文。 |
