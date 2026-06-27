# Figma 设计引用：首页 UI 体验优化补充

## 状态

当前会话尝试调用 Figma MCP 时返回重新认证要求，无法直接写入目标文件。因此本阶段不伪造节点 ID，采用本地 Figma 插件作为 fallback 设计源。后续 Figma 认证恢复后，必须运行插件或通过 MCP 写入节点，并回填真实节点 ID。

## 目标文件

- 文件：BusIsComing Website - Homepage v1 Spec
- URL：https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec
- 计划页面：`Homepage UI Polish - 007`

## 计划节点

| 节点名称 | 说明 | Node ID |
|----------|------|---------|
| `Desktop 1440 / Hero Medium Screenshot Deck` | 桌面 hero 中等放大截图组，主图和后排图同等放大，无放大提示器 | 待回填 |
| `Desktop 1440 / Screenshot Lightbox` | 点击主截图后的大图模式，缩放、平移、关闭和同功能截图切换 | 待回填 |
| `Mobile 390 / Compact Feature Grid` | 手机 2 列紧凑功能卡，桌面功能区不变说明 | 待回填 |
| `Mobile 390 / Compact Route Result Card` | 手机路线结果卡，路线号/状态、站点提示、车费/耗时/步行标签值 | 待回填 |
| `Interaction States / Split Gesture Zones` | 截图区拖动切同功能截图，文字区拖动切功能，大图只切同功能截图 | 待回填 |
| `Spec Notes` | 三语、范围排除、OpenAPI N/A、验证要求和禁止形态说明 | 待回填 |

## 本地插件

插件目录：`specs/007-homepage-ui-polish/figma-plugin/`

导入步骤：

1. 打开目标 Figma 文件。
2. 进入 Figma 插件开发入口。
3. 选择 `Import plugin from manifest...`。
4. 选择 `specs/007-homepage-ui-polish/figma-plugin/manifest.json`。
5. 运行插件，等待页面和节点生成。
6. 复制插件输出的节点报告，回填到本文件或后续 tasks。

## fallback 原型

- 设计记录：`docs/superpowers/specs/2026-06-27-homepage-ui-polish-followup-design.md`
- HTML 原型：`docs/superpowers/prototypes/2026-06-27-homepage-ui-polish-followup.html`

在 Figma 节点未回填前，后续实现必须同时参考 fallback 原型和本文件的计划节点。

## 版本说明

- `2026-06-27`: 用户确认中等放大、无放大提示器、2 列功能卡、路线卡标签值布局和大图同功能切换。
- `2026-06-27`: Figma MCP 要求重新认证，本阶段生成本地插件 fallback，节点 ID 待回填。
- `2026-06-27`: 实现阶段已把关键 UI 状态映射到代码测试入口：`[data-testid="screenshot-rail"]` 表示截图手势区，`[data-testid="active-slide"]` 表示文字功能切换区，`[data-testid="screenshot-lightbox"]` 表示大图查看模式，`[data-testid="feature-grid"]` 表示手机 2 列功能区，`[data-testid="route-metrics"]` 表示路线卡指标带。
- `2026-06-27`: Figma MCP 仍未在本实现阶段提供可写入节点，继续使用本地插件和 HTML 原型作为 fallback；真实 Node ID 仍待认证恢复后回填，不伪造。
