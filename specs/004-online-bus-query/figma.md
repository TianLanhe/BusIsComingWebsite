# Figma 设计引用：在线巴士路线查询

## 文件

- Figma 文件：[BusIsComing Website - Homepage v1 Spec](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec)
- 新增页面：`Online Query v2`（node `22:2`）
- 生成方式：Figma MCP 暂不可写入时，使用本地开发插件 `specs/004-online-bus-query/figma-plugin/` 手动导入并运行。

## 关键节点

| 节点 | node id | URL | 用途 |
|------|---------|-----|------|
| `Online Query v2 / Desktop 1440` | `22:7` | https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=22-7 | 桌面端左侧说明 + 右侧查询工具布局 |
| `Online Query v2 / Mobile 390` | `22:104` | https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=22-104 | 手机端上下堆叠布局 |
| `Online Query v2 / Spec Notes` | `22:166` | 同页面内说明节点 | 状态覆盖、约束和节点说明 |

## 状态覆盖

- 地点输入和候选下拉
- 起终点交换按钮
- 查询按钮和 loading
- 路线结果卡
- ETA 查询中、等候分钟、即将到站、候车暂不可用
- 0 路线空态
- 查询失败
- 语言切换失败时保留旧结果

## 设计约束

- 桌面 1440px：左侧说明网页试用范围，右侧为真实查询工具。
- 手机 390px：说明在上，工具在下，所有输入、下拉、按钮和结果卡完整可见。
- 结果卡不显示铃铛，不提供监控入口。
- 不提供排序、详情展开、多班 ETA 或独立刷新。
- 动态地点和站名只展示当前语言一种。

## 本地插件复现

插件目录：`specs/004-online-bus-query/figma-plugin/`

运行方式：

1. 打开目标 Figma 文件。
2. Figma 桌面端选择 `Plugins` -> `Development` -> `Import plugin from manifest...`。
3. 选择 `specs/004-online-bus-query/figma-plugin/manifest.json`。
4. 运行 `BusIsComming Online Query v2 Builder`。
5. 插件会重建同名 3 个节点，并在弹窗输出桌面和移动节点 URL。

## 后续实现验证

实现阶段必须保存下列截图到 `specs/004-online-bus-query/visual-review/`：

- `desktop-1440-online-query-v2.png`
- `desktop-1440-place-dropdown.png`
- `desktop-1440-route-results.png`
- `desktop-1440-error-retained.png`
- `mobile-390-online-query-v2.png`
- `mobile-390-place-dropdown.png`
- `mobile-390-route-results.png`
- `mobile-390-error-empty.png`
