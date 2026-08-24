# 任务：优化首页故事与核心入口

**输入**：来自 `/specs/015-refine-homepage-interactions/` 的规格、计划、研究、数据模型、Figma 门禁、合同与验收指南

**前置条件**：[plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、[data-model.md](./data-model.md)、[figma.md](./figma.md)、[quickstart.md](./quickstart.md) 与 `contracts/` 均已完成

**测试策略**：本功能明确采用合同红测与 TDD。每个用户故事先新增或迁移失败测试，再实施对应代码；静态截图只验收 settled 帧，start／160ms／settled 由受控阶段协议与人工动效复核证明。

**范围约束**：本任务清单只修改公开前端、共享内容/UI 合同、受管品牌/截图素材、Figma 增量插件及 015 证据；除 FR-023 批准的 desktop Hero → `#download`、mobile ready → APK 入口分流外，不得修改后端行为、OpenAPI 语义、路线算法、下载资料来源、最终安装包目标、monitoring UI、Android App 或 014 历史产物。

## 格式：`[ID] [P?] [Story] 描述`

- **[P]**：依赖已满足后可与同阶段其他 `[P]` 任务并行，且不修改同一文件
- **[Story]**：用户故事阶段使用 `[US1]`–`[US5]`；设置、基础设施和最终阶段不使用故事标签
- 每项任务均包含准确文件路径；命令验证任务列出其直接检查的路径

---

## 阶段 1：设置与 Figma 生产门禁

**目的**：在任何 `frontend/src/` 生产 UI 修改之前建立独立的 015 Figma 设计源、真实节点和 reference 证据。

**关键门禁**：T001–T007 全部完成前，不得执行阶段 2 以后会修改生产 UI 的任务；不得覆盖 Figma 014 Section `119:64`，不得发明 node ID 或声称未发生的 MCP readback。

- [ ] T001 按 `specs/015-refine-homepage-interactions/figma.md` 建立独立插件骨架与运行说明，创建 `docs/superpowers/prototypes/2026-08-25-homepage-refinement-figma-import/package.json`、`manifest.json`、`ui.html` 和 `README.md`
- [ ] T002 [P] 将 1440／390／320、zh-Hant／en Story 01、五故事双截图、start／160ms／settled、路线三态、下载分流、无日期和 Privacy 状态固化到 `docs/superpowers/prototypes/2026-08-25-homepage-refinement-figma-import/src/design-contract.mjs`
- [ ] T003 [P] 先为 Section 隔离、Frame 名称/尺寸、10 个 image fill、真实 Logo、无 Header/日期和私有路径规则编写失败测试，路径：`docs/superpowers/prototypes/2026-08-25-homepage-refinement-figma-import/test/design-contract.test.mjs`、`test/build-output.test.mjs`
- [ ] T004 实现可原子生成 015 FINAL Section 的插件模板、双截图/Logo 指纹校验和构建脚本，路径：`docs/superpowers/prototypes/2026-08-25-homepage-refinement-figma-import/src/plugin-template.js`、`scripts/build.mjs`、`dist/code.js`
- [ ] T005 使用 `HOMEPAGE_STORY_ZH_SOURCE_DIR` 与 `HOMEPAGE_STORY_EN_SOURCE_DIR` 构建并测试插件，确认输出不序列化环境值且不读写 014 Section，验证路径：`docs/superpowers/prototypes/2026-08-25-homepage-refinement-figma-import/`
- [ ] T006 在 Figma Desktop 实际运行 015 插件，选择并导出真实 refinement Section 与关键 Frame，把实际 node ID、尺寸、导出方式和 SHA 写入 `specs/015-refine-homepage-interactions/figma.md`、`visual-review/reference/`、`visual-review/manifest.json`
- [ ] T007 逐项检查 reference 与获批 2026-08-25 设计增量一致、节点可定位、PNG 非空且无占位/私有路径，并在 `specs/015-refine-homepage-interactions/visual-review/figma-gate.md` 记录生产 UI 门禁结论

**检查点**：015 Figma FINAL refinement 和 reference 已真实存在；只有门禁结论为通过时才进入基础设施。

---

## 阶段 2：共享合同、内容、素材与测试基础设施

**目的**：先迁移所有故事共用的内容 v4、截图 manifest v3、真实品牌来源和确定性测试协议。

**关键要求**：合同测试先失败；截图导入必须原子完成；本阶段不得修改后端、OpenAPI 或 014 文件。

- [ ] T008 [P] 先把 Header navigation、manual-only、download updated 的旧断言迁移为 015 失败合同测试，路径：`frontend/src/tests/content-contract.test.ts`、`frontend/src/tests/homepage-experience-regression.test.ts`、`frontend/src/tests/sections-content.test.ts`
- [ ] T009 [P] 先为 manifest v3、5×2×3 唯一输出、1080×1920 指纹、原子失败不改文件和私有路径防泄漏编写失败测试，路径：`frontend/src/tests/screenshot-assets-contract.test.ts`、`frontend/src/tests/prepare-homepage-story-assets.test.ts`
- [ ] T010 将 feature 内容 v4 与交互增量同步为长期权威合同，替换 `shared/contracts/homepage-content.schema.json` 并增量更新 `shared/contracts/ui-state-contract.md`，保持 `shared/contracts/route-query-ui-state.md` 与 `shared/contracts/openapi/` 不变
- [ ] T011 将内容实例和 TypeScript 类型迁移到 `HomepageContentV4`，加入 `siteChrome` 与真实 Figma refinement 节点、移除 navigation/updated，并更新来源引用，路径：`frontend/src/content/types.ts`、`homepageContent.ts`、`sourceReferences.ts`
- [ ] T012 重构双源截图准备脚本并补充 npm 命令：先在临时 staging 校验 10 个 basename/SHA/尺寸并生成 30 个 WebP，成功后原子替换且错误不输出环境值，路径：`frontend/scripts/prepare-homepage-story-assets.mjs`、`frontend/package.json`
- [ ] T013 使用两个环境变量执行原子导入，生成 `{storyId}-{zh|en}-{540|720|1080}.webp` 和 manifest v3，并核对 30 个受管输出，路径：`frontend/src/assets/app-screenshots/real/`
- [ ] T014 将截图运行时映射升级为 `storyId → locale variant → src/srcSet` 且固定 9:16 固有尺寸，不提供跨语言回退，路径：`frontend/src/content/storyAssets.ts`、`frontend/src/content/types.ts`
- [ ] T015 校验 192×192 透明真实 App Logo 的批准 SHA，更新其 Hero/Privacy/Footer 用途与旧 BrandMark 退役边界，路径：`docs/asset-provenance.md`、`frontend/src/tests/screenshot-assets-contract.test.ts`
- [ ] T016 [P] 将 Playwright 窄屏改为 320×844，并让视觉 helper 通过 `visual-review` pause、字体、目标图片和最新 epoch settled 稳定截图，路径：`frontend/playwright.config.ts`、`frontend/playwright/helpers/homepageVisual.ts`、`frontend/src/tests/visual-comparison-script.test.ts`
- [ ] T017 运行 AJV/内容/素材聚焦测试并扫描 014 未改、后端/OpenAPI 无差异和私有路径泄漏，检查路径：`specs/015-refine-homepage-interactions/contracts/`、`shared/contracts/`、`frontend/src/assets/app-screenshots/real/`、`backend/`

**检查点**：Figma reference、共享合同、三语内容骨架、双语截图和确定性测试基础全部可用，用户故事实现可以开始。

---

## 阶段 3：用户故事 1 - 自动看懂五个核心故事（优先级：P1）MVP

**目标**：首屏五故事按 settled 后首次 10 秒、自动 5 秒、手动/语言/恢复 10 秒轮播，并以“舞台先行、文字约 160ms 后随、约 820ms 稳定”完成唯一一致转场。

**独立测试**：只打开 Hero，在可控 timers/observer 下验证完整时间矩阵、05→01、多暂停原因、快速 epoch、自动不播报和 reduced motion；再在桌面/手机浏览器观察五故事切换，不依赖其他页面改动。

### 用户故事 1 的测试与验证

- [ ] T018 [P] [US1] 先为 initial/automatic/manual/current/locale/resume 时间、单 dwell timer、复合 pause reasons、epoch 失效和卸载清理编写 fake-timer 失败测试，路径：`frontend/src/tests/hero-story-controller.test.tsx`
- [ ] T019 [P] [US1] 先迁移 manual-only 测试并加入 05→01、hover/键盘 focus/offscreen/hidden、自动不抢焦点/播报和 reduced-motion 失败场景，路径：`frontend/src/tests/hero-carousel.test.tsx`、`frontend/playwright/hero-carousel.spec.ts`

### 用户故事 1 的实现

- [ ] T020 [US1] 实现 `requestedStoryId`、`settledStoryId`、`transitionEpoch`、selection origin、单 dwell timer 与暂停原因集合，并用简体中文解释计时/epoch 不变量，路径：`frontend/src/hooks/useHeroStoryController.ts`
- [ ] T021 [US1] 以目标 transform `transitionend` 加目标图 decode/load/稳定失败壳实现 epoch-aware settled，约 820ms 仅作丢事件保护，路径：`frontend/src/components/hero/HeroStoryStage.tsx`
- [ ] T022 [US1] 在 Hero 中接入轮播控制器、归一化播放区域可见度、键盘输入模态与只读离场文案快照，保持 active story 为唯一业务真相，路径：`frontend/src/components/hero/HeroSection.tsx`
- [ ] T023 [US1] 将故事轨 live region 改为只在最终手动 settled 后原子播报一次，同时保留 Arrow/Home/End 与 roving tabindex，路径：`frontend/src/components/hero/HeroStoryRail.tsx`
- [ ] T024 [US1] 实现舞台先行、文案约 160ms 后随、完整约 820ms 的 transform/opacity/轻 blur 动效及即时 reduced-motion 交换，路径：`frontend/src/components/hero/HeroSection.module.css`、`HeroStoryStage.module.css`、`HeroStoryRail.module.css`
- [ ] T025 [US1] 运行 US1 单元/E2E 聚焦矩阵，证明 SC-001–SC-004、无两个 front、无陈旧 settled 和无重复播报，记录到 `specs/015-refine-homepage-interactions/visual-review/us1-result.md`
- [ ] T026 [US1] 在桌面与手机标准/减少动态模式人工观察 start／160ms／settled 三相和快速切换质感，记录无明显回弹及无可见暂停按钮限制，路径：`specs/015-refine-homepage-interactions/visual-review/us1-motion-review.md`

**检查点**：US1 可独立自动展示五个故事，并在所有输入、暂停和辅助技术路径上保持最终一致。

---

## 阶段 4：用户故事 2 - 直接切换语言并看到正确截图（优先级：P1）

**目标**：首页首行直接呈现真实 Logo、品牌名和 `繁 · 简 · EN`，切换语言保持页面状态并显示正确截图 variant；失败时只显示目标语言稳定失败壳。

**独立测试**：在五故事 × 三语言 15 个组合中验证繁简→zh、英文→en；切换不 reload、不改变 story/scroll/route/download/FAQ，三项语言一次可达且 44×44。

### 用户故事 2 的测试与验证

- [ ] T027 [P] [US2] 先为真实品牌首行、直接语言链接、真实本地化 URL、`aria-current`、44×44、非 sticky 和无 Header/disclosure 编写失败测试，路径：`frontend/src/tests/header-navigation.test.tsx`、`frontend/src/tests/homepage-visual-contract.test.ts`
- [ ] T028 [P] [US2] 先为 15 种 story/locale 组合、目标图失败壳、无跨语言回退及语言切换状态保持编写失败测试，路径：`frontend/src/tests/i18n-state-preservation.test.tsx`、`frontend/playwright/homepage-hero.spec.ts`

### 用户故事 2 的实现

- [ ] T029 [P] [US2] 建立复用真实 `busiscoming-icon.webp` 的轻量品牌组件并保留可访问名称，路径：`frontend/src/components/brand/AppBrand.tsx`、`AppBrand.module.css`
- [ ] T030 [P] [US2] 建立同时显示三语、真实 href、脚本内切换和 `aria-current` 的直达语言组件，路径：`frontend/src/components/i18n/InlineLanguageLinks.tsx`、`InlineLanguageLinks.module.css`
- [ ] T031 [US2] 将品牌与语言组件放入 Hero 正常文档流，并从公开首页移除独立 Header/占位且保持 I18nProvider 不重挂载，路径：`frontend/src/components/hero/HeroSection.tsx`、`frontend/src/app/App.tsx`
- [ ] T032 [US2] 让前景图按 locale variant 切换、保持 9:16 槽位，并在 decode/load 失败时渲染目标语言同尺寸失败壳，路径：`frontend/src/components/hero/HeroStoryStage.tsx`、`frontend/src/components/hero/HeroStoryStage.module.css`
- [ ] T033 [US2] 更新三语 alt/aria/error 文本并独立审校繁中香港语气和英文产品语气，路径：`frontend/src/content/homepageStories.ts`、`frontend/src/content/uiCopy.ts`
- [ ] T034 [US2] 运行 15 组合、状态保持、无 Header 和截图失败 E2E，并保存双语言 settled 证据与结论，路径：`specs/015-refine-homepage-interactions/visual-review/us2-result.md`、`visual-review/actual/`

**检查点**：US2 可独立通过一次操作切换三语，并始终显示对应语言截图且不丢失页面业务状态。

---

## 阶段 5：用户故事 3 - 在合适设备上完成下载决策（优先级：P1）

**目标**：桌面 Hero 下载始终进入第三屏，手机仅在 ready 时直接下载；二维码、第三屏行动和手机行动收敛到同一真实目标，所有状态不显示日期。

**独立测试**：在 desktop/mobile × checking/ready/unavailable × 三语言中验证 href/download/QR 语义与无日期；reduced motion 桌面即时到达 `#download`。

### 用户故事 3 的测试与验证

- [ ] T035 [P] [US3] 先为 desktop `#download`、mobile ready APK、mobile 非 ready 禁用及同一 metadata URL 编写失败单元测试，路径：`frontend/src/tests/android-download-action.test.tsx`、`frontend/src/tests/download-button.test.tsx`
- [ ] T036 [P] [US3] 先为桌面/手机三态、QR 收敛、reduced-motion 锚点和三语无日期编写失败 E2E，路径：`frontend/playwright/android-download.spec.ts`、`platform-download-states.spec.ts`、`apk-metadata.spec.ts`

### 用户故事 3 的实现

- [ ] T037 [US3] 用与二维码相同的 `(min-width: 821px)` 语义实现可测试 viewport 上下文，不读取 User-Agent，路径：`frontend/src/hooks/useDesktopViewport.ts`、`frontend/src/tests/use-desktop-viewport.test.tsx`
- [ ] T038 [US3] 为 Hero/section 建立明确下载上下文：desktop 永远是无 download 属性的 `#download`，mobile ready 才有 APK href/download，路径：`frontend/src/components/download/AndroidDownloadAction.tsx`、`AndroidDownloadAction.module.css`、`frontend/src/components/hero/HeroSection.tsx`
- [ ] T039 [US3] 从 ready metadata 展示中删除 lastUpdated/静态日期，只保留版本、Android 7.1+ 与本地化大小，路径：`frontend/src/components/download/DownloadMetadataLine.tsx`、`frontend/src/components/sections/DownloadSection.tsx`
- [ ] T040 [US3] 运行下载三态、双端目标收敛、无伪造 QR/href 和全站日期零出现验证，保存结果到 `specs/015-refine-homepage-interactions/visual-review/us3-result.md`

**检查点**：US3 在电脑和手机上各走最短批准路径，下载不可用时仍诚实受控且没有日期。

---

## 阶段 6：用户故事 4 - 在手机上紧凑地试查路线（优先级：P2）

**目标**：手机把 origin/destination 放在左侧 stack、交换按钮放在右侧并按两个真实输入面整体居中；候选和错误不改变按钮锚点，桌面与路线业务不回归。

**独立测试**：在 390×844、320×844 的 default/candidate/error/selected 状态检查几何、焦点和 swap 行为，并运行现有路线 request sequence/retained/ETA 回归。

### 用户故事 4 的测试与验证

- [ ] T041 [P] [US4] 先为新的 input stack DOM、交换行为和现有查询/错误/retained 语义编写失败单元测试，路径：`frontend/src/tests/online-query-demo.test.tsx`
- [ ] T042 [P] [US4] 先为 390/320 下 default/candidate/error/selected 的右侧 swap 几何、44×44、无覆盖和无横向滚动编写失败 E2E，路径：`frontend/playwright/online-query-demo.spec.ts`

### 用户故事 4 的实现

- [ ] T043 [US4] 只重组 origin/destination 与 swap 的容器结构，不修改 `swapPlaces()`、request sequence、route query、ETA 或 retained 逻辑，路径：`frontend/src/components/online-demo/OnlineQueryDemo.tsx`
- [ ] T044 [US4] 用手机两列 grid 把 swap 锚定两个 input surface 的整体中心，保持 listbox/error 正常定位并保留桌面布局，路径：`frontend/src/components/online-demo/OnlineQueryDemo.module.css`
- [ ] T045 [US4] 运行路线单元/E2E 回归并保存 390/320 四状态几何证据，记录到 `specs/015-refine-homepage-interactions/visual-review/us4-result.md`、`visual-review/actual/`

**检查点**：US4 在两种手机宽度下节省一行空间且不改变任何路线业务状态。

---

## 阶段 7：用户故事 5 - 在不同屏幕上获得一致的高保真构图（优先级：P2）

**目标**：让 1440×960、390×844、320×844 和中间宽度连续适配，完整保留品牌、标题、行动、9:16 手机四边、环形远近、故事轨、Privacy 返回与页尾品牌，不做整页缩放。

**独立测试**：三 viewport 下，`zh-Hant`/`en` 对照 Figma reference，`zh-Hans` 只验证文本、溢出、无横向滚动、触控目标与关键几何；resize/orientation 前后保持 story/locale/route/download/FAQ；检查无 sticky Header、无裁切/覆盖/横向滚动和所有核心目标 ≥44×44。

### 用户故事 5 的测试与验证

- [ ] T046 [P] [US5] 先为 App/Privacy/Footer 真实品牌、无公开 Header、自然划走和 resize 状态保持编写失败单元测试，路径：`frontend/src/tests/homepage-experience-regression.test.ts`、`privacy-policy-page.test.tsx`、`i18n-state-preservation.test.tsx`
- [ ] T047 [P] [US5] 先为 1440/390/320、三语、触控目标、完整四边、轨道不覆盖、无横向滚动及 Privacy 返回编写失败 E2E，路径：`frontend/playwright/homepage-accessibility.spec.ts`、`homepage-experience-polish.spec.ts`、`privacy-policy-pages.spec.ts`

### 用户故事 5 的实现

- [ ] T048 [US5] 移除 Header 高度补偿、负 anchor offset、全局 scroll margin 和固定 1440 坐标依赖，以 token/clamp/grid/max-width 连续排布 Hero，路径：`frontend/src/styles/global.css`、`frontend/src/components/hero/HeroSection.module.css`、`HeroStoryStage.module.css`、`HeroStoryRail.module.css`
- [ ] T049 [US5] 为 Privacy 建立真实 Logo/品牌/本地化返回首页首行，为 Footer 统一真实 Logo 与 support links，并删除无生产引用的旧 Header/BrandMark/LanguageSwitcher，路径：`frontend/src/components/privacy/PrivacyPolicyPage.tsx`、`PrivacyPolicyPage.module.css`、`frontend/src/components/sections/FooterContact.tsx`、`FooterContact.module.css`、`Header.tsx`、`Header.module.css`、`frontend/src/components/brand/BrandMark.tsx`、`BrandMark.module.css`、`frontend/src/components/i18n/LanguageSwitcher.tsx`、`LanguageSwitcher.module.css`
- [ ] T050 [US5] 对下载、路线、FAQ、联系和页尾执行流式间距/最大宽度收敛，确保首屏删除 Header 后四段锚点和内容层级不漂移，路径：`frontend/src/components/sections/DownloadSection.module.css`、`FaqSection.module.css`、`ContactStrip.module.css`、`FooterContact.module.css`、`frontend/src/components/online-demo/OnlineQueryDemo.module.css`
- [ ] T051 [US5] 在确定性 pause 下生成三 viewport、三语言和关键故事/页面的 settled 浏览器截图并更新固定 golden，路径：`frontend/playwright/homepage-visual-regression.spec.ts`、`frontend/playwright/__screenshots__/`、`specs/015-refine-homepage-interactions/visual-review/actual/`
- [ ] T052 [US5] 将比较脚本默认根切换到 015，并为每个同 viewport reference/actual 生成 side-by-side、50% overlay、diff 与 SHA 清单，路径：`frontend/scripts/compare-homepage-visuals.mjs`、`specs/015-refine-homepage-interactions/visual-review/`
- [ ] T053 [US5] 逐项人工复核标题分行、真实 Logo、语言入口、环形远近、9:16 四边、故事轨、CTA、无日期、无横向滚动和 reduced motion；记录 `zh-Hant`/`en` Figma 像素对照结论，并把 `zh-Hans` 明确记录为文本、溢出与几何验收，路径：`specs/015-refine-homepage-interactions/visual-review/final-figma-review.md`
- [ ] T054 [US5] 运行 resize/orientation 状态保持与三 viewport 独立验收，记录 SC-008、SC-010、SC-011、SC-012 结果到 `specs/015-refine-homepage-interactions/visual-review/us5-result.md`

**检查点**：US1–US5 在批准端点和窄屏保护宽度上均可独立验证，浏览器 actual 与真实 Figma reference 无阻断漂移。

---

## 阶段 8：打磨、三语审校与跨切面验证

**目的**：完成全量回归、文档闭环、安全/范围检查和可追踪提交，不扩大功能范围。

- [ ] T055 [P] 对本轮新增/改动三语文案、alt、aria、失败壳和 Privacy 返回入口进行逐项审校，记录繁中香港语气、简中自然表达与英文非机械直译结论，路径：`specs/015-refine-homepage-interactions/zh-hant-en-copy-review.md`
- [ ] T056 [P] 复核长期合同与当前 runtime 一致，确认不再要求 Header、disclosure、manual-only、单语言图或 updated，同时保持既有路线 UI 合同，路径：`shared/contracts/homepage-content.schema.json`、`shared/contracts/ui-state-contract.md`、`shared/contracts/route-query-ui-state.md`
- [ ] T057 运行完整 `npm --prefix frontend run test`、`build`、`test:e2e`，并在 `specs/015-refine-homepage-interactions/visual-review/final-validation.md` 分别记录自动化、真实浏览器、三语、三 viewport 和 reduced-motion 结果
- [ ] T058 [P] 运行现有 OpenAPI lint/bundle 并核对 `backend/`、`shared/contracts/openapi/` 无本功能语义差异；在 `specs/015-refine-homepage-interactions/visual-review/final-validation.md` 明确服务端 DDD、panic recovery、goroutine recover、日志及中文 API 说明均因无服务端/API 变更而为 N/A
- [ ] T059 扫描运行时、manifest、文档、错误与构建产物中的本机/Android/临时绝对路径、日期 UI、范围外交通能力、伪造下载和残留 Header 入口，记录到 `specs/015-refine-homepage-interactions/visual-review/final-validation.md`
- [ ] T060 完成性能、可用性、可访问性和人工动效复核，明确一个 dwell timer、按需 locale 图片、无布局动效噪音及“无显式暂停按钮可能低于 WCAG 2.2.2 严格解释”的限制，路径：`specs/015-refine-homepage-interactions/visual-review/performance.md`、`usability.md`、`final-validation.md`
- [ ] T061 执行 `git diff --check`、冲突标记扫描和最终 `git status`，只暂存 015 任务范围并按仓库规则提交，检查路径：`AGENTS.md`、`specs/015-refine-homepage-interactions/`、`frontend/`、`shared/contracts/`、`docs/asset-provenance.md`、`docs/superpowers/prototypes/2026-08-25-homepage-refinement-figma-import/`

---

## 依赖与执行顺序

### 阶段依赖

- **阶段 1（Figma 门禁）**：无前置依赖；T001 后可并行执行 T002/T003，随后按 T004→T005→T006→T007 完成。T007 未通过时禁止生产 UI 修改。
- **阶段 2（共享基础）**：依赖阶段 1；T008/T009/T016 可并行写失败测试/协议，随后完成合同、内容、导入和聚焦验证。
- **阶段 3–6（US1–US4）**：均依赖阶段 2。由于 US1–US3 会顺序修改 Hero 共享文件，推荐按 US1→US2→US3 合并；US4 修改独立路线文件，可在基础完成后与 US1–US3 并行。
- **阶段 7（US5）**：依赖 US1–US4，负责全站流式构图与最终 Figma 收敛。
- **阶段 8（打磨）**：依赖全部目标用户故事完成。

### 用户故事依赖图

```text
Figma 门禁 → 共享基础 ┬→ US1 自动故事 ─→ US2 语言/截图 ─→ US3 下载分流 ─┐
                       └→ US4 手机路线 ────────────────────────────────┤
                                                                        └→ US5 高保真响应式 → 打磨
```

依赖图表达文件合并顺序，不改变独立验收：US1 可只验证 Hero 轮播，US2 可只验证语言/截图，US3 可只验证下载上下文，US4 可只验证路线布局；US5 需要前四个故事的最终 DOM 才能完成整页视觉收敛。

### 单个用户故事内部顺序

1. 先写本故事单元/E2E/合同失败测试并确认失败原因正确。
2. 实现状态模型和组件语义，再实现 CSS/动效。
3. 同步三语内容、alt、aria、失败/降级状态和必要简体中文意图注释。
4. 运行本故事聚焦测试，生成对应 viewport 证据并独立验收。
5. 未通过 Figma 零容忍项时不得自动更新 golden 或进入下一故事。

### 并行机会

- 阶段 1：T002 设计合同与 T003 插件测试可并行。
- 阶段 2：T008 内容/UI 红测、T009 素材红测、T016 视觉测试协议可并行。
- US1：T018 控制器单测与 T019 浏览器/旧测试迁移可并行。
- US2：T027 品牌/语言入口测试与 T028 locale 图测试可并行；测试就绪后 T029 品牌组件与 T030 语言组件可并行。
- US3：T035 下载单测与 T036 双端 E2E 可并行。
- US4：T041 路线单测与 T042 手机几何 E2E 可并行，因此 US4 整个阶段也可与 US1–US3 并行。
- US5：T046 状态/Privacy 单测与 T047 三 viewport E2E 可并行。
- 打磨：T055 文案审校、T056 合同复核与 T058 OpenAPI 无差异验证可并行。

## 各用户故事并行执行示例

### US1

```text
并行：T018 hero controller fake-timer tests
并行：T019 carousel unit/E2E migration
汇合：T020 → T021 → T022 → T023 → T024 → T025 → T026
```

### US2

```text
并行：T027 brand/language entry tests
并行：T028 locale asset/state-preservation tests
并行实现：T029 AppBrand、T030 InlineLanguageLinks
汇合：T031 → T032 → T033 → T034
```

### US3

```text
并行：T035 download context unit tests
并行：T036 platform/no-date E2E
汇合：T037 → T038 → T039 → T040
```

### US4

```text
并行：T041 route DOM/business regression tests
并行：T042 390/320 geometry E2E
汇合：T043 → T044 → T045
```

### US5

```text
并行：T046 chrome/privacy/resize unit tests
并行：T047 responsive/accessibility E2E
汇合：T048 → T049 → T050 → T051 → T052 → T053 → T054
```

---

## 实施策略

### MVP 优先

1. 完成阶段 1 的 Figma 门禁，取得真实 015 节点和 reference。
2. 完成阶段 2 的共享合同、素材和测试基础。
3. 完成 US1（T018–T026），得到可独立演示的五故事自动轮播与丝滑转场。
4. 停止并验证全部时间、暂停、快速切换、辅助技术与 reduced-motion 结果，再决定是否进入后续故事。

### 增量交付

1. **设计/基础**：Figma 门禁 + 内容/素材合同，禁止视觉权威漂移。
2. **P1-A**：US1 自动故事，完成认知节奏。
3. **P1-B**：US2 语言/截图，完成可信三语呈现。
4. **P1-C**：US3 下载分流，完成核心转化路径。
5. **P2-A**：US4 手机路线，完成空间优化且不改业务。
6. **P2-B**：US5 响应式高保真，收敛整页视觉与 Privacy/Footer。
7. **最终打磨**：全量自动化、Figma 对照、文案审校、范围/安全和无后端/OpenAPI 差异验证。

## 完成判定

- 每个用户故事的测试先于实现，聚焦测试和独立证据均通过。
- Figma 新节点、reference、actual、overlay 和 diff 均可追溯，且零容忍视觉项无阻断漂移。
- 61 个任务全部保持严格 checklist 格式；没有无路径、无故事标签或错误 `[P]` 标记的任务。
- 三语、三 viewport、减少动态效果、失败/降级、状态保持和已知暂停限制都有证据。
- 后端、OpenAPI、monitoring、Android App 和 014 历史基线无本功能修改。
- 最终自动提交只包含本功能范围，工作区无冲突标记和未说明改动。
