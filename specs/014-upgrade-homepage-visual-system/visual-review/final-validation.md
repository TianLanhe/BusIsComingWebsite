# 014 最终验证记录

日期：2026-08-24

## 自动化结果

| 范围 | 命令 | 结果 |
| --- | --- | --- |
| 单元与组件 | `npm --prefix frontend run test` | 通过：50 个文件、203 个测试 |
| 公开与监控构建 | `npm --prefix frontend run build` | 通过；公开 JS 238.65 kB（gzip 79.40 kB），CSS 38.83 kB（gzip 8.72 kB） |
| 浏览器与视觉回归 | `npm --prefix frontend run test:e2e` | 通过：60 个测试；未使用 `--update-snapshots` |
| OpenAPI lint | `npm --prefix frontend run openapi:lint` | feature 与 shared 的下载、路线、监控描述全部通过 |
| OpenAPI bundle | `npm --prefix frontend run openapi:bundle` | feature 临时 bundle 与 shared bundle 全部成功 |

视觉回归在固定 Chromium 下覆盖 1440×960、390×844、320×844。三语五故事共 45 张 Hero golden，路线、下载、FAQ 共 9 张 section golden；默认差异上限为 `maxDiffPixelRatio <= 0.003`，本次普通 E2E 未修改任何 baseline。

## 边界与越界检查

- `git diff -- backend shared/contracts/openapi` 与对应状态均为空；本功能没有修改后端或 HTTP API 语义。
- Figma `119:176` 桌面 Hero 已与浏览器 Story 01 生成 side-by-side、50% overlay 和 diff，并完成人工复核。
- 浏览器人工检查覆盖桌面 1440 与手机 390 的完整首屏、五故事前后转场、手机四边、故事轨位置和三段纵向收尾。
- 私有 monitoring bundle 仍有实施前已存在的 500 kB chunk 警告；本功能未修改 monitoring 架构。

## 未完成的外部验证

- Figma Starter 额度在桌面参考图导出后耗尽，未能重新导出手机及 Route/Download/Support 状态作为逐像素直接对照；浏览器 golden 不冒充 Figma readback。
- 未启动本任务专属 Android emulator，因此没有新增 Android Chromium 真机式证据。
- 未组织新的 5 名首次访问者与 2 名独立设计者测试；现有可用性文档只记录内部检查，不冒充外部研究。
- 未执行真实网络、生产部署或生产 APK 下载验证；路线和下载 E2E 使用固定 fixture。
