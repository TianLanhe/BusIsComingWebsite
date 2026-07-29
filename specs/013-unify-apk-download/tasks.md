# 任务：统一 Android APK 下载入口

**输入**：来自 `/specs/013-unify-apk-download/` 的功能规格、实施计划、研究、数据模型、
前端状态契约、Figma 引用和快速验证指南

**前置条件**：`plan.md`、`spec.md`、`research.md`、`data-model.md`、
`contracts/download-entry-state-contract.md`、`figma.md` 必须存在

**测试**：本功能修复真实手机下载故障，必须先补自动化失败测试，再修改实现；最终必须同时提供
Vitest、Playwright、OpenAPI、Go 回归、双端截图和真实 Android Chrome 证据。

**组织方式**：任务按用户故事分组。US1 先交付 ready 状态的统一原生下载，US2 增加 metadata
门禁，US3 完成三语、双端和无障碍；每个故事都有独立验收路径。

## 格式：`[ID] [P?] [Story] 描述`

- **[P]**：可以和同阶段其他不同文件任务并行
- **[Story]**：任务归属 `US1`、`US2`、`US3`
- 每条任务均包含真实文件路径

## 阶段 1：设置与设计门禁

**目的**：在代码实现前补齐唯一未完成的 Figma 节点交付，并锁定本功能验证基线。

- [ ] T001 使用具备 Edit 权限的 Figma 连接把 `specs/013-unify-apk-download/prototype/index.html` 的三态状态板导入 `BusIsComing Website - APK Download Alignment 013` Draft，回填根节点、桌面/手机三态和三语节点 ID，并保存 Figma screenshot 证据，路径：`specs/013-unify-apk-download/figma.md`、`specs/013-unify-apk-download/prototype/desktop-1440.png`、`specs/013-unify-apk-download/prototype/mobile-390.png`
- [ ] T002 [P] 记录实现前基线：确认 `emulator-5556` 或其他真实 Android 设备在线、保存 Chrome 版本与现有中下部 99% 复现结果；设备不可用时明确阻塞而不以桌面移动视口替代，路径：`specs/013-unify-apk-download/quickstart.md`

---

## 阶段 2：共享契约与测试基础

**目的**：先校正权威契约和三语状态，再为共享下载动作建立先失败的组件测试。

**关键要求**：阶段 2 完成前不得修改 Hero 或中下部的生产下载行为。

- [ ] T003 [P] 校正 metadata 的中文客户端语义，删除“元数据失败不得禁用稳定下载入口”，明确其为入口可用性门禁且不保证最终下载完成，保持 path/schema/error code 不变，路径：`specs/010-website-analytics/contracts/download-api.openapi.yaml`
- [ ] T004 [P] 把 `android-pending/android-error` 的 fetch 下载状态改为 `android-checking/android-ready/android-unavailable`，并写明两处入口共享状态、ready 才有稳定链接、禁止 Blob 流程，路径：`shared/contracts/ui-state-contract.md`
- [ ] T005 [P] 增加检查中、可用、不可用的三语文案并删除只服务页面内 Blob 流程的“正在准备/下载失败”文案，同时扩展完整性断言，路径：`frontend/src/content/uiCopy.ts`、`frontend/src/content/homepageContent.ts`、`frontend/src/tests/i18n-completeness.test.tsx`
- [ ] T006 为共享 Android 下载动作编写先失败组件测试，覆盖 ready 原生 `href/download`、checking/unavailable 无 `href`、disabled/aria 语义、元数据文件名与不得调用 APK `fetch`/`URL.createObjectURL`，路径：`frontend/src/tests/android-download-action.test.tsx`
- [ ] T007 实现只消费 `DownloadMetadataProvider` 三态的共享 `AndroidDownloadAction`，ready 渲染原生链接，其他状态渲染不可操作元素，不保存下载进度或读取 APK bytes，路径：`frontend/src/components/download/AndroidDownloadAction.tsx`、`frontend/src/components/download/AndroidDownloadAction.module.css`

**检查点**：共享动作、契约和三语状态已可独立测试，Hero 与中下部尚未切换生产行为。

---

## 阶段 3：用户故事 1 - 两处入口都能可靠下载（优先级：P1）MVP

**目标**：在 metadata ready 条件下，Hero 与页面中下部都通过同一原生下载语义取得完整 APK。

**独立测试**：固定合法 metadata，分别点击两处入口；两次均由 Playwright `download` 事件接管，
建议文件名、字节数、SHA-256 与 `backend/downloads/android/current.json` 一致，APK URL 没有被
页面 `fetch`。

### 用户故事 1 的测试

- [ ] T008 [P] [US1] 把既有 Hero/中下部测试改为 ready metadata 条件下的两个原生链接断言，删除 Blob、合成点击和页面内失败状态期望，并明确点击不调用 APK `fetch`，路径：`frontend/src/tests/download-button.test.tsx`
- [ ] T009 [P] [US1] 扩展下载 E2E，分别从 `#hero` 和 `#download` 触发浏览器下载，逐个保存文件并核对建议文件名、`sizeBytes` 和 SHA-256，路径：`frontend/playwright/android-download.spec.ts`

### 用户故事 1 的实现

- [ ] T010 [US1] 用共享 `AndroidDownloadAction` 替换 Hero 静态直接链接，使 ready 的 `href/download` 来自已校验 metadata，保留在线查询次操作和现有布局，路径：`frontend/src/components/hero/HeroIntro.tsx`、`frontend/src/components/hero/HeroIntro.module.css`
- [ ] T011 [US1] 用共享 `AndroidDownloadAction` 替换中下部按钮的 `fetch → blob → object URL → synthetic click` 流程，删除本地 `idle/downloading/failed` 状态、立即 revoke 和失败提示分支，保持 iPhone 只读状态，路径：`frontend/src/components/download/DownloadSegmentedButton.tsx`、`frontend/src/components/download/DownloadSegmentedButton.module.css`
- [ ] T012 [US1] 调整 Download Section 的 ready 版本/大小展示，确保外层说明与共享动作不重复或矛盾，并保持桌面/手机区块层级，路径：`frontend/src/components/sections/DownloadSection.tsx`、`frontend/src/components/sections/DownloadSection.module.css`

**检查点**：metadata ready 时 US1 可独立交付；两处入口都完成浏览器原生下载，页面不处理 APK bytes。

---

## 阶段 4：用户故事 2 - 下载前确认当前安装包可用（优先级：P1）

**目标**：loading、失败或无效 metadata 时，两处入口同步不可操作且产生 0 次 APK 请求。

**独立测试**：分别提供 pending Promise、404、500、网络拒绝、非法 JSON、非法字段和合法 metadata，
确认两处入口状态同步；只有合法结果可以产生 APK 请求，同一 `document` 仍只有一次 metadata 请求。

### 用户故事 2 的测试

- [ ] T013 [P] [US2] 扩展 Provider/主页测试，覆盖 loading、404、500、网络错误、非法 JSON、非法 `downloadUrl/fileName/sizeBytes`，断言两处入口同步禁用、无静态回退、无重试、语言切换不重取，路径：`frontend/src/tests/download-metadata-provider.test.tsx`
- [ ] T014 [P] [US2] 扩展 metadata E2E 的 ready/checking/unavailable 路由拦截，统计 APK 请求数并断言所有非 ready 场景为 0，同时检查两处无 `href` 和无 `blob:` URL，路径：`frontend/playwright/apk-metadata.spec.ts`

### 用户故事 2 的实现

- [ ] T015 [US2] 明确 `DownloadMetadataProvider` 的共享只读三态类型和“检查成功不等于下载完成”边界，保持单 document in-flight、无重试和语言切换复用；如现有实现已满足则只做命名/导出收敛，路径：`frontend/src/components/download/DownloadMetadataProvider.tsx`
- [ ] T016 [US2] 在 Hero 和中下部为 checking/unavailable 接入同一三语状态内容与不可操作语义，移除 metadata 失败后仍保留下载链接的旧回退，路径：`frontend/src/components/hero/HeroIntro.tsx`、`frontend/src/components/download/DownloadSegmentedButton.tsx`、`frontend/src/components/sections/DownloadSection.tsx`

**检查点**：US2 可通过 metadata stub 独立验证；非 ready 状态不会触碰 APK 下载接口。

---

## 阶段 5：用户故事 3 - 三语和双端状态清晰（优先级：P2）

**目标**：三态在 `zh-Hant`、`zh-Hans`、`en` 及 1440/390 下自然、清晰、可访问且不跳动。

**独立测试**：在三语和两个 viewport 逐一渲染三态，检查文案、44px 触控区、可见焦点、disabled
语义、无水平滚动、无文字遮挡，并与 Figma `v1.4` 节点截图对照。

### 用户故事 3 的测试与视觉验证

- [ ] T017 [P] [US3] 增加三语可见文案、accessible name、disabled/aria-disabled、键盘焦点和 iPhone 只读不变量测试，路径：`frontend/src/tests/android-download-action.test.tsx`、`frontend/src/tests/download-button.test.tsx`
- [ ] T018 [US3] 为 1440 与 390 的 checking/ready/unavailable 保存双端截图，断言主要操作区域至少 44×44px、无水平滚动和长英文遮挡，并与 Figma 节点比对，路径：`frontend/playwright/apk-metadata.spec.ts`、`frontend/playwright/__screenshots__/apk-download-checking-desktop.png`、`frontend/playwright/__screenshots__/apk-download-ready-desktop.png`、`frontend/playwright/__screenshots__/apk-download-unavailable-desktop.png`、`frontend/playwright/__screenshots__/apk-download-checking-mobile.png`、`frontend/playwright/__screenshots__/apk-download-ready-mobile.png`、`frontend/playwright/__screenshots__/apk-download-unavailable-mobile.png`

### 用户故事 3 的实现

- [ ] T019 [US3] 按 Figma `v1.4` 统一两处三态的尺寸、焦点、禁用视觉和文本换行，保持 Hero/Download Section 既有视觉层级并满足 390/1440，路径：`frontend/src/components/download/AndroidDownloadAction.module.css`、`frontend/src/components/hero/HeroIntro.module.css`、`frontend/src/components/download/DownloadSegmentedButton.module.css`、`frontend/src/components/sections/DownloadSection.module.css`
- [ ] T020 [US3] 按 `zh-hant-en-copy-review.md` 完成香港繁体和自然英文人工审校，确认动态版本/大小只在 ready 展示且 iPhone 文案不变，路径：`frontend/src/content/uiCopy.ts`、`frontend/src/content/homepageContent.ts`、`specs/013-unify-apk-download/zh-hant-en-copy-review.md`
- [ ] T021 [US3] 在真实 Android Chrome 从 Hero 与中下部各完成一次下载，记录 Chrome 下载接管、无页面 99%、字节数和 SHA-256；同时验证 metadata unavailable 两处不可点，路径：`specs/013-unify-apk-download/quickstart.md`、`specs/013-unify-apk-download/figma.md`

**检查点**：三个用户故事均可独立验收；手机证据来自真实 Android Chrome，不只来自桌面模拟。

---

## 阶段 6：打磨、契约同步与全量回归

**目的**：清理旧路径、生成权威契约派生物，并证明前端改动没有破坏服务端和其他主页能力。

- [ ] T022 [P] 从 feature 权威 OpenAPI 单向同步校正后的中文说明到共享主契约和兼容镜像，再生成 bundle 与中文 API UI，禁止手工维护生成物，路径：`shared/contracts/openapi/download-api.openapi.yaml`、`shared/contracts/download-api.openapi.yaml`、`shared/contracts/openapi/download-api.bundle.yaml`、`shared/contracts/openapi/docs/download-api.html`
- [ ] T023 [P] 清理只服务 Blob 下载的未使用 import、类型、CSS 状态和文案，并用搜索确认生产下载代码不再包含 `response.blob`、`URL.createObjectURL`、`URL.revokeObjectURL` 或 APK `fetch`，路径：`frontend/src/components/download/DownloadSegmentedButton.tsx`、`frontend/src/components/download/DownloadSegmentedButton.module.css`、`frontend/src/content/uiCopy.ts`
- [ ] T024 [P] 运行 downloads 后端回归，确认 APK 成功/404/409/500、完整性、`Content-Disposition`、`Content-Length`、SHA header、recovery、日志和匿名归因未回退，路径：`backend/internal/downloads/`
- [ ] T025 运行 OpenAPI lint/bundle/docs、目标 Vitest、`npm run build:public`、两项目 Playwright，再运行全量 `npm run test:unit`、`npm run build`、`npm run test:e2e`，把结果和任何环境限制记录到 `specs/013-unify-apk-download/quickstart.md`
- [ ] T026 更新 Figma `v1.4` 最终节点截图和版本说明，确认节点无裁切、重叠、占位文案且与实际 1440/390 三态一致，路径：`specs/013-unify-apk-download/figma.md`
- [ ] T027 执行 `git diff --check`、检查工作区只包含本功能实现和证据、确认未把用户已有 `backend/downloads/android/BusIsComing.apk` 与 `backend/downloads/android/current.json` 意外纳入，然后按项目规则自动提交，路径：`specs/013-unify-apk-download/tasks.md`

---

## 依赖与执行顺序

### 阶段依赖

- **阶段 1**：无代码依赖；T001 是 UI 实施完成的硬门禁，T002 是真实手机证据前置。
- **阶段 2**：可在阶段 1 权限协调期间开展契约和先失败测试，但 T007 完成前不能进入两处入口集成。
- **US1（阶段 3）**：依赖 T006/T007；先交付 ready 的统一原生下载。
- **US2（阶段 4）**：依赖共享动作和 US1 集成位置；测试可以先并行编写，独立以非 ready stub 验收。
- **US3（阶段 5）**：依赖 US1/US2 三态完整；T017 可提前编写，视觉实现和真实手机验收随后进行。
- **阶段 6**：依赖所有目标故事完成。

### 用户故事依赖

- **US1**：MVP，直接解决中下部手机 99%。
- **US2**：复用 US1 的共享动作，但可通过 metadata 非 ready 场景独立验收；它负责用户指定的可用性检查。
- **US3**：依赖两种行为已经稳定，只完善三语、无障碍、双端和真实设备证据。

### 单个故事内部顺序

1. 先写测试并确认旧实现失败。
2. 契约和三语文案先于生产组件改动。
3. 共享动作先于 Hero/中下部接入。
4. 单元测试通过后再做 Playwright。
5. 桌面/手机自动化通过后再做真实 Android Chrome。
6. Figma 节点和截图与实际状态一致后才标记 UI 完成。

### 并行机会

- T001、T002 可并行；Figma 权限协调不阻塞真实设备盘点。
- T003、T004、T005 可并行，分别修改 OpenAPI、共享 UI 契约和 i18n。
- T008、T009 可并行编写，分别覆盖组件与 E2E。
- T013、T014 可并行编写，分别覆盖 Provider 和浏览器门禁。
- T022、T023、T024 可并行，分别处理契约生成、前端清理和后端回归。

## 并行执行示例：US1

```text
任务 A：T008，更新 frontend/src/tests/download-button.test.tsx
任务 B：T009，更新 frontend/playwright/android-download.spec.ts
等待 A/B 的先失败证据
任务 C：T010，接入 Hero
任务 D：T011，接入中下部并删除 Blob 流程
任务 E：T012，收敛 Download Section 展示
```

## 实施策略

### MVP 优先

1. 完成契约和共享动作。
2. 完成 US1 ready 路径。
3. 立即在真实 Android Chrome 验证中下部不再 99%。
4. 若 US1 未解决，不继续用视觉细节掩盖下载链路问题。

### 增量交付

1. **US1**：两处原生下载，解决根因。
2. **US2**：metadata 三态门禁，避免无效入口。
3. **US3**：三语、无障碍、双端和 Figma 对齐。
4. **打磨**：生成契约、全量回归、真实设备证据和自动提交。

## 备注

- `[P]` 只表示文件和依赖允许并行，不表示跳过前置测试。
- 本功能不修改后端代码；`backend/internal/downloads/` 任务仅为回归验证。
- 不把 Range/断点续传加入本期；若原生下载仍在特定网络失败，应建立独立 feature 调查服务端
  Range/CDN 行为，而不是恢复 Blob 方案。
- Figma Draft 当前权限问题必须诚实保留，获得 Edit 权限后完成 T001/T026。
- 每次 Spec Kit skill 和后续实现通过验证后按项目规则自动提交，且排除用户现有 APK/元数据改动。
