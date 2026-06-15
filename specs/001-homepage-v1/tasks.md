# 任务：第一版网站主页

**输入**：来自 `specs/001-homepage-v1/` 的规格、计划、研究、数据模型、契约、Figma 设计引用和快速验证指南

**前置条件**：`plan.md`、`spec.md`、`research.md`、`data-model.md`、`quickstart.md`、`figma.md` 和 `contracts/` 已存在

**测试**：规格和 quickstart 明确要求验证三语内容、下载状态、轮播状态、静态在线查询范围、桌面/手机布局和 Figma 对照，因此任务包含自动化测试与浏览器验证任务。

**组织方式**：任务按用户故事分组，保证每个用户故事都能独立实现和验证。第一版只产出静态前端、共享契约和后端边界说明，不产出服务端代码。

## 阶段 1：设置（共享基础）

**目的**：初始化前端静态主页、共享契约和未来后端边界文档的项目骨架。

- [ ] T001 创建 React + Vite + TypeScript 前端骨架，路径：`frontend/package.json`、`frontend/index.html`、`frontend/src/main.tsx`
- [ ] T002 创建前端源码目录结构，路径：`frontend/src/app/`、`frontend/src/components/`、`frontend/src/content/`、`frontend/src/styles/`、`frontend/src/tests/`、`frontend/playwright/`
- [ ] T003 复制并固定共享契约副本，路径：`shared/contracts/homepage-content.schema.json`、`shared/contracts/download-manifest.schema.json`、`shared/contracts/ui-state-contract.md`
- [ ] T004 创建后端边界说明且不创建服务端代码，路径：`backend/README.md`
- [ ] T005 配置前端开发、构建、测试和浏览器验证脚本，路径：`frontend/package.json`
- [ ] T006 [P] 创建 App 截图与品牌素材占位说明，路径：`frontend/src/assets/app-screenshots/README.md`、`frontend/src/assets/brand/README.md`

---

## 阶段 2：基础设施（阻塞前置）

**目的**：完成所有用户故事依赖的内容契约、三语机制、样式基线和验证基线。此阶段完成前不能开始用户故事实现。

**关键要求**：基础任务必须支撑前后端分离、三语、Figma 驱动、静态演示范围和桌面/手机双端验证。

- [ ] T007 定义首页内容、下载 manifest、轮播、FAQ 和三语通用类型，路径：`frontend/src/content/types.ts`
- [ ] T008 创建语言检测、默认 `zh-Hant`、用户选择持久化和三语读取工具，路径：`frontend/src/content/locales.ts`、`frontend/src/components/i18n/I18nProvider.tsx`
- [ ] T009 创建全局样式、设计令牌和响应式基础，路径：`frontend/src/styles/tokens.css`、`frontend/src/styles/global.css`
- [ ] T010 创建应用壳、页面锚点和区块顺序定义，路径：`frontend/src/app/App.tsx`、`frontend/src/app/sections.ts`
- [ ] T011 [P] 配置 Vitest 与 React Testing Library 测试入口，路径：`frontend/vitest.config.ts`、`frontend/src/tests/setup.ts`
- [ ] T012 [P] 配置 Playwright 桌面 1440px 与手机 390px 验证基线，路径：`frontend/playwright.config.ts`
- [ ] T013 建立 Android 主项目事实来源映射，路径：`frontend/src/content/sourceReferences.ts`

**检查点**：基础能力完成，可以开始用户故事并行实现。

---

## 阶段 3：用户故事 1 - 了解产品并下载 App（优先级：P1）MVP

**目标**：用户在首屏快速识别 BusIsComing 的香港巴士查询定位、Android App 属性、核心价值，并能清楚使用 Android 下载入口或理解 iPhone 暂未支持。

**独立测试**：在桌面 1440px 和手机 390px 打开首页，不滚动即可看到品牌、产品定位、下载主入口、在线查询次入口和至少一个 App 预览区域；Android 区域可进入可下载状态，iPhone 区域只能进入暂未支持状态且点击不跳转。

### 用户故事 1 的测试或验证

- [ ] T014 [P] [US1] 为下载分段按钮 default、Android 展开、iPhone 展开和 iPhone 不跳转增加组件测试，路径：`frontend/src/tests/download-button.test.tsx`
- [ ] T015 [P] [US1] 为首屏三语核心文案、CTA 文案和产品定位增加内容测试，路径：`frontend/src/tests/hero-content.test.ts`
- [ ] T016 [US1] 为桌面和手机首屏、Android hover/focus、iPhone hover/focus 增加浏览器验证，路径：`frontend/playwright/homepage-hero.spec.ts`

### 用户故事 1 的实现

- [ ] T017 [US1] 定义首屏、导航、CTA、下载平台状态和限制提示的三语内容，路径：`frontend/src/content/homepageContent.ts`、`frontend/src/content/downloadManifest.ts`
- [ ] T018 [P] [US1] 实现语言切换入口和页面导航，路径：`frontend/src/components/i18n/LanguageSwitcher.tsx`、`frontend/src/components/sections/Header.tsx`
- [ ] T019 [US1] 实现 Android/iPhone 整体分段下载按钮的状态机、可访问性和不可用逻辑，路径：`frontend/src/components/download/DownloadSegmentedButton.tsx`、`frontend/src/components/download/DownloadSegmentedButton.module.css`
- [ ] T020 [P] [US1] 实现首屏产品文案、功能要点、下载主 CTA 和在线查询次 CTA，路径：`frontend/src/components/hero/HeroIntro.tsx`
- [ ] T021 [US1] 实现桌面左文案右预览、手机单列的首屏布局，路径：`frontend/src/components/hero/HeroSection.tsx`、`frontend/src/components/hero/HeroSection.module.css`
- [ ] T022 [US1] 将 Header、Hero 和下载按钮接入首页应用壳，路径：`frontend/src/app/App.tsx`
- [ ] T023 [US1] 验证 US1 对照 Figma 节点 `4:2`、`4:183`、`4:326` 的视觉和交互差异，路径：`specs/001-homepage-v1/visual-review/us1.md`

**检查点**：用户故事 1 可以独立运行、展示和验证，是建议 MVP 范围。

---

## 阶段 4：用户故事 2 - 通过 App 预览理解核心能力（优先级：P2）

**目标**：用户通过首屏右侧或手机 CTA 后方的 App 功能预览轮播，理解 4 个真实 App 核心能力和素材可信度。

**独立测试**：桌面端显示手机外框、截图、功能标题、1-2 行说明和分页状态；移动端显示截图在上、说明在下；轮播顺序固定为常用路线快速查询、路线结果比较、多班 ETA / 路线详情、出门前短时通知监测；临时 mock 必须标注待替换。

### 用户故事 2 的测试或验证

- [ ] T024 [P] [US2] 为轮播 4 项顺序、标题说明和素材状态增加内容测试，路径：`frontend/src/tests/hero-carousel.test.tsx`
- [ ] T025 [US2] 为轮播切换、分页状态和语言切换保留当前项增加浏览器验证，路径：`frontend/playwright/hero-carousel.spec.ts`

### 用户故事 2 的实现

- [ ] T026 [US2] 定义 4 个轮播项、截图路径、素材状态和 Android 主项目来源引用，路径：`frontend/src/content/carouselSlides.ts`
- [ ] T027 [US2] 放置真实 Android App 截图或显式临时占位说明，路径：`frontend/src/assets/app-screenshots/`
- [ ] T028 [US2] 实现 App 功能预览轮播组件、分页点、切换状态和暂停逻辑，路径：`frontend/src/components/hero/AppPreviewCarousel.tsx`、`frontend/src/components/hero/AppPreviewCarousel.module.css`
- [ ] T029 [US2] 将轮播接入首屏桌面右侧和手机 CTA 后方布局，路径：`frontend/src/components/hero/HeroSection.tsx`
- [ ] T030 [US2] 验证 US2 对照 Figma 节点 `4:357` 的 4 个轮播状态和截图裁切，路径：`specs/001-homepage-v1/visual-review/us2.md`

**检查点**：用户故事 2 可以在不依赖在线查询和 FAQ 的情况下独立展示和验证。

---

## 阶段 5：用户故事 3 - 体验在线查询静态演示并理解范围限制（优先级：P2）

**目标**：用户能看到“在线查询”的网页结果形态，同时明确第一版只是静态演示，完整功能需要下载 App。

**独立测试**：滚动到在线查询演示区，页面展示起点、终点、查询按钮、静态路线结果和三语限制说明；点击查询不会发起 Citybus、DATA.GOV.HK 或任何后端实时查询。

### 用户故事 3 的测试或验证

- [ ] T031 [P] [US3] 为在线查询静态演示内容、限制说明和范围排除增加内容测试，路径：`frontend/src/tests/online-query-demo.test.tsx`
- [ ] T032 [US3] 为在线查询区无真实网络请求、静态路线结果和限制提示增加浏览器验证，路径：`frontend/playwright/online-query-demo.spec.ts`

### 用户故事 3 的实现

- [ ] T033 [US3] 定义在线查询静态演示的起点、终点、路线结果、限制提示和范围提示三语内容，路径：`frontend/src/content/onlineQueryDemo.ts`
- [ ] T034 [US3] 实现在线查询静态演示卡片、查询按钮静态行为和结果列表，路径：`frontend/src/components/online-demo/OnlineQueryDemo.tsx`、`frontend/src/components/online-demo/OnlineQueryDemo.module.css`
- [ ] T035 [US3] 将在线查询区按页面顺序接入首页并绑定导航锚点，路径：`frontend/src/app/App.tsx`、`frontend/src/app/sections.ts`
- [ ] T036 [US3] 验证 US3 的桌面和手机截图、静态演示标识和范围限制文案，路径：`specs/001-homepage-v1/visual-review/us3.md`

**检查点**：用户故事 3 可以独立说明在线查询形态和第一版范围限制，不会误导为实时查询服务。

---

## 阶段 6：用户故事 4 - 查阅功能、常见问题与联系入口（优先级：P3）

**目标**：用户在首屏之外能查阅核心功能、下载状态、在线查询限制、数据来源范围，并找到反馈与联系开发者的次要入口。

**独立测试**：向下滚动时，核心功能、在线查询、下载区、常见问题、反馈与联系按确认顺序出现；核心功能覆盖 6 项能力，FAQ 覆盖 Android 安装、iPhone 状态、在线查询限制和数据来源范围。

### 用户故事 4 的测试或验证

- [ ] T037 [P] [US4] 为核心功能、下载区、FAQ 和联系入口的三语完整性增加内容测试，路径：`frontend/src/tests/sections-content.test.ts`
- [ ] T038 [US4] 为页面区块顺序、FAQ 覆盖范围和联系入口可见性增加浏览器验证，路径：`frontend/playwright/homepage-sections.spec.ts`

### 用户故事 4 的实现

- [ ] T039 [US4] 定义核心功能、下载区、FAQ、反馈与联系的三语内容和来源引用，路径：`frontend/src/content/sectionsContent.ts`
- [ ] T040 [US4] 实现核心功能区、下载区、FAQ 和联系页脚组件，路径：`frontend/src/components/sections/FeatureGrid.tsx`、`frontend/src/components/sections/DownloadSection.tsx`、`frontend/src/components/sections/FaqSection.tsx`、`frontend/src/components/sections/FooterContact.tsx`
- [ ] T041 [US4] 将核心功能、下载区、FAQ、反馈与联系接入首页顺序和导航锚点，路径：`frontend/src/app/App.tsx`、`frontend/src/app/sections.ts`
- [ ] T042 [US4] 验证 US4 的桌面和手机截图、视觉权重和范围排除说明，路径：`specs/001-homepage-v1/visual-review/us4.md`

**检查点**：所有用户故事均可独立验证，并且不引入完整路线规划或非香港巴士交通查询。

---

## 阶段 7：打磨与跨切面

**目的**：处理影响多个用户故事的契约一致性、三语完整性、视觉验收、性能和最终验证。

- [ ] T043 [P] 增加首页内容契约和下载 manifest schema 校验测试，路径：`frontend/src/tests/content-contract.test.ts`
- [ ] T044 [P] 增加三语缺失、硬编码用户可见文字和语言切换上下文保持检查，路径：`frontend/src/tests/i18n-completeness.test.tsx`
- [ ] T045 创建 Figma 对照和浏览器截图验收清单，路径：`specs/001-homepage-v1/visual-review/figma-checklist.md`
- [ ] T046 优化图片尺寸、首屏资源加载和响应式溢出控制，路径：`frontend/src/styles/global.css`、`frontend/src/components/hero/AppPreviewCarousel.module.css`
- [ ] T047 验证无密钥、私有 token、实时 API 地址或伪实时数据下发到前端，路径：`frontend/src/content/`
- [ ] T048 执行 `npm run build`、`npm run test` 和 Playwright 验证并修复失败项，路径：`frontend/package.json`、`frontend/playwright/`
- [ ] T049 启动本地服务并保存桌面、手机、下载按钮三状态、轮播和在线查询截图证据，路径：`specs/001-homepage-v1/visual-review/`

---

## 依赖与执行顺序

### 阶段依赖

- **设置（阶段 1）**：无依赖，可以立即开始。
- **基础设施（阶段 2）**：依赖阶段 1 完成，阻塞所有用户故事。
- **用户故事 1（阶段 3）**：依赖阶段 2 完成，是 MVP。
- **用户故事 2（阶段 4）**：依赖阶段 2 完成；与 US1 的首屏布局集成时需在 US1 文件基础上修改。
- **用户故事 3（阶段 5）**：依赖阶段 2 完成；可在 US1 后独立接入页面。
- **用户故事 4（阶段 6）**：依赖阶段 2 完成；可在 US1 后独立接入页面下方区块。
- **打磨（阶段 7）**：依赖目标用户故事完成。

### 用户故事依赖

- **US1（P1）**：基础设施完成后即可开始，不依赖其他用户故事。
- **US2（P2）**：基础设施完成后即可实现轮播内容与组件；接入 `HeroSection.tsx` 时依赖 US1 的首屏结构。
- **US3（P2）**：基础设施完成后即可实现静态在线查询区；不依赖 US2。
- **US4（P3）**：基础设施完成后即可实现下方信息区；不依赖 US2 或 US3，但最终页面顺序需与 US3 共存。

### 单个用户故事内部顺序

- 先定义测试或验证步骤，再实现组件和内容。
- 内容来源与三语文案先于用户可见组件落地。
- 下载、轮播、语言切换和在线查询状态必须随组件实现一起覆盖。
- 桌面与手机布局必须同步完成，不作为后补任务。
- 每个故事完成后先独立验证，再进入打磨阶段。

## 并行机会

- T006 可与 T001-T005 中不修改同一文件的设置任务并行。
- T011、T012、T013 可在 T007-T010 之外并行推进。
- 基础设施完成后，T014/T015、T024、T031、T037 可由不同开发者并行准备测试。
- US2 的 `carouselSlides.ts` 与 US3 的 `onlineQueryDemo.ts`、US4 的 `sectionsContent.ts` 可并行，因为文件互不冲突。
- 打磨阶段 T043 与 T044 可并行；T045 可与代码清理并行，但 T048/T049 必须在目标实现完成后执行。

## 并行执行示例

### US1

```bash
Task: T014 [P] [US1] frontend/src/tests/download-button.test.tsx
Task: T015 [P] [US1] frontend/src/tests/hero-content.test.ts
Task: T018 [P] [US1] frontend/src/components/i18n/LanguageSwitcher.tsx + frontend/src/components/sections/Header.tsx
Task: T020 [P] [US1] frontend/src/components/hero/HeroIntro.tsx
```

### US2

```bash
Task: T024 [P] [US2] frontend/src/tests/hero-carousel.test.tsx
Task: T026 [US2] frontend/src/content/carouselSlides.ts
Task: T027 [US2] frontend/src/assets/app-screenshots/
```

### US3

```bash
Task: T031 [P] [US3] frontend/src/tests/online-query-demo.test.tsx
Task: T033 [US3] frontend/src/content/onlineQueryDemo.ts
Task: T034 [US3] frontend/src/components/online-demo/OnlineQueryDemo.tsx
```

### US4

```bash
Task: T037 [P] [US4] frontend/src/tests/sections-content.test.ts
Task: T039 [US4] frontend/src/content/sectionsContent.ts
Task: T040 [US4] frontend/src/components/sections/FeatureGrid.tsx
```

## 实施策略

### MVP 优先

1. 完成阶段 1 设置。
2. 完成阶段 2 基础设施。
3. 完成阶段 3 用户故事 1。
4. 独立验证首屏产品认知、下载按钮三状态、三语文案和桌面/手机首屏。
5. 在 US1 可演示后，再继续 US2、US3、US4。

### 增量交付

1. 设置 + 基础设施 -> 可运行静态前端骨架、共享契约和三语基础。
2. US1 -> 可演示首屏和下载主流程。
3. US2 -> 可演示 App 功能轮播。
4. US3 -> 可演示在线查询静态区和范围限制。
5. US4 -> 可演示完整单页信息架构。
6. 打磨 -> 完成契约、三语、Figma、浏览器截图和构建验证。

## 独立测试标准汇总

- **US1**：桌面和手机首屏不滚动可识别产品与下载入口；Android 可下载状态可见；iPhone 暂未支持且点击不跳转。
- **US2**：4 个轮播项顺序、说明、分页状态和素材状态可见；桌面/手机展示模式符合 Figma。
- **US3**：在线查询区仅为静态演示，展示结果形态和限制说明，不发起真实路线查询。
- **US4**：核心功能、下载区、FAQ、反馈与联系完整出现，范围排除和平台限制说明清楚。

## 备注

- `[P]` 表示不同文件、无直接依赖、可并行执行。
- `[US]` 标签映射到规格中的用户故事，便于独立验收。
- 本任务清单刻意不包含服务端实现任务；`backend/README.md` 只记录未来 Go 1.26 + Gin + MySQL 服务边界。
- 每次 Spec Kit skill 完成并验证通过后必须自动提交，除非提交范围或信息不清晰。
