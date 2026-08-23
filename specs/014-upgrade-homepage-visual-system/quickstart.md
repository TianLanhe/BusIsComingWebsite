# 快速开始与验收：首页视觉系统升级

## 1. 目的

本指南用于在实现阶段证明首页同时满足功能、双端、三语、无障碍、动效降级和 Figma 高保真合同。
它不是实现步骤清单；具体代码拆分由后续 `tasks.md` 定义。

## 2. 前置条件

- 工作分支：`feat/014-upgrade-homepage-visual-system`
- Node/npm 与 Go 版本满足仓库现有要求
- 已安装 `frontend/package-lock.json` 锁定的依赖
- Figma 可读取最终 Section `119:64`；若 MCP 无额度，使用 Figma Desktop 人工导出并在证据 manifest
  如实记录，不能声称 API readback
- 路线 E2E 使用仓库测试服务器/fixtures，不把第三方实时波动作为视觉基线
- 如需 Android 浏览器补充验证，只能使用本任务新启动或明确归本任务所有的 emulator，并在验证后关闭

## 3. 首次准备

```bash
npm --prefix frontend install
npm --prefix frontend run test
npm --prefix frontend run build
```

预期：依赖安装完成，实施前基线可运行；旧首页测试可能在合同迁移阶段被新失败测试有意取代，但不能
静默删除仍保护路线、下载、SEO、Privacy 或 monitoring 边界的回归。

## 4. 契约与内容校验

### 4.1 JSON Schema 可解析

```bash
node -e "for (const p of ['specs/014-upgrade-homepage-visual-system/contracts/homepage-content-v3.schema.json','specs/014-upgrade-homepage-visual-system/contracts/screenshot-assets-v131.manifest.schema.json']) JSON.parse(require('fs').readFileSync(p,'utf8'));"
```

### 4.2 实现完成后的合同测试

```bash
npm --prefix frontend run test -- content-contract screenshot-assets-contract i18n-completeness
```

必须证明：

- 故事恰有五个且 ID/顺序/截图一一对应；
- `zh-Hant` 固定标题与说明逐字一致，三语字段无缺失；
- Header、四段内容、四项 FAQ、Figma `119:*` 引用存在；
- 生产内容和素材 manifest 不含 `/Users/`、`/private/var/`、`AndroidStudioProjects` 或临时目录；
- 受管截图记录源/输出 SHA、尺寸、批准/脱敏状态和三语 alt；
- 旧四故事、3 秒自动轮播、FeatureGrid 和旧 Figma 节点不再是运行合同。

## 5. 单元与构建验证

```bash
npm --prefix frontend run test
npm --prefix frontend run build
```

必须覆盖：

- 五槽位每次恰有一个 front；正向、反向和 20 次快速选择以最后目标为准；
- 标题、说明、前景图、按钮选中态和 live status 同步；
- reduced motion 立即换槽且无持续风带/观察者动效；
- 语言切换保留故事、路线状态、下载状态和 FAQ ID；
- 路线现有 request version、受控失败、保留结果和 ETA 合并不回归；
- 路线卡耗时/步行为文字，图标/直达/转乘计数为 0；
- 下载 checking/ready/unavailable 共用状态，ready 才有原生 href；
- 桌面 ready QR value 与按钮最终绝对 URL 相同，其他状态和手机 QR 为 0；
- FAQ 默认第一项、同一时间最多一项、键盘和 aria 状态一致；
- Privacy 和静态三语页面仍可构建。

## 6. E2E 验证

```bash
npm --prefix frontend run test:e2e
```

Playwright 最低矩阵：

| 范围 | desktop `1440×960` | mobile `390×844` | narrow `320px` |
| --- | --- | --- | --- |
| Hero | 五故事、标准/快速/反向 | 五故事、完整四边、轨道在下 | 三语长标题、完整导航 |
| Route | 全状态、键盘输入 | 全状态、稳定工作区 | 无横向滚动 |
| Download | 三态、真实 QR/按钮目标 | 三态、QR 0 | CTA/元数据不截断 |
| Support | 默认/切换/联系/页尾 | 默认/切换/联系/页尾 | FAQ/页尾不溢出 |
| reduced motion | 无持续动画/大位移 | 无持续动画/大位移 | 功能覆盖不变 |

通用几何/无障碍断言：

- `document.documentElement.scrollWidth === document.documentElement.clientWidth`；
- 所有主要按钮/链接 bounding box 至少 `44×44 CSS px`；
- Header 的功能、FAQ、联系、语言入口可见；
- 手机前景截图四边均在舞台内，故事轨道顶部大于等于舞台底部；
- 标题分行和 CTA 顺序与对应 Figma Frame 一致；
- 后景截图不在 Tab 顺序且不重复朗读；
- 焦点可见，故事/FAQ/语言/combobox 的键盘路径完整；
- 页面不存在灵动岛、证据标签、功能说明行、耗时/步行图标、直达/转乘、紫色块和深色页尾。

## 7. Figma 高保真验收

### 7.1 设计参考归档

在实现开始时，从 [figma.md](./figma.md) 定位最终节点并导出关键 Frame 到：

```text
specs/014-upgrade-homepage-visual-system/visual-review/
├── reference/
├── actual/
├── overlay/
├── diff/
└── manifest.json
```

`manifest.json` 至少记录：reference ID、Figma node ID、viewport、locale、story/state、导出方式、
导出日期、像素尺寸和 SHA-256。此目录是验收证据，不是生产资源。

最低 reference 集：

- Hero：`zh-Hant` 五故事 × desktop/mobile；
- Header/Hero 长文案：三语 × desktop/mobile/narrow；
- Route：默认、候选、无效、加载、成功、empty、error、retry、retained × desktop/mobile；
- Download：checking、ready、unavailable、reduced × desktop/mobile；
- Support：默认 FAQ、切换 FAQ、联系/页尾 × desktop/mobile。

### 7.2 浏览器截图稳定条件

截图前必须等待：

- `document.fonts.ready`；
- 五张舞台图片完成 `decode()` 或进入受控失败态；
- mock 数据、下载 metadata 和当前故事状态稳定；
- `data-transitioning=false`；
- 视觉截图 context 使用 reduced motion 或专用静态审查状态暂停 wind。

不得使用任意 `sleep` 作为唯一稳定条件。

### 7.3 首版批准与回归 golden

1. 用 Sharp 生成 reference/actual 的 side-by-side、50% overlay 和 diff；
2. 逐项人工检查 Figma 层级、材质、分行、倾斜、远近、CTA、完整四边和收尾；
3. 任一 [视觉合同](./contracts/homepage-visual-system.contract.md) 的零容忍项失败即退回；
4. 首版人工批准后，把 actual 作为固定 Chromium/字体环境下的 Playwright golden；
5. 后续 `toHaveScreenshot()` 保护浏览器回归，但不能反向覆盖 Figma reference。

## 8. 动效人工检查

在 standard motion 下人工观察：

- 风带是缓慢的 `10–22s` 白/浅绿远近呼吸，无文字闪烁或布局移动；
- 手机点击每个故事时，目标从远景上前、原图退后，约 `880ms`；桌面约 `520ms`；
- 非相邻、反向、快速点击不排队、不闪空、不产生两个前景；
- 下载区进入 viewport 后只运行一次克制汇聚，语言切换不重播；
- FAQ 约 `200–240ms`，同一时间最多一项。

在 `prefers-reduced-motion: reduce` 下确认持续风带、环形大位移、平滑滚动和下载汇聚数量为 0，
信息层级与全部操作保持。

## 9. API 与边界回归

本功能不修改 OpenAPI；可运行现有 lint/bundle 证明没有合同破坏：

```bash
npm --prefix frontend run openapi:lint
npm --prefix frontend run openapi:bundle
git diff -- shared/contracts/openapi backend
```

预期：lint/bundle 成功，`shared/contracts/openapi/` 的源语义和 `backend/` 无本功能差异。生成 bundle
如只因命令重写而变化，必须核对并避免夹带无关生成噪音。

## 10. 完成前检查

```bash
git diff --check
rg -n '^(<<<<<<<|=======|>>>>>>>)' . \
  --glob '!frontend/node_modules/**' \
  --glob '!frontend/dist/**'
git status --short --branch
```

完成报告必须分别说明：

- 自动化单元/build/E2E 是否通过；
- Figma 是否实时读取或人工导出，具体节点和限制；
- 桌面/手机/320/三语/reduced-motion 证据是否生成；
- 是否做真实浏览器或 task-owned Android 验证；
- 是否仍存在视觉或外部服务未验证项。

不能只凭 build、OpenAPI 或单张截图宣布“与预览一模一样”。
