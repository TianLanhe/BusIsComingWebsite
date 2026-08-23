# 014 实现前基线

记录日期：2026-08-24

## 仓库状态

- 分支：`feat/014-upgrade-homepage-visual-system`
- 开始实现时工作树干净，没有用户或其他任务的未提交改动。

## 自动化基线

- `npm --prefix frontend run test`：未执行到测试；当前 worktree 尚未安装 `node_modules`，shell 报告 `vitest: command not found`。
- `npm --prefix frontend run build`：未执行到 TypeScript/Vite 构建；同一原因报告 `tsc: command not found`。
- 上述属于本地依赖缺失，不作为旧首页行为通过或失败的证据。安装锁定依赖后重新运行结果如下：
  - `npm --prefix frontend run test`：43 个测试文件、217 项测试全部通过；
  - `npm --prefix frontend run build`：公开前端和私有 monitoring 前端均构建通过；monitoring bundle 仍有实现前已存在的 500 kB 警告。

## 已确认的旧实现漂移

- 首页仍使用 4 个故事和 3 秒自动轮播；
- 截图使用 `stair-card-deck`、拖拽与 lightbox；
- 手机导航隐藏除“联络我们”以外的入口；
- 首页仍渲染独立 `FeatureGrid`；
- 内容和 SEO 仍大量采用 Citybus-only 定位；
- 旧截图 manifest 仍是 2026-06-25 的四组素材。

这些漂移是 014 的预期替换范围，不应通过放宽新合同继续保留。
