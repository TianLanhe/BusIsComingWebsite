# BusIsComing Pulse · Figma HTML 导入包

本目录提供高保真 HTML 画板，供 `html.to.design` 一类 Figma 插件导入到现有权威文件：

- 文件：`BusIsComing Website - Homepage v1 Spec`
- File key：`LAm6RjzFuFHsHFlcipx8pU`
- 建议新页面：`Website Analytics / v1`
- 设计版本：`Pulse v1.1 · 2026-07-22`

## 启动

在仓库根目录执行：

```bash
python3 -m http.server 59337 --bind 127.0.0.1 \
  --directory docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import
```

然后按 `manifest.json` 中的顺序逐个打开 URL，并使用 Figma 导入插件捕获整个页面。原有
01–10 已完成导入时无需重复导入；本次 v1.1 只需导入 11–13。

## 导入约定

1. 每个 URL 只对应一个顶层画板，桌面宽度为 `1440px`，移动端宽度为 `390px`。
2. 导入后将顶层 Frame 重命名为 manifest 中的 `frameName`。
3. 所有画板导入到同一个 `Website Analytics / v1` 页面。
4. 推荐按 manifest 的 `x` / `y` 排列，便于后续 specification 引用。
5. HTML 导入能保留可编辑文本、形状和 SVG，但不会自动创建 Figma Variables、Components、Auto Layout 或原型连接；这些属于 MCP 额度限制下由用户明确接受的降级项。
6. 导入完成后，请提供 Figma 页面链接和关键节点链接，至少包含：桌面总览、移动端总览、访客详情、状态集合、APK 元数据状态，以及本次新增的移动详细调查、移动 APK 状态和普通查询失败状态。

## 画板内容

- 桌面总览：指标卡、PV/UV 折线、双漏斗、事件构成、P95、版本分析。
- 流量与试查：趋势、小时热力图、来源/设备/语言、试查漏斗。
- 下载分析：下载趋势、版本、平台预留、成功率、失败分布。
- 事件明细：筛选器、分页表格、脱敏字段和隐私边界。
- 匿名访客：截断标识、会话摘要、30 分钟会话时间线。
- 失败与性能：P50/P95、错误类型、端点性能表。
- 系统状态：SQLite、最后成功写入、进程内丢弃计数、私有监听器。
- 移动端总览：纵向卡片、紧凑折线、关键健康状态。
- 状态集合：加载、空数据、无筛选结果、数据库不可用。
- APK 元数据：成功与不可用两种主页展示，下载始终可用。
- 移动详细调查：紧凑筛选、key-value 事件卡、完整 Visitor ID 精确搜索/复制反馈、纵向会话时间线和分页。
- 移动 APK 状态：390px 下的 metadata 成功/不可用、本地化版本和大小、始终可用的稳定下载入口。
- 普通查询失败：保留筛选、手动重试，并与数据库不可用状态清晰区分。

## v1.1 补充导入

只导入以下 URL，导入目标仍是现有 Figma 文件的 `Website Analytics / v1` 页面：

1. `http://127.0.0.1:59337/index.html?screen=mobile-investigation`
2. `http://127.0.0.1:59337/index.html?screen=mobile-apk`
3. `http://127.0.0.1:59337/index.html?screen=query-failure`

分别按 manifest 重命名为 11、12、13 号 Frame。导入前截图保存在 `screenshots/`，仅作为
viewport 与布局证据；运行时示例数值不是产品事实。
