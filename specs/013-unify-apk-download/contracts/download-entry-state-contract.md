# 契约：主页 Android 下载入口状态

## 1. 适用范围

本契约覆盖精确三语主页中的两个 Android 下载入口：

- 页面顶部 Hero 主下载入口；
- 页面中下部 Download Section 下载入口。

二者可以采用不同布局样式，但必须共享状态、下载目标和元素语义。

## 2. HTTP 依赖

| 操作 | 用途 | 结构变更 |
|------|------|----------|
| `getLatestAndroidApkMetadata` | 页面挂载时检查当前 APK 可用性并取得展示资料 | 无 |
| `downloadLatestAndroidApk` | 用户点击可用入口后由浏览器直接下载 APK | 无 |

权威 OpenAPI 仍为
`specs/010-website-analytics/contracts/download-api.openapi.yaml`。本功能不新增 path、method、
schema、header 或错误码。

## 3. 状态映射

| 元数据结果 | UI 状态 | 顶部入口 | 中下部入口 | APK 请求 |
|------------|---------|----------|------------|----------|
| 请求未完成 | `checking` | 不可操作 | 不可操作 | 禁止 |
| 合法 `200 available` | `ready` | 原生链接 | 原生链接 | 点击后允许 |
| `404` | `unavailable` | 不可操作 | 不可操作 | 禁止 |
| `500` | `unavailable` | 不可操作 | 不可操作 | 禁止 |
| 网络/超时/JSON/字段校验失败 | `unavailable` | 不可操作 | 不可操作 | 禁止 |

## 4. 可用入口

两处 ready 入口必须同时满足：

- `href` 等于已校验元数据中的稳定下载地址；
- `download` 等于已校验元数据中的安全 basename 文件名；
- 用户点击后由浏览器处理导航、附件响应和落盘；
- 具有可见键盘焦点；
- 主要操作区域不小于 44×44px；
- 可见文案包含当前语言的下载动作、版本和格式化大小。

## 5. 不可操作入口

checking/unavailable 必须：

- 不包含 APK `href`；
- 不响应点击、Enter 或 Space 发起下载；
- 通过原生 `disabled` 或等价 `aria-disabled` 语义告知辅助技术；
- 保持与 ready 状态近似尺寸，避免页面布局跳动；
- 两处同步，不允许一个可用、另一个不可用。

## 6. 禁止行为

前端不得：

- 对 APK 下载地址执行 JavaScript `fetch`；
- 调用 `response.blob()` 读取完整 APK；
- 为 APK 创建 `blob:`/object URL；
- 创建临时节点并合成点击；
- 展示页面内下载百分比；
- 把元数据成功、HTTP 200 或响应开始解释为浏览器下载/安装完成；
- 在元数据失败后回退静态版本、大小、文件名或可点击入口。

## 7. 三语与 iPhone

- checking、ready、unavailable 覆盖 `zh-Hant`、`zh-Hans`、`en`。
- `zh-Hant` 使用香港产品表达，`en` 使用自然克制短句。
- iPhone 状态保持只读、不可下载，不受 Android 状态切换影响。

## 8. 缓存与重试

- metadata 和 APK 继续遵循既有 `Cache-Control: no-store`。
- 每个 `document` 最多一次 metadata 请求。
- 本次页面生命周期不自动或手动重试 metadata。
- 语言切换不得触发新请求。

## 9. OpenAPI 文案校正

实现阶段必须在权威 OpenAPI 和同步副本中：

- 删除“元数据失败不得禁用稳定下载入口”的旧客户端约束；
- 明确元数据响应用于主页下载入口的可用性门禁与展示；
- 明确 APK 下载仍是独立请求，metadata 成功不保证最终下载成功；
- 保持项目可控标题、摘要、参数、响应、错误和示例说明为中文。

## 10. 验证判定

契约通过需要同时满足：

- Vitest 覆盖三态、两处入口和不使用 Blob；
- Playwright 在 1440/390 验证 ready 下载文件名、大小、SHA-256；
- Playwright 在 metadata 非可用结果下证明 APK 请求数为 0；
- DOM 中 ready 的两处入口无 `blob:`；
- 真实 Android Chrome 从中下部入口完成下载，不再出现页面 99% 状态。
