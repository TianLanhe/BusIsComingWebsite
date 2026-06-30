# Citybus route-query fixtures

这些 fixture 用于 009 在线路线查询性能优化的三语解析回归测试。

- 内容保留 Citybus mobile `ppsearch_p3.php` 路线摘要的关键原文语义，只做最小化裁剪。
- 不把 fixture 改写成项目自定义格式；如果真实 Citybus 响应格式变化，应先更新 fixture，再调整解析规则。
- live 复现步骤记录在 `specs/009-route-query-performance/quickstart.md`，live 响应只用于人工对比，不提交大段第三方 HTML。
- `zh-hant.html` 覆盖 `港元`、`至`、`預計`、`分鐘`、`步行距離`、`米`。
- `zh-hans.html` 覆盖 `港元`、`至`、`预计`、`分钟`、`步行距离`、`米`。
- `en.html` 覆盖 `Hong Kong Dollar`、`To`、`Estimated`、`Min`、`Walking distance`、`m`。
