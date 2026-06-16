# 快速验证：在线巴士路线查询

## 前置条件

- 已安装前端依赖：`cd frontend && npm install`
- Go 可用：`cd backend && go version`
- Figma 设计已补齐：见 [figma.md](./figma.md)
- 外部网络可访问 Citybus mobile 和 DATA.GOV.HK

## 契约验证

```bash
cd frontend
npx redocly lint ../specs/004-online-bus-query/contracts/route-query-api.openapi.yaml
npx redocly bundle ../specs/004-online-bus-query/contracts/route-query-api.openapi.yaml -o ../specs/004-online-bus-query/contracts/route-query-api.bundle.yaml
```

预期结果：

- OpenAPI lint 通过。
- bundle 文件生成成功：`specs/004-online-bus-query/contracts/route-query-api.bundle.yaml`。
- API 标题、摘要、参数说明、响应说明、错误说明和示例说明为中文。

## 后端验证

```bash
cd backend
go test ./...
go run ./cmd/server
```

预期结果：

- 所有 Go 测试通过。
- 服务启动时启用请求日志和 panic recovery。
- 新增 `routes` bounded context 的领域层不依赖 Gin、文件系统、HTTP 客户端或前端契约。
- 如果实现中使用并发 ETA 查询，测试或审查必须确认 goroutine 包装 recover 并记录脱敏错误上下文。

## API 手动验证

地点检索：

```bash
curl -sS http://127.0.0.1:8080/api/routes/query_places \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"manual-places-001","language":"zh-Hans","query":"兴华","limit":100}'
```

预期结果：

- 响应为 JSON envelope。
- `requestId` 回传。
- `data.places` 最多 100 条。
- 每条候选只包含当前语言地点名和 `placeToken`，不要求前端提交裸经纬度。

路线查询：

```bash
curl -sS http://127.0.0.1:8080/api/routes/query_routes \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"manual-routes-001","language":"zh-Hans","originPlaceToken":"<origin token>","destinationPlaceToken":"<destination token>"}'
```

预期结果：

- 成功时 `data.routes` 最多 20 条，按耗时排序。
- 0 条路线返回 200 和空数组，不作为错误。
- 每条路线包含路线号链、上车站、下车站、HKD 价格、耗时、步行距离和可选 `etaToken`。

批量 ETA：

```bash
curl -sS http://127.0.0.1:8080/api/routes/query_etas \
  -H 'Content-Type: application/json' \
  -d '{"requestId":"manual-etas-001","language":"zh-Hans","etaTokens":["<eta token>"]}'
```

预期结果：

- 一次请求返回所有 token 的首程候车状态。
- 单条 ETA 不可用以 `status: unavailable` 表达，不要求前端清空路线结果。

## 前端单元测试

```bash
cd frontend
npm run test -- online-query-demo
npm run test -- i18n-completeness
```

预期结果：

- 起点/终点必须选择候选后才能查询。
- 起终点相同会显示字段级错误。
- 快速输入和快速查询时旧响应不会覆盖新状态。
- 语言切换会重查同一组起终点；重查失败保留旧结果。
- 起终点变更后的查询失败不展示旧路线。
- 新增用户可见文字覆盖 `zh-Hant`、`zh-Hans` 和 `en`。

## 前端端到端验证

启动服务：

```bash
cd backend
go run ./cmd/server
```

另一个终端：

```bash
cd frontend
npm run dev -- --port 5173
npm run test:e2e -- online-query-demo.spec.ts
```

必须覆盖的 viewport：

- 桌面 1440px
- 手机 390px

必须保存或核对的状态：

- 初始空态
- 地点候选下拉，可视 8-10 条并滚动
- 查询 loading
- 路线结果卡
- ETA 更新前后的候车状态
- 0 路线空态
- 外部服务失败
- 语言切换失败保留旧结果

截图保存到 `specs/004-online-bus-query/visual-review/`，并与 [figma.md](./figma.md) 记录的节点对齐。

## 日志验证

触发一次成功路线查询和一次失败查询后，检查服务端 stdout 日志：

- 能用同一个 `requestId` 串联请求入口、外部调用、缓存/限流、路线结果、ETA 结果和错误映射。
- 成功日志包含语言、阶段、耗时、结果数量、缓存命中和必要起终点信息。
- 错误日志包含错误码和降级原因。
- 日志不得包含 Cookie、token、完整外部 URL、第三方原始响应、HTML、密钥或私有路径。
- 应用内不实现日志文件轮转；7 天保留由部署层负责。

## 范围回归

页面和 FAQ 不得出现以下当前可用暗示：

- 完整出行路线规划
- 港铁、铁路、渡轮、步行或其他非香港巴士交通查询
- 路线保存
- 监控或铃铛入口
- 多班 ETA
- 排序 UI
- 路线详情展开

## 2026-06-16 实现验证记录

- OpenAPI：`cd frontend && npm run openapi:routes:lint` 通过；`npm run openapi:routes:bundle` 已生成 `shared/contracts/openapi/route-query-api.bundle.yaml`。
- Feature bundle：`cd frontend && npm exec redocly -- bundle ../specs/004-online-bus-query/contracts/route-query-api.openapi.yaml -o ../specs/004-online-bus-query/contracts/route-query-api.bundle.yaml` 通过。
- 后端：`cd backend && GOCACHE=/tmp/busiscoming-go-build go test ./...` 通过。
- 前端目标测试：`cd frontend && npm run test -- online-query-demo i18n-completeness content-contract` 通过。
- 前端完整测试：`cd frontend && npm run test` 通过，7 个测试文件、19 个测试通过。
- 前端构建：`cd frontend && npm run build` 通过。
- E2E：`cd frontend && npm run test:e2e -- online-query-demo.spec.ts` 通过，覆盖 `desktop-1440` 和 `mobile-390`。
- 截图：已生成 `specs/004-online-bus-query/visual-review/desktop-1440-route-results.png` 和 `specs/004-online-bus-query/visual-review/mobile-390-route-results.png`。
- curl envelope：临时启动 `PORT=18081 GOCACHE=/tmp/busiscoming-go-build go run ./cmd/server` 后验证三接口；`query_places` 空 query 返回 `INVALID_ARGUMENT` envelope，`query_routes` 非法 token 返回 `PLACE_TOKEN_INVALID` envelope，`query_etas` 非法 token 返回 `status: unavailable` 且 `error: null`。
- 日志：临时服务 stdout 输出 server startup、Gin 请求日志和 `queryRouteEtas` 结构化结果日志，包含 `requestId`、`operationId`、`stage`、`language`、`resultCount` 和 `cacheHit`，未输出 token、完整外部 URL、第三方原始响应或 HTML。
- 空白检查：`git diff --check` 通过。
