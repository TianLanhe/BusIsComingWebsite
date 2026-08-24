# BusIsComing 首页视觉系统 014 优化设计

日期：2026-08-25

状态：设计讨论已完成，首屏轮播、语言入口、导航删除、双语截图、下载行为、路线试查手机布局和响应式策略均已获用户确认；实现前仍须把本增量同步到 Figma 并记录新节点。

取代范围：本文件是 `2026-08-21-homepage-visual-system-v131-design.md` 的批准增量。两者冲突时，本文件取代旧文件中第 3 节阅读顺序、第 5 节 Hero、第 7 节下载资料、第 9 节导航与三语、第 11 节 Header 合同和第 12 节对应 Figma 状态；未明确修改的四段信息架构、风带、路线结果、下载二维码、FAQ 与浅色页尾合同继续有效。

## 1. 目标与边界

本轮继续保持“有空气流动的安静工具”方向，不重做已经批准的整页结构。目标是：

1. 让五个首屏故事在用户没有操作时自动展示，同时给主动阅读保留更长停留时间；
2. 删除低价值导航，不再为几个锚点预留固定顶部区域；
3. 让语言切换保持直接、浅层和低占用，并同步切换真实 App 截图；
4. 校正中文与英文截图、真实 App Logo、下载日期和移动端起终点切换布局；
5. 让桌面和手机随 viewport 保持相同比例关系，而不是压扁或机械缩放整个页面。

本轮是纯前端变更：不修改后端、下载 metadata API、路线 API 或共享 OpenAPI。路线请求、候选、ETA 合并、错误映射、下载 URL 与二维码数据源继续使用当前实现。

## 2. 已批准决策摘要

- 首页删除独立 Header；真实 App Logo、品牌名和三语直达入口成为 Hero 内部首行，随页面自然划走，不吸顶。
- 语言入口固定为无容器文字切换：`繁 · 简 · EN`。三项始终可见、一次点击完成，不使用 disclosure、下拉菜单、边缘浮签或首访弹层。
- 首次自动切换等待 10 秒；之后每次自动切换在转场结束后等待 5 秒。
- 用户手动点击任一故事后重新等待 10 秒，再恢复每 5 秒自动切换；点击当前故事也视为重新开始阅读。
- 语言切换保持当前故事，并按一次主动阅读操作重新等待 10 秒。
- 手机舞台先开始环形换位，约 160ms 后标题和说明跟进；不使用同步溶解或明显回弹。
- 不显示暂停／播放按钮；保留悬停、键盘聚焦、viewport、后台标签页和 reduced-motion 自动暂停保护。
- 桌面首屏下载行动跳到第三屏；手机首屏保持直接下载 APK。
- 手机路线试查把起终点切换按钮放到两个输入框右侧，不再单独占据一行。
- `zh-Hant` 与 `zh-Hans` 共用中文截图，`en` 使用英文截图。
- 首页和下载区都不展示 APK 更新日期。
- 采用流式响应式比例，不对整页使用 `transform: scale()`。

## 3. Hero 顶部与语言入口

### 3.1 首页顶部

首页不渲染现有 `Header` 布局。Hero 首行只保留：

- 左侧真实 App Logo 与 `BusIsComing` 品牌名；
- 右侧 `繁 · 简 · EN` 三项直接语言操作。

首行没有横向分隔线、固定背景、功能导航或吸顶行为。它使用 Hero 的正常文档流和顶部安全间距，向下滚动时与首屏一起离开 viewport。

品牌图使用现有受管真实素材 `frontend/src/assets/brand/busiscoming-icon.webp`，基准尺寸为 192×192，SHA-256 为 `7792487ed26a317e248af26dd4b085507d1797a7448856f09ae18e062a478bf6`。当前抽象竖条 `BrandMark` 不再用于公开首页品牌入口；隐私页也改用同一真实 Logo。

### 3.2 语言切换

三项语言操作视觉上只显示短文本和中点分隔，不显示外框、底色或下拉箭头。当前语言使用颜色、字重和下划线区分；每项实际命中区仍至少为 44×44 CSS px。

切换继续复用当前 i18n Provider 和 history 路径更新，不整页 reload，并保留：

- 当前故事 ID；
- 路线输入、选择和已显示结果；
- 下载 metadata Provider 状态；
- FAQ 展开 ID；
- 当前 hash 与页面位置语义。

三语入口只在 Hero 首行显示，不在滚动过程中固定。SupportEnding 页尾仍可保留三语文本入口作为回访兜底，但它不是首屏切换的第二层菜单。

### 3.3 隐私政策页

隐私政策页不使用首页 Hero 首行，也不保留功能导航。页面顶部使用轻量、非吸顶的真实 Logo、品牌名与“返回首页”入口，让从外部链接进入的用户有明确返回路径。

## 4. 五故事自动轮播状态机

### 4.1 单一状态源

`activeStoryId` 仍是标题、说明、截图槽位、故事按钮和可访问状态的唯一业务状态。自动轮播不能维护第二套 active index，也不能直接操作 DOM 顺序。

新增聚焦的轮播控制单元，接收故事顺序、当前可见性、交互暂停原因、reduced-motion 和转场完成信号，输出：

- `selectStory(storyId, origin)`；
- `advanceStory()`；
- 当前变更来源 `manual | automatic | locale`；
- 下一次停留类型 `reading | cadence`；
- 转场结束后的下一计时点。

### 4.2 时间合同

| 事件 | 行为 | 下一次自动切换 |
| --- | --- | --- |
| Hero 首次进入并可见 | 显示故事 01 | 转场稳定后 10 秒 |
| 自动切换完成 | 显示下一故事，05 后回到 01 | 转场稳定后 5 秒 |
| 用户点击不同故事 | 立即发起目标故事转场 | 转场稳定后 10 秒 |
| 用户点击当前故事 | 不重启动画，只重置阅读周期 | 10 秒 |
| 用户切换语言 | 保留故事 ID，更新文案与同故事截图 | 新语言截图稳定后 10 秒 |
| hover 或 focus-within | 暂停并取消当前待触发 timer | 解除后重新等待 10 秒 |
| Hero 可见面积低于约 50% | 暂停并取消 timer | 恢复到至少约 50% 后等待 10 秒 |
| `document.hidden` | 暂停并取消 timer | 页面重新可见后等待 10 秒 |
| `prefers-reduced-motion: reduce` | 不创建自动轮播 timer | 只允许手动即时切换 |

计时从主转场完成后开始，不把约 820ms 的舞台移动算入 5 秒或 10 秒停留。所有分支最多只允许一个 dwell timer 和一个转场保护 timer；连续快速操作时旧 timer 必须失效。

### 4.3 无可见暂停按钮的边界

用户明确拒绝增加暂停／播放按钮，因此顶部和故事轨都不出现此控件。实现仍须保留 hover、focus、viewport、visibility 和 reduced-motion 自动暂停。

该选择无法提供一个在触屏上永久停止轮播的显式控件，可能低于 WCAG 2.2.2 对持续自动更新内容的最严格解释。实现和验收记录必须如实标注该限制，不能把上下文自动暂停描述成完整的显式暂停能力。

自动切换不得抢焦点，也不得触发读屏 live region 反复播报。只有用户手动选择故事时才更新礼貌播报文本；自动切换只更新视觉选择状态。

## 5. 文字与手机舞台转场

采用已选方案 A“舞台先行，文字后随”：

1. 目标手机从后方环形槽位向前移动，当前手机同步退往后方；
2. 约 160ms 后，旧标题和说明向上移动约 8–10px 并淡出；
3. 新标题和说明从下方约 12–14px 进入并恢复不透明；
4. 桌面辅助说明与主文案使用同一 change epoch，不能晚一个 render；
5. 故事轨的选中态在用户操作时立即反馈，但不抢先替换标题内容。

手机舞台主转场约 820ms，使用克制的 `cubic-bezier(.22,1,.36,1)`；文字出场约 220ms，进场约 420ms。动画只改变 `transform`、`opacity` 和小范围后景 blur，不动画布局尺寸。非相邻故事点击继续使用五槽位环形重排，最后一次选择胜出。

reduced-motion 下取消自动轮播、环形位移、文字滑动和 blur 变化，直接交换静态层级和文案。

## 6. 下载行动与日期

### 6.1 首屏行动

首屏继续保留相同的两个行动及视觉顺序：

1. 下载 Android App；
2. 路线试查。

下载行动消费同一真实 APK URL：

- 桌面：阻止直接文件导航，平滑滚动至第三屏 `DownloadDecision`，把二维码和下载资料带入视野；
- 手机：保持原生 APK 下载链接和下载文件名，不增加中间确认弹层；
- reduced-motion：桌面使用即时锚点跳转，不执行平滑滚动。

路线试查两端都跳到第二屏。

### 6.2 下载资料

首页 Hero metadata line 和第三屏 Download metadata line 都删除日期。用户可见资料只保留：

- 动态版本号；
- 静态最低要求 Android 7.1+；
- 动态、本地化安装包大小。

前端可以继续接收 metadata 中的更新时间字段，但不得渲染该字段，也不得用固定 `18/08/2026` 或其他日期替代。二维码、桌面第三屏下载链接和手机直接下载链接继续解析自同一 `metadata.downloadUrl`。

## 7. 本地化截图合同

### 7.1 源素材映射

两套获批源图均为 1080×1920。导入时按以下固定映射校验文件名、尺寸与 SHA-256：

| 故事 ID | 中文源图 | 中文 SHA-256 | 英文源图 | 英文 SHA-256 |
| --- | --- | --- | --- | --- |
| `route-search` | `01-search-freely.png` | `b3234b875dcb682e042cab173b831b23e9aa66f0b434f6d67d59e9d37146d8ce` | `01-search-freely-en.png` | `7c68e28ee80060e22fd8cf05a14c40cb750e85593b6156277a103467126e11c2` |
| `saved-journeys` | `02-saved-journey.png` | `c2a1555fb593e64712cb6173c88097d562b9935e625227fa144f3e9227a2c0a6` | `02-saved-journey-en.png` | `25d47c68b61afdd9a1738f082899493f7e9599c369a92dff72f1f0de967e2fb2` |
| `journey-guidance` | `03-route-detail.png` | `cba019119377be69dcf75f99a1f21aa0002dad7bc60a896d049b6e2bef64df58` | `03-route-detail-en.png` | `5d3aea154a443dfa09267409939a14e074a03a80c7fdd654e9687b412b651a95` |
| `cross-operator-arrivals` | `04-cross-operator-arrivals.png` | `b479882ff58f2ffd573968d79f34553a8a8d852ba5d1e40576f929b7d8c63e87` | `04-cross-operator-arrivals-en.png` | `42d211fb8c27a5193ba0871e74c5185ad2fbc6cd07cc5655b33540a08655c001` |
| `predeparture-monitor` | `05-monitor-reminder.png` | `f9099ff1543636689efd5e15b59d17149cb8f547956b47287525370c5ac52dac` | `05-monitor-reminder-en.png` | `c035484e1deb8556e9d36dd53fa1f63d50f51c4617a56f1c9049d6451a0cd100` |

用户提供的临时目录只是一次性导入源，不进入运行时、manifest、文档或构建产物。

### 7.2 衍生资源与运行映射

每套五图分别生成 540、720、1080 宽 WebP，共 30 个衍生文件。文件名必须包含语言集以避免碰撞，例如：

- `route-search-zh-540.webp`；
- `route-search-en-540.webp`。

manifest 升级为按故事保存 `zh` 与 `en` 两个 locale variant；每个 variant 记录源尺寸、源 SHA、三个衍生尺寸、字节数和衍生 SHA。`zh-Hant`、`zh-Hans` 映射到 `zh`，`en` 映射到 `en`。

Hero 五张手机仍常驻 DOM，但只使用当前 locale variant。切换语言时保持固定手机宽高和槽位，通过图片 decode 与稳定失败 shell 避免闪白、拉伸和 layout shift；加载失败不得回退到另一语言截图。

## 8. 响应式构图

响应式继续以桌面 1440×960 和手机 390×844 为批准基准，以 320×844 为窄屏保护。实现不使用整页 `transform: scale()`，而使用共享流式 token、`clamp()`、grid 和 container/max-width 规则共同缩放：

- 标题、主要间距、手机舞台、辅助说明和故事轨在各自 min/max 内保持同一比例趋势；
- 正文和 metadata 保持可读下限；
- 所有交互目标不小于 44×44；
- 截图按 1080×1920 固有比例显示，手机外壳不得压扁或裁边；
- 390×844 继续在首个主要 viewport 内呈现首行、标题、说明、两个 CTA、完整前景手机和故事轨；
- 320 等极窄屏不隐藏品牌、语言、CTA 或故事按钮，允许必要换行和轻微向下延伸；
- 大于批准桌面宽度时限制内容最大宽度，避免标题与舞台无限拉开。

resize 或方向变化不能重置当前故事、locale、路线、下载或 FAQ 状态，也不能制造第二个轮播 timer。

## 9. 手机路线试查布局

桌面继续使用当前左侧查询、右侧结果的双栏工作台。手机查询区改为固定两列：

- 左列：起点和终点输入框纵向排列；
- 右列：一个 44×44 的起终点交换按钮，垂直对齐两块输入面的整体中心；
- 查询按钮与范围说明继续位于输入组下方，占正常文档流。

交换按钮的定位基于输入控件容器，不基于包含错误文本或候选列表的总高度。候选 listbox 继续锚定对应输入框；字段错误出现时不把交换按钮推到下一行。320px 下输入列仍必须保留可用宽度和完整焦点环。

本轮只改布局，不修改 place request sequence、route request version、ETA token、retained 结果或错误恢复逻辑。

## 10. 前端组件边界

实现应维持以下职责：

- `HeroSection`：组合 Hero 首行、文案、行动、舞台和故事轨，持有当前故事与变更来源；
- 新轮播 hook：管理 dwell、pause reasons、visibility 和 transition-settled 协议；
- `HeroStoryStage`：计算五槽位与本地化截图，只报告主转场稳定，不自行决定下一故事；
- `HeroStoryRail`：显式手动选择、键盘导航和手动 live announcement，不创建 timer；
- 首页语言操作：直接调用现有 i18n Provider，保持页面状态；
- `LocalizedStoryAssets`：从 manifest 驱动故事与 locale variant，不在组件散落 import 选择；
- `AndroidDownloadAction`：消费唯一 metadata URL，根据当前 desktop/mobile media 条件增强同一行动；
- 路线试查：只调整 mobile CSS grid 和交换按钮容器，不改变领域请求。

不引入通用动效库。定时、IntersectionObserver、document visibility 和 media query listener 必须在卸载时清理。

## 11. 错误、降级与可访问性

- 自动轮播与网络无关；截图失败只影响对应手机 screen，背景、边框、标题和操作继续稳定。
- 自动轮播不能触发路线、下载 metadata 或其他网络请求。
- 页面后台、Hero 不可见和 reduced-motion 下不消耗轮播 timer。
- 语言切换时若目标截图未加载成功，显示目标语言 alt 对应的稳定失败 shell，不显示错误源路径或另一语言画面。
- 桌面下载增强失败时，第三屏仍保留真实下载链接；手机不依赖 JavaScript 生成 Blob 或模拟进度。
- 语言、故事、CTA、起终点交换和隐私页返回入口都具有可见 `:focus-visible`。
- 手机命中区至少 44×44；装饰风带和后景图不进入焦点顺序。
- 自动切换不发送 live announcement；用户手动故事选择发送一次简短、原子播报。

## 12. Figma 与验证门禁

现有 Figma `119:64`、桌面 `119:176` 和手机 `119:461` 继续提供色彩、风带、手机舞台和四段结构基线。实施前必须在同一 Figma 文件创建本轮 refinement Section，并至少包含：

1. 无 Header、真实 Logo、`繁 · 简 · EN` 的桌面和手机 Hero；
2. Story 01 的中文与英文截图状态；
3. 方案 A 转场的 start / 160ms / settled 三个 storyboard 状态；
4. 手机路线输入与右侧交换按钮；
5. 桌面首屏到第三屏下载的交互说明；
6. 无日期的 Hero 和 Download metadata；
7. 隐私页轻量返回首页入口；
8. 1440、390、320 的流式尺寸说明。

新 Section、关键 frame 节点、viewport、日期和导出 SHA 必须补入 feature 的 Figma/visual-review 记录后才能修改生产 UI。Visual Companion 的临时 mockup 只记录讨论选择，不替代 Figma 设计源。

自动化至少覆盖：

- 假时钟下首次 10 秒、自动 5 秒、手动与 locale 后 10 秒；
- hover、focus-within、IntersectionObserver、document visibility 和 reduced motion；
- 连续快速选择最后一次胜出，timer 不重复、不泄漏；
- 三语故事与 `zh/zh/en` 截图映射、30 个衍生文件及 manifest 指纹；
- 桌面 CTA 滚到下载段、手机 CTA 保持原生下载；
- Hero 和 Download 不渲染日期；
- 390/320 手机交换按钮在输入框右侧且无横向滚动；
- 隐私页真实 Logo 与返回路径；
- 三语五故事 1440/390/320 browser golden、Route/Download/Support 回归；
- `npm --prefix frontend run test`、`build`、`test:e2e`、`git diff --check` 和最终状态审计。

## 13. 拒绝的替代方案

- 语言下拉、Logo 菜单、首访语言弹层、边缘浮签和页尾唯一入口：层级过深或发现性不足。
- 有外框的语言 segmented control：比无容器文字更像独立导航控件。
- 吸顶品牌或语言：与“首屏内容可以划走”相冲突。
- 同步文字／图片溶解：削弱环形舞台的前后关系。
- 明显回弹转场：动效存在感过高，不符合克制方向。
- 可见暂停／播放按钮：用户明确拒绝；保留上下文暂停并记录无显式控制的限制。
- 整页 `transform: scale()`：会同时缩小文字、焦点环和触控目标，并降低截图清晰度。
- 日期固定为 `18/08/2026`：来自口误，且会制造易变事实副本。
- 桌面首屏直接下载：不符合桌面用户更适合手机扫码的决策路径。

## 14. 完成定义

本设计完成不等于实现完成。只有在以下条件同时满足后，才能声称本轮优化交付：

- Figma refinement 节点和导出证据已记录；
- 两套五图及真实 Logo provenance 已通过 manifest 合同；
- 轮播、语言、CTA、路线交换和响应式行为通过单元与 E2E；
- 浏览器实际图与批准 Figma 在 1440、390、320 下完成对照；
- 未把临时素材路径、更新日期、旧 Header 或错误语言截图带入 runtime；
- 后端与 OpenAPI 无本轮语义变化；
- 已知“无显式暂停按钮”限制在最终验证记录中保留。
