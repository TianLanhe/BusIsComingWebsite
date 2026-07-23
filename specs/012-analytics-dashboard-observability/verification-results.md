# 012 最终验证结果

**日期**：2026-07-24
**范围**：T088–T099；所有命令从仓库根目录执行。

## 契约与文案

| 门禁 | 实际命令或检查 | 结果 |
|---|---|---|
| OpenAPI 权威同步 | `cmp -s specs/012-analytics-dashboard-observability/contracts/analytics-monitoring-api.openapi.yaml shared/contracts/openapi/analytics-monitoring-api.openapi.yaml` | 通过；两端 SHA-256 都是 `46dcbee06585b83b173f7cecb411848437e48503baf719437b92c2bc0e443cda`。 |
| OpenAPI | `npm --prefix frontend run openapi:lint`、`openapi:bundle`、`openapi:docs` | 通过；feature/shared 均由 Redocly 校验，bundle 与私有 HTML 已生成。HTML 标题为「BusIsComing 匿名访问统计监控 API」，项目可控说明、标签、摘要、参数、响应、错误与示例均为简体中文。 |
| 三语 | `zh-hant-en-copy-review.md`、`copy.test.ts`、全量 E2E | 通过；繁中为香港产品用语，英文为自然克制表达；长文本在 1440/390 下可换行、不截断。 |

## 100 万行性能与索引结论

命令：

```text
BUS_RUN_MILLION_ROW_TEST=1 go -C backend test \
  -run 'TestMillionRowCommonQueriesUseIndexesAndFinishWithinOneSecond' \
  -count=1 -v ./internal/analytics/infrastructure/sqlite
```

结果：通过，fixture 恰好 1,000,000 行，运行 49.62s（包含临时 SQLite 建库、写入和索引构建）。`EXPLAIN QUERY PLAN` 证明范围/摘要使用 `idx_analytics_events_time`，访客使用 `idx_analytics_events_visitor_time`；只存在 `analytics_events` 和 `schema_migrations` 两张表。

| 实际 Dashboard 路径 | P95 |
|---|---:|
| 近 30 天总览 | 113.945ms |
| 逐日流量桶 | 76.738ms |
| 事件当前/上一周期摘要 | 73.882ms |
| 流量六项指标 | 194.189ms |
| 性能当前/上一周期与 SLI | 194.009ms |
| 香港今日数量与系统快照 | 5.805ms |
| 单 Visitor 完整历史与时间线 | 0.469ms |

所有 P95 小于 1 秒，因此 T091 不新增索引 migration，不修改 `001`，也不新增汇总表、缓存或队列。

## 代码、隐私与构建

| 命令 | 结果 |
|---|---|
| `go -C backend test ./...` | 通过。 |
| `go -C backend test -race ./internal/analytics/... ./internal/platform/httpserver/... ./cmd/server` | 通过。 |
| `go -C backend test -run 'Privacy|FailOpen|Private|Recovery|Middleware' ./internal/analytics/interfaces/http ./internal/platform/httpserver ./cmd/server` | 通过。 |
| `npm --prefix frontend run test:unit` | 42 files、197 tests 通过。 |
| `npm --prefix frontend run build` | 通过；包含 TypeScript `tsc --noEmit -p tsconfig.json`、public 和 monitor 产物。 |
| `npm --prefix frontend run build:monitor` | 通过；`dist` 与 `dist-monitor` 保持独立。monitor JS 为 614.34kB，只有既有 Vite 500kB 警告；本功能未新增依赖。 |

审计结论：analytics 分层保持 `interfaces/infrastructure → application → domain`；`tracking_middleware` 现只依赖 application 的 `VisitorSigner`/`EventClassifier` ports，由 composition root 注入 signing/classification adapter。不存在业务 `panic` 或新增业务 goroutine，唯一服务监督 goroutine 由 `safeServe` recover 包裹。supervisor 将 panic 标记为 `panic_recovered`/`panic`，记录 listener、`listener_serve` 上下文和 stack hash；普通 bind/serve 错误仍是 `serve_failed`/`serve_error`，两种日志都不包含 panic 原文或敏感值。public/private 两个 Gin engine 均启用 request logger 和 recovery；日志仅记录 request ID、route template、operationId、bounded context、status、duration 等脱敏字段。私有契约恰好 7 个 operation，事件枚举恰好 4 种，migration 中只有一张事实表；隐私 sentinel 确认没有 Visitor header、IP、路径、密钥、query/body 或原始错误泄露，也没有公网监控路由。公开 tracking 在 SQLite 不可用时仍 fail-open。

## 浏览器、Figma 与部署

```text
npm --prefix frontend run test:e2e:monitor -- --reporter=line
# 37 passed, 1 skipped

bash scripts/tests/deploy_test.sh
# passed
```

- Playwright 覆盖 1440×1200 与 390×844、`zh-Hans`/`zh-Hant`/`en`、七页导航、两步日期、单一 Tooltip、比较、SLI、system 局部降级和 visitor。三组移动底栏只负责入口，具体七页经抽屉进入；测试已按此已批准行为修正。
- 截图清单共 94 项；桌面均为 1440px 宽、手机均为 390px 宽。长页截图保留完整内容，例如 `business-traffic-zh-Hant-mobile.png` 为 390×2764，未发生页面级横向溢出。
- 已人工对照 Figma v1.3 `89:1310` 和导入画板 18–22：侧栏三组、六卡层级、双图+SLI、端点表、日期两步和手机纵向重排一致。真实 API 数据/无数据空值替代设计样例数字；原生日期选择器和手机端局部表格滚动属于有意实现差异。
- `deploy_test.sh` 验证一个 Go 服务进程双监听、`dist`/`dist-monitor` 双前端产物、Caddy 不公开 monitor/API、private 健康失败只告警不阻断公开发布，以及 release 原子切换/整体回滚不复制或删除 `shared/analytics`。

## 提交范围

`git diff --check` 通过。用户原有 `backend/downloads/android/BusIsComing.apk` 和 `backend/downloads/android/current.json` 未修改、未暂存；最终 HEAD 已更新并提交 48 张当前 E2E 截图基线。

## 最终审查修复复验

```text
go -C backend test ./...
go -C backend test -race ./internal/analytics/... ./internal/platform/httpserver/... ./cmd/server
npm --prefix frontend run test:unit
npm --prefix frontend run build
npm --prefix frontend run openapi:lint && npm --prefix frontend run openapi:bundle
npm --prefix frontend run test:e2e:monitor -- playwright-monitor/investigation.spec.ts playwright-monitor/responsive-locales.spec.ts --reporter=line
bash scripts/tests/deploy_test.sh
```

以上全部通过：Go 全量与 race 通过，Vitest 为 42 files/197 tests，三语七页 E2E 为 12/12。
`safeServe` 的 panic 报告现在包含受控 `reason=panic_recovered`、`errorKind=panic`、listener、
`context=listener_serve` 和 stack hash；普通错误保持 `serve_failed`/`serve_error` 且没有 stack hash。
`writeListenerReport` 不记录 panic 原文。tracking HTTP adapter 只依赖 application 的 classifier/signer ports，
composition root 注入基础设施 adapter。文案清楚区分公开采集的 HttpOnly Cookie 与私有调查的
`X-Analytics-Visitor-ID` header，后者不进 query/body/log。`sips` 已确认
`business-traffic-zh-Hant-mobile.png` 为 390×2764；最终 HEAD 的 48 张当前 E2E 截图基线已更新并提交。

## 最终 Minor 收敛

- 顶部日期控件在 preset selection 时显示本地化的近 7/30/90 天名称，自定义范围仍显示完整年月日；组件测试覆盖默认与切换。
- SQLite `ListEvents` 不再重复执行完整范围 summary 或携带 `StoredEventPage.Summary`；唯一权威完整范围摘要继续由 application `SummarizeEvents` 提供。
- monitor E2E 在最终 HEAD 运行 37 passed、1 skipped，并只更新该运行生成的 48 张 012 截图；人工复核三组导航在桌面侧栏、移动底栏和抽屉中一致。
- 最终回归：百万行基线 49.72s（各查询 P95 均低于 1 秒）、Go 全量与 race、Vitest 42 files/197 tests、构建（monitor 614.34kB）、OpenAPI lint/bundle 和 `git diff --check` 全部通过。
