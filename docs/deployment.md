# 部署说明

本文档说明如何把 BusIsComing Website 部署到一台 Ubuntu 24.04 x86_64
服务器。部署脚本在本机完成前端打包和 Go 后端交叉编译，通过 SSH/SCP
上传不可变 release，再由远端脚本配置 Caddy、systemd、HTTPS 代理和版本链接。

本文档记录生产运维步骤；系统边界见 [系统架构](architecture.md)，日常本地开发见
[开发指南](development.md)。实际参数和行为以 `scripts/deploy.sh`、
`scripts/deploy-remote.sh` 及 `scripts/tests/deploy_test.sh` 为准。

## 前置条件

- 服务器系统：Ubuntu 24.04 x86_64。
- SSH：使用 `root@<server-ip>`，默认 22 端口，不支持脚本参数指定私钥或端口。
- SSH 主机指纹：脚本不会使用 `StrictHostKeyChecking=no`，首次连接前请手动确认：

```bash
ssh root@<server-ip>
```

- DNS：默认 `direct` 模式要求 `www.busiscoming.com` 和 `busiscoming.com` 的 A 记录都
  包含同一服务器 IP。若域名由 Cloudflare 等代理托管，使用 `proxied` 模式，只要求两
  个域名有 A 记录，不要求解析结果等于源站 IP。
- 公网端口：22、80、443 需要可访问；公开后端只监听 `127.0.0.1:8080`，监控端固定只监听
  `127.0.0.1:18081`。服务器启用 UFW 时，脚本会保留 OpenSSH，并显式放行 `80/tcp` 和
  `443/tcp`，不依赖 Caddy 的 UFW application profile。
- 本机工具：`bash`、`ssh`、`scp`、`tar`、`git`、`npm`、`node`、`go`、`shasum`、
  `dig`、`file`、`mktemp`。
- 服务器运行用户：脚本会创建非 root 的 `busiscoming` 系统用户运行后端服务。
- 服务器公网入口：Caddy 独占 80/443，并反向代理 `/api/*` 到本机后端。

## 部署前检查

先查看当前脚本支持的参数，不要依赖旧文档或历史命令：

```bash
./scripts/deploy.sh --help
```

默认部署只接受干净的 `main` 或 `master` 工作区。`deploy` 会先执行 `npm ci`；未传
`--skip-tests` 时，会运行前端测试、OpenAPI 契约 lint 和后端全部 Go 测试。之后无论是否
跳过测试，都会构建公开站点、私有监控前端和 Linux amd64 静态后端二进制；未传
`--skip-apk` 时还会验证 APK 交付文件。

修改部署脚本或服务器配置生成逻辑后，另行运行脚本级测试：

```bash
./scripts/tests/deploy_test.sh
```

该测试不会连接真实服务器。上线前仍需确认 DNS、SSH、服务器架构和生产环境变量。

## 首次部署

推荐把主机和域名放到环境变量，避免每次输入：

```bash
export BUS_DEPLOY_HOST=<server-ip>
export BUS_DEPLOY_DOMAIN=www.busiscoming.com

./scripts/deploy.sh deploy
./scripts/deploy.sh status
```

如果域名启用了 Cloudflare 代理：

```bash
export BUS_DEPLOY_DNS_MODE=proxied

./scripts/deploy.sh deploy
```

也可以只对单次命令传参：

```bash
./scripts/deploy.sh deploy --dns-mode proxied
```

默认部署根目录是 `/opt/busiscoming`，保留最新 3 个 release，同时保护
`current` 和 `previous`。如需自定义：

```bash
export BUS_DEPLOY_ROOT=/opt/busiscoming
export BUS_DEPLOY_KEEP=3
```

自定义 `BUS_DEPLOY_ROOT` 后，后续 `list`、`status`、`switch`、`rollback`
和 `logs` 也要继续带着同一个环境变量，否则脚本会去默认目录查找远端配置。

## 日常操作

查看版本：

```bash
./scripts/deploy.sh list
```

切换到指定版本：

```bash
./scripts/deploy.sh switch --version 20260622-153000-a07eaf4
```

回滚到 `previous`：

```bash
./scripts/deploy.sh rollback
```

查看服务状态：

```bash
./scripts/deploy.sh status
```

查看日志：

```bash
./scripts/deploy.sh logs --service backend
./scripts/deploy.sh logs --service caddy --lines 300
```

部署但不重新上传 APK：

```bash
./scripts/deploy.sh deploy --skip-apk
```

`--skip-apk` 要求服务器上已经存在有效的
`shared/downloads/android/BusIsComing.apk` 和 `current.json`。它不能用于初始化一台
完全空的服务器。

跳过本地测试但仍构建：

```bash
./scripts/deploy.sh deploy --skip-tests
```

默认必须在干净的 `main` 或 `master` 分支部署。临时例外可显式传参：

```bash
./scripts/deploy.sh deploy --allow-dirty
./scripts/deploy.sh deploy --allow-non-master
```

## APK 与回滚边界

代码 release 和 Android APK 是两个边界：

- 默认部署会上传最新 APK，并覆盖远端唯一下载版本。
- `switch` 和 `rollback` 只切换网站前端和后端代码，不回滚 APK。
- 部署健康检查失败时会恢复代码的 `current/previous`，但已经成功替换的 APK 不回滚。
- 如需避免 APK 变化，部署时使用 `--skip-apk`。

APK 元数据、缓存和人工校验要求见 [Android APK 交付](android-apk-delivery.md)。

## 远端结构

默认结构：

```text
/opt/busiscoming/
├── current -> releases/<version>
├── previous -> releases/<version>
├── releases/
├── shared/
│   ├── deploy/config.env
│   ├── analytics/
│   │   ├── analytics.sqlite
│   │   ├── analytics.sqlite-wal
│   │   └── analytics.sqlite-shm
│   ├── downloads/android/
│   └── env/backend.env
└── .deploy-tmp/
```

Caddy 配置写入 `/etc/caddy/Caddyfile`，后端 systemd unit 写入
`/etc/systemd/system/busiscoming-backend.service`。
生产环境根路径 `/` 会永久重定向到 `/zh-hant/`，三语首页入口分别由
`/zh-hant/`、`/zh-hans/` 和 `/en/` 的静态 `index.html` 提供。

每个不可变 release 同时包含 `frontend/dist`（公网主页）和 `frontend/dist-monitor`（私有
Dashboard），release manifest 会分别覆盖两套文件的 checksum。Caddy 只以 `frontend/dist`
作为静态根，不配置 `18081`、`dist-monitor`、`/api/analytics/*` 或访问日志；因此监控 HTML/API
不会经 80/443 暴露。`frontend/dist-monitor` 随代码 release 切换，而 SQLite/WAL/SHM 始终位于
`shared/analytics`，不会进入 release，也不会被 switch、rollback 或旧 release 清理触碰。

## 私有监控访问与隔离

监控端口不在 UFW 或云安全组放行。维护者先建立 SSH 隧道：

```bash
ssh -N -L 18081:127.0.0.1:18081 root@<server-ip>
```

再在本机打开 `http://127.0.0.1:18081/`。若本机 18081 已占用，可只修改本地端口：

```bash
ssh -N -L 18082:127.0.0.1:18081 root@<server-ip>
```

然后打开 `http://127.0.0.1:18082/`。不得为方便访问新增 Caddy 路由、开放 18081，或把私有
bundle 复制到公网静态目录。可在服务器用 `ss -ltnp | grep 18081` 检查监听地址必须是
`127.0.0.1:18081`，不能是 `0.0.0.0`、`[::]` 或公网地址。

systemd 继续使用 `ProtectSystem=strict`，并且只增加
`ReadWritePaths=/opt/busiscoming/shared/analytics`。目录属主/组为 `root:busiscoming`、模式 0770，
使 `busiscoming` 服务组可以创建 SQLite 数据库及 WAL/SHM 文件，同时拒绝其他用户访问；
后端环境文件会补齐下列缺失项，但绝不覆盖已存在的值：

- `BUS_ANALYTICS_DB_PATH=/opt/busiscoming/shared/analytics/analytics.sqlite`
- `BUS_ANALYTICS_UI_ROOT=/opt/busiscoming/current/frontend/dist-monitor`
- `BUS_ANALYTICS_PRIVATE_PORT=18081`
- `BUS_ANALYTICS_VISITOR_SECRET=<独立随机 secret>`
- `ANALYTICS_WRITE_TIMEOUT_MS=50`

Visitor secret 与 `ROUTE_QUERY_TOKEN_SECRET` 独立生成。环境文件和 secret 不进入 release、代码库或
公开日志。

统计数据只有 `shared/analytics` 这一份，不配置备份、恢复点、跨机复制或自动删除；数据长期保留，
但允许因磁盘/主机故障丢失。部署脚本不会复制、回滚或清理 SQLite/WAL/SHM。监控 listener、
Dashboard 或数据库不可用只记录 degraded warning，不得让公开 `/healthz`、主页、巴士试查或 APK
下载发布失败；公开服务自身或 HTTPS 健康失败仍按原流程回滚代码 release。

事件白名单、匿名访客标识和禁止记录字段见 [匿名统计与隐私边界](analytics-and-privacy.md)。

## 故障处理

- DNS 校验失败：`direct` 模式下确认 `www.busiscoming.com` 和 `busiscoming.com` 的
  A 记录都包含 `BUS_DEPLOY_HOST`；Cloudflare 代理场景改用
  `BUS_DEPLOY_DNS_MODE=proxied` 或 `--dns-mode proxied`。
- 80/443 被占用：脚本会拒绝覆盖非 Caddy 进程，请先手动处理占用。
- Caddy reload 失败：脚本会恢复旧 Caddyfile。
- 后端或 HTTPS 健康检查失败：脚本会恢复旧 `current/previous`，并保留失败 release
  目录用于排查。主域名 HTTPS 健康检查接受 `200` 或 `301`；裸域名必须永久重定向到
  主域名。后端启动轮询期间，CLI 会用 spinner 显示当前连接尝试；轮询结束后先输出固定的
  `[ok]` 或 `[failed]` 结果。只有后端、主域名 HTTPS 和裸域名跳转全部验证通过，才会输出
  `[6/6] Deployment verified`。
- 私有监控健康失败：部署输出 degraded warning，但只要公开健康检查通过就继续；通过 SSH
  隧道检查 `/api/analytics/system`、后端日志，以及 `shared/analytics` 是否为
  `root:busiscoming`、模式 `0770` 并允许 `busiscoming` 用户写入；禁止临时开放公网端口。
- 并发部署：远端使用锁，同一时间只允许一个修改型命令运行。

不要把服务器环境文件、token、`ROUTE_QUERY_TOKEN_SECRET` 或完整第三方响应贴到公开日志。

## 相关文档

- [系统架构](architecture.md)：公网/私网拓扑和部署单元。
- [开发指南](development.md)：本地启动、环境变量和通用验证命令。
- [Android APK 交付](android-apk-delivery.md)：安装包更新、完整性和回滚边界。
- [匿名统计与隐私边界](analytics-and-privacy.md)：生产数据、私有 Dashboard 和降级策略。
- [首次 SEO 提交与持续检查](seo-first-indexing.md)：上线后的静态页面和索引检查。
