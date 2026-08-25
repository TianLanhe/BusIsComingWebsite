# UI 合同：首页故事与核心入口优化

## 1. 权威与取代关系

本合同是 014 首页视觉系统的批准增量。视觉基础继续来自 Figma `119:64`、桌面 `119:176`、手机 `119:461`；015 新 refinement Section 建立后成为本轮几何与交互状态的直接视觉权威。

本合同取代 014/长期 UI 合同中的以下条款：独立 Header、语言 disclosure、禁止 autoplay、单语言截图、Hero 双端都直接下载、展示更新时间、旧手机交换按钮位置。未明确修改的四段结构、路线业务状态、下载 Provider、二维码、FAQ、风带和页尾继续有效。

## 2. 页面 Chrome 合同

### 2.1 首页

- 不渲染独立 Header、功能/FAQ/联系导航或吸顶占位。
- Hero 首行左侧显示真实 App Logo 与 `BusIsComing`，右侧同时显示 `繁 · 简 · EN`。
- 首行位于正常文档流，向下滚动时自然离开 viewport。
- 三个语言目标一次可达、无外框/底板/下拉箭头，当前语言用颜色、字重和下划线区分；每项命中区至少 44×44。
- `#features` 等历史深链可继续落到 Hero，但不能恢复 Header。

### 2.2 Privacy

- 不渲染首页 Hero 首行或功能导航。
- 页面顶部使用真实 App Logo、品牌名和本地化“返回首页”入口。
- 入口非吸顶并指向当前语言首页。

### 2.3 公开页尾

- 品牌图与 Hero/Privacy 使用同一真实 App Logo。
- FAQ、Privacy、返回顶部和联系从 support content 读取，不依赖已删除的 Header items。

## 3. 语言与状态保持合同

- 支持 `zh-Hant`、`zh-Hans`、`en`；语言项有真实本地化 URL，脚本增强不得破坏无脚本链接语义。
- 切换语言不 reload、不以 locale key 重挂载首页。
- 保持当前 story ID、滚动/hash、路线输入/选择/仍有效结果、下载 metadata 状态和 FAQ ID。
- 语言变化后当前故事等待目标截图稳定，并重新开始 10 秒阅读周期。
- 三语可见/alt/aria/error 文本进入集中内容系统并独立审校。

## 4. 五故事轮播合同

### 4.1 顺序与唯一状态

固定顺序：`route-search → saved-journeys → journey-guidance → cross-operator-arrivals → predeparture-monitor → route-search`。

`requestedStoryId` 同时决定标题目标、说明目标、前景截图目标、五槽位与故事按钮选中态。每次稳定状态恰有一个 front；不得出现标题/截图错配、两个 active 或第二套自动 index。

### 4.2 时间

| 起点 | 下一自动切换 |
| --- | --- |
| 首次稳定 | 10 秒 |
| 自动切换稳定 | 5 秒 |
| 手动选择不同故事稳定 | 10 秒 |
| 点击当前故事 | 不重播，立即重置 10 秒 |
| 语言截图稳定 | 10 秒 |
| 最后一个暂停原因解除 | 10 秒 |

时间从最新转场 settled 后开始，主转场不计入 dwell。任一时刻最多一个 dwell timer。

### 4.3 暂停

以下任一条件存在时不自动前进：

- pointer hover；
- 键盘输入模态的 focus-within；
- 归一化可见比例低于约 50%；
- document hidden；
- reduced motion；
- 视觉测试确定性暂停。

暂停只取消 dwell，不冻结已开始的最新转场。多个原因必须全部解除才可恢复。reduced motion 持续存在时不创建自动 timer。

### 4.4 无显式暂停按钮

页面不得显示暂停/播放控件。验收必须明确触屏用户缺少永久停止 autoplay 的显式操作，可能低于 WCAG 2.2.2 严格解释；上下文暂停不构成完整替代。

## 5. 转场合同

- 主舞台先换位；约 160ms 后旧标题/说明上移淡出，新文案从下方进入。
- 完整主舞台约 820ms，使用克制自然减速，无明显回弹；桌面与手机遵循同一叙事顺序。
- 只动画 transform、opacity 和轻量 blur，不动画布局尺寸。
- 目标前景 transform 与目标语言图片 load/decode 或稳定失败壳均完成后才 settled。
- `transitionend` 为主完成信号，可失效 fallback 只处理丢失；所有完成信号携带 epoch。
- 快速选择时陈旧 epoch 不得 settled、播报或启动 dwell；最后一次选择胜出。
- reduced motion 取消 autoplay、环形大位移、文字滑动和 blur，直接稳定交换。

## 6. 辅助技术合同

- 自动切换不移动焦点、不更新 live region。
- 手动选择只在最终目标 settled 后播报一次目标标题/说明。
- 点击当前故事不重复播报，语言切换不额外播报故事。
- 后景图 `aria-hidden=true`、空 alt、不可点击/聚焦；只有前景暴露当前语言 alt。
- 故事按钮继续支持 pointer/touch、Arrow、Home、End 和 roving tabindex。

## 7. 本地化截图合同

- 五故事各有 `zh`、`en` variant；繁体/简体映射 `zh`，英文映射 `en`。
- 10 张获批 raw 源中故事 01–04 为 1080×2172，故事 05 锁屏图为 1080×2400；每个 variant 顶部对齐等比生成 540×1086、720×1448、1080×2172 WebP，禁止非等比拉伸。故事 05 只裁去底部多余区域且不得使用监控设置页。
- 文件命名固定 `{storyId}-{variant}-{width}.webp`，manifest 记录 repo-relative path、字节数与 SHA。
- 切换语言保持 1080:2172 舞台和槽位，不闪白、不压扁、不 layout shift。
- 目标 variant 失败显示目标语言 alt 的同尺寸失败壳，禁止跨语言回退。
- 运行时、manifest、文档、错误与 build 不含一次性源目录绝对路径。

## 8. 下载合同

| 条件 | Hero 主行动 | 第三屏 | 二维码 |
| --- | --- | --- | --- |
| desktop 任意 metadata 状态 | `#download` 页面内入口，无 download 属性 | 显示真实 checking/ready/unavailable | 仅 ready 显示 |
| mobile ready | 真实 APK href + download filename | 保留真实下载 | 不显示 |
| mobile checking/unavailable | 不可操作、无 href | 受控状态 | 不显示 |

- desktop/mobile 使用与 QR 相同的 viewport 语义，不使用 User-Agent。
- 第三屏下载、QR 与 mobile Hero ready 链接最终解析到同一 metadata URL。
- reduced motion 下 desktop 使用即时锚点滚动。
- Hero 和第三屏只显示 version、Android 7.1+、localized size；不得显示 metadata lastUpdated 或静态日期。
- metadata 不可用时不得提供伪造/陈旧 href、QR、进度或安装完成状态。

## 9. 手机路线试查合同

- 手机输入组两列：左列 origin/destination field stack，右列 44×44 swap control。
- swap 的垂直中心由两个 input surface 决定，不受错误文案或候选列表高度影响。
- listbox 继续锚定对应 field；swap 不得覆盖 input、错误、候选或焦点环。
- 320×844 仍保留可用输入宽度且无横向滚动。
- `swapPlaces()`、request sequence、route query version、ETA、retained/error 语义不变。
- 桌面可保留既有纵向 origin/swap/destination 顺序。

## 10. 响应式与视觉合同

- 精确基准：1440×960、390×844；保护基准：320×844。
- 使用流式 token、clamp、百分比、grid/flex 与 max-width；禁止整页 transform scale。
- 删除旧 Header 高度补偿、负 anchor offset 与固定 scroll margin。
- 标题、CTA、手机舞台、辅助说明和故事轨连续调整；正文、焦点环和 44×44 命中区不得被缩小。
- 截图和手机框固定为 1080:2172 修长比例；图片必须顶部对齐等比覆盖内屏，在所有批准 viewport 和五个故事中均不得露出上下底色；手机边框四边完整、无硬件开孔，故事轨不得覆盖截图。
- 超宽屏限制内容最大宽度，不能无限拉开 copy/stage。
- resize/orientation 不重置故事、locale、路线、下载或 FAQ，也不创建额外 timer。

## 11. Figma 和视觉门禁

生产 UI 修改前必须完成 015 FINAL refinement Section，并在 `figma.md` 记录真实节点：

- desktop 1440、mobile 390、narrow 320；
- 中文/英文 Story 01；
- start/160ms/settled；
- mobile route default/candidate/error；
- desktop Hero→Download 与 mobile direct download；
- 无日期 metadata；
- Privacy brand/back。

像素级 Figma reference 只覆盖 `zh-Hant` 与 `en`。`zh-Hans` 共用获批中文截图，必须在真实浏览器中验证文本完整性、溢出、横向滚动、触控目标和关键几何，但不得把这些结果表述为像素级 Figma 对照。

Reference export/manifest 必须包含 node ID、viewport、locale variant、state、导出方式/日期、尺寸、repo-relative path 和 SHA。没有真实节点或 export 时不得改生产 UI。

实现后生成 actual、side-by-side、overlay、diff；标题分行、真实 Logo、完整手机四边、语言命中区、环形远近、CTA 语义、无日期、无横向滚动和 reduced motion 是零容忍项，不能被全图阈值豁免。

## 12. 明确不变

- 四段页面顺序、五故事产品文案、路线结果卡合同、FAQ、风带与浅色页尾；
- 路线/下载 API、OpenAPI、后端、缓存、错误与日志；
- 除本合同明确规定的 desktop Hero → `#download`、mobile ready → APK 入口分流外，下载资料来源、最终安装包目标与第三屏下载逻辑；
- DownloadMetadataProvider 单请求、无陈旧回退；
- monitoring UI 与 Android App；
- 生产运行时不读取 Figma、本机源目录或 Android 工程。
