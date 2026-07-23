# US5 实施报告：访客调查与三组导航

**范围**：T079–T087（012 analytics dashboard observability）

## 交付结果

- 访客页按 Figma 顺序展示首次出现、最后出现、会话、累计事件四卡；“访客偏好”只保留语言、平台、装置。事件构成、完整 22 位 ID 校验与复制反馈、返回事件明细以及 30 分钟会话时间线均保留。
- 后端访客调查继续使用完整历史计算构成、偏好、首末时间和会话；事件分页不再裁剪会话时间线。语言、装置与下载平台并列时按稳定字符串顺序决出；没有下载归因时平台为 `null`。
- `DashboardShell` 使用单一 `navGroups`，为桌面侧栏、手机抽屉和三组底栏入口提供业务监控（总览/流量与试查/下载分析）、技术监控（稳定性及延迟/系统状态）、数据明细（事件明细/访客明细）共七页路由。
- 三语更新为自然的繁中、简中、英文；语言切换不会重置调查 Visitor、日期范围或筛选。访客与性能用户可见页名分别为“访客明细 / Visitor detail”和“稳定性 & 时延 / Stability & latency”。

## TDD 证据

- RED：`limit=1` 的 Go 回归先失败，暴露旧实现只返回分页事件所属的单事件会话；访客卡顺序和三组导航的 Vitest 先失败，暴露旧的混排访客事实与两组导航。
- GREEN：后端 targeted application tests、Visitor/accessibility Vitest 与 monitor build 均通过；随后完成全量 Go、Vitest 与双 viewport Playwright 回归。

## 验证

```text
go -C backend test ./...
# passed

npm --prefix frontend test
# 42 files, 195 tests passed

npm --prefix frontend run build:monitor
# passed; only existing Vite bundle-size warning

npm --prefix frontend run test:e2e:monitor -- --grep 'preserves custom range|keeps all workspaces'
# 4 passed: desktop 1440 + mobile 390
```

视觉证据：

- `frontend/playwright-monitor/__screenshots__/visitor-v13-desktop.png`
- `frontend/playwright-monitor/__screenshots__/visitor-v13-mobile.png`

两张截图按 Figma `89:1310` 的 System & Visitor Details 和 Mobile Observability 画板核对；手机视图没有页面级横向滚动，导航与访客操作维持至少 44px 触控目标。
