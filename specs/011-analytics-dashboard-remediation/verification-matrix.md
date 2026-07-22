# 验证追踪矩阵：监控 Dashboard 体验修复

本文把规格需求映射到可执行测试和最终证据。HTTP 字段与错误格式由 011 OpenAPI 结构测试覆盖；浏览器交互、视觉、性能和隐私等非 HTTP 行为按下表验证。

## 功能需求追踪

| 需求 | 自动化验证 | 补充证据 |
|---|---|---|
| FR-001–FR-005 | `frontend/src/monitoring/model/dateRange.test.ts`、`frontend/src/monitoring/app/FilterProvider.test.tsx`、`frontend/src/monitoring/pages/OverviewPage.test.tsx`、`frontend/playwright-monitor/time-range.spec.ts` | 双端日期截图与刷新时钟记录 |
| FR-006–FR-008 | `frontend/src/monitoring/components/charts/MetricCard.test.tsx`、`frontend/src/monitoring/pages/DetailPages.test.tsx`、`frontend/playwright-monitor/charts.spec.ts` | 三语桌面/手机指标截图、字号审计 |
| FR-009–FR-011 | `frontend/src/monitoring/components/charts/TimeSeriesChart.test.tsx`、`frontend/playwright-monitor/charts.spec.ts` | 图例、坐标、鼠标/键盘 Tooltip 与隐藏表格截图 |
| FR-012 | `backend/internal/analytics/application/query_overview_test.go`、`frontend/src/monitoring/pages/OverviewPage.test.tsx` | 四类事件成功样本和可空 P95 截图 |
| FR-013–FR-014 | `backend/internal/analytics/application/query_details_test.go`、`frontend/src/monitoring/components/charts/Heatmap.test.tsx`、`frontend/playwright-monitor/charts.spec.ts` | 7/30/90 日格数和局部横向滚动证据 |
| FR-015–FR-016 | `backend/internal/analytics/application/query_details_test.go`、`backend/internal/analytics/infrastructure/sqlite/query_events_visitor_test.go`、`frontend/src/monitoring/pages/EventsPage.test.tsx`、`frontend/src/monitoring/components/tables/ResponsiveEventList.test.tsx` | 桌面表格、手机卡片、分页调查截图 |
| FR-017–FR-018 | `backend/internal/analytics/application/query_details_test.go`、`frontend/src/monitoring/pages/VisitorPage.test.tsx`、`frontend/src/monitoring/components/timeline/VisitorTimeline.test.tsx` | Visitor ID、会话和事件构成截图 |
| FR-019–FR-020 | `frontend/src/monitoring/pages/PerformancePage.test.tsx`、`frontend/playwright-monitor/investigation.spec.ts` | system 辅助请求失败的局部降级截图 |
| FR-021–FR-022 | `frontend/src/monitoring/pages/SystemPage.test.tsx`、`frontend/playwright-monitor/investigation.spec.ts` | 动态状态与配置事实分组截图 |
| FR-023–FR-024 | `backend/internal/analytics/interfaces/http/privacy_sentinel_test.go`、`frontend/playwright-monitor/states.spec.ts`、`frontend/playwright-monitor/investigation.spec.ts` | 五种状态及上下文保持记录 |
| FR-025 | `frontend/src/tests/viteRootRedirect.test.ts`、`frontend/scripts/verify-vite-root-redirect.mjs` | dev/preview GET、HEAD 与非根路径实际响应 |
| FR-026 | `frontend/src/monitoring/content/copy.test.ts`、monitor Playwright 三语双端回归 | 1440×1200 与 390×844 截图、44px 断言 |
| FR-027 | `frontend/src/monitoring/services/analyticsContract.test.ts`、Redocly feature/shared lint 与 bundle | 中文 API UI 生成和公网产物隔离检查 |
| FR-028 | `go test ./backend/...`、recovery/logger 测试、静态审计 | DDD、panic、goroutine 与脱敏日志审计记录 |
| FR-029 | `backend/internal/analytics/interfaces/http/privacy_sentinel_test.go`、数据库 schema 审计 | 无新增采集字段、端点、汇总表或数据管理能力 |
| FR-030 | monitor Playwright 视觉回归 | `figma.md` 对照 v1.1、v1.2 与最终截图 |

## 成功标准追踪

| 标准 | 判定方式 |
|---|---|
| SC-001–SC-002 | 固定香港 00:30 的 Vitest/Playwright 时钟测试；7/30/90 和自定义范围格数精确相等，刷新延迟不超过 65 秒。 |
| SC-003 | 所有折线组件测试断言图例、双轴、共享 Tooltip、键盘焦点、隐藏表格且无可见摘要。 |
| SC-004–SC-006 | 三语 1440/390 Playwright、CSS token/44px 断言以及指标、P95、UV/PV 页面测试全部通过。 |
| SC-007–SC-008 | 两分钟调查路径与局部失败 E2E 通过；公开主页、试查和下载回归通过。 |
| SC-009 | dev/preview 进程级重定向脚本与中间件单元测试全部通过。 |
| SC-010–SC-011 | copy 完整性测试、繁中/英文审校、Figma/OpenAPI 链接和契约结构测试全部通过。 |
| SC-012 | 1,000,000 行 SQLite fixture 至少 20 次计时，预热后按最近秩法计算 P95；各核心查询 P95 小于 1 秒并保留 `EXPLAIN QUERY PLAN` 断言。 |

## Vite 根路径实测

2026-07-23 执行 `npm run verify:vite-root-redirect`，脚本为 dev 与 preview 各自申请随机本机端口并验证：

| 模式 | 请求 | 实测结果 |
|---|---|---|
| dev / preview | `GET /?verification=1` | `302`，`Location: /zh-hant/`，响应体为空 |
| dev / preview | `HEAD /?verification=1` | `302`，`Location: /zh-hant/`，响应体为空 |
| dev / preview | `POST /` | `404`，不含 `Location` |
| dev / preview | `GET /zh-hant/` | `200` |
| dev / preview | `GET /favicon.webp` | `200` |
| dev / preview | `GET /api/__root_redirect_probe__` | `404`，不含 `Location` |
| monitor config | 插件安装静态检查 | 未引用 `publicRootRedirect` 或插件名 |

进程级脚本还在验证前执行公开构建；因此以上结果同时证明 dev、preview、非根路径和公开构建可共同工作，监控 Vite 配置未被改动。
