# Online Query v2 Figma 插件

这个目录提供一个本地 Figma 开发插件，用于在 MCP 暂时无法写入 Figma 时，手动生成本功能需要的设计节点。

## 使用步骤

1. 打开目标 Figma 文件：
   `https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU`
2. 在 Figma 桌面端选择 `Plugins` -> `Development` -> `Import plugin from manifest...`
3. 选择本目录的 `manifest.json`：
   `specs/004-online-bus-query/figma-plugin/manifest.json`
4. 运行 `BusIsComming Online Query v2 Builder`
5. 插件会创建或更新 Figma 页面 `Online Query v2`
6. 插件弹窗会显示 `Desktop URL` 和 `Mobile URL`
7. 把这两个 URL 发给 Codex，用于写入 spec/plan 并继续 `/speckit-plan`

## 生成内容

- `Online Query v2 / Desktop 1440`
- `Online Query v2 / Mobile 390`
- `Online Query v2 / Spec Notes`

设计覆盖以下状态：

- 地点输入和候选下拉
- 起终点交换按钮
- 查询按钮和 loading
- 路线结果卡
- ETA 更新中、等候分钟、即将到站、候车暂不可用
- 0 路线空态
- 查询失败
- 语言切换失败时保留旧结果

## 重复运行

插件只会删除并重建同名的 3 个生成节点，不会修改文件中的其他页面或节点。
