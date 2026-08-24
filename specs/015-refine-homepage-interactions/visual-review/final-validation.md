# 015 最终验证记录

日期：2026-08-25

## 自动化结果

| 范围 | 命令 | 结果 |
| --- | --- | --- |
| Figma 插件合同 | 在 `docs/superpowers/prototypes/2026-08-25-homepage-refinement-figma-import` 运行 `npm test` | 通过：11 个测试 |
| 单元与组件 | `npm --prefix frontend run test` | 通过：54 个文件、217 个测试 |
| 公开与监控构建 | `npm --prefix frontend run build` | 通过；公开 JS 244.98 kB（gzip 81.13 kB），CSS 42.34 kB（gzip 9.48 kB） |
| 完整浏览器回归 | `npm --prefix frontend run test:e2e` | 通过：75 个，按项目条件跳过 3 个；未使用 `--update-snapshots` |
| 固定视觉回归 | `npx playwright test playwright/homepage-visual-regression.spec.ts` | 通过：12 个，覆盖 1440/390/320、三语五故事和三段 section |
| OpenAPI lint | `npm --prefix frontend run openapi:lint` | feature/shared 下载、路线、监控描述全部通过 |
| OpenAPI bundle | `npm --prefix frontend run openapi:bundle` | feature 临时 bundle 与 shared bundle 全部成功 |
| JSON 与证据清单 | Node JSON parse | 内容/素材 schema、素材 manifest、视觉 manifest 和 comparison manifest 全部可解析 |

## 视觉与交互证据

- Figma 015 FINAL Section 为 `136:292`；19 张 required reference 在生产 UI 修改前通过门禁。
- Hero 的 zh-Hant/en 在 1440×960、390×844、320×844 各有同尺寸 reference/actual、side-by-side、overlay、diff 与 SHA 清单。
- Download ready 的 1440×760、390×700 同样完成对照；真实二维码和安装提示属于批准的生产语义差异。
- zh-Hans 在三 viewport 和五故事上通过文本、溢出、横向滚动、44px 与关键几何验证，不宣称 Figma 像素级对照。
- E2E 覆盖标准/reduced motion、stage-first +160ms、快速 epoch、15 个语言/故事组合、双端下载三态、路线四状态、Privacy 和 resize/orientation 状态保持。
- 实现过程中额外发现并修复 844×390 FAQ 双栏溢出；1440/390/320 fixed golden 未变化。

## 范围与安全

- `git diff -- backend shared/contracts/openapi` 为空；本功能没有服务端或公开 API 语义变更。
- 因无服务端/API 变更，DDD 依赖、panic recovery、goroutine recover、日志脱敏和中文 OpenAPI 说明为 N/A；既有 lint/bundle 用作无回归证明。
- 运行时内容、受管素材 manifest、构建产物和 015 证据未写入 Android 工程或一次性截图目录的真实绝对路径；schema/test 中用于阻止泄漏的正则字面量不是运行时路径。
- 首页下载 UI 不显示日期；Privacy Policy 保留自身合法的政策更新时间，不属于下载日期。
- 无残留公开 Header、旧抽象 BrandMark/LanguageSwitcher、伪造二维码、虚假安装进度或范围外交通能力。

## 验证边界

- Figma 由 Desktop 插件和手动 PNG export 取得；MCP 无额度，未声称 API readback。
- 浏览器人工复核覆盖本机 Chromium 的桌面与手机视口；E2E 使用固定 metadata/路线 fixture，没有执行真实第三方网络、生产部署或生产 APK 下载。
- 未启动本任务专属 Android emulator，因此不宣称真实 Android 浏览器矩阵已经验证。
- 私有 monitoring bundle 仍有既有的 500 kB chunk 警告；本轮没有修改 monitoring 架构。
- 页面按用户决定不提供可见暂停按钮，不能宣称完整满足 WCAG 2.2.2 的严格解释。
