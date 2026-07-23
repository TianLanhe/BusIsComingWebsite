# 011 实施验证结果

**验证日期**：2026-07-23
**状态**：完整实施门禁通过；命令均在本功能分支的最终候选代码上执行。

## OpenAPI 契约

- feature 与 shared `analytics-monitoring-api.openapi.yaml` 字节一致。
- `npm --prefix frontend run openapi:lint`：通过，010 下载/路线与 011 analytics 的 feature/shared 共 6 份契约均有效。
- `npm --prefix frontend run openapi:bundle`：通过，011 feature 临时 bundle 与 3 份 shared bundle 均成功生成。
- `npm --prefix frontend run openapi:docs`：通过，生成中文 analytics/download/route-query API UI。
- `frontend/dist` 只包含公开主页 HTML、三语页面、公开图片/CSS/JS、favicon、robots 与 sitemap；没有 OpenAPI/YAML/API UI 或 monitoring bundle。

## 100 万行 SQLite 性能

命令：

```bash
cd backend
BUS_RUN_MILLION_ROW_TEST=1 go test ./internal/analytics/infrastructure/sqlite \
  -run TestMillionRowCommonQueriesUseIndexesAndFinishWithinOneSecond -count=1 -v
```

fixture 精确写入 1,000,000 行。每条路径先预热 2 次，再测量 20 次，按最近秩法取 P95：

| 路径 | P95 | 最小值 | 最大值 | 目标 |
|---|---:|---:|---:|---:|
| 近 30 天总览 | 113.959ms | 106.832ms | 115.554ms | < 1s |
| 香港逐日流量桶 | 78.700ms | 73.555ms | 78.798ms | < 1s |
| 带多维筛选的事件摘要 | 21.961ms | 21.819ms | 22.163ms | < 1s |
| 单 Visitor 时间线 | 0.265ms | 0.224ms | 0.669ms | < 1s |

`EXPLAIN QUERY PLAN` 证明范围查询和摘要使用 `idx_analytics_events_time`，Visitor 时间线使用 `idx_analytics_events_visitor_time`。schema 审计只发现 `analytics_events` 与 `schema_migrations`，没有汇总表。

全部路径均达到目标，因此没有新增 `002` migration，也没有增加索引、表、缓存、队列、清理或备份逻辑；既有 query builder 已满足目标规模。

## 后端与隐私

- `go -C backend test ./...`：通过，所有后端 package 全部成功。
- `go test ./internal/analytics/interfaces/http -run TestPrivacySentinelsNeverReach -count=1 -v`：2/2 通过；IP、query/body、完整 UA/Referrer、Cookie、token、客户端 request ID 和 panic 值均未进入日志、事件、HTTP 响应、SQLite/WAL/SHM。
- recovery/logger/fail-open 专项：公开/私有 engine、脱敏 logger、受控 recovery、关闭/锁定 SQLite 与超时写入全部通过。审计期间补充了 analytics middleware 自身 panic 的失败测试，并以“外层 recovery 包住 analytics、内层 recovery 包住业务 handler”的顺序修复；业务 handler panic 仍可被打点为受控失败。
- `go list` 依赖审计：`domain` 只依赖标准库；`application` 只依赖 `domain` 与标准库；SQLite 通过 application 端口实现；HTTP adapter 不执行 SQL 或统计计算；composition root 负责组装实现。
- 生产源码没有业务 `panic`；唯一生产 goroutine 位于 server supervisor，并由 `safeServe` 的 `recover` 包装。公开/私有 engine 都启用 request logger 与 recovery。
- 私有监听地址始终由 `127.0.0.1:<port>` 生成，七个 `/api/analytics/*` 路由只注册到 private engine；public engine 只注册健康检查、下载和路线业务路由。

## 数据范围与存储边界

- `AnalyticsEvent` 与 `001_create_analytics_events.sql` 仍只有 `page_view`、`place_query`、`route_query`、`download_request` 四类事件。
- 事件模型只保存时间、22 位匿名 ID、事件/结果/状态分类、耗时、语言/设备/粗粒度来源和下载归因；完整 UA 只在请求期间做机器人/设备分类，Cookie 只用于解析签名匿名 ID，不持久化原值。
- schema 只有 `analytics_events` 明细表与 `schema_migrations`；没有汇总表、定时聚合、导出、编辑、删除、清理或备份能力。
- 本次没有新增公网端点、数据管理 endpoint、缓存、消息队列或后台任务。

## 前端、构建与产物隔离

- `npm --prefix frontend run test`：37 个 test file、151 个测试全部通过。
- `npm --prefix frontend run build`：TypeScript 两次 `--noEmit` 检查、public Vite 构建、三语静态页生成和 monitor Vite 构建均通过。monitor bundle 有 Vite 的单 chunk 大于 500 KiB 提示，但不影响构建或本次功能门禁。
- `frontend/dist` 与 `frontend/dist-monitor` 是两个独立目录；public bundle 不含 `BusIsComing Pulse`、`/api/analytics/overview` 或监控 CSS 标识，monitor 目录只有自身 HTML/CSS/JS，也不含公开主页图片。
- monitor 产物包含新的 `bucketStart`、`eventCount`、`uniqueVisitors` 逐日 Heatmap 字段；`analyticsContract.test.ts` 明确拒绝旧 `weekday/hour` item。

## 浏览器与视觉回归

- `npm --prefix frontend run test:e2e`：最终 28/28 通过，覆盖公开主页桌面/手机、APK 元数据与失败降级、下载、在线试查、轮播、三语隐私页。首次全量运行发现根路径改为默认繁中后两个旧测试使用了英文/过宽定位器；定位器按组件范围和显式 `/en/` 前置条件修复后全量通过。
- `npm --prefix frontend run test:e2e:monitor`：21 通过、1 个有意的 mobile-only skip；覆盖日期、图表、调查上下文、七工作区、三语、桌面/手机、五种全局状态和 system 局部失败。
- 最终生成 42 张 `workspace-{7 页面}-{3 语言}-{desktop/mobile}.png`、10 张五状态双端截图及图表/日期/调查/局部失败专项截图。
- 对照 Figma v1.1 `63:2118`/`67:672` 和 v1.2 `80:151` 抽查繁中桌面总览、英文手机事件、简中桌面性能和英文手机系统：信息架构、40/36px 指标、图例/坐标、卡片、底部导航和状态层级一致；手机语言控件已扩宽，未发现页面级横向溢出或关键文案裁切。

## 本地入口、三进程与部署

- `npm --prefix frontend run verify:vite-root-redirect`：dev 与 preview 的 GET/HEAD `/` 均为 302 且 Location `/zh-hant/`；POST `/`、locale、asset、API 保持原行为；monitor config 未安装插件。
- quickstart 三进程实测：Go public/private listener、公开 Vite 15173、monitor Vite 15174 同时启动；公开根路径 `302 → /zh-hant/`，本地化主页、APK metadata、monitor HTML 与代理后的 `/api/analytics/system` 均为 200。
- `bash scripts/tests/deploy_test.sh`：全部 shell 用例通过；发布包同时包含 public/monitor bundle 与后端，私有 analytics 失败只标记 degraded，激活失败可整体恢复，不能新旧混搭。
- Figma import `app.js` 语法、`manifest.json`/`tokens.json` JSON 和四张导出截图均通过本地校验。

## 提交前检查

- `verification-matrix.md` 已把 FR-001–FR-030、SC-001–SC-012 映射到自动化与视觉证据。
- `git diff --check`、tasks 完成度和 staged 文件范围在最终提交前再次执行。
- 用户现有 `backend/downloads/android/BusIsComing.apk` 与 `backend/downloads/android/current.json` 改动不会进入提交。
