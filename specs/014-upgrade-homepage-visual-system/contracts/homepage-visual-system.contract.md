# UI 合同：首页视觉系统 v1.3.1

## 1. 权威与适用范围

本合同约束公开三语首页的页面结构、状态、交互、视觉不变量和降级。视觉权威为 Figma 最终 Section
`119:64`，需求权威为同 feature 的 `spec.md`，运行时 API 权威仍为 `shared/contracts/openapi/`。
三者职责不同，不得用浏览器实现反向修改已批准 Figma，也不得用 Figma 推断未公开 API 能力。

本合同取代 `shared/contracts/ui-state-contract.md` 中旧的四故事、3 秒自动播放、`stair-card-deck`、
同故事牌堆和 lightbox 首页条款。实现完成时必须同步长期合同，不能让新旧条款并存。

## 2. 页面结构合同

首页主内容必须按以下顺序且只包含四段：

1. `HeroStory`：产品定位、下载/路线试查 CTA、五故事和截图舞台；
2. `RouteTrial`：真实路线试查工作区；
3. `DownloadDecision`：承接试查的 Android 下载决策；
4. `SupportEnding`：四项 FAQ、联系横条和浅色页尾。

禁止恢复独立 FeatureGrid、连续故事长卷、证明条、场景说明卡或第四个营销屏。历史 `#features`
深链必须落到 Hero 故事区域或有等价兼容路径。

## 3. Header 合同

| 视口 | 必须可见 | 不允许 |
| --- | --- | --- |
| 桌面 | 品牌、功能、FAQ、联系、三语入口 | CTA 抢占标题层级 |
| `390×844` | 品牌同行、功能、FAQ、联系、当前语言入口 | 只剩联系、汉堡菜单、第二行大导航 |
| `320px` | 品牌可访问名、功能、FAQ、联系、语言入口 | 删除核心入口或水平滚动 |

每个主要可点击目标至少 `44×44 CSS px`。语言 disclosure 必须带明确 label、`aria-expanded`、
Escape/焦点恢复语义；当前语言和三种可选语言均可理解。

## 4. Hero 五故事合同

### 4.1 固定内容与顺序

故事顺序和 `zh-Hant` 标题/说明由 `spec.md` 固定。故事按钮显示 `01–05` 与本地化短标签；不得显示
已删除的“功能 01 / SEARCH”说明行、证据标签或额外说明卡。

### 4.2 单一状态源

`activeStoryId` 必须同时决定：

- 当前标题与说明；
- 前景截图及其 alt；
- 五图相对环形槽位；
- 当前按钮的 `aria-pressed`/选中样式；
- live region 的当前故事说明。

任何中间时刻不得出现两个 active button、两个前景槽位或标题/截图错配。连续 20 次正向、反向和
快速跳转后，最后选择必须成为稳定结果。

### 4.3 环形舞台

- 五张截图常驻一个有明确尺寸/比例的舞台，恰有一个 front、两个 near、两个 far。
- 后景在 x/y、scale、rotate、opacity、清晰度和 z-index 上形成环形远近关系；不得排成队列。
- 目标图从后方上前，原前景退到后方；不得用纯淡入淡出或横向切入切出代替。
- 手机前景截图四边完整，边框无灵动岛/硬件开孔，使用 Figma 的克制高级材质。
- 故事轨道处于正常文档流并严格位于舞台下方，不能 fixed/absolute 覆盖截图。
- 后景图片不可点击、不可聚焦、`aria-hidden=true`、空 alt；前景图片只朗读一次。

### 4.4 转场

| 模式 | 手机 | 桌面 |
| --- | --- | --- |
| standard | 约 `880ms`，自然减速 | 约 `520ms`，较轻前后变化 |
| reduced | 无大位移、无等待，立即换槽 | 无大位移、无等待，立即换槽 |

故事不自动播放；不支持拖拽切换、截图 lightbox 或同故事图片画廊。故事按钮支持 pointer、touch、
Arrow、Home、End，焦点不因内容切换被移动。

## 5. 风带合同

- 页面前三段使用白色/浅绿多层渐变；Hero 强、Route 中、Download 收敛，Support 静止或近乎消失。
- standard 周期分布为约 `10–22s`，只动画 transform/opacity/scale，不动画布局尺寸。
- 所有层 `aria-hidden`、`pointer-events:none`，超出容器时使用可控 overscan，不能产生水平滚动。
- 不得出现紫色、霓虹、深色潮汐、固定底浪、文字对比度变化或页面布局位移。
- reduced motion 下 animation 数量为 0；静态浅绿/白色远近层次保留。

## 6. RouteTrial 合同

### 6.1 服务边界

地点、路线和 ETA 请求、token、requestId/query version、错误 code 和缓存语义完全沿用现有契约。
页面不得展示后端原始 message，亦不得从联营 ETA 推断完整九巴/龙运路线规划。

### 6.2 状态

同一稳定工作区覆盖：初始、候选加载/可选、无效选择、路线加载、成功 + ETA 加载、成功 + ETA
ready/partial、empty、error、rate limited、token expired、retry、retained previous result。

- 新查询失败保留有效起终点；只有同组起终点按既有合同允许保留旧结果。
- empty/error 只显示一个清楚的主要下一步。
- retained 状态只在结果工具栏低权重说明，不新增覆盖内容的警告卡。
- 输入框遵循 combobox/listbox 语义并支持 Arrow、Enter、Escape。

### 6.3 路线卡

每张卡优先显示路线号链、上下车摘要、候车、车费、`耗时 N 分钟` 和 `步行 N 米`。耗时和步行
必须直接写文字，不使用时钟/行人图标；不得显示“直达”“转乘”或浏览器推断的运营信息。未知值使用
受控未知状态，不猜测。

## 7. DownloadDecision 合同

### 7.1 状态与数据

两处 Android 下载行动共享同一个 Provider：

| 状态 | 主行动 | 信息 | 二维码 |
| --- | --- | --- | --- |
| checking | 无 `href`，不可操作 | 本地化检查中 | 无 |
| ready | 原生 `<a download>` | 版本、Android 7.1+、大小、更新日期同字号/权重 | 桌面有、手机无 |
| unavailable | 无 `href`，不可操作 | 单一暂不可用说明，无陈旧回退 | 无 |

版本、大小、更新日期来自 metadata；Android 7.1+ 是经当前 `minSdk 25` 审核的静态三语产品内容。
不得展示 versionCode、BUILD、SHA-256、sourcePath、虚假进度或安装完成状态。

### 7.2 二维码

- QR value 必须等于 `new URL(metadata.downloadUrl, window.location.origin).href`。
- 下载按钮的浏览器最终 URL 必须与 QR value 相同。
- QR 只在 ready 且桌面布局可见，不成为第二个可聚焦下载控件。
- 禁止静态 QR、远程 QR 服务、后端 QR endpoint 或备用短链。

### 7.3 视觉与动效

下载区是非卡片、居中紧凑的行动，手机左对齐；版本资料同一小字号。进入 viewport 时只运行一次
风带汇聚/轻量亮带/箭头动作；不使用手指、放大镜、人物、插画、循环游戏化引导。reduced 模式不运行。

## 8. SupportEnding 合同

- FAQ 恰有四项：Android 安装、数据/运营商覆盖、网站与 App 区别、iPhone 支持。
- 第一项默认展开；同一时间最多一项；展开新项时旧项收起。
- 每项使用分隔线而非独立卡片；button/panel 的 `aria-expanded`、`aria-controls`、
  `aria-labelledby` 一致，加减号不重复朗读。
- 语言切换保留稳定 FAQ ID；关闭 panel 不留下可聚焦内容。
- FAQ 后为联系横条，再到浅色极简页尾；保留品牌、联系/隐私和返回顶部，不使用深色结尾。
- Header/Footer 在隐私页使用明确变体，首页改造不得破坏隐私页。

## 9. 三语与产品事实合同

- 所有可见文字、alt、aria-label、status 和错误映射覆盖 `zh-Hant`、`zh-Hans`、`en`。
- `zh-Hant` 为香港实用书面语；`zh-Hans` 自然；`en` 克制自然，三语独立审校。
- 固定五故事 `zh-Hant` 不得改写；其他语言等义但不得扩大能力。
- 品牌定位统一为“香港巴士路线规划与导航 App”；页面可以说明符合条件的联营路线聚合城巴、九巴、
  龙运首程 ETA，但不能声称完整支持九巴/龙运路线规划。
- 用户可见页面、runtime 文案/状态和公开响应不得包含 Android 工程、临时目录、本机绝对路径、内部类名、
  token、SHA 或调试信息。
- 仅用于素材完整性与视觉审查的非渲染 provenance manifest 可以保存源文件和衍生物 SHA-256，但不得把
  SHA 当作下载资料、用户文案或 DOM 内容输出，也不得保存本机绝对路径、token 或内部实现名称。

## 10. 状态保留合同

切换语言不得 reload 或以 locale key 重挂载首页。以下状态保持：当前故事、滚动位置/hash、路线输入、
地点 token、仍有效结果、下载 metadata 状态、FAQ 展开 ID。动态地点名称按既有路线合同尝试本地化；
失败时保留可用选择，不静默清空。

## 11. 视觉验收合同

### 11.1 设计证据

- 最终 Section：`119:64`
- 桌面 Hero：`119:176` / `1440×960`
- 手机 Hero：`119:461` / `390×844`
- 状态、动效、Foundations 和内容边界以 `figma.md` 的节点索引为准

实现前必须导出/记录关键 Figma Frame；实现后生成相同 viewport 的浏览器 actual、overlay 和 diff。
人工批准后才建立 Playwright browser golden，并在固定 Chromium/字体环境中以
`expect(page).toHaveScreenshot()` 接入 E2E；后续普通测试不得自动更新 baseline。FR-030 零容忍项继续由
独立几何/语义断言保护，不得依赖像素阈值放行。

### 11.2 零容忍失败

以下任一项出现即失败，不得被全图像素阈值豁免：

- 标题分行、CTA 顺序或权重偏离批准 Frame；
- 手机前景边框任一侧被裁切；
- 故事轨道覆盖截图或变成 fixed 浮层；
- 五图退化为平面队列；
- Header 核心入口缺失；
- 新增未批准的卡片、证据标签、耗时/步行图标、直达/转乘标签；
- 灵动岛、紫色色块、深色页尾、固定底浪；
- `390px` 或 `320px` 水平滚动；
- reduced motion 仍有持续动画或大位移。

### 11.3 自动化最低矩阵

- Hero：5 stories × desktop/mobile；三语 × 1440/390/320；20 次快速/反向切换。
- Route：全部查询状态 × desktop/mobile；文字指标和禁止项。
- Download：checking/ready/unavailable × desktop/mobile；QR target 一致、手机 QR 0。
- Support：默认 FAQ、切换、键盘、三语保持 × desktop/mobile。
- A11y/layout：44px 目标、可见焦点、无横向滚动、图片失败稳定尺寸、reduced motion。
- Visual regression：人工批准的 browser golden 必须由 `toHaveScreenshot()` 自动比较；CI 普通运行遇到
  未批准像素变化必须失败，只有再次完成 Figma overlay/diff 和人工批准后才可更新 baseline。

## 12. 明确不变项

- 所有 `shared/contracts/openapi/*.openapi.yaml`、后端 endpoints、DTO、错误、缓存和日志行为；
- DownloadMetadataProvider 单请求、无陈旧回退、无 Blob 下载；
- 路线 requestId/query version、候选 token、ETA 合并和受控错误；
- Privacy 页面、私有 monitoring 页面和 Android App；
- 生产运行时不读取 Android 工程或 Figma/临时目录。
