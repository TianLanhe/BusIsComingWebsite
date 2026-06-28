# SSH + Caddy 单机部署设计

**日期**：2026-06-22

**状态**：用户已确认

**目标环境**：Ubuntu 24.04 x86_64

**主域名**：`www.busiscoming.com`

**裸域名**：`busiscoming.com`

**范围**：从本地 macOS 工作区构建前后端产物，通过 SSH 部署到单台 Ubuntu 服务器，并由 Caddy 提供 HTTPS、静态文件服务和 API 反向代理。

## 背景与目标

当前项目采用前后端分离架构：

- 前端是 React + Vite，正式部署只需要 `frontend/dist/`。
- 后端是 Go + Gin，正式部署只需要 Linux x86_64 的可执行文件。
- 后端运行时还依赖当前 Android APK 和 `current.json`，它们作为共享运行时数据独立于代码版本。
- 公网入口由 Caddy 管理，Go 后端只监听服务器本机回环地址。

本设计需要提供一个可重复执行、可回滚、可观测的单服务器部署工具。服务器不保存源码，不安装 Node.js 或 Go，不在远端构建。部署工具需要支持发布新版本、列出版本、切换历史版本、回滚、查看状态和读取日志。

## 已确认决策

1. SSH 固定使用 `root@<host>`、默认端口 `22`、OpenSSH 默认密钥或 `ssh-agent`。
2. 脚本保持严格 SSH 主机指纹校验，不使用 `StrictHostKeyChecking=no`。
3. 服务器 IP 和域名可通过命令行参数或环境变量提供，命令行参数优先。
4. SSH 连接由 root 执行，但 Go 后端以不可登录的 `busiscoming` 系统用户运行。
5. 前端只上传 `dist`，后端只上传 `go build` 产物，不上传源码。
6. `deploy` 默认同时上传当前 APK 和 `current.json`；`--skip-apk` 可跳过。
7. APK 不建立历史版本，不跟随代码 `switch` 或 `rollback` 回退。
8. 代码使用 `releases/<version>`、`current` 和 `previous` 软链接管理。
9. 代码版本目标保留 3 个；`current` 和 `previous` 永远受保护，必要时可暂时超过 3 个。
10. 后端端口固定为 `127.0.0.1:8080`，不作为部署参数暴露。
11. Caddy 同时管理 `www.busiscoming.com` 和 `busiscoming.com`，裸域名永久跳转到 `www`。
12. 部署脚本可自动安装 Caddy、创建系统用户、写入 systemd 服务和处理已启用的 UFW。
13. 已安装的 Caddy 不由部署脚本自动升级。
14. 后端部署或版本切换允许约 1–3 秒短暂中断。
15. 部署后不检查 Android APK 下载接口。
16. 本地默认要求 Git 工作区干净且当前分支为 `master`。
17. 默认执行单元测试、Go 测试、OpenAPI lint 和生产构建；Playwright E2E 不放进部署脚本。
18. 发布包采用 `tar.gz + scp` 传输，并通过 SHA-256 校验完整性。
19. 脚本采用“本地入口 + 临时远端辅助脚本”结构。
20. 所有修改远端状态的命令使用 `flock` 防止并发部署。

## 方案比较

### 方案 A：单文件 SSH heredoc

所有本地和远端逻辑都写入 `scripts/deploy.sh`，远端命令通过 SSH heredoc 执行。文件数量少，但变量、引号和错误传播难以维护，远端逻辑不易单独检查。

### 方案 B：本地入口 + 临时远端辅助脚本

`scripts/deploy.sh` 负责参数解析、本地验证、构建、打包和上传；`scripts/deploy-remote.sh` 负责远端初始化、版本切换、回滚、状态和日志。辅助脚本随命令临时上传，执行后删除，不作为远端常驻工具。

这是采用的方案。它保持用户入口简单，同时让本地和远端职责清晰、可分别验证。

### 方案 C：远端常驻部署程序

首次安装长期存在的远端部署工具，本地只发送命令。后续调用较短，但部署工具本身需要升级和版本兼容，容易与仓库脚本发生漂移，当前单机规模不值得引入。

## 文件结构

仓库新增：

```text
scripts/
├── deploy.sh
└── deploy-remote.sh
```

用户只直接执行 `scripts/deploy.sh`。远端辅助脚本是仓库内受版本控制的实现细节。

远端目录：

```text
/opt/busiscoming/
├── current -> releases/<当前版本>
├── previous -> releases/<前一版本>
├── releases/
│   └── <版本>/
│       ├── frontend/
│       │   └── dist/
│       └── backend/
│           └── busiscoming-server
└── shared/
    ├── downloads/
    │   └── android/
    │       ├── current.json
    │       └── BusIsComing.apk
    ├── env/
    │   └── backend.env
    └── deploy/
        └── config.env
```

临时上传和解压目录使用 `/opt/busiscoming/.deploy-tmp/`，每次操作使用唯一子目录，成功或失败后尽量清理。

## 命令接口

### 部署

```bash
./scripts/deploy.sh deploy
```

可选参数：

```text
--host <IP>             覆盖 BUS_DEPLOY_HOST
--domain <域名>         覆盖 BUS_DEPLOY_DOMAIN
--version <名称>        自定义发布版本名
--skip-apk              不上传 APK 和 current.json
--skip-tests            跳过单元测试、Go 测试和 OpenAPI lint
--allow-dirty           允许 Git 工作区存在未提交修改
--allow-non-master      允许从非 master 分支部署
```

`--skip-tests` 不跳过构建。TypeScript 检查、Vite build 和 Linux Go build 始终执行。

### 查看版本

```bash
./scripts/deploy.sh list
```

输出远端 release 列表，并标记 `current` 和 `previous`。

### 切换版本

```bash
./scripts/deploy.sh switch --version <版本>
```

只切换前端和 Go 二进制，不切换 APK。目标版本必须存在且目录结构完整。

### 回滚

```bash
./scripts/deploy.sh rollback
```

在 `current` 和 `previous` 之间切换。连续回滚会在两个版本之间往返。

### 查看状态

```bash
./scripts/deploy.sh status
```

显示：

- `current` 和 `previous` 指向。
- 最近代码版本。
- Caddy 和后端 systemd 状态。
- 本机 `/healthz` 状态。
- 主域名 HTTPS 状态。
- 裸域名跳转状态。

### 查看日志

```bash
./scripts/deploy.sh logs --service backend
./scripts/deploy.sh logs --service caddy --lines 300
```

`--service` 只接受 `backend` 或 `caddy`。默认显示最近 100 行，不进入持续 follow 模式。

## 配置来源与优先级

配置优先级：

```text
命令行参数 > 环境变量 > 默认值
```

支持的环境变量：

```text
BUS_DEPLOY_HOST       服务器 IP，无默认值
BUS_DEPLOY_DOMAIN     主域名，无默认值
BUS_DEPLOY_KEEP       代码版本目标保留数量，默认 3
BUS_DEPLOY_ROOT       远端根目录，默认 /opt/busiscoming
```

`--skip-apk`、`--skip-tests`、`--allow-dirty` 和 `--allow-non-master` 只允许通过命令行显式传入，避免 shell 环境残留造成误部署。

`deploy` 首次成功后把域名、裸域名、远端根目录和保留数量写入：

```text
/opt/busiscoming/shared/deploy/config.env
```

因此 `list`、`switch`、`rollback`、`status` 和 `logs` 只需要 host，不要求重复提供 domain。host 仍由本地参数或环境变量确定。

## 版本命名

默认版本名：

```text
YYYYMMDD-HHMMSS-<git短提交>
```

示例：

```text
20260622-153000-a07eaf4
```

使用 `--allow-dirty` 且工作区不干净时，自动追加：

```text
-dirty
```

`--version` 可覆盖默认名称。版本名只允许字母、数字、点、下划线和连字符，禁止路径分隔符和空白。同名远端 release 必须拒绝覆盖。

## 本地前置检查

脚本运行于 macOS，并检查以下命令：

```text
bash
ssh
scp
tar
git
npm
go
shasum
dig
```

SSH 使用默认端口 22、默认密钥发现机制和 `ssh-agent`。脚本不接收私钥路径，不写入密码，不自动接受未知或变化的主机指纹。

`deploy` 还检查：

1. 当前分支必须是 `master`，除非传入 `--allow-non-master`。
2. Git 工作区必须干净，除非传入 `--allow-dirty`。
3. `BUS_DEPLOY_HOST`、`BUS_DEPLOY_DOMAIN` 或对应命令行参数已提供。
4. 主域名必须是 `www.<裸域名>` 形式，本项目预期为 `www.busiscoming.com`。
5. DNS 模式默认为 `direct`，主域名和裸域名的 DNS A 记录都必须包含部署 host；
   Cloudflare 等代理 DNS 场景可显式使用 `proxied`，只要求两个域名有 A 记录。
6. SSH 可连接并通过严格主机指纹验证。
7. 本地前后端源目录和 APK 输入文件存在。

`direct` 模式下 DNS 不匹配时停止部署，避免把 Caddy 配置写到错误服务器或触发证书
签发失败。`proxied` 模式用于源站隐藏在 Cloudflare 等代理后的场景，仍保留域名可解析
检查，但不要求解析结果暴露源站 IP。

## 本地验证与构建

默认执行：

```bash
npm --prefix frontend ci
npm --prefix frontend test
npm --prefix frontend run openapi:lint
npm --prefix frontend run openapi:routes:lint
npm --prefix frontend run build
```

后端执行：

```bash
GOCACHE=<临时目录> go test ./...
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
  go build -trimpath -ldflags="-s -w" \
  -o <临时目录>/busiscoming-server ./cmd/server
```

Go 命令在 `backend/` 下执行。使用临时 GOCACHE 和构建目录，不写入 `backend/bin/`，也不覆盖用户现有构建产物。

`--skip-tests` 跳过：

- `npm test`
- 两个 OpenAPI lint
- `go test ./...`

但仍执行：

- `npm ci`
- TypeScript/Vite production build
- Linux x86_64 Go build

Playwright E2E 不属于部署脚本门禁，由开发流程单独运行。

## 发布包

代码发布包只包含：

```text
frontend/dist/
backend/busiscoming-server
release-manifest.txt
```

`release-manifest.txt` 至少记录：

- 发布版本名。
- Git 分支。
- Git 完整提交号。
- 工作区是否 dirty。
- 构建时间。
- 目标平台 `linux/amd64`。
- 后端二进制 SHA-256。
- 前端构建文件清单及各文件 SHA-256。

本地生成：

```text
release-<version>.tar.gz
release-<version>.tar.gz.sha256
```

发布包自身的 SHA-256 只记录在外部 `.sha256` 文件中，避免包内 manifest 自引用。上传前本地
校验 SHA-256；上传后远端使用 `sha256sum` 再校验。远端只有校验通过后才解压，并使用包内
manifest 复核后端二进制和前端构建文件。

APK 不放入代码 release。默认单独上传：

```text
BusIsComing.apk
current.json
```

以及它们各自的 SHA-256 文件。`--skip-apk` 时不生成也不上传这部分。

## APK 校验与替换

APK 输入固定来自：

```text
backend/downloads/android/BusIsComing.apk
backend/downloads/android/current.json
```

脚本不修改 `current.json`，包括其中未被后端使用的 `sourcePath`。

本地和远端都要验证：

1. `current.json` 是合法 JSON。
2. `fileName` 或 `relativePath` 最终指向的 basename 与上传 APK 文件一致。
3. 实际文件字节数等于 `sizeBytes`。
4. 实际 SHA-256 等于 `sha256`。
5. `status` 为 `available`。

远端通过 `jq` 解析 JSON。若未安装 `jq`，初始化阶段通过 APT 安装。

替换流程：

1. 上传 APK 和元数据到唯一临时目录。
2. 完成全部校验和权限设置。
3. 将现有 `shared/downloads/android` 临时改名为备份目录。
4. 将新目录原子改名为 `shared/downloads/android`。
5. 目录权限设为 `root:busiscoming 0750`，文件设为 `root:busiscoming 0640`。
6. 新目录就位后删除旧备份。
7. 后续重启后端，确保进程不保留旧 APK 内存缓存。

备份目录只存在于替换事务中，不作为历史 APK 版本。操作结束后远端只保留一份正式 APK。

代码部署失败时不回滚 APK，这是已确认的产品发布语义。

## 远端初始化

首次 `deploy` 幂等完成以下操作：

1. 检查 Ubuntu 24.04 x86_64。
2. 检查并安装 `curl`、`jq` 和必要的 APT/证书工具。
3. 若 Caddy 未安装，添加 Caddy 官方 APT repository 并安装官方 `caddy` 包。
4. 已安装 Caddy 时只验证命令和 systemd service，不自动升级。
5. 创建不可登录的 `busiscoming` 系统用户和同名组。
6. 创建远端目录并设置权限。
7. 首次生成 `ROUTE_QUERY_TOKEN_SECRET`。
8. 写入 systemd service。
9. 写入、格式检查并验证 Caddyfile。
10. 如果 UFW 已启用，允许 `OpenSSH` 和 `Caddy Full`；如果 UFW 未启用，不主动启用。
11. 检查 80/443 端口不被非 Caddy 进程占用。

若初始化失败，在修改 `current` 前退出，不影响已有代码版本。

## 后端环境变量

环境文件：

```text
/opt/busiscoming/shared/env/backend.env
```

内容：

```text
BUS_HTTP_HOST=127.0.0.1
PORT=8080
BUS_DOWNLOAD_ROOT=/opt/busiscoming/shared/downloads/android
GIN_MODE=release
ROUTE_QUERY_TOKEN_SECRET=<首次部署生成>
```

文件权限：

```text
owner: root
group: busiscoming
mode: 0640
```

首次部署用系统安全随机源生成 `ROUTE_QUERY_TOKEN_SECRET`。后续部署不覆盖、不显示、不写入日志。

## systemd 设计

服务名：

```text
busiscoming-backend.service
```

核心配置：

```ini
[Unit]
Description=BusIsComing website backend
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=busiscoming
Group=busiscoming
EnvironmentFile=/opt/busiscoming/shared/env/backend.env
WorkingDirectory=/opt/busiscoming/current/backend
ExecStart=/opt/busiscoming/current/backend/busiscoming-server
Restart=on-failure
RestartSec=3
TimeoutStartSec=30
TimeoutStopSec=15
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict

[Install]
WantedBy=multi-user.target
```

后端只需读取 release、环境变量和 APK，不需要写系统目录。stdout/stderr 由 journald 收集。

脚本写入 service 后执行 `systemctl daemon-reload` 和 `systemctl enable busiscoming-backend`。只有在有效 `current` 存在后才启动服务。

## Caddy 设计

服务器当前由本项目独占，因此脚本直接管理：

```text
/etc/caddy/Caddyfile
```

目标配置语义：

```caddyfile
busiscoming.com {
    redir https://www.busiscoming.com{uri} permanent
}

www.busiscoming.com {
    encode zstd gzip

    header {
        X-Content-Type-Options nosniff
        Referrer-Policy strict-origin-when-cross-origin
        X-Frame-Options DENY
    }

    handle /api/* {
        reverse_proxy 127.0.0.1:8080
    }

    @root path /
    redir @root /zh-hant/ permanent

    handle {
        root * /opt/busiscoming/current/frontend/dist
        # 只服务真实静态文件；未知路径返回 404，避免搜索引擎软 404。
        file_server
    }
}
```

Caddy 自动处理：

- HTTP 到 HTTPS 跳转。
- 两个域名的公开 CA 证书申请和续期。
- 静态文件服务。
- 不存在的非 API 路径返回 404，避免把随机 URL 当作首页副本。
- gzip/zstd 压缩。
- `/api/*` 反向代理。

第一版不设置 CSP，避免在未完成资源审计前误拦截图片、脚本或未来第三方资源。

Caddy 配置更新流程：

1. 生成临时 Caddyfile。
2. 执行 `caddy fmt --overwrite`。
3. 执行 `caddy validate --config <临时文件>`。
4. 保存现有 `/etc/caddy/Caddyfile` 作为本次事务备份。
5. 验证成功后原子替换 `/etc/caddy/Caddyfile`。
6. 执行 `systemctl reload caddy`。
7. reload 或上线健康检查失败时恢复旧 Caddyfile，并再次 reload。
8. 部署成功后删除配置备份。

代码 `switch` 和 `rollback` 不修改 Caddyfile，因此不需要 reload Caddy。Caddy始终读取稳定的 `/opt/busiscoming/current/frontend/dist`，软链接切换后新静态内容立即生效。

## 发布事务

`deploy` 的远端事务顺序：

1. 通过 `/var/lock/busiscoming-deploy.lock` 获取独占锁。
2. 初始化或校验远端运行环境。
3. 校验上传包 SHA-256。
4. 解压到唯一临时目录。
5. 验证前端 `index.html` 和后端可执行文件。
6. 把临时目录原子改名为 `releases/<version>`。
7. 如果需要，完成 APK 校验和替换。
8. 保存原 `current` 和原 `previous` 指向。
9. 把临时软链接原子替换为新的 `current`。
10. 重启后端。
11. Caddy 配置有变化时验证并 reload。
12. 执行健康检查。
13. 健康检查成功后，把 `previous` 更新为切换前的 `current`。
14. 健康检查成功后更新远端部署配置文件。
15. 清理旧 release、Caddy 配置备份和临时文件。
16. 释放部署锁。

`previous` 只在新版本验证成功后更新。这样失败部署不会破坏已有回滚目标。

## switch 事务

1. 获取部署锁。
2. 验证目标 release 存在且结构完整。
3. 目标不能与当前版本相同。
4. 保存原 `current` 和原 `previous`。
5. 原子切换 `current` 到目标版本。
6. 重启后端。
7. 执行健康检查。
8. 成功后把 `previous` 更新为原 `current`。
9. 失败时恢复原 `current` 和原 `previous`，重启后端并验证恢复结果。
10. 释放锁。

APK 不参与 switch。

## rollback 事务

1. 获取部署锁。
2. 验证 `current` 和 `previous` 都存在。
3. 保存两个原始指向。
4. 把 `current` 切到原 `previous`。
5. 重启后端并执行健康检查。
6. 成功后把 `previous` 切到原 `current`。
7. 失败时恢复两个原始指向，重启后端并验证恢复结果。
8. 释放锁。

APK 不参与 rollback。

## 健康检查

切换后按顺序验证：

1. `systemctl is-active busiscoming-backend` 返回 `active`。
2. `http://127.0.0.1:8080/healthz` 返回 HTTP 200。
3. `https://www.busiscoming.com/` 返回 HTTP 200。
4. `https://busiscoming.com/` 返回永久跳转，Location 指向 `https://www.busiscoming.com/`。

不检查 Android APK 下载接口。

Caddy 首次签发证书可能需要时间。脚本对 HTTPS 检查最多等待约 90 秒，使用有上限的重试和间隔，不使用 `curl --insecure`。

## 失败与恢复

### 有旧 current

任何切换后健康检查失败时：

1. 保存失败原因。
2. 恢复原 `current`。
3. 保持原 `previous` 不变。
4. 如果本次修改了 Caddyfile，恢复原 Caddyfile 并 reload。
5. 保持原远端部署配置文件不变。
6. 重启后端。
7. 重新检查 systemd、`/healthz` 和站点。
8. 保留失败 release 目录，方便排查。
9. 命令退出非零。

### 首次部署

没有旧 `current` 时无法自动回滚。脚本：

1. 保留已上传 release 和配置。
2. 输出失败阶段。
3. 输出 Caddy 和后端最近日志的查看命令。
4. 不宣告部署成功。
5. 退出非零。

用户修正 DNS、防火墙、证书或服务问题后重新执行 `deploy`。同名 release 不允许覆盖，因此重试需要使用新版本名，或先人工确认并删除未启用的失败 release。

## 版本清理

清理目标是保留最新 3 个代码 release，由 `BUS_DEPLOY_KEEP` 调整。

规则：

1. `current` 和 `previous` 永远不可删除。
2. 先按版本目录修改时间从新到旧排序。
3. 保留最新 N 个。
4. 若受保护版本不在最新 N 个中，额外保留受保护版本。
5. 因保护规则，实际数量可以暂时超过 N。
6. 失败 release 不在 `current` 或 `previous` 时，后续成功部署可按普通旧版本清理。

## 并发控制

以下命令获取远端独占锁：

- `deploy`
- `switch`
- `rollback`

锁文件：

```text
/var/lock/busiscoming-deploy.lock
```

锁已被占用时立即失败，不排队等待。只读命令 `list`、`status` 和 `logs` 不获取独占锁。

## 权限设计

推荐权限：

```text
/opt/busiscoming                    root:busiscoming 0755
/opt/busiscoming/releases           root:busiscoming 0755
release 目录和子目录                root:busiscoming 0755
后端二进制                          root:busiscoming 0755
前端静态文件                        root:busiscoming 0644
shared/downloads/android            root:busiscoming 0750
APK 和 current.json                 root:busiscoming 0640
shared/env                          root:busiscoming 0750
backend.env                         root:busiscoming 0640
shared/deploy                       root:root 0750
config.env                          root:root 0600
```

Caddy 需要读取前端 release，因此 release 路径的目录必须可遍历、静态文件必须可读。后端用户只需要读取自身二进制、环境文件和 APK。

## 日志与排障

应用不自行维护日志文件，使用 systemd journal：

```bash
journalctl -u busiscoming-backend -n 100 --no-pager
journalctl -u caddy -n 100 --no-pager
```

`logs` 子命令是上述命令的受限封装，不输出环境变量文件或部署密钥。

部署过程输出阶段名、版本名、目标 host、目标 domain 和非敏感错误。不得输出：

- SSH 私钥内容。
- `ROUTE_QUERY_TOKEN_SECRET`。
- 完整环境文件。
- 第三方 token。
- 未脱敏外部响应。

## UFW 与端口

- 公网需要 TCP 80 和 443。
- SSH 使用 TCP 22。
- 后端 8080 只监听 `127.0.0.1`，不通过 UFW 对公网开放。
- UFW 已启用时，脚本执行 `ufw allow OpenSSH` 和 `ufw allow "Caddy Full"`。
- UFW 未启用时，脚本不主动启用。
- 80/443 被非 Caddy 进程占用时停止初始化，不强制终止其他进程。

## 安全边界

- Caddy 是唯一公网入口。
- 后端不以 root 运行。
- SSH 不关闭主机指纹校验。
- 部署脚本不接收密码或私钥文件参数。
- 后端密钥只在服务器首次生成并持久化。
- systemd 使用 `NoNewPrivileges`、`PrivateTmp`、`ProtectHome` 和 `ProtectSystem=strict`。
- 发布目录由 root 写入，运行用户只读。
- 上传包必须先校验 SHA-256。
- 版本名和路径参数必须严格校验，避免路径穿越和命令注入。
- 远端辅助脚本参数通过位置参数或安全环境传递，不拼接未经校验的 shell 代码。

## 验证策略

### 脚本静态验证

- `bash -n scripts/deploy.sh`
- `bash -n scripts/deploy-remote.sh`
- 若本地安装 ShellCheck，则运行 `shellcheck`；未安装不由脚本自动安装。

### 本地构建验证

- 前端测试。
- 前端生产构建。
- 下载 OpenAPI lint。
- 路线查询 OpenAPI lint。
- Go 全量测试。
- Linux x86_64 静态二进制构建。
- 使用 `file` 确认可执行文件为 ELF 64-bit x86-64。

### 远端行为验证

- 首次初始化可重复执行。
- 新 release 原子切换。
- `list` 正确标记 current/previous。
- `switch` 成功后 previous 指向原 current。
- `rollback` 交换 current/previous。
- 健康检查失败时恢复原版本。
- 并发修改命令被 flock 拒绝。
- `--skip-apk` 不修改现有 APK。
- 默认 APK 上传后元数据、大小和 SHA-256 一致。
- 清理逻辑不删除 current/previous。
- Caddy 证书、主域名、裸域名跳转和 `/api/*` 反向代理正常。

## 实施澄清

- 本地显式依赖 `node`，用于解析和校验 Android 下载元数据 `current.json`。
- `--skip-apk` 只表示本次不上传 APK；远端必须已经存在有效的
  `shared/downloads/android/BusIsComing.apk` 和 `current.json`，不能用来初始化空服务器。
- 如果使用自定义 `BUS_DEPLOY_ROOT`，后续 `list`、`status`、`switch`、`rollback`
  和 `logs` 也必须保持同一个环境变量，因为本地脚本需要先定位远端配置所在目录。

## 非目标

本轮不包含：

- 多服务器滚动发布。
- 零停机后端切换。
- Docker 或 Kubernetes。
- CI/CD 平台集成。
- 对象存储或制品仓库。
- 数据库迁移。
- 自动升级 Caddy。
- 自动启用 UFW。
- APK 历史版本管理。
- Android APK 下载接口健康检查。
- 严格 CSP。
- SSH 非 22 端口或自定义私钥路径。
- 远端源码拉取或远端构建。

## 实施边界

实现阶段只新增部署脚本及必要的部署说明，不修改前端产品功能、后端 API 语义或 OpenAPI endpoint。现有未提交的 `frontend/vite.config.ts` 修改和 `backend/bin/` 产物不属于本设计文档提交范围，也不得被部署脚本实现提交误包含。
