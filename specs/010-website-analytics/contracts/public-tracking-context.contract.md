# 公开请求匿名统计上下文契约

本契约定义四个公开打点入口共享的跨切面行为。它不新增业务 body 字段，也不改变地点、路线或
下载的原有成功/失败语义。

## 匿名 visitor 传输

- Cookie 名称：`__Host-bic-visitor`。
- Cookie 属性：`HttpOnly; Secure; SameSite=Lax; Path=/`，不设置 `Domain`，有效期一年。
- visitor ID 不得出现在 path、query、request body 或前端 JavaScript 可读状态中。
- 普通非机器人请求缺失、过期或签名无效时，任一打点入口均可通过 `Set-Cookie` 签发/轮换。
- 已知机器人不签发 Cookie、不保存事件，也不写 bot 标记或专门机器人明细日志。位于 bot 判断
  之前的通用脱敏 request logger 仍可写一条与普通请求相同的日志，但只能包含服务端 request ID、
  method、route template、operationId、bounded context、status、duration 和 body size，不得包含
  bot 标记、IP、User-Agent、Cookie 或其他身份线索。

## 可选粗粒度 header

| Header | 允许值 | 适用入口 | 规则 |
|--------|--------|----------|------|
| `X-BusIsComing-Home-Locale` | `zh-Hant/zh-Hans/en` | APK metadata | 只有精确主页分支发送；合法值触发 `page_view`，缺失/非法不影响 metadata 响应 |
| `X-BusIsComing-Traffic-Source` | `direct/search/referral/internal/unknown` | metadata、地点、路线、下载 fetch | 浏览器只发送本地粗分类，不发送原始 Referrer；服务端严格校验 |

普通直链下载不能添加自定义 header 时，服务端可以使用同一 visitor 当前派生会话最近主页事件的
粗粒度来源；不存在时只能写 `direct/internal/unknown`，不得保存原始 Referrer。

## 精确事件映射

| method/path | 事件类型 | 记录时机 | 允许的额外归因 |
|-------------|----------|----------|------------------|
| `GET /api/downloads/android/latest/metadata` | `page_view` | 合法主页 locale header 到达；metadata 成功或失败都记 | locale、source、device |
| `POST /api/routes/query_places` | `place_query` | 每次到达，包括非法 JSON、限流和上游失败 | 请求 language 成功绑定后只保留 locale |
| `POST /api/routes/query_routes` | `route_query` | 每次到达，包括 token 错误、限流和上游失败 | 请求 language 成功绑定后只保留 locale |
| `GET /api/downloads/android/latest` | `download_request` | 每次到达；成功和失败都记 | 路由推导 platform；成功使用本次实际版本和大小 |

`POST /api/routes/query_etas`、`GET /healthz`、隐私页、静态页面及未来未显式登记的 API 不产生
本功能事件。

## request-scoped 白名单观察

analytics tracking middleware 在请求进入时创建只允许以下字段的观察对象，既有 HTTP adapter
可在业务处理后回填：

- `locale`
- `failureCategory`
- `download.platform`
- `download.versionName`
- `download.versionCode`
- `download.sizeBytes`

不得向观察对象写入 query、地点、起终点、坐标、token、request/response body、第三方原始
响应、完整 UA/Referrer/Cookie 或 error message。统计 middleware 只读取最终 HTTP status、
受控观察值和计时结果。

## middleware 顺序与故障语义

公开 engine 的顺序必须保证通用脱敏日志先于 bot 判断、analytics 在自有 recovery 外层，因此
handler panic 被 recovery 转为受控 500 后，统计仍可按 `failure/internal` 记录：

```text
redacted request logger -> exact analytics tracking -> custom recovery -> business handler
```

已知机器人会经过第一层通用脱敏 request logger，但在 analytics tracking 内先被排除；排除后不得
验证/签发 Cookie、创建事件或追加任何机器人专用日志。

事件写入使用独立短 deadline。写入失败或超时只增加 `droppedSinceStart` 并写脱敏错误类别；
不得改动已经形成的状态码、响应头、JSON 或 APK bytes。

## OpenAPI 同步范围

实现阶段必须把本契约同步到：

- `shared/contracts/openapi/download-api.openapi.yaml`：metadata/download header、Cookie 与打点说明。
- `shared/contracts/openapi/route-query-api.openapi.yaml`：地点/路线的可选 source header、响应
  `Set-Cookie` 和匿名统计扩展；三个业务 request body 保持原样。
- `shared/contracts/download-api.openapi.yaml` 兼容镜像及对应 bundle。

项目可控的标题、说明、参数、响应、错误与示例必须使用中文并通过 Redocly lint/bundle。
