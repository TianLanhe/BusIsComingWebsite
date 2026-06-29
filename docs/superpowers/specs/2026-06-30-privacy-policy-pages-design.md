# 隐私政策页面设计

日期：2026-06-30

## 背景

BusIsComing 网站需要新增三语隐私政策页面，供官网访客阅读，并为未来 Android App 内“隐私政策”跳转和 Google Play Console 隐私政策 URL 提供稳定目标。本轮只修改网站，不修改 Android App。

页面需要覆盖 BusIsComing Android App 与 busiscoming.com 官方网站的资料处理说明。内容应准确反映当前 Android 主项目能力，并默认认为主项目代码能力与官网可下载 APK 能力保持一致。

## 已确认决策

- 新增页面为 `/zh-hant/privacy/`、`/zh-hans/privacy/`、`/en/privacy/`。
- 繁体标题使用“私隱政策”，简体使用“隐私政策”，英文使用 “Privacy Policy”。
- 页面首屏明确说明本政策适用于 Android App 及官方网站。
- 页面采用“摘要卡 + 正文分节”的结构。
- 隐私页不显示语言切换控件，语言由 URL 决定。
- 网站 footer 提供当前语言的隐私政策入口，主导航不增加隐私政策入口，FAQ 不新增隐私问题。
- 三个隐私页允许索引并进入 sitemap；每个页面有独立 canonical 与 privacy 页面组内的 hreflang。
- 未来 Android App 可按自身语言直接打开对应隐私页；本轮不改 App。
- 默认推荐给 Google Play Console 的隐私政策 URL 为 `https://www.busiscoming.com/zh-hant/privacy/`。

## 内容原则

页面要保持正式、清楚、克制，不写成营销页，也不写成冗长法律文本。内容重点是让用户快速理解 BusIsComing 会为了哪些功能处理哪些资料，以及用户可以如何控制这些行为。

隐私页不重复使用“完全不收集个人资料”这类绝对表述。页面需要更精确地说明：

- 不要求注册账号。
- 不收集姓名、电话、邮箱等账号身份资料。
- 不做广告追踪。
- 不出售数据。
- 不把数据用于直接营销。
- 为路线查询、当前位置、ETA、通知监测、网站试查和服务稳定性，会处理必要的路线、位置和查询资料。

## 首屏结构

首屏包含：

- 页面标题：`BusIsComing 私隱政策 / 隐私政策 / Privacy Policy`
- 适用范围说明：适用于 BusIsComing Android App 与 busiscoming.com 官方网站
- 最后更新日期
- 联系邮箱：`hezhenyu966@gmail.com`
- Android App 范围短句：覆盖路线查询、当前位置、ETA、通知监测与语音提醒
- 官网范围短句：覆盖产品介绍、Android APK 下载、基础城巴在线试查、语言偏好与联系入口

首屏摘要卡保留 4 个重点：

1. 不设账号身份资料
2. 不做广告追踪或出售数据
3. 路线资料以本机保存为主
4. 外部服务仅按功能使用

## 正文信息架构

正文控制在 5 个章节。

### 1. 适用范围

说明本政策覆盖 Android App 和官方网站。说明本轮只提供网站隐私页，不修改 Android App。

### 2. 我们如何处理资料

说明 Android App 会在设备本机保存常用路线和起终点信息，用于快速重开查询。不要做数据库字段级枚举。

说明官方网站基础城巴在线试查会处理用户选择或输入的起点、目的地和相关查询资料。网站会保存浏览器语言偏好。

说明通知监测用于展示 ETA 和路线提醒，语音提醒使用系统能力为 ETA 提醒服务。不要展开系统 TTS 技术细节。

### 3. 外部服务

明确点名：

- Citybus：路线查询时使用。
- DATA.GOV.HK：获取城巴 ETA 资料。
- Google Geocoding API：使用当前位置作为起点，或把 GPS 坐标转换成可读地址时，GPS 坐标可能发送给 Google Geocoding API。

不要把这些写成泛泛的“第三方服务”。用户应能明确知道哪些外部服务参与。

### 4. 保存、使用和安全

说明 BusIsComing 不运营自己的账号同步服务。

说明官方网站在线试查会产生短期服务日志，用于排错和服务稳定性，但用户可见文案不写死“7 天”。7 天保留期作为实现与验收时的内部事实依据保留。

说明网站与外部服务连接使用 HTTPS。说明不出售数据、不做广告追踪、不用于直接营销。

不主动提 Android 系统备份或设备迁移细节，避免页面过长。

### 5. 你的选择和联系我们

说明用户可以：

- 在 App 内删除已保存路线。
- 在 Android 系统设置中撤回定位或通知权限。
- 停止通知监测。
- 清除浏览器网站数据以移除网站语言偏好。
- 通过 `hezhenyu966@gmail.com` 联系开发者。

加入简短政策更新说明：如功能、服务或合规要求变化，政策可能更新，并在页面标示最后更新日期。

不写“不是法律意见”免责声明。

## 明确不纳入本页的内容

- 不提微信、Alipay 或 AlipayHK package 检查或跳转。
- 不提 Android 系统备份和设备迁移。
- 不做常用路线数据库字段级枚举。
- 不新增 FAQ。
- 不把隐私政策放入主导航。
- 不在隐私页提供语言切换控件。
- 不修改 Android App。

## 页面行为

首页 footer 增加当前语言隐私政策入口：

- 繁体首页 footer 指向 `/zh-hant/privacy/`
- 简体首页 footer 指向 `/zh-hans/privacy/`
- 英文首页 footer 指向 `/en/privacy/`

隐私页可复用网站 header/footer，但隐私页 header 需要隐藏语言切换控件。品牌入口和导航入口应返回当前语言首页或首页对应锚点，避免在隐私页点击无效锚点。

未来 Android App 如加入隐私政策入口，应由 App 根据当前语言直接打开：

- `zh-Hant` -> `https://www.busiscoming.com/zh-hant/privacy/`
- `zh-Hans` -> `https://www.busiscoming.com/zh-hans/privacy/`
- `en` -> `https://www.busiscoming.com/en/privacy/`

## SEO 与发现性

三个隐私页均应可被索引，使用 `index, follow`。

每个隐私页必须有独立标题、描述、canonical 和 Open Graph/Twitter 摘要。隐私页 canonical 指向自身。

隐私页的 hreflang 只在 privacy 页面组内互相指向：

- `zh-Hant` -> `/zh-hant/privacy/`
- `zh-Hans` -> `/zh-hans/privacy/`
- `en` -> `/en/privacy/`
- `x-default` -> `/zh-hant/privacy/`

sitemap 需要包含 3 个首页 URL 和 3 个隐私页 URL。首页 hreflang 组和隐私页 hreflang 组不能混在一起。

`robots.txt` 不需要修改，继续指向 sitemap。

## 验收要点

- `/zh-hant/privacy/`、`/zh-hans/privacy/`、`/en/privacy/` 均可直接访问。
- 三个页面分别显示对应语言内容。
- 隐私页首屏显示适用范围、最后更新日期、联系邮箱和 4 个摘要卡。
- 隐私页正文为 5 个章节，且包含已确认的 Citybus、DATA.GOV.HK、Google Geocoding API、通知监测、语音提醒、网站短期服务日志和用户选择说明。
- 隐私页不显示语言切换控件。
- 首页 footer 有当前语言隐私政策入口。
- 隐私页 canonical 和 hreflang 正确。
- sitemap 包含 6 个 URL，并包含对应 hreflang。
- 隐私页在桌面和手机下文本不溢出，层级清楚，视觉上是正式政策页而非营销页。
- 首页现有 SEO、根路径跳转和三语首页不受影响。

## 部署后的用户操作

部署后需要在 Google Search Console 中重新提交 `https://www.busiscoming.com/sitemap.xml`，并分别用 URL Inspection 检查三个隐私页。建议先执行“测试实际网址”，确认可抓取、可索引、canonical 正确后，再请求编入索引。

如后续需要填写 Google Play Console 隐私政策 URL，默认使用：

`https://www.busiscoming.com/zh-hant/privacy/`

如果审核或产品分发需要英文入口，也可以使用：

`https://www.busiscoming.com/en/privacy/`

## 待后续阶段处理

本设计确认后，再进入 Spec Kit specify 阶段，生成正式 feature spec。后续 plan/tasks/implement 阶段需要补齐页面实现、三语内容、SEO 生成、sitemap、测试和部署后检查清单。
