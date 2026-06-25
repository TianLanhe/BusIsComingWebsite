# 研究：首页体验精修

## Decision: 轮播采用低旋转阶梯牌堆，而不是 cinematic phone rail 或修补现有截图堆叠

**Rationale**：用户明确指出上次方案与实现偏离，关键问题是“大图底部几张小图”的缩略图堆叠，以及后续 side rail 方案中后方图片露出过少、透明度过高、难以点击。最终确认的低旋转阶梯牌堆把视觉焦点限制为一个主手机截图，并让同场景后方截图像一叠牌一样从左右和上方露出：桌面约 5 度旋转、手机可收敛到约 4 度，后方图片底部不得低于主图底部，露出区域必须可点击且可辨识。

**Alternatives considered**：

- 只把现有间隔从 4.5 秒改到 3 秒：无法解决缩略图堆叠偏离。
- 主图 + 右下浮动胶片条：比底部堆叠轻，但仍然是缩略图控件。
- cinematic phone rail / side rail：避免了底部缩略图，但后方图片露出面积和点击意图不够明确，验收容易偏离。
- 完整重做首页 hero：超出本轮范围，容易影响下载和在线查询已完成能力。

## Decision: 自动播放、滑动和点点都按 4 个功能场景切换，同功能页截图只通过点击牌堆切换

**Rationale**：4 个功能页对应现有产品叙事，自动播放保持信息节奏稳定。手动滑动如果同时可能切场景又可能切同场景截图，会让用户难以预测结果；点点如果只是装饰，也会降低可控性。最终约定是：自动播放、左右滑动/拖动和场景点点都只切换功能场景；同功能页多张截图只通过点击牌堆中露出的后方图片切换主图。

**Alternatives considered**：

- 自动播放所有截图：截图数量不均，会破坏 4 个功能点的叙事节奏。
- 左右滑动切同场景截图：和场景维度切换混在一起，交互边界不清。
- 完全取消自动播放：用户要求缩短轮播时间为 3 秒，取消不符合输入。

## Decision: 手动交互支持触控滑动和桌面拖动，不显示常驻箭头

**Rationale**：用户确认“不显示常驻箭头”的方向。移动端自然交互是左右滑动；桌面端通过鼠标或触控板拖动保留同等能力。键盘和读屏需要有可访问切换方式，但视觉上不能回到传统箭头 carousel。

**Alternatives considered**：

- 常驻左右箭头：清楚但不符合用户确认的丝滑视觉方向。
- 只支持触控滑动：桌面用户无法自然验证。

## Decision: 使用 Android foreground icon 裁出透明 logo 主体

**Rationale**：用户明确要求“只需要 icon 中间的巴士，背景部分不需要”。Android 主项目存在 `mipmap-xxxhdpi/ic_launcher_foreground.png`，为 432x432 RGBA 透明前景资源，比当前网站 `busiscoming-icon.webp` 的 launcher 完整底板更符合要求。导出时应保留透明背景和足够安全边距，供 header、footer 和 favicon 使用。

**Alternatives considered**：

- 继续使用 `ic_launcher.webp`：包含 launcher 底板和背景，不符合用户要求。
- 使用 lucide 线框巴士：不是 App 真实 logo。
- 手工重绘巴士图标：不可追溯到 Android App 真实素材。

## Decision: `zh-Hant` 使用香港实用书面语，三语保持同事实不同语感

**Rationale**：目标用户覆盖香港本地、简体中文用户和英文用户。繁体中文需要贴近香港交通产品语境；简体中文和英文不应硬套香港繁体词形。文案参考 Citybus、HKeMobility、Transport Department 和 GovHK 公开交通页面，但 App 功能事实仍以 Android 主项目为准。

**Reference links**：

- Citybus: https://www.citybus.com.hk/
- HKeMobility: https://www.hkemobility.gov.hk/
- Transport Department: https://www.td.gov.hk/
- GovHK public transport: https://www.gov.hk/tc/residents/transport/publictransport/

**Alternatives considered**：

- `zh-Hant` 从 `zh-Hans` 自动转换：会保留直译语气，用户已明确不接受。
- 更口语化香港表达：亲近但可能降低 App 主页的可信和克制感。
- 更政府公文式表达：稳妥但不像现代产品页面。

## Decision: 本阶段生成 Figma 本地插件，不伪造 Figma 节点 ID

**Rationale**：当前会话没有暴露可调用的 `use_figma` MCP 工具，不能真实写入 Figma 文件。项目已有 `specs/004-online-bus-query/figma-plugin/` 的 fallback 做法。本功能同样生成 `figma-plugin/` 和 `figma.md`，让后续任务可以导入插件生成桌面、手机、状态和说明节点。计划记录目标文件和节点名称，但不伪造未创建的 node ID。

**Alternatives considered**：

- 只写文字说明：违反 constitution 的 Figma 驱动要求。
- 假写节点 ID：不可验证，会误导后续实现。
- 阻塞等待 Figma MCP：当前任务可以通过可复现插件继续推进，阻塞没有收益。

## Decision: 契约以 UI 不变量 + 内容 schema 为主，不新增 OpenAPI

**Rationale**：本功能只触及前端体验、内容和资产，不需要服务端 API。用 UI contract 固定禁止形态和交互状态，用 JSON Schema 固定可测试内容、品牌和轮播配置，能让后续任务与测试直接对应。

**Alternatives considered**：

- 修改共享 OpenAPI：没有 HTTP API 变更，属于错误扩大范围。
- 只写 prose plan：不利于 Ajv/测试自动校验。

## Decision: 验证以 Vitest + Playwright + 视觉截图组合完成

**Rationale**：Vitest 适合检查内容、i18n、配置和组件状态；Playwright 才能证明桌面/手机视口下没有底部缩略图、编号、箭头和布局重叠。视觉截图保存到 feature 的 `visual-review/`，避免实现阶段只凭口头确认。

**Alternatives considered**：

- 只跑单元测试：无法证明视觉形态符合用户预期。
- 只截图不测逻辑：无法覆盖 3 秒切换、暂停、语言状态和旧内容清除。
