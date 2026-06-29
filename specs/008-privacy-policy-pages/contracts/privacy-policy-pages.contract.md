# 契约：隐私政策页面

**功能**：隐私政策页面  
**日期**：2026-06-30  
**范围**：前端页面、内容、SEO、footer 入口、静态生成

## 1. 页面路由契约

| URL | 页面语言 | 页面类型 | 可索引 | canonical |
|-----|----------|----------|--------|-----------|
| `/zh-hant/privacy/` | `zh-Hant` | `privacy` | 是 | `https://www.busiscoming.com/zh-hant/privacy/` |
| `/zh-hans/privacy/` | `zh-Hans` | `privacy` | 是 | `https://www.busiscoming.com/zh-hans/privacy/` |
| `/en/privacy/` | `en` | `privacy` | 是 | `https://www.busiscoming.com/en/privacy/` |

**不变量**：

- 三个隐私页都必须能通过静态构建产出 `index.html`。
- 根目录、三语首页和既有锚点导航行为不因隐私页新增而回退。
- 隐私页不得 canonical 到首页。
- 隐私页不得设置 `noindex`。

## 2. 语言契约

| 场景 | 要求 |
|------|------|
| 隐私页正文 | `zh-Hant`、`zh-Hans`、`en` 完整覆盖 |
| 隐私页 SEO | 三语 title、description、OG、Twitter 信息完整覆盖 |
| 隐私页语言切换 | 不显示语言切换控件 |
| App 跳转 | 由 App 选择目标 URL；网页内部不提供语言切换 |
| `zh-Hant` 文案 | 使用香港本地“私隱政策”等自然表达 |
| `en` 文案 | 使用自然克制的英语产品表达，不逐句直译 |

**不变量**：

- 不允许只复制 `zh-Hant` 到 `zh-Hans` 或 `en`。
- 不允许在隐私页 Header、正文或 footer 添加语言切换控件。

## 3. 内容契约

### 3.1 摘要卡

必须存在 4 个摘要卡，顺序固定：

1. 不建立账号身份
2. 不做广告追踪或出售资料
3. 收藏路线以设备本地为主
4. 按功能需要连接外部服务

### 3.2 正文章节

必须存在 5 个章节，顺序固定：

1. 适用范围
2. 我们不收集什么
3. 功能必需的信息如何处理
4. 第三方服务
5. 你的选择与联系我们

### 3.3 必须披露的事实

- 页面适用于 BusIsComing 网站和 Android App。
- 不建立账号身份，不要求注册登录。
- 不做广告追踪，不出售资料。
- 路线、站点、查询条件、设备权限状态、GPS 坐标等信息只为功能需要处理。
- Google Geocoding API 在需要地点解析时可能接收 GPS 坐标。
- Citybus 和 DATA.GOV.HK 是路线或交通数据来源。
- 网站在线试用查询会产生短期服务日志，用于排障、稳定性和滥用防护。
- App 的收藏路线等偏好以设备本地为主。
- 通知监测和语音提醒只围绕用户选择的路线或站点功能运作。
- 用户可以删除收藏路线、撤销定位或通知权限、停止通知或语音提醒、清理网站数据，并通过邮箱联系。

### 3.4 不应写入的内容

- Android App 代码改动说明。
- Android 备份或设备迁移说明。
- WeChat、Alipay、AlipayHK 包名检测或支付 provider 细节。
- 数据库字段级枚举。
- “不提供法律建议”等非必要免责声明。
- 服务日志固定天数。

## 4. SEO 契约

### 4.1 页面组

必须维护至少两个 SEO 页面组：

| pageId | 范围 | locale URL |
|--------|------|------------|
| `home` | 三语首页 | `/zh-hant/`、`/zh-hans/`、`/en/` |
| `privacy` | 三语隐私页 | `/zh-hant/privacy/`、`/zh-hans/privacy/`、`/en/privacy/` |

### 4.2 hreflang

`privacy` 页面组内，每个 locale 页面必须输出：

- `hreflang="zh-Hant"` 指向 `https://www.busiscoming.com/zh-hant/privacy/`
- `hreflang="zh-Hans"` 指向 `https://www.busiscoming.com/zh-hans/privacy/`
- `hreflang="en"` 指向 `https://www.busiscoming.com/en/privacy/`
- `hreflang="x-default"` 指向 `https://www.busiscoming.com/zh-hant/privacy/`

`home` 页面组的 hreflang 保持指向三语首页，不得与 privacy 页面组混用。

### 4.3 sitemap

`frontend/public/sitemap.xml` 必须包含至少 6 个 URL：

- `https://www.busiscoming.com/zh-hant/`
- `https://www.busiscoming.com/zh-hans/`
- `https://www.busiscoming.com/en/`
- `https://www.busiscoming.com/zh-hant/privacy/`
- `https://www.busiscoming.com/zh-hans/privacy/`
- `https://www.busiscoming.com/en/privacy/`

每个三语页面组建议带 `xhtml:link` alternate 标签，且首页与隐私页分开互链。

## 5. Footer 入口契约

| 页面 | 要求 |
|------|------|
| `/zh-hant/` | footer 显示“私隱政策”，指向 `/zh-hant/privacy/` |
| `/zh-hans/` | footer 显示“隐私政策”，指向 `/zh-hans/privacy/` |
| `/en/` | footer 显示“Privacy Policy”，指向 `/en/privacy/` |
| 三个隐私页 | footer 可保留当前语言隐私链接，但不显示语言切换控件 |

**不变量**：

- 不新增主导航入口。
- 不新增 FAQ 入口。
- footer 入口应可被键盘聚焦并有清晰文本。

## 6. 静态生成契约

构建后必须存在：

```text
dist/zh-hant/index.html
dist/zh-hans/index.html
dist/en/index.html
dist/zh-hant/privacy/index.html
dist/zh-hans/privacy/index.html
dist/en/privacy/index.html
dist/sitemap.xml
```

隐私页 HTML 必须包含对应语言的 title、description、canonical 和 hreflang 元素。

## 7. 非目标契约

本功能不得要求：

- 新增或修改后端 HTTP API。
- 修改 OpenAPI 3.1 YAML。
- 新增服务端 bounded context。
- 修改 Android App。
- 添加用户账号、登录、广告、分析 SDK 或隐私设置后台。

如实现中确实发现需要触碰上述范围，必须回到 spec/plan 重新确认。
