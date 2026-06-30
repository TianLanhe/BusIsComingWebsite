# 隐私政策三语文案审校记录

**功能**：隐私政策页面  
**日期**：2026-06-30  
**范围**：`/zh-hant/privacy/`、`/zh-hans/privacy/`、`/en/privacy/`

## 实现边界

- 本轮只修改 BusIsComing 网站，不修改 Android App、后端 HTTP API、OpenAPI 源文件或服务端 DDD 目录。
- 隐私页内容同时覆盖 BusIsComing Android App 和 `busiscoming.com` 官方网站。
- 默认公开隐私政策 URL 为 `https://www.busiscoming.com/zh-hant/privacy/`。
- 隐私页不显示语言切换控件，语言由 URL 决定。

## 初始审校检查项

| 语言 | 语气要求 | 检查项 |
|------|----------|--------|
| `zh-Hant` | 香港实用书面语 | 使用“私隱政策”“抵站時間”等香港交通语境，不直接复制简体字面表达 |
| `zh-Hans` | 自然简体中文 | 清楚说明 App 与网站范围，避免繁体词形残留 |
| `en` | 克制产品英语 | 使用自然、简洁的产品政策表达，不逐句搬运中文句式 |

## 必须披露

- 页面适用于 BusIsComing Android App 和官方网站。
- 不建立账号身份资料、不做广告追踪、不出售资料。
- 收藏路线和常用起终点以设备本机保存为主。
- 网站在线试查会处理起点、目的地和必要查询资料，并产生短期服务日志用于排障、稳定性和滥用防护。
- Citybus、DATA.GOV.HK 和 Google Geocoding API 需要明确点名。
- 使用当前位置或地址解析时，GPS 坐标可能发送给 Google Geocoding API。
- 通知监测和语音提醒围绕 ETA 或路线提醒运作。
- 用户可删除 App 内保存路线、撤回系统权限、停止通知监测、清除浏览器网站数据或联系开发者。

## 不写入用户可见正文

- Android 系统备份。
- 设备迁移。
- 微信、Alipay、AlipayHK package 检查或跳转。
- 数据库字段级枚举。
- 服务日志固定保留天数。

## 最终审校结论

- `zh-Hant` 已使用“私隱政策”“抵站時間”“交通資料”等香港实用书面语，未直接复制简体表达。
- `zh-Hans` 已使用自然简体中文，标题、摘要卡、正文五章和 footer 入口完整。
- `en` 已使用克制产品英语，说明 App 与网站范围、功能必需信息、外部服务和用户选择，未逐句搬运中文。
- 用户可见正文未主动提及 Android 备份、设备迁移、微信、Alipay、AlipayHK package 检查或跳转。
- 已通过 `npm run test -- i18n-completeness.test.tsx content-contract.test.ts seo-routing.test.tsx privacy-policy-page.test.tsx`、`npm run build` 和 `npm run test:e2e -- privacy-policy-pages.spec.ts homepage-sections.spec.ts`。
- 桌面和手机视觉截图已保存到 `specs/008-privacy-policy-pages/visual-review/`。
