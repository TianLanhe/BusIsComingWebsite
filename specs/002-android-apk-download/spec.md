# 功能规格：Android APK 下载

**功能分支**：`main`

**创建日期**：2026-06-16

**状态**：Draft

**输入**：用户描述："实现 App 下载功能：用户在界面点击安卓 App 下载时，从服务端下载 APK 包。APK 文件在 `/Users/jianglijie/AndroidStudioProjects/BusIsComming/app/release/BusIsComing.apk`，将其复制到服务端空间方便进行管理。已确认：APK 纳入网站仓库管理；下载通过后端稳定入口提供；界面展示简短版本和大小；服务端空间只保留当前 APK。"

## Clarifications

### Session 2026-06-16

- Q: 服务端代码应采用什么架构组织原则？ → A: 服务端代码采用 DDD 目录组织结构，按照 DDD 规范和思想拆分服务端模块、实体、领域服务、应用服务、基础设施适配和接口适配边界。
- Q: 服务端 HTTP API 的接口文档应如何落地？ → A: 采用 OpenAPI 3.1 YAML 作为权威接口文档，Swagger UI/Redocly 仅用于本地预览、试接口、lint、bundle 和生成中文 API UI；文档需沉淀到 feature contracts 和共享契约。

## 用户场景与测试（必填）

### 用户故事 1 - 下载 Android APK（优先级：P1）

香港巴士通勤用户访问 BusIsComing 网站后，希望点击 Android 下载入口，直接获得当前可安装的 BusIsComing APK，而不是看到“资源待接入”或被引导到 Android 项目本机路径。

**优先级原因**：下载 App 是网站核心范围之一，也是第一版主页的主转化动作；没有真实下载会直接削弱主页可信度。

**独立测试**：在桌面或手机 viewport 打开首页，点击 Android 下载入口后，浏览器开始下载当前 BusIsComing APK；下载文件与来源 APK 的大小和 SHA-256 一致。

**验收场景**：

1. **给定** Android 下载状态可用，**当** 用户点击首屏 Android 下载入口，**则** 用户获得当前 BusIsComing APK 文件。
2. **给定** Android 下载状态可用，**当** 用户滚动到下载区并点击 Android 下载入口，**则** 用户获得同一个当前 BusIsComing APK 文件。
3. **给定** 用户使用手机浏览器访问，**当** 点击 Android 下载入口，**则** 下载入口仍可操作，并保持清楚的 Android APK 语义。

---

### 用户故事 2 - 管理当前 APK 文件（优先级：P2）

网站维护者需要把 Android 主项目产出的当前 APK 复制到网站服务端管理空间，并能确认网站实际提供的下载文件就是该 APK。当前功能只保留一个当前 APK 文件，不提供历史版本列表。

**优先级原因**：服务端可管理的 APK 来源是下载可信度和后续部署的基础；只保留当前文件可以降低首版管理复杂度。

**独立测试**：检查服务端管理空间存在当前 APK，元数据记录包含版本、大小、SHA-256、来源路径和更新时间；下载得到的文件与该记录一致。

**验收场景**：

1. **给定** Android 主项目存在当前 APK，**当** 维护者准备网站下载资源，**则** 当前 APK 被复制到网站服务端管理空间。
2. **给定** 网站服务端管理空间已有当前 APK，**当** 维护者核对下载元数据，**则** 可以看到版本 `1.0`、versionCode `1`、约 `4.8 MB`、SHA-256 和来源路径。
3. **给定** 后续需要发布新 APK，**当** 维护者替换当前 APK，**则** 网站仍通过同一个 Android 下载入口提供当前文件，不向用户暴露历史版本选择。

---

### 用户故事 3 - 理解下载状态与平台限制（优先级：P3）

潜在用户在点击前需要看懂 Android 当前可下载、iPhone 暂未支持，以及下载文件的大致版本和大小；三种语言用户都应获得一致信息。

**优先级原因**：清晰状态能降低安装疑虑，同时避免用户误以为 iPhone 也可以下载。

**独立测试**：切换 `zh-Hant`、`zh-Hans` 和 `en` 后，Android 显示可下载状态与简短元数据，iPhone 仍显示暂未支持且点击不触发下载。

**验收场景**：

1. **给定** 用户查看 Android 下载按钮，**当** 下载状态展开，**则** 用户看到 Android APK 可下载、版本 `1.0` 和约 `4.8 MB`。
2. **给定** 用户查看 iPhone 区域，**当** 悬停、聚焦或点击 iPhone 区域，**则** 页面显示暂未支持，且不会下载任何文件。
3. **给定** 用户切换任一支持语言，**当** 再次查看下载区域，**则** 平台状态、版本和大小信息仍完整可读。

---

### 边界情况

- 当服务端管理空间中的 APK 缺失或不可读取时，系统不得表现为下载成功，必须向用户展示清楚的不可用或失败状态。
- 当当前 APK 与记录的大小或 SHA-256 不一致时，系统必须阻止将其作为可信下载结果，并暴露可验证的失败原因。
- 当用户重复点击 Android 下载入口时，系统应始终提供同一个当前 APK，不产生多个不同版本的下载选择。
- 当用户点击 iPhone 区域时，系统不得跳转到 Android APK，也不得表现为失败下载；必须保持平台暂未支持。
- 当用户切换 `zh-Hant`、`zh-Hans`、`en` 时，当前页面结构、平台状态和下载入口必须保持一致，不因语言切换丢失上下文。
- 当用户期待完整出行路线规划、地铁、铁路、渡轮或其他非香港巴士查询时，下载功能不得扩展网站范围，只能继续服务 App 下载。
- 当用户在手机和电脑之间切换访问时，Android 下载主入口、iPhone 状态和简短元数据必须完整可见、可读、可操作。
- 当前端 UI 需要迭代时，后续阶段必须能从本规格定位 Figma 文件、下载按钮节点和下载状态说明。
- 当服务端下载 API 需要迭代时，后续阶段必须能从本规格定位 OpenAPI 文档、operationId、错误格式、共享契约沉淀位置和验证方式。

## 宪法对齐（必填）

- **产品来源**：Android 主项目 `/Users/jianglijie/AndroidStudioProjects/BusIsComming/AGENTS.md`、`README.md` 和当前 APK `/Users/jianglijie/AndroidStudioProjects/BusIsComming/app/release/BusIsComing.apk`。已读取 APK 元数据：App label `BusIsComing`、applicationId `com.example.busiscoming`、versionName `1.0`、versionCode `1`、大小 `5,009,547` bytes、SHA-256 `93e7930ee9e6b9cc05819bab895153ad985707bdcfff3e6bead60065acf07470`。
- **产品范围**：本功能服务“下载 App”核心范围，并增强首页下载主流程可信度；不改变软件功能介绍、在线查询静态演示、反馈或联系入口的优先级。
- **排除范围**：不提供完整出行路线规划，不提供地铁、铁路、渡轮或其他非香港巴士交通工具查询；不新增 iPhone 下载；不提供历史版本选择页面。
- **前后端边界**：前端负责展示下载状态、三语文案、桌面与手机交互，以及触发 Android 下载；后端负责管理当前 APK、提供稳定下载入口、返回当前文件并处理缺失或不可用状态；共享契约负责记录下载平台状态和 APK 元数据。后端代码必须采用 DDD 目录组织结构，按照领域层、应用层、基础设施层和接口适配层拆分模块，领域实体与领域服务不得依赖 HTTP 框架、文件系统实现或前端契约细节。具体接口路径和响应字段在计划阶段契约中固定。
- **API 文档**：服务端下载 API 必须以 `specs/002-android-apk-download/contracts/download-api.openapi.yaml` 作为 feature 阶段 OpenAPI 3.1 权威契约；文档必须记录无认证公开下载策略、无请求参数、`Cache-Control: no-store` 缓存策略、降级行为、错误示例和共享契约路径；实现阶段同步到 `shared/contracts/` 下的长期契约入口，并使用 Redocly CLI 或等价工具进行 lint/bundle，Swagger UI、Swagger Editor 或 Redocly 仅作为预览、试接口和生成中文 API UI 的工具。
- **三语范围**：新增或修改的用户可见文字包括 Android 可下载状态、版本与大小说明、下载失败或不可用提示、iPhone 暂未支持提示；必须覆盖 `zh-Hant`、`zh-Hans` 和 `en`。
- **UI 可视化**：本功能沿用首页 v1 已确认的下载按钮视觉和交互状态，不改变页面结构；后续计划和实现必须提供桌面与手机截图验证 Android 可下载状态。若计划阶段判断需要新增可用态标注，应更新或补充可视化 mock。
- **Figma 设计**：继续引用 [BusIsComing Website - Homepage v1 Spec](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU)。关键节点：`03 Download Button Interaction States`（node `4:326`）作为下载按钮 default、Android 展开、iPhone 展开状态基准；`01 Desktop Homepage / 1440`（node `4:2`）和 `02 Mobile Homepage / 390`（node `4:183`）作为双端布局基准。版本说明：本功能不重排 UI，只把 Android 状态从“待接入”更新为“可下载”并补充简短元数据。
- **双端适配**：桌面 1440px 和手机 390px 为主要验证基准；Android 下载入口、iPhone 暂未支持状态、版本和大小信息在两端都必须可见可操作，不得重叠、截断或横向溢出。
- **外部集成与降级**：本功能不接入 Citybus、DATA.GOV.HK 或其他实时交通服务；外部来源仅为 Android 主项目当前 APK。若 APK 文件缺失、不可读取或校验失败，网站必须展示可信降级状态，不得伪造可下载结果。
- **验证与提交**：规格质量 checklist 通过后执行必要的文件检查，并按项目规则自动提交本次 Spec Kit 产物；若工作区出现无关改动或提交范围不清晰，则先确认。

## 需求（必填）

### 功能需求

- **FR-001**：系统必须把 Android 下载入口从“资源待接入”更新为当前 APK 可下载状态。
- **FR-002**：用户必须能够从首屏下载入口和下载区入口获取同一个当前 BusIsComing APK。
- **FR-003**：系统必须从网站服务端管理空间提供 Android APK 下载，不得依赖浏览器访问 Android 主项目的本机文件路径。
- **FR-004**：系统必须把 `/Users/jianglijie/AndroidStudioProjects/BusIsComming/app/release/BusIsComing.apk` 复制为网站服务端管理的当前 APK，并纳入仓库管理。
- **FR-005**：系统必须只保留一个当前 APK 文件作为网站下载资源；后续新 APK 发布时替换当前文件，不向用户提供历史版本选择。
- **FR-006**：系统必须记录当前 APK 的可验证元数据，包括 App 名称、applicationId、versionName、versionCode、文件大小、SHA-256、来源路径和更新时间。
- **FR-007**：Android 下载可用态必须向用户展示简短元数据，至少包括 `Android APK 1.0` 和约 `4.8 MB`。
- **FR-008**：下载得到的 APK 必须与服务端管理空间中的当前 APK 在文件大小和 SHA-256 上一致。
- **FR-009**：当当前 APK 缺失、不可读取或元数据校验不一致时，系统不得提供成功下载，并必须展示清楚的不可用或失败状态。
- **FR-010**：iPhone 平台必须继续显示暂未支持状态；任何 iPhone 点击、聚焦或触控操作都不得触发 APK 下载。
- **FR-011**：所有新增或修改的用户可见下载文案必须覆盖 `zh-Hant`、`zh-Hans` 和 `en`。
- **FR-012**：下载按钮的 default、Android 展开、iPhone 展开状态必须保持现有 Figma 交互语义；Android 可用态不得造成周围布局跳动或遮挡内容。
- **FR-013**：页面必须在桌面和手机常见 viewport 下完整展示 Android 下载入口、iPhone 状态、版本和大小信息。
- **FR-014**：系统不得借下载功能新增完整出行路线规划、非香港巴士查询、iPhone 下载或历史版本浏览能力。
- **FR-015**：后端不得向浏览器泄露本机私有路径、密钥、内部 token 或可绕过下载服务边界的内部地址；来源路径只用于维护和验证记录。
- **FR-016**：后端模块必须按照 DDD 边界组织；当前 APK、下载校验和下载结果必须作为领域概念建模，HTTP 路由、文件读取和哈希计算必须作为接口或基础设施适配，不得进入领域实体内部。
- **FR-017**：服务端下载 API 的新增或修改必须同步维护 OpenAPI 3.1 YAML 文档；文档必须包含 endpoint、operationId、请求参数或无请求参数说明、认证策略、缓存要求、降级行为、响应头、成功响应、错误状态码、错误 schema、中文说明、示例和共享契约沉淀位置。

### 关键实体（涉及数据时填写）

- **当前 Android APK**：网站提供下载的唯一当前安装包。关键属性包括 App 名称、applicationId、versionName、versionCode、文件大小、SHA-256、来源路径、更新时间和当前可用状态。
- **下载平台状态**：Android 与 iPhone 的用户可见平台状态。Android 可为可下载或不可用；iPhone 在当前产品事实下始终为暂未支持。
- **下载结果**：用户点击下载后获得的文件或失败状态。成功结果必须对应当前 Android APK；失败结果必须有清楚原因，不得伪装成功。
- **后端领域模块**：围绕 APK 下载业务划分的服务端模块边界，至少区分领域概念、用例编排、基础设施适配和接口适配，确保下载规则可独立测试。
- **OpenAPI 接口文档**：描述下载 API 的权威接口契约。关键内容包括 endpoint、operationId、响应头、状态码、错误 schema、二进制响应类型、中文接口说明、示例、feature 文档路径和共享契约路径。

## 成功标准（必填）

### 可衡量结果

- **SC-001**：用户在桌面或手机首页中最多 2 次交互即可开始 Android APK 下载。
- **SC-002**：下载得到的 APK 与来源 APK 的 SHA-256 在 100% 验证中一致。
- **SC-003**：`zh-Hant`、`zh-Hans` 和 `en` 三种语言下，Android 可下载状态、版本、大小和 iPhone 暂未支持说明均完整可读。
- **SC-004**：iPhone 区域在 100% 交互测试中不触发 APK 下载。
- **SC-005**：桌面 1440px 和手机 390px 验证中，下载入口、平台状态、版本和大小信息没有重叠、不可理解截断或不可操作问题。
- **SC-006**：当当前 APK 缺失或校验失败时，用户能在 5 秒内看到清楚的不可用或失败状态，而不是空白页面或假成功下载。
- **SC-007**：维护者能在 2 分钟内从功能文档或共享契约中确认当前 APK 的版本、大小、SHA-256、来源路径和更新时间。
- **SC-008**：实现者能在 2 分钟内从功能文档定位下载 API 的 OpenAPI 文档、中文 API UI、operationId、认证与缓存要求、降级行为、错误格式、示例和共享契约沉淀位置。

## 假设

- 当前 APK `/Users/jianglijie/AndroidStudioProjects/BusIsComming/app/release/BusIsComing.apk` 是本次可发布的 Android 安装包。
- 当前功能只管理一个当前 APK 文件；后续版本发布时覆盖当前文件并更新元数据。
- Android 安装来源确认、浏览器下载提示和系统安全提示由用户设备处理，网站只负责提供可信下载和清楚说明。
- 现有首页 Figma 下载按钮交互结构继续适用；本功能只改变 Android 平台状态和相关文案。
- App 当前能力和平台事实以 Android 主项目文档与当前 APK 元数据为准。
- 服务端实现默认采用 DDD 分层；后续计划和任务必须显式列出领域层、应用层、基础设施层和接口适配层的职责与文件路径。
- 服务端下载 API 默认采用 OpenAPI 3.1 YAML 作为权威接口文档；Swagger UI、Swagger Editor、Redocly 或等价工具只作为预览、试接口、生成中文 API UI 和校验辅助。
