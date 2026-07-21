# 监控面板繁中与英文文案审校

**审校日期**：2026-07-22  
**范围**：七个工作区、全局筛选、指标与图表、事件/访客调查、五类状态、匿名统计隐私边界

## 审校结论

- `zh-Hant` 使用香港产品语境：采用“主頁瀏覽”“巴士路線試查”“工作階段”“安裝檔”“私人監聽器”等表达，避免把简体字面替换当作本地化。
- `en` 使用简洁产品表达：例如 `Traffic & trial`、`Unique browsers (UV)`、`Download responses only; this does not mean installation`，没有逐句复制中文语序。
- PV/UV、下载与会话口径三语一致：UV 始终表示匿名浏览器标识，不声称是真实人数；下载只表示请求或成功响应，不表示安装完成；会话均为连续 30 分钟无活动边界。
- 隐私事实三语一致：Visitor ID 仅由一年有效的第一方 HttpOnly Cookie 携带，不进入 query/body；不记录 IP、完整 UA/Referrer、查询词、地点、坐标或 token；已知机器人没有统计明细。
- 故障语义三语一致：普通查询失败保留筛选并只允许手动重试；数据库不可用明确说明公开主页、试查与 APK 下载不受影响。

## 重点抽查

| 语义 | `zh-Hant` | `en` | 结论 |
|------|-----------|------|------|
| 总览 | 監控總覽 | Monitoring overview | 标题短而明确 |
| 路线范围 | 巴士路線試查 | Route trial | 不扩张为完整行程规划 |
| UV | 獨立瀏覽器 UV | Unique browsers (UV) | 不暗示自然人 |
| 下载 | 只代表下載回應，不代表完成安裝 | Download responses only; this does not mean installation | 不暗示安装完成 |
| 访客检索 | 使用完整匿名 ID 調查工作階段路徑 | Investigate session paths with an exact anonymous ID | 强调精确匿名 ID 与调查用途 |
| 私有入口 | 只可經 SSH 隧道存取 | SSH tunnel access only | 不暗示公网入口 |
| 数据库故障 | 統計資料庫暫時無法使用 | Analytics storage is unavailable | 与普通查询失败区分 |

## 自动化证据

- `copy.test.ts` 比较三语 key 集合、事件标签、隐私和下载口径。
- `MonitoringI18nProvider.test.tsx` 覆盖浏览器默认语言、香港繁中 fallback 和持久化切换。
- `responsive-locales.spec.ts` 在桌面和手机遍历三语七个工作区，并验证筛选、hash、visitor 调查上下文与语言持久化保持。

审校未发现需要保留机械直译的文案；技术标识（PV、UV、P50、P95、Android、iOS、SQLite、operationId）按规格保留原文。
