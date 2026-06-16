# 在线路线查询 API

权威契约文件：`shared/contracts/openapi/route-query-api.openapi.yaml`

Bundle 产物：`shared/contracts/openapi/route-query-api.bundle.yaml`

## 接口

- `POST /api/routes/query_places`：地点检索，业务参数通过 JSON body 提交，返回地点候选和 `placeToken`。
- `POST /api/routes/query_routes`：路线摘要查询，只接收起点和终点 `placeToken`，最多返回 20 条按耗时排序的香港巴士路线。
- `POST /api/routes/query_etas`：批量 ETA 查询，一次接收路线结果中的全部 `etaToken`，单条失败不影响其它路线。

## 响应格式

在线查询接口统一返回 JSON envelope：

```json
{
  "requestId": "route-query-example",
  "data": {},
  "error": null
}
```

业务错误通过 `error.code` 表达，前端按错误码展示三语文案，不直接展示后端英文 message。

## 本地预览

静态说明页：`docs/api/route-query.html`

OpenAPI lint：

```bash
cd frontend
npm run openapi:routes:lint
```

OpenAPI bundle：

```bash
cd frontend
npm run openapi:routes:bundle
```
