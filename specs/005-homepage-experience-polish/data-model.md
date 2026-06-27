# 数据模型：首页体验精修

## FeatureCarouselPage

首页首屏功能轮播中的一个功能页。

| 字段 | 类型 | 规则 |
|------|------|------|
| `id` | enum | 必须为 `favorite-citybus-routes`、`route-comparison`、`eta-details`、`predeparture-monitor` 之一 |
| `order` | number | 1-4，顺序固定 |
| `title` | LocalizedString | 必须包含 `zh-Hant`、`zh-Hans`、`en` |
| `description` | LocalizedString | 必须包含三语；`zh-Hant` 独立香港文案 |
| `gallery` | ScreenshotGroup | 至少 1 张图 |
| `autoCarouselEligible` | boolean | 必须为 true |
| `sourceReference` | string | 必须指向 Android 主项目事实来源或现有 spec |

### 状态转换

```text
idle -> auto-advancing -> paused-by-hover
idle -> auto-advancing -> paused-by-focus
idle -> auto-advancing -> dragging
dragging -> settled
settled -> auto-advancing
auto-advancing -> reduced-motion-manual
```

## ScreenshotGroup

归属于功能页的脱敏截图集合。

| 字段 | 类型 | 规则 |
|------|------|------|
| `featureId` | FeatureCarouselPage.id | 必须与父级功能页一致 |
| `defaultImageId` | string | 必须存在于 `images` |
| `images` | SanitizedScreenshotAsset[] | 至少 1 张 |
| `manualOnly` | boolean | 必须为 true |
| `visualMode` | enum | 本功能必须为 `stair-card-deck` |
| `allowThumbnailControls` | boolean | 必须为 false |

### 验证规则

- 单图时不得显示后方牌堆或更多截图暗示。
- 多图时只允许点击后方牌堆图片切换同场景主图；横向滑动或拖动只能切换功能场景。
- 后方牌堆图片桌面约 5 度旋转，手机可收敛到约 4 度；后方图片底部不得低于主图底部。
- 不得显示底部缩略图、胶片条、图片按钮组或上下堆叠。

## SanitizedScreenshotAsset

可展示的真实 App 脱敏截图。

| 字段 | 类型 | 规则 |
|------|------|------|
| `id` | string | 稳定唯一 |
| `assetPath` | string | 指向 `frontend/src/assets/app-screenshots/real/` |
| `order` | number | 同组内从 1 开始 |
| `isDefault` | boolean | 每组最多 1 张为 true |
| `alt` | LocalizedString | 不得包含真实地点、真实站名或真实路线号 |
| `desensitizationStatus` | enum | 前端展示必须为 `approved` |

## BrandLogoAsset

网站品牌 logo 资产。

| 字段 | 类型 | 规则 |
|------|------|------|
| `sourcePath` | string | 必须为 Android 项目 `mipmap-xxxhdpi/ic_launcher_foreground.png` 或等价 foreground 资源 |
| `outputPath` | string | 建议位于 `frontend/src/assets/brand/` |
| `backgroundRemoved` | boolean | 必须为 true |
| `transparent` | boolean | 必须为 true |
| `usesLauncherPlate` | boolean | 必须为 false |
| `placements` | string[] | 至少包含 `header`、`footer`，可包含 `favicon` |

### 验证规则

- Header/footer 不得继续使用 lucide 线框巴士作为品牌 logo。
- README 必须记录源文件和导出规则。
- 小尺寸下必须清晰；可调整安全边距，但不能恢复 launcher 背景。

## ContactEntry

导航和页脚中的联系入口。

| 字段 | 类型 | 规则 |
|------|------|------|
| `navLabel` | LocalizedString | `zh-Hant` 为「聯絡我們」，`zh-Hans` 为「联系我们」，`en` 为 `Contact Us` |
| `footerLabel` | LocalizedString | 联系开发者语义，不是支持/捐助语义 |
| `email` | string | 必须为 `hezhenyu966@gmail.com` |
| `href` | string | 必须为 `mailto:hezhenyu966@gmail.com` |

### 验证规则

- 用户可见 UI 不得出现 `feedback@busiscoming.local`。
- 用户可见 UI 不得出现旧的“支援我們 / 支持我们 / Support”联系语义。

## LocalizedCopyItem

任一用户可见字符串。

| 字段 | 类型 | 规则 |
|------|------|------|
| `key` | string | 对应内容对象或 UI copy 键 |
| `zh-Hant` | string | 香港实用书面语；不做简体直接转换 |
| `zh-Hans` | string | 自然简体中文 |
| `en` | string | 自然克制的英文产品表达；不做中文句式直译 |
| `scope` | enum | `navigation`、`hero`、`carousel`、`features`、`online-query`、`download`、`faq`、`footer`、`status`、`accessibility` |
| `reviewStatus` | enum | `pending`、`approved`、`needs-revision` |

### 验证规则

- 三语字段不能为空。
- `zh-Hant` 关键抽查不得等于 `zh-Hans` 的单纯字形转换。
- `en` 关键抽查不得采用中文句式直译；语气必须清楚、自然、可信，不过度口语化或官方严肃。
- Citybus / 城巴范围和排除项必须在关键说明中保留。

## VisualReviewEvidence

视觉验收证据。

| 字段 | 类型 | 规则 |
|------|------|------|
| `viewport` | enum | `desktop-1440` 或 `mobile-390` |
| `locale` | Locale | 至少覆盖主要繁体视图，必要时覆盖英文长文案 |
| `state` | enum | `carousel-auto`、`carousel-scene-drag`、`same-scene-deck-click`、`brand-contact`、`reduced-motion` |
| `path` | string | 保存到 `specs/005-homepage-experience-polish/visual-review/` |
| `checks` | string[] | 记录牌堆基线、可点击露出面积、无缩略图、无编号、无箭头、logo、邮箱、无重叠等结论 |

## Relationships

- `FeatureCarouselPage` 1:1 `ScreenshotGroup`
- `ScreenshotGroup` 1:N `SanitizedScreenshotAsset`
- `HomePageContent` 1:N `LocalizedCopyItem`
- `Header` 和 `FooterContact` 共享 `BrandLogoAsset`
- `Header` 和 `FooterContact` 共享 `ContactEntry`
- `VisualReviewEvidence` 验证 `FeatureCarouselPage`、`BrandLogoAsset` 和 `ContactEntry`
