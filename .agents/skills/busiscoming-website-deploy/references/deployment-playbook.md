# BusIsComming Website Deployment Playbook

## What the deploy script does

`scripts/deploy.sh deploy` performs these phases:

1. Validate local repository, command dependencies, host/domain inputs, git branch/dirty state, version, and DNS.
2. Run local frontend tests, OpenAPI lint, backend Go tests, frontend production build, and Linux amd64 static backend build.
3. Validate APK and metadata, create release archive and checksums.
4. Upload release, remote helper, and APK artifacts to the configured SSH target via SSH/SCP.
5. Activate the remote release through `scripts/deploy-remote.sh`.
6. Verify local backend health, public HTTPS main domain, and bare-domain redirect.

The script deploys immutable code releases, but APK replacement is a separate boundary. `switch` and `rollback` only change website code, not the APK.

## Normal commands

```bash
./scripts/deploy.sh deploy --dns-mode proxied --host <server-ip> --domain <primary-domain>
./scripts/deploy.sh status --host <server-ip>
./scripts/deploy.sh list --host <server-ip>
./scripts/deploy.sh logs --host <server-ip> --service backend --lines 200
./scripts/deploy.sh logs --host <server-ip> --service caddy --lines 200
```

Use `BUS_DEPLOY_ROOT` and `BUS_DEPLOY_KEEP` only when the user confirms a non-default deployment root or retention count. Do not write real host IPs, domain names, deployment roots, tokens, or environment values into this skill; keep examples as placeholders.

## Expected production health

Public checks must be true after a healthy deploy:

```bash
curl -sS --max-time 15 --output /dev/null --write-out 'primary=%{http_code} %{redirect_url}\n' https://<primary-domain>/
curl -sS --max-time 15 --output /dev/null --write-out 'bare=%{http_code} %{redirect_url}\n' https://<bare-domain>/
```

Expected:

- The primary HTTPS URL returns `200` or `301`.
- The bare-domain HTTPS URL returns a permanent redirect to the primary HTTPS URL.
- `./scripts/deploy.sh status --host <server-ip>` prints `backend: active`, `caddy: active`, `local health: ok`, `main HTTPS: ok`, and `bare URL: ok`.

Do not bypass public HTTPS health checks with origin-only checks. Repeated redirect loops or non-200/301 primary-domain responses usually indicate an unhealthy deployment or CDN configuration. The intended Cloudflare SSL/TLS mode is `Full (strict)`.

## Preflight failures

- `Deployments must run from main or master`: switch to `main` or `master`, or ask whether `--allow-non-master` is acceptable.
- `Git worktree is dirty`: inspect `git status --short`; prefer committing or cleaning expected changes. Use `--allow-dirty` only when the user accepts a `-dirty` release version.
- `DNS A record ... does not include`: for Cloudflare proxied DNS, use `--dns-mode proxied`; for direct DNS, fix A records.
- `Required command not found`: install or configure the missing local tool before rerunning.

## Build failures

Deploy runs `npm ci`, `npm test`, OpenAPI lint, `go test ./...`, `npm run build`, and Go cross-compile. Reproduce locally with the narrowest failing command.
Inspect the current dependency versions and local config before proposing a fix. Do not preserve fixed one-off failures in this skill after the repository has moved on.

## Remote activation failures

- `Public HTTPS health check failed`: check public `www` and bare-domain curl results. Do not bypass with origin-only checks.
- `Job for caddy.service failed`: inspect `systemctl status caddy --no-pager -l` and `journalctl -u caddy -n 160 --no-pager`.
- `Local backend health check failed`: inspect `systemctl status busiscoming-backend --no-pager -l` and backend journal logs.
- Firewall profile warnings are not necessarily fatal if the services are active and public health passes. Verify service state and public health before deciding whether deployment completed.
- Stale remote deploy config, such as an old unsupported key: do not `cat` the whole config. Check only the exact key and remove only the offending line after confirming it is safe. Keep examples generic and avoid real paths or values.

## Script changes

When changing deployment behavior:

1. Update `scripts/deploy.sh`, `scripts/deploy-remote.sh`, and `scripts/tests/deploy_test.sh` together when applicable.
2. Keep option allowlists strict.
3. Keep public health checks strict: main `www` must be 200 or 301; bare domain must permanently redirect to `www`.
4. Do not introduce origin-only public health bypasses.
5. Run:

```bash
bash -n scripts/deploy.sh
bash -n scripts/deploy-remote.sh
bash -n scripts/tests/deploy_test.sh
scripts/tests/deploy_test.sh
```

If a real deploy is needed after script changes, disclose dirty/non-master status and get explicit user agreement before passing override flags.
