# Figma 设计追溯：BusIsComing Pulse v1.3

**设计版本**：`BusIsComing Pulse v1.3 · Analytics Observability · 2026-07-24`

**状态**：交互与信息架构已由用户确认；v1.3 本地导入包和真实 Figma 锚点须在进入 plan 前完成

## 权威文件与既有锚点

- Figma 文件：[BusIsComing Website Homepage v1 Spec](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec)
- v1.1 完整页面锚点：[节点 63:2118](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=63-2118)
- v1.1 补充状态锚点：[节点 67:672](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=67-672)
- v1.2 差异画板锚点：[节点 80:151](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=80-151)
- 目标页面：`Website Analytics / v1`
- File key：`LAm6RjzFuFHsHFlcipx8pU`

Figma MCP Starter 额度在读取 `80:151` 子节点时耗尽，因此本 feature 不猜测或编造 v1.3 节点
ID。用户已确认继续采用 HTML 导出包 + import plugin 的方式。

## 已批准可视化

- [Dashboard v1.3 信息架构与关键工作区](visuals/dashboard-v13-remediation.svg)
- [自定日期两步流程](visuals/custom-date-flow.svg)
- [完整设计说明](../../docs/superpowers/specs/2026-07-24-analytics-dashboard-observability-design.md)

上述可视化确定信息层级和交互，不包含运行数据事实。所有数值仅用于布局示例，不得成为 API
失败时的回退值。

## v1.3 待导入画板

| 序号 | 逻辑画板名称 | Viewport | 覆盖内容 |
|------|--------------|----------|----------|
| 18 | `Pulse v1.3 / Date Range & Single Tooltip / 1440` | 1440×1000 | 开始/结束两步日期、完成范围、取消/非法状态、单一鼠标与键盘 Tooltip |
| 19 | `Pulse v1.3 / Stability & SLI / 1440` | 1440×1200 | P95 默认、P50/P95 单图选择、四类 SLI、端点同期比较和全部边界状态 |
| 20 | `Pulse v1.3 / Business & Event Metrics / 1440` | 1440×1000 | 事件四卡同期比较、主页/地点/路线六张 PV/UV 卡、新侧栏分组 |
| 21 | `Pulse v1.3 / System & Visitor Details / 1440` | 1440×1200 | SQLite 明细与运行信息、进程/监听器、Figma 对齐访客四卡和访客偏好 |
| 22 | `Pulse v1.3 / Mobile Observability / 390` | 390×1800 | 日期两步流程、纵向指标、图表选择器、比较状态、三组导航和 44px 操作 |

## 关键交互状态

### 日期

1. 预设范围。
2. 选择开始日期（第 1/2 步）。
3. 已选开始日期，等待结束日期（第 2/2 步）。
4. 合法范围已应用并在右上角与高级筛选同步。
5. 日期顺序错误、未来日期、取消。

### 图表

1. 鼠标 Tooltip，仅一个。
2. 键盘 Tooltip，仅一个。
3. P95 默认与 P50 选择。
4. SLI 有值、0%、无请求空桶。
5. 图表无数据。

### 同期比较

1. 增长或变慢。
2. 下降或变快。
3. 持平。
4. 上期为 0。
5. 暂无同期数据。
6. 当前无数据。
7. 比较关闭。

### 系统与访客

1. 系统全部可用。
2. 单项运行信息不可用的局部降级。
3. Visitor 有平台偏好。
4. Visitor 无平台数据。

## 三语与响应式

- 设计稿以简体中文表达信息架构；实施必须覆盖 `zh-Hant`、`zh-Hans`、`en`。
- `zh-Hant` 使用香港产品与监控界面常见书面语；`en` 使用自然克制的产品表达。
- 桌面实施验收使用 1440×1200。
- 手机交互验收使用 390×844，并使用长页面截图检查完整内容。
- 手机端不缩放桌面表格；卡片、表格和图表按语义重排。

## 导入门禁

进入 `/speckit-plan` 前必须：

1. 生成包含 18–22 画板的 v1.3 HTML 导入包、manifest、README 和截图。
2. 用户通过 import plugin 导入既有 `Website Analytics / v1` 页面。
3. 用户提供真实 v1.3 批次或画板节点链接。
4. 本文件回填真实节点并将状态改为“已导入”。

未完成上述步骤时，规格内容仍可评审，但不得进入计划阶段。
