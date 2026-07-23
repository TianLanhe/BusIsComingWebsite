# 数据模型：监控 Dashboard 数据解释与技术监控增强

**日期**：2026-07-24

本功能不新增持久化表或匿名字段。以下均为前端交互状态、服务端即时聚合读模型或展示派生模型；
SQLite 继续只保存 `analytics_events` 明细。

## 1. CustomDateFlow（前端两步草稿）

| 字段 | 类型 | 规则 |
|------|------|------|
| `step` | `idle \| selecting_start \| selecting_end` | 当前原生日期选择步骤 |
| `draftStartDate` | `YYYY-MM-DD \| null` | 只在草稿中保存，不直接进入 query |
| `draftEndDate` | `YYYY-MM-DD \| null` | 合法结束日期提交前保持草稿 |
| `error` | `invalid \| future \| order \| null` | 三语内联校验 key |
| `pickerFallback` | boolean | 自动打开结束选择器失败时为 true |

### 状态转换

```text
idle
  └─ choose custom ──> selecting_start
selecting_start
  ├─ choose start ──> selecting_end
  └─ cancel/Escape/outside ──> idle
selecting_end
  ├─ choose valid end ──> commit DateRangeSelection once ──> idle
  ├─ invalid end ──> selecting_end + error
  └─ cancel/Escape/outside ──> idle
```

取消只清空草稿，已应用 `DateRangeSelection` 不变。`showPicker()` 失败不改变 step，只设置 fallback。

## 2. DateRangeSelection / ResolvedDateRange（既有模型）

沿用 `frontend/src/monitoring/model/dateRange.ts`：

- 预设为 7/30/90 个香港自然日，包含今天。
- 自定义开始与结束日期都包含。
- 请求范围是半开 `[from,to)`；历史结束日的 `to` 为下一日香港 00:00，结束日为今天时使用本次
  求值 instant。
- `startDate <= endDate <= hongKongToday`。
- 上一周期为紧邻当前范围之前的等长区间。

新增 UI 只通过 `FilterProvider.setCustomRange()` 提交完整合法范围，不复制日期计算规则。

## 3. TooltipInteraction（前端图表交互）

```ts
type TooltipInteraction =
  | { mode: "pointer"; index: number }
  | { mode: "keyboard"; index: number }
  | { mode: null; index: null };
```

### 不变量

- `mode=pointer` 时只允许 Recharts Tooltip 可见。
- `mode=keyboard` 时只允许自定义无障碍 Tooltip 可见。
- active reference line 与唯一 interaction index 对齐。
- 数据、可见 series 或输入方式变化时，不允许保留越界 index。
- 两种 Tooltip 共用同一格式化输入：`bucketStart + visibleSeries + locale + unit`。

## 4. ComparableMetric（服务端统计值）

沿用 `domain.Metric`：

| 字段 | 类型 | 规则 |
|------|------|------|
| `key` | string | endpoint 内稳定 key |
| `value` | number \| null | 当前有样本时的值 |
| `previousValue` | number \| null | compare 开启且上一周期有样本时的值；真实 0 必须保留 |
| `delta` | number \| null | `value - previousValue` |
| `deltaRate` | number \| null | `delta / previousValue`；previous=0 时为空 |

### ComparisonViewState（前端派生）

| 状态 | 判定 |
|------|------|
| `increased` | 当前/上期有样本且 delta > 0 |
| `decreased` | 当前/上期有样本且 delta < 0 |
| `unchanged` | 当前/上期有样本且 delta = 0 |
| `zero_baseline` | previousValue=0 且 value>0 |
| `no_previous` | compare 开启且 previousValue=null |
| `no_current` | value=null |
| `disabled` | compare=false |

展示好坏方向另由 `neutral \| lower_is_better` 决定；失败数与时延使用 `lower_is_better`。

## 5. EventRangeComparison（事件完整范围）

`EventListData` 同时包含：

- `summary`：当前范围 `totalCount/successCount/failureCount/uniqueVisitors`。
- `summaryMetrics`：相同四个 key 的 `ComparableMetric[]`。
- `items/pageInfo`：当前 cursor/limit 的分页结果。

### 不变量

- `successCount + failureCount = totalCount`。
- `pageInfo.totalCount = summary.totalCount`。
- 每个 summary metric 的 `value` 等于 summary 对应字段。
- current/previous 摘要使用完全相同的日期以外筛选和可选 Visitor header。
- cursor/limit 不影响当前或上一周期摘要。
- 上一周期总事件为 0 时四项 `previousValue` 均为空，而不是把“无样本”写为零。

## 6. TrafficMetricSet（业务流量六卡）

| Metric key | 页面标签 | 计算 |
|------------|----------|------|
| `pv` | 主页浏览 PV | `page_view` 事件数 |
| `uv` | 主页浏览 UV | `page_view` Visitor 去重 |
| `placeQueryRequests` | 地点查询 PV | 全部 `place_query` 事件数 |
| `placeQueryVisitors` | 地点查询 UV | 全部 `place_query` Visitor 去重 |
| `routeQueryRequests` | 路线查询 PV | 全部 `route_query` 事件数 |
| `routeQueryVisitors` | 路线查询 UV | 全部 `route_query` Visitor 去重 |

`successfulPlaceVisitors`、`successfulRouteVisitors` 继续保留给既有漏斗/趋势。UV 是各范围内独立
去重，不得把多个时间桶 UV 相加。

## 7. PercentileSelection（前端局部选择）

| 字段 | 类型 | 规则 |
|------|------|------|
| `value` | `p50 \| p95` | 默认 `p95` |
| `scope` | `performance_latency_chart` | 不进入全局 AnalyticsQuery |

Performance 响应继续在每个 `LatencySeriesPoint` 同时携带 `p50Ms/p95Ms`。前端只把当前选择映射
成主页、地点、路线、下载四条序列；选择变化不发请求、不改变 SLI 或全局筛选。

## 8. PercentileComparison（端点时延）

| 字段 | 类型 | 规则 |
|------|------|------|
| `currentMs` | integer \| null | 当前 operation 有样本时的分位值 |
| `previousMs` | integer \| null | 上一等长周期有样本时的分位值 |
| `deltaMs` | integer \| null | current - previous |
| `deltaRate` | number \| null | previous>0 时计算 |

每个 `EndpointPerformance` 保留 `p50Ms/p95Ms`，并增加
`p50Comparison/p95Comparison`。

### 边界

- previous=0、current>0：deltaMs 有值，deltaRate=null。
- current=0、previous>0：deltaRate=-1。
- current=previous：deltaMs=0、deltaRate=0。
- 任一侧无样本：相应值和变化为空。
- compare=false：previous/delta 为空。

## 9. SLISeriesPoint（实际成功率）

| 字段 | 类型 | 规则 |
|------|------|------|
| `bucketStart` | RFC 3339 | 时间桶开始，含 |
| `bucketEnd` | RFC 3339 | 时间桶结束，不含 |
| `eventType` | 既有四类 EventType | 每桶固定稳定顺序 |
| `successfulPV` | non-negative integer | outcome=success |
| `totalPV` | non-negative integer | 成功 + 失败 |
| `successRate` | number \| null | totalPV>0 时为 successfulPV/totalPV |

### 不变量

- `successfulPV <= totalPV`。
- `totalPV=0 → successRate=null`。
- `totalPV>0 && successfulPV=0 → successRate=0`。
- 该模型只表示 SLI，不包含 SLA 目标或阈值。

## 10. SystemRuntimeSnapshot（非敏感运行快照）

### DatabaseStatus

| 字段 | 类型 | 规则 |
|------|------|------|
| `state` | available/degraded/unavailable | 写入与读取综合状态 |
| `rowCount` | integer \| null | 全部明细数 |
| `todayLocalDate` | YYYY-MM-DD | 香港当天，可由应用 clock 得到 |
| `todayRowCount` | integer \| null | 香港 `[00:00,next 00:00)` 明细数 |
| `sizeBytes` | integer \| null | 主数据文件大小，不含备份 |
| `lastSuccessfulWriteAt` | date-time \| null | runtime health |

### SQLiteRuntimeStatus

| 字段 | 类型 | 规则 |
|------|------|------|
| `version` | string \| null | 服务实际使用的 SQLite library version |
| `journalMode` | enum \| null | `PRAGMA journal_mode` |
| `schemaVersion` | string \| null | `schema_migrations` 已应用最高版本 |

### Process / Listener

| 字段 | 类型 | 规则 |
|------|------|------|
| `process.startedAt` | date-time \| null | 进程启动时刻；无法取得时为空 |
| `process.uptimeMs` | non-negative integer \| null | 同一次 server clock 计算；无法取得时为空 |
| `process.droppedSinceStart` | non-negative integer \| null | 进程启动以来；无法取得时为空 |
| `privateListener.state` | enum \| null | 既有 listener state；无法取得时为空 |
| `privateListener.bindAddress` | loopback host:port \| null | 从实际 composition 配置注入；无法取得时为空 |
| `privateListener.publicProxy` | false | 固定隐私事实 |

单项探测或运行字段不可取得时对应值为 null，已成功字段保留。模型禁止数据库路径、SQL、内部
错误、客户端地址、Visitor ID 或请求内容；`bindAddress` 是唯一允许的服务地址，且必须匹配
`127.0.0.1:<port>`。

## 11. VisitorPreferenceView（前端重排）

不新增 API 字段，使用完整 Visitor 历史的现有字段：

| 页面字段 | 来源 |
|----------|------|
| 语言 | `commonLocale` |
| 平台 | `commonPlatform`；无下载样本为 null |
| 装置 | `commonDeviceType` |

最常见值先按 count 降序，再按稳定枚举/字符串顺序处理并列。四张摘要卡依次使用
`firstSeenAt`、`lastSeenAt`、`sessionCount`、`eventCount`。`commonSourceType` 可继续存在于契约和
事件时间线，但不进入“访客偏好”区块。

## 12. MonitoringNavigationGroup

| group key | route |
|-----------|-------|
| `businessMonitoring` | overview, traffic, downloads |
| `technicalMonitoring` | performance, system |
| `dataDetails` | events, visitor |

route/hash 保持不变，只迁移三语标题和分组。桌面侧栏、移动抽屉和移动底栏从同一模型派生。

## 13. 持久化与并发影响

- `analytics_events` 和 `schema_migrations` 结构不变。
- 默认不新增 `002` migration；先验证既有时间、类型、Visitor、outcome 索引。
- 不新增汇总表、缓存表、队列、后台聚合、备份、清理或导出。
- 不新增 goroutine、定时任务或异步回调。
- 当前/上一周期、SLI 和端点比较都在请求内受 context/deadline 控制，通过 error 返回失败。
- 日增不超过 1,000、长期不超过 1,000,000 明细的规模假设继续有效。
