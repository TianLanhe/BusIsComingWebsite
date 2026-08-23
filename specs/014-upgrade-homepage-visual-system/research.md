# 阶段 0 研究：首页视觉系统与产品叙事升级

## 研究范围与证据

本研究核对了当前 React 首页结构、三语路由、Hero/截图交互、路线试查状态机、下载状态、FAQ、
Header/Footer、共享 UI/content schema、截图 manifest、Vitest/Playwright 覆盖，以及 Figma 最终
Section 与仓库内设计合同。Android 产品事实只用于核对当前产品边界、`minSdk 25` 和五个核心价值，
不会成为网站运行时依赖。

以下决策均已解决计划所需未知项；没有保留 `NEEDS CLARIFICATION`。

## D1：保持纯前端范围并复用既有服务状态机

**决定**：只修改公开首页组件、内容、受管素材、前端依赖、测试和 UI/content 长期契约。路线查询
继续使用现有 client、query version、候选 token、ETA 合并与受控错误；下载继续使用现有
`DownloadMetadataProvider`、metadata client 和原生 `<a download>`。不修改后端、OpenAPI 或
monitoring UI。

**理由**：获批体验所需的路线、ETA、APK metadata 和下载行为当前均已存在。用户明确要求纯前端；
扩大服务端会把视觉交付与新业务能力耦合，并破坏可独立验收性。

**评估过的替代方案**：

- 为最低 Android、二维码或新展示字段扩展下载 API：拒绝，最低系统可由当前 `minSdk` 审核后固化，
  二维码可以由公开下载 URL 本地生成。
- 重写路线查询逻辑以配合新布局：拒绝，现有竞态保护和降级语义成熟，布局不应改变业务状态机。
- 读取 Android 工程或服务端 `current.json`：拒绝，违反前后端边界并可能泄露绝对路径、SHA 或内部字段。

## D2：一次迁移旧四故事合同，不建立兼容双模型

**决定**：用五个稳定故事 ID
`route-search`、`saved-journeys`、`journey-guidance`、`cross-operator-arrivals`、
`predeparture-monitor` 取代旧四个 `FeatureShowcaseId`。生产内容、TypeScript 类型、截图 manifest、
shared schema、UI 状态契约和测试在同一 feature 内同步迁移；从首页移除 FeatureGrid、旧同故事画廊、
lightbox 和自动轮播。历史 `#features` 深链映射到新 Hero 故事区。

**理由**：当前错误方向由内容、schema、组件和测试共同锁定。只改 CSS 会留下相互冲突的“运行时五故事”
和“契约四故事”，后续实现必然漂移。

**评估过的替代方案**：

- 保留旧类型并在组件中临时转换：拒绝，会形成两套排序、文案和素材身份。
- 保留 FeatureGrid 作为向后兼容：拒绝，重复首屏信息且违反 FR-001。
- 回写 003/005/007 历史 feature：拒绝，历史记录只解释旧决策，014 应更新长期 shared 合同。

## D3：五图常驻 DOM 的环形槽位状态机

**决定**：React 只保存单一 `activeStoryId`。以内容顺序和 active index 归一化计算五个相对槽位：
`front`、`near-left`、`near-right`、`far-left`、`far-right`。五张截图常驻固定比例舞台，槽位通过
CSS custom properties/data attributes 控制 x/y、scale、rotate、opacity、静态 blur 与 z-index；手机
主要转场约 `880ms`，桌面约 `520ms`。最后一次点击立即成为唯一目标，不排队等待动画完成。

**理由**：这能复现“舞台成圈，前景退后、远景上前”的获批关系，同时保证文案、按钮、前景图和
读屏状态在同一次 React render 中一致。固定舞台避免图片比例和故事轨道导致首屏跳动或遮挡。

**评估过的替代方案**：

- 平面横向 carousel、淡入淡出或前后排队：拒绝，不符合获批空间关系。
- CSS `offset-path` 椭圆：拒绝，非相邻直跳、z-index 中点与浏览器回退难以稳定。
- Framer Motion/GSAP：拒绝，五个固定槽位不需要新增通用动效运行时。
- Canvas/WebGL：拒绝，损害图片清晰度、alt、焦点、响应式与视觉测试能力。

## D4：只保留显式故事按钮，不自动播放、拖拽或灯箱

**决定**：五个原生 button 是故事切换的唯一入口，采用 group + `aria-pressed` 语义，支持点击、
触控、Arrow、Home、End 和可见焦点；隐藏 live region 宣布新标题。删除 3 秒自动轮播、截图区拖拽、
同故事后排切图、lightbox 和不可见 prev/next 控件。

**理由**：Figma 与规格只批准故事按钮。显式选择更克制，避免手机纵向滚动手势冲突，读屏状态也更
确定。当前五个故事各有一张主要截图，不需要同故事画廊。

**评估过的替代方案**：

- 保留 autoplay 作为“呼吸感”：拒绝，内容位移会与背景呼吸竞争并干扰阅读。
- 保留 swipe/drag：拒绝，未被批准且会增加轴向锁定、手势阈值和状态竞态。
- 把舞台本身做成可点击大图：拒绝，移动端没有空间承担额外灯箱流程，且偏离本次转化主线。

## D5：CSS 风带与减少动效双层降级

**决定**：建立装饰性 `WindField`，由 3–5 个绝对定位、`aria-hidden`、`pointer-events:none` 的
远/中/近白色/浅绿渐变层组成。持续运动只使用 translate3d、scale 和 opacity，周期分布在
`10–22s`，Hero 最明显、Route/Download 递减、Support 收敛。CSS media query 停止 animation、
transition 和 smooth scroll；可订阅 matchMedia 的 hook 让 React 绕过需要计时/观察的过渡逻辑。

**理由**：CSS 合成属性足以形成风吹与呼吸的远近感，不需要 JavaScript 每帧更新，也不会改变文字
对比度或布局。CSS + React 双层处理可以同时覆盖视觉运动和离散状态等待。

**评估过的替代方案**：

- WebGL/Canvas 粒子：拒绝，体积、耗电、可测试性与克制程度不合适。
- 大型 filter/blur 持续动画：拒绝，手机合成成本高；blur 保持静态或低强度。
- 只把 CSS duration 压到 `0.01ms`：拒绝，仍可能产生重复动画事件和 JS 等待。

## D6：下载汇聚只提示一次，二维码由同一目标本地生成

**决定**：DownloadDecision 进入约一半 viewport 时以 IntersectionObserver 添加一次性
`data-converged`，风带向主 CTA 收拢并完成一次轻量亮带/箭头动作；语言切换不重播。ready 状态的
按钮和桌面二维码从同一派生绝对 URL 生成：
`new URL(metadata.downloadUrl, window.location.origin).href`。使用
[`qrcode.react`](https://github.com/zpao/qrcode.react) 的 `QRCodeSVG` 本地渲染；手机、checking、
unavailable 不显示二维码。

**理由**：一次性汇聚有趣但不游戏化，能承接路线结果并让注意力落到下载。SVG QR 清晰、可测试且
无需外部网络；从一个派生值生成可以证明二维码和按钮不会漂移。

**评估过的替代方案**：

- 静态 QR 图片：拒绝，下载 URL 或域名变化后会静默失效。
- 第三方 QR 图片服务：拒绝，会暴露 URL、增加外部依赖和失败面。
- 后端二维码 endpoint：拒绝，超出纯前端范围。
- 手指、放大镜、人物或循环动画：拒绝，用户已明确否决或未批准，且会破坏克制感。

## D7：下载事实分为动态元数据与审核后的静态能力

**决定**：版本、大小和 `lastUpdated` 继续来自公开 metadata；页面把 `lastUpdated` 表述为“更新日期”
而非推断“发布日期”。最低系统以 Android 当前 `minSdk 25` 核对为 `Android 7.1+`，写入三语内容源。
下载区不展示 versionCode、SHA-256、sourcePath、虚假进度或安装完成状态。

**理由**：公开 metadata 没有最低 Android 字段，也不会暴露服务端私有 manifest。动态易变值继续由
权威数据驱动，静态兼容下限通过产品事实审校，不需要越界改 API。

**评估过的替代方案**：

- 把 `Android 7.1+` 拼进后端 DTO：拒绝，纯前端范围无必要。
- 硬编码版本/大小/更新日期：拒绝，发布后会陈旧。
- 展示 BUILD/SHA 以增加可信度：拒绝，用户已明确不需要，且抢占下载行动层级。

## D8：语言切换沿用无刷新路径更新，以稳定 ID 保留页面状态

**决定**：继续使用 I18nProvider 的内存 locale state + `history.pushState`；不得把 locale 放入首页
根节点 key、重新挂载 DownloadMetadataProvider 或主动 reload。故事、FAQ、路线和下载状态都用 locale
无关稳定 ID 保存；可见文本从当前 locale 派生。Hash/search/当前 scroll 保持现有行为。

**理由**：当前实现已经不刷新 document，天然能保留子组件 state。新增重挂载或语言专用 ID 才会
造成 FR-025 所禁止的状态丢失。

**评估过的替代方案**：

- 每种语言独立页面硬跳转：拒绝，会丢失查询结果和滚动位置。
- 把翻译后的文字作为状态身份：拒绝，切换语言后 ID 变化并产生错配。
- 为状态额外写 localStorage：拒绝，无需永久保留，增加陈旧和隐私面。

## D9：Header 使用完整窄屏布局，FAQ 使用受控单开 accordion

**决定**：手机 Header 与品牌同行并保留功能、FAQ、联系和语言入口；390px 直接展示紧凑入口，
320px 可以只视觉隐藏品牌文字但保留可访问品牌名，不能隐藏导航或改成含义不明 hamburger。语言入口
使用有标签的 disclosure，触控目标至少 44px。FAQ 保存单一 `activeFaqId`，默认
`android-install`，新展开项替换旧项；button 负责 `aria-expanded/controls`，panel 负责
`aria-labelledby`。

**理由**：当前手机 CSS 隐藏入口，当前 `<details>` 可多开，均直接违反获批合同。受控 ID 在语言切换
后稳定，也能精确测试单开和焦点行为。

**评估过的替代方案**：

- 保留当前“手机只显示联系”：拒绝，用户已多次指出缺失导航。
- hamburger：拒绝，Figma 要求完整可见入口，且 320px 仍可通过间距/字号处理。
- 无控制 `<details>`：拒绝，不能保证同时最多一项和状态保留。

## D10：路线业务逻辑保留，展示语义按获批结果卡调整

**决定**：只重构 RouteTrial 布局和展示子组件。路线卡使用路线号链、上下车摘要、候车、车费、
`耗时 N 分钟`、`步行 N 米`；耗时/步行不使用图标，不显示直达/转乘。错误与 empty 提供单一下一步，
有效输入保留；retained 状态收敛为结果工具栏低权重信息，不叠加新警告卡。地点输入补足 WAI-ARIA
combobox/listbox/option 和键盘语义。

**理由**：当前请求排序、旧响应拒绝和 ETA 合并可复用；新设计需要的是稳定工作区、清楚文案和更完整
输入可访问性，而不是服务协议变化。

**评估过的替代方案**：

- 在浏览器推断直达/转乘：拒绝，用户明确删除且可能超出服务可证明信息。
- 用图标节省空间：拒绝，用户要求直接文字，文字也更适合读屏。
- 错误时清空输入或恢复旧静态结果：拒绝，破坏可恢复性或编造数据。

## D11：批准截图进入受管目录并生成响应式衍生物

**决定**：从已批准的 Figma 导入源/用户提供 v1.3.1 原图中选取五张，一一映射到五故事；先记录
源 SHA-256，再生成适合 Web 的 540/720/1080 宽衍生物并记录输出 SHA、尺寸、格式、批准/脱敏状态、
三语 alt。生产只引用仓库内受管路径。前景图高优先级，其余图常驻但不重复导入；固定 shell 使用
显式 `width/height` 或 `aspect-ratio`，不得拉伸第五张锁屏图。

**理由**：生产目录当前 manifest 仍是旧四组，正式素材与 Figma 源并非同一批发布文件。通过源/衍生
双指纹既能高保真，也能控制首屏负载和避免重新清洗破坏素材。

**评估过的替代方案**：

- 继续把旧生产图重新归类：拒绝，无法证明与获批 Figma 一致。
- 运行当前覆写式清洗脚本：拒绝，脚本的旧 mask 坐标和同路径覆写有误遮/累计压缩风险。
- 运行时从临时目录、Android 项目或设计文档加载：拒绝，不可部署且泄露本地来源。

## D12：Figma 设计证据与浏览器 golden 两级视觉门禁

**决定**：实现前把关键 Figma Frame 以 1x PNG 导出到本 feature 的 `visual-review/reference/`，并用
manifest 记录 node ID、viewport、story/state/locale、导出日期、像素尺寸和 SHA-256。首次实现使用
Sharp 生成 reference/actual 的并排、50% overlay 和 diff，由人工对照批准；批准后的浏览器截图再
成为 Playwright `toHaveScreenshot` golden。截图等待 fonts ready、图片 decode、fixture 稳定并暂停
持续风带，不用任意 sleep 判断稳定。

**理由**：Figma 与 Chromium 的字体抗锯齿不同，直接像素等同会制造误报；但只有人工截图又不能阻止
后续回归。两级门禁把“还原设计”和“保持实现”分别证明。

**评估过的替代方案**：

- 只做 DOM/几何断言：拒绝，不能发现色彩、材质、倾斜和层次漂移。
- 只保存人工截图：拒绝，后续无自动回归门禁。
- 把 Figma PNG 当生产页面：拒绝，失去交互、语义、响应式和可访问性。
- 用宽松全图阈值掩盖差异：拒绝，FR-030 的标题换行、裁边、覆盖、入口缺失等必须零容忍。

## D13：验证矩阵覆盖状态、双端、三语、窄屏和减少动效

**决定**：Playwright 保留 `desktop-1440` 与 `mobile-390`，补充 `mobile-320` 或等价专用 context；
新增 reduced-motion、三语长文案、五故事快速正反切换、Route 全状态、Download 三态/二维码目标、
FAQ 单开、Privacy/Header/Footer 不回归。关键几何断言包括标题分行、CTA 顺序、完整四边、故事轨道
位于舞台后、导航可见、44px 目标和 `scrollWidth === clientWidth`。

**理由**：用户在真实手机上多次发现浏览器预览未暴露的覆盖/裁切问题，单一桌面截图或 happy path
不足以证明高保真和可用性。

**评估过的替代方案**：

- 只运行现有 1440/390 E2E：拒绝，缺少 320、三语和 reduced-motion。
- 自动测试通过即宣布视觉完成：拒绝，动效节奏、材质和设计层次仍需人工对照。
- 接管已有 Android emulator：拒绝；如后续需要 Android 浏览器验证，只能使用本任务新启动或明确
  归本任务所有的设备，并在验证后关闭。
