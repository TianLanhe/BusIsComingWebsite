# 快速验证：在线路线查询性能优化

## 前置条件

- 后端 Go 环境可用：`cd backend && go version`
- 前端依赖已安装，可运行 Redocly：`cd frontend && npm install`
- 外部网络可访问 Citybus mobile 和 DATA.GOV.HK 时，可执行 live 复现；默认自动化验证不依赖 live 网络。

## 1. 后端单元测试

```bash
cd backend
go test ./...
```

预期结果：

- 所有后端测试通过。
- Citybus 路线解析测试覆盖繁体、简体和英文 fixture。
- `StopClient` 成功站名 1 天缓存、失败不缓存、语言隔离和过期重试测试通过。
- `showstops2` 站点地图成功结果 1 天缓存、失败不缓存和语言隔离测试通过。
- `StopSummary.Name` 短名化测试通过，包含 `樂軒臺, 柴灣道`、`乐轩台, 柴湾道`、`Lok Hin Terrace, Chai Wan Road`。
- ETA token signer 测试确认新签发 token payload 不包含 `serviceType`。

## 2. 并发与缓存 race 验证

```bash
cd backend
go test -race ./internal/routes/application ./internal/routes/infrastructure/memory ./internal/routes/infrastructure/citybus
```

预期结果：

- 固定 `T/F/W` 三模式并行测试通过。
- 单个模式失败或 panic 时，成功模式结果仍可返回。
- 三个模式都失败或无可解析路线时返回既有不可用降级。
- `memory.TTLCache` 在并发读写下无 data race。

## 3. OpenAPI 未漂移验证

```bash
npm --prefix frontend run openapi:routes:lint
npm --prefix frontend run openapi:routes:bundle
git diff -- shared/contracts/openapi/route-query-api.openapi.yaml
```

预期结果：

- Redocly lint 通过。
- bundle 产物 `shared/contracts/openapi/route-query-api.bundle.yaml` 可生成。
- `route-query-api.openapi.yaml` 没有因内部性能优化发生字段漂移。
- API 标题、摘要、参数说明、响应说明、错误说明和示例说明仍为中文。

## 4. 三语 fixture 验证

实现阶段应在后端测试中保留或新增代表性 Citybus fixture，覆盖：

- `zh-Hant`：`港元`、`至`、`預計`、`分鐘`、`步行距離`、`米`。
- `zh-Hans`：`港元`、`至`、`预计`、`分钟`、`步行距离`、`米`。
- `en`：`Hong Kong Dollar`、`To`、`Estimated`、`Min`、`Walking distance`、`m`。

预期结果：

- 同一组起终点在三种语言 fixture 下都返回至少 1 条路线。
- 每条被纳入结果的路线包含路线号链、HKD 价格、耗时分钟数、步行距离米数和 P2P 资料。
- 上车站和下车站按当前语言短名展示。
- `etaToken` 可签发时不依赖 `ServiceType`。

## 5. 缓存行为验证

建议测试用例：

1. 同一 `stopID + language` 第一次命中外部 `StopClient`，第二次 1 天内命中缓存。
2. 同一 `stopID` 不同 language 不串用站名。
3. `StopClient` 返回错误、空 JSON 或缺少可用语言字段时不缓存。
4. 同一 `rawInfo + language` 第一次请求 `showstops2`，第二次 1 天内复用解析后 `P2PStop[]`。
5. `showstops2` 返回空结果或不可解析 HTML 时不缓存。
6. 时钟推进超过 1 天后，站名和站点地图都会重新请求外部服务。

预期结果：

- 缓存命中时外部请求计数不增加。
- 失败不缓存场景后续请求仍会重试。
- 缓存值不包含第三方 HTML 原文。

## 6. 性能目标验证

使用可控 fake HTTP client 或测试服务器模拟三模式延迟：

- `T` 延迟 100ms 成功。
- `F` 延迟 300ms 成功。
- `W` 延迟 500ms 成功。

预期结果：

- 并行总耗时接近最慢成功模式，而不是 900ms 串行相加。
- 合并后结果顺序稳定，不随完成顺序变化。
- 重复查询中稳定站点资料相关外部请求数量相较无缓存实现减少至少 80%。

## 7. 本地 API 手动验证

启动后端：

```bash
cd backend
BUS_HTTP_HOST=127.0.0.1 PORT=18081 go run ./cmd/server
```

地点检索：

```bash
curl -sS http://127.0.0.1:18081/api/routes/query_places \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"manual-009-places-origin","language":"zh-Hant","query":"興華","limit":10}'
```

用返回的 `placeToken` 分别取得起点和终点后查询路线：

```bash
curl -sS http://127.0.0.1:18081/api/routes/query_routes \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"manual-009-routes","language":"zh-Hant","originPlaceToken":"<origin token>","destinationPlaceToken":"<destination token>"}'
```

预期结果：

- 响应仍为 `{ requestId, data, error }` envelope。
- `data.routes[].boardingStop.name` 和 `data.routes[].alightingStop.name` 为当前语言短名。
- `fare.currency` 仍为 `HKD`，`durationMinutes` 和 `walkingDistanceMeters` 为数值。
- 前端不需要新增字段或特殊语言处理。

批量 ETA：

```bash
curl -sS http://127.0.0.1:18081/api/routes/query_etas \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"manual-009-etas","language":"zh-Hant","etaTokens":["<eta token>"]}'
```

预期结果：

- 单条 ETA 成功则返回 `waiting` 或 `arriving`。
- 单条 ETA 不可用则返回 `unavailable`，不影响路线摘要。

## 8. Citybus live 复现步骤（按需人工验证）

默认 CI 不依赖 live 网络；实现完成后可按需使用真实 Citybus 响应确认 fixture 仍覆盖当前格式。

1. 使用以下代表性起终点坐标构造 `ppsearch_p3.php` 查询：
   - 起点：`slat=22.267079693838`、`slon=114.24208950984`，代表柴湾兴华一带常见上车点。
   - 终点：`elat=22.28851621`、`elon=114.19628118`，代表北角/柴湾道方向常见下车点。
2. 分别设置语言参数：
   - `l=0`：繁体中文
   - `l=1`：英文
   - `l=2`：简体中文
3. 保持 `ws=1.3`、`leg=2`，分别请求 `m1=T`、`m1=F`、`m1=W`。
4. 保存响应片段到本地临时文件，仅用于人工对比；不要提交含大段第三方 HTML 的无关文件。
5. 对照后端解析结果，确认三种语言都能解析路线号链、价格、耗时、步行距离和 P2P 资料。

预期结果：

- 如果 live 响应格式与 fixture 不一致，应先更新 fixture 和解析测试，再实现代码修复。
- 如果 live 网络失败，不影响默认自动化验证结论。
- 代表性成功解析至少应包含：`routeNumbers` 非空、`fare.currency=HKD`、`durationMinutes` 为数值、`walkingDistanceMeters` 为数值、`RawInfo`/P2P 资料可用于站点预览。

## 9. 日志与稳健性验证

触发以下场景：

- 某个搜索模式返回 HTTP 错误。
- 某个搜索模式返回不可解析 HTML。
- 某个搜索模式测试替身 panic。
- `StopClient` 失败后使用 `showstops2 displayName` fallback。
- 缓存命中和缓存过期。

预期结果：

- HTTP 进程不 panic。
- 单个模式失败不会清空其它成功模式结果。
- 日志包含 requestId、operationId、stage、language、durationMs、resultCount、cacheHit 或 mode 等脱敏字段。
- 日志不得包含 token、完整外部 URL、第三方原始响应、HTML、密钥或 Cookie。

## 10. 前端兼容回归（可选）

本轮不修改前端；如果实现阶段触碰响应映射或共享类型，可复用现有在线查询测试：

```bash
npm --prefix frontend run test -- online-query-demo i18n-completeness content-contract
```

必要时启动后端并运行：

```bash
npm --prefix frontend run test:e2e -- online-query-demo.spec.ts
```

预期结果：

- 现有在线查询页面无需修改即可展示路线结果。
- 手机和桌面布局不因响应结构变化出现回归。

## 11. 提交前检查

```bash
git diff --check
git status --short
```

预期结果：

- 无空白错误。
- 仅包含本轮实现、测试和 009 文档范围内的改动。

## 12. 实现阶段验证记录（2026-07-01）

- `requirements.md` checklist：16/16 通过。
- Ignore 检查：`.gitignore` 已覆盖 Node、Go、通用产物，并补充 `.cache/` 以隔离仓库内 Go build cache。
- 后端单元测试：`env GOCACHE=/Users/jianglijie/Documents/BusIsCommingWebsite/.cache/go-build go test ./...` 通过。
- 并发与缓存 race 验证：`env GOCACHE=/Users/jianglijie/Documents/BusIsCommingWebsite/.cache/go-build go test -race ./internal/routes/application ./internal/routes/infrastructure/memory ./internal/routes/infrastructure/citybus` 通过。
- OpenAPI lint：`npm --prefix frontend run openapi:routes:lint` 通过。
- OpenAPI bundle：`npm --prefix frontend run openapi:routes:bundle` 通过。
- OpenAPI 源契约漂移检查：`git diff -- shared/contracts/openapi/route-query-api.openapi.yaml` 无输出，源契约未漂移。
- 前端类型漂移检查：`git diff -- frontend/src/services/routeQueryTypes.ts` 无输出，前端 route query 类型未改动。
- 三语 fixture：已新增 `zh-hant.html`、`zh-hans.html`、`en.html`，并由 `TestParseRouteResponseParsesThreeLanguageFixtures` 覆盖价格、路线号、耗时、步行距离和 P2P 资料。
- 稳定站点资料请求减少：`TestStopClientCachesSuccessfulShortNameForOneDay` 覆盖同一 `stopID + language` 第二次请求外部计数不增加；`TestSearchRoutesCachesStopMapSuccessAcrossQueries` 覆盖重复路线查询第二次 `showstops2` 请求不增加，代表性重复查询中稳定站点资料外部请求由 1 次降为 0 次。
- 三模式并行性能：`TestSearchRoutesRunsModesConcurrently` 模拟 `T/F/W` 不同延迟，验证最大并发大于 1 且总耗时低于串行相加。
- 日志与稳健性：`TestSearchRoutesRecoversModePanicAndLogsObservations` 覆盖单模式 panic recover、模式失败观测和脱敏字段检查；`TestSearchRoutesCachesStopMapSuccessAcrossQueries` 覆盖缓存命中观测。
- DDD 依赖方向：检查 `backend/internal/routes/domain` 未依赖 Gin、HTTP client、文件系统、数据库或前端契约；本轮新增缓存和 Citybus/DATA.GOV.HK 外部适配均位于 infrastructure，HTTP envelope 未改。
- 中文注释质量：缓存成功/失败不缓存、站名短名化、三语解析、并行模式和 recover 均已补充聚焦中文注释，未为简单赋值添加噪音注释。
- 范围排除：本轮未修改前端 UI、Figma、用户可见固定文案、完整路线规划或非香港巴士查询范围。
- Citybus live 复现：未执行；默认门禁由离线三语 fixture 和 Go 自动化测试覆盖。live 步骤已沉淀在第 8 节，后续仅作为人工确认真实 Citybus 响应仍可解析的补充材料。
- 提交前状态：`git diff --check` 通过；`git status --short --ignored=matching` 仅显示本轮实现/测试/009 文档改动、三语 fixture 新文件和已忽略的本地缓存/构建目录。
