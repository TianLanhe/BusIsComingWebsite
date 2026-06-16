# 任务：主页 UI 优化

**输入**：`/Users/jianglijie/Documents/BusIsCommingWebsite/specs/003-homepage-ui-optimization/` 下的 `plan.md`、`spec.md`、`research.md`、`data-model.md`、`quickstart.md`、`figma.md` 与 `contracts/`

**前置确认**：`.specify/extensions.yml` 当前未配置 `before_tasks` 或 `after_tasks` hook；本任务清单直接依据 Spec Kit 产物生成。

**测试策略**：每个用户故事都保留可独立验证路径；涉及 UI 行为的故事先补组件/Playwright 验证，再实现视觉与交互。

**组织方式**：任务按用户故事分组，确保 US1 可作为最小可交付版本独立完成；后续故事可在共享基础完成后并行推进。

## 格式约定：`[ID] [P?] [Story?] 描述`

- **[P]**：可并行执行，前提是不修改同一文件且不依赖前序任务结果
- **[US1]**：首屏下载按钮直接下载 Android APK
- **[US2]**：4 个核心功能点自动轮播展示
- **[US3]**：真实截图脱敏后以手动堆叠图集展示
- **[US4]**：繁体中文香港本地化与城巴范围表述
- **[US5]**：前后端监听所有 IP 并支持正式 HTTP 端口

---

## 阶段 1：准备

**目的**：准备任务执行所需的目录、资产入口和文档锚点。

- [X] T001 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/assets/app-screenshots/real/README.md` 记录真实截图来源、脱敏规则、主图序号规则和禁止提交未脱敏原图的要求
- [X] T002 [P] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/specs/003-homepage-ui-optimization/visual-review/README.md` 建立桌面端、移动端、下载状态、截图堆叠和繁中审校的验收截图清单
- [X] T003 [P] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/content/sourceReferences.ts` 增加 Figma v2 节点、真实截图目录、Android APK 与 Citybus 范围的内容来源引用
- [X] T004 [P] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/assets/app-screenshots/real/manifest.json` 建立截图 manifest 初稿，字段对齐 `contracts/screenshot-assets.manifest.schema.json`
- [X] T005 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/package.json` 确认或补齐后续截图处理、测试、Playwright 与构建脚本入口

---

## 阶段 2：基础能力

**目的**：建立跨故事共享的数据结构、契约验证和基础测试门禁。

- [X] T006 [P] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/content/types.ts` 增加 `HomepageFeatureShowcaseItem`、`ScreenshotGalleryItem`、`SanitizedScreenshotAsset`、`DownloadActionState` 等主页 v2 内容类型
- [X] T007 [P] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/tests/homepage-content-contract.test.ts` 增加 `contracts/homepage-content-v2.schema.json` 的内容契约验证
- [X] T008 [P] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/tests/screenshot-assets-contract.test.ts` 增加 `contracts/screenshot-assets.manifest.schema.json` 的截图 manifest 验证
- [X] T009 [P] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/tests/i18n-completeness.test.ts` 增加 `zh-Hant`、`zh-Hans`、`en` 三语 key 完整性与不可空校验
- [X] T010 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/content/homepageContent.ts` 调整主页内容结构，使下载、功能轮播、截图图集和语言文案可由同一内容源驱动
- [X] T011 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/content/carouselSlides.ts` 重构为 4 个核心展示点的数据模型，并为每个展示点预留截图图集数组
- [X] T012 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/components/hero/AppPreviewCarousel.tsx` 拆分展示容器、功能轮播状态和截图图集状态的组件边界
- [X] T013 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/components/hero/AppPreviewCarousel.module.css` 建立轮播、图集堆叠和 reduced-motion 共享样式基础

**检查点**：基础阶段完成后，内容类型、manifest 契约和三语 key 校验可单独运行；后续故事只扩展数据与组件行为。

---

## 阶段 3：用户故事 1 - 首屏下载按钮直接下载 Android APK（优先级：P1）

**目标**：首屏主按钮点击后直接下载 Android APK，不再跳转到下载区；下载区保留简洁 Android 下载详情，弱化 iPhone 暂不支持状态。

**独立验收**：打开首页，点击首屏“下载 App”按钮应触发 Android APK 下载；页面不滚动到下载锚点，不展示完整 SHA 或“由本站提供”类第三段说明，下载区仍能提供备用下载入口。

### 测试任务

- [X] T014 [P] [US1] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/tests/download-button.test.tsx` 覆盖首屏按钮直接下载、无锚点跳转、下载区备用按钮和失败提示文案
- [X] T015 [P] [US1] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/playwright/android-download.spec.ts` 覆盖桌面端与移动端点击首屏按钮触发下载且页面位置不跳转
- [X] T016 [P] [US1] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/tests/download-section.test.tsx` 覆盖 Android 可下载详情、iPhone 暂不支持弱状态和隐藏完整校验值

### 实现任务

- [X] T017 [US1] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/content/downloadManifest.ts` 整理 Android APK 文件名、版本、大小、短校验提示和失败兜底文案
- [X] T018 [US1] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/content/homepageContent.ts` 将首屏主行动作从下载区锚点改为 Android APK 直接下载动作
- [X] T019 [US1] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/components/hero/HeroIntro.tsx` 更新主按钮渲染逻辑，使用真实下载链接、下载属性、无跳转行为和可访问名称
- [X] T020 [US1] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/components/hero/HeroIntro.module.css` 调整首屏下载按钮尺寸、图标、按压态、移动端换行和焦点态
- [X] T021 [US1] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/components/download/DownloadSegmentedButton.tsx` 移除首屏式平台分段逻辑，保留下载区内简洁 Android 主入口与 iPhone 暂不支持说明
- [X] T022 [US1] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/components/sections/DownloadSection.tsx` 更新下载详情区，展示 Android 版本、文件大小、短校验提示和备用入口
- [X] T023 [US1] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/components/sections/DownloadSection.module.css` 调整下载详情区布局，确保桌面端与移动端不出现嵌套卡片和文字溢出
- [X] T024 [US1] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/specs/003-homepage-ui-optimization/visual-review/desktop-1440-download-states-v2.png` 保存桌面端下载按钮与下载区状态验收截图

**检查点**：US1 完成后即可交付一个可用 MVP：首页主按钮直接下载 Android APK，下载区提供备用入口。

---

## 阶段 4：用户故事 2 - 4 个核心功能点自动轮播展示（优先级：P1）

**目标**：首屏右侧展示区自动轮播 4 个核心功能点，不显示左右箭头；轮播有高级、克制的动画，并尊重用户主动交互和 reduced-motion。

**独立验收**：不操作页面时，4 个功能点会按固定节奏自动切换；没有左右箭头；切换动画平滑，桌面端和移动端内容不重叠；用户 hover、focus 或切换截图图集时不会被轮播打断。

### 测试任务

- [X] T025 [P] [US2] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/tests/hero-carousel.test.tsx` 覆盖 4 个展示点、自动前进、无箭头、hover/focus 暂停和 reduced-motion 行为
- [X] T026 [P] [US2] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/playwright/hero-carousel.spec.ts` 覆盖桌面端与移动端轮播动画、指示状态和无布局跳动

### 实现任务

- [X] T027 [US2] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/content/carouselSlides.ts` 定义 4 个核心展示点的标题、说明、重点指标、图集和三语文案
- [X] T028 [US2] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/components/hero/AppPreviewCarousel.tsx` 实现展示点自动轮播状态机、定时器清理和用户交互暂停逻辑
- [X] T029 [US2] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/components/hero/AppPreviewCarousel.tsx` 移除左右箭头控制，改为低干扰指示点和可访问的当前项状态
- [X] T030 [US2] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/components/hero/AppPreviewCarousel.module.css` 实现淡入、层级位移、轻微景深和 reduced-motion 回退动画
- [X] T031 [US2] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/components/hero/HeroSection.tsx` 调整首屏左右区域响应式布局，确保右侧展示区在首屏内保留下一段内容提示
- [X] T032 [US2] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/components/hero/HeroSection.module.css` 固定展示区宽高约束、断点和内容安全区，避免轮播切换造成布局抖动
- [X] T033 [US2] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/specs/003-homepage-ui-optimization/visual-review/desktop-1440-feature-carousel-v2.png` 保存桌面端 4 点轮播验收截图

**检查点**：US2 完成后，首屏展示区具备自动轮播和动画，但同一功能点下的截图图集不会自动轮播。

---

## 阶段 5：用户故事 3 - 真实截图脱敏后以手动堆叠图集展示（优先级：P2）

**目标**：每个功能点使用真实截图；序号为 1 的图片作为主图，同组其他图片堆叠在下方，用户手动切换查看；地点、路线等真实信息脱敏，价格、时间、ETA 保留。

**独立验收**：每个功能点默认展示主图；用户可点击堆叠缩略图切换；截图不自动切换；真实地点、巴士路线和手机无关内容已脱敏或模糊，价格、时间、ETA 未被替换。

### 测试任务

- [X] T034 [P] [US3] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/tests/screenshot-assets-contract.test.ts` 增加主图序号、脱敏状态、价格/时间/ETA 保留字段和图集分组校验
- [X] T035 [P] [US3] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/tests/feature-gallery.test.tsx` 覆盖主图默认展示、手动切换、无自动切换和单图功能点兼容
- [X] T036 [P] [US3] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/playwright/feature-gallery.spec.ts` 覆盖桌面端与移动端点击堆叠缩略图切换截图

### 实现任务

- [X] T037 [US3] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/scripts/sanitize-homepage-screenshots.mjs` 创建截图脱敏脚本，按 manifest 标注模糊地点、路线和手机无关内容并保留价格、时间、ETA
- [X] T038 [US3] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/package.json` 增加 `sanitize:screenshots` 脚本和必要的本地图片处理依赖
- [X] T039 [US3] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/assets/app-screenshots/real/manifest.json` 为 `/Users/jianglijie/Documents/BusIsCommingWebsite/app真实截图` 的截图建立 4 个功能点分组、主图序号和脱敏区域元数据
- [X] T040 [US3] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/assets/app-screenshots/real/` 生成并提交脱敏后的 WebP/PNG 展示资产，禁止提交未脱敏原图
- [X] T041 [US3] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/content/carouselSlides.ts` 将 4 个功能点绑定到脱敏截图 manifest，并确保每组序号 1 作为默认主图
- [X] T042 [US3] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/components/hero/ScreenshotStack.tsx` 创建手动截图堆叠组件，支持主图、缩略图、键盘切换和 aria 当前项
- [X] T043 [US3] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/components/hero/ScreenshotStack.module.css` 实现无手机边框的真实截图展示、堆叠层级、缩略图选中态和移动端尺寸约束
- [X] T044 [US3] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/components/hero/AppPreviewCarousel.tsx` 将 `ScreenshotStack` 接入当前功能点，确保外层功能轮播与内层手动图集状态互不抢焦点
- [X] T045 [US3] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/specs/003-homepage-ui-optimization/visual-review/mobile-390-feature-stack-v2.png` 保存移动端截图堆叠验收截图

**检查点**：US3 完成后，所有主页真实截图都来自脱敏资产，功能点自动轮播和图集手动切换保持清晰边界。

---

## 阶段 6：用户故事 4 - 繁体中文香港本地化与城巴范围表述（优先级：P2）

**目标**：`zh-Hant` 文案符合香港用户说话习惯；页面和巴士相关表述明确为城巴；6 个功能卡片中的价格文案强调多程总价，而不是港币币种。

**独立验收**：切换到繁体中文时，文案不只是简体逐字转换；页面巴士范围表述与城巴一致；“HK$ 清晰顯示”类卡片改为多程总价能力；三语内容都完整。

### 测试任务

- [X] T046 [P] [US4] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/tests/i18n-completeness.test.ts` 增加 `zh-Hant` 关键短语审校断言，避免与 `zh-Hans` 逐句完全一致
- [X] T047 [P] [US4] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/tests/sections-content.test.ts` 覆盖城巴范围、多程总价卡片文案和非香港巴士交通工具排除边界

### 实现任务

- [X] T048 [US4] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/content/homepageContent.ts` 重写首屏、导航、下载和范围说明的 `zh-Hant` 文案，使语气贴近香港本地使用习惯
- [X] T049 [US4] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/content/carouselSlides.ts` 重写 4 个核心展示点的 `zh-Hant` 文案，并统一使用城巴场景描述
- [X] T050 [US4] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/content/sectionsContent.ts` 将 6 个功能卡片中的价格卡片改为强调多程总价格，并同步 `zh-Hans` 与 `en`
- [X] T051 [US4] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/content/sectionsContent.ts` 将页面与巴士相关的泛称调整为城巴或香港城巴场景，避免暗示支持九巴等其他营运商
- [X] T052 [US4] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/content/onlineQueryDemo.ts` 核对在线查询示例中的路线、站点和说明，确保与城巴范围一致且不暴露真实敏感地点
- [X] T053 [US4] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/specs/003-homepage-ui-optimization/visual-review/zh-hant-copy-review.md` 记录繁中本地化审校要点、改写前后关键短语和残余疑问

**检查点**：US4 完成后，用户可感知繁体中文是面向香港用户重新写过，而非简体中文逐字转换。

---

## 阶段 7：用户故事 5 - 前后端监听所有 IP 并支持正式 HTTP 端口（优先级：P3）

**目标**：开发环境前后端不再只监听本地回环地址；前端支持正式部署时监听标准 HTTP 端口，且不破坏本地开发、API 契约和既有 OpenAPI 预览流程。

**独立验收**：局域网设备可访问前端页面与后端健康接口；生产预览可配置为 HTTP 80 端口；本地开发仍可使用非特权端口；OpenAPI 源文件不因无 API 变更而产生无关改动。

### 测试任务

- [X] T054 [P] [US5] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/playwright.config.ts` 调整 webServer 与 baseURL 读取 host/port 环境变量，并保留本地默认值
- [X] T055 [P] [US5] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/backend/cmd/server/main_test.go` 增加后端监听地址配置测试，覆盖默认 `0.0.0.0`、自定义 host 和端口

### 实现任务

- [X] T056 [US5] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/vite.config.ts` 配置 dev server 与 preview 默认监听 `0.0.0.0`，并支持通过环境变量指定正式 HTTP 端口
- [X] T057 [US5] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/package.json` 更新 `dev`、`preview`、`preview:http` 或等价脚本，明确局域网访问和正式 HTTP 端口启动方式
- [X] T058 [US5] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/backend/cmd/server/main.go` 将后端监听 host 默认值改为 `0.0.0.0`，保持 recovery、请求日志和错误返回不变
- [X] T059 [US5] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/backend/README.md` 更新前后端监听地址、局域网访问、生产 HTTP 端口和 OpenAPI 不变更说明
- [X] T060 [US5] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/specs/003-homepage-ui-optimization/quickstart.md` 补充或核对局域网访问验证命令与标准 HTTP 端口验证步骤

**检查点**：US5 完成后，服务监听范围符合部署和局域网测试需求，同时不引入新的 API 合同变化。

---

## 阶段 8：收尾与跨功能验证

**目的**：验证功能完整性、视觉质量、契约一致性和仓库约束。

- [X] T061 [P] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/src/tests/` 运行前端单元与组件测试，并修复主页 v2 相关失败
- [X] T062 [P] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/backend/cmd/server/` 运行后端 Go 测试，并修复监听地址相关失败
- [X] T063 [P] 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/shared/contracts/openapi/` 运行 OpenAPI lint/bundle 校验，确认本 feature 未产生无关 API 合同变更
- [X] T064 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/` 运行生产构建，修复类型、资源引用、资产体积或 Vite 构建失败
- [X] T065 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/frontend/playwright/` 运行主页 Playwright 验收，覆盖桌面端、移动端、下载、轮播和截图堆叠
- [X] T066 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/specs/003-homepage-ui-optimization/visual-review/` 保存最终桌面端、移动端、下载状态、轮播状态和截图堆叠验收图
- [X] T067 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/specs/003-homepage-ui-optimization/figma.md` 核对 Figma v2 节点、交互状态和最终实现差异，若 rate limit 已恢复则补充 readback 结果
- [X] T068 在 `/Users/jianglijie/Documents/BusIsCommingWebsite/specs/003-homepage-ui-optimization/tasks.md` 完成任务勾选、任务计数复核和实现后的 Spec Kit 提交说明

---

## 依赖关系

- **准备阶段**：无依赖，T001-T005 可先执行
- **基础阶段**：依赖准备阶段；T006-T013 完成后才能稳定推进各用户故事
- **US1**：依赖 T006、T007、T010；可作为 MVP 优先实现
- **US2**：依赖 T011-T013；不依赖 US1 的下载实现
- **US3**：依赖 T001、T004、T008、T011-T013；与 US2 共享 `AppPreviewCarousel`，实现时需串行合并
- **US4**：依赖 T009、T010、T011；可与 US1/US2/US3 的组件实现并行做文案数据更新，但同文件任务需串行
- **US5**：依赖项目现有前后端启动脚本；可与 UI 组件工作并行
- **收尾阶段**：依赖所有选定用户故事完成

## 用户故事依赖

- **US1（P1）**：可独立交付，完成后首屏下载体验即达成核心目标
- **US2（P1）**：可在基础阶段后独立交付，增强首屏展示
- **US3（P2）**：依赖截图 manifest 和 US2 的展示容器边界，但手动图集逻辑可独立验收
- **US4（P2）**：文案和范围修正可独立上线，但最好与 US2/US3 同步验证视觉排版
- **US5（P3）**：部署与局域网访问能力独立于 UI，可单独验证

## 并行执行示例

### US1

```bash
Task: "T014 frontend/src/tests/download-button.test.tsx"
Task: "T015 frontend/playwright/android-download.spec.ts"
Task: "T016 frontend/src/tests/download-section.test.tsx"
```

### US2

```bash
Task: "T025 frontend/src/tests/hero-carousel.test.tsx"
Task: "T026 frontend/playwright/hero-carousel.spec.ts"
```

### US3

```bash
Task: "T034 frontend/src/tests/screenshot-assets-contract.test.ts"
Task: "T035 frontend/src/tests/feature-gallery.test.tsx"
Task: "T036 frontend/playwright/feature-gallery.spec.ts"
```

### US4

```bash
Task: "T046 frontend/src/tests/i18n-completeness.test.ts"
Task: "T047 frontend/src/tests/sections-content.test.ts"
Task: "T053 specs/003-homepage-ui-optimization/visual-review/zh-hant-copy-review.md"
```

### US5

```bash
Task: "T054 frontend/playwright.config.ts"
Task: "T055 backend/cmd/server/main_test.go"
```

## 实施策略

### MVP 优先

1. 完成阶段 1 和阶段 2 的共享基础
2. 完成 US1：首屏按钮直接下载 Android APK
3. 独立运行 US1 的组件测试、Playwright 下载验证和桌面/移动视觉检查
4. 若需分批上线，US1 可作为第一批交付

## 实现记录

- 2026-06-16 实施完成。误建清单已删除；`requirements.md` 为唯一有效 checklist。
- T007 的主页内容契约验证合并在 `frontend/src/tests/content-contract.test.ts` 中完成。
- T016 的下载区状态验证合并在 `frontend/src/tests/download-button.test.tsx` 和 Playwright 下载状态用例中完成。
- T024、T033、T045、T066 的视觉证据由 Playwright 生成到 `specs/003-homepage-ui-optimization/visual-review/`；用户已确认当前图片资产不需要继续脱敏或处理。
- T067 未再次调用 Figma MCP readback；实现差异核对记录已写入 `figma.md`，以本地浏览器截图和自动化验收作为最终证据。
- 最终验证命令：
  - `npm --prefix frontend test`
  - `npm --prefix frontend run build`
  - `cd backend && go test ./...`
  - `npm --prefix frontend run openapi:lint`
  - `npm --prefix frontend run test:e2e`

### 增量交付

1. **MVP**：US1 下载交互
2. **首屏表现**：US2 自动轮播
3. **真实素材**：US3 脱敏截图堆叠图集
4. **本地化质量**：US4 香港繁中与城巴范围
5. **部署体验**：US5 监听地址与 HTTP 端口

### 团队并行策略

1. 一人先完成 T006-T013 共享基础
2. 之后 UI 工程可并行做 US1/US2/US3，文案工程可并行做 US4，后端/部署工程可并行做 US5
3. 修改 `carouselSlides.ts`、`homepageContent.ts`、`sectionsContent.ts` 的任务需要排队合并，避免覆盖彼此内容
4. 最后集中执行 T061-T068，统一验证视觉、契约和部署行为

## 任务统计

- **总任务数**：68
- **US1**：11 个任务
- **US2**：9 个任务
- **US3**：12 个任务
- **US4**：8 个任务
- **US5**：7 个任务
- **准备 + 基础 + 收尾**：21 个任务
- **可并行任务**：22 个任务标记为 `[P]`
- **建议 MVP**：US1（首屏下载按钮直接下载 Android APK）
