# 研究记录：Android APK 下载

## 决策 1：新增最小 Go + Gin 后端服务

**Decision**：在 `backend/` 下新增 Go 1.26 + Gin 服务，第一条能力只提供 Android APK 下载。

**Rationale**：当前 `backend/README.md` 已将后续服务端技术栈定为 Go 1.26、Gin、MySQL；本机已有 `go1.26.3`。用户明确要求“从服务端下载 APK”，因此需要真实后端入口而不是仅改前端静态链接。数据库对当前单文件下载没有价值，暂不引入。

**Alternatives considered**：

- 静态文件直链：实现最少，但无法体现服务端边界，也难以统一校验和错误状态。
- Node/Express：能工作，但偏离项目已记录的后端技术方向。
- Go 标准库不使用 Gin：依赖更少，但与项目后续 Gin 规划不一致。

## 决策 2：服务端空间只保留当前 APK

**Decision**：使用 `backend/downloads/android/BusIsComing.apk` 作为当前 APK 文件，配套 `backend/downloads/android/current.json` 记录元数据；新版本发布时替换当前文件和元数据。

**Rationale**：用户已确认“使用 A”，即只保留当前 APK，不做版本化文件归档。该设计降低首版管理复杂度，同时仍通过元数据记录版本、大小、SHA-256 和来源路径。

**Alternatives considered**：

- `BusIsComing-1.0-1.apk` 版本化文件：可追溯性更强，但用户明确选择不保留版本化文件。
- 对象存储或独立制品库：更适合多版本和大规模发布，但当前仓库内管理更直接。

## 决策 3：稳定下载入口为 `/api/downloads/android/latest`

**Decision**：后端提供 `GET /api/downloads/android/latest`，成功时返回 APK 附件；失败时返回统一 JSON 错误。

**Rationale**：该路径表达“Android 当前版本下载”，前端无需知道后端文件路径，也不会暴露本机来源路径。将来若切换文件位置或引入发布流水线，浏览器侧路径可以保持稳定。

**Alternatives considered**：

- `/downloads/android/BusIsComing.apk`：直观但更像静态资源路径，错误和校验能力弱。
- `/api/downloads/manifest` + 跳转：灵活但当前只有一个下载资源，流程偏重。

## 决策 4：下载前校验文件大小和 SHA-256

**Decision**：后端在返回 APK 前读取 `current.json`，检查文件存在、大小和 SHA-256；校验通过才返回文件。当前 APK 约 4.8 MB，请求时计算 SHA-256 可接受。

**Rationale**：规格要求下载文件与来源 APK 在大小和 SHA-256 上一致。请求时校验能防止受管文件被误替换或损坏后仍被成功下载；当前文件体量小，不需要缓存复杂性。

**Alternatives considered**：

- 只依赖人工校验：风险高，无法覆盖误操作。
- 启动时校验并缓存结果：性能更好，但替换 APK 后需要重启才能重新读取，不适合本地管理流程。
- 每次只校验大小：速度快但不能发现内容替换。

## 决策 5：前端 manifest 使用同源下载 URL

**Decision**：前端下载 manifest 将 Android 状态改为 `available`，`downloadUrl` 使用 `/api/downloads/android/latest`，文案展示 `Android APK 1.0` 和约 `4.8 MB`。

**Rationale**：同源 URL 适合本地开发和生产部署，避免暴露内部域名。Vite 开发环境通过 `/api` proxy 转发到 Go 后端；生产环境由部署层把同一路径路由到后端服务。

**Alternatives considered**：

- 写死 `http://127.0.0.1:8080/...`：本地可用但不适合生产和移动设备。
- 构建时注入绝对 API 域名：更灵活，但首版没有多环境配置需求。

## 决策 6：UI 不重排，沿用 Figma 下载按钮状态

**Decision**：不新增页面结构或新组件形态；只更新 Android 可用态、版本大小文案、下载失败提示和测试截图。

**Rationale**：首页 v1 的 Figma 已覆盖下载按钮 default、Android 展开和 iPhone 展开语义。本功能不改变交互模型，只改变 Android 从待接入到可下载。

**Alternatives considered**：

- 新增完整下载详情卡：信息更完整，但会扩大 UI 变更和 Figma 工作量。
- 展示完整 SHA-256：对维护者有用，但对普通用户过重；完整哈希保留在契约和元数据中。

## 决策 7：验证以自动化为主，截图为 UI 证据

**Decision**：实现阶段必须覆盖 Go 单元测试、前端内容/组件测试、Playwright 下载测试、curl 下载校验和双端截图。

**Rationale**：本功能同时涉及后端文件、前端状态、i18n 和浏览器下载行为，单一测试层无法覆盖全部风险。截图满足项目 UI 可视化评审要求。

**Alternatives considered**：

- 只跑前端测试：不能验证 APK 是否真实可下载。
- 只用 curl：不能验证用户界面、i18n 和 iPhone 不下载。

