---
description: "功能实现任务清单模板"
---

# 任务：[FEATURE NAME]

**输入**：来自 `/specs/[###-feature-name]/` 的设计文档

**前置条件**：plan.md 必须存在；需要用户故事时 spec.md 必须存在；research.md、data-model.md、contracts/ 按功能需要使用

**测试**：如果规格明确要求自动化测试，必须列出测试任务；即使不写自动化测试，也必须列出与风险匹配的验证任务。

**组织方式**：任务按用户故事分组，保证每个用户故事都能独立实现和验证。

## 格式：`[ID] [P?] [Story] 描述`

- **[P]**：可并行执行，且不会修改同一文件或依赖前置未完成任务
- **[Story]**：任务所属用户故事，例如 US1、US2、US3
- 描述中必须包含准确文件路径

## 路径约定

- **前端**：`frontend/src/`、`frontend/tests/`
- **后端**：`backend/cmd/`、`backend/internal/[bounded-context]/domain/`、`backend/internal/[bounded-context]/application/`、`backend/internal/[bounded-context]/infrastructure/`、`backend/internal/[bounded-context]/interfaces/`
- **共享契约**：`shared/contracts/` 或 `specs/[###-feature-name]/contracts/`
- **OpenAPI 接口文档**：`specs/[###-feature-name]/contracts/*.openapi.yaml`，实现阶段同步到 `shared/contracts/` 或其 `openapi/` 子目录，并生成中文 API UI
- **文档与验证记录**：`docs/`、`specs/[###-feature-name]/quickstart.md`
- **Figma 设计引用**：`specs/[###-feature-name]/figma.md`

<!--
  ============================================================================
  重要：下面任务只是示例。

  /speckit-tasks 必须根据以下信息生成真实任务：
  - spec.md 中按优先级排列的用户故事
  - plan.md 中的技术决策和宪法检查
  - data-model.md 中的实体
  - contracts/ 中的接口契约

  生成后的 tasks.md 不能保留这些示例任务。
  ============================================================================
-->

## 阶段 1：设置（共享基础）

**目的**：初始化项目结构、工具链和基础约束。

- [ ] T001 按 plan.md 创建 `frontend/`、`backend/` 和共享契约目录
- [ ] T002 初始化前端项目依赖和构建脚本
- [ ] T003 初始化后端项目依赖和运行脚本
- [ ] T004 [P] 配置 lint、format 和基础测试命令
- [ ] T005 [P] 建立 `zh-Hant`、`zh-Hans`、`en` i18n 资源结构

---

## 阶段 2：基础设施（阻塞前置）

**目的**：完成所有用户故事依赖的基础能力。此阶段完成前不能开始用户故事实现。

**关键要求**：基础任务必须支撑前后端分离、三语、契约和降级策略。

- [ ] T006 定义前后端 API 或共享契约；涉及服务端 HTTP API 时创建或更新 OpenAPI 3.1 YAML，并规划中文 API UI 输出路径
- [ ] T007 [P] 建立前端路由、页面框架和 i18n 加载机制
- [ ] T008 [P] 建立后端 DDD bounded context 目录，至少包含 domain、application、infrastructure、interfaces 层
- [ ] T009 [P] 建立后端 API 路由、中间件和错误格式，确保路由只位于 interfaces 层
- [ ] T010 建立产品内容来源清单，记录 Android 主项目事实来源
- [ ] T011 配置外部服务超时、缓存或降级策略
- [ ] T012 配置日志和错误处理基础设施
- [ ] T013 记录范围排除规则，确认不实现完整出行路线规划和非香港巴士交通查询
- [ ] T014 定义手机与电脑 viewport 验证基线，路径：specs/[###-feature-name]/quickstart.md
- [ ] T015 若涉及前端 UI，创建或更新 Figma 设计并记录文件/链接、关键节点和交互状态，路径：specs/[###-feature-name]/figma.md

**检查点**：基础能力完成，可以开始用户故事并行实现。

---

## 阶段 3：用户故事 1 - [标题]（优先级：P1）MVP

**目标**：[简述这个故事交付的价值]

**独立测试**：[说明如何单独验证这个故事]

### 用户故事 1 的测试或验证

> 如果包含自动化测试，先写测试并确认失败；如果是视觉或内容验证，先定义可执行检查步骤。

- [ ] T016 [P] [US1] 为 [OpenAPI/契约或组件] 增加测试、lint、中文 API UI 生成或等价验证，路径：[contract/test path]
- [ ] T017 [P] [US1] 为 [领域实体或应用服务] 增加单元测试，路径：backend/internal/[bounded-context]/[layer]/[name]_test.*
- [ ] T018 [US1] 定义三语、手机和电脑双端视觉验证步骤，路径：specs/[###-feature-name]/quickstart.md
- [ ] T019 [US1] 生成或保存手机与电脑 UI 图片、截图、设计稿或可视化 mock，路径：[artifact path]
- [ ] T020 [US1] 将 Figma 文件/链接、关键节点和交互状态记录到 specs/[###-feature-name]/figma.md

### 用户故事 1 的实现

- [ ] T021 [P] [US1] 在 `frontend/src/pages/[page].*` 实现页面结构
- [ ] T022 [P] [US1] 在 `frontend/src/i18n/` 补齐三语文案
- [ ] T023 [US1] 在 `backend/internal/[bounded-context]/domain/` 实现领域实体、值对象、领域服务或领域错误
- [ ] T024 [US1] 在 `backend/internal/[bounded-context]/application/` 实现用例编排和端口
- [ ] T025 [US1] 在 `backend/internal/[bounded-context]/infrastructure/` 实现文件、数据库、外部 API 或缓存适配
- [ ] T026 [US1] 在 `backend/internal/[bounded-context]/interfaces/` 实现 HTTP、CLI 或定时任务入口适配
- [ ] T027 [US1] 将前端服务调用接入后端契约，并确认实现与 OpenAPI 文档一致
- [ ] T028 [US1] 增加加载、空状态、错误和降级状态
- [ ] T029 [US1] 验证手机与电脑布局下核心内容和主要操作均可见可用
- [ ] T030 [US1] 对照 Figma 文件/链接检查页面视觉、状态和交互一致性

**检查点**：用户故事 1 可以独立运行、展示和验证。

---

## 阶段 4：用户故事 2 - [标题]（优先级：P2）

**目标**：[简述这个故事交付的价值]

**独立测试**：[说明如何单独验证这个故事]

### 用户故事 2 的测试或验证

- [ ] T031 [P] [US2] 为 [组件或交互] 增加测试，路径：frontend/tests/[name].test.ts
- [ ] T032 [US2] 补充三语、手机和电脑双端验证步骤
- [ ] T033 [US2] 若涉及 UI，生成或保存手机与电脑图片、截图、设计稿或可视化 mock
- [ ] T034 [US2] 若涉及 UI，更新 specs/[###-feature-name]/figma.md 的 Figma 文件/链接和节点说明

### 用户故事 2 的实现

- [ ] T035 [P] [US2] 实现 [前端组件]，路径：frontend/src/components/[component].*
- [ ] T036 [US2] 实现 [后端能力或内容配置]，路径：backend/internal/[bounded-context]/[layer]/[file].*
- [ ] T037 [US2] 与用户故事 1 的既有能力集成

**检查点**：用户故事 1 和 2 都能独立工作。

---

## 阶段 5：用户故事 3 - [标题]（优先级：P3）

**目标**：[简述这个故事交付的价值]

**独立测试**：[说明如何单独验证这个故事]

### 用户故事 3 的测试或验证

- [ ] T038 [P] [US3] 为 [功能] 增加测试或验证步骤

### 用户故事 3 的实现

- [ ] T039 [P] [US3] 实现 [前端能力]，路径：frontend/src/[location]/[file].*
- [ ] T040 [US3] 实现 [后端能力]，路径：backend/internal/[bounded-context]/[layer]/[file].*

**检查点**：目标用户故事全部可独立验证。

---

[按需增加更多用户故事阶段，保持同样结构]

---

## 阶段 N：打磨与跨切面

**目的**：处理影响多个用户故事的质量、文档和验证工作。

- [ ] TXXX [P] 更新文档，路径：docs/
- [ ] TXXX 清理代码和重复逻辑
- [ ] TXXX 优化图片、首屏加载和响应式表现
- [ ] TXXX 确认所有 UI 讨论和展示均有图片、截图、设计稿或可视化 mock 作为用户可见依据
- [ ] TXXX 确认 specs/[###-feature-name]/figma.md 已沉淀 Figma 文件/链接、关键节点、交互状态和版本说明
- [ ] TXXX 确认服务端 HTTP API 的 OpenAPI 文档已同步到 feature contracts 和共享契约，已生成中文 API UI，并通过 lint/预览验证
- [ ] TXXX 验证手机和电脑 viewport 下布局、交互和内容展示均正常
- [ ] TXXX 验证网站没有暗示提供完整路线规划、地铁或其他非香港巴士交通查询
- [ ] TXXX 验证服务端代码符合 DDD 依赖方向：domain 不依赖框架、文件系统、数据库、第三方 SDK 或前端契约
- [ ] TXXX [P] 补充单元测试或契约测试
- [ ] TXXX 检查安全边界，确认无密钥或私有 token 下发到前端
- [ ] TXXX 运行 quickstart.md 中的本地验证步骤
- [ ] TXXX 启动本地服务并用浏览器验证三语、移动端和桌面端关键页面
- [ ] TXXX 在本次 Spec Kit skill 验证通过后准备自动提交范围

---

## 依赖与执行顺序

### 阶段依赖

- **设置（阶段 1）**：无依赖，可以立即开始
- **基础设施（阶段 2）**：依赖设置完成，阻塞所有用户故事
- **用户故事（阶段 3+）**：依赖基础设施完成；之后可按优先级顺序或并行推进
- **打磨（最终阶段）**：依赖目标用户故事完成

### 用户故事依赖

- **用户故事 1（P1）**：基础设施完成后即可开始，不依赖其他用户故事
- **用户故事 2（P2）**：基础设施完成后即可开始；如果依赖 US1，必须仍能独立验证
- **用户故事 3（P3）**：基础设施完成后即可开始；如果依赖其他故事，必须记录依赖原因

### 单个用户故事内部顺序

- 测试或验证步骤先定义
- 契约先于前后端实现
- OpenAPI 接口文档先于服务端 HTTP handler 和前端调用实现
- 中文 API UI 生成与验证先于服务端接口交付完成标记
- 服务端领域模型先于应用服务，应用服务先于基础设施和接口适配
- 内容来源清单先于页面文案落地
- 范围排除和 UI 可视化产物先于用户确认页面方案
- Figma 文件/链接和关键节点记录先于前端页面实现
- 手机与电脑双端布局策略先于页面实现和用户确认
- i18n 文案与组件实现同步完成
- 加载、错误和降级状态必须随核心实现一起完成
- 故事完成后先独立验证，再进入下一个故事

### 并行机会

- 所有标记 [P] 的设置任务可并行
- 基础设施中不同文件的任务可并行
- 基础设施完成后，不同用户故事可由不同开发者并行
- 同一故事内的前端组件、后端接口和 i18n 文件在契约稳定后可并行

---

## 实施策略

### MVP 优先

1. 完成设置
2. 完成基础设施
3. 完成用户故事 1
4. 停止并独立验证用户故事 1
5. 准备演示或继续后续故事

### 增量交付

1. 设置 + 基础设施 -> 基础可用
2. 用户故事 1 -> 独立验证 -> 可演示
3. 用户故事 2 -> 独立验证 -> 可演示
4. 用户故事 3 -> 独立验证 -> 可演示
5. 每个故事都不能破坏之前已验证能力

## 备注

- [P] 表示不同文件、无直接依赖、可并行执行
- [Story] 标签必须映射到具体用户故事，便于追踪
- 任务描述必须包含真实路径
- 避免模糊任务、同文件冲突和无法独立验证的跨故事依赖
- 每次 Spec Kit skill 完成并验证通过后必须自动提交，除非提交范围或信息不清晰
