# US2 验收：路线试查

日期：2026-08-24

- 保留既有地点、路线、ETA、query version、token 和错误恢复逻辑，未修改路线 OpenAPI 或后端。
- 地点输入使用 combobox/listbox/option 语义并支持 Arrow、Enter、Escape；长站名以稳定等宽列截断并保留完整 title。
- 路线卡显示路线链、站点、候车、车费、文字“耗时 N 分钟”“步行 N 米”，不显示图标、直达或转乘标签。
- `online-query-demo.test.tsx` 覆盖成功、输入错误、旧响应拒绝、缺失站名和 ETA；Playwright 在 1440、390、320 使用固定 API fixtures 验证完整交互与无横向滚动。
- 浏览器视觉基线包含三种 viewport 的 `route-idle` 状态。
