# 本地化指南

本文定义 BusIsComing Website 的三语内容、locale 路由、第三方动态数据和回退规则。用户可见文字必须支持 `zh-Hant`、`zh-Hans`、`en`，但三种语言需要按目标读者独立表达，不能只做逐句翻译或繁简转换。

## Locale 与路径

| Locale | 公开首页 | 隐私政策 | Citybus `l` |
| --- | --- | --- | --- |
| `zh-Hant` | `/zh-hant/` | `/zh-hant/privacy/` | `0` |
| `zh-Hans` | `/zh-hans/` | `/zh-hans/privacy/` | `2` |
| `en` | `/en/` | `/en/privacy/` | `1` |

`frontend/src/content/types.ts` 中的 `Locale` union、`frontend/src/content/locales.ts` 和 `seoPages.json` 是前端 locale/path 的代码来源。新增页面时必须同时补齐三种路径、canonical、alternate link 和内容。

## 当前选择行为

当前实现按以下顺序确定页面语言：

1. URL 已带合法 locale segment 时，URL 优先。
2. 无 locale segment 且 React 应用实际接管请求时，读取 `busiscoming.locale`；无有效值时再按浏览器语言检测。
3. 语言切换会写入 localStorage，并保留当前页面类型、query 和 hash 后更新 URL。
4. localStorage 在隐私模式或安全限制下不可用时，切换仍在当前内存会话生效。

生产 Caddy 和 Vite 根路径当前直接跳到 `/zh-hant/`，因此直接访问 `/` 时不会经过浏览器语言检测。隐私页当前也隐藏 header 语言切换器。这两点与 constitution 中“优先尊重浏览器语言”和“语言切换入口必须可发现”的目标存在差距；文档不把它们描述为已合规。修改这些行为需要单独更新实现、SEO、测试和对应 feature spec。

## 三语表达

### `zh-Hant`

- 使用香港实用书面语，清楚、自然、可信。
- 优先使用“城巴”“路線”“車費”“抵站時間／ETA”“私隱”“下載”等香港产品页面习惯。
- 避免机械套用简体句式，也不要过度口语化或写成政府公告。
- 交通来源事实、路线号和官方字段保持准确，不为了文风改写。

### `zh-Hans`

- 使用自然简体中文，不只把繁体字符转换为简体。
- 选择内地用户能理解、同时不改变香港交通含义的表达。
- Citybus、香港地点、路线号、HK$ 和官方来源名称保持原义。

### `en`

- 使用自然、克制、简短的英语产品表达。
- 优先主动语态和直接动词，避免逐字搬运中文语序。
- 不用夸张营销词，也不写成法规或内部工程说明。
- 状态文案应告诉用户当前发生什么和可以做什么，例如 “temporarily unavailable”，而不是暴露后端异常。

## 不翻译或谨慎处理的术语

| 概念 | 建议表达 |
| --- | --- |
| 产品名 | `BusIsComing` |
| 运营商/来源 | `Citybus`；中文上下文可写“城巴 / Citybus” |
| 抵站时间 | `ETA`，必要时配合“抵站时间／到站时间”解释 |
| 货币 | `HK$` 或 `HKD`，按 UI/协议语境选择 |
| 安装包 | `Android APK` |
| 匿名指标 | `PV`、`UV`，文案必须说明 UV 不等同自然人数 |
| 技术协议 | OpenAPI、HTTP、SQLite、Figma 保持原名 |
| 路线号、站名、用户输入 | 保持来源值，不机器翻译 |

网站中的“在线查询”是基础 Citybus route trial，不是完整行程规划。中文“行程”“路线”和英文 journey/route 不可随意互换，以免把起终点配置、乘车方案和完整规划混为一谈。

## 内容位置

- 首页结构和核心 content：`frontend/src/content/homepageContent.ts`、`sectionsContent.ts`
- 查询说明：`frontend/src/content/onlineQueryDemo.ts`
- 状态与无障碍文案：`frontend/src/content/uiCopy.ts`
- 隐私政策：`frontend/src/content/privacyPolicyContent.ts`
- 隐私政策无 JavaScript fallback：`frontend/scripts/generate-locale-pages.mjs`
- SEO：`frontend/src/content/seoPages.json`
- Pulse Dashboard：`frontend/src/monitoring/content/copy.ts`

新增或改写的用户可见字符串应进入对应 content 资源，不能继续散落在 JSX/TSX 中。允许的例外仅包括协议字段、第三方原文、代码标识符和测试 fixture；即便如此，也不能直接把内部英文错误显示给用户。

当前隐私页仍有少量返回链接、日期和联系 label 直接在 `PrivacyPolicyPage.tsx` 中按 locale 分支，且正文同时维护 React content 与构建期 fallback 两份表达。修改隐私政策时必须同步两处正文与这些 label；后续重构可统一来源，但在代码真正合并前不能把它描述成单一内容源。

## 动态数据与外部来源

### Citybus

- 同一请求的地点、路线和 P2P stop map 使用同一 locale mapping。
- 整体请求失败时不得换另一语言重试，也不得显示 mock 或旧语言 cache。
- Citybus 返回的路线号、地点和原始事实保持来源语义；UI label 由当前 locale content 提供。

### DATA.GOV.HK 站名

站名字段回退顺序：

| Locale | 字段顺序 |
| --- | --- |
| `zh-Hant` | `name_tc → name_en → name_sc` |
| `zh-Hans` | `name_sc → name_tc → name_en` |
| `en` | `name_en → name_tc → name_sc` |

这是同一成功响应内的单字段回退，不是跨语言重新请求。官方字段都缺失或请求失败时，路线预览可以保留 Citybus 原站名；不得隐藏整条路线或阻塞 ETA。

### ETA 与数值

- ETA 状态由结构化 domain value 表达，再由前端按当前 locale 格式化。
- `waitMinutes`、车费、耗时、步行距离和 route number 不应提前拼成单一语言字符串进入领域层。
- `arriving`、`waiting`、`unavailable` 等状态在三语中语义一致，但句子可独立组织。
- 日期、时间和统计范围必须明确 Hong Kong 时区边界，不能依赖浏览器猜测业务日期。

### 用户和第三方内容

- 用户输入的地点关键字、第三方返回的地名、路线号、版本号和邮箱不翻译。
- fixture 保留上游原文，用于 parser 回归；不要为了统一文风修改。
- 第三方原文只在必要范围展示，项目自写说明和错误提示必须本地化。

## 语言切换后的状态

- 首页语言切换必须保持当前 page group；隐私页切换不能返回首页。
- 已选择起终点且已有路线时，当前实现会用新 locale 重新查询路线和 ETA，而不是只翻译旧动态结果。
- 如果同一选择的语言刷新失败，保留上次成功路线，并同时提示刷新失败和仍显示旧结果。
- 快速输入、交换地点或语言切换产生的过期异步响应必须通过 request generation/sequence 丢弃，不能覆盖当前语言状态。

## SEO 与静态回退

三语首页和隐私页必须各自拥有：

- 正确 `<html lang>`；
- 自己的 title、description、Open Graph 和 Twitter 文案；
- canonical；
- `zh-Hant`、`zh-Hans`、`en` 与 `x-default` alternate link；
- 无 JavaScript 时仍能读取的隐私政策 fallback。

SEO 文案是用户可见内容，也必须进行独立语气审校。修改 content 后检查 `seoPages.json` 和 `sitemap.xml` 是否仍准确。

## 三语审校流程

1. 先确认事实来源和用户任务，不从一种语言直接复制成另外两种。
2. 为三种语言分别写出完整句子。
3. 检查术语、Citybus 范围、数字和状态语义一致。
4. 检查 `zh-Hant` 香港用语、`zh-Hans` 自然表达和 `en` 产品语气。
5. 在 390px 与 1440px 检查换行、按钮、表单、错误、截图 alt 和 Dashboard 图表说明。
6. 运行 i18n/内容契约测试与构建。

常用验证：

```bash
npm --prefix frontend run test
npm --prefix frontend run build
npm --prefix frontend run test:e2e
npm --prefix frontend run test:e2e:monitor
```

仅运行单元测试不能证明文字在真实布局中可读；仅查看截图也不能证明键盘、辅助技术和状态切换完整。
