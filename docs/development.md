# 本地开发

本文集中记录 BusIsComing Website 的本地环境、启动方式、环境变量、构建和验证命令。生产部署见[部署说明](deployment.md)。

## 前置条件

- Node.js 与 npm，版本需兼容 `frontend/package-lock.json`
- Go 1.26.3
- Git
- Playwright 浏览器（仅端到端验证需要）
- Android SDK build-tools 的 `aapt`（仅替换当前 APK 需要）
- Redocly 由前端 devDependencies 提供，无需全局安装

部署脚本还需要 `bash`、`ssh`、`scp`、`tar`、`shasum`、`dig`、`file` 和 `mktemp`。

## 安装依赖

```bash
npm --prefix frontend install
```

Go 依赖由 `backend/go.mod` 和 `backend/go.sum` 管理，运行测试或服务时按 Go module 规则下载。

## 启动组合

### 后端

```bash
cd backend
go run ./cmd/server
```

默认地址：

| 服务 | 地址 | 说明 |
| --- | --- | --- |
| public | `127.0.0.1:8080` | `/healthz`、下载和路线查询 |
| private | `127.0.0.1:18081` | Pulse 静态页面和 analytics 查询 API |

private listener 只能配置为 loopback。数据库、visitor secret 或 private UI 不可用时，统计/监控可以 degraded，但 public listener 仍应正常启动。

### 公开前端

```bash
npm --prefix frontend run dev
```

默认地址为 `http://0.0.0.0:5173`，浏览器通常使用 `http://localhost:5173/`。精确根路径会临时跳转到 `/zh-hant/`，`/api` 代理到 `127.0.0.1:8080`。

### 私有监控前端

```bash
npm --prefix frontend run dev:monitor
```

默认地址为 `http://127.0.0.1:5174`，`/api/analytics` 代理到 `127.0.0.1:18081`。监控 dev server 仅用于本地开发，不能作为生产公开入口。

## 后端环境变量

### 公开服务和下载

| 变量 | 默认值 | 作用 |
| --- | --- | --- |
| `BUS_HTTP_HOST` | `127.0.0.1` | public listener host |
| `PORT` | `8080` | public listener port |
| `BUS_DOWNLOAD_ROOT` | `downloads/android` | 当前 APK 与 metadata 根目录；相对 backend 工作目录 |
| `ROUTE_QUERY_TOKEN_SECRET` | 内建本地开发值 | `placeToken`/`etaToken` HMAC；生产必须使用独立随机 secret |

内建路线 secret 只方便本地运行，不可用于生产或跨实例部署。生产环境由部署脚本在后端环境文件中生成并保留独立值。

### 匿名统计和私有监控

| 变量 | 默认值 | 作用 |
| --- | --- | --- |
| `BUS_ANALYTICS_DB_PATH` | `../shared/analytics/analytics.sqlite` | SQLite 文件 |
| `BUS_ANALYTICS_UI_ROOT` | `../frontend/dist-monitor` | private listener 提供的 Dashboard 静态目录 |
| `BUS_ANALYTICS_PRIVATE_HOST` | `127.0.0.1` | 只接受 loopback/localhost 输入 |
| `BUS_ANALYTICS_PRIVATE_PORT` | `18081` | private listener port |
| `BUS_ANALYTICS_VISITOR_SECRET` | 未设置 | visitor cookie HMAC；至少 32 bytes 才启用统计 |
| `ANALYTICS_WRITE_TIMEOUT_MS` | `50` | 单次 best-effort SQLite 写入上限；有效范围 10–200ms |

visitor secret 与路线 token secret 是两个独立信任边界，不能复用。配置无效时记录受控 health reason，不把 secret 写入日志。

本地示例：

```bash
(cd backend && \
  BUS_ANALYTICS_VISITOR_SECRET='local-development-secret-at-least-32-bytes' \
  go run ./cmd/server)
```

只可使用专门的本地测试值；不要把命令历史中的值复制到生产。

## 前端环境变量

### 公开前端

| 变量 | 默认值 | 作用 |
| --- | --- | --- |
| `FRONTEND_HOST` | `0.0.0.0` | Vite dev/preview host |
| `FRONTEND_PORT` | `5173` | dev port |
| `FRONTEND_PREVIEW_PORT` | `4173` | preview port |
| `FRONTEND_HTTP_PORT` | preview 回退值 | `preview:http` 使用的端口，默认 80 |
| `BACKEND_HOST` | `0.0.0.0` | proxy 配置；该值会转换为目标 `127.0.0.1` |
| `BACKEND_PORT` | `PORT` 或 `8080` | public API proxy port |

### 监控前端

| 变量 | 默认值 | 作用 |
| --- | --- | --- |
| `MONITOR_FRONTEND_HOST` | `127.0.0.1` | monitor dev host |
| `MONITOR_FRONTEND_PORT` | `5174` | monitor dev port |
| `MONITOR_PREVIEW_PORT` | `4174` | monitor preview port |
| `BUS_ANALYTICS_PRIVATE_HOST` | `127.0.0.1` | private API proxy host |
| `BUS_ANALYTICS_PRIVATE_PORT` | `18081` | private API proxy port |

## 前端命令

| 命令 | 作用 |
| --- | --- |
| `npm --prefix frontend run test` | 运行 Vitest 全部单元/契约测试 |
| `npm --prefix frontend run build` | 类型检查并构建 public 与 monitor 两套 bundle |
| `npm --prefix frontend run build:public` | 构建公开站并生成 locale HTML |
| `npm --prefix frontend run build:monitor` | 构建 `dist-monitor` |
| `npm --prefix frontend run test:e2e` | 公开页面 Playwright |
| `npm --prefix frontend run test:e2e:monitor` | 私有 Dashboard Playwright |
| `npm --prefix frontend run sanitize:screenshots` | 按 manifest 和 mask plan 处理首页截图 |
| `npm --prefix frontend run verify:vite-root-redirect` | 验证开发/预览根路径跳转 |

Playwright 配置会按测试范围启动自己的后端和前端服务。运行前检查是否有无关进程占用对应端口，不接管用户正在使用的服务。

## 后端命令

```bash
cd backend
go test ./...
```

涉及路线缓存、并发或 goroutine 时再运行定向 race 测试：

```bash
cd backend
go test -race ./internal/routes/application ./internal/routes/infrastructure/memory
```

涉及 analytics SQLite 性能边界时，百万行测试由 `BUS_RUN_MILLION_ROW_TEST` 显式启用；常规测试不会默认执行该高成本场景。

## OpenAPI 工作流

长期源文件位于 `shared/contracts/openapi/*.openapi.yaml`。feature 仍在演进时，先修改对应 `specs/<feature>/contracts/`，实现阶段再单向同步到 shared 入口。

```bash
npm --prefix frontend run openapi:lint
npm --prefix frontend run openapi:bundle
npm --prefix frontend run openapi:docs
```

- `openapi:lint` 同时检查 feature 与 shared 源契约。
- `openapi:bundle` 更新提交到仓库的 `*.bundle.yaml`。
- `openapi:docs` 在 `shared/contracts/openapi/docs/` 生成本地 HTML；该目录不提交，也不作为权威来源。
- 只调整路线或 analytics 时可使用 `openapi:routes:*`、`openapi:analytics:*` 窄命令，但完成跨契约变更前仍应运行全量 lint。

## Android APK 更新

```bash
backend/scripts/update_android_apk.py /absolute/path/to/BusIsComing.apk
```

脚本依赖 `aapt`，会读取 applicationId 和版本信息、复制 APK、计算大小/SHA-256 并整体更新 `current.json`。applicationId 仍需人工核对；详细流程和验证见 [Android APK 交付](android-apk-delivery.md)。

## 部署脚本验证

```bash
scripts/tests/deploy_test.sh
scripts/deploy.sh --help
```

不要通过阅读文档猜测参数；脚本 `--help` 和测试是当前命令面的直接证据。

## 常见问题

### 页面可用但没有统计

检查 `BUS_ANALYTICS_VISITOR_SECRET` 是否至少 32 bytes、SQLite 路径是否可写，以及 `/api/analytics/system` 的 health reason。统计 degraded 不应影响公开业务。

### 公开前端无法访问 API

确认后端从 `backend/` 工作目录启动、public listener 位于预期端口，并核对 `BACKEND_HOST`/`BACKEND_PORT`。默认 `0.0.0.0` 只属于 Vite 监听，Go public listener 默认是 `127.0.0.1`。

### 监控页面 404

开发时使用 `dev:monitor`；由 Go private listener 提供静态文件时先运行 `build:monitor`，并确认 `BUS_ANALYTICS_UI_ROOT` 指向存在的 `dist-monitor`。

### 生成 API HTML 后出现新目录

这是本地预览产物。确认源 YAML 和 bundle 正确后可删除生成目录；不要把 HTML 当作需要手工维护的第二份接口文档。
