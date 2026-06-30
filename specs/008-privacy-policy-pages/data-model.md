# 数据模型：隐私政策页面

**功能**：隐私政策页面  
**日期**：2026-06-30  
**范围**：前端静态内容、SEO 页面组、footer 入口、Figma 设计引用

## Locale

站点支持的语言枚举。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `locale` | enum | 是 | `zh-Hant`、`zh-Hans`、`en` |
| `htmlLang` | string | 是 | 页面 `<html lang>` 值，与 `locale` 一致 |
| `pathPrefix` | string | 是 | `/zh-hant/`、`/zh-hans/`、`/en/` |
| `displayName` | string | 是 | 语言自身名称，仅首页语言切换使用；隐私页不显示 |

**规则**：任何新增用户可见文本必须覆盖三个 locale。

## PrivacyPolicyPage

三语隐私政策页面的页面级模型。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `pageId` | string | 是 | 固定为 `privacy` |
| `locale` | Locale | 是 | 当前页面语言 |
| `path` | string | 是 | `/zh-hant/privacy/`、`/zh-hans/privacy/`、`/en/privacy/` |
| `title` | localized string | 是 | 页面 H1 与 SEO title 可复用同一语义，但 SEO title 可加品牌名 |
| `description` | localized string | 是 | 首屏范围说明与 SEO description 的来源 |
| `lastUpdated` | date string | 是 | 政策更新日期，格式 `YYYY-MM-DD` |
| `summaryCards` | SummaryCard[] | 是 | 固定 4 项 |
| `sections` | PolicySection[] | 是 | 固定 5 章 |
| `contactEmail` | string | 是 | `hezhenyu966@gmail.com` |
| `showLanguageSwitcher` | boolean | 是 | 固定为 `false` |
| `returnHomeHref` | string | 是 | 当前语言首页路径 |

**状态转换**：

1. 用户访问任一隐私页 URL。
2. 前端根据当前路径解析 `pageId=privacy` 与 `locale`。
3. 页面渲染对应语言内容、SEO 元信息和当前语言首页返回链接。
4. Header 不显示语言切换控件。
5. Footer 隐私入口仍存在，但指向当前页面自身。

**验证规则**：

- `path` 必须以 `/privacy/` 结尾，且不能是首页 canonical。
- `showLanguageSwitcher` 必须为 `false`。
- 三个 locale 的章节数量、摘要卡数量和语义顺序一致。
- 页面不依赖运行时 HTTP 请求才能完整展示政策内容。

## PrivacyPolicyContent

隐私政策正文内容模型。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `metadata.version` | string | 是 | 内容版本，例如 `2026-06-30` |
| `metadata.lastUpdated` | string | 是 | 对用户显示的更新日期 |
| `metadata.contactEmail` | string | 是 | 联系邮箱 |
| `hero.eyebrow` | localized string | 是 | 小标题，例如“私隱政策” |
| `hero.title` | localized string | 是 | 页面主标题 |
| `hero.lead` | localized string | 是 | 范围说明 |
| `summaryCards` | SummaryCard[] | 是 | 4 个摘要卡 |
| `sections` | PolicySection[] | 是 | 5 个正文章节 |

**内容边界**：

- 必须说明网站与 Android App 都适用。
- 必须说明不建立账号身份、不做广告追踪、不出售资料。
- 必须说明功能必需信息包括路线、站点、查询条件、设备权限状态、GPS 坐标或通知/语音提醒相关设置。
- 必须说明 Citybus、DATA.GOV.HK、Google Geocoding API。
- 必须说明网站在线试用查询的短期服务日志用途。
- 不写 Android 备份/设备迁移。
- 不写钱包包名检查、支付 provider 细节。

## SummaryCard

首屏摘要卡模型。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | enum | 是 | `no-account-identity`、`no-ads-sale`、`device-first-saved-routes`、`external-services-as-needed` |
| `title` | localized string | 是 | 卡片标题 |
| `description` | localized string | 是 | 卡片说明 |
| `order` | integer | 是 | 1 到 4 |

**排序规则**：按 `order` 升序渲染，三语顺序一致。

## PolicySection

隐私正文分节模型。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | enum | 是 | `scope`、`what-we-do-not-collect`、`functional-processing`、`third-party-services`、`your-choices` |
| `title` | localized string | 是 | 章节标题 |
| `paragraphs` | localized string[] | 是 | 段落，至少 1 条 |
| `bullets` | localized string[] | 否 | 需要列表时使用 |
| `requiredFacts` | string[] | 是 | 实现和评审用事实标签，不直接显示 |
| `order` | integer | 是 | 1 到 5 |

**章节事实要求**：

- `scope`：网站、Android App、Google Play/App 隐私 URL。
- `what-we-do-not-collect`：无账号身份、无广告追踪、无出售。
- `functional-processing`：路线、站点、查询、GPS、通知监测、语音提醒、本地收藏路线。
- `third-party-services`：Citybus、DATA.GOV.HK、Google Geocoding API、短期服务日志。
- `your-choices`：删除收藏路线、撤销定位或通知权限、停止通知/语音提醒、清理网站数据、邮件联系。

## SeoPageGroup

SEO 页面组模型。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `pageId` | enum | 是 | `home` 或 `privacy` |
| `defaultLocale` | Locale | 是 | 默认 `zh-Hant` |
| `locales` | object | 是 | 每个 locale 一份 SEO 配置 |
| `alternateLinks` | object | 是 | 当前页面组的三语 hreflang |
| `xDefault` | string | 是 | 页面组默认 URL |
| `sitemapPriority` | number | 是 | sitemap 优先级 |
| `changefreq` | string | 是 | sitemap 更新频率 |

**Privacy locale SEO 字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `path` | string | 当前语言隐私页路径 |
| `canonical` | string | `https://www.busiscoming.com/{locale}/privacy/` |
| `title` | string | 当前语言独立标题 |
| `description` | string | 当前语言独立描述 |
| `ogTitle` | string | Open Graph 标题 |
| `ogDescription` | string | Open Graph 描述 |
| `twitterTitle` | string | Twitter Card 标题 |
| `twitterDescription` | string | Twitter Card 描述 |

**验证规则**：

- `privacy` 页面组的三个 canonical 必须互不相同，且都指向 `/privacy/`。
- `privacy` 页面组的 hreflang 只能互指三语隐私页，不能混入首页。
- `home` 页面组继续互指三语首页。
- sitemap 至少包含 6 个可索引 URL：3 个首页、3 个隐私页。

## FooterPrivacyLink

footer 隐私入口模型。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `locale` | Locale | 是 | 当前页面语言 |
| `label` | localized string | 是 | `zh-Hant` 使用“私隱政策” |
| `href` | string | 是 | 当前语言隐私页路径 |
| `placement` | enum | 是 | 固定为 `footer` |

**规则**：

- 首页 footer 显示当前语言隐私链接。
- 隐私页 footer 可显示同一链接，但不得出现语言切换控件。
- 不在主导航或 FAQ 中新增入口。

## FigmaDesignReference

UI 设计引用模型。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `fileUrl` | string | 是 | 目标 Figma 文件 URL |
| `pageName` | string | 是 | `Privacy Policy Pages - 008` |
| `nodeNames` | string[] | 是 | 关键节点名称 |
| `nodeIdsResolved` | boolean | 是 | 真实 node ID 是否已补录 |
| `source` | enum | 是 | `figma-file` 或 `local-plugin-fallback` |

**关键节点**：

- `Desktop 1440 / Privacy Policy Page`
- `Mobile 390 / Privacy Policy Page`
- `Footer Privacy Link States`
- `SEO Hreflang Notes`
- `Spec Notes`

## 不变量

1. 隐私页是可索引页面，不能 `noindex`。
2. 隐私页不显示语言切换。
3. 隐私页内容不可只覆盖单一语言。
4. 隐私页不新增服务端 HTTP API。
5. 隐私页不要求 Android App 同步发版。
6. footer 是唯一新增站内入口。
