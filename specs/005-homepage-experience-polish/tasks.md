# 任务：首页体验精修

**输入**：来自 `/specs/005-homepage-experience-polish/` 的设计文档

**前置条件**：`plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/`、`quickstart.md`、`figma.md` 均已存在。

**测试**：本规格明确要求自动化与视觉验证，因此每个用户故事均包含对应 Vitest、Playwright 或截图验收任务。

**组织方式**：任务按用户故事分组，保证每个用户故事都能独立实现和验证。后端、服务端 DDD 和 OpenAPI 在本功能中为 N/A，任务只保留未漂移确认。

## 阶段 1：设置（共享基础）

**目的**：整理当前设计证据、视觉验收目录和 feature 入口，确保实现者不会凭口头描述实现。

- [X] T001 将 `specs/005-homepage-experience-polish/figma-plugin/README.md` 中已有的 Figma node ID 回填到 `specs/005-homepage-experience-polish/figma.md`
- [X] T002 创建视觉验收目录说明 `specs/005-homepage-experience-polish/visual-review/README.md`，列出 4 张必交截图、检查项和命名规则
- [X] T003 更新 `specs/005-homepage-experience-polish/quickstart.md`，加入当前 Figma node ID、visual-review 目录和本轮验证命令清单
- [X] T004 [P] 确认 `AGENTS.md` 当前 plan 指向 `specs/005-homepage-experience-polish/plan.md`

---

## 阶段 2：基础设施（阻塞前置）

**目的**：完成所有用户故事共享的内容契约、类型和事实来源。此阶段完成前不能开始用户故事实现。

- [X] T005 同步首页体验内容不变量到 `shared/contracts/homepage-content.schema.json`，覆盖 3 秒轮播、无缩略图、真实 logo、联系邮箱和三语要求
- [X] T006 更新 UI 状态长期契约 `shared/contracts/ui-state-contract.md`，记录低旋转阶梯牌堆、场景维度切换、同场景牌堆点击、暂停状态、减少动态效果、无编号和无常驻箭头规则
- [X] T007 [P] 扩展内容类型 `frontend/src/content/types.ts`，加入 FeatureCarouselPage、ScreenshotGroup、BrandLogoAsset、ContactEntry、LocalizedCopyItem 和 VisualReviewEvidence 字段
- [X] T008 [P] 更新事实来源清单 `frontend/src/content/sourceReferences.ts`，记录 Android icon 源路径、香港文案参考来源、005 feature contracts 和 Figma 文件链接
- [X] T009 [P] 增加契约验证测试 `frontend/src/tests/content-contract.test.ts`，校验 `specs/005-homepage-experience-polish/contracts/homepage-experience-content.schema.json` 与共享内容配置一致
- [X] T010 [P] 更新截图资产契约测试 `frontend/src/tests/screenshot-assets-contract.test.ts`，校验真实截图 manifest 的 gallery、defaultImageId、alt 三语和 approved 状态

**检查点**：共享类型、契约和事实来源稳定，可以并行推进用户故事。

---

## 阶段 3：用户故事 1 - 以更丝滑的首屏轮播理解 App 功能（优先级：P1）MVP

**目标**：把首屏轮播重构为低旋转阶梯牌堆：约 3 秒自动切换功能场景、支持左右滑动/桌面拖动切换场景、点点切换对应场景、同场景多图点击牌堆切换主图、无编号、无底部缩略图、无常驻箭头。

**独立测试**：在桌面 1440px 和手机 390px 打开首页，观察 10 秒并手动滑动/拖动一次；确认至少自动切换 2 次，交互期间暂停，减少动态效果下仍可手动查看。

### 用户故事 1 的测试或验证

- [X] T011 [P] [US1] 更新组件测试 `frontend/src/tests/hero-carousel.test.tsx`，覆盖 autoAdvanceMs=3000、10 秒内至少 2 次切换、键盘可访问切换、读屏标签、无 `01/02/03/04`、无常驻箭头和无缩略图控件
- [X] T012 [P] [US1] 更新浏览器测试 `frontend/playwright/hero-carousel.spec.ts`，覆盖桌面拖动、手机触控滑动、键盘切换、hover/focus/drag/touch 暂停和语言切换后索引保持
- [X] T013 [P] [US1] 更新首屏浏览器测试 `frontend/playwright/homepage-hero.spec.ts`，断言 stair-card-deck 在 1440px 和 390px 下不遮挡 hero 文案和主要行动入口
- [X] T014 [US1] 在 `specs/005-homepage-experience-polish/quickstart.md` 补充 US1 独立验证步骤和预期失败样例

### 用户故事 1 的实现

- [X] T015 [US1] 更新轮播内容模型 `frontend/src/content/carouselSlides.ts`，按 favorite-citybus-routes、route-comparison、eta-details、predeparture-monitor 固定 4 个功能页和 gallery 规则
- [X] T016 [US1] 重构轮播状态机 `frontend/src/components/hero/AppPreviewCarousel.tsx`，实现自动播放、暂停/恢复、拖动/滑动阈值、键盘/读屏可访问的非视觉抢占式切换控件、减少动态效果和语言切换状态保持
- [X] T017 [US1] 重构轮播样式 `frontend/src/components/hero/AppPreviewCarousel.module.css`，实现单主图、左右低强调预览、300-700ms 过渡和无底部缩略图布局
- [X] T018 [US1] 改造截图展示组件 `frontend/src/components/hero/ScreenshotStack.tsx`，移除底部小图堆叠、胶片条、缩略图按钮组和常驻箭头逻辑
- [X] T019 [US1] 改造截图展示样式 `frontend/src/components/hero/ScreenshotStack.module.css`，确保单图功能页不显示相邻预览或更多截图暗示
- [X] T020 [US1] 更新首屏集成 `frontend/src/components/hero/HeroSection.tsx`，确保 hero 文案、轮播和 CTA 在桌面/手机布局中互不遮挡
- [X] T021 [US1] 在 `frontend/src/components/hero/AppPreviewCarousel.tsx` 为非显而易见的轮播状态机、手势阈值、键盘/读屏切换和减少动态效果边界补充中文注释

**检查点**：用户故事 1 可独立运行和验收，是本功能 MVP。

---

## 阶段 4：用户故事 2 - 通过香港语境和自然英文理解网站（优先级：P1）

**目标**：全站新增或修改文案覆盖 `zh-Hant`、`zh-Hans`、`en`，其中 `zh-Hant` 独立改写为香港实用书面语，`en` 使用自然克制的英语产品表达，并明确 Citybus / 城巴范围边界。

**独立测试**：切换到繁体中文和英文并抽查 header、hero、轮播、功能、在线查询、下载、FAQ、footer、状态提示、alt 和 aria；确认繁体不是简体直转繁，英文不是中文句式直译，并且三语事实同步。

### 用户故事 2 的测试或验证

- [X] T022 [P] [US2] 更新三语完整性测试 `frontend/src/tests/i18n-completeness.test.tsx`，覆盖 header、hero、carousel、features、online-query、download、faq、footer、status、accessibility
- [X] T023 [P] [US2] 更新内容回归测试 `frontend/src/tests/sections-content.test.ts`，断言 `zh-Hant` 关键短语使用香港交通语境且保留 Citybus / 城巴范围排除说明
- [X] T024 [P] [US2] 更新首屏内容测试 `frontend/src/tests/hero-content.test.ts`，断言轮播和 hero 三语事实一致且 `zh-Hant` 不是 `zh-Hans` 简单字形转换
- [X] T025 [US2] 新增文案审校记录 `specs/005-homepage-experience-polish/zh-hant-copy-review.md`，列出参考来源、`zh-Hant` 关键用词、`en` 语气、范围排除和审校结论

### 用户故事 2 的实现

- [X] T026 [US2] 改写全局 UI 文案 `frontend/src/content/uiCopy.ts`，将支持语义改为联系语义并补齐所有按钮、状态、错误、aria 三语
- [X] T027 [US2] 改写首页主内容 `frontend/src/content/homepageContent.ts`，让 `zh-Hant` 使用香港实用书面语，`en` 使用自然克制的英语产品表达，`zh-Hans` 保持自然简体表达
- [X] T028 [US2] 改写轮播文案 `frontend/src/content/carouselSlides.ts`，覆盖 4 个功能页标题、说明、alt 和范围边界
- [X] T029 [US2] 改写功能、下载、FAQ 与页脚内容 `frontend/src/content/sectionsContent.ts`，明确当前聚焦 Citybus / 城巴且不支持九巴、港铁、铁路、渡轮或完整路线规划
- [X] T030 [US2] 改写在线查询示例和状态文案 `frontend/src/content/onlineQueryDemo.ts`，使用香港交通语境并保留既有降级事实
- [X] T031 [US2] 更新文案来源映射 `frontend/src/content/sourceReferences.ts`，把 Citybus、HKeMobility、Transport Department、GovHK 仅标记为措辞参考而非功能事实来源

**检查点**：用户故事 2 可独立切换三语并通过内容测试。

---

## 阶段 5：用户故事 3 - 看到真实 App 品牌和正确联系入口（优先级：P2）

**目标**：header、footer 和 favicon 使用 Android App 真实前景巴士主体；导航和页脚改为“联系我们 / Contact Us”，邮箱为 `hezhenyu966@gmail.com`。

**独立测试**：打开首页检查 header、footer、favicon 和邮件链接；确认不使用 lucide 线框巴士、launcher 背景底板、旧支持语义或 `feedback@busiscoming.local`。

### 用户故事 3 的测试或验证

- [X] T032 [P] [US3] 更新品牌与联系内容测试 `frontend/src/tests/sections-content.test.ts`，断言三语联系标签、`mailto:hezhenyu966@gmail.com` 和旧邮箱清除
- [X] T033 [P] [US3] 更新首屏与页脚浏览器测试 `frontend/playwright/homepage-sections.spec.ts`，断言 header/footer 显示真实 logo 图像且联系入口可点击
- [X] T034 [P] [US3] 更新首页浏览器测试 `frontend/playwright/homepage-hero.spec.ts`，断言 favicon、header logo、语言切换和联系入口在 1440px/390px 下无重叠

### 用户故事 3 的实现

- [X] T035 [US3] 从 `/Users/jianglijie/AndroidStudioProjects/BusIsComming/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png` 导出透明巴士主体到 `frontend/src/assets/brand/busiscoming-logo-foreground.png`
- [X] T036 [US3] 基于同源前景图更新 favicon 资产 `frontend/public/favicon.webp`，不得恢复 launcher 背景底板
- [X] T037 [US3] 更新品牌资产说明 `frontend/src/assets/brand/README.md`，记录 Android 源路径、裁切规则、透明背景和 header/footer/favicon 使用范围
- [X] T038 [US3] 更新 header 组件 `frontend/src/components/sections/Header.tsx`，使用真实 logo 图像并显示三语“联系我们 / Contact Us”入口
- [X] T039 [US3] 更新 header 样式 `frontend/src/components/sections/Header.module.css`，保证 logo、品牌名、语言切换和联系入口在桌面/手机不重叠
- [X] T040 [US3] 更新 footer 组件 `frontend/src/components/sections/FooterContact.tsx`，使用同一 logo 口径、真实邮箱和 `mailto:hezhenyu966@gmail.com`
- [X] T041 [US3] 更新 footer 样式 `frontend/src/components/sections/FooterContact.module.css`，保证联系信息在 390px 和 1440px 下清晰可点
- [X] T042 [US3] 更新 favicon 引用 `frontend/index.html`，确保页面使用 `frontend/public/favicon.webp`

**检查点**：用户故事 3 可独立验收品牌和联系入口。

---

## 阶段 6：用户故事 4 - 在桌面和手机上稳定验收视觉效果（优先级：P2）

**目标**：用自动化、截图和记录证明实现没有偏离：没有底部缩略图、编号、常驻箭头、旧邮箱或旧支持语义，且桌面/手机视觉稳定。

**独立测试**：运行 quickstart 中的 Vitest、build、Playwright 和截图保存步骤；检查 `visual-review/` 下 4 张截图和验收记录。

### 用户故事 4 的测试或验证

- [X] T043 [P] [US4] 新增视觉回归浏览器测试 `frontend/playwright/homepage-experience-polish.spec.ts`，保存桌面和手机轮播、品牌联系截图到 `specs/005-homepage-experience-polish/visual-review/`
- [X] T044 [P] [US4] 新增全站旧内容清除测试 `frontend/src/tests/homepage-experience-regression.test.ts`，搜索 `feedback@busiscoming.local`、旧支持语义、`01/02/03/04` 和缩略图控件线索
- [X] T045 [US4] 更新 Playwright 配置 `frontend/playwright.config.ts`，确保 1440px 桌面和 390px 手机项目可稳定生成本 feature 截图

### 用户故事 4 的实现

- [X] T046 [US4] 生成桌面轮播截图 `specs/005-homepage-experience-polish/visual-review/desktop-1440-carousel-rail.png`
- [X] T047 [US4] 生成手机轮播截图 `specs/005-homepage-experience-polish/visual-review/mobile-390-carousel-rail.png`
- [X] T048 [US4] 生成桌面品牌联系截图 `specs/005-homepage-experience-polish/visual-review/desktop-1440-brand-contact.png`
- [X] T049 [US4] 生成手机品牌联系截图 `specs/005-homepage-experience-polish/visual-review/mobile-390-brand-contact.png`
- [X] T050 [US4] 在 `specs/005-homepage-experience-polish/visual-review/README.md` 记录 4 张截图的验收结论、无重叠结论和剩余风险
- [X] T051 [US4] 更新 `specs/005-homepage-experience-polish/quickstart.md`，记录最终验证命令、截图路径、Figma 节点和服务端 API 未漂移结论

**检查点**：全部用户故事均可通过自动化和视觉证据独立验收。

---

## 阶段 7：打磨与跨切面

**目的**：处理影响多个用户故事的质量、文档、性能和回归验证。

- [X] T052 [P] 运行并修复前端静态测试，命令记录在 `specs/005-homepage-experience-polish/quickstart.md`
- [X] T053 [P] 运行并修复前端构建，命令记录在 `specs/005-homepage-experience-polish/quickstart.md`
- [X] T054 [P] 运行并修复浏览器端到端测试，命令记录在 `specs/005-homepage-experience-polish/quickstart.md`
- [X] T055 确认新增 logo 资产体积、透明度和小尺寸清晰度，结果记录在 `frontend/src/assets/brand/README.md`
- [X] T056 确认 `backend/`、`shared/contracts/openapi/download-api.openapi.yaml` 和 `shared/contracts/openapi/route-query-api.openapi.yaml` 未因本功能发生服务端 API 漂移
- [X] T057 搜索并清理用户可见旧内容，检查范围为 `frontend/src/`、`frontend/playwright/` 和 `specs/005-homepage-experience-polish/visual-review/README.md`
- [X] T058 确认复杂轮播状态、手势阈值、logo 来源和文案审校边界已有必要中文注释，检查范围为 `frontend/src/components/hero/AppPreviewCarousel.tsx` 和 `frontend/src/content/sourceReferences.ts`
- [X] T059 更新最终实施记录 `specs/005-homepage-experience-polish/quickstart.md`，包含测试结果、截图结果、未修改后端 API 和剩余风险

---

## 依赖与执行顺序

### 阶段依赖

- **阶段 1 设置**：无依赖，可以立即开始
- **阶段 2 基础设施**：依赖阶段 1，阻塞所有用户故事
- **阶段 3 US1**：依赖阶段 2，是 MVP
- **阶段 4 US2**：依赖阶段 2，可与 US1 并行规划，但修改 `carouselSlides.ts` 时需串行合并
- **阶段 5 US3**：依赖阶段 2，可与 US1/US2 并行规划，但修改 `uiCopy.ts`、`sectionsContent.ts` 时需串行合并
- **阶段 6 US4**：依赖 US1、US2、US3 的实现结果
- **阶段 7 打磨**：依赖目标用户故事完成

### 用户故事依赖

- **US1（P1）**：基础设施完成后即可开始，不依赖其它用户故事
- **US2（P1）**：基础设施完成后即可开始；和 US1 共享 `carouselSlides.ts`，落地时先合并内容模型再审校文案
- **US3（P2）**：基础设施完成后即可开始；联系文案与 US2 共享内容文件，落地时以 US3 的真实邮箱和联系语义为最终口径
- **US4（P2）**：依赖 US1/US2/US3 输出，用于最终验收和防回归

### 单个用户故事内部顺序

1. 先更新或新增测试与验证步骤，确认现状失败或覆盖缺口明确。
2. 再更新内容模型、资产、组件和样式。
3. 同步更新中文注释、quickstart、Figma/visual-review 记录。
4. 独立运行该用户故事的测试，再进入后续故事或最终打磨。

---

## 并行机会

- **设置**：T004 可与 T001-T003 并行。
- **基础设施**：T007、T008、T009、T010 可并行，完成后再合并契约结果。
- **US1**：T011、T012、T013 可并行；T015-T021 需要按组件依赖顺序执行。
- **US2**：T022、T023、T024 可并行；T026-T031 需要避免同文件冲突。
- **US3**：T032、T033、T034 可并行；T035-T042 需要按资产到组件引用顺序执行。
- **US4**：T043、T044 可并行；T046-T050 依赖最终页面可运行。
- **打磨**：T052、T053、T054 可并行触发，但修复同一文件时需要串行。

---

## 实施策略

### MVP 优先

1. 完成阶段 1 和阶段 2。
2. 完成 US1 的测试、轮播实现和独立验收。
3. 停止并用桌面/手机确认低旋转阶梯牌堆没有缩略图堆叠、编号或常驻箭头，并且后方图片底部不低于主图底部。

### 增量交付

1. MVP：US1 轮播体验。
2. 继续 US2：香港繁中文案和三语事实同步。
3. 继续 US3：真实 logo、联系入口和邮箱。
4. 完成 US4：截图、Playwright、回归门禁和 quickstart 记录。
5. 每个故事完成后运行对应测试，不能破坏前面已通过的故事。

## 备注

- [P] 表示不同文件、无直接依赖、可并行执行。
- 所有任务均包含真实文件路径，且用户故事阶段任务均带有 `[US1]`、`[US2]`、`[US3]` 或 `[US4]` 标签。
- 本功能不新增、修改或移除服务端 HTTP API；如实现时发现 API 变更需求，必须停止并扩展 spec/plan/contracts，而不是直接改后端。
- 每次 Spec Kit skill 完成并验证通过后必须自动提交，除非提交范围或信息不清晰。
