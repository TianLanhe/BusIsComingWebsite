# BusIsComing 首页视觉系统 v1.3.1 — Figma 本地导入插件

这是 `html.to.design` 和 Figma MCP 配额不可用时的一次性高保真 fallback。插件在现有 Figma
页面中创建原生变量、样式、组件和画板；只有五张真实 App 截图作为手机屏幕内的 image fill，
不会把整页扁平化成 PNG。

## 运行

1. 使用 Figma 桌面端打开
   [BusIsComing Website — Homepage v1 Spec](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec)。
2. 选择 `Plugins` → `Development` → `Import plugin from manifest…`。
3. 选择本目录的 `manifest.json`。
4. 运行 `BusIsComing Homepage Visual System v1.3.1`。
5. 点击“生成最终设计画板”。
6. 生成后定位到 `Homepage Visual System v1.3.1 — FINAL` Section。

插件不会覆盖已有节点。若发现同名 `FINAL`，只会选中并定位；若发现未完成的 `BUILDING`
Section，会停止并要求人工处理，不会自动删除用户内容。

## 本次实际交付

- 文件：[BusIsComing Website — Homepage v1 Spec](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec)
- 页面：`Homepage v1 Spec`（`0:1`）
- 最终 Section：[Homepage Visual System v1.3.1 — FINAL](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=119-64)（`119:64`）
- Section 尺寸：`7900×7200`
- 顶层节点：38
- 桌面首屏 Story 01：[`119:176`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=119-176)，`1440×960`
- 手机首屏 Story 01：[`119:461`](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec?node-id=119-461)，`390×844`

节点 ID、尺寸和画面可见性已通过 Figma 桌面端实际运行与选中状态复核。Starter MCP
调用额度已耗尽，因此本次验证没有声称完成 Figma API readback。

## 生成内容

- `00 Foundations`：获批颜色、排版、间距、手机边框材质；
- `00 Components`：原生 Button、Story Tab、Route Card；
- `01 Hero`：五故事桌面 `1440×960` 与手机 `390×844`；
- `02 Route Trial`：`idle/loading/success/empty/error/retained` 双端状态；
- `03 Download`：`checking/ready/unavailable/reduced-motion` 双端状态；
- `04 Support Ending`：FAQ、联系横条和浅色页尾；
- `05 Motion Notes`：风带、环形轮播、下载汇聚、FAQ 和 reduced motion；
- `06 Content Contract`：五故事文案、三语审校和产品事实边界。

## 构建与验证

已提交的 `dist/code.js` 可以直接运行。重新构建时，脚本默认读取本轮获批的五张原始截图；
也可通过 `BIC_FIGMA_SCREENSHOT_DIR` 指定只包含同名截图的目录：

```bash
npm run build
npm test
```

本地测试验证设计合同、禁止项、原生变量/组件 API 和 standalone 输出；Figma 桌面运行时
验证最终 Section、双端关键 Frame 尺寸和真实截图填充均可见。
