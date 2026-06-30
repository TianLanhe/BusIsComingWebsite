# 任务：隐私政策页面

**输入**：来自 `/specs/008-privacy-policy-pages/` 的设计文档

**前置条件**：`plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/`、`quickstart.md` 已存在并完成一致性检查。

**测试**：本功能涉及三语内容、可索引页面、footer 入口、静态生成和响应式 UI，必须包含自动化测试、构建验证、Playwright 双端验证和视觉记录。

**组织方式**：任务按用户故事分组，保证每个用户故事都能独立实现和验证。后端、OpenAPI 和 Android App 在本功能中均为 N/A，不生成实现任务。

## 格式：`[ID] [P?] [Story] 描述`

- **[P]**：可并行执行，且不会修改同一文件或依赖前置未完成任务
- **[Story]**：任务所属用户故事，例如 US1、US2、US3
- 描述中必须包含准确文件路径

## 路径约定

- **前端源码**：`frontend/src/`
- **前端测试**：`frontend/src/tests/`、`frontend/playwright/`
- **静态资源与生成脚本**：`frontend/public/`、`frontend/scripts/`
- **规格与验证记录**：`specs/008-privacy-policy-pages/`
- **共享契约**：本功能仅使用 `specs/008-privacy-policy-pages/contracts/`，不修改长期 HTTP API 契约

## 阶段 1：设置（共享基础）

**目的**：准备实现前的记录、审校和设计引用入口。

- [ ] T001 创建隐私政策三语文案审校记录文件 `specs/008-privacy-policy-pages/privacy-copy-review.md`
- [ ] T002 [P] 核对已确认的最终 Figma 设计入口和关键节点记录，路径：`specs/008-privacy-policy-pages/figma.md`
- [ ] T003 [P] 在 `specs/008-privacy-policy-pages/quickstart.md` 记录本功能不修改 Android App、后端 HTTP API、OpenAPI 和 DDD 目录的实现验证口径

---

## 阶段 2：基础设施（阻塞前置）

**目的**：建立所有用户故事共享的类型、路径判定和页面结构基础。此阶段完成前不能开始用户故事实现。

**关键要求**：路径和语言由 URL 决定；隐私页不得依赖运行时 HTTP 请求；新增用户可见文字必须支持 `zh-Hant`、`zh-Hans`、`en`。

- [ ] T004 在 `frontend/src/content/types.ts` 增加 PrivacyPolicyContent、PrivacyPolicyPage、SummaryCard、PolicySection、SeoPageGroup、FooterPrivacyLink 相关类型
- [ ] T005 [P] 新建页面路径解析辅助模块 `frontend/src/content/pageRouting.ts`，支持解析 `home`/`privacy` 页面类型、当前 locale 和当前语言首页返回路径
- [ ] T006 更新 `frontend/src/components/i18n/I18nProvider.tsx`，确保 `/zh-hant/privacy/`、`/zh-hans/privacy/`、`/en/privacy/` 能按 URL 初始化语言且不破坏首页语言持久化
- [ ] T007 更新 `frontend/src/tests/test-utils.tsx`，为隐私页组件测试提供可指定 pathname 和 locale 的渲染辅助
- [ ] T008 [P] 在 `specs/008-privacy-policy-pages/privacy-copy-review.md` 建立 `zh-Hant` 香港实用书面语、`zh-Hans` 自然简体和 `en` 克制产品英语的审校检查项

**检查点**：共享类型、路径判定和测试辅助完成，可以开始三个用户故事。

---

## 阶段 3：用户故事 1 - 查看清晰的隐私政策（优先级：P1）MVP

**目标**：用户直接打开三语隐私政策 URL 时，能看到适用于 Android App 与官网的清晰、简洁、完整隐私政策。

**独立测试**：直接访问 `/zh-hant/privacy/`、`/zh-hans/privacy/`、`/en/privacy/`，检查首屏、四个摘要卡、五个章节、最后更新日期、联系邮箱、语言和隐藏语言切换。

### 用户故事 1 的测试或验证

- [ ] T009 [P] [US1] 在 `frontend/src/tests/content-contract.test.ts` 增加隐私政策内容 schema 校验，使用 `specs/008-privacy-policy-pages/contracts/privacy-policy-content.schema.json`
- [ ] T010 [P] [US1] 在 `frontend/src/tests/i18n-completeness.test.tsx` 增加 `privacyPolicyContent` 三语完整性和 `zh-Hant` 非 `zh-Hans` 镜像断言
- [ ] T011 [P] [US1] 新建 `frontend/src/tests/privacy-policy-page.test.tsx`，覆盖三语隐私页标题、最后更新日期、`hezhenyu966@gmail.com`、四个摘要卡、五个章节和隐藏语言切换控件
- [ ] T012 [US1] 在 `specs/008-privacy-policy-pages/privacy-copy-review.md` 记录隐私政策正文不得主动提及 Android 备份、设备迁移、微信、Alipay、AlipayHK package 检查或跳转

### 用户故事 1 的实现

- [ ] T013 [P] [US1] 新建三语隐私政策内容模块 `frontend/src/content/privacyPolicyContent.ts`，包含 metadata、hero、summaryCards、sections 和联系邮箱 `hezhenyu966@gmail.com`
- [ ] T014 [P] [US1] 新建隐私页样式文件 `frontend/src/components/privacy/PrivacyPolicyPage.module.css`，覆盖桌面阅读宽度、手机单列摘要卡、正文分节和可聚焦链接状态
- [ ] T015 [US1] 新建隐私页组件 `frontend/src/components/privacy/PrivacyPolicyPage.tsx`，渲染首屏范围说明、更新时间、联系邮箱、四个摘要卡和五个章节
- [ ] T016 [US1] 更新 `frontend/src/components/sections/Header.tsx`，支持隐私页隐藏 `LanguageSwitcher`，并把品牌和导航链接指向当前语言首页或首页对应区域
- [ ] T017 [US1] 更新 `frontend/src/components/sections/Header.module.css`，保证隐私页 header 在手机和桌面隐藏语言切换后布局稳定
- [ ] T018 [US1] 更新 `frontend/src/app/App.tsx`，根据 `frontend/src/content/pageRouting.ts` 的页面类型在首页和隐私政策页之间切换渲染
- [ ] T019 [US1] 更新 `frontend/src/main.tsx` 或 `frontend/src/app/App.tsx` 的根渲染边界，确保直接访问 `/zh-hant/privacy/`、`/zh-hans/privacy/`、`/en/privacy/` 时不依赖无效锚点
- [ ] T020 [US1] 对照 `specs/008-privacy-policy-pages/contracts/privacy-policy-pages.contract.md` 检查 `frontend/src/content/privacyPolicyContent.ts` 的必须披露事实和不应写入内容

**检查点**：US1 可以独立演示，三语隐私页可直接打开并完整阅读。

---

## 阶段 4：用户故事 2 - 从官网发现隐私政策（优先级：P2）

**目标**：官网访问者能从当前语言 footer 找到隐私政策入口，同时主导航和 FAQ 继续聚焦功能、在线试查、下载、FAQ 和联系。

**独立测试**：分别在三语首页检查 footer 隐私链接存在且指向当前语言隐私页；确认主导航和 FAQ 没有新增隐私政策入口。

### 用户故事 2 的测试或验证

- [ ] T021 [P] [US2] 更新 `frontend/src/tests/sections-content.test.ts`，断言 footer 三语隐私链接 label 与 href 分别为 `/zh-hant/privacy/`、`/zh-hans/privacy/`、`/en/privacy/`
- [ ] T022 [P] [US2] 更新 `frontend/playwright/homepage-sections.spec.ts`，覆盖三语首页 footer 隐私入口可见、可点击且主导航不新增隐私政策项
- [ ] T023 [US2] 在 `specs/008-privacy-policy-pages/quickstart.md` 补充 footer-only 入口的人工检查步骤和主导航/FAQ 不新增入口的期望

### 用户故事 2 的实现

- [ ] T024 [US2] 更新 `frontend/src/content/homepageContent.ts`，为 footer 提供当前语言隐私政策链接文案和目标 URL，不把隐私政策加入 navigation 或 FAQ
- [ ] T025 [US2] 更新 `frontend/src/content/types.ts`，为 footer 隐私链接补充类型并保持现有 contact email 类型不变
- [ ] T026 [US2] 更新 `frontend/src/components/sections/FooterContact.tsx`，在联系信息附近渲染当前语言隐私政策链接
- [ ] T027 [US2] 更新 `frontend/src/components/sections/FooterContact.module.css`，为隐私政策链接添加桌面/手机布局、hover 和 focus-visible 状态
- [ ] T028 [US2] 对照 `frontend/src/content/homepageContent.ts` 和 `frontend/src/components/sections/Header.tsx` 确认主导航与 FAQ 没有新增隐私政策入口

**检查点**：US1 和 US2 都能独立工作，用户可以从首页 footer 进入隐私页。

---

## 阶段 5：用户故事 3 - 让搜索和审核发现隐私政策（优先级：P3）

**目标**：搜索引擎、审核人员和未来 Android App 配置能稳定发现三语隐私政策页，并看到正确 canonical、description、hreflang 和 sitemap。

**独立测试**：检查三个隐私页的搜索元信息、canonical、三语互链、静态 HTML 产物和 sitemap 公开发现路径。

### 用户故事 3 的测试或验证

- [ ] T029 [P] [US3] 更新 `frontend/src/tests/seo-routing.test.tsx`，覆盖 `home` 与 `privacy` 两个 SEO 页面组、privacy canonical、privacy hreflang 和 `x-default`
- [ ] T030 [P] [US3] 新建 `frontend/playwright/privacy-policy-pages.spec.ts`，覆盖三语隐私页桌面 1440px 与手机 390px 首屏、隐藏语言切换、footer 链接和无横向溢出
- [ ] T031 [US3] 在 `frontend/src/tests/seo-routing.test.tsx` 增加 sitemap 断言，确认 3 个首页 URL 和 3 个隐私 URL 分组互链且没有 privacy canonical 到首页

### 用户故事 3 的实现

- [ ] T032 [US3] 更新 `frontend/src/content/seoPages.json`，把 SEO 配置升级为 `home` 与 `privacy` 页面组，并为三语隐私页添加 title、description、OG 和 Twitter 摘要
- [ ] T033 [US3] 更新 `frontend/src/content/seo.ts`，提供 page-aware canonical、alternate links、locale path 和当前页面元信息 helper
- [ ] T034 [US3] 更新 `frontend/src/components/seo/SeoHead.tsx`，按当前页面类型写入 title、description、robots、canonical、hreflang、OG 和 Twitter tags
- [ ] T035 [US3] 更新 `frontend/scripts/generate-locale-pages.mjs`，生成 `dist/zh-hant/privacy/index.html`、`dist/zh-hans/privacy/index.html`、`dist/en/privacy/index.html` 并保持三语首页产物
- [ ] T036 [US3] 更新 `frontend/public/sitemap.xml`，包含三语首页和三语隐私页 URL，并分别维护 `home` 与 `privacy` 的 `xhtml:link` alternate 关系
- [ ] T037 [US3] 确认 `frontend/index.html` 的默认 head 模板可被 `frontend/scripts/generate-locale-pages.mjs` 替换出 privacy 页面元信息
- [ ] T038 [US3] 对照 `specs/008-privacy-policy-pages/quickstart.md` 执行本地 sitemap 与静态 HTML 抽查，并把抽查结果记录到 `specs/008-privacy-policy-pages/quickstart.md`

**检查点**：全部用户故事可独立验证，隐私页具备公开发现和审核使用条件。

---

## 阶段 6：打磨与跨切面

**目的**：完成视觉证据、三语审校、构建验证、回归测试和提交前质量检查。

- [ ] T039 [P] 在 `specs/008-privacy-policy-pages/privacy-copy-review.md` 记录 `zh-Hant` 香港语境、`zh-Hans` 自然简体和 `en` 克制产品英语的最终审校结论
- [ ] T040 [P] 使用本地浏览器保存桌面隐私页截图到 `specs/008-privacy-policy-pages/visual-review/desktop-privacy-1440.png`
- [ ] T041 [P] 使用本地浏览器保存手机隐私页截图到 `specs/008-privacy-policy-pages/visual-review/mobile-privacy-390.png`
- [ ] T042 对照 `specs/008-privacy-policy-pages/figma.md` 中已补录的真实 Figma frame 链接检查实现视觉、交互状态和响应式布局
- [ ] T043 运行 `cd frontend && npm run test -- i18n-completeness.test.tsx content-contract.test.ts seo-routing.test.tsx privacy-policy-page.test.tsx`，并把结果记录到 `specs/008-privacy-policy-pages/quickstart.md`
- [ ] T044 运行 `cd frontend && npm run build`，确认 `frontend/dist/zh-hant/privacy/index.html`、`frontend/dist/zh-hans/privacy/index.html`、`frontend/dist/en/privacy/index.html` 和 `frontend/dist/sitemap.xml` 存在
- [ ] T045 运行 `cd frontend && npm run test:e2e -- privacy-policy-pages.spec.ts homepage-sections.spec.ts`，并把双端验证结果记录到 `specs/008-privacy-policy-pages/quickstart.md`
- [ ] T046 检查 `frontend/src/content/privacyPolicyContent.ts` 和 `frontend/src/content/homepageContent.ts`，确认网站未暗示提供完整路线规划、地铁、铁路、渡轮或其他非香港巴士交通查询
- [ ] T047 检查 `frontend/src/content/privacyPolicyContent.ts`，确认没有写入 Android 备份、设备迁移、微信、Alipay、AlipayHK package 检查或跳转
- [ ] T048 检查 `frontend/src/content/pageRouting.ts`、`frontend/src/content/seo.ts`、`frontend/src/components/seo/SeoHead.tsx` 和 `frontend/scripts/generate-locale-pages.mjs`，确认非显而易见的路径推导、SEO 页面组和静态生成边界已有必要中文注释，且没有重复代码字面含义的噪音注释
- [ ] T049 运行 `rg -n "NEEDS[ ]CLARIFICATION|FEATURE[ ]NAME|ARGUMENTS|TO[ ]?DO|模板占位" specs/008-privacy-policy-pages --glob '!**/checklists/**' --glob '!**/quickstart.md' --glob '!**/tasks.md'` 和 `git diff --check`
- [ ] T050 在 `specs/008-privacy-policy-pages/quickstart.md` 记录实现完成后的提交前检查结果，确认 `git status --short` 只包含 008 隐私政策页面相关文件

---

## 依赖与执行顺序

### 阶段依赖

- **设置（阶段 1）**：无依赖，可以立即开始
- **基础设施（阶段 2）**：依赖设置完成，阻塞所有用户故事
- **用户故事 1（阶段 3）**：依赖基础设施完成，是 MVP
- **用户故事 2（阶段 4）**：依赖基础设施完成；可在 US1 内容模型稳定后与 US1 后半段并行
- **用户故事 3（阶段 5）**：依赖基础设施完成；SEO 元信息可与 US1/US2 并行，但静态生成验证需要页面和 footer 基本完成
- **打磨（阶段 6）**：依赖目标用户故事完成

### 用户故事依赖

- **US1（P1）**：基础设施完成后即可开始，不依赖 US2 或 US3
- **US2（P2）**：基础设施完成后即可开始；footer 链接目标依赖 US1 的隐私路径约定
- **US3（P3）**：基础设施完成后即可开始；构建产物和 Playwright 验证依赖 US1 页面与 US2 footer 入口完成

### 单个用户故事内部顺序

- 测试或验证任务先定义
- 内容 schema 和 i18n 完整性先于页面实现完成标记
- 隐私政策内容先于页面组件渲染
- footer 内容结构先于 footer 组件渲染
- SEO 页面组先于 `SeoHead`、静态生成脚本和 sitemap
- 每个故事完成后先独立验证，再进入最终打磨

## 并行机会

- T002、T003 可与 T001 并行
- T005、T008 可与 T004 并行，但 T006/T007 需要基础类型和路径约定稳定
- US1 中 T009、T010、T011 可并行编写；T013 与 T014 可并行
- US2 中 T021 与 T022 可并行；T027 可在 T026 接口稳定后独立调整样式
- US3 中 T029 与 T030 可并行；T032 完成后 T033、T034、T035、T036 可按文件拆分并行推进
- 打磨阶段 T039、T040、T041 可并行

## 实施策略

### MVP 优先

1. 完成阶段 1 设置
2. 完成阶段 2 基础设施
3. 完成 US1：三语隐私政策页可直接打开和阅读
4. 独立验证 US1 的三语内容、摘要卡、五个章节和隐藏语言切换
5. 再推进 US2 footer 入口和 US3 SEO/sitemap

### 增量交付

1. 设置 + 基础设施 -> 页面路径和类型稳定
2. US1 -> 隐私页可读 -> 可演示
3. US2 -> footer 可发现 -> 可演示
4. US3 -> 搜索和审核可发现 -> 可演示
5. 打磨 -> 视觉证据、构建、Playwright 和提交前检查

## 备注

- [P] 表示不同文件、无直接依赖、可并行执行
- [Story] 标签映射到 `spec.md` 中的用户故事
- 本功能不修改 Android App、后端 HTTP API、OpenAPI 源文件或服务端 DDD 目录
- 实现阶段若发现必须触碰非目标范围，先回到 spec/plan 重新确认
- 每次 Spec Kit skill 完成并验证通过后必须自动提交，除非提交范围或信息不清晰
