# 快速开始与验收：首页故事与核心入口优化

## 1. 用途

本指南定义 015 实现阶段的执行与验收顺序。它不能替代后续 `tasks.md`，也不能用构建通过代替 Figma、浏览器或人工动效复核。

## 2. 前置条件

- 工作分支：`feat/015-refine-homepage-interactions`
- Node/npm、Go 与浏览器依赖满足仓库锁定版本
- 014 基线保持只读
- 路线与下载 E2E 使用现有受控 fixtures，不把第三方实时波动写入视觉 golden
- 如使用 Android 浏览器，只能启动本任务所有的 emulator，并在验证后关闭

## 3. Figma 前置门禁

生产 UI 修改前，先按 [figma.md](./figma.md) 创建 015 独立 FINAL refinement Section：

1. 创建并自测 `docs/superpowers/prototypes/2026-08-25-homepage-refinement-figma-import/`；
2. 在 Figma Desktop 导入并运行插件；
3. 真实选择 Section、1440/390/320、双语言 Story 01、motion、route、download 与 Privacy 节点；
4. 把真实 node ID 写入 `figma.md` 和内容合同实例；
5. 导出 reference PNG，并生成包含尺寸、SHA、state、locale 和导出方式的 manifest；
6. 通过路径、尺寸、非空画面和节点完整性检查后才允许修改 `frontend/src/`。

如果 MCP 无额度，只能如实使用 Figma Desktop 人工导出；不得填写推测 ID 或声称 MCP readback。

## 4. 本地化截图原子导入

一次性源目录只通过进程环境传入，不写入仓库：

```bash
BIC_FIGMA_ZH_SCREENSHOT_DIR=/path/to/approved-zh \
BIC_FIGMA_EN_SCREENSHOT_DIR=/path/to/approved-en \
npm --prefix frontend run prepare:homepage-story-assets
```

实现后的脚本必须先在临时 staging 中完成 10 个 raw 源 basename、实际批准尺寸、批准 SHA、顶部对齐等比处理、30 个 1080:2172 WebP 输出和 manifest v3 校验，再原子替换受管资源。任何校验失败都不能改变当前受管文件；故事 05 只能使用锁屏通知图。

不得把上述示例值替换成实际本机路径后提交；命令、错误、manifest 与构建产物均不输出环境变量值。

## 5. 合同校验

### 5.1 JSON 可解析

```bash
node -e "for (const p of ['specs/015-refine-homepage-interactions/contracts/homepage-content-v4.schema.json','specs/015-refine-homepage-interactions/contracts/screenshot-assets-v131-localized.manifest.schema.json']) JSON.parse(require('fs').readFileSync(p,'utf8'));"
```

### 5.2 实现后的 AJV 与内容测试

```bash
npm --prefix frontend run test -- content-contract screenshot-assets-contract i18n-completeness
```

必须证明：

- 内容版本为 v4，存在 `siteChrome`，不存在强制 Header `navigation.items`；
- 下载标签只有 version、minimumSystem、size；
- 五故事 ID、顺序、三语文案和截图 ID 一一对应；
- locale mapping 固定为繁简中文→zh、英文→en；
- 5 个 story × 2 个 variant × 3 个 width = 30 个唯一 WebP；
- 故事 01–04 的源为 1080×2172，故事 05 锁屏源为 1080×2400；每个输出顶部对齐等比生成 540×1086、720×1448、1080×2172；
- 生产内容、manifest、错误和构建不含本机、Android 工程或临时目录。

## 6. 单元测试与构建

```bash
npm --prefix frontend run test
npm --prefix frontend run build
```

Vitest 使用 fake timers 和可控 observer/mock 覆盖：

- initial settled 后 10 秒；自动 settled 后 5 秒；05→01；
- 手动不同/current、locale 和 pause resume 后 10 秒；
- dwell 只从最新 epoch settled 后开始，任一时刻一个 timer；
- hover、键盘 focus、offscreen、hidden、reduced-motion 多原因叠加；
- 快速选择时陈旧 transitionend、decode、失败壳和 fallback 无效；
- 自动切换不播报，手动最终 settled 只播报一次；
- unmount 后 observer、listener 与 timer 完整清理；
- resize/orientation 不重置业务状态或新增 timer。

## 7. E2E 验证

```bash
npm --prefix frontend run test:e2e
```

Playwright 主矩阵：

| 范围 | 1440×960 | 390×844 | 320×844 |
| --- | --- | --- | --- |
| Hero | 品牌首行、自动/手动、桌面 CTA 到 `#download` | 环形舞台、手机直接下载 | `zh-Hant`/`en` 对照 Figma；`zh-Hans` 只验文本、溢出、几何、44×44 与无横向滚动 |
| Locale | zh-Hant/zh-Hans 中文图、en 英文图 | 同左且保持 story/state | 同左 |
| Route | 业务与原桌面布局不回归 | 右侧 swap、default/candidate/error | 输入可用宽度与焦点完整 |
| Download | QR、真实行动、无日期 | 无 QR、真实行动、无日期 | 文案/metadata 不截断 |
| Privacy/Footer | 真实 Logo、返回首页、无 Header | 同左 | 同左 |

交互必须另外验证：

- pointer hover 暂停与离开后 10 秒；
- Tab/Shift+Tab 键盘 focus 暂停，但 pointer 点击留下的 focus 不永久暂停；
- 页面离开播放区域和切后台暂停；
- 自动轮播不移动焦点、不更新 live region；
- 下载 desktop/mobile 使用同一 breakpoint 语义，不依赖 User-Agent；
- swap 在候选和错误状态不覆盖 field、listbox、错误或焦点环。

## 8. 确定性视觉验收

视觉 helper 必须先设置 `visual-review` pause，再等待：

- `document.fonts.ready`；
- 目标语言前景图 `decode()` 或稳定失败壳；
- 当前最新 epoch `data-transition-state=settled`；
- 下载/路线 fixture 状态稳定；
- 风带和其他持续动效进入确定性审查状态。

不得用任意 sleep 作为唯一稳定条件。静态 golden 只截 settled；start、约 160ms 与 settled 三相通过受控阶段协议和人工 motion review。

对每个 reference 生成同 viewport 的 actual、side-by-side、50% overlay 和 diff。现有 `toHaveScreenshot` 全图阈值可继续保护抗锯齿噪音，但以下独立断言保持零容忍：标题分行、Logo、语言入口、手机四边、1080:2172 修长比例、内屏上下无露底、环形前后层级、故事轨不覆盖、CTA 语义、无日期、无横向滚动、触控目标和后景可访问性。

## 9. 人工动效复核

标准模式观察：

- 首次 10 秒，之后每次稳定态 5 秒；手动/语言/恢复重新 10 秒；
- 舞台先行，约 160ms 后文字跟随，完整约 820ms；
- 快速点击不排队、不双前景、不闪空，最后选择胜出；
- 风带保持既有轻缓层次，文字和布局不随背景漂移。

减少动态效果模式确认：

- 自动轮播、持续风带、环形大位移、文字滑动、blur 与平滑滚动均停止；
- 五故事仍可手动即时选择，信息和操作不缺失。

验收记录必须保留已知限制：没有可见暂停按钮，触屏用户没有显式永久停止 autoplay 的操作，不能宣称完整满足 WCAG 2.2.2。

## 10. API 与范围回归

本功能不改后端或 OpenAPI：

```bash
npm --prefix frontend run openapi:lint
npm --prefix frontend run openapi:bundle
git diff -- backend shared/contracts/openapi
```

预期：lint/bundle 成功；`backend/` 与 `shared/contracts/openapi/` 没有本 feature 的语义差异。若 bundle 命令产生纯生成噪音，应核对并排除，不纳入提交。

## 11. 完成前检查

```bash
git diff --check
rg -n '^(<<<<<<<|=======|>>>>>>>)' . \
  --glob '!frontend/node_modules/**' \
  --glob '!frontend/dist/**'
git status --short --branch
```

完成报告必须分别说明自动化、Figma 读取/人工导出、桌面/手机/窄屏/三语/reduced-motion 浏览器证据、真实网络和 task-owned Android 是否实际执行。只有 `zh-Hant`/`en` 可在证据齐全时宣称像素级 Figma 对照；`zh-Hans` 只报告文本、溢出与几何验收。没有对应证据时，不得宣称与预览一模一样。
