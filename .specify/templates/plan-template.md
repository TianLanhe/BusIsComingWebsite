# 实施计划：[FEATURE]

**分支**：`[###-feature-name]` | **日期**：[DATE] | **规格**：[link]

**输入**：来自 `/specs/[###-feature-name]/spec.md` 的功能规格

**说明**：本模板由 `/speckit-plan` 填写。所有面向人阅读的阶段产物必须使用简体中文。

## 摘要

[从功能规格提取：核心需求、用户价值和技术路线]

## 技术背景

<!--
  操作要求：用项目真实技术信息替换本节内容。不能保留示例作为最终计划。
-->

**前端语言/版本**：[例如 TypeScript 5.x、JavaScript ES2023 或 NEEDS CLARIFICATION]

**后端语言/版本**：[例如 Node.js 22、Python 3.12、Go 1.23 或 NEEDS CLARIFICATION]

**主要依赖**：[例如 React、Vue、FastAPI、Express、数据库客户端或 NEEDS CLARIFICATION]

**数据与存储**：[例如 静态内容、PostgreSQL、文件缓存、N/A 或 NEEDS CLARIFICATION]

**测试**：[例如 vitest、playwright、pytest、contract tests 或 NEEDS CLARIFICATION]

**目标平台**：[例如 手机浏览器、桌面浏览器、Node.js 服务端、静态托管 + API 服务 或 NEEDS CLARIFICATION]

**项目类型**：前后端分离 Web 应用

**性能目标**：[例如 首屏加载、API p95、图片体积、SEO 可索引性 或 NEEDS CLARIFICATION]

**约束**：[例如 三语 i18n、现代简洁优雅、移动端适配、无密钥下发、外部 API 降级 或 NEEDS CLARIFICATION]

**规模/范围**：[例如 页面数量、API 数量、语言数量、内容来源范围、明确排除项 或 NEEDS CLARIFICATION]

**i18n 范围**：必须覆盖 `zh-Hant`、`zh-Hans` 和 `en`

**前后端契约**：[记录 API 或共享契约位置、版本策略和错误格式]

**OpenAPI 接口文档**：[涉及服务端 HTTP API 时记录 OpenAPI 3.1 YAML 路径、共享沉淀路径、lint/bundle/预览方式；不涉及服务端 API 时写 N/A]

**服务端 DDD 边界**：[涉及服务端代码时记录 bounded context、领域层、应用层、基础设施层、接口适配层和依赖方向；不涉及服务端代码时写 N/A]

**UI 可视化产物**：[记录图片、截图、设计稿或可视化 mock 的路径；非 UI 功能可写 N/A]

**Figma 设计引用**：[记录 Figma 文件/链接、关键节点、版本说明；非 UI 功能可写 N/A]

**双端适配范围**：[记录手机与电脑 viewport、关键布局差异和验证方式；非 UI 功能可写 N/A]

## 宪法检查

*门禁：必须在第 0 阶段研究前通过；第 1 阶段设计后必须复查。*

| 门禁 | 结果 | 证据或后续动作 |
|------|------|----------------|
| 产品定位与范围边界：覆盖软件介绍、试用查询、下载 App，反馈和联系为次要功能 | [通过/未通过] | [页面范围、用户故事或待确认项] |
| 范围排除：不提供完整出行路线规划，也不提供地铁等其他交通工具查询 | [通过/未通过] | [需求或 UI 中的排除说明] |
| 前后端分离与契约优先：边界、契约和错误格式已记录 | [通过/未通过] | [契约路径或设计说明] |
| OpenAPI 驱动的服务端接口文档：服务端 HTTP API 已有 OpenAPI 3.1 YAML、共享沉淀路径和验证方式 | [通过/未通过] | [OpenAPI 路径、lint/预览命令或 N/A 原因] |
| 三语国际化：所有用户可见文字覆盖 `zh-Hant`、`zh-Hans`、`en` | [通过/未通过] | [i18n 文件、内容系统或验证方式] |
| 试用查询与可靠降级：外部服务、缓存、超时和失败状态已设计 | [通过/未通过] | [服务边界和降级策略] |
| 现代界面与可视化评审：UI 讨论和展示有图片、截图、设计稿或可视化 mock | [通过/未通过] | [视觉产物路径或 N/A 原因] |
| 电脑与手机双端一致可用：布局、交互和内容展示同时覆盖手机与电脑 | [通过/未通过] | [viewport、截图或验证步骤] |
| Figma 驱动的前端规格：前端/UI 功能已有 Figma 文件或链接作为后续阶段参考 | [通过/未通过] | [Figma URL、节点或 N/A 原因] |
| 服务端 DDD 架构：新增或重构的服务端代码按 DDD 层级、模块边界和依赖方向组织 | [通过/未通过] | [bounded context、目录结构或 N/A 原因] |
| 可验证交付与自动提交：验证命令、浏览器检查和本次 Spec Kit skill 后提交策略已定义 | [通过/未通过] | [命令、检查项和提交范围] |
| Spec Kit 产物语言：本功能的 spec、plan、tasks 使用简体中文 | [通过/未通过] | [若有例外，说明原因] |

## 项目结构

### 文档（本功能）

```text
specs/[###-feature]/
├── plan.md              # 本文件，由 /speckit-plan 生成
├── research.md          # 第 0 阶段输出
├── data-model.md        # 第 1 阶段输出
├── quickstart.md        # 第 1 阶段输出
├── figma.md             # 前端/UI 功能的 Figma 文件、节点和交互状态引用
├── contracts/           # 第 1 阶段输出，包含 OpenAPI/JSON Schema/共享契约
└── tasks.md             # 第 2 阶段输出，由 /speckit-tasks 生成
```

### 源码（仓库根目录）

<!--
  操作要求：用真实目录替换下面的建议结构。最终计划不能保留未使用目录。
-->

```text
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── i18n/
└── tests/

backend/
├── cmd/
├── internal/
│   └── [bounded-context]/
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       └── interfaces/
└── [managed-data-or-assets]/

shared/
└── contracts/
```

**结构决策**：[说明本功能采用的真实目录、服务端 DDD 分层与依赖方向，以及任何临时偏离前后端分离或 DDD 结构的原因]

## 复杂度跟踪

> 仅当宪法检查存在必须接受的违规或复杂度时填写。

| 违规或复杂点 | 为什么必要 | 被拒绝的更简单方案 |
|--------------|------------|--------------------|
| [例如 暂不接入后端 API] | [当前原因] | [为什么不能立即采用标准边界] |
| [例如 额外缓存层] | [当前原因] | [为什么直接请求不足] |
