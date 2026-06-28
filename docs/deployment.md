# 部署说明

本文档说明如何把 BusIsComming Website 部署到一台 Ubuntu 24.04 x86_64
服务器。部署脚本在本机完成前端打包和 Go 后端交叉编译，通过 SSH/SCP
上传不可变 release，再由远端脚本配置 Caddy、systemd、HTTPS 代理和版本链接。

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
- 公网端口：22、80、443 需要可访问；后端只监听 `127.0.0.1:8080`。
- 本机工具：`bash`、`ssh`、`scp`、`tar`、`git`、`npm`、`node`、`go`、`shasum`、
  `dig`、`file`、`mktemp`。
- 服务器运行用户：脚本会创建非 root 的 `busiscoming` 系统用户运行后端服务。
- 服务器公网入口：Caddy 独占 80/443，并反向代理 `/api/*` 到本机后端。

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

默认必须在干净的 `master` 分支部署。临时例外可显式传参：

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

## 远端结构

默认结构：

```text
/opt/busiscoming/
├── current -> releases/<version>
├── previous -> releases/<version>
├── releases/
├── shared/
│   ├── deploy/config.env
│   ├── downloads/android/
│   └── env/backend.env
└── .deploy-tmp/
```

Caddy 配置写入 `/etc/caddy/Caddyfile`，后端 systemd unit 写入
`/etc/systemd/system/busiscoming-backend.service`。
生产环境根路径 `/` 会永久重定向到 `/zh-hant/`，三语首页入口分别由
`/zh-hant/`、`/zh-hans/` 和 `/en/` 的静态 `index.html` 提供。

## 故障处理

- DNS 校验失败：`direct` 模式下确认 `www.busiscoming.com` 和 `busiscoming.com` 的
  A 记录都包含 `BUS_DEPLOY_HOST`；Cloudflare 代理场景改用
  `BUS_DEPLOY_DNS_MODE=proxied` 或 `--dns-mode proxied`。
- 80/443 被占用：脚本会拒绝覆盖非 Caddy 进程，请先手动处理占用。
- Caddy reload 失败：脚本会恢复旧 Caddyfile。
- 后端或 HTTPS 健康检查失败：脚本会恢复旧 `current/previous`，并保留失败 release
  目录用于排查。
- 并发部署：远端使用锁，同一时间只允许一个修改型命令运行。

不要把服务器环境文件、token、`ROUTE_QUERY_TOKEN_SECRET` 或完整第三方响应贴到公开日志。
