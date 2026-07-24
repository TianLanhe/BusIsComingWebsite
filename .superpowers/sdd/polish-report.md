# 012 收尾验证报告（T088–T099）

**日期**：2026-07-24
**状态**：通过；T088–T099 均已完成并在 `tasks.md` 标为 `[X]`。

## 实施与修复

- 将百万行验收扩展为真实 `QueryDetails` 路径：事件当前/上一期摘要、流量六项、性能当前/上一期与 SLI、系统香港今日计数和完整 Visitor 历史；保留已有 query-plan/index 与事实表断言。
- 移动端 E2E 改为从三组底栏入口打开抽屉后进入「流量与试查」。这是既定信息架构（底栏三组、抽屉七页）的正确交互路径，首轮测试错误地寻找不存在的七页底栏直链。
- 补充繁中/英文独立文案审校、最终 Figma 对照、验证矩阵和完整验证结果；没有修改 migration、契约字段、事件类型、表、依赖或公开端点。

## 新鲜验证证据

| 分类 | 命令 / 核验 | 结果 |
|---|---|---|
| OpenAPI | feature/shared `cmp -s`、`npm --prefix frontend run openapi:lint`、`openapi:bundle`、`openapi:docs` | 通过；feature/shared SHA-256 相同：`46dcbee06585b83b173f7cecb411848437e48503baf719437b92c2bc0e443cda`；私有 HTML 中文内容正常。 |
| 百万行 | `BUS_RUN_MILLION_ROW_TEST=1 go -C backend test -run TestMillionRowCommonQueriesUseIndexesAndFinishWithinOneSecond -count=1 -v ./internal/analytics/infrastructure/sqlite` | 通过，49.62s（含临时 fixture）；最大 P95=194.189ms（流量六卡），全部低于 1s。 |
| Go | `go -C backend test ./...` | 通过。 |
| Race | `go -C backend test -race ./internal/analytics/... ./internal/platform/httpserver/... ./cmd/server` | 通过。 |
| 隐私/稳健性 | `go -C backend test -run 'Privacy|FailOpen|Private|Recovery|Middleware' ./internal/analytics/interfaces/http ./internal/platform/httpserver ./cmd/server` | 通过。 |
| 前端 | `npm --prefix frontend run test:unit`；`frontend/node_modules/.bin/tsc --noEmit -p frontend/tsconfig.json`；`npm --prefix frontend run build` | 42 files、197 tests 通过；TypeScript、public 和 monitor 构建通过。 |
| E2E | `npm --prefix frontend run test:e2e:monitor -- --reporter=line` | 37 passed、1 skipped；覆盖三语、七页、1440/390、日期、Tooltip、比较、SLI、system、visitor。 |
| 部署 | `bash scripts/tests/deploy_test.sh` | 通过；单 Go 进程双监听、双前端产物、private 隔离、原子 switch/rollback 和公开 fail-open 均受测。 |
| 提交检查 | `git diff --check` | 通过。 |

## 审计结果

- 7 个私有 operation：`getAnalyticsOverview`、`getAnalyticsTraffic`、`getAnalyticsDownloads`、`listAnalyticsEvents`、`getAnalyticsVisitor`、`getAnalyticsPerformance`、`getAnalyticsSystemStatus`。
- 事件枚举仍为 4 种；SQLite migration 仍只有 `analytics_events` 事实表（另有 migration 元数据表）。
- 依赖方向保持 `interfaces/infrastructure → application → domain`；`tracking_middleware` 已改为 application ports 注入，避免直接引用 classification/signing concrete type。没有业务 panic 或新增业务 goroutine。双 Gin engine 启用 request logger/recovery，supervisor goroutine 通过 `safeServe` recover 并记录 listener、错误分类、调用上下文和 stack hash。
- privacy sentinel/fail-open 覆盖 IP、Visitor header、query/body、数据库路径、密钥和原始错误不外泄；public listener 不暴露 monitor/API。
- monitor bundle 是 614.34kB，保留既有 Vite >500kB 提示；没有引入任何新大型依赖。

## 视觉与资料

- 截图尺寸核对：94 项，桌面宽 1440、手机宽 390；长页截图（例如 `business-traffic-zh-Hant-mobile.png`）为 390×2764。
- 已对照 Figma v1.3 `89:1310` 和导入画板 18–22。信息架构、卡片、图表、SLI、比较、日期和移动重排一致；原生日期 picker 与表格局部滚动属于有意差异。任何设计示例数值均不会充当 API 错误回退。
- 最终 HEAD 已更新并提交 48 张当前 E2E Playwright 截图基线。

## 提交范围与注意项

只提交 012 收尾测试、验证文档和 E2E 修复。用户既有 `backend/downloads/android/BusIsComing.apk` 与 `backend/downloads/android/current.json` 保持未修改且不暂存。

最终提交：`test(analytics): complete observability release gates`。

## 最终审查修复（同日）

- supervisor panic recovery 现在用受控 `ServerReport` 传递 `panic_recovered`/`panic`、listener、
  `listener_serve` 与 stack hash；普通 bind/serve error 保持 `serve_failed`/`serve_error`。结构化
  listener logger 不输出 panic 原文。对应 Go 测试验证两条路径和脱敏日志。
- 公开采集与私有调查的三语文案明确分开：前者使用 HttpOnly Cookie，后者只通过
  `X-Analytics-Visitor-ID` header，绝不进入 query/body/log；copy test 覆盖三种语言。
- tracking middleware 已从 concrete classification/signing 解耦：application 声明 ports，
  infrastructure 实现，composition root 注入；AST 守卫防止 HTTP adapter 回归依赖 concrete adapter。
- 复验：`go test ./...`、analytics/platform/server race、Vitest 42 files/197 tests、public/monitor
  build、OpenAPI lint/bundle、12 个三语/移动导航 E2E 及 deploy test 全部通过。截图已复核为 390×2764，
  最终 HEAD 已更新并提交 48 张当前 E2E 截图基线。monitor bundle 614.34kB，仅保留既有 Vite 警告且未增加依赖。

## 最终 Minor 收敛

预设日期显示已改为本地化的近 7/30/90 天名称，自定义范围保留完整年月日；ListEvents 已移除未使用的重复
full-range summary。最终 HEAD monitor E2E 为 37 passed、1 skipped，并仅提交本次生成的 48 张 012 截图；
桌面侧栏、移动底栏和抽屉的三组导航已人工复核一致。
百万行实际读模型基线（49.72s）中所有查询 P95 均小于 1 秒；最终 Go/race、Vitest 42 files/197 tests、
构建（monitor 614.34kB）、OpenAPI lint/bundle 与 diff check 均通过。
