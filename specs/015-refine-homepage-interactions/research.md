# 第 0 阶段研究：优化首页故事与核心入口

## 1. 增量边界与合同迁移

**决策**：015 作为 014 的独立增量 feature，保留既有四段页面、五故事内容、路线查询业务、下载资料 Provider、FAQ 与浅色页尾；新建 015 合同并在实现时同步长期共享合同，不修改 `specs/014-*` 历史产物。

**理由**：当前运行时和 `shared/contracts/ui-state-contract.md` 仍要求 Header、语言 disclosure、单语截图、显示日期并禁止 autoplay，已经与 015 冲突。只改组件会让源码、测试和长期合同互相矛盾；回写 014 又会破坏已交付基线的可追溯性。

**考虑过的替代方案**：

- 直接修改 014 spec/contract：会改写历史验收事实，拒绝。
- 只改 CSS 和少量组件：无法处理轮播状态、三语截图、下载语义和共享合同，拒绝。
- 重做整站：超出本轮纯前端增量范围，拒绝。

## 2. Hero 单一轮播控制器

**决策**：新增聚焦的 Hero 控制器，以 `requestedStoryId`、`settledStoryId`、`transitionEpoch`、`selectionOrigin`、`dwellKind` 和暂停原因集合表达状态。任何时刻最多存在一个 dwell timer；计时只从最新 epoch 的 settled 信号开始。

时间规则固定为：

- 首次 settled：10 秒；
- 自动切换 settled：5 秒；
- 手动选择 settled：10 秒；
- 点击当前故事：不创建新转场，直接重置 10 秒；
- 语言截图 settled：保持故事并重置 10 秒；
- 暂停解除：不续接剩余时间，重新等待 10 秒。

**理由**：当前 `HeroSection` 只有手动 `activeStoryId`，`HeroStoryStage` 用独立 900ms timer 标记视觉状态。若在 story effect 中直接使用 interval，转场时间会被算入阅读时间，快速点击也会留下陈旧回调。

**考虑过的替代方案**：

- 永久 5 秒 `setInterval`：无法表达首次、手动、语言切换和恢复后的 10 秒，拒绝。
- 在 Stage 或 Rail 内启动自动计时：破坏视觉、控制和输入职责边界，拒绝。
- 保存暂停前剩余时间：与“恢复后重新给 10 秒”冲突，拒绝。

## 3. 转场 settled 协议与文字跟随

**决策**：Stage 接收 transition epoch，并在目标前景手机的主位移完成且目标语言图片已 decode、load 或进入稳定失败壳后，回报带 story ID/epoch 的 settled。主 `transitionend` 是正常完成信号，约 820ms 的可失效保护 timer 只处理事件丢失；reduced motion 在状态提交后直接 settled。

舞台立即向目标槽位换位，旧文案作为只读视觉快照停留约 160ms 后向上淡出，新文案由下方进入。`activeStoryId` 仍立即决定按钮和目标业务状态；离场文案不能成为第二套业务真相。陈旧 epoch 的 transitionend、图片回调和保护 timer 全部忽略。

**理由**：这能实现“舞台先行、文字后随”，同时让阅读计时从真实稳定时刻开始，并保证快速选择最后一次胜出。

**考虑过的替代方案**：

- 延迟 160ms 才更新 active story：会让按钮、图片和标题的业务状态分裂，拒绝。
- 只靠固定 timeout：CSS/JS 时间容易再次漂移，拒绝作为主信号。
- 引入通用动效库：现有 transform/opacity 已足够，新增依赖没有收益。

## 4. 自动暂停与首屏可见性

**决策**：暂停原因采用可组合集合：`hover`、键盘 `focus`、`offscreen`、`hidden`、`reduced-motion`。任一原因存在时取消 dwell；已经开始的最新 CSS 转场可以完成，但暂停期间不再建 timer。解除最后一个原因后重新等待 10 秒。

可见性不能直接使用“整个 Hero 的 intersection ratio ≥ 0.5”，因为手机 Hero 可能高于 viewport。观察明确播放区域，或以“可见高度 ÷ `min(区域高度, viewport 高度)`”归一化，确保 `390×844` 和 `320×844` 首屏不会被误判为不可见。

普通 pointer 点击可能留下 DOM focus，因此只有键盘输入模态下的区域内焦点进入暂停集合；pointer 选择本身按手动 10 秒规则处理，不能造成永久暂停。

**理由**：集合模型可以正确处理 hover 与 hidden 等多原因叠加；归一化可见性避免移动端永远无法自动播放。

**考虑过的替代方案**：

- 单一 `paused` 布尔值：多个原因会互相覆盖，拒绝。
- 暂停并冻结半途转场：会留下视觉半状态，拒绝。
- 增加可见暂停按钮：用户明确拒绝。

## 5. 辅助技术播报

**决策**：自动切换只更新视觉选择，不移动焦点、不更新 live region。手动选择只在最新目标 settled 后进行一次礼貌、原子播报；语言切换依赖语言操作本身的反馈，不重复播报故事；点击当前故事不重复播报未变化内容。

**理由**：当前 Rail 的 live region 永远派生 active story，加入 autoplay 后会持续打断读屏用户。将播报状态与视觉 active 分离，仍不引入第二套故事业务状态。

**考虑过的替代方案**：

- 自动切换也播报：会造成非用户发起的持续打断，拒绝。
- 完全删除手动播报：降低故事按钮切换后的状态可理解性，拒绝。

## 6. Hero 品牌首行与语言直达

**决策**：`App.tsx` 不再为首页和 Privacy 统一渲染旧 Header。首页 Hero 内首行使用真实 `busiscoming-icon.webp`、`BusIsComing` 和直达的 `繁 · 简 · EN`；Privacy 使用真实 Logo、品牌名和返回首页入口；公开页尾也统一使用真实 Logo，避免两套品牌。首行处于正常文档流且不吸顶。

语言项保留真实本地化 URL，脚本可用时阻止整页跳转并调用现有语言状态；当前语言使用 `aria-current`，三项都保留至少 44×44 命中区。

**理由**：现有 Header 是 sticky、包含抽象 BrandMark 和 disclosure menu，与用户批准的浅层、低占用入口冲突。真实 URL 同时保留无脚本和打开新标签语义。

**考虑过的替代方案**：

- 为旧 disclosure 增加 inline variant：仍会保留无用 open/menu 状态，生产无其他使用方时没有收益。
- 隐藏 Header 但保留占位：继续破坏首屏高度，拒绝。
- 语言放到页尾或 Logo 菜单：发现性过低，用户已否决。

## 7. 首页内容合同 v4

**决策**：新建 `homepage-content-v4.schema.json`，实现时同步到 `shared/contracts/homepage-content.schema.json`。以 `siteChrome` 取代强制三项导航的旧 `navigation`，记录真实品牌 asset ID、品牌名和直接语言入口；页尾链接由 `supportEnding` 自身提供。下载 metadata labels 只保留 version、minimum system、size，删除 `updated`。Figma 引用同时保留 014 baseline 和 015 refinement。

**理由**：当前 v3 schema 强制 Header 导航项和 updated 标签，继续沿用会让已删除 UI 成为合同必填项。删除字段是 breaking shape，使用 v4 比在 v3 上制造含混的可选字段更清楚。

**考虑过的替代方案**：

- 保留旧 navigation 仅供 Footer：会留下未使用的 features/contact 内容，并继续暗示 Header，拒绝。
- 只停止渲染 updated：长期内容合同仍允许并要求旧日期标签，拒绝。

## 8. 双语言截图 manifest v3

**决策**：新建 `screenshot-assets-v131-localized.manifest.schema.json`，生产 manifest 升级为 `3.0.0`。顶层固定 `zh-Hant → zh`、`zh-Hans → zh`、`en → en`；每个故事包含 `zh` 和 `en` variant，每个 variant 记录源 basename、1080×1920 指纹、批准/脱敏状态和 540×960、720×1280、1080×1920 三个 WebP 输出，共 30 个受管文件。

文件使用 `{storyId}-{zh|en}-{width}.webp`；前端集中映射 `storyId → localeVariant → sourceSet`。目标 variant 失败只显示目标语言 alt 的同尺寸失败壳，禁止跨语言回退。

素材准备脚本接收两个必填进程环境变量，只读取一次性源目录；先在临时 staging 完整校验 10 个 basename、SHA 和尺寸并生成 30 个输出，再原子替换受管资源与 manifest。环境值不序列化到文档、manifest、错误或构建产物。

**理由**：当前 5 个旧源图尺寸不一致，manifest 和 runtime 都无法表达语言变体。原子导入避免半套新旧资源进入工作区。

**考虑过的替代方案**：

- 英文页继续使用中文图：用户已明确否决。
- 把原 PNG 全量直接发送：体积与响应式选择退化。
- 运行时读取外部源目录：违反可部署性和路径安全边界。

## 9. 真实 App Logo 的来源合同

**决策**：以 `frontend/src/assets/brand/busiscoming-icon.webp` 作为首页 Hero、Privacy 与公开页尾的真实 App Logo，机器测试固定 192×192、透明 WebP 和批准 SHA。实现时同步 `docs/asset-provenance.md`，明确旧 foreground 与抽象 BrandMark 的退役/剩余用途。

**理由**：文件已存在且指纹匹配，但当前来源文档仍称它为“历史素材，不作为当前网站 logo”。仅替换组件会制造来源文档漂移。

**考虑过的替代方案**：

- 新增独立品牌 manifest/schema：一个既有固定文件可由 UI 合同和聚焦测试充分约束，暂不增加额外 schema。
- 继续抽象 BrandMark：与用户批准真实 App Logo 冲突。

## 10. 桌面与手机首屏下载分流

**决策**：使用与第三屏二维码一致的 viewport 语义，而不是 User-Agent。桌面 Hero CTA 始终是 `#download` 页面内入口，不带 `download`，即使 metadata checking/unavailable 也能到达受控第三屏；手机只有 ready 时才暴露真实 APK `href` 和文件名。第三屏下载和 QR 继续由同一 metadata URL 派生。

普通模式使用原生 hash 与现有滚动行为；reduced motion 下全局规则切为即时滚动，无需额外脚本分支。

**理由**：桌面 CTA 是页面导航，手机 CTA 是文件操作；两者不应共用完全相同的 anchor 语义。共用 breakpoint 避免 CTA 与 QR 在中间宽度互相矛盾。

**考虑过的替代方案**：

- User-Agent 判断：对平板、窗口缩放和触控桌面不可靠。
- `preventDefault + scrollIntoView`：增加无必要的 hash/reduced-motion 分支。
- 桌面必须 metadata ready 才能点击：会使第三屏不可用状态失去入口。

## 11. 手机路线交换布局

**决策**：只重构输入组容器。桌面保持 origin → swap → destination 的既有纵向构图；手机把两个 PlaceCombobox 放在左侧 stack，把 44×44 交换按钮作为右侧 sibling，按两个真实 input 表面的整体中心对齐。候选 listbox 继续绝对锚定 field，错误文本仍在正常流。

**理由**：布局可以局限在 DOM 包装与 CSS，不触碰 `swapPlaces()`、请求序列、路线/ETA 状态和 retained 规则。

**考虑过的替代方案**：

- 对当前按钮简单 absolute 定位：错误和长文案状态没有稳定参照，拒绝。
- 重写 PlaceCombobox：没有业务必要，扩大风险。

## 12. 流式响应式策略

**决策**：1440×960、390×844 是批准端点，320×844 是窄屏保护。使用共享 token、`clamp()`、百分比、grid/flex 和 max-width 连续调整标题、间距、手机宽度、环形位移和故事轨；不对整页使用 transform scale。

删除旧 Header 相关的 `100svh - 82/58px`、负 anchor offset 和全局 scroll margin。逐步移除 980–1440 区间对固定 1440 画布坐标的依赖；新 9:16 素材的手机几何只按 015 Figma refinement 校准。

**理由**：当前 1181/980 两次突变和多个固定坐标会在中等宽度裁切或突然换构图。整体缩放又会牺牲可读性和触控目标。

**考虑过的替代方案**：

- 保留固定 1440 坐标：不能满足窗口连续变化。
- 整页等比缩放：用户已批准拒绝，且会缩小文字、焦点环和命中区。

## 13. Figma refinement 与视觉证据

**决策**：014 Figma Section `119:64` 继续作为色彩、风带、环形舞台和四段结构历史基线，不修改 014 导入包。为 015 新建增量本地 Figma 插件和独立 FINAL refinement Section，使用同一真实 Logo 和两套五故事图片，移除旧 Header、抽象 Logo和日期。

`figma.md` 必须记录新 Section、1440/390/320、中文/英文 Story 01、start/160ms/settled、手机路线 default/candidate/error、双端下载分流、无日期 metadata 和 Privacy 返回入口的真实节点。MCP 无额度时允许 Figma Desktop 人工导出，但必须记录真实选中节点、像素尺寸、导出方式和 SHA，不能声称 API readback。

生产 UI 修改的前置门禁是：增量插件自测通过，新节点与 reference export 可定位，`figma.md` 和 visual-review manifest 无占位或绝对路径。实现后再生成同 viewport actual、side-by-side、overlay、diff 并人工批准 browser golden。

**理由**：旧导入包包含本轮已删除的 Header、旧截图和日期，不能重跑；新的增量 Section 可同时保留历史和当前设计权威。

**考虑过的替代方案**：

- 修改 014 FINAL Section：破坏历史基线，拒绝。
- 用聊天截图或 Visual Companion 代替 Figma：违反项目 Figma 门禁，拒绝。
- 先写生产 UI 再回填 Figma：会让浏览器反向成为设计源，拒绝。

## 14. 测试分层与视觉稳定

**决策**：

- Vitest fake timers 验证 10s/5s、settled 后计时、手动/当前/locale/resume 10s、05→01、单 timer、叠加暂停、快速 epoch 和卸载清理；
- observer、visibility 与 matchMedia 使用可控 mock；
- Playwright 验证真实 focus/hover、桌面/手机 CTA、390/320 路线几何、三语截图、无日期、无横向滚动；
- `mobile-320` 基准由当前 320×720 修正为 320×844；如保留 720 压力测试，必须是额外项目；
- 视觉 helper 在截图前进入确定性 test pause，等待字体、目标语言图片与最新 epoch settled；
- 静态 golden 只比较 settled 帧，start/160ms/settled 通过阶段协议和人工动效复核；
- 几何/语义零容忍断言独立于 0.3% 像素阈值。

**理由**：真实等待 10 秒会让测试缓慢且受 CI 调度影响；自动轮播也会让未暂停的视觉截图产生随机故事。计时、浏览器语义和主观动效应分别由最合适的证据证明。

**考虑过的替代方案**：

- 所有路径使用真实时间 E2E：慢且易抖动，拒绝作为主证明。
- 只做像素对比：无法证明时间、焦点、读屏和状态机。
- 自动更新 golden：会把未经批准的漂移写成新基线，拒绝。

## 15. 已知无显式暂停限制

**决策**：不提供可见暂停／播放按钮，仍验证 hover、键盘 focus、offscreen、hidden 与 reduced-motion 保护。最终记录必须明确：触屏用户没有永久停止自动轮播的显式操作，这可能低于 WCAG 2.2.2 的严格解释；上下文暂停不能被描述成完整替代。

**理由**：这是用户明确批准的产品取舍，不是遗漏。

**考虑过的替代方案**：可见暂停按钮、浮动控件和故事轨内暂停均被用户明确拒绝。

## 研究结论

没有遗留待确认事项。Phase 1 可按 homepage content v4、本地化素材 manifest v3、Hero interaction delta contract、Figma refinement 记录和 quickstart 验证指南继续设计；后端、OpenAPI、monitoring 与 Android App 均不进入实现范围。
