# 实施计划：第一版网站主页

**分支**：`main` | **日期**：2026-06-16 | **规格**：[spec.md](./spec.md)

**输入**：来自 `/specs/001-homepage-v1/spec.md` 的功能规格

**说明**：本模板由 `/speckit-plan` 填写。所有面向人阅读的阶段产物必须使用简体中文。

## 摘要

第一版主页要把 BusIsComing 建立为可信的香港巴士查询 Android App 主页：首屏让用户识别产品、理解真实 App 能力并优先下载 Android APK；首屏右侧以 Figma 已确认的 App 功能预览轮播展示常用路线、路线比较、多班 ETA/路线详情、短时通知监测；页面下方提供核心功能、在线查询静态演示、下载区、常见问题、反馈与联系入口。

技术路线采用前后端分离的 Web 应用结构。第一版只实现前端静态主页和共享内容契约，不产出服务端代码，也不启用实时查询后端；在线查询区明确为静态演示。共享契约会先定义首页内容、下载平台状态和 UI 状态，为后续基于 Go 1.26、Gin、MySQL 的真实在线查询服务、下载 manifest 或内容服务接入保留边界。

## 技术背景

**前端语言/版本**：TypeScript，面向现代浏览器的 ES module 构建；具体 TypeScript 版本由实现阶段的包管理文件锁定。

**后端语言/版本**：第一版不产出服务端代码、不运行后端服务；后续服务端技术栈按 Go 1.26 规划。

**主要依赖**：React + Vite 用于新建前端应用；CSS Modules 或等价 scoped CSS 管理样式；lucide-react 或等价图标库用于按钮、导航、功能项和状态图标；后续服务端默认采用 Gin 与 MySQL；不引入大型 UI 套件，避免偏离已确认 Figma 视觉。

**数据与存储**：第一版使用静态内容资源和共享契约；用户语言偏好可持久化在浏览器本地偏好中；不需要数据库。

**测试**：单元与组件测试覆盖 i18n 内容、下载状态、轮播状态和静态数据契约；浏览器端验证覆盖桌面与手机 viewport、下载 hover/focus、语言切换和视觉稳定性。

**目标平台**：手机浏览器、桌面浏览器、静态托管前端；后续可接入 Go + Gin 独立 API 服务。

**项目类型**：前后端分离 Web 应用。

**性能目标**：首屏核心内容在常见桌面与手机网络条件下快速可见；主页静态资源应控制在适合静态托管的体量内；App 截图需使用合理尺寸和格式，避免阻塞首屏；桌面 1440 宽与手机 390 宽验证不出现核心内容重叠、按钮不可见或横向溢出。

**约束**：三语 i18n；现代、简洁、优雅；桌面与手机双端适配；产品事实可追溯到 Android 主项目；在线查询第一版仅静态演示；不得提供完整出行规划或非香港巴士交通查询；不得编造实时 Citybus / DATA.GOV.HK 数据；Figma 为主要视觉源。

**规模/范围**：单页主页；6 个页面区块；4 个轮播项；3 个下载按钮状态；3 种语言；第一版 0 个实时查询 API；至少 2 个响应式 viewport 验证。

**i18n 范围**：必须覆盖 `zh-Hant`、`zh-Hans` 和 `en`。默认优先浏览器语言；无匹配时使用 `zh-Hant`。

**前后端契约**：功能级契约位于 `specs/001-homepage-v1/contracts/`；后续实现应把稳定版本复制或映射到 `shared/contracts/`。契约包括首页内容 schema、下载 manifest schema 和 UI 状态契约。第一版无实时 API 错误格式，下载资源不可用时使用 manifest 中的不可用状态和用户可读原因；未来后端接口由 Go 1.26 + Gin 服务消费/暴露这些共享契约，并以 MySQL 承接需要持久化的内容或查询数据。

**UI 可视化产物**：用户提供的三张参考图；会话中生成的下载按钮三状态对比图、首页单页结构预览图；Figma 文件作为后续实现主视觉源。

**Figma 设计引用**：[BusIsComing Website - Homepage v1 Spec](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU)。关键节点：`01 Desktop Homepage / 1440`（node `4:2`）、`02 Mobile Homepage / 390`（node `4:183`）、`03 Download Button Interaction States`（node `4:326`）、`04 Hero Carousel States`（node `4:357`）。详见 [figma.md](./figma.md)。

**双端适配范围**：桌面 1440px 宽与手机 390px 宽为主要设计基准；后续实现需额外验证常见窄屏和桌面宽屏，确保首屏 CTA、语言切换、轮播、在线查询演示和下载区可读可操作。

## 宪法检查

*门禁：必须在第 0 阶段研究前通过；第 1 阶段设计后必须复查。*

| 门禁 | 结果 | 证据或后续动作 |
|------|------|----------------|
| 产品定位与范围边界：覆盖软件介绍、试用查询、下载 App，反馈和联系为次要功能 | 通过 | `spec.md` 用户故事 1-4 覆盖介绍、在线查询静态演示、下载、FAQ、反馈联系；反馈联系为尾部次要入口。 |
| 范围排除：不提供完整出行路线规划，也不提供地铁等其他交通工具查询 | 通过 | `spec.md` FR-017 和在线查询边界情况明确排除；FAQ 需重复说明。 |
| 前后端分离与契约优先：边界、契约和错误格式已记录 | 通过 | 第一版不产出服务端代码；前端、未来 Go 1.26 + Gin + MySQL 后端和共享契约边界已记录；契约位于 `contracts/`。 |
| 三语国际化：所有用户可见文字覆盖 `zh-Hant`、`zh-Hans`、`en` | 通过 | 计划要求所有页面内容进入 i18n 内容模型；`data-model.md` 和 content schema 固定三语内容。 |
| 试用查询与可靠降级：外部服务、缓存、超时和失败状态已设计 | 通过 | 第一版在线查询为静态演示，无外部服务；下载资源不可用通过 manifest 状态降级；真实在线查询后续独立 feature。 |
| 现代界面与可视化评审：UI 讨论和展示有图片、截图、设计稿或可视化 mock | 通过 | 已有用户参考图、生成 mock 和 Figma 文件；后续实现必须与 Figma 对照。 |
| 电脑与手机双端一致可用：布局、交互和内容展示同时覆盖手机与电脑 | 通过 | Figma 覆盖 1440 桌面和 390 手机；quickstart 定义双端浏览器验证。 |
| Figma 驱动的前端规格：前端/UI 功能已有 Figma 文件或链接作为后续阶段参考 | 通过 | Figma URL 与节点记录在 `spec.md` 和 [figma.md](./figma.md)。 |
| 可验证交付与自动提交：验证命令、浏览器检查和本次 Spec Kit skill 后提交策略已定义 | 通过 | [quickstart.md](./quickstart.md) 定义验证；本 skill 完成后自动提交。 |
| Spec Kit 产物语言：本功能的 spec、plan、tasks 使用简体中文 | 通过 | 当前 plan、research、data-model、quickstart 使用简体中文；技术标识保持原文。 |

## 项目结构

### 文档（本功能）

```text
specs/001-homepage-v1/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── figma.md
├── contracts/
│   ├── homepage-content.schema.json
│   ├── download-manifest.schema.json
│   └── ui-state-contract.md
└── tasks.md
```

### 源码（仓库根目录）

```text
frontend/
├── index.html
├── package.json
├── src/
│   ├── app/
│   ├── assets/
│   │   ├── app-screenshots/
│   │   └── brand/
│   ├── components/
│   │   ├── download/
│   │   ├── hero/
│   │   ├── i18n/
│   │   ├── online-demo/
│   │   └── sections/
│   ├── content/
│   ├── styles/
│   └── tests/
└── playwright/

backend/
└── README.md

shared/
└── contracts/
```

**结构决策**：第一版只实现静态前端和共享契约，因此 `backend/` 只需要记录未来 Go 1.26 + Gin + MySQL 服务边界，不创建或启动服务端代码；`shared/contracts/` 在实现阶段承接本 feature 的合同文件，供前端和未来后端共同引用。该决策不违反前后端分离原则，因为前端不会硬编码未来后端内部规则，在线查询也不会伪装为实时服务。

## 复杂度跟踪

无宪法违规。需要注意的复杂点是“第一版不产出服务端代码”，但原因是在线查询已明确为静态演示，真实查询后端属于后续 feature；本计划通过共享契约保留 Go 1.26 + Gin + MySQL 服务边界。

## 第 0 阶段输出

- [research.md](./research.md)：技术路线、i18n、交互、视觉 QA、素材策略和契约边界决策。

## 第 1 阶段输出

- [data-model.md](./data-model.md)：首页内容、语言内容、下载平台状态、轮播项、在线查询演示、FAQ、反馈联系、Figma 引用等实体。
- [contracts/homepage-content.schema.json](./contracts/homepage-content.schema.json)：首页三语内容契约。
- [contracts/download-manifest.schema.json](./contracts/download-manifest.schema.json)：Android/iPhone 下载平台状态契约。
- [contracts/ui-state-contract.md](./contracts/ui-state-contract.md)：下载按钮、轮播、语言切换和响应式状态契约。
- [figma.md](./figma.md)：Figma 文件、节点、交互状态和视觉验收说明。
- [quickstart.md](./quickstart.md)：实现完成后的验证步骤。

## 第 1 阶段后宪法复查

| 门禁 | 结果 | 证据或后续动作 |
|------|------|----------------|
| 产品定位与范围边界 | 通过 | 研究、数据模型和契约均限制为香港巴士查询 App 主页。 |
| 范围排除 | 通过 | `scopeExclusions` 写入内容 schema；UI 状态契约要求 FAQ/在线查询提示重复表达。 |
| 前后端分离与契约优先 | 通过 | `contracts/` 已定义内容、下载和 UI 状态契约；后端 README 仅记录未来 Go 1.26 + Gin + MySQL 边界。 |
| 三语国际化 | 通过 | `LocalizedString` 和 schema 强制 `zh-Hant`、`zh-Hans`、`en`。 |
| 试用查询与可靠降级 | 通过 | 静态在线查询模式和下载不可用状态均有契约；无实时外部服务。 |
| 现代界面与可视化评审 | 通过 | Figma 节点与视觉 QA 步骤已沉淀。 |
| 电脑与手机双端一致可用 | 通过 | Figma 和 quickstart 覆盖桌面与手机。 |
| Figma 驱动的前端规格 | 通过 | `figma.md` 与 `spec.md` 均记录文件、节点和状态。 |
| 可验证交付与自动提交 | 通过 | quickstart 和本次提交策略已定义。 |
| Spec Kit 产物语言 | 通过 | 本阶段产物均为简体中文，代码标识和标准名保持原文。 |
