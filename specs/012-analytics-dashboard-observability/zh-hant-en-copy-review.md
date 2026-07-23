# 012 三语文案复核

**复核日期**：2026-07-24
**范围**：`frontend/src/monitoring/content/copy.ts` 中本功能新增的导航、两步日期、同期比较、P50/P95、SLI、流量六项、系统状态与访客调查文案。

## 审校结论

| 语言 | 复核重点 | 结论 |
|---|---|---|
| `zh-Hant` | 香港交通产品书面语、日期和监控术语 | 采用「主頁」「試查」「裝置」「數據」「回應時間」等香港常用写法；「只可經 SSH 隧道存取」清楚限定私有用途，不把 Dashboard 误写成公众功能。 |
| `zh-Hans` | 术语与现有产品一致 | 使用「路线试查」「独立浏览器 UV」「香港日历日期」「公开网站功能不受影响」，保持事实和隐私边界。 |
| `en` | 自然、克制的产品英语 | 采用 `Traffic & trial`、`Custom dates`、`No previous-period data`、`Monitoring data cannot be read right now`；避免逐字翻译或过度营销。 |

三份文案均从同一 `CopyKey` 类型派生，`copy.test.ts` 会校验 key 覆盖；这只保证完整性，以上人工复核确认语气不是字形转换或逐句直译。

## 易误解/长文案抽查

| 文案键 | `zh-Hant` | `en` | 验证结果 |
|---|---|---|---|
| `dateStartFuture` | 開始日期不可遲於香港今日。 | The start date cannot be after today in Hong Kong. | 明确时区边界；日期控件在 390px 下换行但不截断。 |
| `comparisonZeroBaseline` | 上期為零，顯示絕對變化 | Previous period was zero; showing absolute change | 说明零基线，不以百分比伪造趋势；指标卡在 390px 下可换行。 |
| `storageUnavailableBody` | 匿名監控數據目前無法讀取，公開網站、巴士路線試查及 APK 下載不受影響。 | Monitoring data cannot be read right now. The public site, route trial, and APK download remain available. | 解释 fail-open，未泄露内部故障；错误状态在桌面和手机均完整可读。 |
| `visitorTransport` | 公開採集使用 HttpOnly Cookie 識別匿名瀏覽器；私有訪客調查只經 `X-Analytics-Visitor-ID` header 查詢。 | Public collection uses an HttpOnly cookie; private visitor investigation uses the `X-Analytics-Visitor-ID` header only. | 明确两个边界：私有 ID 不进 query/body/log，且不显示 Cookie、header 或 IP 值。 |
| `latencyZeroBaseline` | 上期為零，只顯示絕對變化 | Previous period was zero; absolute change shown | 保留时延单位和比较语义；端点比较卡在窄屏容器内局部滚动。 |

## 截断与一致性检查

- `npm --prefix frontend run test:e2e:monitor` 在 `monitor-desktop-1440` 与 `monitor-mobile-390` 下覆盖三语七页、日期流程、比较/SLI、系统和访客；断言 `scrollWidth === innerWidth`，保存相应截图。
- `responsive-locales.spec.ts` 验证语言切换后已应用日期、未提交日期第二步、筛选、比较、P50 和访客对象均保留；长状态文案不会因语言切换丢失。
- 视觉回归只检查文案的可读性和响应式，Figma 中的示例数字不会成为任何语言或错误状态的回退值。
