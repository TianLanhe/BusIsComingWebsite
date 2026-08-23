# 014 三语文案审校记录

审校日期：2026-08-24

## 审校结论

| 范围 | zh-Hant | zh-Hans | English | 产品事实 |
| --- | --- | --- | --- | --- |
| Header / Hero | 香港实用书面语；固定五标题与说明逐字保留 | 独立简体表达，不作机械字符转换 | 短句、主动语态、无夸张承诺 | 总体定位统一为香港巴士路线规划与导航 App |
| 五故事 | 使用“搜尋、行程、沿途、班次、出門” | 使用“搜索、行程、沿途、班次、出门” | 使用 Search, Trips, Journey, Arrivals, Leave | 第四故事仅说明符合条件的联营路线到站时间，不扩大为完整多运营商规划 |
| 路线试查 | 使用“路線、車費、耗時、步行、候車” | 使用“路线、车费、耗时、步行、候车” | 使用 Route, Fare, Time, Walk, Wait | 网站试查当前使用 Citybus 路线数据；不改变既有 API |
| 下载 | 使用“下載、暫時未能下載、安裝” | 使用“下载、暂时无法下载、安装” | 使用 Download, temporarily unavailable, install | 版本、大小、日期来自 metadata；Android 7.1+ 为静态审核事实 |
| FAQ / 收尾 | 使用“私隱、聯絡、返回頁首” | 使用“隐私、联系、返回顶部” | 克制解释限制与下一步 | 不承诺 iPhone 版本，不把网站试查等同 App 导航 |
| SEO | 不使用 Citybus-only 总体定位 | 同左 | A Hong Kong bus route planner and navigation app | 具体运营商名称只出现在真实覆盖说明中 |

## 禁止项复核

- 用户可见文案不包含本机路径、Android 工程名、临时目录、SHA-256、versionCode 或内部类名。
- 已删除“功能 01 / SEARCH”、证据标签、BUILD、虚假安装进度和“目前版本可下载”。
- 路线卡不显示“直达／转乘”，耗时与步行直接写文字。
- 三语字符串集中在 content 层；协议字段、测试 fixture 和产品名除外。

结论：当前 `homepageStories.ts`、`homepageContent.ts`、`uiCopy.ts`、`seoPages.json` 的公开表达通过本轮三语与能力边界复核。
