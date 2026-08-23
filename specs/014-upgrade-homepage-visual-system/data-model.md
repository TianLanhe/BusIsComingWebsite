# 数据模型：首页视觉系统与产品叙事升级

## 1. 模型边界

本功能不新增服务端实体、数据库表或 HTTP DTO。以下模型均为前端内容、交互状态、受管素材和视觉
验收模型。路线与下载响应继续以既有 OpenAPI 和前端 client 类型为权威；本文件只描述 UI 派生和
状态不变量。

## 2. `HomepageContentV3`

首页四段内容的根对象。

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `metadata.version` | string | 固定为新的内容合同版本，非 APK 版本 |
| `metadata.lastReviewed` | ISO date | 内容事实最近人工审校日期 |
| `metadata.sourceReferences` | string[] | 只使用稳定的仓库内文档/契约标签，不含本地绝对路径 |
| `navigation` | `NavigationContent` | 品牌、功能、FAQ、联系、语言入口齐全 |
| `hero` | `HeroContent` | 产品定位、CTA 与五故事 |
| `routeTrial` | `RouteTrialContent` | 路线工作区三语内容，不复制 API 数据 |
| `downloadDecision` | `DownloadDecisionContent` | 三态、静态兼容信息与安装说明 |
| `supportEnding` | `SupportEndingContent` | 四项 FAQ、联系、隐私、返回顶部 |
| `figmaReference` | `FigmaReference` | 固定最终 Section 和双端关键 Frame |

### 验证规则

- 所有 `LocalizedString` 必须精确包含 `zh-Hant`、`zh-Hans`、`en` 且非空。
- 用户可见内容不得包含 `/Users/`、`/private/var/`、`AndroidStudioProjects`、`sourcePath`、
  内部类名、SHA-256 或调试信息。
- 产品总体定位为香港巴士路线规划与导航 App；路线试查和运营商说明不得超出现有服务能力。
- `featureGrid`、旧 `featureShowcase`、lightbox、证据标签和功能编号说明不属于 v3 根对象。

## 3. `HeroStory`

一个稳定的产品价值故事。内容身份和视觉槽位分离。

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `id` | `HeroStoryId` | 五个固定 ID 之一 |
| `order` | 1..5 | 唯一且连续 |
| `numberLabel` | `01..05` | 与 order 一一对应 |
| `shortLabel` | `LocalizedString` | 故事轨道短标签 |
| `title` | `LocalizedString` | `zh-Hant` 必须与规格固定内容逐字一致 |
| `description` | `LocalizedString` | `zh-Hant` 必须与规格固定内容逐字一致 |
| `lineBreakHints` | `Record<Locale, string[]>` | 对应 Figma 的批准分行，不把 `<br>` 写入翻译文字 |
| `screenshotId` | `ManagedScreenshotId` | 一对一指向受管截图 |
| `alt` | `LocalizedString` | 描述当前 App UI 与用户价值，不重复标题 |
| `factReference` | string | 稳定产品事实标签，不是本地源码路径 |

```text
HeroStoryId =
  route-search
  | saved-journeys
  | journey-guidance
  | cross-operator-arrivals
  | predeparture-monitor
```

### 固定顺序

| order | id | 截图用途 |
| --- | --- | --- |
| 1 | `route-search` | 输入起终点并比较路线 |
| 2 | `saved-journeys` | 常用行程与路线比较 |
| 3 | `journey-guidance` | 路线、转乘、当前位置和沿途信息 |
| 4 | `cross-operator-arrivals` | 符合条件的联营路线首程 ETA 集中呈现 |
| 5 | `predeparture-monitor` | 锁屏持续更新候车与步行时间 |

## 4. `HeroStageState`

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `activeStoryId` | `HeroStoryId` | 唯一内容状态源，初始为 `route-search` |
| `selectedBy` | `initial \| pointer \| keyboard` | 只用于交互/测试，不改变内容 |
| `motionProfile` | `standard \| reduced` | 由实时 media query 派生 |
| `slots` | `Record<HeroStoryId, HeroStageSlot>` | 纯函数派生，不单独 setState |

```text
HeroStageSlot = front | near-left | near-right | far-left | far-right
```

### 槽位归一化

设 `delta = (storyIndex - activeIndex + 5) % 5`：

| delta | slot |
| --- | --- |
| 0 | `front` |
| 1 | `near-right` |
| 2 | `far-right` |
| 3 | `far-left` |
| 4 | `near-left` |

每次 render 必须恰有一个 `front` 且五槽位各出现一次。视觉 x/y、scale、rotate、opacity、blur、
z-index 来自 Figma/CSS token，不进入内容数据。

### 状态转换

```text
initial(route-search)
  -- select(storyId) --> active(storyId)
active(any)
  -- select(latestStoryId) --> active(latestStoryId)
active(any)
  -- reduced-motion changes --> same active story, new motionProfile
active(any)
  -- locale changes --> same active story, translated content
```

- 快速点击不建立队列；最新目标决定最终 `activeStoryId`。
- 标题、说明、前景图、`aria-pressed`、live 文本在一次 render 中更新。
- 后景图 `alt=""`、`aria-hidden=true`、不可聚焦、不可点击；只有前景图向辅助技术暴露 alt。
- standard 模式只产生视觉过渡，组件不依赖 transitionend 才接受下一次输入。
- reduced 模式立即换槽，但保留静态远近层次。

## 5. `WindLayer` 与 `MotionProfile`

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `id` | string | 稳定装饰层 ID |
| `depth` | `far \| middle \| near \| glow` | 决定透明度与静态 blur |
| `sectionIntensity` | `hero \| route \| download \| support` | 越向页面末端越弱 |
| `durationMs` | 10000..22000 | standard 持续周期 |
| `phaseOffsetMs` | integer | 错开循环，不制造同步机械感 |
| `motionProfile` | `standard \| reduced` | reduced 时无 animation |

`WindLayer` 永远是装饰，`aria-hidden` 且 `pointer-events:none`。不得覆盖文字对比度、改变布局、
形成深色底浪或成为固定页面结尾。

## 6. `ManagedScreenshotAsset`

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `id` | `ManagedScreenshotId` | 与五故事一一对应 |
| `storyId` | `HeroStoryId` | 唯一，不重复 |
| `sourceFingerprint.sha256` | 64 位十六进制 | 已批准源图指纹 |
| `outputs[]` | `ScreenshotOutput[]` | 至少一个受管发布文件 |
| `width` / `height` | positive integer | 记录真实像素，不靠扩展名推断 |
| `format` | `png \| webp \| avif` | 与实际编码一致 |
| `assetPath` | relative path | 只能位于 `frontend/src/assets/app-screenshots/real/` |
| `approvalStatus` | `approved` | 未批准素材不能进入生产故事 |
| `desensitizationStatus` | `approved` | 记录已审查/脱敏状态 |
| `alt` | `LocalizedString` | 三语非空 |
| `approvedAt` | ISO date | 用户批准日期 |
| `provenanceLabel` | string | 稳定来源描述，不含临时或 Android 绝对路径 |

`ScreenshotOutput` 记录 `width`、`height`、`format`、`assetPath`、`sha256`、`sizeBytes`。第五张
锁屏图与前四张比例不同；前端 shell 必须按 Figma 的 contain/裁切规则展示，禁止非等比拉伸。

## 7. `RouteTrialState`

路线业务状态继续引用 `shared/contracts/route-query-ui-state.md`。本 feature 的 UI 派生状态为：

```text
idle
placeSuggestionsLoading
placeSuggestionsReady
invalidSelection
routeLoading
routeSuccessEtaLoading
routeSuccessEtaReady | routeSuccessEtaPartial
empty
routeError | rateLimited | tokenExpired
retainedPreviousResult
```

### 状态数据

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `origin` / `destination` | `PlaceSelection` | 自由文字与已选 token 分开 |
| `queryVersion` | number | 响应只能写入当前 version |
| `routes` | `RouteSummary[]` | 只来自现有 API |
| `retainedRoutes` | `RouteSummary[] \| null` | 仅既有合同允许时保留 |
| `visibleNotice` | localized key \| null | 原工作区内最多一个低权重状态 |
| `primaryRecoveryAction` | action \| null | empty/error 只有一个主要下一步 |

### `RouteCardViewModel`

| 字段 | 显示 |
| --- | --- |
| `routeChain` | 路线号或组合 |
| `boardingToAlighting` | 上车站 → 下车站；缺失时受控提示 |
| `eta` | 查询中、等候 N 分钟、即将到站或暂不可用 |
| `fare` | `HK$ N` 或受控未知状态 |
| `durationText` | 本地化“耗时 N 分钟” |
| `walkingText` | 本地化“步行 N 米” |

禁止派生 `direct/transfer` 标签，禁止为耗时或步行添加图标，禁止猜测未知 ETA/费用/距离。

## 8. `DownloadDecisionState`

```text
checking -- metadata valid --> ready
checking -- HTTP/network/schema failure --> unavailable
```

既有 Provider 每个精确首页 document 请求一次。语言切换不重新挂载 Provider，状态保持。

| 状态 | 主行动 | 版本信息 | 桌面 QR | 手机 QR |
| --- | --- | --- | --- | --- |
| `checking` | 不可操作状态 | 检查中 | 无 | 无 |
| `ready(metadata)` | 原生 `<a download>` | version/Android 7.1+/size/更新日期同权重 | 有 | 无 |
| `unavailable` | 不可操作状态 + 单一说明 | 无陈旧版本回退 | 无 | 无 |

### 派生值

```text
resolvedDownloadUrl = new URL(metadata.downloadUrl, window.location.origin).href
button.href = metadata.downloadUrl（浏览器最终解析为 resolvedDownloadUrl）
qr.value = resolvedDownloadUrl
button.download = metadata.fileName
minimumAndroid = localized static content for Android 7.1+
```

- QR 没有独立请求、状态或替代下载地址。
- `lastUpdated` 只显示为更新日期。
- 离开页面后的下载/落盘/安装由浏览器和系统负责，页面不跟踪进度或成功。
- 下载风带汇聚只在当前 document 首次进入 viewport 时触发一次；reduced 模式不触发。

## 9. `SupportEndingState`

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `faqItems` | exactly 4 `FaqItem[]` | 安装、数据覆盖、网站与 App 区别、iPhone 支持 |
| `activeFaqId` | `FaqId \| null` | 初始为 `android-install`，同一时间最多一个 |
| `contact` | `ContactEntry` | 次要横条行动 |
| `privacyHref` | localized path | 当前 locale 对应隐私页 |
| `backToTopTarget` | `#top` | 可见、键盘可用 |

### FAQ 转换

```text
active(A) -- toggle(A) --> none
active(A) -- toggle(B) --> active(B)
none      -- toggle(B) --> active(B)
locale change          --> active id unchanged
```

button 负责 `aria-expanded` 和 `aria-controls`，panel 负责 `aria-labelledby`。加减号仅装饰且
`aria-hidden`。关闭的 panel 不得留下可聚焦内容。

## 10. `HomepageSessionState`

本模型不要求建立新的全局 store；它描述跨 locale 切换必须保持的现有组件状态集合：

| 状态 | 所有者 | locale 切换 |
| --- | --- | --- |
| `activeStoryId` | HeroSection | 保持 |
| scroll position/hash | browser history/document | 保持 |
| route input/tokens/results/query version | RouteTrial | 保持并按现有规则本地化/重查 |
| download metadata state | DownloadMetadataProvider | 保持，不重复请求 |
| `activeFaqId` | SupportEnding | 保持 |

禁止以 locale key 重挂载首页、四段 section 或 Provider；文本只从 locale 派生。

## 11. `FigmaReference` 与 `VisualReviewRecord`

### `FigmaReference`

| 字段 | 固定值/规则 |
| --- | --- |
| `fileUrl` | Homepage v1 Spec 文件 URL |
| `sectionNode` | `119:64` |
| `desktopHeroNode` | `119:176`，`1440×960` |
| `mobileHeroNode` | `119:461`，`390×844` |
| `designVersion` | `Homepage Visual System v1.3.1 — FINAL` |

### `VisualReviewRecord`

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `referenceId` | string | locale + viewport + story/state |
| `nodeId` | string | Figma 来源节点 |
| `viewport` | width/height | 与节点/场景一致 |
| `referenceSha256` | string | 设计导出指纹 |
| `actualSha256` | string | 浏览器截图指纹 |
| `overlayPath` / `diffPath` | repo-relative path | 只作验收证据，不进生产 runtime |
| `reviewStatus` | `pending \| approved \| rejected` | 人工视觉判断 |
| `reviewNotes` | string[] | 必须记录 FR-030 任一失败 |

Figma 对照用于批准首版实现；获批浏览器截图再成为 Playwright golden。浏览器 golden 通过不能取代
Figma 对照记录。
