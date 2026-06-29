# Figma 插件 fallback：隐私政策页面

本插件用于在目标 Figma 文件中生成 `Privacy Policy Pages - 008` 页面和关键节点，作为隐私政策页面 UI spec 的可追溯设计源。

## 使用步骤

1. 打开目标 Figma 文件：`BusIsComing Website - Homepage v1 Spec`。
2. 在 Figma 桌面端选择 `Plugins` -> `Development` -> `Import plugin from manifest...`。
3. 选择本目录的 `manifest.json`。
4. 运行 `BusIsComing Privacy Policy 008`。
5. 点击 `Create privacy policy frames`。
6. 检查生成的页面、桌面画板、手机画板、footer 状态和 SEO 说明节点。

## 生成内容

- `Privacy Policy Pages - 008`
- `Desktop 1440 / Privacy Policy Page`
- `Mobile 390 / Privacy Policy Page`
- `Footer Privacy Link States`
- `SEO Hreflang Notes`
- `Spec Notes`

## 后续处理

生成后可以手工调整字体、间距、颜色、组件引用和细节状态。完成后把真实 Figma 节点链接补录到 `../figma.md`，供 `speckit-tasks` 和实现阶段引用。
