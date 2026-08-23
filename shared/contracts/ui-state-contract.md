# UI 状态契约：首页视觉系统 v1.3.1

## 适用范围

本契约覆盖公开三语首页的 Header、五故事 Hero、共享下载入口、FAQ 和跨语言状态保持。路线试查的
业务状态继续由 `route-query-ui-state.md` 约束。Figma 最终 Section `119:64` 是视觉权威，
`specs/014-upgrade-homepage-visual-system/contracts/homepage-visual-system.contract.md` 是完整
feature 合同。

本版取代旧四故事、3 秒自动播放、`stair-card-deck`、拖拽、同故事画廊、lightbox、FeatureGrid
和功能证据标签。生产代码和测试不得同时保留两套模型。

## Header

- 桌面和手机必须同时显示品牌、功能、FAQ、联系和语言入口。
- 390px 不得退化为仅显示联系或汉堡菜单；320px 可视觉隐藏品牌文字，但保留可访问名称。
- 语言入口使用 disclosure，具备 `aria-expanded`、Escape 关闭和焦点恢复。
- 所有主要目标至少 `44×44 CSS px`，并提供可见 `:focus-visible`。

## 五故事 Hero

唯一状态源为 `activeStoryId`，固定顺序是：

1. `route-search`
2. `saved-journeys`
3. `journey-guidance`
4. `cross-operator-arrivals`
5. `predeparture-monitor`

状态必须在同一次 render 中同步标题、说明、前景截图、五个环形槽位、选中按钮和 live region。每次
恰有一个 `front`、两个 `near`、两个 `far`。后景不可点击、不可聚焦、空 alt 且
`aria-hidden=true`；只有前景图暴露三语 alt。

故事按钮显示 `01–05` 与本地化短标签，支持 pointer、touch、Arrow、Home、End。禁止 autoplay、
drag/swipe、lightbox 和隐藏上一页/下一页控件。连续快速选择以后最后一次选择必须胜出。

标准动效手机约 880ms、桌面约 520ms，使用 x/y/scale/rotate/opacity/blur/z-index 形成环形前后交换，
不得退化为平面队列或单纯淡入淡出。reduced motion 立即换槽，但保留静态远近层级。

## 风带

- Hero、Route、Download 使用 3–5 层白色/浅绿背景，强度逐段收敛；Support 静止。
- 周期分布在 10–22 秒，只动画 transform、opacity、scale，不动画布局。
- 所有风带层均为装饰，不能获取 pointer/focus，overscan 不得产生水平滚动。
- reduced motion 下持续 animation 数量必须为 0。
- 禁止紫色色块、霓虹、深色潮汐、固定底浪和影响文字对比度的动画。

## 下载入口

Hero 和 DownloadDecision 共用一个 `DownloadMetadataProvider`：

| 状态 | 主行动 | 信息 | 桌面 QR | 手机 QR |
| --- | --- | --- | --- | --- |
| `checking` | 不可操作、无 href | 检查中 | 无 | 无 |
| `ready` | 原生 `<a download>` | version、Android 7.1+、size、updated 同权重 | 有 | 无 |
| `unavailable` | 不可操作、无 href | 单一暂不可用说明 | 无 | 无 |

QR 值必须等于 `new URL(metadata.downloadUrl, window.location.origin).href`，与按钮最终 URL 相同，
不成为第二个焦点目标。禁止远程 QR、静态备用 QR、Blob 下载、虚假进度、BUILD、SHA、sourcePath
和陈旧版本回退。

DownloadDecision 首次进入约 50% viewport 时只触发一次 `data-converged=true`；离开重入和语言
切换均不重播。reduced motion 不观察、不触发，组件卸载清理 observer。

## FAQ 与收尾

- FAQ 恰有 Android 安装、数据覆盖、网站与 App 区别、iPhone 支持四项。
- 默认展开 `android-install`，同一时间最多一项；稳定 ID 在语言切换后保持。
- 原生 button 负责 `aria-expanded/aria-controls`，panel 负责 `aria-labelledby`，加减号仅装饰。
- FAQ 后依次是联系横条与浅色 SiteFooter；保留当前语言 Privacy 和返回顶部。
- 禁止独立 FAQ 卡片、深色页尾或新的营销屏。

## 三语、响应式与状态保持

- 所有可见文字、alt、aria label、状态和错误映射覆盖 `zh-Hant`、`zh-Hans`、`en`。
- 语言切换不得 reload 或以 locale key 重挂载首页；当前故事、hash/scroll、路线输入与有效结果、
  下载状态和 FAQ ID 均保持。
- 1440×960、390×844 和 320px 必须无横向滚动。手机截图四边完整、无硬件开孔，故事轨在正常文档
  流并位于舞台下方，不得覆盖截图。
- 首页总体定位是香港巴士路线规划与导航 App；符合条件的联营路线首程 ETA 不得扩写为完整跨营运商
  路线规划。
