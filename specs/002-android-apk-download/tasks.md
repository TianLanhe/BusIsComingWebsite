# 任务：Android APK 下载

**输入**：来自 `specs/002-android-apk-download/` 的 `spec.md`、`plan.md`、`research.md`、`data-model.md`、`contracts/`、`quickstart.md`

**前置条件**：`plan.md` 已存在；本功能已有 3 个按优先级排列的用户故事；规格明确要求后端、前端、契约、Playwright 和哈希校验。

**测试**：本功能涉及真实 APK 下载、服务端校验、三语状态、iPhone 不下载和双端 UI，因此必须包含自动化测试、端到端下载验证和截图证据任务。

**组织方式**：任务按用户故事分组，保证每个用户故事都能在基础设施完成后独立实现和验证。

## 阶段 1：设置（共享基础）

**目的**：准备后端 Go 服务、前端代理、端到端运行方式和契约校验工具。

- [ ] T001 初始化后端 Go 模块并加入 Gin 依赖，路径：`backend/go.mod`、`backend/go.sum`
- [ ] T002 建立 `downloads` bounded context 的 DDD 目录，路径：`backend/internal/downloads/domain/`、`backend/internal/downloads/application/`、`backend/internal/downloads/infrastructure/filesystem/`、`backend/internal/downloads/interfaces/http/`
- [ ] T003 建立后端服务入口骨架，路径：`backend/cmd/server/main.go`
- [ ] T004 [P] 配置 Vite 开发代理把 `/api` 转发到 Go 后端，路径：`frontend/vite.config.ts`
- [ ] T005 [P] 配置 Playwright 同时覆盖 Vite 前端和 Go 后端运行方式，路径：`frontend/playwright.config.ts`
- [ ] T006 [P] 增加 OpenAPI lint 和 bundle 脚本及 Redocly CLI 依赖，路径：`frontend/package.json`、`frontend/package-lock.json`
- [ ] T007 [P] 建立双端截图和验证证据目录说明，路径：`specs/002-android-apk-download/visual-review/README.md`
- [ ] T008 更新后端本地运行、DDD 分层和当前 APK 管理说明，路径：`backend/README.md`

---

## 阶段 2：基础设施（阻塞前置）

**目的**：同步权威契约、复制当前 APK、写入元数据，并为所有用户故事建立共同事实来源。

**关键要求**：此阶段完成前不能开始用户故事实现；前端不得读取后端内部路径，后端不得把领域规则写入 handler。

- [ ] T009 同步 OpenAPI 3.1 权威契约到共享入口，路径：`shared/contracts/openapi/download-api.openapi.yaml`、`shared/contracts/download-api.openapi.yaml`
- [ ] T010 同步下载 manifest JSON Schema 到共享契约，路径：`shared/contracts/download-manifest.schema.json`
- [ ] T011 同步下载按钮 UI 状态契约到共享契约，路径：`shared/contracts/ui-state-contract.md`
- [ ] T012 从 `/Users/jianglijie/AndroidStudioProjects/BusIsComming/app/release/BusIsComing.apk` 复制当前 APK 到服务端受管空间，路径：`backend/downloads/android/BusIsComing.apk`
- [ ] T013 记录当前 APK 元数据 `appName`、`applicationId`、`versionName`、`versionCode`、`sizeBytes`、`sha256`、`sourcePath`、`lastUpdated`，路径：`backend/downloads/android/current.json`
- [ ] T014 [P] 记录 Android 主项目和当前 APK 的产品事实来源，路径：`frontend/src/content/sourceReferences.ts`
- [ ] T015 [P] 建立 Redocly 配置以校验共享 OpenAPI 契约，路径：`frontend/redocly.yaml`
- [ ] T016 复核 quickstart 的本地验证命令与实际脚本名称一致，路径：`specs/002-android-apk-download/quickstart.md`

**检查点**：APK、元数据、OpenAPI、manifest schema 和 UI 状态契约都有稳定路径，可以开始按用户故事实现。

---

## 阶段 3：用户故事 1 - 下载 Android APK（优先级：P1）MVP

**目标**：用户在首屏或下载区点击 Android 下载入口后，通过后端稳定入口下载当前 `BusIsComing.apk`。

**独立测试**：启动 Go 后端和 Vite 前端，在桌面或手机 viewport 点击 Android 下载入口；下载文件大小为 `5,009,547` bytes，SHA-256 为 `93e7930ee9e6b9cc05819bab895153ad985707bdcfff3e6bead60065acf07470`。

### 用户故事 1 的测试或验证

- [ ] T017 [P] [US1] 增加当前 APK、校验和下载结果领域测试，路径：`backend/internal/downloads/domain/artifact_test.go`、`backend/internal/downloads/domain/checksum_test.go`
- [ ] T018 [P] [US1] 增加“下载当前 Android APK”应用用例测试，路径：`backend/internal/downloads/application/download_current_apk_test.go`
- [ ] T019 [P] [US1] 增加文件系统 APK 读取和 SHA-256 计算测试，路径：`backend/internal/downloads/infrastructure/filesystem/artifact_repository_test.go`、`backend/internal/downloads/infrastructure/filesystem/checksum_calculator_test.go`
- [ ] T020 [P] [US1] 增加下载端点成功响应、响应头和二进制内容测试，路径：`backend/internal/downloads/interfaces/http/handler_test.go`
- [ ] T021 [P] [US1] 增加 Android 下载端到端测试并校验下载文件哈希，路径：`frontend/playwright/android-download.spec.ts`

### 用户故事 1 的实现

- [ ] T022 [US1] 实现当前 APK、APK 元数据、校验规则、下载结果和领域错误，路径：`backend/internal/downloads/domain/artifact.go`、`backend/internal/downloads/domain/checksum.go`、`backend/internal/downloads/domain/download_result.go`
- [ ] T023 [US1] 实现下载当前 Android APK 用例和领域端口，路径：`backend/internal/downloads/application/download_current_apk.go`、`backend/internal/downloads/application/ports.go`
- [ ] T024 [US1] 实现受管 APK 文件读取、元数据读取和 SHA-256 计算适配，路径：`backend/internal/downloads/infrastructure/filesystem/artifact_repository.go`、`backend/internal/downloads/infrastructure/filesystem/checksum_calculator.go`
- [ ] T025 [US1] 实现 Gin HTTP handler、路由注册、响应头和错误映射，路径：`backend/internal/downloads/interfaces/http/handler.go`、`backend/internal/downloads/interfaces/http/routes.go`
- [ ] T026 [US1] 将 `downloads` 路由装配到 Go 服务并设置本地监听端口，路径：`backend/cmd/server/main.go`
- [ ] T027 [US1] 将 Android manifest 状态改为可下载并使用同源 URL `/api/downloads/android/latest`，路径：`frontend/src/content/downloadManifest.ts`、`frontend/src/content/types.ts`
- [ ] T028 [US1] 接入 Android 下载按钮点击行为并确保下载文件名语义为 `BusIsComing.apk`，路径：`frontend/src/components/download/DownloadSegmentedButton.tsx`、`frontend/src/components/download/DownloadSegmentedButton.module.css`
- [ ] T029 [US1] 确保首屏和下载区复用同一个 Android 下载入口与 manifest 状态，路径：`frontend/src/components/hero/HeroSection.tsx`、`frontend/src/components/sections/DownloadSection.tsx`
- [ ] T030 [US1] 记录桌面和手机下载入口截图证据，路径：`specs/002-android-apk-download/visual-review/desktop-1440-android-download.png`、`specs/002-android-apk-download/visual-review/mobile-390-android-download.png`
- [ ] T031 [US1] 在 quickstart 中记录 US1 独立验证的 curl、Playwright 和 SHA-256 命令，路径：`specs/002-android-apk-download/quickstart.md`

**检查点**：用户故事 1 可以作为 MVP 独立交付；真实 APK 可从后端入口下载，且哈希一致。

---

## 阶段 4：用户故事 2 - 管理当前 APK 文件（优先级：P2）

**目标**：维护者能在服务端受管空间确认当前 APK、元数据和下载文件一致；后续只替换当前文件，不暴露历史版本。

**独立测试**：检查 `backend/downloads/android/BusIsComing.apk` 和 `backend/downloads/android/current.json`；下载得到的文件与元数据中的 size 和 SHA-256 一致；服务端目录不向用户提供历史版本列表。

### 用户故事 2 的测试或验证

- [ ] T032 [P] [US2] 增加当前 APK 元数据读取和字段完整性测试，路径：`backend/internal/downloads/infrastructure/filesystem/metadata_repository_test.go`
- [ ] T033 [P] [US2] 增加 APK 缺失、不可读和校验不一致的应用层测试，路径：`backend/internal/downloads/application/download_current_apk_test.go`
- [ ] T034 [P] [US2] 增加 `404`、`409`、`500` JSON 错误格式测试，路径：`backend/internal/downloads/interfaces/http/handler_test.go`
- [ ] T035 [P] [US2] 增加共享 manifest schema 对当前 APK 元数据字段的契约测试，路径：`frontend/src/tests/content-contract.test.ts`

### 用户故事 2 的实现

- [ ] T036 [US2] 实现当前 APK 元数据读取、大小校验和 SHA-256 校验失败原因映射，路径：`backend/internal/downloads/infrastructure/filesystem/artifact_repository.go`、`backend/internal/downloads/application/download_current_apk.go`
- [ ] T037 [US2] 更新 `current.json` 为当前唯一 APK 的权威元数据，路径：`backend/downloads/android/current.json`
- [ ] T038 [US2] 补充维护者替换当前 APK、更新元数据和不保留历史版本的操作说明，路径：`backend/README.md`
- [ ] T039 [US2] 记录维护者 2 分钟内可核对版本、大小、SHA-256、来源路径和更新时间的验证步骤，路径：`specs/002-android-apk-download/quickstart.md`

**检查点**：用户故事 2 完成后，服务端受管空间与元数据可审计，失败状态不会伪装成成功下载。

---

## 阶段 5：用户故事 3 - 理解下载状态与平台限制（优先级：P3）

**目标**：三语用户在点击前能看懂 Android 可下载、版本和大小；iPhone 继续显示暂未支持，且任何交互都不触发 APK 下载。

**独立测试**：切换 `zh-Hant`、`zh-Hans`、`en` 后查看首屏和下载区；Android 展示 `Android APK 1.0` 和约 `4.8 MB`，iPhone 状态为暂未支持且点击不下载。

### 用户故事 3 的测试或验证

- [ ] T040 [P] [US3] 补齐 Android 可下载、版本大小、失败提示和 iPhone 暂未支持的三语完整性测试，路径：`frontend/src/tests/i18n-completeness.test.tsx`
- [ ] T041 [P] [US3] 补齐下载按钮 Android 元数据展示和 iPhone 不下载组件测试，路径：`frontend/src/tests/download-button.test.tsx`
- [ ] T042 [P] [US3] 补齐下载区内容与范围排除文案测试，路径：`frontend/src/tests/sections-content.test.ts`
- [ ] T043 [P] [US3] 增加 iPhone 暂未支持、语言切换和无下载事件的 Playwright 验证，路径：`frontend/playwright/platform-download-states.spec.ts`

### 用户故事 3 的实现

- [ ] T044 [US3] 更新 Android 可下载、版本大小、失败提示和 iPhone 暂未支持三语文案，路径：`frontend/src/content/uiCopy.ts`、`frontend/src/content/sectionsContent.ts`
- [ ] T045 [US3] 更新下载 manifest 的 Android artifact 用户可见元数据和 iPhone `downloadUrl: null` 状态，路径：`frontend/src/content/downloadManifest.ts`
- [ ] T046 [US3] 扩展下载平台状态和 artifact 类型，路径：`frontend/src/content/types.ts`
- [ ] T047 [US3] 调整下载按钮展开态、禁用态、焦点态和移动端触控布局，路径：`frontend/src/components/download/DownloadSegmentedButton.tsx`、`frontend/src/components/download/DownloadSegmentedButton.module.css`
- [ ] T048 [US3] 调整下载区展示版本、大小和不可用说明时的桌面与手机布局，路径：`frontend/src/components/sections/DownloadSection.tsx`、`frontend/src/components/sections/DownloadSection.module.css`
- [ ] T049 [US3] 更新 Figma 引用、节点、交互状态和本功能版本说明，路径：`specs/002-android-apk-download/figma.md`
- [ ] T050 [US3] 保存下载区和 iPhone 暂未支持状态截图证据，路径：`specs/002-android-apk-download/visual-review/desktop-1440-download-section.png`、`specs/002-android-apk-download/visual-review/iphone-unsupported-state.png`

**检查点**：三语、Android 可用态、iPhone 不下载、桌面和手机 UI 状态都能独立验证。

---

## 阶段 6：打磨与跨切面

**目的**：完成跨故事质量门禁、契约校验、视觉证据、范围排除和安全边界检查。

- [ ] T051 运行 Go 格式化并修正输出，路径：`backend/internal/downloads/`、`backend/cmd/server/main.go`
- [ ] T052 运行后端单元测试并修正失败项，路径：`backend/go.mod`、`backend/internal/downloads/`
- [ ] T053 运行前端单元测试和构建并修正失败项，路径：`frontend/package.json`、`frontend/src/tests/`
- [ ] T054 运行 Playwright 端到端测试并保存双端截图，路径：`frontend/playwright/`、`specs/002-android-apk-download/visual-review/`
- [ ] T055 使用 `curl` 和 `shasum -a 256` 验证后端下载文件与当前 APK 一致，路径：`backend/downloads/android/BusIsComing.apk`、`backend/downloads/android/current.json`
- [ ] T056 运行 OpenAPI lint 和 bundle 并修正契约问题，路径：`shared/contracts/openapi/download-api.openapi.yaml`、`shared/contracts/download-api.openapi.yaml`
- [ ] T057 检查 DDD 依赖方向，确保 `domain` 不依赖 Gin、文件系统、HTTP 包、前端代码或共享契约，路径：`backend/internal/downloads/domain/`
- [ ] T058 检查前端 bundle 和 manifest 不暴露 Android 主项目本机来源路径，路径：`frontend/src/content/downloadManifest.ts`、`frontend/dist/`
- [ ] T059 复核页面文案没有新增完整路线规划、非香港巴士查询、iPhone 下载或历史版本浏览暗示，路径：`frontend/src/content/homepageContent.ts`、`frontend/src/content/sectionsContent.ts`
- [ ] T060 汇总验证命令、截图文件、OpenAPI 校验和 DDD 依赖检查结果，路径：`specs/002-android-apk-download/visual-review/README.md`

---

## 依赖与执行顺序

### 阶段依赖

1. **设置（阶段 1）**：无依赖，可以立即开始。
2. **基础设施（阶段 2）**：依赖设置完成；阻塞所有用户故事。
3. **用户故事 1（阶段 3）**：依赖基础设施完成；建议作为 MVP 先完成。
4. **用户故事 2（阶段 4）**：依赖基础设施完成；可在 US1 后实现，也可与 US3 并行处理不同文件。
5. **用户故事 3（阶段 5）**：依赖基础设施完成；前端文案和 UI 可与后端实现并行。
6. **打磨（阶段 6）**：依赖目标用户故事完成。

### 用户故事依赖

- **US1 下载 Android APK（P1）**：基础设施完成后即可开始，不依赖 US2 或 US3。
- **US2 管理当前 APK 文件（P2）**：依赖基础设施中的 APK 和元数据路径；不依赖前端 UI，可通过后端测试、文件检查和 curl 独立验证。
- **US3 理解下载状态与平台限制（P3）**：依赖共享 manifest 和 UI 状态契约；不依赖 US2 的维护文档，可通过前端测试和 Playwright 独立验证。

### 单个用户故事内部顺序

1. 先写测试或验证任务。
2. OpenAPI 和共享契约先于后端 handler 与前端调用。
3. 后端领域层先于应用层，应用层先于基础设施和接口适配层。
4. 前端类型和 manifest 先于组件渲染。
5. 视觉截图和 quickstart 记录在故事实现可运行后完成。

## 并行机会

- 阶段 1 中 `T004`、`T005`、`T006`、`T007` 可并行。
- 阶段 2 中 `T014`、`T015` 可与契约同步并行；`T012` 和 `T013` 需按顺序执行。
- US1 中 `T017`、`T018`、`T019`、`T020`、`T021` 可并行编写测试；实现按 `T022` → `T023` → `T024`/`T025` → `T026` → `T027` → `T028`/`T029` 推进。
- US2 中 `T032`、`T033`、`T034`、`T035` 可并行；`T037` 依赖 `T012` 和 `T013`。
- US3 中 `T040`、`T041`、`T042`、`T043` 可并行；`T044`、`T045`、`T046` 完成后可并行调整 `T047` 和 `T048`。

## 实施策略

### MVP 优先

1. 完成阶段 1 设置。
2. 完成阶段 2 基础设施。
3. 完成 US1 的测试、后端下载入口、前端下载入口和哈希验证。
4. 停止并独立验证 US1：`go test ./...`、Playwright 下载测试、`curl` + `shasum -a 256`。
5. 通过后再进入 US2 和 US3。

### 增量交付

1. 设置 + 基础设施：仓库有受管 APK、元数据和共享契约。
2. US1：用户可以真实下载当前 APK。
3. US2：维护者可以核对和替换当前 APK，失败状态可信。
4. US3：三语状态清楚，iPhone 不下载，双端截图可审查。
5. 打磨：统一运行后端、前端、OpenAPI、DDD、Playwright 和视觉证据检查。

## 备注

- `[P]` 表示任务修改不同文件或不依赖同阶段未完成任务，可以并行。
- `[US1]`、`[US2]`、`[US3]` 分别映射 `spec.md` 中的三个用户故事。
- 所有后端服务代码必须保持 DDD 依赖方向：`interfaces/infrastructure -> application -> domain`。
- 服务端 HTTP API 的权威契约是 `specs/002-android-apk-download/contracts/download-api.openapi.yaml`，实现阶段必须同步到 `shared/contracts/`。
- 当前 APK 只保留一个 `backend/downloads/android/BusIsComing.apk`，不增加用户可见历史版本列表。
