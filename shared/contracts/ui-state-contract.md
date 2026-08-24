# UI 状态契约：首页交互优化 v1.3.1

## 适用范围与权威

本契约覆盖公开三语首页的轻量品牌首行、五故事 Hero、下载分流、FAQ、Privacy 与跨语言/resize 状态保持。路线业务状态仍由 `route-query-ui-state.md` 约束。完整视觉以 Figma 基线 Section `119:64` 与 015 refinement Section `136:292` 共同为准；015 只修改明确批准的交互和局部布局，不重画 014 构图。

## 轻量品牌首行

- 首页不渲染独立 Header、导航占位、汉堡或语言 disclosure。
- 品牌首行处于 Hero 正常文档流，随页面自然划走，不 sticky。
- 左侧使用真实 `busiscoming-icon.webp` 与品牌名；右侧同时显示 `繁 · 简 · EN`。
- 三项语言均为真实本地化 URL，一次可达，当前项使用 `aria-current="page"`；目标至少 44×44 CSS px。
- Privacy 与 Footer 复用同一真实 App Logo；旧 BrandMark 不能作为公开页面主标识。

## 五故事状态机

固定顺序为 `route-search`、`saved-journeys`、`journey-guidance`、`cross-operator-arrivals`、`predeparture-monitor`。业务状态区分 `requestedStoryId` 与 `settledStoryId`，每次选择递增 `transitionEpoch`；旧 epoch 的 load、decode、transitionend 或 fallback 不得覆盖新选择。

- 首次 settled 后停留 10 秒；自动 settled 后 5 秒；手动选择、语言切换或暂停恢复后重新停留 10 秒。
- 同一时刻只有一个 dwell timer。hover、播放区 focus、页面不可见、Hero 离屏、视觉回归 pause 任一成立即暂停；原因全部清除后以 10 秒重新开始。
- 用户确认“不提供可见暂停按钮”；此限制必须在可访问性记录中如实说明。
- 点击故事按钮后，舞台立即移动，约 160ms 后文字跟随，约 820ms 进入 settled；fallback 只处理丢失事件。
- 自动切换不抢焦点且不触发 live region；最终手动 settled 只原子播报一次。
- reduced motion 立即交换，但保留 front/near/far 的静态远近层级。

每个 settled 帧必须恰有一个 front、两个 near、两个 far。背景图不可点击、不可聚焦、空 alt 且 `aria-hidden=true`；只有当前前景图提供本地化 alt。繁中与简中只使用 `zh` 资产，英文只使用 `en` 资产；目标语言图片失败时显示同尺寸目标语言失败壳，禁止跨语言回退。

## 下载入口

Hero 与下载区共享 `DownloadMetadataProvider`，下载状态仍为 `checking`、`ready`、`unavailable`。

- desktop（与 QR 一致，`min-width: 821px`）：Hero 主行动始终是无 `download` 属性的 `#download` 锚点。
- mobile：只有 ready 才渲染真实 APK href 与 `download`；checking/unavailable 不提供 href。
- 下载区行动、二维码和 mobile ready 行动必须收敛到同一个 metadata URL。
- 所有状态均不展示 `lastUpdated` 或静态日期；ready 只展示版本、Android 7.1+ 与本地化大小。
- 禁止 User-Agent 分流、远程/静态备用二维码、Blob 下载、伪进度、BUILD、SHA、sourcePath 或旧版本回退。

## 路线试查布局

手机端 origin/destination 输入面在左侧垂直排列，交换按钮位于右侧并相对两个真实输入面整体居中。候选列表、错误与已选状态不得改变按钮锚点；按钮至少 44×44，页面无横向滚动。`swapPlaces()`、request sequence、路线查询、ETA 与 retained 语义不变。

## 三语、响应式与视觉稳定

- 所有可见文案、alt、aria label、状态和失败壳覆盖 `zh-Hant`、`zh-Hans`、`en`。
- 切换语言不 reload、不以 locale key 重挂载，并保持当前故事、scroll/hash、路线输入与结果、下载状态、FAQ ID。
- resize/orientation 不重置上述状态，不通过 `transform: scale()` 整页缩放。
- 1440×960、390×844、320×844 与中间宽度无横向滚动；手机 9:16 前景四边完整，故事轨处于舞台下方正常文档流，不能覆盖截图。
- 视觉回归只在字体、目标 locale 图片及最新 epoch settled 后截图；`zh-Hant`/`en` 对照 Figma，`zh-Hans` 只作文本、溢出和几何验收。

## 风带、FAQ 与收尾

- Hero、Route、Download 使用白色/浅绿远近风带，只动画 transform、opacity、scale；reduced motion 下持续 animation 为 0。
- 禁止紫色色块、霓虹、深色底浪、固定潮汐和影响对比度的动画。
- FAQ 保持 Android 安装、数据覆盖、网站与 App 区别、iPhone 支持四项，同一时间最多展开一项。
- FAQ 后仍为联系横条和浅色 Footer；不新增营销屏。
