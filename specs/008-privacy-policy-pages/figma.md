# Figma 设计引用：隐私政策页面

**功能**：隐私政策页面  
**日期**：2026-06-30  
**目标文件**：[BusIsComing Website - Homepage v1 Spec](https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec)  
**计划页面**：`Privacy Policy Pages - 008`

## 设计状态

当前计划阶段已完成 Superpowers 可视化方案讨论，并选择“摘要卡 + 正文分节”的结构。由于本会话没有直接写入目标 Figma 文件的可用权限，本目录提供本地 Figma 插件 fallback，用于在目标文件中生成可追溯的页面和关键节点。

真实 Figma node ID 不在本文档中虚构。后续完成 Figma 认证、手工导入插件或由设计工具写入目标文件后，应在本文档补录真实节点链接。

## 关键节点

| 节点名称 | 用途 | 设计要求 |
|----------|------|----------|
| `Desktop 1440 / Privacy Policy Page` | 桌面隐私页主画板 | 1440px 宽；首屏包含标题、范围说明、4 个摘要卡；正文五章向下展开 |
| `Mobile 390 / Privacy Policy Page` | 手机隐私页主画板 | 390px 宽；摘要卡单列；正文不横向溢出；footer 入口可见 |
| `Footer Privacy Link States` | footer 入口状态 | 三语 label、默认/hover/focus 状态；不放主导航 |
| `SEO Hreflang Notes` | SEO 实现说明 | home 与 privacy 页面组分开；privacy 三语 canonical/hreflang |
| `Spec Notes` | 规格备注 | 不显示语言切换；Android 不改动；只做网站页面 |

## 视觉方向

- 整体沿用现有网站的现代、简洁、克制风格。
- 隐私页不是营销页，不使用夸张 hero 或大型装饰图。
- 首屏用清晰 H1、短范围说明、更新时间和 4 个摘要卡帮助快速理解。
- 正文使用宽度受控的阅读布局，桌面不超过舒适行长，手机单列。
- footer 隐私入口保持低干扰，但必须清晰可见、可聚焦、可访问。

## 交互状态

| 交互 | 要求 |
|------|------|
| 返回首页 | 当前语言隐私页返回当前语言首页 |
| footer 隐私链接 | 首页指向当前语言隐私页；隐私页可指向自身 |
| 语言切换 | 隐私页不显示语言切换 |
| 键盘访问 | footer 链接、返回首页链接可聚焦 |
| 响应式 | 1440px 与 390px 都需验证无文字溢出和互相遮挡 |

## 本地插件 fallback

插件目录：[figma-plugin](./figma-plugin/)

使用方式：

1. 打开目标 Figma 文件。
2. 在 Figma 桌面端选择 `Plugins` -> `Development` -> `Import plugin from manifest...`。
3. 选择 `specs/008-privacy-policy-pages/figma-plugin/manifest.json`。
4. 运行插件并点击生成页面。
5. 确认创建 `Privacy Policy Pages - 008` 页面及关键节点。
6. 手工调整视觉细节后，将真实节点链接补录到本文档或后续 plan/task 记录。

## 回填格式

完成 Figma 写入后，建议在本节追加：

```text
Figma node links:
- Desktop 1440 / Privacy Policy Page: <真实节点链接>
- Mobile 390 / Privacy Policy Page: <真实节点链接>
- Footer Privacy Link States: <真实节点链接>
- SEO Hreflang Notes: <真实节点链接>
- Spec Notes: <真实节点链接>
```

## 实现引用

后续 `speckit-tasks` 和 `speckit-implement` 应把本文档与 [contracts/privacy-policy-pages.contract.md](./contracts/privacy-policy-pages.contract.md) 一起作为前端 UI 和 SEO 验收依据。
