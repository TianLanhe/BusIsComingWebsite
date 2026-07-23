# BusIsComing Pulse v1.3 Figma 导入包

本目录提供 `012-analytics-dashboard-observability` 的 5 张增量画板。完整页面结构继续以 Figma
中已导入的 v1.1/v1.2 节点 `63:2118`、`67:672`、`80:151` 为基线。

## 启动

```bash
python3 -m http.server 59338 \
  --bind 127.0.0.1 \
  --directory docs/superpowers/prototypes/2026-07-24-analytics-dashboard-v13-figma-import
```

## 导入

按照 `manifest.json` 的顺序，通过 import plugin 把以下 URL 导入既有
`Website Analytics / v1` 页面：

1. `http://127.0.0.1:59338/index.html?screen=date-tooltip`
2. `http://127.0.0.1:59338/index.html?screen=stability`
3. `http://127.0.0.1:59338/index.html?screen=business`
4. `http://127.0.0.1:59338/index.html?screen=details`
5. `http://127.0.0.1:59338/index.html?screen=mobile`

画板名称、尺寸和目标坐标以 `manifest.json` 为准。导入完成后，请提供任一 v1.3 批次或画板的
真实 Figma 节点链接；不得自行猜测节点 ID。

## 设计边界

- 数值仅用于验证布局，不是运行事实，也不得作为接口失败回退。
- 日期流程包含开始、结束、完成、取消和非法状态；实际日历外观由浏览器平台决定。
- 响应时间趋势只展示当前选择的 P50 或 P95，默认 P95。
- SLI 是 `成功 PV ÷ 总 PV`，无请求桶为空，不设置 SLA 目标线。
- 端点时延颜色使用“下降改善、上升恶化”语义，并同时使用箭头、数值和文字。
- 系统页面不得展示数据库绝对路径、密钥、客户端网络标识或内部错误原文。
- 实施必须覆盖 `zh-Hant`、`zh-Hans`、`en` 和 1440px/390px 双端。

## 验证

```bash
node --check docs/superpowers/prototypes/2026-07-24-analytics-dashboard-v13-figma-import/app.js
python3 -m json.tool docs/superpowers/prototypes/2026-07-24-analytics-dashboard-v13-figma-import/manifest.json
python3 -m json.tool docs/superpowers/prototypes/2026-07-24-analytics-dashboard-v13-figma-import/tokens.json
```

已于 2026-07-24 使用 Playwright 按 manifest 的 viewport 完成全页截图校验：

| 画板 | 校验截图 |
|------|----------|
| 18 · Date Range & Single Tooltip | [01-date-tooltip.png](screenshots/01-date-tooltip.png) |
| 19 · Stability & SLI | [02-stability.png](screenshots/02-stability.png) |
| 20 · Business & Event Metrics | [03-business.png](screenshots/03-business.png) |
| 21 · System & Visitor Details | [04-details.png](screenshots/04-details.png) |
| 22 · Mobile Observability | [05-mobile.png](screenshots/05-mobile.png) |
