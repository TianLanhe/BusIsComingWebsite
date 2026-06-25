---
name: busiscoming-website-deploy
description: Deploy, verify, troubleshoot, or maintain the BusIsComming Website production deployment that uses scripts/deploy.sh and scripts/deploy-remote.sh. Use when working on this repository's SSH/Caddy/systemd deployment, Cloudflare proxied DNS deployment, production health checks, release switching, rollback, deployment logs, APK upload boundary, or build failures surfaced by the deploy script.
---

# BusIsComming Website Deploy

## Core Workflow

1. Read repository guardrails before acting:
   - `AGENTS.md`
   - `.specify/memory/constitution.md`
   - `docs/deployment.md`
   - `scripts/deploy.sh`
   - `scripts/deploy-remote.sh` when debugging remote activation, Caddy, systemd, rollback, logs, or script changes.
2. Treat `scripts/deploy.sh` as the only deployment entrypoint. Do not reimplement release packaging, SSH upload, Caddy setup, systemd setup, APK replacement, switching, rollback, or cleanup by hand unless the script is broken and the user explicitly agrees.
3. Use `references/deployment-playbook.md` for command templates, health-check expectations, Cloudflare rules, common failures, and script-change validation.
4. For commands that touch DNS, the network, SSH, SCP, the production server, package registries, or remote logs, request escalated execution. Explain the reason briefly.
5. Preserve deployment safety boundaries:
   - Do not dump full remote config or environment files; inspect only the exact key or status needed.
   - Do not use `--skip-tests`, `--allow-dirty`, `--allow-non-master`, `--skip-apk`, `switch`, or `rollback` unless the user explicitly accepts that narrower tradeoff.
   - Do not add origin-only or redirect-compatible health checks. The configured primary HTTPS URL must return 200; same-URL redirects mean the deployment or CDN configuration is unhealthy.

## Deployment Sequence

Before deploying, run lightweight local orientation:

```bash
git status --short --branch
./scripts/deploy.sh --help
```

For the current Cloudflare-proxied production domain, the normal command is:

```bash
./scripts/deploy.sh deploy --dns-mode proxied --host <server-ip> --domain <primary-domain>
```

After deploy, verify with:

```bash
./scripts/deploy.sh status --host <server-ip>
./scripts/deploy.sh list --host <server-ip>
curl -sS --max-time 15 --output /dev/null --write-out '%{http_code} %{redirect_url}\n' https://<primary-domain>/
curl -sS --max-time 15 --output /dev/null --write-out '%{http_code} %{redirect_url}\n' https://<bare-domain>/
```

Report the active version, backend/Caddy status, `main HTTPS`, `bare URL`, and any warnings from local build or remote activation.

## Script Maintenance

When editing deployment scripts or tests:

```bash
bash -n scripts/deploy.sh
bash -n scripts/deploy-remote.sh
bash -n scripts/tests/deploy_test.sh
scripts/tests/deploy_test.sh
```

Keep behavior aligned with `docs/deployment.md`. If deployment behavior changes, update docs and tests in the same change.
