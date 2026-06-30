# Figma 设计引用：首页 UI 体验优化补充

## 状态

已于 `2026-06-30` 按用户从 Figma 插件取得的节点报告回填真实 Node ID。本文件是 007 首页 UI 体验优化补充的 Figma 引用入口；后续 plan、tasks、implement 和回归评审应优先引用这里的文件、页面和节点。

计划阶段因 Figma MCP 重新认证要求，曾使用本地 Figma 插件作为 fallback 设计源。当前节点 ID 已回填，插件保留为后续重新生成或修复节点时的可复现工具。

## 目标文件

- 文件：BusIsComing Website - Homepage v1 Spec
- URL：https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec
- 页面：`Homepage UI Polish - 007`

## 关键节点

| 节点名称 | Node ID | 覆盖范围 | 后续引用说明 |
|----------|---------|----------|--------------|
| `Desktop 1440 / Hero Medium Screenshot Deck` | `51:86` | 桌面 hero 中等放大截图组，主图和后排图同等放大，无放大提示器 | 桌面首屏截图尺寸、堆叠层级和文字区留白的视觉基准 |
| `Desktop 1440 / Screenshot Lightbox` | `51:113` | 点击主截图后的大图模式，保留截图圆角和页面风格，支持缩放、平移、关闭和同功能截图切换 | 电脑端和手机端统一大图方案的交互与视觉基准 |
| `Mobile 390 / Compact Feature Grid` | `51:125` | 手机 2 列紧凑功能卡，桌面功能区保持现状 | 手机功能介绍高度、行距、扩展到 10 个功能时的布局参考 |
| `Mobile 390 / Compact Route Result Card` | `51:151` | 手机路线结果卡，路线号/状态、站点截断、车费/耗时/步行标签值 | 在线试查移动端结果卡层级和压缩策略参考 |
| `Interaction States / Split Gesture Zones` | `51:183` | 截图区拖动切同功能截图，文字区拖动切功能，大图只切同功能截图 | 页面内手势分区、大图手势范围和误触防护的状态参考 |
| `Spec Notes` | `51:194` | 三语、范围排除、OpenAPI N/A、验证要求和禁止形态说明 | 后续设计评审和实现验收的规则说明节点 |

## 交互状态

- 页面内截图区：滑动或拖动只切换同一功能内的截图，不跨功能。
- 页面内文字介绍区：滑动或拖动切换整个功能场景。
- 大图模式：电脑和手机统一采用图片放大方案，不进入复杂按钮式 dialog；支持缩放、缩小、放大后拖动查看细节、关闭，以及同功能截图切换。
- 生产页面不得显示独立放大提示器、悬浮放大图标或“点击放大”教学文案。
- 手机功能区使用 2 列紧凑卡片；桌面端功能介绍保持现状。
- 手机路线结果卡需要在路线号、候车状态、站点信息和三项指标之间建立清晰视觉层级，长站点名超过当行长度时截断。

## 本地插件 fallback

插件目录：`specs/007-homepage-ui-polish/figma-plugin/`

仅在 Figma 页面或节点缺失、需要重建 007 设计稿时使用：

1. 打开目标 Figma 文件。
2. 进入 Figma 插件开发入口。
3. 选择 `Import plugin from manifest...`。
4. 选择 `specs/007-homepage-ui-polish/figma-plugin/manifest.json`。
5. 运行插件，等待页面和节点生成。
6. 复制插件输出的节点报告，并同步更新本文件、相关契约和内容元数据。

## fallback 原型

- 设计记录：`docs/superpowers/specs/2026-06-27-homepage-ui-polish-followup-design.md`
- HTML 原型：`docs/superpowers/prototypes/2026-06-27-homepage-ui-polish-followup.html`

Figma 节点是当前设计源；HTML 原型保留为早期讨论与视觉推导记录，便于回看方案来源。

## 版本说明

- `2026-06-27`: 用户确认中等放大、无放大提示器、2 列功能卡、路线卡标签值布局和大图同功能切换。
- `2026-06-27`: Figma MCP 要求重新认证，本阶段生成本地插件 fallback，当时未伪造节点 ID。
- `2026-06-27`: 实现阶段已把关键 UI 状态映射到代码测试入口：`[data-testid="screenshot-rail"]` 表示截图手势区，`[data-testid="active-slide"]` 表示文字功能切换区，`[data-testid="screenshot-lightbox"]` 表示大图查看模式，`[data-testid="feature-grid"]` 表示手机 2 列功能区，`[data-testid="route-metrics"]` 表示路线卡指标带。
- `2026-06-27`: Figma MCP 仍未在本实现阶段提供可写入节点，继续使用本地插件和 HTML 原型作为 fallback；当时真实 Node ID 未伪造。
- `2026-06-30`: 用户提供 Figma 文件、页面和 6 个关键节点 ID，已回填到本文件、规格、计划、契约、quickstart 和前端内容元数据。
