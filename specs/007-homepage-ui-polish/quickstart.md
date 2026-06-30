# Quickstart：首页 UI 体验优化补充验证

## 前置条件

1. 当前分支为 `codex/007-homepage-ui-polish`。
2. 已安装前端依赖。
3. 如果需要执行 Playwright，确保本机可运行 Go 后端和浏览器。

## 规格与契约检查

```bash
git status --short
rg -n "NEEDS[ ]CLARIFICATION|FEATURE[ ]NAME|ARGUMENTS|TO[ ]?DO|模板占位" specs/007-homepage-ui-polish
```

预期：

- 工作区只包含本功能相关改动或为空。
- 007 产物中没有未决澄清、模板占位或英文示例残留。

## 前端单元测试

```bash
cd frontend
npm run test -- hero-carousel.test.tsx feature-gallery.test.tsx sections-content.test.ts online-query-demo.test.tsx i18n-completeness.test.tsx content-contract.test.ts
```

预期：

- 截图区拖动只切同功能截图，文字区拖动切功能。
- 点击主截图打开大图，关闭后保持原功能和原截图。
- 手机功能介绍存在 2 列紧凑结构信号，桌面布局不变。
- 手机路线结果卡显示“车费 / 耗时 / 步行”标签和值。
- 费用相关三语文案不包含内部修改要求原句。

## 构建验证

```bash
cd frontend
npm run build
```

预期：

- TypeScript 类型检查通过。
- Vite 构建成功。
- 无新增大体积依赖或构建警告需要单独解释。

## 浏览器与 Playwright 验证

```bash
cd frontend
npm run test:e2e -- hero-carousel.spec.ts feature-gallery.spec.ts homepage-experience-polish.spec.ts homepage-sections.spec.ts online-query-demo.spec.ts
```

预期：

- `desktop-1440` 下 hero 主截图和后排堆叠图中等放大，文字区可读，无独立放大提示器。
- 点击主截图能打开大图模式，支持关闭、缩放和同功能截图切换。
- `mobile-390` 下功能介绍为 2 列紧凑卡片。
- `mobile-390` 下路线结果卡片更短，车费、耗时、步行标签和值层级清楚。
- 页面不暗示支持完整出行路线规划、港铁、铁路或渡轮。

## 手工视觉验收

1. 启动本地服务：

   ```bash
   cd frontend
   npm run dev -- --port 5184 --strictPort
   ```

2. 打开 `http://127.0.0.1:5184`。
3. 在桌面 1440px 检查：
   - hero 右侧截图组比当前版本更醒目。
   - 后排堆叠图跟随放大。
   - 没有“点击放大”提示器或悬浮图标。
   - 点击主截图打开大图。
4. 在手机 390px 检查：
   - 功能介绍区为 2 列紧凑卡片。
   - 路线结果卡片中路线号不过分粗大。
   - 车费、耗时、步行在同一紧凑指标带中显示标签和值。
5. 切换 `zh-Hant`、`zh-Hans`、`en`，检查费用文案和大图控件均有三语。

## OpenAPI 未漂移检查

本功能不修改服务端 API。实现阶段如触碰服务端或共享契约，运行：

```bash
cd frontend
npm run openapi:lint
npm run openapi:routes:lint
```

预期：

- 既有下载 API 和路线查询 API 仍通过 lint。
- 本功能不新增 OpenAPI 文件、不修改 operationId、不改变错误格式。

## Figma 验证

打开目标 Figma 文件 `BusIsComing Website - Homepage v1 Spec`，进入页面 `Homepage UI Polish - 007`，确认以下节点存在并可作为实现参考：

| 节点名称 | Node ID |
|----------|---------|
| `Desktop 1440 / Hero Medium Screenshot Deck` | `51:86` |
| `Desktop 1440 / Screenshot Lightbox` | `51:113` |
| `Mobile 390 / Compact Feature Grid` | `51:125` |
| `Mobile 390 / Compact Route Result Card` | `51:151` |
| `Interaction States / Split Gesture Zones` | `51:183` |
| `Spec Notes` | `51:194` |

如果页面或节点缺失，应直接在目标 Figma 文件中恢复或重建设计节点，并把新的节点报告同步回填到 `specs/007-homepage-ui-polish/figma.md`、内容元数据和契约。

预期：

- Figma 页面包含桌面 hero、大图模式、手机功能卡、手机路线卡、分区手势和说明节点。
- `figma.md`、内容元数据和契约中的 Node ID 与 Figma 页面一致，不能伪造或引用失效节点。

## 提交要求

Spec Kit `plan` 阶段完成并验证后，提交本次产物：

```bash
git status --short
git add AGENTS.md specs/007-homepage-ui-polish
git commit -m "plan: add homepage ui polish implementation plan"
```
