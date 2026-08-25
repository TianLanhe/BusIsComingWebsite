# 015 最终 Figma 对照记录

复核日期：2026-08-26

## 设计权威与方法

- Figma 文件：`BusIsComing Website — Homepage v1 Spec`。
- 015 FINAL Section：`136:292`；014 Section `119:64` 保持只读。
- Figma Starter MCP 无可用额度；reference 来自 Figma Desktop 本地插件与原生手动 PNG export，不宣称 MCP/API readback。
- 19 张 required reference 的真实 node ID、尺寸、SHA 与导出方式记录在 `manifest.json`；`figma-gate.md` 已在生产 UI 修改前通过。
- 批准的本地化 v1.3.1 素材已原位刷新 97 个 `App Screenshot` image fill，新增 0 个 Frame，节点 ID 和布局未改变；素材以故事/语言唯一键绑定，Story 05 只保留锁屏监控图。

## 浏览器对照

下列八组同尺寸 reference/actual 已生成 side-by-side、50% overlay、绝对 RGB diff 与 SHA 索引：

- Hero Story 01：1440×960、390×844、320×844，各含 zh-Hant 与 en；
- Download ready：1440×760 与 390×700。

本文件记录的是手机比例纠偏前的既有 Figma 复核：标题固定分行、真实 Logo、三语直达、CTA 顺序、五机环形前后层次、前景手机完整四边、故事轨位置、无下载日期和无横向滚动均已通过；中文与英文 Frame 各自显示正确语言截图。2026-08-26 浏览器实现已改为 `1080:2172` 修长比例并验证内屏上下无露底，但 Figma MCP 命中 Starter 额度上限，线上 Frame 尚未完成本次几何刷新与像素对照；不得把旧 Node ID 作为新比例已通过 Figma 的证据。素材基线更新后，45 张三语五故事 Hero golden 及 Route/Download/FAQ section golden 已固定，随后普通视觉回归未使用 `--update-snapshots` 并通过。

## 允许的实现差异

- CSS 风带是持续且响应式的真实动效，Figma 只保存静态帧，因此曲线位置不要求逐像素恒定；视觉截图会先暂停风带。
- 下载 actual 使用真实二维码与安装提示，Figma 示意块和内部注释不会进入生产 UI。
- 浏览器字体栅格化、WebP 解码与 Figma 渲染器存在亚像素差异；几何零容忍项由独立 DOM 断言保护，不用 0.3% 图片阈值掩盖裁切或溢出。
- Privacy reference 只规定本轮轻量品牌/返回 chrome；生产页面保留完整、准确的既有法律内容，不用精简 Figma 示例替换。

## 本地化声明

zh-Hant 与 en 具备真实 Figma reference 和浏览器 actual 对照。zh-Hans 共用中文截图，只完成文本、溢出、横向滚动、触控目标与关键几何验收，本文不宣称 zh-Hans 像素级 Figma 对照。
