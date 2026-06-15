# 快速验证指南：第一版网站主页

## 前置条件

- 当前 feature 指针：`.specify/feature.json`
- 功能规格：`specs/001-homepage-v1/spec.md`
- 实施计划：`specs/001-homepage-v1/plan.md`
- Figma 文件：https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU
- 实现阶段应在 `frontend/` 下创建前端应用，并在 `shared/contracts/` 下放置稳定契约副本。
- 本 feature 不产出服务端代码；如需记录未来后端边界，仅创建说明文档，技术栈为 Go 1.26 + Gin + MySQL。

## 本阶段产物验证

从仓库根目录执行：

```bash
rg -n "NEEDS CLARIFICATION|\\[通过/未通过\\]|\\[FEATURE\\]|\\[DATE\\]" specs/001-homepage-v1 --glob '!quickstart.md' --glob '!**/checklists/**'
```

期望结果：

- 不存在未解决澄清标记。
- `plan.md` 不再包含模板占位。
- `research.md`、`data-model.md`、`quickstart.md`、`figma.md` 和 `contracts/` 均存在。

## 实现完成后的本地运行验证

实现阶段应提供等价命令。推荐命令形态：

```bash
cd frontend
npm install
npm run build
npm run test
npm run dev
```

期望结果：

- 构建成功。
- 内容、下载状态、轮播和 i18n 相关测试通过。
- 本地开发服务可打开首页。

## 浏览器验证场景

### 桌面首屏

视口：1440px 宽。

验证：

- 首屏不滚动即可看到 BusIsComing 品牌、通勤收益标题、下载 App 主 CTA、在线查询次 CTA 和 App 功能轮播。
- 下载按钮 default 状态显示 Android 与 iPhone 左右分区。
- hover 或 focus Android 后，按钮展开为 Android APK 可下载状态。
- hover 或 focus iPhone 后，按钮展开为 iPhone 暂未支持状态，点击不跳转。
- 轮播第一项为“常用路线快速查询”。

### 手机首屏

视口：390px 宽。

验证：

- 内容为单列结构。
- 下载 App 主 CTA 和在线查询次 CTA 可见可操作。
- App 预览轮播位于 CTA 后方，文字不重叠、不横向溢出。
- iPhone 状态仍明确不可用。

### 在线查询静态演示

验证：

- 页面展示起点、终点、查询按钮和静态路线结果。
- 用户操作不会发起真实 Citybus、DATA.GOV.HK 或后端查询。
- 限制提示清楚表达“在线查询功能部分受限，完整功能请下载 App”。

### 三语切换

验证：

- `zh-Hant`、`zh-Hans`、`en` 都能展示首页核心内容。
- 平台状态、在线查询限制、FAQ 范围说明在三种语言下都存在。
- 切换语言后保留当前轮播项和下载按钮可理解状态。

## Figma 对照验证

实现阶段应保存或展示浏览器截图，并与 Figma 对照：

- 桌面首页：node `4:2`
- 手机首页：node `4:183`
- 下载按钮状态：node `4:326`
- 轮播状态：node `4:357`

验收重点：

- 信息层级、CTA 优先级和页面顺序一致。
- 无核心文字重叠、按钮截断、图片遮挡或横向滚动。
- 视觉风格保持现代、简洁、优雅，不引入未确认的营销化装饰。
