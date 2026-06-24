# Quickstart：首页体验精修验证

## 前置条件

- 已完成实现任务。
- 当前分支为 `codex/005-homepage-experience-polish`。
- 已安装前端依赖：`npm --prefix frontend install`。
- 如需更新 Figma，已打开目标文件：`https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU`。

## 1. Figma 设计源验证

1. 打开 Figma 桌面或浏览器版目标文件。
2. 从插件开发入口导入 `specs/005-homepage-experience-polish/figma-plugin/manifest.json`。
3. 运行插件，确认生成页面 `Homepage Experience Polish - 005`。
4. 检查至少包含以下节点：
   - `Desktop 1440 / Cinematic Rail`
   - `Mobile 390 / Swipe Rail`
   - `Carousel States / No Thumbnail Stack`
   - `Brand Contact States`
   - `Spec Notes`
5. 将插件输出的实际 node ID 回填到 `specs/005-homepage-experience-polish/figma.md` 或后续任务记录。

期望结果：设计节点清楚表达 3 秒轮播、左右滑动、无底部缩略图堆叠、真实 logo 和联系入口状态。

## 2. 静态检查

```bash
npm --prefix frontend run test -- content-contract i18n-completeness hero-carousel sections-content hero-content
```

期望结果：

- 内容契约通过。
- 三语字段完整。
- `zh-Hant` 关键抽查不等于 `zh-Hans` 简单转换。
- 轮播不显示编号和常驻箭头。
- 联系入口为 `Contact Us` 语义。
- 页面内容不含 `feedback@busiscoming.local`。

## 3. 构建验证

```bash
npm --prefix frontend run build
```

期望结果：TypeScript 和 Vite 构建通过，无资产导入错误。

## 4. 双端浏览器验证

```bash
npm --prefix frontend run test:e2e -- hero-carousel.spec.ts homepage-hero.spec.ts homepage-sections.spec.ts
```

期望结果：

- 桌面 1440px 与手机 390px 均通过。
- 轮播约 3 秒自动切换，10 秒内至少切换 2 次。
- hover/focus/drag/touch 时暂停自动切换。
- 手动左右滑动或拖动能切换轮播内容。
- 语言切换后轮播状态不重置。

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
- 没有胶片条、缩略图按钮组或上下图片堆叠。
- 没有 `01`、`02`、`03`、`04` 编号装饰。
- 没有常驻左右箭头。
- Header/footer logo 使用真实 App 巴士主体，不含 launcher 背景底板。
- 导航为“联系我们 / Contact Us”语义。
- 页脚邮箱为 `hezhenyu966@gmail.com`。
- 手机和桌面均无文字重叠、截断或不可操作控件。

## 6. Logo 资产验证

检查 `frontend/src/assets/brand/README.md`，确认记录：

- 源文件为 Android foreground icon。
- 输出资产为透明背景。
- 不使用 launcher 背景底板。

可用 `file` 或浏览器截图确认输出图像格式和透明主体显示。

## 7. 服务端契约未漂移检查

本功能不修改服务端 HTTP API。若实现过程中触碰了共享契约或后端入口，需额外运行：

```bash
npm --prefix frontend run openapi:lint
npm --prefix frontend run openapi:routes:lint
```

期望结果：既有下载和路线查询 OpenAPI 均通过 lint。
