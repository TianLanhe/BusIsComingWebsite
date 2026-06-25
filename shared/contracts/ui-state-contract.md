# UI 状态契约：首页体验与下载入口

## 适用范围

本契约覆盖首页首屏功能轮播、品牌联系入口、首屏主下载按钮和下载区备用入口。实现可以调整内部组件代码，但不得改变这些用户可见状态和不变量。

## 功能轮播

| 状态 | 触发 | 展示 | 行为 |
|------|------|------|------|
| `carousel-auto` | 首屏进入且无交互 | 单一主手机截图，同场景后方截图以低旋转阶梯牌堆露出 | 约 3 秒切换 4 个功能页，10 秒内至少切换 2 次 |
| `carousel-paused` | hover、focus、drag、touch | 当前主图保持稳定 | 暂停自动切换，交互结束后恢复或保持可控状态 |
| `carousel-dragging` | 手机滑动或桌面拖动 | 相邻功能场景进入 | 只切换功能场景，不切换同场景截图；不显示底部缩略图、胶片条、图片按钮组或常驻箭头 |
| `carousel-deck-click` | 点击同场景后方牌堆图片 | 被点击图片切到主图，功能场景不变 | 仅露出的后方图片可切换同场景截图，主图点击不切换 |
| `carousel-dot-click` | 点击场景点点 | 对应功能场景进入 | 点点是可点击控件，不是纯装饰 |
| `carousel-keyboard` | 键盘方向键或读屏可访问按钮 | 视觉上不出现抢占式箭头 | 可切换上一项/下一项功能，并保留当前语言状态 |
| `carousel-reduced-motion` | `prefers-reduced-motion: reduce` | 关闭或弱化自动动画 | 保留手动滑动、拖动和键盘切换能力 |

### 轮播不变量

- `autoAdvanceMs` 必须为 `3000`。
- 自动切换只覆盖 `favorite-citybus-routes`、`route-comparison`、`eta-details`、`predeparture-monitor` 四个功能页。
- 视觉模式必须为 `stair-card-deck`：一个主手机截图 + 同场景后方截图低旋转阶梯牌堆。
- 后方牌堆图桌面约 5 度旋转，手机可收敛到约 4 度；后方图底部不得低于主图底部。
- 不得显示 `01`、`02`、`03`、`04` 等编号装饰。
- 不得显示底部缩略图堆叠、胶片条、缩略图按钮组、上下图片堆叠或传统常驻左右箭头。

## 品牌与联系入口

| 状态 | 触发 | 展示 | 行为 |
|------|------|------|------|
| `brand-logo-ready` | Header/footer 渲染 | Android foreground icon 裁出的透明巴士主体 | 不使用 lucide 线框巴士或 launcher 背景底板 |
| `contact-ready` | 导航/footer 渲染 | `聯絡我們 / 联系我们 / Contact Us` 和 `hezhenyu966@gmail.com` | 邮箱链接指向 `mailto:hezhenyu966@gmail.com` |

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
