<!-- SPECKIT START -->
Current plan: `specs/002-android-apk-download/plan.md`

For technologies, project structure, shell commands, validation steps, and
other feature-specific context, read the current plan above before planning,
task generation, or implementation.
<!-- SPECKIT END -->

## 项目约束

- 本项目是 BusIsComming/BusIsComing Android App 的网站主页项目。产品事实优先参考
  `/Users/jianglijie/AndroidStudioProjects/BusIsComming` 中的 `AGENTS.md`、`README.md`
  和相关产品文档。
- 先阅读 `.specify/memory/constitution.md`，并把其中的门禁视为本仓库的最高项目约束。
- 架构默认采用前后端分离；后续计划和任务必须明确前端、后端和共享契约边界。
- 网站用户可见文字必须支持 `zh-Hant`、`zh-Hans` 和 `en` 三语切换。
- Spec Kit 各阶段产物使用简体中文；代码标识符、API 名称和第三方原文保持原文。
- 网站核心范围是软件功能介绍、试用香港巴士查询、下载 App；问题反馈和联系开发者是次要功能。
- 不提供完整出行路线规划，不提供地铁、铁路、渡轮或其他非香港巴士交通工具路线查询。
- 页面和交互风格必须现代、简洁、优雅。涉及 UI 的讨论和展示必须提供图片、截图、设计稿
  或可视化 mock，不能只用文字或 ASCII 图让用户判断界面效果。
- 涉及前端页面、组件、布局或交互的 spec 必须产出 Figma UI 和交互设计，并在 feature
  文档中沉淀 Figma 文件/链接、关键节点、交互状态和版本说明，供后续 plan/tasks/implement 引用。
- 前端必须同时兼容电脑和手机展示；UI 布局、交互和内容展示设计时必须同时考虑桌面端和
  移动端，并验证核心内容和主要操作在两端都正常可用。
- 每次执行 Spec Kit skill 并通过验证后，自动执行 `git commit`；仅当提交范围、
  提交信息或无关工作区改动不清晰时再询问用户。
