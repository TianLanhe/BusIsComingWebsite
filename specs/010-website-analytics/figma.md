# Figma 设计追溯：BusIsComing Pulse v1

**设计版本**：`Pulse v1 · 2026-07-20`

**确认日期**：2026-07-21

**状态**：用户已通过 HTML 导入插件导入现有权威文件

## 权威文件与导入锚点

- Figma 文件：[BusIsComing Website Homepage v1 Spec](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec)
- 用户确认的导入锚点：[节点 63:2118](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=63-2118&t=qpAv4G6q8c045NWj-0)
- 目标页面名称：`Website Analytics / v1`
- File key：`LAm6RjzFuFHsHFlcipx8pU`
- 导入方式：本地高保真 HTML → `html.to.design` 类插件 → 现有 Figma 文件

Figma MCP 在导入完成后仍受 Starter 套餐调用额度限制，无法读取 `63:2118` 下的子节点。用户已明确完成导入，本 feature 以用户确认、根节点链接、导入 manifest 和导入前逐屏截图验证作为设计验收证据。本文不推测或虚构任何子节点 ID。

## 关键画板映射

导入源：[README](../../docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/README.md) · [manifest](../../docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/manifest.json) · [tokens](../../docs/superpowers/prototypes/2026-07-20-analytics-dashboard-figma-import/tokens.json)

| 序号 | 逻辑画板名称 | 视口 | 主要内容 |
|------|--------------|------|----------|
| 01 | `Pulse / Desktop Overview` | 1440×1200 | 指标卡、PV/UV 折线、试查漏斗、下载漏斗、事件构成、P95、版本摘要 |
| 02 | `Pulse / Traffic & Trial` | 1440×1200 | 流量趋势、双漏斗、小时热力图、语言/设备/来源分布 |
| 03 | `Pulse / Downloads` | 1440×1200 | 下载趋势、UV、成功率、平台预留、版本表、失败分布 |
| 04 | `Pulse / Event Details` | 1440×1200 | 筛选器、隐私边界提示、分页事件表、截断 Visitor ID |
| 05 | `Pulse / Anonymous Visitor` | 1440×1200 | 完整 ID 搜索/复制、摘要、分类、30 分钟会话时间线 |
| 06 | `Pulse / Failures & Performance` | 1440×1200 | 成功率、失败类型、P50/P95 趋势、端点性能表 |
| 07 | `Pulse / System` | 1440×1200 | 数据库、最后写入、dropped count、私有监听器、隔离与降级路径 |
| 08 | `Pulse / Mobile Overview` | 390×1640 | 移动指标、紧凑趋势、漏斗、健康状态、下载摘要、底部导航 |
| 09 | `Pulse / Loading Empty Error States` | 1440×1000 | Loading、无数据、无筛选结果、数据库不可用 |
| 10 | `Homepage / APK Metadata States` | 1200×760 | 元数据成功、元数据不可用、下载入口始终可用 |

## 交互与状态说明

- **全局时间范围**：默认近 30 天，允许小时、日、周、月、自定义范围，并可比较上一等长周期。
- **全局筛选**：语言、设备、来源、结果、平台、版本；筛选条件在当前工作区内保持。
- **刷新**：总览每 60 秒自动刷新并显示最近更新时间；详细调查页面只在用户主动刷新时更新。
- **图表**：折线、分布和漏斗支持悬停查看当前时间点或阶段明细；无数据时不渲染误导性零值走势。
- **事件明细**：分页浏览，不提供导出、删除、编辑或全量历史下载；Visitor ID 默认截断。
- **访客详情**：允许完整 ID 精确搜索与复制，展示首次/最后出现、事件/会话计数和有序时间线。
- **移动端**：把高密度侧栏和多列表格收敛为关键指标、纵向卡片与底部导航；详细表格进入独立工作区。
- **数据库不可用**：监控页显示明确错误与业务不受影响说明；不可把监控失败渲染成公开业务失败。
- **APK 元数据不可用**：显示版本与大小暂时不可用，无手动重试或硬编码回退，下载按钮保持可用。

## 三语与示例数据边界

- 所有新增文案需独立提供 `zh-Hant`、`zh-Hans`、`en`；设计稿以简体中文呈现信息架构，不代表只实现简体中文。
- `zh-Hant` 需使用香港产品与交通语境；英文需自然克制，不能逐句机械翻译。
- Figma/HTML 中的 PV、UV、版本、大小、时间和错误数量均为布局示例，不是产品事实。
- 当前仓库样例包事实为 `versionName=1.0`、`versionCode=1`、约 `5.3 MB`；运行时必须始终展示接口返回的当前值，不能把任一设计示例硬编码为回退值。

## 验证记录

- 导入源 HTML、JavaScript、manifest 和 token JSON 已通过语法检查。
- 10 张画板均以 manifest 指定尺寸完成无头浏览器渲染。
- 桌面总览、流量与试查、下载、事件明细、匿名访客、失败与性能、系统状态、移动总览、全局状态和 APK 状态均完成逐屏视觉检查。
- 用户于 2026-07-21 确认已导入 Figma，并提供节点 `63:2118`。
- 由于 Figma Starter MCP 额度限制，导入后的 Figma 子节点结构尚未机器复核；后续若额度恢复，可在 plan 或 implement 阶段补充只读截图与子节点链接，不改变本规格行为定义。
