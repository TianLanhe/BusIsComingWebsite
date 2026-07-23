# 网站匿名访问统计规格修订设计

**日期**：2026-07-22

**范围**：修复 `specs/010-website-analytics/` 在最新一致性分析中发现的 C1、C2、C3、I1、A1，
不改变已经确认的匿名统计口径、隐私边界、存储选型或监控页面整体 Pulse 视觉方向。

## 目标

本次修订需要在进入实现前满足以下结果：

1. 所有要求实现的移动页面和视觉状态都有可导入 Figma 的设计证据。
2. 三语能力在所属 UI 用户故事中首次实现，最终故事只负责跨页面回归。
3. 所有被新增或修改的 HTTP API 都有 feature-scoped OpenAPI 3.1 YAML 权威源。
4. public/private engine 的基础构造、真实 analytics middleware 实现和最终注入顺序不存在循环或重复任务。
5. 统计同步写入的 fail-open deadline 具备明确默认值、合法范围和可验证的额外等待上限。

## 采用方案

采用增量修订，不重新生成已有 10 张画板，不重建整个任务清单，也不改变用户故事业务范围。
现有 Figma 导入页面继续使用 `Website Analytics / v1`，设计版本升级为
`BusIsComing Pulse v1.1 · 2026-07-22`，只追加 3 张补充画板。

未采用以下方案：

- 重新导入完整 13 张画板：会产生重复节点和不必要的视觉复核工作。
- 把缺失设计留到实现阶段：违反 Figma 必须先于实现的项目宪章门禁。
- 新建独立 Figma 页面：会让同一 feature 的视觉权威分散到两个页面。

## C1：补齐 Figma 设计证据

### 追加画板

在现有 HTML 导入包中追加以下画板，旧 10 张画板保持原名称和位置：

| 序号 | Screen | Frame 名称 | Viewport | 覆盖内容 |
|------|--------|------------|----------|----------|
| 11 | `mobile-investigation` | `11 Pulse / Mobile Investigation / 390` | 390×1640 | 紧凑筛选、事件 key-value 卡片、匿名访客精确搜索、复制反馈、纵向会话时间线、可达分页 |
| 12 | `mobile-apk` | `12 Homepage / Mobile APK Metadata States / 390` | 390×1200 | metadata 成功与不可用状态、本地化版本/大小、稳定下载按钮、不可用说明 |
| 13 | `query-failure` | `13 Pulse / Query Failure State / 1440` | 1440×1000 | 普通可重试查询失败、保留筛选条件、手动重试、与数据库不可用状态的语义区别 |

### 视觉与交互约束

- 三张画板复用现有 Pulse tokens、字体、卡片、阴影、状态色和间距，不引入第二套视觉语言。
- 移动详细调查使用纵向信息层级，不缩放桌面表格；事件字段转换为 key-value 卡片。
- 完整 visitor ID 只出现在维护者主动输入后的精确结果区域，事件列表继续使用截断值。
- 普通查询失败允许手动重试并保留当前筛选；数据库不可用继续显示公开业务不受影响的说明。
- 移动 APK 的 metadata 失败只降级版本和大小，下载按钮始终可操作且不增加“重新加载版本”入口。

### 文档同步

`manifest.json`、导入包 README、`figma.md`、spec、plan、quickstart 和 tasks 必须统一记录 13 张
画板、3 个新增 viewport/state 证据及 `Pulse v1.1` 版本。

## C2：三语实现前移

### 用户故事责任

- US2：完成监控 i18n provider、浏览器语言选择、繁中 fallback、持久化语言切换、总览和共享
  shell/filter/state 文案。
- US3：完成六个详细工作区的 `zh-Hant`、`zh-Hans`、`en` 文案和格式化类型。
- US4：完成主页 metadata 成功/不可用状态的三语文案。
- US5：只运行 key 完整性、隐私事实一致性、香港繁中和自然英文语气、语言切换状态保持及跨页面
  视觉回归；不得首次创建 provider、语言切换器或大批量补齐文案。

### 发布门禁

US1 + US2 构成首个可发布 Dashboard MVP 时，必须已经具备三语切换、默认语言、持久化选择和
总览完整文案。US3、US4 的各自检查点也必须完成所属页面三语实现。

## C3：统一 OpenAPI 权威源

feature contracts 新增：

`specs/010-website-analytics/contracts/route-query-api.openapi.yaml`

三份 feature YAML 是本 feature 设计阶段的权威源：

1. `download-api.openapi.yaml`
2. `route-query-api.openapi.yaml`
3. `analytics-monitoring-api.openapi.yaml`

实现开始时按单向关系同步到 `shared/contracts/openapi/`。兼容镜像
`shared/contracts/download-api.openapi.yaml` 继续由公开下载契约生成或复制，不成为第二权威源。

feature route OpenAPI 必须以现有 shared route 契约为基线，保持三个业务 request/response body
兼容，只增加已确认的有限来源/语言 header、匿名 Cookie 响应说明、统计副作用和 fail-open 说明。
Redocly lint、bundle 和中文 API UI 验证同时覆盖三份 feature 与三份 shared 契约。

## I1：拆分 engine 构造与真实 tracking 注入

### 基础阶段

T022 负责建立可测试的 public/private engine factory、配置校验、listener 默认值和 middleware
注入点。public factory 接收一个 `gin.HandlerFunc` 类型的 analytics 参数；基础测试使用无副作用
stub 验证最终顺序：

```text
public:  logger → injected analytics → recovery → handler
private: logger → recovery → handler
```

T022 不实现真实 visitor Cookie、机器人判断、事件分类或写入逻辑。

### US1 阶段

T035 实现真实 tracking middleware，T036 接入带 deadline 的 recorder，T037 只负责把该真实
middleware 注入已经定义的 public engine factory。T037 不重新创建 engine，也不重复替换 logger
或 recovery。

## A1：量化统计写入 deadline

### 配置契约

- 环境变量：`ANALYTICS_WRITE_TIMEOUT_MS`
- 默认值：`50ms`
- 合法范围：`10–200ms`，上下界均包含
- 超出范围、非整数或无法解析：analytics 初始化降级为 no-op writer，记录不含原始配置值的脱敏
  配置错误；public server 继续启动，私有 system 状态说明降级原因类别

### 运行语义

- 每条允许事件使用独立 context deadline 同步尝试一次写入。
- 写入成功更新 `lastSuccessfulWriteAt`。
- 超时、锁冲突或其他存储错误立即增加 `droppedSinceStart`，不重试，不改变业务响应内容。
- 公开请求由 analytics 引入的额外等待不得超过已校验配置值；自动化测试允许极小调度误差，但
  必须证明传入 writer 的 context deadline 不超过 `200ms`。

### 验证矩阵

- 未配置时使用 `50ms`。
- `10ms`、`50ms`、`200ms` 均可启动并按值建立 deadline。
- `9ms`、`201ms`、零、负数、非整数均降级 analytics，public server 仍存活。
- writer 阻塞超过 deadline 时只增加一次 dropped counter，无重试，公开 status、headers、JSON 或
  APK bytes 与 no-op analytics 基线一致。

## 产物与验证

修订阶段需要更新：

- Figma HTML 导入包、manifest、README 和 `figma.md`
- `spec.md`、`plan.md`、`research.md`、`quickstart.md`、`tasks.md`
- `contracts/route-query-api.openapi.yaml` 及相关契约说明

完成条件：

1. 3 张新增画板按 manifest 精确尺寸渲染并完成截图检查。
2. 三份 feature OpenAPI 均可 lint/bundle，且路线业务 body 与现有 shared 契约兼容。
3. 任务编号连续、依赖清楚，US5 不包含首次三语或移动实现。
4. engine factory 与真实 tracking 的任务依赖不再循环或重复。
5. deadline 默认值、边界值、非法值和 writer 超时行为都有明确任务与测试路径。
6. C1、C2、C3、I1、A1 的定向一致性复核全部通过。

## 范围外事项

- 不处理本轮分析中的 I2（四类/五类状态措辞）和 I3（Android 主项目绝对路径）之外的新增事项；
  但 C1 新画板会明确普通查询失败，使五种状态的设计事实完整。
- 不改变 visitor ID、机器人过滤、长期明细、无备份、私有 SSH 隧道或统计始终启用等已确认决策。
- 不开始业务代码实现，不部署，不修改公开生产服务。
