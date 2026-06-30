# 研究记录：在线路线查询性能优化

## 决策 1：稳定站名使用 `StopClient` 成功结果 1 天缓存

**Decision**：保留 DATA.GOV.HK `StopClient` 作为三语站名来源，在基础设施层增加成功结果缓存，key 为 `stopID + language`，TTL 为 1 天。失败、空站名、缺少当前语言且无法回退的结果不缓存。

**Rationale**：DATA.GOV.HK stop 资料相对稳定，路线卡重复引用同一 stop id 的概率高。缓存成功结果能减少重复外部请求，同时保留当前语言选择和 DATA.GOV.HK 三语字段质量。

**Alternatives considered**：直接删除 `StopClient` 并使用 `showstops2 displayName`；这更接近 Citybus P2P 原文，但会失去 DATA.GOV.HK 三语字段和既有语言回退能力。缓存失败结果；这会把短暂外部故障放大为 1 天站名缺失。

## 决策 2：`showstops2` 站点地图使用 1 天成功结果缓存

**Decision**：在 Citybus 基础设施适配层缓存成功解析且非空的 P2P 站点地图，key 为 `rawInfo + language`，TTL 为 1 天；缓存值包含上车站、下车站、stop id、sequence、routeVariant、bound 和 displayName 等解析后结构。

**Rationale**：站点地图既用于路线卡站点预览，也用于首程 ETA stop id 补齐。它比实时 ETA 稳定得多，按语言隔离后可安全复用，并减少重复解析同一 P2P 资料的等待。

**Alternatives considered**：缓存原始 HTML；会增加第三方原始响应泄露和日志误用风险，也让失败解析难以区分。把站点地图缓存放到应用层；应用层不应该知道 Citybus `rawInfo` 和 `showstops2` 细节，放在基础设施层更符合 DDD 边界。

## 决策 3：不做 in-flight 去重

**Decision**：本轮只缓存已成功完成的结果，不合并同时进行中的相同 stop id 或 P2P 请求。

**Rationale**：用户已确认暂不做 in-flight 去重。当前目标是降低重复查询后的外部请求数量和提升可重复体验；同时请求合并会引入更复杂的锁、等待者取消和错误广播语义，适合后续压测证明必要后再做。

**Alternatives considered**：引入 singleflight 或自写 in-flight map；可以进一步降低瞬时重复请求，但会扩大并发取消、超时和错误传播复杂度，不符合本轮范围。

## 决策 4：`T/F/W` 三种路线搜索模式固定并行，按模式顺序合并

**Decision**：`RouteClient.SearchRoutes` 同时发起 `T`、`F`、`W` 三个固定模式请求。每个模式独立解析和填充站点预览；单个模式失败只记录该模式失败并继续。合并时按固定模式顺序收集成功结果，再执行既有去重和按耗时排序。

**Rationale**：三种模式没有用户可见的先后依赖，固定并行能降低等待；按固定模式顺序合并能避免完成顺序导致排序抖动；全部模式失败或都无可解析路线时才返回不可用。

**Alternatives considered**：继续串行；实现简单但等待时间接近三次外部调用相加。按完成顺序合并；会让结果顺序受网络波动影响。无限制按路线再并发；会放大上游请求，不符合容量边界。

## 决策 5：三语解析以离线 fixture 为默认门禁，live 仅作人工复现

**Decision**：为繁体、简体、英文 Citybus `ppsearch_p3.php` 响应保留离线 fixture，覆盖路线号链、价格、耗时、步行距离、P2P 资料和站点预览。quickstart 记录按需 live 复现步骤，但 live 不作为默认 CI 门禁。

**Rationale**：Citybus live 响应会受网络、上游格式和时间影响；默认门禁必须稳定可复现。fixture 保留第三方原文语义，能直接防止再次只识别“預計”或英文 `min` 而漏掉简体“预计”等问题。

**Alternatives considered**：只在 live 环境手动验证；无法稳定复现，不适合回归。把 fixture 改写成项目自定义文本；会掩盖真实第三方格式差异，违反外部样例保持原语义约束。

## 决策 6：站点名称在写入 `StopSummary.Name` 前统一短名化

**Decision**：无论站名来自 `StopClient` 还是 `showstops2 displayName`，最终写入 `StopSummary.Name` 前都执行同一短名化规则：移除序号前缀，去除逗号后的道路或区域补充，保留当前语言站点主体名称。

**Rationale**：用户指出前端仍出现如“樂軒臺, 柴灣道”的长站名。统一短名化可以让 DATA.GOV.HK 和 Citybus fallback 结果在路线卡上长度一致，减少手机端换行和视觉抖动。

**Alternatives considered**：只短名化 `showstops2`，保留 DATA.GOV.HK 全名；会导致来源不同展示长短不一致。直接在前端截断；只能遮住问题，无法保证 API 语义和测试稳定。

## 决策 7：清理 `EtaPayload.ServiceType`

**Decision**：从领域 `EtaTokenPayload` 和 token 签发路径中移除未使用的 `ServiceType` 字段。ETA 查询仍使用 company、stopId、routeNumber、direction、routeVariant、boardingSeq、alightingSeq 和 rawInfo 等实际字段。

**Rationale**：当前 DATA.GOV.HK ETA URL 和匹配逻辑不使用 `ServiceType`；固定写入 `"1"` 容易误导后续维护者，以为它影响 ETA 查询。Go JSON 解码会忽略旧 token 中未知字段，因此短期兼容性风险低；旧 token 也只有 5 分钟有效。

**Alternatives considered**：保留字段但加注释；仍会延续无效语义。把 `ServiceType` 暴露给前端或 OpenAPI；没有业务价值且会扩大契约面。

## 决策 8：OpenAPI 不新增 feature 副本，只做共享契约未漂移验证

**Decision**：本轮不在 `specs/009-route-query-performance/contracts/` 新建 OpenAPI YAML；公开 HTTP 契约继续引用 `shared/contracts/openapi/route-query-api.openapi.yaml`。feature contract 记录内部行为不变量，quickstart 运行 Redocly lint/bundle 并检查源文件未漂移。

**Rationale**：本功能不新增、修改或移除 HTTP API。重复一份 OpenAPI 容易造成后续双源漂移；以共享契约为权威更符合当前实现状态。

**Alternatives considered**：复制 004 的 OpenAPI 到 009 contracts；会制造重复维护成本。完全不提 OpenAPI；不满足宪法中服务端接口文档和未漂移验证要求。

## 决策 9：并行任务必须 recover 并记录脱敏上下文

**Decision**：新增的三模式并行任务必须使用 `defer recover` 或等价包装，把 panic 转为该模式失败，并记录 operation、mode、language、error type 和耗时等脱敏上下文；不得记录 token、完整 URL、HTML 或第三方原始响应。

**Rationale**：宪法要求任何自建 goroutine 都要 recover，且 Citybus HTML 解析和外部请求均属于不稳定边界。单个模式异常不应导致 HTTP 进程或整个路线查询崩溃。

**Alternatives considered**：依赖 Gin recovery；Gin 只能覆盖 HTTP handler goroutine，不能覆盖自建 goroutine。静默吞掉错误；会降低问题定位能力。
