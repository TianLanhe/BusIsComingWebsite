# Tasks: 首页 UI 体验优化补充

**Input**: `specs/007-homepage-ui-polish/` 中的 `spec.md`、`plan.md`、`research.md`、`data-model.md`、`contracts/`、`quickstart.md`
**Prerequisites**: `plan.md` 已通过 constitution gate；本次变更不新增服务端 API，仅维护前端 UI 状态契约和内容契约

**Tests**: 按用户故事补充 Vitest、Playwright 和视觉验证记录。每个用户故事的测试任务必须先于对应实现任务完成。

**Organization**: 任务按用户故事分组，保证 US1、US2、US3 可分别实现和验证；Setup/Foundation 为跨故事前置工作。

## Phase 1: Setup

**Purpose**: 准备实现记录、视觉验证目录和 Figma 交付入口。

- [ ] T001 在 `specs/007-homepage-ui-polish/visual-review/README.md` 建立视觉验收目录说明，列出桌面 1440、手机 390、lightbox 三类截图要求
- [ ] T002 在 `specs/007-homepage-ui-polish/figma.md` 补充本阶段实现需要回填的 Figma 节点清单、交互状态和版本记录占位
- [ ] T003 检查 `frontend/src/components/hero/`、`frontend/src/components/sections/`、`frontend/src/components/online-demo/` 与现有测试文件的 selector/data-testid，记录需要复用或补齐的测试入口

---

## Phase 2: Foundation

**Purpose**: 更新跨故事共享的内容模型、UI 状态契约和三语文案基础。

- [ ] T004 [P] 更新 `specs/007-homepage-ui-polish/contracts/homepage-ui-polish-content.schema.json`，覆盖截图组、大图查看会话、手机功能卡和路线结果指标的内容字段
- [ ] T005 [P] 更新 `shared/contracts/ui-state-contract.md`，补充 feature-copy-zone、screenshot-zone、lightbox、mobile-feature-grid、route-result-card 的状态约束
- [ ] T006 [P] 更新 `frontend/src/content/types.ts`，为截图分组、lightbox 控制、路线指标标签和值、缺失站点状态补齐类型
- [ ] T007 [P] 更新 `frontend/src/content/uiCopy.ts`，补齐 lightbox 控件、路线指标标签、缺失站点、截图切换的 `zh-Hant`、`zh-Hans`、`en` 文案
- [ ] T008 [P] 更新 `frontend/src/tests/content-contract.test.ts`，校验内容契约新增字段和禁止回退到旧的临时描述
- [ ] T009 [P] 更新 `frontend/src/tests/i18n-completeness.test.tsx`，校验新增 UI 文案三语完整且 key 一致

**Checkpoint**: 内容契约、类型和三语文案已能支持三个用户故事独立落地。

---

## Phase 3: User Story 1 - 桌面功能展示与截图可查看细节 (Priority: P1)

**Goal**: 桌面端 hero 右侧展示更清晰；截图可点击放大，并支持大图缩放、平移和同功能截图切换；拖动截图只切截图，拖动文字区域切功能。

**Independent Test**: 在桌面 1440px 视口打开首页，截图堆叠整体放大且后置图片同等放大；点击截图进入 lightbox 后可缩放、平移、关闭，并且截图区拖动不触发功能切换。

### Tests for User Story 1

- [ ] T010 [P] [US1] 更新 `frontend/src/tests/hero-carousel.test.tsx`，覆盖文字区域拖动切换功能、截图区域拖动不冒泡切换功能
- [ ] T011 [P] [US1] 更新 `frontend/src/tests/feature-gallery.test.tsx`，覆盖同一功能内多截图切换、单截图功能不显示无效切换状态
- [ ] T012 [P] [US1] 更新 `frontend/playwright/hero-carousel.spec.ts`，验证桌面 hero 截图展示尺寸、功能切换手势和无放大提示器
- [ ] T013 [P] [US1] 更新 `frontend/playwright/feature-gallery.spec.ts`，验证点击截图打开 lightbox、缩放、平移、关闭和键盘可达性

### Implementation for User Story 1

- [ ] T014 [US1] 重构 `frontend/src/components/hero/AppPreviewCarousel.tsx`，将功能切换手势绑定到文字/说明区域并隔离截图区域事件
- [ ] T015 [US1] 重构 `frontend/src/components/hero/ScreenshotStack.tsx`，支持截图区域左右拖动、点击主图打开大图、同功能截图索引状态
- [ ] T016 [US1] 新增 `frontend/src/components/hero/ScreenshotLightbox.tsx`，实现大图查看、关闭、缩放、平移、同功能截图切换和焦点管理
- [ ] T017 [US1] 新增 `frontend/src/components/hero/ScreenshotLightbox.module.css`，实现桌面与手机可用的大图查看布局、触控缩放区域和无障碍焦点样式
- [ ] T018 [US1] 更新 `frontend/src/components/hero/AppPreviewCarousel.module.css`，适当放大桌面功能展示区并保持 hero 左右内容平衡
- [ ] T019 [US1] 更新 `frontend/src/components/hero/ScreenshotStack.module.css`，让前景与后置堆叠截图同等放大，并移除任何放大提示器样式
- [ ] T020 [US1] 更新 `frontend/src/content/carouselSlides.ts`，补齐同一功能截图组、alt 文案和 lightbox 所需图片元数据

**Checkpoint**: US1 可独立在桌面端验证，不依赖 US2/US3 的移动端布局和文案调整。

---

## Phase 4: User Story 2 - 手机功能区与路线结果卡片更紧凑 (Priority: P1)

**Goal**: 手机端 6 个功能介绍改为更紧凑的两列布局，并能扩展到 10 个主要功能；路线结果卡片在手机端把车费、耗时、步行合并为一行，同时保留清晰的项目名称和值差异。

**Independent Test**: 在 390px 手机视口打开首页，功能区为两列紧凑网格且桌面端保持现状；在线试查结果卡首行巴士号码不过度粗大，车费/耗时/步行以标签和值同列或同行展示。

### Tests for User Story 2

- [ ] T021 [P] [US2] 更新 `frontend/playwright/homepage-sections.spec.ts`，验证手机端功能区两列、卡片高度紧凑、桌面端功能区布局不变
- [ ] T022 [P] [US2] 更新 `frontend/src/tests/online-query-demo.test.tsx`，覆盖路线结果卡的 route number、候车状态、上下车站、缺失站点和指标标签/值结构
- [ ] T023 [P] [US2] 更新 `frontend/playwright/online-query-demo.spec.ts`，验证手机端路线结果卡车费、耗时、步行在一行内展示且文字不重叠
- [ ] T024 [P] [US2] 更新 `frontend/src/tests/sections-content.test.ts`，确保功能介绍内容可支持 10 个主要功能且不依赖分组胶囊

### Implementation for User Story 2

- [ ] T025 [US2] 更新 `frontend/src/components/sections/FeatureGrid.module.css`，仅在手机断点改为两列紧凑网格，压缩卡片高度、图标尺寸和行间距
- [ ] T026 [US2] 更新 `frontend/src/components/sections/FeatureGrid.tsx`，补齐稳定的测试属性和适合 10 个功能扩展的语义结构
- [ ] T027 [US2] 更新 `frontend/src/components/online-demo/OnlineQueryDemo.tsx`，重排路线结果卡片结构，降低巴士号码视觉权重并合并车费/耗时/步行指标
- [ ] T028 [US2] 更新 `frontend/src/components/online-demo/OnlineQueryDemo.module.css`，优化手机端路线卡片宽度、内边距、指标行、站点缺失态和长文本换行
- [ ] T029 [US2] 更新 `frontend/src/content/onlineQueryDemo.ts`，补齐路线结果指标标签、缺失站点展示文本和示例数据需要的三语字段

**Checkpoint**: US2 可独立在手机端验证，桌面端现有功能区布局无回归。

---

## Phase 5: User Story 3 - 车费文案更自然准确 (Priority: P2)

**Goal**: 将“多程总车费一眼看清”调整为“车费一眼看清”，并用自然文案说明比较路线时可以同步看到交通费、时间和步行距离。

**Independent Test**: 三种语言下都不出现“比较城巴方案时，可直接看到多程全程总车费，而不只是币种显示。”这类需求描述式文案，功能介绍表达自然且与实际功能一致。

### Tests for User Story 3

- [ ] T030 [P] [US3] 更新 `frontend/src/tests/sections-content.test.ts`，断言 `zh-Hans` 使用“车费一眼看清”、`zh-Hant` 使用“車費一眼看清”且不包含旧需求描述
- [ ] T031 [P] [US3] 更新 `frontend/src/tests/hero-content.test.ts`，校验 hero 摘要和功能亮点不再引用旧的“多程总车费”表述
- [ ] T032 [P] [US3] 更新 `frontend/src/tests/i18n-completeness.test.tsx`，校验车费功能文案三语完整且英文语义为 fare comparison 而非 currency display

### Implementation for User Story 3

- [ ] T033 [US3] 更新 `frontend/src/content/sectionsContent.ts`，将功能标题改为“车费一眼看清/車費一眼看清”并替换为自然介绍
- [ ] T034 [US3] 更新 `frontend/src/content/carouselSlides.ts`，同步截图轮播中的车费功能标题、摘要和 alt 文案
- [ ] T035 [US3] 更新 `frontend/src/content/homepageContent.ts`，同步首页其他入口中涉及车费比较的三语文案

**Checkpoint**: US3 可独立通过内容测试验证，不依赖 US1/US2 的布局改动。

---

## Phase 6: Polish & Cross-Cutting Validation

**Purpose**: 完成整体视觉记录、Figma 沉淀、构建和回归验证。

- [ ] T036 更新 `specs/007-homepage-ui-polish/figma.md`，回填最终 Figma 文件/链接、关键节点、交互状态和版本说明；如 MCP 仍未授权，记录本地插件产物和待回填事项
- [ ] T037 按 `specs/007-homepage-ui-polish/quickstart.md` 截取并保存桌面 hero、手机功能区、手机路线结果卡、lightbox 到 `specs/007-homepage-ui-polish/visual-review/`
- [ ] T038 运行 `cd frontend && npm run test -- --run src/tests/hero-carousel.test.tsx src/tests/feature-gallery.test.tsx src/tests/online-query-demo.test.tsx src/tests/sections-content.test.ts src/tests/hero-content.test.ts src/tests/i18n-completeness.test.tsx`
- [ ] T039 运行 `cd frontend && npm run build`
- [ ] T040 运行 `cd frontend && npm run test:e2e -- playwright/hero-carousel.spec.ts playwright/feature-gallery.spec.ts playwright/homepage-sections.spec.ts playwright/online-query-demo.spec.ts`
- [ ] T041 运行 `cd frontend && npm run openapi:lint && npm run openapi:routes:lint`，确认本次无服务端 API 契约漂移
- [ ] T042 对照 `specs/007-homepage-ui-polish/contracts/homepage-ui-polish.contract.md` 手动检查 US1/US2/US3 所有状态，必要时补充测试或截图证据
- [ ] T043 确认 `AGENTS.md` 仍指向 `specs/007-homepage-ui-polish/plan.md`，并检查 `git status --short` 只包含本次任务相关文件

---

## Dependencies & Execution Order

- Phase 1 必须先完成，用于建立实现记录和视觉验证入口。
- Phase 2 必须先于三个用户故事完成，用于统一内容类型、契约和三语文案。
- US1 与 US2 都是 P1，可在 Phase 2 后并行开发；US1 聚焦桌面 hero 与 lightbox，US2 聚焦手机功能区与路线卡片。
- US3 是 P2，可在 Phase 2 后独立开发；如果同一内容文件与 US1 冲突，应先完成 US3 文案再合并 US1 的截图元数据。
- Phase 6 必须在所有目标用户故事完成后执行。

## Parallel Execution Examples

### US1

- `T010`、`T011`、`T012`、`T013` 可并行编写测试。
- `T016` 与 `T017` 可并行实现 lightbox 结构和样式。
- `T018`、`T019` 可在 lightbox 接口稳定后并行调整 hero 和截图堆叠样式。

### US2

- `T021`、`T022`、`T023`、`T024` 可并行编写测试。
- `T025` 与 `T026` 可并行处理功能区组件和样式。
- `T027`、`T028`、`T029` 可围绕路线卡结构、样式和文案并行推进，但最终需一起验证手机视口。

### US3

- `T030`、`T031`、`T032` 可并行补内容测试。
- `T033`、`T034`、`T035` 涉及相邻内容文件，应在同一分支内串行提交以减少文案冲突。

## Implementation Strategy

### MVP First

1. 完成 Phase 1 和 Phase 2。
2. 完成 US1，让桌面展示区和 lightbox 达到可验证状态。
3. 完成 US2，让手机端功能区和路线卡片达到可验证状态。
4. 运行 Phase 6 中与 US1/US2 相关的测试、构建和截图验证。

### Incremental Delivery

1. US1 完成后验证桌面 hero、截图拖动和 lightbox。
2. US2 完成后验证手机功能区、路线结果卡片和桌面布局无回归。
3. US3 完成后验证三语文案自然准确。
4. 最终执行完整回归、视觉截图和 Figma/文档回填。

## Notes

- `[P]` 表示可并行处理，前提是对应任务不编辑同一文件。
- `[US1]`、`[US2]`、`[US3]` 只用于用户故事阶段任务；Setup、Foundation、Polish 不绑定单一故事。
- 本次没有服务端接口变更；如实现过程中发现需要新增或调整 HTTP API，必须先更新 OpenAPI 3.1 YAML 和中文 API UI 说明，再重新评估 plan/tasks。
- 代码注释只在复杂手势、缩放平移、状态映射或降级逻辑处添加，并使用中文。
