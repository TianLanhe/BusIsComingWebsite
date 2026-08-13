# 匿名统计与私有监控

本文记录网站匿名事件、visitor cookie、SQLite、fail-open 写入和 Pulse Dashboard 的长期边界。用户可见披露以三语隐私政策页为准；私有查询 schema 以 `shared/contracts/openapi/analytics-monitoring-api.openapi.yaml` 为准。

## 目标与非目标

统计用于回答：

- 主页、地点试查、路线试查和 APK 下载是否被使用；
- 请求成功、失败和性能分布；
- 不同 locale、设备类别和粗粒度来源的趋势；
- 单个匿名 visitor ID 的事件时间线，用于排查产品流失和异常。

它不是账号系统、广告跟踪、用户画像或安装追踪。PV/UV 只描述匿名浏览器标识和事件，不等同自然人数。

## 事件白名单

公开 middleware 只观察四个 endpoint：

| HTTP 请求 | `event_type` | 说明 |
| --- | --- | --- |
| `GET /api/downloads/android/latest/metadata` | `page_view` | 只有合法主页 locale header 才记录 |
| `POST /api/routes/query_places` | `place_query` | 地点候选试查 |
| `POST /api/routes/query_routes` | `route_query` | 路线摘要试查 |
| `GET /api/downloads/android/latest` | `download_request` | 下载请求，不代表安装 |

`query_etas`、健康检查、静态文件、隐私页和私有 analytics API 不产生上述事件。新增事件必须显式修改 domain enum、SQLite CHECK、middleware 白名单、OpenAPI、Dashboard、隐私政策和测试。

## Visitor cookie

Cookie 名称为 `__Host-bic-visitor`：

- 128-bit 随机 visitor ID；base64url 后为 22 字符；
- HMAC 签名，格式带版本与签发时间；
- 从签发时间起一年有效，允许最多 5 分钟时钟偏差；
- `Path=/`、`Secure`、`HttpOnly`、`SameSite=Lax`，不设置 Domain；
- 无效、篡改或过期值会被替换为新凭证。

只有 SQLite 可用、写入配置有效且 `BUS_ANALYTICS_VISITOR_SECRET` 至少 32 bytes 时才启用 tracking middleware。secret 不足或数据库不可用会进入 degraded/unavailable，而不是使用弱默认值。

已知机器人在读取、验证或签发 Cookie 前被跳过。当前识别包含常见搜索/社交 crawler，以及 HeadlessChrome、Playwright、Puppeteer、Lighthouse、curl、wget 等自动客户端。

## 收集的字段

每条 `analytics_events` 只允许：

- UTC 毫秒事件时间；
- 22 字符匿名 visitor ID；
- event type、success/failure、HTTP status/status class；
- 受控 failure category；
- 服务端处理 duration；
- locale；
- `desktop/mobile/tablet/other` 设备类别；
- `direct/search/referral/internal/unknown` 来源类别；
- 下载事件成功时的 platform、versionName、versionCode、sizeBytes。

设备类别使用完整 User-Agent 在内存中瞬时分类，来源类别由前端把 `document.referrer` 转成粗粒度 header；原始值不进入事件或日志。

## 明确禁止的字段

统计、SQLite、普通 HTTP 日志和私有查询结果不得保存或输出：

- IP 或 remote address；
- 完整 User-Agent、Referrer 或 URL/query；
- Cookie 原文或签名；
- 客户端提供的 request ID；
- request/response body；
- 起点、终点、地点名、坐标、路线查询内容；
- `placeToken`、`etaToken`、visitor secret 或 route secret；
- 第三方完整 URL、HTML 或 JSON 响应；
- panic 原文中的不受控敏感内容。

`privacy_sentinel_test.go` 会把唯一 sentinel 放进 IP、query、body、坐标、token、UA、Referrer、Cookie 和 panic，检查日志、event、SQLite/WAL/SHM 与私有响应中均不存在这些值。

## Outcome 与失败分类

middleware 在 handler 完成后读取实际 HTTP status：

- 2xx → `success`；
- 其它 status → `failure`；
- failure 必须有受控 category；
- 下载成功必须使用本次实际响应的版本与大小；
- handler 可以通过 observation 写入更准确的 locale、failure category 或 download attribution。

HTTP recovery 位于 analytics 内外两层：业务 panic 先变成受控 500，analytics 再把它记录为失败；analytics 自身 panic 也被外层 recovery 保护。

## Fail-open 写入

事件写入属于公开请求的附属 best-effort 操作：

- 默认 timeout 50ms；
- 配置只接受 10–200ms；
- 即使公开 request context 已取消，也会使用独立短 deadline 尝试一次写入；
- SQLite busy timeout 固定 200ms，写入 use case 的 deadline 提供更严格上限；
- 写入超时/失败只更新 runtime health 和 dropped count，不修改公开业务 status/body；
- 数据库启动失败时使用 no-op tracking，公开服务仍可用。

“fail-open”不表示静默：`/api/analytics/system` 应展示 database state、reason、last successful write 和 dropped count，部署/运行日志记录受控状态。

## SQLite

默认本地路径为 `../shared/analytics/analytics.sqlite`，生产位于部署根目录 `shared/analytics/`。

运行设置：

- modernc SQLite，最低 runtime 版本由代码检查；
- WAL journal mode；
- `synchronous=NORMAL`；
- busy timeout 200ms；
- 最多 4 个 open/idle connections；
- migration 版本记录在 `schema_migrations`。

事件表使用 CHECK constraint 限制 enum、status、下载归因和 success/failure 一致性，并按时间、事件、visitor、outcome、download、failure 建索引。

当前没有：

- 自动删除或 retention job；
- 数据备份或恢复点；
- 跨机复制；
- 代码 release 内的 SQLite 副本。

数据长期保留，但允许因磁盘、主机或人工运维故障丢失。若将来增加 retention、备份、导出或删除权利，必须先更新产品/隐私决策、migration、部署和用户可见政策。

## 私有 API 与 Dashboard

private listener 注册七个只读资源：

- `/api/analytics/overview`
- `/api/analytics/traffic`
- `/api/analytics/downloads`
- `/api/analytics/events`
- `/api/analytics/visitor`
- `/api/analytics/performance`
- `/api/analytics/system`

Pulse Dashboard 由同一 private listener 从 `BUS_ANALYTICS_UI_ROOT` 提供，并对静态文件与 API 使用 `Cache-Control: no-store`，避免 tunnel 浏览器跨部署保留旧 shell。

当前 API 没有应用层账号或 bearer authentication；安全边界是强制 loopback 绑定、Caddy/UFW 不暴露、维护者 SSH 权限和隧道。不得为了方便访问而：

- 把 private routes 注册到 public engine；
- 在 Caddy 代理 `/api/analytics/*` 或 `dist-monitor`；
- 把 18081 绑定 `0.0.0.0`/`[::]`；
- 在 UFW 或云安全组开放 18081；
- 把 private bundle 复制到 `frontend/dist`。

生产访问：

```bash
ssh -N -L 18081:127.0.0.1:18081 root@<server-ip>
```

然后打开 `http://127.0.0.1:18081/`。详细权限、目录和故障处理见[部署说明](deployment.md)。

## Dashboard 数据语义

- overview、traffic、downloads、events、performance 采用请求时过滤和聚合，不维护另一份汇总数据库。
- 时间范围使用明确起止时间和 granularity；业务日期按香港时区理解。
- 比较期基于同长度前一周期；上一期为零时不伪造无限百分比。
- visitor 页面输入的是 22 字符匿名 ID，不是 Cookie 原文。
- system 页面显示 SQLite、进程、listener 和运行 health，不包含 secret 或私有文件内容。
- 示例/Figma 数字只用于布局，不得成为 no-data 或错误状态的回退数据。

## 用户可见披露

三语隐私政策由 `frontend/src/content/privacyPolicyContent.ts` 维护，静态 locale HTML 还包含无 JavaScript fallback。当前政策需要准确说明：

- 匿名统计始终没有用户 opt-out；runtime 故障可能导致事件丢失，但不是用户选择开关；
- visitor ID 有效一年；
- 记录最小事件并长期保留；
- UV 不等同自然人数；
- 不记录 IP、完整 UA/Referrer、Cookie、URL/body、地点、坐标或查询内容；
- 已知机器人不形成统计明细；
- 统计没有备份和自动删除，可能丢失。

改变上述任一事实时，必须在同一变更中更新隐私政策、SEO fallback、OpenAPI、测试和本文。

## 验证

```bash
cd backend
go test ./internal/analytics/... ./internal/platform/httpserver/... ./cmd/server/...

cd ../frontend
npm run test
npm run build
npm run test:e2e:monitor
npm run openapi:analytics:lint
npm run openapi:analytics:bundle
```

生产隔离还需要检查：

```bash
ss -ltnp | grep 18081
curl http://127.0.0.1:18081/api/analytics/system
```

监听必须是 loopback；private health 失败应产生 degraded warning，但不能让公开 HTTPS 部署回滚。

## 修改检查

1. event endpoint 白名单和 enum 是否同步；
2. 新字段是否真的必要，是否触及禁止字段；
3. bot、cookie、secret 和 expiry 是否保持安全；
4. 写入仍受 200ms 绝对上限和 fail-open 保护；
5. migration、索引、查询和百万行性能验证是否匹配；
6. private listener/Caddy/UFW 边界是否保持；
7. Dashboard 空、错、部分失败和移动端状态是否有真实契约；
8. 用户可见隐私政策是否与实现同步；
9. sentinel 测试是否覆盖新入口和存储介质。
