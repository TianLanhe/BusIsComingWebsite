# 任务：升级首页视觉系统与产品叙事

**输入**：来自 `/specs/014-upgrade-homepage-visual-system/` 的 `spec.md`、`plan.md`、`research.md`、
`data-model.md`、`contracts/`、`figma.md` 和 `quickstart.md`

**前置条件**：Figma 最终 Section `119:64` 可定位；实现严格保持纯前端范围；现有路线与下载
OpenAPI、Go 后端和 Android App 不修改。

**测试**：规格明确要求自动化、双端、三语、无障碍、减少动效和高保真视觉验收，因此每个用户故事
均先建立失败测试/可执行视觉检查，再实现并独立验证。

**组织方式**：任务按用户故事分组；MVP 是获批的第一屏（US1），但正式发布必须完成全部故事和最终
Figma 对照门禁。

## 格式：`[ID] [P?] [Story] 描述`

- **[P]**：可与同阶段其他标记任务并行，且不修改同一文件
- **[Story]**：用户故事阶段必须包含 `US1`–`US5`
- 每项任务均包含需要修改、生成或记录结果的准确路径

---

## 阶段 1：设置（共享基础）

**目的**：保存实现前基线、准备唯一新增依赖、文案审校入口和 Figma 参考证据。

- [x] T001 运行当前 `npm --prefix frontend run test`、`npm --prefix frontend run build` 与 `git status --short --branch`，把通过项、已知旧首页失败项和未验证边界记录到 `specs/014-upgrade-homepage-visual-system/visual-review/baseline.md`
- [x] T002 [P] 在 `frontend/package.json` 与 `frontend/package-lock.json` 添加并锁定 `qrcode.react`，确认只使用本地 `QRCodeSVG` 且不引入通用动效库
- [x] T003 [P] 创建 `specs/014-upgrade-homepage-visual-system/zh-hant-en-copy-review.md`，逐区记录 `zh-Hant` 香港语气、`zh-Hans` 自然简体、`en` 克制产品语气、运营商能力边界和禁止机械直译的审校状态
- [ ] T004 [P] 从 Figma `119:64`、`119:176`、`119:461` 及对应 Route/Download/Support 状态导出 1x 参考图，在 `specs/014-upgrade-homepage-visual-system/visual-review/manifest.json` 记录 node、viewport、locale、story/state、导出方式、日期、尺寸与 SHA-256，并把图片保存到 `specs/014-upgrade-homepage-visual-system/visual-review/reference/`

---

## 阶段 2：基础设施（阻塞前置）

**目的**：先迁移长期合同和共享视觉基础，避免新组件继续依赖旧四故事/自动轮播模型。

**关键要求**：本阶段完成前不开始用户故事实现；所有合同与工具都不得修改 `backend/` 或
`shared/contracts/openapi/`。

- [x] T005 在 `frontend/src/tests/homepage-visual-contract.test.ts` 和 `frontend/src/tests/screenshot-assets-contract.test.ts` 增加失败测试，校验 feature v3 内容 schema、五故事 ID/顺序、四段结构、三语字段、Figma `119:*`、素材一一映射、provenance manifest 必须保存源/衍生 SHA-256、用户可见/runtime 内容不得输出 SHA，以及所有内容与 manifest 均禁止本地绝对路径
- [x] T006 依据 T005 同步 `shared/contracts/homepage-content.schema.json`、`shared/contracts/ui-state-contract.md` 与 `shared/contracts/route-query-ui-state.md`，删除旧四故事、3 秒自动轮播、`stair-card-deck`、lightbox、FeatureGrid、耗时/步行图标及直达/转乘条款，并加入新五故事、二维码、FAQ 和降级合同
- [x] T007 在 `frontend/src/content/types.ts` 定义 `HomepageContentV3`、`HeroStoryId`、`HeroStory`、`HeroStageSlot`、`ManagedScreenshotAsset` 和支持内容类型，并在 `frontend/src/content/sourceReferences.ts` 用稳定产品事实标签取代运行时 Android 本地绝对路径
- [x] T008 [P] 按 Figma Foundations 更新 `frontend/src/styles/tokens.css` 与 `frontend/src/styles/global.css` 的浅绿/白色、墨绿、排版、间距、圆角、优雅手机边框材质、焦点样式和 reduced-motion 全局规则，不混用 `frontend/src/monitoring/` token
- [x] T009 [P] 在 `frontend/src/tests/use-reduced-motion.test.tsx` 先增加 media query 初始值、运行时变化、清理 listener 和 SSR 安全的失败测试
- [x] T010 在 `frontend/src/hooks/useReducedMotion.ts` 实现可订阅 `prefers-reduced-motion` 的共享 hook，用简体中文注释解释 CSS 降级与 React 离散状态降级的边界
- [x] T011 [P] 在 `frontend/src/tests/wind-field.test.tsx` 先增加装饰语义、section intensity、10–22 秒变量、无 pointer/focus 和 reduced 模式无持续动画的失败测试
- [x] T012 在 `frontend/src/components/homepage/WindField.tsx` 与 `frontend/src/components/homepage/WindField.module.css` 实现 3–5 层远/中/近白色浅绿风带，只动画 transform/opacity/scale，并确保 overscan 不产生水平滚动
- [x] T013 [P] 在 `frontend/scripts/compare-homepage-visuals.mjs` 与 `frontend/src/tests/visual-comparison-script.test.ts` 实现并测试 Sharp side-by-side、50% overlay、diff 和 SHA 输出，输入/输出固定使用 `specs/014-upgrade-homepage-visual-system/visual-review/`
- [x] T014 [P] 在 `frontend/playwright.config.ts` 增加 `mobile-320` 覆盖、固定 Chromium/字体运行说明和 `toHaveScreenshot` 的 `maxDiffPixelRatio <= 0.003` 严格默认值，并在 `frontend/playwright/helpers/homepageVisual.ts` 建立等待 fonts、图片 decode、fixture 和 `data-transitioning=false` 的稳定截图 helper，禁止以任意 sleep 作为唯一稳定条件

**检查点**：长期合同不再保护旧设计，共享 token、reduced motion、风带和视觉对照工具可以供五个故事复用。

---

## 阶段 3：用户故事 1 - 第一眼理解产品并开始行动（优先级：P1）MVP

**目标**：在桌面和手机第一屏精确复现获批 Header、两项核心 CTA、五故事环形舞台和截图下方故事轨，
让用户立刻理解产品并开始下载或路线试查。

**独立测试**：只运行 Hero/Header 相关 unit 与 Playwright，用 `1440×960`、`390×844`、`320px`
验证五故事、完整导航、手机四边、CTA 顺序、故事轨不覆盖、快速/反向切换和 reduced motion；再与
Figma Hero reference 生成 overlay/diff。

### 用户故事 1 的测试与视觉门禁

- [x] T015 [P] [US1] 在 `frontend/src/tests/hero-content.test.ts` 和 `frontend/src/tests/content-contract.test.ts` 先增加五个固定 `zh-Hant` 标题/说明、三语 line break hints、CTA 顺序、旧 FeatureGrid/功能说明行/证据标签不存在的失败测试
- [x] T016 [P] [US1] 用新的五槽位合同重写 `frontend/src/tests/hero-carousel.test.tsx`，先覆盖唯一 front、五槽位、按钮事务更新、Arrow/Home/End、20 次快速/反向选择最后目标胜出、后景 aria 隐藏、reduced 模式即时交换，以及每张截图的 540/720/1080 响应式候选、固有尺寸、前景高优先级和后景普通优先级
- [x] T017 [P] [US1] 在 `frontend/src/tests/header-navigation.test.tsx` 增加桌面/390/320 完整导航、语言 disclosure、44px 命中区、Escape/焦点恢复和 Privacy 变体不回归的失败测试
- [x] T018 [P] [US1] 用五故事与 Figma 几何合同重写 `frontend/playwright/hero-carousel.spec.ts` 和 `frontend/playwright/homepage-hero.spec.ts`，先断言完整手机四边、轨道位于舞台下方、无横向滚动、无灵动岛/紫色/深色底浪、标题分行和两项 CTA 顺序

### 用户故事 1 的实现

- [x] T019 [US1] 根据 Figma image fills 与 `docs/superpowers/prototypes/2026-08-21-homepage-visual-system-figma-import/src/design-contract.mjs` 的五个批准 SHA，在 `frontend/scripts/prepare-homepage-story-assets.mjs` 安全生成 540/720/1080 宽 Web 衍生物并更新 `frontend/src/assets/app-screenshots/real/manifest.json`，禁止运行旧同路径覆写清洗流程
- [x] T020 [US1] 在 `frontend/src/content/homepageStories.ts` 与 `frontend/src/content/homepageContent.ts` 写入五个稳定故事、固定繁体内容、独立简体/英文内容、Figma 分行提示、三语 alt、CTA 和产品事实标签，并停止从 `frontend/src/content/carouselSlides.ts` 读取旧四故事
- [x] T021 [P] [US1] 在 `frontend/src/components/sections/Header.tsx`、`frontend/src/components/sections/Header.module.css`、`frontend/src/components/i18n/LanguageSwitcher.tsx` 与 `frontend/src/components/i18n/LanguageSwitcher.module.css` 实现桌面和手机同行完整导航、当前语言 disclosure、320px 紧凑布局和 44px 焦点/触控语义
- [x] T022 [P] [US1] 在 `frontend/src/components/hero/HeroStoryStage.tsx` 与 `frontend/src/components/hero/HeroStoryStage.module.css` 实现五图常驻 DOM、纯函数环形槽位、桌面 520ms/手机 880ms 前后转场、优雅无开孔边框、图片失败稳定 shell 和 reduced 静态层级；从 manifest 生成 `<picture>` 或 `srcSet`/`sizes`，写入真实 `width`/`height`，为前景设置 `fetchPriority="high"`、其余图片保持普通优先级且不得拉伸第五张锁屏图
- [x] T023 [P] [US1] 在 `frontend/src/components/hero/HeroStoryRail.tsx` 与 `frontend/src/components/hero/HeroStoryRail.module.css` 实现 `01–05` 原生按钮、短标签、`aria-pressed`、roving focus、Arrow/Home/End 和 live region，确保轨道在正常文档流中
- [x] T024 [US1] 在 `frontend/src/components/hero/HeroSection.tsx` 与 `frontend/src/components/hero/HeroSection.module.css` 组合标题、说明、共享 Android 下载行动、路线锚点、WindField、Stage 和 Rail，按 `119:176`/`119:461` 分别实现桌面与手机构图而非缩放桌面布局
- [x] T025 [US1] 在 `frontend/src/app/App.tsx` 与 `frontend/src/app/sections.ts` 接入新 Hero、移除首页 `FeatureGrid` 渲染，并把历史 `#features` 保持为 Hero 故事区兼容锚点，不重挂载 `DownloadMetadataProvider`
- [ ] T026 [US1] 用 `frontend/scripts/compare-homepage-visuals.mjs` 生成五故事桌面/手机 actual、overlay、diff 到 `specs/014-upgrade-homepage-visual-system/visual-review/actual/`、`overlay/`、`diff/`，人工核对 FR-030 后把批准浏览器图写入 `frontend/playwright/__screenshots__/`
- [x] T027 [US1] 运行 Hero/Header/content unit、`npm --prefix frontend run build` 和 desktop-1440/mobile-390/mobile-320 Hero E2E，把 MVP 独立验收结果记录到 `specs/014-upgrade-homepage-visual-system/visual-review/us1-result.md`

**检查点**：US1 可独立演示；首屏与获批预览一致，用户无需滚动即可识别产品和两项核心行动。

---

## 阶段 4：用户故事 2 - 不下载也能试查巴士路线（优先级：P1）

**目标**：在第二屏用稳定工作区完成既有路线试查，以文字耗时/步行和受控失败兑现首屏承诺。

**独立测试**：mock 既有 API，分别触发初始、候选、无效、loading、success + ETA loading/ready/partial、
empty、error、retry、retained、rate limited 和 token expired；桌面/手机都保留输入且不显示禁止内容。

### 用户故事 2 的测试与视觉门禁

- [ ] T028 [P] [US2] 在 `frontend/src/tests/online-query-demo.test.tsx` 先补全候选键盘语义、query version 旧响应拒绝、全部路线/ETA/错误状态、单一恢复动作、有效输入保留、retained 工具栏和文字“耗时/步行”的失败测试
- [ ] T029 [P] [US2] 重写 `frontend/playwright/online-query-demo.spec.ts`，用固定 fixtures 覆盖 RouteTrial 全状态、桌面/390/320 几何、combobox 键盘、无第三方原始错误、无图标/直达/转乘和无横向滚动

### 用户故事 2 的实现

- [x] T030 [P] [US2] 在 `frontend/src/content/onlineQueryDemo.ts` 与 `frontend/src/content/uiCopy.ts` 完成 RouteTrial 标题、输入、候选、loading、empty、error、retry、retained、ETA 和未知字段的三语自然文案，明确网站试查的真实覆盖范围
- [x] T031 [P] [US2] 从 `frontend/src/components/online-demo/OnlineQueryDemo.tsx` 提取 `frontend/src/components/online-demo/PlaceCombobox.tsx`，实现 combobox/listbox/option、`aria-activedescendant`、Arrow/Enter/Escape、字段错误关联和触控目标
- [x] T032 [P] [US2] 从 `frontend/src/components/online-demo/OnlineQueryDemo.tsx` 提取 `frontend/src/components/online-demo/RouteResultCard.tsx`，用语义化结构展示路线链、站点、候车、车费、“耗时 N 分钟”“步行 N 米”，未知值受控且不推断直达/转乘
- [x] T033 [US2] 重构 `frontend/src/components/online-demo/OnlineQueryDemo.tsx`，保留现有 request sequence、token、ETA 合并和语言重查逻辑，在同一稳定区域整合初始/候选/加载/结果/错误/重试/retained 状态并只播报简短状态摘要
- [x] T034 [US2] 按 Figma Route frames 重写 `frontend/src/components/online-demo/OnlineQueryDemo.module.css`，实现桌面输入工作台/结果区和手机自然堆叠，保持 loading/错误/长站名几何稳定并让 Route 段 WindField 强度低于 Hero
- [ ] T035 [US2] 生成 RouteTrial 全状态 desktop/mobile actual、overlay、diff 到 `specs/014-upgrade-homepage-visual-system/visual-review/`，逐项检查结果卡文字、单一恢复动作和 retained 低权重说明
- [x] T036 [US2] 运行 online-query unit/E2E 与 `npm --prefix frontend run build`，把 US2 独立验收和现有路线 OpenAPI 未修改的证据记录到 `specs/014-upgrade-homepage-visual-system/visual-review/us2-result.md`

**检查点**：US2 可独立使用；外部失败不编造数据，且不会破坏 US1 首屏。

---

## 阶段 5：用户故事 3 - 从试查自然转向 Android 下载（优先级：P1）

**目标**：第三屏以非卡片、克制汇聚和真实下载/桌面 QR 承接路线试查，不制造虚假状态。

**独立测试**：分别 mock checking、ready、unavailable；证明只有 ready 有原生下载链接、桌面 QR 与
按钮目标一致、手机 QR 为 0、版本资料同权重、汇聚只运行一次且 reduced 模式不运行。

### 用户故事 3 的测试与视觉门禁

- [x] T037 [P] [US3] 在 `frontend/src/tests/android-download-action.test.tsx`、`frontend/src/tests/download-button.test.tsx`、`frontend/src/tests/download-metadata-provider.test.tsx` 与 `frontend/src/tests/use-download-convergence.test.tsx` 先增加动态版本/大小/更新日期、静态 Android 7.1+、二维码目标一致、非 ready 无 QR/href、单 metadata 请求、无 Blob/进度，以及 IntersectionObserver 约 50% 可见时仅汇聚一次、离开/重入与语言切换不重播、reduced motion 不触发和卸载清理 observer 的失败测试
- [x] T038 [P] [US3] 重写 `frontend/playwright/android-download.spec.ts`、`frontend/playwright/apk-metadata.spec.ts` 与 `frontend/playwright/platform-download-states.spec.ts`，覆盖三态 desktop/mobile/320、QR 显隐/可解码目标、原生文件名、0 个非 ready APK 请求、稳定几何和 reduced motion

### 用户故事 3 的实现

- [x] T039 [P] [US3] 在 `frontend/src/content/homepageContent.ts` 与 `frontend/src/content/uiCopy.ts` 完成“路线找到了，把它带在身边”、Android 7.1+、三态、更新日期和安装说明三语内容，删除“三步完成”、BUILD、SHA、“目前版本可下载”和虚假完成文案
- [x] T040 [P] [US3] 在 `frontend/src/components/download/DownloadQrCode.tsx` 实现从 `new URL(metadata.downloadUrl, window.location.origin).href` 派生的 `QRCodeSVG`，仅 ready 桌面可见、`aria-hidden` 且不成为第二个焦点目标
- [x] T041 [P] [US3] 在 `frontend/src/components/download/DownloadMetadataLine.tsx` 实现版本、Android 7.1+、本地化大小和更新日期的同字号/同权重展示，禁止读取 `current.json` 私有字段或硬编码易变版本
- [x] T042 [US3] 在 `frontend/src/hooks/useDownloadConvergence.ts` 实现 IntersectionObserver 一次性状态，并重构 `frontend/src/components/sections/DownloadSection.tsx` 和 `frontend/src/components/download/AndroidDownloadAction.tsx`：约 50% 可见时只设置一次 `data-converged=true`，同一 document 内离开/重入和语言切换不重播，reduced motion 不观察也不触发，卸载时清理 observer；同时保持 Provider 单状态源与原生链接语义，组合非卡片行动、metadata line、桌面 QR、手机无 QR 和受控 unavailable
- [x] T043 [US3] 按 Figma Download frames 重写 `frontend/src/components/sections/DownloadSection.module.css` 与 `frontend/src/components/download/AndroidDownloadAction.module.css`，让风带汇聚/亮带/箭头只响应首次出现的 `[data-converged="true"]`，实现桌面居中/手机左对齐且不循环，reduced 模式完全静止
- [ ] T044 [US3] 生成 Download checking/ready/unavailable/reduced 的 desktop/mobile actual、overlay、diff 到 `specs/014-upgrade-homepage-visual-system/visual-review/`，核对非卡片构图、空白平衡和版本资料权重
- [x] T045 [US3] 运行 download unit/E2E 与 `npm --prefix frontend run build`，把 QR/按钮目标、APK 请求数和 US3 独立验收记录到 `specs/014-upgrade-homepage-visual-system/visual-review/us3-result.md`

**检查点**：US3 可独立完成真实 Android 下载决策，不改变下载 API 或浏览器接管语义。

---

## 阶段 6：用户故事 4 - 在页面末端消除使用疑虑（优先级：P2）

**目标**：以四项无卡片 FAQ、联系横条和浅色页尾完成决策收尾，同时保持 Privacy 页面可用。

**独立测试**：默认只展开安装问题，切换后仍只有一项；键盘、触控、ARIA、联系、隐私和返回顶部均
可用，运营商文案不扩大能力，桌面/手机都没有深色结尾。

### 用户故事 4 的测试与视觉门禁

- [x] T046 [P] [US4] 在 `frontend/src/tests/sections-content.test.ts` 与 `frontend/src/tests/faq-section.test.tsx` 先增加四项固定主题、默认第一项、受控单开、键盘/ARIA、稳定 FAQ ID、运营商边界、联系/隐私/返回顶部的失败测试
- [x] T047 [P] [US4] 重写 `frontend/playwright/homepage-sections.spec.ts`，覆盖 FAQ 默认/切换、关闭 panel 无焦点、联系 mailto、当前语言 Privacy、返回顶部、浅色页尾和 desktop/mobile/320 无溢出

### 用户故事 4 的实现

- [x] T048 [P] [US4] 在 `frontend/src/content/sectionsContent.ts` 与 `frontend/src/content/uiCopy.ts` 完成安装、数据覆盖、网站与 App 区别、iPhone 支持四项三语 FAQ 及联系/页尾内容，明确联营首程 ETA 不等于完整九巴/龙运规划
- [x] T049 [P] [US4] 在 `frontend/src/components/sections/FaqSection.tsx` 与 `frontend/src/components/sections/FaqSection.module.css` 实现稳定 `activeFaqId`、默认 `android-install`、单开 accordion、button/panel ARIA、约 240ms 分隔线布局和 reduced 静态展开
- [x] T050 [P] [US4] 在 `frontend/src/components/sections/ContactStrip.tsx` 与 `frontend/src/components/sections/ContactStrip.module.css` 实现轻量联系横条，复用单一邮箱内容源并保持次要视觉权重
- [x] T051 [P] [US4] 重构 `frontend/src/components/sections/FooterContact.tsx` 与 `frontend/src/components/sections/FooterContact.module.css` 为浅色极简 SiteFooter，保留品牌、联系、隐私和返回顶部，并为首页/Privacy 提供明确变体
- [x] T052 [US4] 在 `frontend/src/app/App.tsx` 与 `frontend/src/app/sections.ts` 按 `FAQ → ContactStrip → SiteFooter` 接入 SupportEnding，保持 `#faq`、`#contact` 与三语 Privacy 路由
- [ ] T053 [US4] 生成 Support 默认/切换 FAQ、联系和页尾 desktop/mobile actual、overlay、diff 到 `specs/014-upgrade-homepage-visual-system/visual-review/`，核对无卡片 FAQ 和无深色潮汐
- [x] T054 [US4] 运行 FAQ/sections/Privacy unit、E2E 与 `npm --prefix frontend run build`，把 US4 独立验收记录到 `specs/014-upgrade-homepage-visual-system/visual-review/us4-result.md`

**检查点**：US4 独立可用；页面自然结束且不形成新的营销屏。

---

## 阶段 7：用户故事 5 - 在三语和不同设备上获得同等体验（优先级：P2）

**目标**：把三语、状态保留、320px、键盘/读屏、触控和 reduced motion 作为全页正式质量门禁。

**独立测试**：在 `zh-Hant`、`zh-Hans`、`en` 的 1440/390/320 完成故事切换、路线状态、下载状态、
FAQ、导航和返回顶部；语言切换保留故事、scroll、路线输入/结果、download 和 FAQ 状态。

### 用户故事 5 的测试与视觉门禁

- [x] T055 [P] [US5] 在 `frontend/src/tests/i18n-state-preservation.test.tsx` 先增加语言切换后故事、hash/scroll 语义、路线选择/结果、DownloadMetadataProvider 请求次数和 FAQ ID 保持的失败测试
- [x] T056 [P] [US5] 扩展 `frontend/src/tests/i18n-completeness.test.tsx` 与 `frontend/src/tests/homepage-experience-regression.test.ts`，先校验 Header/五故事/路线全状态/下载三态/FAQ/联系/页尾/alt/aria 三语 100% 覆盖和禁止 Citybus-only 总体定位
- [x] T057 [P] [US5] 重写 `frontend/playwright/homepage-experience-polish.spec.ts` 并新增 `frontend/playwright/homepage-accessibility.spec.ts`，覆盖三语 × 1440/390/320、44px 命中区、焦点顺序、无横向滚动、图片失败 shell、后景不朗读和 reduced motion 0 持续动画

### 用户故事 5 的实现

- [x] T058 [US5] 根据 T003 审校记录完成 `frontend/src/content/homepageStories.ts`、`frontend/src/content/homepageContent.ts`、`frontend/src/content/onlineQueryDemo.ts`、`frontend/src/content/sectionsContent.ts` 与 `frontend/src/content/uiCopy.ts` 的三语最终复核，并在 `specs/014-upgrade-homepage-visual-system/zh-hant-en-copy-review.md` 逐项签记事实与语气结论
- [x] T059 [US5] 在 `frontend/src/content/seoPages.json` 与 `frontend/index.html` 将首页 SEO/OG/Twitter 定位更新为香港巴士路线规划与导航 App，保留路线试查真实覆盖和 Privacy 页面事实，不写完整九巴/龙运规划
- [x] T060 [US5] 在 `frontend/src/components/i18n/I18nProvider.tsx` 与 `frontend/src/components/i18n/LanguageSwitcher.tsx` 保持无 reload 的 history 路径更新、search/hash 和焦点恢复，确保首页、四段 section 与 Provider 不因 locale key 重挂载
- [x] T061 [US5] 在 `frontend/src/styles/global.css` 及 Hero、Route、Download、FAQ、Header 对应 CSS Modules 修正 320px 长文案、44px 目标、`:focus-visible`、reduced motion、图片失败和无水平滚动，禁止以隐藏核心入口换取适配
- [x] T062 [US5] 在 `frontend/playwright/homepage-visual-regression.spec.ts` 为三语 Hero 五故事、Route 代表状态、Download 三态和 Support 状态编写 `expect(page).toHaveScreenshot()` 断言；仅在 Figma actual/overlay/diff 人工批准后以固定 Chromium/字体环境生成 desktop/390/320 golden 到 `frontend/playwright/__screenshots__/`，普通 E2E 禁止自动更新 baseline，并把批准状态更新到 `specs/014-upgrade-homepage-visual-system/visual-review/manifest.json`
- [x] T063 [US5] 运行 i18n/state/accessibility unit、三语全矩阵 E2E 与 `npm --prefix frontend run build`，把 US5 独立验收记录到 `specs/014-upgrade-homepage-visual-system/visual-review/us5-result.md`

**检查点**：五个用户故事在三语、桌面、手机、窄屏、键盘和 reduced motion 下功能覆盖等价。

---

## 阶段 8：打磨与跨切面

**目的**：清理旧实现、同步长期文档、完成性能、真实浏览器、可用性和最终高保真门禁。

- [x] T064 在确认 `rg` 无生产引用后删除 `frontend/src/components/hero/AppPreviewCarousel.tsx`、`AppPreviewCarousel.module.css`、`HeroIntro.tsx`、`HeroIntro.module.css`、`ScreenshotStack.tsx`、`ScreenshotStack.module.css`、`ScreenshotLightbox.tsx`、`ScreenshotLightbox.module.css`、`frontend/src/components/sections/FeatureGrid.tsx`、`FeatureGrid.module.css`、`frontend/src/components/download/DownloadSegmentedButton.tsx`、`DownloadSegmentedButton.module.css`、`frontend/src/content/carouselSlides.ts`、`frontend/src/content/downloadManifest.ts`、未被新 manifest 引用的 `frontend/src/assets/app-screenshots/real/` 旧衍生图及对应旧 `frontend/src/tests/feature-gallery.test.tsx`、`frontend/playwright/feature-gallery.spec.ts`，并把旧测试中仍有价值的 SEO/下载/Privacy 断言迁入新用例
- [x] T065 [P] 更新 `docs/ui-style-guide.md`、`docs/localization-guidelines.md`、`docs/asset-provenance.md` 与必要的根 `README.md` 产品入口，记录五故事、风带、手机边框、三语语气、受管截图源/衍生指纹和联营 ETA 能力边界，不翻新 `docs/superpowers/` 历史记录
- [x] T066 用 `frontend/scripts/prepare-homepage-story-assets.mjs`、Vite build 输出和 desktop-1440/mobile-390/mobile-320 浏览器 `currentSrc`/`naturalWidth` 证据，核对五张截图实际选择合适响应式候选、前景/后景加载优先级、图片 decode、固定比例、无重复源文件、二维码依赖 gzip 增量和故事切换 layout shift=0，把数据记录到 `specs/014-upgrade-homepage-visual-system/visual-review/performance.md`
- [x] T067 运行 `npm --prefix frontend run test`、`npm --prefix frontend run build`、不带 `--update-snapshots` 的 `npm --prefix frontend run test:e2e`、`npm --prefix frontend run openapi:lint` 与 `npm --prefix frontend run openapi:bundle`，确认未批准像素变化会使 `toHaveScreenshot()` 失败、`git diff -- backend shared/contracts/openapi` 无本功能语义变更，并把结果记录到 `specs/014-upgrade-homepage-visual-system/visual-review/final-validation.md`
- [ ] T068 使用本任务新启动或明确归本任务所有的 Android emulator 在真实 Chromium viewport 验证首屏完整四边、五故事、路线试查、下载和 FAQ，保存证据到 `specs/014-upgrade-homepage-visual-system/visual-review/android/` 并在完成后关闭本任务启动的设备
- [ ] T069 组织至少 5 名首次访问者完成 10 秒产品/CTA 识别，并请至少 2 名未参与设计者从 `specs/014-upgrade-homepage-visual-system/figma.md` 在 2 分钟内定位全部关键状态，把匿名结果记录到 `specs/014-upgrade-homepage-visual-system/visual-review/usability.md`
- [ ] T070 按 `specs/014-upgrade-homepage-visual-system/contracts/homepage-visual-system.contract.md` 逐项复核所有 Figma reference/actual/overlay/diff，确保 FR-030 零容忍项为 0，并在 `specs/014-upgrade-homepage-visual-system/visual-review/final-figma-review.md` 记录批准人、日期、节点和未验证限制
- [x] T071 运行 `git diff --check`、冲突标记扫描和 `git status --short --branch`，确认无 Android 本地路径、token、临时素材、后端/OpenAPI 越界或无关工作区文件后，只提交 014 前端实现、合同、测试、文档与验证证据

---

## 依赖与执行顺序

### 阶段依赖

- **阶段 1 设置**：无依赖，可以立即开始。
- **阶段 2 基础设施**：依赖阶段 1；完成前阻塞全部用户故事。
- **阶段 3 US1**：依赖阶段 2，是推荐 MVP 与首个高保真门禁。
- **阶段 4 US2**：依赖阶段 2；可与 US1 后半段并行开发，但首页整合验收需保留已完成 US1。
- **阶段 5 US3**：依赖阶段 2 与共享下载状态；可与 US2 并行。
- **阶段 6 US4**：依赖阶段 2；可与 US2/US3 并行，最终 App 顺序整合需等待四段组件就绪。
- **阶段 7 US5**：依赖 US1–US4，因为它验证全页三语、状态保留、双端和无障碍等价性。
- **阶段 8 打磨**：依赖全部目标用户故事完成。

### 用户故事依赖图

```text
Setup → Foundations → US1 ─┐
                      US2 ─┼→ US5 → Polish/Final Validation
                      US3 ─┤
                      US4 ─┘
```

### 单个用户故事内部顺序

1. 先写 unit/contract/E2E/视觉失败检查并确认它们因缺少新行为而失败；
2. 先稳定内容/状态身份，再实现组件和 CSS；
3. API client、Provider、query version、错误 code 等既有边界不得为了 UI 改写；
4. 组件可用后生成 Figma actual/overlay/diff，零容忍项通过后才批准浏览器 golden；
5. 运行该故事独立测试并记录证据，再进入跨故事整合。

## 并行执行示例

### US1

- T015–T018 可分别处理内容、交互、Header 和 E2E 失败测试；
- T021、T022、T023 在共享 types/tokens 稳定后可分别实现 Header、Stage 和 Rail；
- T019 素材处理可与 T021–T023 并行，T024 等待它们汇合。

### US2

- T028 与 T029 可并行建立 unit/E2E 状态矩阵；
- T030 文案、T031 combobox、T032 route card 可在合同稳定后并行；
- T033 汇合状态逻辑，T034 再完成统一布局。

### US3

- T037 与 T038 可并行建立 unit/E2E 下载三态；
- T039 文案、T040 QR、T041 metadata line 可并行；
- T042 汇合共享 Provider/原生行动，T043 完成视觉与一次性动效。

### US4

- T046 与 T047 可并行建立 unit/E2E；
- T048 文案完成后，T049 FAQ、T050 ContactStrip、T051 SiteFooter 可并行；
- T052 只负责整合顺序和锚点。

### US5

- T055、T056、T057 可并行建立状态保留、内容完整性和浏览器矩阵；
- T058 三语审校与 T059 SEO 可以分文件推进，但 T062 visual golden 必须等待最终文案和 CSS。

---

## 实施策略

### MVP 优先

1. 完成阶段 1 设置；
2. 完成阶段 2 合同/视觉基础；
3. 完成阶段 3 US1；
4. 停止并以 Figma overlay/diff、1440/390/320 和 Hero unit/E2E 独立评审首屏；
5. 首屏获批后继续 US2–US5。MVP 只用于中途高保真评审，不代表正式发布范围缩小。

### 增量交付

1. **US1**：产品识别、CTA、五故事和风带；
2. **US2**：真实路线试查与降级；
3. **US3**：下载承接与真实 QR；
4. **US4**：FAQ、联系和浅色收尾；
5. **US5**：三语、双端、状态保留、无障碍与 reduced motion；
6. **Final**：删除旧路径、完整测试、真实 Android 浏览器、可用性和 Figma 最终批准。

## 备注

- 所有 `[P]` 任务修改不同文件；出现未预期共享文件冲突时应先串行化而不是覆盖他人改动。
- 本功能没有后端、OpenAPI、数据库、DDD 或服务端日志实现任务；相关命令只作兼容性回归。
- 生产页面不得从 Android 工程、Figma 本地插件、`.superpowers/`、临时目录或聊天附件运行时读取素材。
- 自动化通过不能单独证明高保真；Figma reference/actual/overlay/diff 和人工零容忍审查同样必需。
- 完成每个任务时只勾选已实际验证的项目，不以“后续再看”替代失败状态处理。
