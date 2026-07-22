# 数据模型：监控 Dashboard 体验修复

**日期**：2026-07-23

本功能不新增持久化表，也不改变匿名事件明细 schema。以下模型均为日期选择、查询聚合或展示读模型；SQLite 继续只保存 010 定义的匿名事件明细。

## 1. DateRangeSelection（前端选择模型）

表示维护者在全局筛选器中作出的稳定选择，不直接作为请求参数发送。

| 字段 | 类型 | 规则 |
|------|------|------|
| `kind` | `preset \| custom` | 决定使用预设天数还是本地日期 |
| `presetDays` | `7 \| 30 \| 90 \| null` | `kind=preset` 时必填 |
| `startDate` | `YYYY-MM-DD \| null` | `kind=custom` 时必填，香港本地日期 |
| `endDate` | `YYYY-MM-DD \| null` | `kind=custom` 时必填，包含语义 |

### 校验

- 自定义开始、结束日期必须是有效日历日期。
- `startDate <= endDate <= hongKongToday`。
- 不合法时产生 `DateRangeValidationError`，不生成请求范围。

## 2. ResolvedDateRange（前端请求模型）

每次筛选、手动刷新或自动刷新时由 `DateRangeSelection + now` 求值。

| 字段 | 类型 | 规则 |
|------|------|------|
| `from` | RFC 3339 instant | 香港开始日 00:00，包含 |
| `to` | RFC 3339 instant | 半开区间上界；包含今天时为求值时刻，历史结束日为下一日 00:00 |
| `displayStartDate` | `YYYY-MM-DD` | 控件展示，不随浏览器时区变化 |
| `displayEndDate` | `YYYY-MM-DD` | 控件展示，首尾日期包含 |
| `includesToday` | boolean | 控制刷新时是否推进 `to` |
| `dayCount` | positive integer | 实际日期格数量，预设分别为 7/30/90 |
| `comparisonFrom` | RFC 3339 instant | 开启比较时为 `from - (to-from)` |
| `comparisonTo` | RFC 3339 instant | 开启比较时等于当前 `from` |

### 状态转换

```text
preset/custom selection
        ↓ resolve(now)
valid ResolvedDateRange ──→ AnalyticsQuery
        ↑
manual refresh / overview auto refresh

invalid custom selection ──→ inline validation error（不发请求）
```

固定历史自定义范围每次 resolve 产生相同 from/to；包含今天的范围使用新的 now。

## 3. ComparisonState（前端展示模型）

由 Metric 和全局 compare 开关派生，不持久化。

| 状态 | 判定 | 展示语义 |
|------|------|----------|
| `positive` | compare 开启、当前/上一周期有值、delta > 0 | 上升符号、带正号数值、同期文字 |
| `negative` | compare 开启、当前/上一周期有值、delta < 0 | 下降符号、带负号数值、同期文字 |
| `unchanged` | compare 开启、当前/上一周期有值、delta = 0 | “较上期持平” |
| `no_comparison_data` | compare 开启、`previousValue=null` | “暂无同期数据” |
| `comparison_off` | compare 关闭 | “未启用同期比较” |
| `current_missing` | `value=null` | 主值与趋势均表达缺失，不以 0 替代 |

为使 `no_comparison_data` 可判定，后端 Metric 在上一周期无事件时必须保持 `previousValue=null`，不能自动填 0。

## 4. TimeSeriesDefinition（前端图表模型）

| 字段 | 类型 | 规则 |
|------|------|------|
| `key` | string | 稳定序列标识，例如 `pv`、`uv`、`successfulRouteVisitors`、`p95Ms` |
| `label` | 三语文案 | 图例、Tooltip、隐藏表格使用同一名称 |
| `unit` | `count \| ms \| percent` | 控制 Y 轴和 Tooltip 格式化 |
| `colorToken` | token key | 不作为唯一识别手段 |
| `lineStyle` | `solid \| dashed` | 与颜色共同区分 |
| `pointShape` | `circle \| square \| diamond` | 键盘焦点与图例使用 |
| `valueAccessor` | pure accessor | 从时间点读取 `number \| null` |

## 5. DailyHeatmapCell（私有 API 读模型）

替换旧 `weekday + hour` 结构。

| 字段 | 类型 | 规则 |
|------|------|------|
| `localDate` | `YYYY-MM-DD` | 香港当地日期，查询范围内唯一 |
| `bucketStart` | RFC 3339 date-time | 当日香港 00:00，包含 |
| `bucketEnd` | RFC 3339 date-time | 下一日香港 00:00 或查询 `to`，不包含 |
| `eventCount` | non-negative integer | 该桶内通过筛选的匿名事件总数 |
| `uv` | non-negative integer | 该桶内不同 Visitor ID 数 |

### 不变量

- 按 `localDate` 升序返回。
- 返回项数等于查询范围覆盖的香港日期数。
- 即使某日无事件也返回 `eventCount=0, uv=0`；范围外补位只由前端生成，不进入 API。
- `uv <= eventCount`。

## 6. EventLatencySummary（私有 API 读模型）

| 字段 | 类型 | 规则 |
|------|------|------|
| `eventType` | 既有 EventType | 四类事件各一项 |
| `requestCount` | non-negative integer | 当前筛选范围内成功样本数 |
| `p95Ms` | integer \| null | 最近秩 P95；无成功样本时为 null |

### 事件映射

| EventType | Dashboard 文案 |
|-----------|----------------|
| `page_view` | APK 元数据 |
| `place_query` | 地点查询 |
| `route_query` | 路线查询 |
| `download_request` | 下载响应 |

数组按上述稳定顺序返回，便于客户端在没有样本时仍展示四行。

## 7. EventRangeSummary（私有 API 读模型）

与 EventListData 的 items/pageInfo 使用相同 `EventListRequest` 筛选，但不受 limit/cursor 影响。

| 字段 | 类型 | 规则 |
|------|------|------|
| `totalCount` | non-negative integer | 完整筛选范围事件数 |
| `successCount` | non-negative integer | outcome=success |
| `failureCount` | non-negative integer | outcome=failure |
| `uniqueVisitors` | non-negative integer | `COUNT(DISTINCT visitor_id)` |

### 不变量

- `successCount + failureCount = totalCount`。
- `pageInfo.totalCount = summary.totalCount`。
- 游标只影响 items 与 nextCursor，不影响 summary。

## 8. VisitorSummaryData（扩展读模型）

沿用现有字段并扩展：

| 新字段 | 类型 | 规则 |
|--------|------|------|
| `eventComposition` | `DistributionPoint[]` | 完整保留历史中各事件类型分布；count 总和等于 eventCount |
| `commonPlatform` | `android \| ios \| other \| null` | 只从下载事件归因计算；没有有效下载平台时为 null |

已有 `firstSeenAt`、`lastSeenAt`、`eventCount`、`sessionCount`、`commonLocale`、`commonDeviceType`、`commonSourceType` 继续基于该 Visitor ID 的完整保留历史。时间线分页不改变摘要。

## 9. SystemStatusView（前端组合模型）

系统页组合 API 动态状态与代码内固定配置事实，二者必须显式分组。

### 动态状态

- `database.state/rowCount/sizeBytes/lastSuccessfulWriteAt`
- `process.startedAt/droppedSinceStart`
- `privateListener.state/bindAddress/publicProxy`

### 配置事实

| 字段 | 固定值 | 表达 |
|------|--------|------|
| `retention` | `long_term` | 长期保留，不提供代码删除逻辑 |
| `backupEnabled` | false | 不备份，统计数据允许丢失 |
| `writeQueueEnabled` | false | 每条事件短 deadline 内同步尝试一次 |
| `publicProxy` | false | private listener 不经公网代理 |
| `aggregationStorage` | false | 只保存明细，页面查询时聚合 |

配置事实不得以“已探测正常”等动态健康措辞显示。

## 10. 持久化与索引影响

- `analytics_events` 表结构不变。
- 不新增汇总表、缓存表、清理表或备份记录。
- 事件摘要复用现有筛选构建器与索引；如性能基准显示 `COUNT(DISTINCT visitor_id)` 超出 1 秒目标，只允许添加普通索引或重写查询，不改变只存明细原则。
- 日增不超过 1000、长期不超过 100 万明细的规模假设继续有效。
