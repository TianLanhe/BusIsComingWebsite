# Quickstart：首页体验精修验证

## 前置条件

- 已完成实现任务。
- 当前分支为 `codex/005-homepage-experience-polish`。
- 已安装前端依赖：`npm --prefix frontend install`。
- 如需更新 Figma，已打开目标文件：`https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU`。

## 1. Figma 设计源验证

1. 打开 Figma 桌面或浏览器版目标文件。
2. 进入页面 `Homepage Experience Polish - 005`。
3. 检查至少包含以下节点：
   - `Desktop 1440 / Stair Card Deck`
   - `Mobile 390 / Stair Card Deck`
   - `Carousel States / Scene Dots and Deck Click`
   - `Brand Contact States`
   - `Spec Notes`
4. 检查 `specs/005-homepage-experience-polish/figma.md` 中已回填的节点 ID：
   - `Desktop 1440 / Stair Card Deck`: `29:3`
   - `Mobile 390 / Stair Card Deck`: `29:44`
   - `Carousel States / Scene Dots and Deck Click`: `29:83`
   - `Brand Contact States`: `29:101`
   - `Spec Notes`: `29:108`
5. 如果节点缺失，应直接在 Figma 文件中恢复或重建设计节点，并同步更新 `figma.md`、内容元数据和契约。

期望结果：设计节点清楚表达 3 秒按场景轮播、左右滑动只切换场景、点点可切场景、同场景多图点击牌堆切主图、无底部缩略图堆叠、真实 logo 和联系入口状态。

## 2. 静态检查

```bash
npm --prefix frontend run test
```

期望结果：

- 内容契约通过。
- 三语字段完整。
- `zh-Hant` 关键抽查不等于 `zh-Hans` 简单转换。
- 轮播不显示编号和常驻箭头。
- 联系入口为 `Contact Us` 语义。
- 页面内容不含 `feedback@busiscoming.local`。

US1 轮播独立验证还应确认：

- 键盘焦点进入轮播后，方向键或读屏可访问按钮可切换功能页。
- 读屏标签只说明上一项/下一项功能，不显示常驻视觉箭头。
- 当前功能页切换语言后不重置。
- 场景点点可点击，并切换到对应功能场景。
- 多图场景点击后方牌堆图后只切换主图，不改变当前功能场景。
- 若出现底部缩略图堆叠、胶片条或图片按钮组，视为失败样例。

本轮实施结果（2026-06-25）：`npm --prefix frontend run test` 通过，10 个测试文件、37 个测试通过。

## 3. 构建验证

```bash
npm --prefix frontend run build
```

期望结果：TypeScript 和 Vite 构建通过，无资产导入错误。

本轮实施结果（2026-06-25）：`npm --prefix frontend run build` 通过。

## 4. 双端浏览器验证

```bash
npm --prefix frontend run test:e2e -- hero-carousel.spec.ts homepage-hero.spec.ts homepage-sections.spec.ts homepage-experience-polish.spec.ts
```

期望结果：

- 桌面 1440px 与手机 390px 均通过。
- 轮播约 3 秒自动切换，10 秒内至少切换 2 次。
- hover/focus/drag/touch 时暂停自动切换。
- 手动左右滑动或拖动只切换功能场景。
- 同场景多图只能通过点击后方牌堆图片切换主图。
- 语言切换后轮播状态不重置。

本轮实施结果（2026-06-25）：`desktop-1440` 与 `mobile-390` 共 8 个 Playwright 测试通过。

## 5. 视觉截图验收

实现阶段必须保存截图到 `specs/005-homepage-experience-polish/visual-review/`：

```text
desktop-1440-carousel-rail.png
mobile-390-carousel-rail.png
desktop-1440-brand-contact.png
mobile-390-brand-contact.png
```

每张截图检查：

- 没有主图底部小图堆叠。
- 后方牌堆图片底部不低于主图底部，露出部分可辨识且可点击。
- 没有胶片条、缩略图按钮组或上下图片堆叠。
- 没有 `01`、`02`、`03`、`04` 编号装饰。
- 没有常驻左右箭头。
- Header/footer logo 使用真实 App 巴士主体，不含 launcher 背景底板。
- 导航为“联系我们 / Contact Us”语义。
- 页脚邮箱为 `hezhenyu966@gmail.com`。
- 手机和桌面均无文字重叠、截断或不可操作控件。

本轮实施结果（2026-06-25）：4 张必交截图已生成，另保留 hero、feature carousel 和 sections 辅助截图。

```text
specs/005-homepage-experience-polish/visual-review/desktop-1440-carousel-rail.png
specs/005-homepage-experience-polish/visual-review/mobile-390-carousel-rail.png
specs/005-homepage-experience-polish/visual-review/desktop-1440-brand-contact.png
specs/005-homepage-experience-polish/visual-review/mobile-390-brand-contact.png
```

## 6. Logo 资产验证

检查 `frontend/src/assets/brand/README.md`，确认记录：

- 源文件为 Android foreground icon。
- 输出资产为透明背景。
- 不使用 launcher 背景底板。

可用 `file` 或浏览器截图确认输出图像格式和透明主体显示。

本轮实施结果（2026-06-25）：`busiscoming-logo-foreground.png` 为 512 x 512 RGBA PNG，约 100 KB；`favicon.webp` 约 4 KB。来源与裁切规则已记录在 `frontend/src/assets/brand/README.md`。

## 7. 服务端契约未漂移检查

本功能不修改服务端 HTTP API。若实现过程中触碰了共享契约或后端入口，需额外运行：

```bash
npm --prefix frontend run openapi:lint
npm --prefix frontend run openapi:routes:lint
```

期望结果：既有下载和路线查询 OpenAPI 均通过 lint。

本轮实施结果（2026-06-25）：`git diff --name-only -- backend shared/contracts/openapi/download-api.openapi.yaml shared/contracts/openapi/route-query-api.openapi.yaml` 无输出，确认未修改后端代码或既有 OpenAPI 源文件；`npm --prefix frontend run openapi:lint` 与 `npm --prefix frontend run openapi:routes:lint` 均通过。
