# UI 状态契约：Android APK 下载

## 适用范围

本契约覆盖首页首屏和下载区复用的下载分段按钮。实现可以调整内部组件代码，但不得改变这些用户可见状态和不变量。

## 下载分段按钮

| 状态 | 触发 | 展示 | 行为 |
|------|------|------|------|
| `default` | 初始、鼠标离开、失焦 | 一个整体按钮，左侧 Android，右侧 iPhone | 不自动下载 |
| `android-expanded` | hover Android、focus Android、触控选择 Android | Android 可下载面板，展示 `Android APK 1.0` 与约 `4.8 MB` | 点击进入 `/api/downloads/android/latest` |
| `iphone-expanded` | hover iPhone、focus iPhone、触控选择 iPhone | iPhone 暂未支持面板 | 不跳转、不下载、不伪装失败 |

## i18n 不变量

- `zh-Hant`、`zh-Hans` 和 `en` 必须展示同等平台状态。
- Android 可用态必须在三语中表达可下载、版本和大小。
- iPhone 暂未支持必须在三语中表达，且不得缺少不可下载原因。

## 双端不变量

- 桌面 1440px 和手机 390px 下，Android 下载入口可见可操作。
- 下载按钮展开态不得遮挡后续内容或造成不可理解的文字截断。
- 手机端触控 Android 后，用户应能再次点击同一展开态开始下载。

## 平台不变量

- Android 可下载状态必须使用同源路径 `/api/downloads/android/latest`。
- iPhone 的 `downloadUrl` 必须为 `null`。
- 切换语言不得把 Android 状态重置为不可用，也不得让 iPhone 变为可下载。

## 失败状态

- 若后端下载失败，前端不得把失败表现为 iPhone 或其他平台状态。
- 若需要展示用户可见失败提示，提示必须使用三语文案，并明确说明下载资源暂不可用或校验失败。

