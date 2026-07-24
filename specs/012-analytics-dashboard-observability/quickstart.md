# 快速验证：监控 Dashboard 数据解释与技术监控增强

本指南用于按用户故事验证 012 实现。命令默认从仓库根目录执行；APK 文件
`backend/downloads/android/BusIsComing.apk` 和 `current.json` 属于用户现有改动，不纳入本功能
提交。

## 1. 前置条件

- 当前分支：`feat/012-analytics-dashboard-observability`
- Node/npm 依赖已安装：`frontend/node_modules`
- Go 工具链满足 `backend/go.mod`
- 端口 `8080`、`18081`、`5173`、`5174` 可用
- v1.3 Figma 真实锚点：
  [89:1310](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=89-1310)

```bash
git branch --show-current
git status --short
```

预期：分支正确；若 APK/current.json 有改动，只确认存在，不修改或暂存它们。

## 2. 先验证 feature 契约

规划阶段可直接校验 012 权威源：

```bash
frontend/node_modules/.bin/redocly lint \
  specs/012-analytics-dashboard-observability/contracts/analytics-monitoring-api.openapi.yaml

frontend/node_modules/.bin/redocly bundle \
  specs/012-analytics-dashboard-observability/contracts/analytics-monitoring-api.openapi.yaml \
  -o /tmp/busiscoming-012-analytics.bundle.yaml
```

实现阶段先把 `frontend/package.json` 和
`frontend/src/monitoring/services/analyticsContract.test.ts` 的 feature 路径切换到 012，再把
feature 源单向同步到 shared：

```bash
cmp -s \
  specs/012-analytics-dashboard-observability/contracts/analytics-monitoring-api.openapi.yaml \
  shared/contracts/openapi/analytics-monitoring-api.openapi.yaml

npm --prefix frontend run openapi:lint
npm --prefix frontend run openapi:bundle
npm --prefix frontend run openapi:docs
```

预期：

- 七个既有 operationId 不变，没有新增 path。
- feature 与 shared 源完全一致，bundle 成功。
- `shared/contracts/openapi/docs/analytics-monitoring-api.html` 中项目可控标题、标签、摘要、参数、
  响应、错误和示例为简体中文；该 HTML 仅用于私有预览，不进入 public dist。

## 3. 分层 TDD

### 3.1 US1：日期与单一 Tooltip

```bash
npm --prefix frontend run test:unit -- --run \
  src/monitoring/model/dateRange.test.ts \
  src/monitoring/model/dateRangeFlow.test.ts \
  src/monitoring/app/FilterProvider.test.tsx \
  src/monitoring/components/filters/GlobalFilters.test.tsx \
  src/monitoring/components/filters/DateRangeControl.test.tsx \
  src/monitoring/components/charts/TimeSeriesChart.test.tsx
```

必须覆盖：

- `idle → selecting_start → selecting_end → commit`。
- `showPicker()` 成功、缺失和抛异常后的显式 fallback。
- 取消、Escape、点击外部不改变已应用范围。
- 非法顺序、未来日期、跨年显示和右上角/高级筛选同步。
- pointer/keyboard 最近输入互斥；可见 Tooltip 数量最多为 1。

### 3.2 US2/US3：比较、SLI 与业务指标

```bash
go -C backend test ./internal/analytics/domain ./internal/analytics/application

npm --prefix frontend run test:unit -- --run \
  src/monitoring/model/comparisonState.test.ts \
  src/monitoring/components/charts/MetricCard.test.tsx \
  src/monitoring/pages/EventsPage.test.tsx \
  src/monitoring/pages/PerformancePage.test.tsx \
  src/monitoring/pages/DetailPages.test.tsx
```

必须覆盖：

- 比较关闭、持平、零基线、无上期、无当前、增长和下降。
- 失败/时延增加为恶化，下降为改善。
- P50/P95 默认 P95、只改变本图、全部值带 ms。
- SLI 无请求为 null；有请求且全失败为 0%。
- 端点 P50/P95 当前/上期五类边界。
- 事件 summaryMetrics 不受 limit/cursor 影响。
- 流量六卡的地点/路线 PV 包含失败，UV 在完整范围去重。

### 3.3 US4/US5：系统与访客

```bash
go -C backend test \
  ./internal/analytics/infrastructure/sqlite \
  ./internal/analytics/interfaces/http \
  ./cmd/server

npm --prefix frontend run test:unit -- --run \
  src/monitoring/pages/SystemPage.test.tsx \
  src/monitoring/pages/VisitorPage.test.tsx \
  src/monitoring/pages/DetailPages.test.tsx \
  src/monitoring/content/copy.test.ts
```

必须覆盖：

- 香港跨日今日数量、SQLite runtime probes、实际 private bind address。
- SQLite、进程或监听器的单个用户可见字段缺失时保留其他值；`publicProxy=false` 始终存在。
- 访客四卡顺序、语言/平台/装置、无下载平台和并列稳定。
- 三组导航和七页在三语中可达。

## 4. 本地三进程

先构建监控静态产物，确保 Go 正式静态托管路径存在：

```bash
npm --prefix frontend run build:monitor
```

### Terminal A：一个 Go 进程、两个监听器

```bash
ANALYTICS_012_TEST_DIR="$(mktemp -d)"

BUS_HTTP_HOST=127.0.0.1 \
PORT=8080 \
BUS_ANALYTICS_DB_PATH="$ANALYTICS_012_TEST_DIR/analytics.sqlite" \
BUS_ANALYTICS_UI_ROOT="$(pwd)/frontend/dist-monitor" \
BUS_ANALYTICS_PRIVATE_PORT=18081 \
BUS_ANALYTICS_VISITOR_SECRET='0123456789abcdef0123456789abcdef' \
ANALYTICS_WRITE_TIMEOUT_MS=50 \
go -C backend run ./cmd/server
```

### Terminal B：公开主页 Vite

```bash
FRONTEND_HOST=127.0.0.1 \
BACKEND_HOST=127.0.0.1 \
BACKEND_PORT=8080 \
npm --prefix frontend run dev -- --port 5173 --strictPort
```

### Terminal C：监控 Dashboard Vite

```bash
MONITOR_FRONTEND_HOST=127.0.0.1 \
BUS_ANALYTICS_PRIVATE_HOST=127.0.0.1 \
BUS_ANALYTICS_PRIVATE_PORT=18081 \
npm --prefix frontend run dev:monitor -- --port 5174 --strictPort
```

检查：

```bash
curl -i http://127.0.0.1:5173/
curl --fail --silent http://127.0.0.1:8080/healthz
curl --fail --silent http://127.0.0.1:18081/api/analytics/system
```

浏览器打开：

- `http://127.0.0.1:5173/`：302 到 `/zh-hant/`
- `http://127.0.0.1:5174/`：监控开发页
- `http://127.0.0.1:18081/`：同一 Go 进程从 `frontend/dist-monitor` 提供的生产形态

生产不启动两个 Vite；部署物仍是 `frontend/dist`、`frontend/dist-monitor` 和一个 Go 二进制。

## 5. 浏览器行为与双端

运行 Playwright 前停止占用 `18081`、`18082`、`5185` 的手工进程，因为 monitor 配置使用
`reuseExistingServer:false`。

```bash
npm --prefix frontend run test:e2e:monitor -- \
  --project=monitor-desktop-1440 \
  time-range.spec.ts charts.spec.ts investigation.spec.ts responsive-locales.spec.ts

npm --prefix frontend run test:e2e:monitor -- \
  --project=monitor-mobile-390 \
  time-range.spec.ts charts.spec.ts investigation.spec.ts responsive-locales.spec.ts
```

重点断言：

- 真正 hover 数据点和键盘 focus 各自只有一个可见 Tooltip；交替输入时最近输入优先。
- 两步日期、fallback、取消、非法范围、跨年和两处同步。
- P50/P95、SLI、事件比较、流量六卡、system 局部空值和访客偏好。
- 桌面 1440×1200 双图/表格无截断；手机 390×844 无页面级横向溢出、操作目标至少 44px。
- `zh-Hant`、`zh-Hans`、`en` 七页可达且切换不丢状态。

## 6. 全量、race 与构建

```bash
npm --prefix frontend run test:unit
npm --prefix frontend run build
go -C backend test ./...
go -C backend test -race \
  ./internal/analytics/... \
  ./internal/platform/httpserver/... \
  ./cmd/server
```

当前 monitor bundle 可能继续出现超过 Vite 500kB 的既有提示；构建必须成功，且本功能不得因新
日期/图表依赖进一步扩大技术栈。

## 7. 100 万行性能

```bash
BUS_RUN_MILLION_ROW_TEST=1 \
go -C backend test \
  -run 'TestMillionRowCommonQueriesUseIndexesAndFinishWithinOneSecond' \
  -count=1 \
  ./internal/analytics/infrastructure/sqlite
```

fixture 必须覆盖 events 当前/上一摘要、流量六指标、performance 当前/上一 + SLI、system 今日
数量和既有 visitor。预期常用查询 95% 在 1 秒内；先优化查询，只有证据证明必要时才另行评审
普通索引 migration，不得新增汇总表或修改已执行的 `001`。

## 8. 隐私、隔离和 fail-open

```bash
go -C backend test \
  ./internal/analytics/interfaces/http \
  ./cmd/server

go -C backend test \
  -run 'Privacy|FailOpen|Private|Recovery|Middleware' \
  ./internal/analytics/interfaces/http \
  ./cmd/server
```

预期：

- 响应/日志没有客户端或事件来源 IP、Visitor header 全值、数据库路径、密钥、query/body 或
  内部错误；system 响应中唯一允许的 IP 字面量是当前配置注入的 `127.0.0.1:<port>`。
- 私有 engine 保持 loopback，Caddy/public engine 不暴露 monitor/API。
- panic recovery 和 request logger 仍有效。
- 私有统计或 system probe 失败不改变主页、试查和下载响应。
- 没有新增 goroutine，因此协程 recover 验证为 N/A。

## 9. Figma 与视觉证据

对照：

- [Figma v1.3 节点 89:1310](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=89-1310)
- `docs/superpowers/prototypes/2026-07-24-analytics-dashboard-v13-figma-import/screenshots/`

现有 Playwright 生成截图但没有 `toHaveScreenshot()` 像素差分，因此验收方式是：

1. 行为断言通过。
2. 截图 viewport/尺寸正确。
3. 人工按日期、单一 Tooltip、新 IA、双图、端点比较、六卡、system、visitor 和移动端逐区块
   对照 Figma。
4. 设计示例值绝不用于 API 失败回退。

## 10. 部署拓扑回归

```bash
bash scripts/tests/deploy_test.sh
```

预期：

- release archive 仍包含 public dist、monitor dist 和单个后端二进制。
- systemd 只启动一个 Go 进程，监听 public/private 两个 loopback 端口。
- Caddy 只暴露公开主页/API，不暴露 monitor。
- `shared/analytics` 数据库不随 release/switch/rollback 删除或复制。
- private health 失败只产生 degraded 警告，不阻断公开服务部署。

## 11. 提交前检查

```bash
git diff --check
git status --short
```

只暂存本功能的前端、后端、shared contract、测试和 012 文档；不要暂存 APK/current.json。每个
Spec Kit skill 通过验证后单独提交。
