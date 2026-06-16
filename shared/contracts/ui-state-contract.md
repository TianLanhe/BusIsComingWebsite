# UI 状态契约：首页下载入口

## 适用范围

本契约覆盖首页首屏主下载按钮和下载区备用入口。实现可以调整内部组件代码，但不得改变这些用户可见状态和不变量。

## 下载入口

| 状态 | 触发 | 展示 | 行为 |
|------|------|------|------|
| `android-ready` | 初始、hover、focus、触控 | Android APK 主按钮，展示 `Android APK 1.0` 与约 `4.8 MB` | 点击直接下载 `/api/downloads/android/latest` |
| `android-pending` | 下载区备用按钮触发 fetch 下载中 | 原位 loading 文案 | 不切换平台，不跳转页面 |
| `android-error` | 下载区备用下载失败 | 原位三语失败提示 | 不导向 iPhone 或其他平台 |
| `iphone-unavailable` | 页面展示 iPhone 状态 | 低权重状态文字 | 不跳转、不下载、不伪装失败 |

## i18n 不变量

- `zh-Hant`、`zh-Hans` 和 `en` 必须展示同等下载状态。
- Android 可用态必须在三语中表达可下载、版本和大小。
- iPhone 暂未支持必须在三语中表达，且不得渲染为可点击下载入口。

## 双端不变量

- 桌面 1440px 和手机 390px 下，Android 下载入口可见可操作。
- 下载按钮、APK 元信息和 iPhone 状态不得遮挡后续内容或造成不可理解的文字截断。
- 手机端触控 Android 后，应直接触发下载或保持在可再次触发的可用态。

## 平台不变量

- Android 可下载状态必须使用同源路径 `/api/downloads/android/latest`。
- iPhone 的 `downloadUrl` 必须为 `null`。
- 切换语言不得把 Android 状态重置为不可用，也不得让 iPhone 变为可下载。

## 失败状态

- 若后端下载失败，前端不得把失败表现为 iPhone 或其他平台状态。
- 若需要展示用户可见失败提示，提示必须使用三语文案，并明确说明下载资源暂不可用或校验失败。
