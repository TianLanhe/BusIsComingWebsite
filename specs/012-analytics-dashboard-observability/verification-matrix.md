# 验证矩阵：监控 Dashboard 数据解释与技术监控增强

**Feature**：012-analytics-dashboard-observability
**Figma**：[v1.3 节点 89:1310](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=89-1310)
**说明**：此矩阵把规格需求映射到权威 OpenAPI、Go、Vitest、Playwright、Figma 和人工检查。阶段 1–2
只完成共享契约、类型、fixture、比较模型与三语 key；页面、Go 聚合和浏览器流程仍由后续任务验证。

## 阶段 1–2 已执行证据

| 任务 | 验证 | 结果 |
|---|---|---|
| T004 | 本矩阵覆盖 FR/SC 与验证层 | 通过 |
| T005 | `analyticsContract.test.ts`：7 个 operationId、012 schema、shared 字节同步；summaryMetrics 4 项边界、六个流量 key、SQLite/process/listener 可空字段与 required | 通过；012 YAML 原已存在的 schema 为回归断言 |
| T006 | `analytics.ts`、`details.ts`：当前/上期、零基线、无样本、SLI 空桶、单字段 null、六卡、无平台；compare=true 同期 meta 与 compare=false 全空比较 fixture 分离 | 通过 |
| T007 | `copy.test.ts`：三语新增 key 完整性 | 通过 |
| T008/T011 | `comparisonState.test.ts`：七状态、方向与好坏策略分离 | 通过 |
| T009/T012 | `build:monitor`：TypeScript 契约与 `MetricCard` props | 通过；保留既有 bundle 大小提示 |
| T013 | Redocly lint/bundle、聚焦 Vitest、monitor build | 通过 |

## 阶段审查修复（2026-07-24）

| 问题 | 证据 | 结果 |
|---|---|---|
| compare=false 却携带同期数值 | `analyticsFixtures.test.ts` 验证启用比较的 meta 有完整上一周期；禁用比较时 summary、traffic、performance 的上一期/变化字段为空，endpoint 分位保留 currentMs 并清空 previous/delta | 通过 |
| DTO key 没有绑定 | `analyticsTypes.contract.test.ts` 通过 `@ts-expect-error` 和 `build:monitor` 验证 EventListData 与 TrafficData 拒绝未文档化 key，同时保留两个既有 successful Visitor key | 通过 |
| OpenAPI 字段断言不足 | `analyticsContract.test.ts` 逐项验证六个 traffic key、summaryMetrics min/max=4、ProcessStatus uptimeMs、SQLite/process/listener required 和 nullable union | 通过 |
| zero baseline 的反向语义 | `comparisonState.test.ts` 验证 `zero_baseline + lower_is_better => worse` | 通过 |

## 需求到验证层映射

| 规格 | OpenAPI / Go | Vitest | Playwright / Figma / 人工检查 | 阶段状态 |
|---|---|---|---|---|
| FR-001–003, SC-002 | UI contract §2；无新 endpoint | `TimeSeriesChart.test.tsx` | `charts.spec.ts`，Figma Date Range & Single Tooltip，1440/390 | 后续 US1 |
| FR-004–010, SC-001 | UI contract §1 | date flow、FilterProvider、DateRangeControl、GlobalFilters | `time-range.spec.ts`，Figma 日期流程，桌面/手机 | 后续 US1 |
| FR-011–014, SC-003 | EventListData.summaryMetrics；Go event summary | `comparisonState.test.ts`、EventsPage、MetricCard | `investigation.spec.ts`，人工分页隔离 | 基础模型已通过；US2/US3 待完成 |
| FR-015–027, SC-004–006 | PerformanceData、PercentileComparison、SLISeriesPoint；Go performance | comparison、MetricCard、PerformancePage | `charts.spec.ts`，Figma Stability & SLI | 基础类型/模型已通过；US2 待完成 |
| FR-028–032 | UI contract §4 | copy、导航组件 | `responsive-locales.spec.ts`，Figma 导航 | 三语 key 已通过；US5 待完成 |
| FR-033–039, SC-008 | SystemData、SQLiteRuntimeStatus、ProcessStatus；Go system ports | SystemPage | `investigation.spec.ts`，隐私人工检查 | 基础类型/fixture 已通过；US4 待完成 |
| FR-040–043, SC-007 | TrafficData six metrics；Go traffic query | DetailPages、TrafficPage | `investigation.spec.ts`，Figma Business & Event Metrics | 基础类型/fixture 已通过；US3 待完成 |
| FR-044–048, SC-009 | Visitor schema；Go stable tie ordering | VisitorPage、DetailPages | `investigation.spec.ts`，Figma System & Visitor Details | fixture 无平台已通过；US5 待完成 |
| FR-049–050, SC-011 | 中文 OpenAPI project copy | `copy.test.ts` | `responsive-locales.spec.ts`，繁中/英文人工审校 | 基础 key 已通过；全页待完成 |
| FR-051–053, SC-010/013 | UI contract §6，Figma metadata | responsive component tests | 两 viewport 截图、Figma 节点 89:1310 逐区块 | 后续 US1–US5 |
| FR-054, SC-014 | feature/shared 012 YAML，7 operationIds | `analyticsContract.test.ts`，Redocly | bundle/私有 docs 人工检查 | 通过 |
| FR-055–057, SC-014 | path/event/table contract；Go isolation/DDD | contract、privacy tests | public/private regression 与人工 diff | 契约基线通过；Go 待后续 |
| FR-058 | UI/data model 中文边界注释 | comparisonState | 人工代码审查 | 比较边界已通过；其余后续 |
| SC-012 | Go SQLite performance suite | million-row test | 性能日志与人工检查 | 后续 US2–US4 |

## T013 命令记录（2026-07-24）

```text
npm --prefix frontend test -- --run \
  src/monitoring/services/analyticsContract.test.ts \
  src/monitoring/content/copy.test.ts \
  src/monitoring/model/comparisonState.test.ts \
  src/monitoring/components/charts/MetricCard.test.tsx \
  src/monitoring/pages/EventsPage.test.tsx \
  src/monitoring/pages/DetailPages.test.tsx \
  src/monitoring/pages/PerformancePage.test.tsx \
  src/monitoring/pages/SystemPage.test.tsx
# 8 files, 29 tests passed

npm --prefix frontend run build:monitor
# passed; existing Vite bundle-size warning retained

npm --prefix frontend run openapi:lint
npm --prefix frontend run openapi:bundle
# passed
```
