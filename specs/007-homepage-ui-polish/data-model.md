# 数据模型：首页 UI 体验优化补充

## 功能展示截图组

**含义**：首页 hero 中归属于某个功能场景的一组真实脱敏 App 截图。

**关键字段**：

- `featureId`：功能场景 ID，必须对应 `featureShowcase` 中的一个功能。
- `defaultImageId`：首次展示的主截图 ID。
- `activeImageId`：当前主截图 ID；每个功能场景独立保存。
- `images`：同功能截图列表，包含 `id`、`order`、`src`、`alt`、脱敏状态。
- `visualMode`：当前为 `stair-card-deck`。
- `lightboxEnabled`：是否允许点击主截图打开大图。

**验证规则**：

- 单图场景不得显示后排堆叠图或大图内“下一张”控件。
- 多图场景中，后排堆叠图最多展示两张。
- 大图模式和页面内截图区只能在同一 `featureId` 内切换截图。

**状态转换**：

- `idle` → `image-dragging`：用户在截图区按下并拖动。
- `image-dragging` → `idle`：达到阈值时更新当前功能 `activeImageId`。
- `idle` → `lightbox-open`：点击主截图。
- `lightbox-open` → `lightbox-zoomed`：用户放大截图。
- `lightbox-open/lightbox-zoomed` → `idle`：关闭大图。

## 手势区域

**含义**：hero 内可响应拖动/滑动的互斥交互目标。

**关键字段**：

- `zone`：`screenshot` 或 `copy`。
- `pointerStartX` / `pointerStartY`：起始坐标。
- `dragThresholdPx`：触发切换的最小位移。
- `targetAction`：`switch-image` 或 `switch-feature`。
- `shouldStopPropagation`：是否阻止冒泡到父级功能切换。

**验证规则**：

- `screenshot` 区域只触发 `switch-image`。
- `copy` 区域只触发 `switch-feature`。
- 大图模式打开时，页面内手势区域暂停响应。

## 大图查看会话

**含义**：用户点击主截图后进入的截图细节查看状态。

**关键字段**：

- `isOpen`：是否打开。
- `featureId`：当前功能场景。
- `imageId`：当前查看截图。
- `zoom`：缩放比例，默认 `1`。
- `panX` / `panY`：平移距离。
- `canMovePrevious` / `canMoveNext`：同功能截图是否可切换。
- `closeReason`：`esc`、`button`、`backdrop` 或 `programmatic`。

**验证规则**：

- `zoom` 不得小于初始比例。
- 放大后平移应优先移动当前图片，不应误触发跨功能切换。
- `Esc`、关闭按钮和遮罩关闭都必须可用。
- 焦点必须限制在大图对话框内，关闭后回到触发截图。

## 手机功能卡

**含义**：手机端功能介绍区的紧凑卡片。

**关键字段**：

- `id`：功能 ID。
- `icon`：图标类型。
- `title`：三语标题。
- `description`：三语短说明。
- `order`：展示顺序。
- `compactLayout`：手机端为 `two-column`。

**验证规则**：

- 手机 390px 下使用 2 列；桌面端布局保持现状。
- 每张卡保留图标、标题和一句短说明。
- 未来增加到 10 个主要功能时继续 2 列扩展，不依赖横向滑动发现主要功能。

## 路线结果卡片

**含义**：在线试查返回的候选路线展示单元。

**关键字段**：

- `routeNumbers`：路线号列表。
- `etaStatus`：候车状态。
- `boardingStopName`：上车站名称，可为空。
- `alightingStopName`：下车站名称，可为空。
- `missingStopLabel`：站点资料缺失提示。
- `fare`：车费。
- `duration`：耗时。
- `walkingDistance`：步行距离。
- `metricLabels`：车费、耗时、步行三语标签。

**验证规则**：

- 手机端第一行显示路线号和候车状态。
- 站点缺失时显示简洁提示，不显示空的“上车站 / 下车站”路径。
- 车费、耗时、步行同一指标带展示，并同时显示标签和值。
- 标签和值必须样式不同：标签弱化，值突出。

## 费用功能文案项

**含义**：解释费用比较能力的三语文案。

**关键字段**：

- `title.zh-Hant`：`車費一眼看清`
- `title.zh-Hans`：`车费一眼看清`
- `title.en`：`Fare at a glance`
- `description`：三语说明，表达同页比较车费、行程时间和步行距离。
- `reviewStatus`：`draft`、`reviewed` 或 `needs-revision`。

**验证规则**：

- 不得出现内部修改要求原句。
- 不得保留“多程总车费一眼看清”作为用户可见标题。
- `zh-Hant` 和 `en` 必须独立审校，不得机械直译。

## Figma 设计引用

**含义**：后续 plan/tasks/implement 引用的设计源。

**关键字段**：

- `fileUrl`：目标 Figma 文件 URL。
- `pageName`：`Homepage UI Polish - 007`。
- `nodeNames`：关键节点名称列表。
- `nodeIds`：已回填的真实节点 ID，必须与 `nodeNames` 一一对应。
- `fallbackPrototype`：HTML 原型路径。
- `pluginPath`：本地 Figma 插件路径。

**验证规则**：

- `nodeIds` 必须来自真实 Figma 节点报告，不得伪造或留空。
- `nodeIdsResolved` 必须为 `true`；如果后续 Figma 节点被复制、删除或重建，必须同步更新 `figma.md`、内容元数据和契约。
- 实现阶段必须能从 `figma.md` 找到目标文件、节点 ID、交互状态和 fallback 原型。
