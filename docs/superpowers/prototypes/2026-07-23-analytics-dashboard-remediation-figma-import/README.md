# BusIsComing Pulse v1.2 · Figma HTML 差异导入包

本目录只提供 011 修复的四张差异画板。完整工作区仍以 Figma 中已导入的 Pulse v1.1 节点
`63:2118` 和 `67:672` 为权威。

## 启动与导入

在仓库根目录执行：

```bash
python3 -m http.server 59337 --bind 127.0.0.1 \
  --directory docs/superpowers/prototypes/2026-07-23-analytics-dashboard-remediation-figma-import
```

然后按 `manifest.json` 顺序打开 URL，并使用 `html.to.design` 类 import plugin 捕获整个页面：

1. `http://127.0.0.1:59337/index.html?screen=typography`
2. `http://127.0.0.1:59337/index.html?screen=charts`
3. `http://127.0.0.1:59337/index.html?screen=workspaces`
4. `http://127.0.0.1:59337/index.html?screen=mobile`

导入到现有 Figma 文件 `BusIsComing Website - Homepage v1 Spec` 的
`Website Analytics / v1` 页面，并按 manifest 的 `frameName` 重命名为 14–17 号 Frame。

## 边界

- 画板中的数值仅为布局示例，不是产品事实。
- HTML 导入保留文本、形状和 SVG，但不会自动生成 Figma Variables、Components、Auto Layout 或原型连线。
- 导入完成后把真实节点链接写入 `specs/011-analytics-dashboard-remediation/figma.md`；不要猜测节点 ID。
- `screenshots/` 是导入前的固定尺寸视觉证据。
