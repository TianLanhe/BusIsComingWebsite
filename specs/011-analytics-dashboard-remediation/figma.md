# Figma 设计追溯：BusIsComing Pulse v1.2

**设计版本**：`Pulse v1.2 · Dashboard Remediation · 2026-07-23`

**状态**：v1.1 完整页面与 v1.2 差异画板均已由用户确认导入权威文件

## 权威文件与既有锚点

- Figma 文件：[BusIsComing Website Homepage v1 Spec](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec)
- v1.1 完整页面锚点：[节点 63:2118](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=63-2118)
- v1.1 补充状态锚点：[节点 67:672](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=67-672)
- v1.2 差异画板导入批次锚点：[节点 80:151](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=80-151&t=pXavKmVnFOvABrsi-0)
- 目标页面：`Website Analytics / v1`
- File key：`LAm6RjzFuFHsHFlcipx8pU`

上述两个节点已经由用户确认导入，是七个完整工作区、移动总览、全局状态和 APK 状态的信息架构权威。本次不复制七张完整桌面页面，只追加能够表达修复差异的 v1.2 画板。

## v1.2 差异画板

导入源：`docs/superpowers/prototypes/2026-07-23-analytics-dashboard-remediation-figma-import/`

| 序号 | 逻辑画板名称 | 视口 | 修复证据 | Figma 节点 |
|------|--------------|------|----------|------------|
| 14 | `Pulse v1.2 / Typography & Metric States / 1440` | 1440×1000 | C 级桌面字号、40px 指标、三种比较状态、无装饰圆圈/光斑 | 导入批次锚点 `80:151` |
| 15 | `Pulse v1.2 / Grafana Charts & Daily Heatmap / 1440` | 1440×1100 | 顶部图例、X/Y 轴、网格、数据点、十字线、共享 Tooltip、逐日七行热力图和局部滚动 | 导入批次锚点 `80:151` |
| 16 | `Pulse v1.2 / Detailed Workspaces / 1440` | 1440×1200 | 事件、访客、性能、系统四页恢复后的关键桌面片段与新字号 | 导入批次锚点 `80:151` |
| 17 | `Pulse v1.2 / Mobile Remediation / 390` | 390×1640 | 36px 指标、趋势状态、移动图表 Tooltip、事件卡、系统状态和 44px 操作 | 导入批次锚点 `80:151` |

用户于 2026-07-23 提供真实导入批次锚点 `80:151`。Figma MCP 额度限制下尚未机器读取该锚点内四张子画板的独立 ID，因此本表只引用真实批次锚点，不猜测或编造子节点 ID。

## 关键交互与状态

- 近 7/30/90 天都以香港自然日开始并截止刷新时刻；自定义范围首尾日期包含，非法范围在控件旁提示。
- 手动刷新和总览 60 秒自动刷新重新锚定当前时刻；固定历史范围不漂移。
- 指标卡区分正负变化、持平、无同期数据和关闭比较，不只以颜色表达状态。
- 折线图通过鼠标悬停或键盘聚焦显示共享 Tooltip，一次呈现当前香港时间桶和全部序列值。
- 热力图周一至周日纵向排列、周次横向排列；日期多时只有绘图区横向滚动，Tooltip 显示事件数与 UV。
- 桌面事件表在手机转为 key-value 卡；完整 Visitor ID 精确搜索、复制反馈、分页和返回操作仍可达。
- 系统页动态状态与“配置事实”使用不同标签；不得把无写入队列、无备份等固定事实伪装成实时健康探测。

## 三语、响应式与示例数据边界

- 设计稿以简体中文表达信息架构；实现必须覆盖 `zh-Hant`、`zh-Hans`、`en`，繁中使用香港产品语境，英文自然克制。
- 桌面验证 1440×1200；手机验证 390×844 交互视口和长页面。手机页面不缩放桌面表格，只有热力图绘图区允许横向滚动。
- HTML/Figma 中所有指标、耗时、日期、版本和事件均为布局示例，不是产品事实，不得作为 API 失败回退。
- 可见字号采用规格的 40/36px 指标与 13/12px 最低辅助字号，不继承 v1.1 画板中过小的历史字号。

## 导入与验证流程

1. 14–17 四张画板已按 manifest 顺序通过 import plugin 导入既有 `Website Analytics / v1` 页面。
2. 用户提供的真实导入批次锚点 `80:151` 已回填；Figma MCP 额度恢复前不要求机器读取子节点。
3. 实施时同时对照 v1.1 完整页面锚点和 v1.2 差异画板；v1.2 只覆盖本次明确修复的视觉与交互差异。
4. 以导入包截图、1440px/390px Playwright 实施截图和真实节点完成视觉验收。

## 导出包验证记录

- `app.js` 已通过 JavaScript 语法检查，`manifest.json` 与 `tokens.json` 已通过 JSON 解析。
- 14–17 四张画板已完成无头浏览器渲染与逐张视觉检查，截图尺寸依次为 1440×1000、1440×1100、1440×1200、390×1640。
- 截图位于导入包 `screenshots/`，当前未发现画板裁切或页面级横向溢出。
- 这些截图证明导入源与视口；用户已另行提供 v1.2 真实导入批次锚点 `80:151`。

## 版本说明

- v1.1（2026-07-22）：完整 Dashboard、移动调查、APK 状态和普通查询失败，真实锚点为 `63:2118` 与 `67:672`。
- v1.2（2026-07-23）：修复时间、字号、指标语义、Grafana 折线、逐日热力图和四个详细工作区的还原偏差；只追加差异画板，不重写 v1.1 历史；真实导入批次锚点为 `80:151`。

## 最终实施对照

### 与 v1.1/v1.2 一致的部分

- 沿用 v1.1 的七工作区、侧栏、全局筛选和“总览 → 事件 → Visitor → 性能 → 系统”的调查信息架构。
- 指标值落实为桌面 40px、手机 36px，并删除无含义圆圈；持平、无同期数据和关闭比较均有独立文字状态。
- 折线图落实顶部图例、X/Y 轴、网格、实际数据点、十字线、鼠标/键盘共享 Tooltip 和视觉隐藏数据表。
- 热力图按香港日历日一日一格，以星期为行、周次为列；只有绘图区可横向滚动。
- 事件桌面表在手机转换为 key-value 卡；Visitor、性能和系统恢复 v1.1 全部关键区块并采用 v1.2 字号。
- loading、无数据、筛选无结果、普通失败、存储不可用和 system 局部失败均保留独立状态表达。

### 有意差异

- Figma 曲线和数值只用于说明布局；实施使用 Recharts 和 API 数据，不把示例值作为失败回退。
- v1.2 手机导入画板为 390×1640 的长画板，实施验收使用 390×844 真实交互视口并通过滚动查看完整页面。
- 实际热力图格数由 7/30/90 日或自定义范围决定，Figma 中的格子只作结构示例。
- 系统页把长期保留、无备份、无写入队列和只存明细明确标为“配置事实”，避免把静态决策误画成动态健康探测。
- 性能页的 system 请求失败只令 dropped count 显示局部不可用，其他性能指标与图表继续显示；这是可运行降级状态而非静态原型假数据。

### 最终截图证据

- 图表三语双端：`frontend/playwright-monitor/__screenshots__/charts-en-desktop.png`、`charts-zh-Hans-desktop.png`、`charts-zh-Hant-mobile.png`。
- 调查工作区：`investigation-zh-Hans-desktop.png`、`investigation-zh-Hant-mobile.png`、`performance-system-partial-error.png`。
- 时间范围：`time-range-desktop.png`、`time-range-mobile.png`。
- 五种状态：`state-loading-*`、`state-no_data-*`、`state-no_results-*`、`state-query_failed-*`、`state-storage_unavailable-*`。

以上对照只引用用户确认的真实节点 `63:2118`、`67:672` 和批次锚点 `80:151`，没有为尚未机器读取的子画板编造节点 ID。
