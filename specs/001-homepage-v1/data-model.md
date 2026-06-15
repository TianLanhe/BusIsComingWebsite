# 数据模型：第一版网站主页

## 概览

第一版主页的数据以静态内容和 UI 状态为主。模型必须支持三语内容、下载平台状态、首屏轮播、静态在线查询演示、FAQ、反馈联系和 Figma 设计追溯。本 feature 不产出服务端代码；未来需要服务端持久化或查询能力时，按 Go 1.26 + Gin + MySQL 边界承接这些模型。

## 通用类型

### LocalizedString

表示一个用户可见字符串的三语内容。

**字段**
- `zh-Hant`：繁体中文文案，香港语境默认。
- `zh-Hans`：简体中文文案。
- `en`：英文文案。

**验证规则**
- 三个字段都必须存在。
- 字符串不得为空。
- 路线号、Citybus、DATA.GOV.HK、ETA、HK$ 等术语必须保持语义准确。

## 实体

### HomePageContent

首页内容根实体。

**字段**
- `metadata`：内容版本、更新时间、事实来源摘要。
- `navigation`：导航项和语言切换标签。
- `hero`：首屏产品定位、CTA 和轮播引用。
- `features`：核心功能列表。
- `onlineQueryDemo`：在线查询静态演示。
- `downloadSection`：下载区内容。
- `faq`：常见问题条目。
- `contact`：反馈与联系入口。
- `scopeExclusions`：范围排除说明。
- `figmaReference`：Figma 文件和节点引用。

**关系**
- 包含多个 `CarouselSlide`、`FeatureItem`、`FAQItem`。
- 引用 `DownloadManifest` 表达平台状态。

**验证规则**
- 必须覆盖规格定义的 6 个页面区块。
- 不得包含完整出行路线规划或非香港巴士交通查询能力。
- 所有用户可见文本必须使用 `LocalizedString`。

### HeroContent

首屏内容。

**字段**
- `headline`：通勤收益型标题。
- `subheading`：真实能力说明。
- `bullets`：首屏功能要点。
- `primaryAction`：下载 App 主行动。
- `secondaryAction`：在线查询次行动。
- `carouselSlides`：首屏 App 预览轮播项。

**验证规则**
- 标题必须表达香港巴士查询和通勤收益。
- 主行动必须是下载 App，次行动必须是在线查询。

### DownloadManifest

下载平台状态集合。

**字段**
- `version`：manifest 版本。
- `android`：Android 平台状态。
- `ios`：iPhone 平台状态。
- `lastUpdated`：状态更新时间。

**验证规则**
- Android 第一版状态为可下载或明确暂不可用。
- iPhone 第一版状态必须为暂未支持。
- 若 Android 下载地址暂缺，必须提供不可用原因，不得展示虚假可下载状态。

### DownloadPlatform

单个平台的下载状态。

**字段**
- `platform`：`android` 或 `ios`。
- `status`：`available`、`unsupported`、`temporarily-unavailable`。
- `label`：平台名称。
- `description`：状态说明。
- `actionLabel`：操作文案。
- `downloadUrl`：下载地址；不可用平台为空。
- `disabledReason`：不可用原因。

**状态转换**
- Android：`default` → `android-expanded` → `default`。
- iPhone：`default` → `iphone-expanded` → `default`；不得进入下载跳转状态。

### CarouselSlide

首屏 App 功能预览的一项。

**字段**
- `id`：稳定标识。
- `order`：展示顺序。
- `title`：功能标题。
- `description`：1-2 行说明。
- `screenshot`：截图素材引用。
- `screenshotStatus`：`real` 或 `placeholder`。
- `sourceReference`：Android 主项目事实来源。

**验证规则**
- 必须有 4 项，顺序为常用路线快速查询、路线结果比较、多班 ETA / 路线详情、出门前短时通知监测。
- `placeholder` 素材必须标注实现前替换为真实 Android App 截图。

### FeatureItem

核心功能区的一项。

**字段**
- `id`：稳定标识。
- `title`：功能名称。
- `description`：简短说明。
- `icon`：图标语义。
- `sourceReference`：Android 主项目事实来源。

**验证规则**
- 必须覆盖常用路线、路线比较、多班 ETA、路线详情、短时通知监测、HK$ 清晰显示。
- 不得加入 Android 主项目尚未支持的当前能力。

### OnlineQueryDemo

在线查询静态演示。

**字段**
- `title`：区块标题。
- `mode`：固定为 `static-demo`。
- `origin`：演示起点。
- `destination`：演示终点。
- `resultRows`：静态路线结果。
- `limitationNotice`：功能受限说明。
- `scopeNotice`：范围边界说明。

**验证规则**
- 必须明确不是完整实时查询。
- 必须提示完整功能请下载 App。
- 不得让用户输入后触发真实外部查询。

### DemoRouteResult

静态路线结果行。

**字段**
- `routeNumber`：路线号。
- `operator`：例如 Citybus。
- `fare`：HK$ 车费展示。
- `duration`：行程时间展示。
- `walkingDistance`：步行距离展示。
- `etaDisplay`：示例 ETA 展示。

**验证规则**
- 数据仅作为演示，不得标记为实时。
- 第三方术语和货币符号必须保持准确。

### FAQItem

常见问题。

**字段**
- `id`：稳定标识。
- `question`：问题。
- `answer`：回答。
- `category`：安装、平台支持、在线查询、数据范围等。

**验证规则**
- 必须覆盖 Android 安装、iPhone 状态、在线查询限制、数据来源/范围边界。

### ContactEntry

反馈与联系入口。

**字段**
- `label`：入口名称。
- `description`：说明。
- `href`：链接或联系方式。
- `priority`：视觉优先级。

**验证规则**
- 视觉权重必须低于下载和在线查询主流程。

### FigmaReference

设计追溯信息。

**字段**
- `fileUrl`：Figma 文件链接。
- `desktopNode`：桌面首页节点。
- `mobileNode`：移动首页节点。
- `downloadStatesNode`：下载按钮交互状态节点。
- `carouselStatesNode`：轮播状态节点。
- `versionNote`：版本说明。

**验证规则**
- 后续 plan、tasks、implement 必须引用这些节点。

## 状态模型

### DownloadButtonState

- `default`：展示 Android 与 iPhone 左右分区。
- `android-expanded`：Android 区域扩展为可下载面板。
- `iphone-expanded`：iPhone 区域扩展为暂未支持面板。

**不变量**
- `iphone-expanded` 不得触发下载跳转。
- 触控和键盘用户必须能获得等价状态反馈。

### CarouselState

- `activeSlideId`：当前轮播项。
- `slideOrder`：固定 4 项顺序。
- `isPausedByUser`：用户交互时可暂停自动切换。

**不变量**
- 切换语言时保留当前轮播项。
- 当前项必须有可读标题和说明。

### LocaleState

- `selectedLocale`：`zh-Hant`、`zh-Hans` 或 `en`。
- `source`：浏览器语言、用户选择或默认。

**不变量**
- 切换语言不得重置下载按钮当前可理解状态和轮播上下文。
