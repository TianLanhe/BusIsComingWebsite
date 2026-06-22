# SSH + Caddy Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Bash deployment tool that compiles the Vite frontend and Go backend locally, uploads immutable release artifacts over SSH, and manages Caddy, systemd, HTTPS health checks, version switching, rollback, and the current Android APK on one Ubuntu 24.04 x86_64 server.

**Architecture:** `scripts/deploy.sh` is the macOS-facing CLI for validation, builds, packaging, and SSH/SCP orchestration. `scripts/deploy-remote.sh` is uploaded temporarily for each command and owns all Ubuntu-side initialization and transactional state changes. A dependency-free Bash test harness uses temporary directories and fake executables so local and remote behavior can be verified without contacting a real server.

**Tech Stack:** Bash 3.2-compatible shell, OpenSSH `ssh`/`scp`, `tar`, SHA-256 tools, npm/Vite/TypeScript, Go cross-compilation, systemd, Caddy, UFW, curl, jq.

---

## File Map

- Create `scripts/deploy.sh`: public CLI, local validation, builds, artifact creation, SSH/SCP calls.
- Create `scripts/deploy-remote.sh`: remote initialization, deploy transaction, version management, status, logs.
- Create `scripts/tests/deploy_test.sh`: dependency-free Bash test harness with temporary roots and fake commands.
- Create `docs/deployment.md`: operator-facing command reference, prerequisites, first deployment, rollback, troubleshooting.
- Modify `docs/superpowers/specs/2026-06-22-ssh-caddy-deployment-design.md`: record two implementation clarifications discovered during planning: local `node` requirement and `--skip-apk` requiring an existing valid remote APK.

Do not modify or stage the existing user changes in `frontend/vite.config.ts` or `backend/bin/`.

### Task 1: Test Harness and Local CLI Contract

**Files:**

- Create: `scripts/tests/deploy_test.sh`
- Create: `scripts/deploy.sh`

- [ ] **Step 1: Write the failing CLI tests**

Create a minimal test harness that runs each test in a subshell and records failures:

```bash
#!/usr/bin/env bash
set -u

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEPLOY_SCRIPT="$REPO_ROOT/scripts/deploy.sh"
FAILURES=0

run_test() {
  local name="$1"
  shift
  if ("$@"); then
    printf 'ok - %s\n' "$name"
  else
    printf 'not ok - %s\n' "$name" >&2
    FAILURES=$((FAILURES + 1))
  fi
}

assert_contains() {
  case "$1" in
    *"$2"*) return 0 ;;
    *) printf 'expected output to contain: %s\nactual: %s\n' "$2" "$1" >&2; return 1 ;;
  esac
}

test_help_lists_commands() {
  local output
  output="$("$DEPLOY_SCRIPT" --help)"
  assert_contains "$output" "deploy"
  assert_contains "$output" "switch"
  assert_contains "$output" "rollback"
  assert_contains "$output" "status"
  assert_contains "$output" "logs"
}

test_unknown_command_fails() {
  local output status
  output="$("$DEPLOY_SCRIPT" unknown 2>&1)"
  status=$?
  [[ $status -ne 0 ]] && assert_contains "$output" "Unknown command"
}

test_logs_requires_valid_service() {
  local output status
  output="$(BUS_DEPLOY_HOST=192.0.2.10 "$DEPLOY_SCRIPT" logs --service invalid 2>&1)"
  status=$?
  [[ $status -ne 0 ]] && assert_contains "$output" "backend or caddy"
}

run_test "help lists commands" test_help_lists_commands
run_test "unknown command fails" test_unknown_command_fails
run_test "logs validates service" test_logs_requires_valid_service

exit "$FAILURES"
```

- [ ] **Step 2: Run the tests and verify failure**

Run:

```bash
bash scripts/tests/deploy_test.sh
```

Expected: FAIL because `scripts/deploy.sh` does not exist.

- [ ] **Step 3: Implement the local CLI skeleton**

Create `scripts/deploy.sh` with Bash 3.2-compatible parsing and no associative arrays:

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REMOTE_SCRIPT="$SCRIPT_DIR/deploy-remote.sh"

COMMAND=""
HOST="${BUS_DEPLOY_HOST:-}"
DOMAIN="${BUS_DEPLOY_DOMAIN:-}"
KEEP="${BUS_DEPLOY_KEEP:-3}"
DEPLOY_ROOT="${BUS_DEPLOY_ROOT:-/opt/busiscoming}"
VERSION=""
SERVICE=""
LINES=100
SKIP_APK=0
SKIP_TESTS=0
ALLOW_DIRTY=0
ALLOW_NON_MASTER=0

usage() {
  cat <<'EOF'
Usage:
  deploy.sh deploy [--host IP] [--domain DOMAIN] [--version VERSION]
                   [--skip-apk] [--skip-tests] [--allow-dirty]
                   [--allow-non-master]
  deploy.sh list [--host IP]
  deploy.sh switch [--host IP] --version VERSION
  deploy.sh rollback [--host IP]
  deploy.sh status [--host IP]
  deploy.sh logs [--host IP] --service backend|caddy [--lines N]
EOF
}

die() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

parse_args() {
  [[ $# -gt 0 ]] || { usage; exit 1; }
  case "$1" in
    -h|--help) usage; exit 0 ;;
    deploy|list|switch|rollback|status|logs) COMMAND="$1"; shift ;;
    *) die "Unknown command: $1" ;;
  esac

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --host) [[ $# -ge 2 ]] || die "--host requires a value"; HOST="$2"; shift 2 ;;
      --domain) [[ $# -ge 2 ]] || die "--domain requires a value"; DOMAIN="$2"; shift 2 ;;
      --version) [[ $# -ge 2 ]] || die "--version requires a value"; VERSION="$2"; shift 2 ;;
      --service) [[ $# -ge 2 ]] || die "--service requires a value"; SERVICE="$2"; shift 2 ;;
      --lines) [[ $# -ge 2 ]] || die "--lines requires a value"; LINES="$2"; shift 2 ;;
      --skip-apk) SKIP_APK=1; shift ;;
      --skip-tests) SKIP_TESTS=1; shift ;;
      --allow-dirty) ALLOW_DIRTY=1; shift ;;
      --allow-non-master) ALLOW_NON_MASTER=1; shift ;;
      -h|--help) usage; exit 0 ;;
      *) die "Unknown option: $1" ;;
    esac
  done
}

validate_command_args() {
  [[ -n "$HOST" ]] || die "Server host is required via --host or BUS_DEPLOY_HOST"
  case "$COMMAND" in
    deploy) [[ -n "$DOMAIN" ]] || die "Domain is required via --domain or BUS_DEPLOY_DOMAIN" ;;
    switch) [[ -n "$VERSION" ]] || die "switch requires --version" ;;
    logs)
      case "$SERVICE" in backend|caddy) ;; *) die "--service must be backend or caddy" ;; esac
      [[ "$LINES" =~ ^[1-9][0-9]*$ ]] || die "--lines must be a positive integer"
      ;;
  esac
}

main() {
  parse_args "$@"
  validate_command_args
  die "Command implementation is not available yet: $COMMAND"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi
```

The `BASH_SOURCE` guard allows later tests to source functions without running the CLI.

- [ ] **Step 4: Run the tests and verify pass**

Run:

```bash
chmod +x scripts/deploy.sh scripts/tests/deploy_test.sh
bash scripts/tests/deploy_test.sh
```

Expected: all three tests print `ok`.

- [ ] **Step 5: Commit the CLI contract**

```bash
git add scripts/deploy.sh scripts/tests/deploy_test.sh
git commit -m "test: define deployment cli contract"
```

### Task 2: Local Validation, Build, APK Checks, and Release Packaging

**Files:**

- Modify: `scripts/deploy.sh`
- Modify: `scripts/tests/deploy_test.sh`

- [ ] **Step 1: Add failing tests for pure validation functions**

Source the script and test version names, domain derivation, environment precedence, and APK metadata:

```bash
source "$DEPLOY_SCRIPT"

test_version_validation() {
  validate_version "20260622-120000-a07eaf4"
  ! validate_version "../escape"
  ! validate_version "has space"
}

test_bare_domain_derivation() {
  validate_ipv4 "192.0.2.10"
  ! validate_ipv4 "192.0.2.999"
  validate_domain "www.busiscoming.com"
  ! validate_domain "www.busiscoming.com;id"
  [[ "$(derive_bare_domain "www.busiscoming.com")" == "busiscoming.com" ]]
  ! derive_bare_domain "api.busiscoming.com" >/dev/null 2>&1
}

test_apk_metadata_validation() {
  local temp apk json sha size
  temp="$(mktemp -d)"
  printf 'apk-data' > "$temp/BusIsComing.apk"
  sha="$(shasum -a 256 "$temp/BusIsComing.apk" | awk '{print $1}')"
  size="$(wc -c < "$temp/BusIsComing.apk" | tr -d ' ')"
  cat > "$temp/current.json" <<EOF
{"fileName":"BusIsComing.apk","relativePath":"BusIsComing.apk","sizeBytes":$size,"sha256":"$sha","status":"available"}
EOF
  validate_apk_input "$temp/BusIsComing.apk" "$temp/current.json"
}
```

Use test-only `cat` heredocs only inside the test fixture plan implementation; production repository file edits continue to use `apply_patch`.

- [ ] **Step 2: Run the tests and verify failure**

Run:

```bash
bash scripts/tests/deploy_test.sh
```

Expected: FAIL because `validate_version`, `derive_bare_domain`, and `validate_apk_input` are undefined.

- [ ] **Step 3: Implement local validation helpers**

Add:

```bash
require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

validate_version() {
  [[ "$1" =~ ^[A-Za-z0-9._-]+$ ]]
}

validate_ipv4() {
  local value="$1" part old_ifs="$IFS"
  [[ "$value" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || return 1
  IFS=.
  set -- $value
  IFS="$old_ifs"
  for part in "$@"; do
    [[ "$part" -ge 0 && "$part" -le 255 ]] || return 1
  done
}

validate_domain() {
  [[ "$1" =~ ^[A-Za-z0-9.-]+$ ]] &&
    [[ "$1" != .* && "$1" != *. && "$1" != *..* ]]
}

derive_bare_domain() {
  case "$1" in
    www.*) printf '%s\n' "${1#www.}" ;;
    *) return 1 ;;
  esac
}

json_field() {
  local file="$1" field="$2"
  node -e '
    const fs = require("fs");
    const value = JSON.parse(fs.readFileSync(process.argv[1], "utf8"))[process.argv[2]];
    if (value === undefined || value === null) process.exit(2);
    process.stdout.write(String(value));
  ' "$file" "$field"
}

validate_apk_input() {
  local apk="$1" metadata="$2" name expected_size expected_sha status actual_size actual_sha
  [[ -f "$apk" && -f "$metadata" ]] || return 1
  name="$(json_field "$metadata" relativePath 2>/dev/null || json_field "$metadata" fileName)"
  expected_size="$(json_field "$metadata" sizeBytes)"
  expected_sha="$(json_field "$metadata" sha256)"
  status="$(json_field "$metadata" status)"
  actual_size="$(wc -c < "$apk" | tr -d ' ')"
  actual_sha="$(shasum -a 256 "$apk" | awk '{print $1}')"
  [[ "$(basename "$name")" == "$(basename "$apk")" ]]
  [[ "$expected_size" == "$actual_size" ]]
  [[ "$expected_sha" == "$actual_sha" ]]
  [[ "$status" == "available" ]]
}
```

Add preflight checks for `bash`, `ssh`, `scp`, `tar`, `git`, `npm`, `node`, `go`, `shasum`, `dig`, `file`, and `mktemp`.

Add `git_preflight`:

```bash
git_preflight() {
  local branch dirty
  branch="$(git -C "$REPO_ROOT" branch --show-current)"
  dirty="$(git -C "$REPO_ROOT" status --porcelain)"
  if [[ "$branch" != "master" && "$ALLOW_NON_MASTER" -ne 1 ]]; then
    die "Deployments must run from master; current branch: $branch"
  fi
  if [[ -n "$dirty" && "$ALLOW_DIRTY" -ne 1 ]]; then
    die "Git worktree is dirty; commit changes or pass --allow-dirty"
  fi
}
```

- [ ] **Step 4: Implement DNS validation and version generation**

```bash
validate_dns() {
  local bare resolved
  bare="$(derive_bare_domain "$DOMAIN")" || die "Domain must start with www."
  for name in "$DOMAIN" "$bare"; do
    resolved="$(dig +short A "$name")"
    printf '%s\n' "$resolved" | grep -Fx "$HOST" >/dev/null ||
      die "DNS A record for $name does not include $HOST"
  done
}

default_version() {
  local stamp commit dirty_suffix=""
  stamp="$(date '+%Y%m%d-%H%M%S')"
  commit="$(git -C "$REPO_ROOT" rev-parse --short=7 HEAD)"
  if [[ -n "$(git -C "$REPO_ROOT" status --porcelain)" ]]; then
    dirty_suffix="-dirty"
  fi
  printf '%s-%s%s\n' "$stamp" "$commit" "$dirty_suffix"
}
```

After resolving either a default or custom version, append `-dirty` whenever the worktree is dirty and the name does not already end with `-dirty`. This keeps custom versions honest under `--allow-dirty`:

```bash
mark_dirty_version() {
  local value="$1"
  if [[ -n "$(git -C "$REPO_ROOT" status --porcelain)" && "$value" != *-dirty ]]; then
    printf '%s-dirty\n' "$value"
  else
    printf '%s\n' "$value"
  fi
}
```

- [ ] **Step 5: Implement local verification and builds**

Use a temporary build root and never write `backend/bin/`:

```bash
run_local_build() {
  BUILD_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/busiscoming-deploy.XXXXXX")"
  trap 'rm -rf "$BUILD_ROOT"' EXIT INT TERM

  npm --prefix "$REPO_ROOT/frontend" ci
  if [[ "$SKIP_TESTS" -ne 1 ]]; then
    npm --prefix "$REPO_ROOT/frontend" test
    npm --prefix "$REPO_ROOT/frontend" run openapi:lint
    npm --prefix "$REPO_ROOT/frontend" run openapi:routes:lint
    (
      cd "$REPO_ROOT/backend"
      GOCACHE="$BUILD_ROOT/go-cache" go test ./...
    )
  fi
  npm --prefix "$REPO_ROOT/frontend" run build
  (
    cd "$REPO_ROOT/backend"
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
      GOCACHE="$BUILD_ROOT/go-cache" \
      go build -trimpath -ldflags="-s -w" \
      -o "$BUILD_ROOT/busiscoming-server" ./cmd/server
  )
  file "$BUILD_ROOT/busiscoming-server" | grep -E 'ELF 64-bit.*x86-64' >/dev/null ||
    die "Go build did not produce a Linux x86_64 binary"
}
```

- [ ] **Step 6: Implement manifest and archive creation**

Create an immutable staging tree:

```bash
create_release_archive() {
  local stage="$BUILD_ROOT/release"
  mkdir -p "$stage/frontend" "$stage/backend"
  cp -R "$REPO_ROOT/frontend/dist" "$stage/frontend/dist"
  cp "$BUILD_ROOT/busiscoming-server" "$stage/backend/busiscoming-server"
  chmod 0755 "$stage/backend/busiscoming-server"

  {
    printf 'version=%s\n' "$VERSION"
    printf 'branch=%s\n' "$(git -C "$REPO_ROOT" branch --show-current)"
    printf 'commit=%s\n' "$(git -C "$REPO_ROOT" rev-parse HEAD)"
    printf 'dirty=%s\n' "$([[ -n "$(git -C "$REPO_ROOT" status --porcelain)" ]] && printf true || printf false)"
    printf 'built_at=%s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    printf 'target=linux/amd64\n'
    printf 'backend_sha256=%s\n' "$(shasum -a 256 "$stage/backend/busiscoming-server" | awk '{print $1}')"
  } > "$stage/release-manifest.txt"

  (
    cd "$stage"
    find frontend/dist -type f -print |
      LC_ALL=C sort |
      while IFS= read -r file; do
        shasum -a 256 "$file"
      done >> release-manifest.txt
  )

  ARCHIVE="$BUILD_ROOT/release-$VERSION.tar.gz"
  tar -C "$stage" -czf "$ARCHIVE" .
  printf '%s  %s\n' \
    "$(shasum -a 256 "$ARCHIVE" | awk '{print $1}')" \
    "$(basename "$ARCHIVE")" > "$ARCHIVE.sha256"
}
```

When `SKIP_APK=0`, copy the validated APK files into `$BUILD_ROOT/apk/` and produce SHA files. When `SKIP_APK=1`, do not require local APK inputs.

- [ ] **Step 7: Run tests and local dry build**

Run:

```bash
bash scripts/tests/deploy_test.sh
bash -n scripts/deploy.sh
```

Expected: all tests PASS and syntax check exits zero.

Do not run a real deploy yet.

- [ ] **Step 8: Commit local build and packaging**

```bash
git add scripts/deploy.sh scripts/tests/deploy_test.sh
git commit -m "feat: build deployment release artifacts"
```

### Task 3: Remote Script Foundation and Read-Only Commands

**Files:**

- Create: `scripts/deploy-remote.sh`
- Modify: `scripts/tests/deploy_test.sh`

- [ ] **Step 1: Add failing remote list and argument tests**

Create a temporary release tree:

```bash
test_remote_list_marks_current_and_previous() {
  local temp output
  temp="$(mktemp -d)"
  mkdir -p "$temp/releases/v1" "$temp/releases/v2"
  ln -s "$temp/releases/v2" "$temp/current"
  ln -s "$temp/releases/v1" "$temp/previous"
  output="$(BUS_DEPLOY_TEST_MODE=1 "$REMOTE_SCRIPT" list --root "$temp")"
  assert_contains "$output" "v2 [current]"
  assert_contains "$output" "v1 [previous]"
}

test_remote_logs_rejects_invalid_service() {
  ! BUS_DEPLOY_TEST_MODE=1 "$REMOTE_SCRIPT" logs --root "$(mktemp -d)" \
    --service invalid >/dev/null 2>&1
}
```

- [ ] **Step 2: Run tests and verify failure**

Expected: FAIL because `scripts/deploy-remote.sh` does not exist.

- [ ] **Step 3: Implement remote argument parsing and path safety**

Create:

```bash
#!/usr/bin/env bash
set -euo pipefail

COMMAND="${1:-}"
[[ -n "$COMMAND" ]] || { printf 'remote command required\n' >&2; exit 1; }
shift

ROOT="/opt/busiscoming"
DOMAIN=""
BARE_DOMAIN=""
KEEP=3
VERSION=""
ARCHIVE=""
ARCHIVE_SHA=""
APK_DIR=""
SERVICE=""
LINES=100
TEST_MODE="${BUS_DEPLOY_TEST_MODE:-0}"

die() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

validate_root() {
  [[ "$ROOT" == /* ]] || die "Deployment root must be absolute"
  [[ "$ROOT" =~ ^/[A-Za-z0-9._/-]+$ ]] || die "Deployment root contains unsafe characters"
  case "$ROOT" in
    /|/etc|/usr|/var|/home|/root) die "Unsafe deployment root: $ROOT" ;;
  esac
}

validate_version() {
  [[ "$1" =~ ^[A-Za-z0-9._-]+$ ]] || die "Invalid version: $1"
}
```

Parse only the explicit options required by the remote command. Reject unknown options and non-positive `KEEP` or `LINES`.

- [ ] **Step 4: Implement `list`, `status`, and `logs`**

All managed symlinks point directly to absolute release paths, so use portable `readlink` plus `basename` instead of GNU-only `readlink -f`:

```bash
version_from_link() {
  local link="$1" target
  [[ -L "$link" ]] || return 0
  target="$(readlink "$link")"
  basename "$target"
}

command_list() {
  local current previous release name marker
  current="$(version_from_link "$ROOT/current")"
  previous="$(version_from_link "$ROOT/previous")"
  [[ -d "$ROOT/releases" ]] || return 0
  for release in "$ROOT"/releases/*; do
    [[ -d "$release" ]] || continue
    name="$(basename "$release")"
    marker=""
    [[ "$name" == "$current" ]] && marker="$marker [current]"
    [[ "$name" == "$previous" ]] && marker="$marker [previous]"
    printf '%s%s\n' "$name" "$marker"
  done
}
```

`status` loads `$ROOT/shared/deploy/config.env` when present, prints symlink state, invokes `systemctl is-active`, checks local health with curl, then checks the configured domains. In test mode it skips network checks unless fake commands are present on `PATH`.

`logs` maps `backend` to `busiscoming-backend` and `caddy` to `caddy`, then executes:

```bash
journalctl -u "$unit" -n "$LINES" --no-pager
```

- [ ] **Step 5: Run tests and syntax checks**

```bash
chmod +x scripts/deploy-remote.sh
bash scripts/tests/deploy_test.sh
bash -n scripts/deploy-remote.sh
```

Expected: PASS.

- [ ] **Step 6: Commit remote read-only commands**

```bash
git add scripts/deploy-remote.sh scripts/tests/deploy_test.sh
git commit -m "feat: add remote deployment inspection commands"
```

### Task 4: Remote Initialization, systemd, Caddy, Environment, and UFW

**Files:**

- Modify: `scripts/deploy-remote.sh`
- Modify: `scripts/tests/deploy_test.sh`

- [ ] **Step 1: Add failing template tests**

Use test roots instead of `/etc`:

```bash
test_remote_renders_systemd_and_caddy() {
  local temp
  temp="$(mktemp -d)"
  BUS_DEPLOY_TEST_MODE=1 BUS_DEPLOY_ETC_ROOT="$temp/etc" \
    "$REMOTE_SCRIPT" render-config \
      --root "$temp/opt/busiscoming" \
      --domain www.busiscoming.com \
      --bare-domain busiscoming.com
  grep -F "User=busiscoming" "$temp/etc/systemd/system/busiscoming-backend.service"
  grep -F "reverse_proxy 127.0.0.1:8080" "$temp/etc/caddy/Caddyfile"
  grep -F "redir https://www.busiscoming.com{uri} permanent" "$temp/etc/caddy/Caddyfile"
}
```

`render-config` is a test-only command accepted only when `BUS_DEPLOY_TEST_MODE=1`.

- [ ] **Step 2: Run tests and verify failure**

Expected: FAIL because render functions are missing.

- [ ] **Step 3: Implement directory and user initialization**

Add:

```bash
ensure_runtime_user() {
  if ! id busiscoming >/dev/null 2>&1; then
    useradd --system --home-dir /nonexistent --shell /usr/sbin/nologin busiscoming
  fi
}

ensure_directories() {
  install -d -o root -g busiscoming -m 0755 "$ROOT" "$ROOT/releases"
  install -d -o root -g busiscoming -m 0750 \
    "$ROOT/shared/downloads" "$ROOT/shared/env"
  install -d -o root -g root -m 0750 "$ROOT/shared/deploy"
  install -d -o root -g root -m 0700 "$ROOT/.deploy-tmp"
}
```

Skip `useradd` in test mode.

- [ ] **Step 4: Implement runtime dependencies and Caddy installation**

Always ensure the remote runtime dependencies are present:

```bash
install_runtime_dependencies() {
  apt-get update
  apt-get install -y ca-certificates debian-keyring debian-archive-keyring \
    apt-transport-https curl gnupg jq openssl util-linux iproute2
}
```

Only add the official repository and install Caddy when `command -v caddy` fails:

```bash
install_caddy_if_missing() {
  command -v caddy >/dev/null 2>&1 && return 0
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key |
    gpg --batch --yes --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt \
    -o /etc/apt/sources.list.d/caddy-stable.list
  chmod 0644 /usr/share/keyrings/caddy-stable-archive-keyring.gpg \
    /etc/apt/sources.list.d/caddy-stable.list
  apt-get update
  apt-get install -y caddy
}
```

Do not run either package installation function in test mode.

- [ ] **Step 5: Render backend environment and systemd**

Generate the secret only when the env file does not exist:

```bash
ensure_backend_env() {
  local env_dir="$ROOT/shared/env" env_file="$env_dir/backend.env" secret
  [[ -f "$env_file" ]] && return 0
  secret="$(openssl rand -hex 32)"
  {
    printf 'BUS_HTTP_HOST=127.0.0.1\n'
    printf 'PORT=8080\n'
    printf 'BUS_DOWNLOAD_ROOT=%s/shared/downloads/android\n' "$ROOT"
    printf 'GIN_MODE=release\n'
    printf 'ROUTE_QUERY_TOKEN_SECRET=%s\n' "$secret"
  } > "$env_file"
  chown root:busiscoming "$env_file"
  chmod 0640 "$env_file"
}
```

Render the service exactly as approved in the design, using `ROOT` in `WorkingDirectory`, `ExecStart`, and `EnvironmentFile`. In production write to `/etc/systemd/system/busiscoming-backend.service`; in tests prefix with `BUS_DEPLOY_ETC_ROOT`.

```bash
render_systemd_service() {
  local etc_root="${BUS_DEPLOY_ETC_ROOT:-}" service_dir service_file candidate
  service_dir="${etc_root}/etc/systemd/system"
  service_file="$service_dir/busiscoming-backend.service"
  candidate="${service_file}.new.$$"
  install -d -m 0755 "$service_dir"
  {
    printf '[Unit]\n'
    printf 'Description=BusIsComing website backend\n'
    printf 'Wants=network-online.target\n'
    printf 'After=network-online.target\n\n'
    printf '[Service]\n'
    printf 'Type=simple\n'
    printf 'User=busiscoming\n'
    printf 'Group=busiscoming\n'
    printf 'EnvironmentFile=%s/shared/env/backend.env\n' "$ROOT"
    printf 'WorkingDirectory=%s/current/backend\n' "$ROOT"
    printf 'ExecStart=%s/current/backend/busiscoming-server\n' "$ROOT"
    printf 'Restart=on-failure\n'
    printf 'RestartSec=3\n'
    printf 'TimeoutStartSec=30\n'
    printf 'TimeoutStopSec=15\n'
    printf 'NoNewPrivileges=true\n'
    printf 'PrivateTmp=true\n'
    printf 'ProtectHome=true\n'
    printf 'ProtectSystem=strict\n\n'
    printf '[Install]\n'
    printf 'WantedBy=multi-user.target\n'
  } > "$candidate"
  chmod 0644 "$candidate"
  mv -f "$candidate" "$service_file"
}
```

- [ ] **Step 6: Render and transactionally install Caddyfile**

Render the approved two-site Caddy configuration:

```bash
render_caddyfile() {
  local output="$1"
  {
    printf '%s {\n' "$BARE_DOMAIN"
    printf '    redir https://%s{uri} permanent\n' "$DOMAIN"
    printf '}\n\n'
    printf '%s {\n' "$DOMAIN"
    printf '    encode zstd gzip\n\n'
    printf '    header {\n'
    printf '        X-Content-Type-Options nosniff\n'
    printf '        Referrer-Policy strict-origin-when-cross-origin\n'
    printf '        X-Frame-Options DENY\n'
    printf '    }\n\n'
    printf '    handle /api/* {\n'
    printf '        reverse_proxy 127.0.0.1:8080\n'
    printf '    }\n\n'
    printf '    handle {\n'
    printf '        root * %s/current/frontend/dist\n' "$ROOT"
    printf '        try_files {path} /index.html\n'
    printf '        file_server\n'
    printf '    }\n'
    printf '}\n'
  } > "$output"
}
```

Validate with:

```bash
caddy fmt --overwrite "$candidate"
caddy validate --config "$candidate"
```

Back up the old Caddyfile before replacement. On reload failure, restore and reload the old config. In test mode, write files but skip reload.

- [ ] **Step 7: Implement UFW and port checks**

If `ufw status` reports active:

```bash
ufw allow OpenSSH
ufw allow "Caddy Full"
```

If inactive, make no change. Before first Caddy start, use `ss -ltnp` to reject non-Caddy listeners on 80 or 443. Never terminate another process.

- [ ] **Step 8: Run tests and commit**

```bash
bash scripts/tests/deploy_test.sh
bash -n scripts/deploy-remote.sh
git add scripts/deploy-remote.sh scripts/tests/deploy_test.sh
git commit -m "feat: initialize caddy and backend service"
```

### Task 5: Remote Deploy Transaction and APK Replacement

**Files:**

- Modify: `scripts/deploy-remote.sh`
- Modify: `scripts/tests/deploy_test.sh`

- [ ] **Step 1: Add a failing first-deploy transaction test**

Build a fixture archive with:

```text
frontend/dist/index.html
backend/busiscoming-server
release-manifest.txt
```

Run:

```bash
BUS_DEPLOY_TEST_MODE=1 \
  "$REMOTE_SCRIPT" deploy \
    --root "$temp/root" \
    --domain www.busiscoming.com \
    --bare-domain busiscoming.com \
    --keep 3 \
    --version v1 \
    --archive "$temp/release-v1.tar.gz" \
    --archive-sha "$temp/release-v1.tar.gz.sha256" \
    --apk-dir "$temp/apk"
```

Assert:

```bash
[[ "$(basename "$(readlink "$temp/root/current")")" == "v1" ]]
[[ -f "$temp/root/releases/v1/frontend/dist/index.html" ]]
[[ -x "$temp/root/releases/v1/backend/busiscoming-server" ]]
[[ -f "$temp/root/shared/downloads/android/BusIsComing.apk" ]]
[[ ! -e "$temp/root/previous" ]]
```

- [ ] **Step 2: Run test and verify failure**

Expected: FAIL because deploy transaction is missing.

- [ ] **Step 3: Implement lock, archive validation, and release installation**

Use non-blocking flock:

```bash
acquire_lock() {
  if [[ "$TEST_MODE" == "1" ]]; then
    mkdir "$ROOT/.deploy-test-lock" 2>/dev/null ||
      die "Another deployment operation is already running"
    trap 'rmdir "$ROOT/.deploy-test-lock" 2>/dev/null || true' EXIT
    return
  fi
  exec 9>/var/lock/busiscoming-deploy.lock
  flock -n 9 || die "Another deployment operation is already running"
}
```

The test-mode directory lock avoids requiring `flock` on macOS while preserving non-blocking behavior.

Add a portable checksum helper so remote tests can run on macOS while Ubuntu uses `sha256sum`:

```bash
verify_sha_file() {
  local directory="$1" checksum_file="$2"
  if command -v sha256sum >/dev/null 2>&1; then
    (cd "$directory" && sha256sum -c "$checksum_file")
  else
    (cd "$directory" && shasum -a 256 -c "$checksum_file")
  fi
}

verify_sha_file "$(dirname "$ARCHIVE")" "$(basename "$ARCHIVE_SHA")"
tar -tzf "$ARCHIVE" >/dev/null

while IFS= read -r entry; do
  case "$entry" in
    /*|../*|*/../*|*/..) die "Archive contains unsafe path: $entry" ;;
  esac
done < <(tar -tzf "$ARCHIVE")
```

Reject archives containing absolute paths or `..` components before extraction. Extract into `$ROOT/.deploy-tmp/<version>.<pid>`, verify required files and executable mode, then atomically rename to `$ROOT/releases/$VERSION`. Refuse existing version directories.

Normalize release ownership and permissions before activation:

```bash
chown -R root:busiscoming "$candidate"
find "$candidate" -type d -exec chmod 0755 {} +
find "$candidate/frontend/dist" -type f -exec chmod 0644 {} +
chmod 0644 "$candidate/release-manifest.txt"
chmod 0755 "$candidate/backend/busiscoming-server"
```

In test mode, skip `chown` but still normalize modes.

- [ ] **Step 4: Implement manifest verification**

Read `backend_sha256` from `release-manifest.txt` and verify the binary. For each frontend checksum line, run `sha256sum -c` from the release root. Reject missing `frontend/dist/index.html`.

- [ ] **Step 5: Implement APK validation and replacement**

Remote validation uses jq:

```bash
apk_name="$(jq -r '.relativePath // .fileName' "$APK_DIR/current.json")"
expected_size="$(jq -r '.sizeBytes' "$APK_DIR/current.json")"
expected_sha="$(jq -r '.sha256' "$APK_DIR/current.json")"
status="$(jq -r '.status' "$APK_DIR/current.json")"
```

Require basename match, byte count match, SHA match, and `available` status. Set permissions before replacing. Rename the old directory to a unique backup, rename the new directory into place, and delete the backup only after success. A trap restores the backup if the second rename fails.

If no APK directory was uploaded, validate that the existing remote APK directory is complete; fail first deployment with `--skip-apk` when no valid APK exists.

- [ ] **Step 6: Implement current/previous pointer helpers**

```bash
atomic_link() {
  local target="$1" link="$2" temp_link="${link}.new.$$"
  ln -s "$target" "$temp_link"
  if [[ "$TEST_MODE" == "1" ]]; then
    rm -f "$link"
    mv "$temp_link" "$link"
  else
    mv -Tf "$temp_link" "$link"
  fi
}
```

The production branch runs only on Ubuntu and uses GNU `mv -T` for atomic replacement. The macOS test branch replaces links inside an isolated temporary directory and is not used for production deployment.

On first deploy, set `current` only. On later deploy, preserve original pointer values but do not update `previous` until health checks pass.

- [ ] **Step 7: Implement service restart and health checks**

Production checks:

```bash
systemctl restart busiscoming-backend
systemctl is-active --quiet busiscoming-backend
curl --fail --silent --show-error --max-time 5 http://127.0.0.1:8080/healthz >/dev/null
```

Retry public HTTPS for up to 90 seconds. Verify main domain HTTP 200. Verify bare domain returns 301 or 308 and an exact `Location` under `https://$DOMAIN`.

In test mode, call fake `systemctl` and `curl` from `PATH`.

- [ ] **Step 8: Persist successful deployment configuration**

Only after all health checks pass, atomically write:

```bash
write_deploy_config() {
  local config_dir="$ROOT/shared/deploy"
  local config_file="$config_dir/config.env"
  local candidate="${config_file}.new.$$"
  {
    printf 'DOMAIN=%s\n' "$DOMAIN"
    printf 'BARE_DOMAIN=%s\n' "$BARE_DOMAIN"
    printf 'DEPLOY_ROOT=%s\n' "$ROOT"
    printf 'KEEP=%s\n' "$KEEP"
  } > "$candidate"
  chmod 0600 "$candidate"
  mv -f "$candidate" "$config_file"
}
```

Domain, root, and keep values must pass strict validation before this function runs, so the file is safe to source. Failed deployments leave the old config untouched.

- [ ] **Step 9: Implement failure restoration**

If checks fail:

- restore original `current`;
- leave original `previous` unchanged;
- restore the prior Caddyfile if this deploy changed it;
- restart the old backend when an old current existed;
- leave failed release installed;
- exit non-zero.

Do not restore the APK.

- [ ] **Step 10: Run transaction tests and commit**

Add a second test with fake health failure and assert that `current` returns to v1 while failed v2 remains in `releases/`.

Run:

```bash
bash scripts/tests/deploy_test.sh
bash -n scripts/deploy-remote.sh
git add scripts/deploy-remote.sh scripts/tests/deploy_test.sh
git commit -m "feat: deploy releases transactionally"
```

### Task 6: Version Switching, Rollback, and Cleanup

**Files:**

- Modify: `scripts/deploy-remote.sh`
- Modify: `scripts/tests/deploy_test.sh`

- [ ] **Step 1: Add failing switch and rollback tests**

Prepare v1, v2, and v3 release fixtures. Assert:

```bash
BUS_DEPLOY_TEST_MODE=1 "$REMOTE_SCRIPT" switch --root "$root" \
  --version v2 --domain www.busiscoming.com --bare-domain busiscoming.com
[[ "$(version_from_test_link "$root/current")" == "v2" ]]
[[ "$(version_from_test_link "$root/previous")" == "v1" ]]

BUS_DEPLOY_TEST_MODE=1 "$REMOTE_SCRIPT" rollback --root "$root" \
  --domain www.busiscoming.com --bare-domain busiscoming.com
[[ "$(version_from_test_link "$root/current")" == "v1" ]]
[[ "$(version_from_test_link "$root/previous")" == "v2" ]]
```

- [ ] **Step 2: Run tests and verify failure**

Expected: FAIL because switch and rollback are not implemented.

- [ ] **Step 3: Implement `switch`**

Validate target structure, capture original links, atomically update current, restart, check health, then update previous to original current. On failure restore both original links and restart.

- [ ] **Step 4: Implement `rollback`**

Require both links. Swap only after target health succeeds. If it fails, restore both links exactly.

- [ ] **Step 5: Implement protected release cleanup**

List releases by mtime descending. Protect:

- current target;
- previous target;
- newest `KEEP` directories.

Delete only unprotected directories after successful deploy. Never clean during failed deploy, switch, or rollback.

- [ ] **Step 6: Add cleanup tests**

Create five releases with controlled mtimes, with current pointing to old v1 and previous to v2. With keep 3, assert v1, v2, and the latest three all remain even when total exceeds three.

- [ ] **Step 7: Run tests and commit**

```bash
bash scripts/tests/deploy_test.sh
bash -n scripts/deploy-remote.sh
git add scripts/deploy-remote.sh scripts/tests/deploy_test.sh
git commit -m "feat: manage deployment versions and rollback"
```

### Task 7: SSH/SCP Orchestration in the Local CLI

**Files:**

- Modify: `scripts/deploy.sh`
- Modify: `scripts/tests/deploy_test.sh`

- [ ] **Step 1: Add failing fake SSH/SCP tests**

Create fake commands in a temporary `bin` directory that append arguments to log files. Run:

```bash
PATH="$fake_bin:$PATH" \
BUS_DEPLOY_HOST=192.0.2.10 \
BUS_DEPLOY_DOMAIN=www.busiscoming.com \
BUS_DEPLOY_TEST_MODE=1 \
  "$DEPLOY_SCRIPT" status
```

Assert:

- destination is `root@192.0.2.10`;
- no argument contains `StrictHostKeyChecking=no`;
- remote helper is uploaded before execution;
- `status` does not run local builds.

For deploy orchestration, use `BUS_DEPLOY_TEST_MODE=1` to replace build output with a prepared fixture while still testing upload ordering and remote arguments.

- [ ] **Step 2: Run tests and verify failure**

Expected: FAIL because SSH orchestration is missing.

- [ ] **Step 3: Implement temporary remote workspace handling**

Use:

```bash
REMOTE_TEMP="/tmp/busiscoming-deploy-$(date +%s)-$$"
SSH_TARGET="root@$HOST"

remote_cleanup() {
  ssh "$SSH_TARGET" rm -rf -- "$REMOTE_TEMP" >/dev/null 2>&1 || true
}
trap remote_cleanup EXIT INT TERM
```

Create the remote temp directory with SSH, upload `deploy-remote.sh`, chmod it remotely, and execute it with validated positional arguments. Do not pass secrets.

- [ ] **Step 4: Implement deploy transport**

Upload:

- release archive;
- release archive SHA file;
- remote helper;
- optional APK directory files and SHA files.

Invoke:

```bash
ssh "$SSH_TARGET" "$REMOTE_TEMP/deploy-remote.sh" deploy \
  --root "$DEPLOY_ROOT" \
  --domain "$DOMAIN" \
  --bare-domain "$BARE_DOMAIN" \
  --keep "$KEEP" \
  --version "$VERSION" \
  --archive "$REMOTE_TEMP/$(basename "$ARCHIVE")" \
  --archive-sha "$REMOTE_TEMP/$(basename "$ARCHIVE").sha256"
```

Append `--apk-dir "$REMOTE_TEMP/apk"` only when APK upload is enabled.

- [ ] **Step 5: Implement read-only and version command transport**

Map local commands directly:

```text
list     -> deploy-remote.sh list
switch   -> deploy-remote.sh switch
rollback -> deploy-remote.sh rollback
status   -> deploy-remote.sh status
logs     -> deploy-remote.sh logs
```

For commands after initial deployment, remote script loads domain and keep settings from `$ROOT/shared/deploy/config.env`. The local script still passes `--root`; custom roots therefore require `BUS_DEPLOY_ROOT` to remain set for later commands.

- [ ] **Step 6: Add local progress and error messages**

Print concise stages:

```text
[1/6] Validating repository
[2/6] Running tests
[3/6] Building release
[4/6] Uploading artifacts
[5/6] Activating remote release
[6/6] Deployment verified
```

Never print environment file contents or route token secret.

- [ ] **Step 7: Run fake transport tests and commit**

```bash
bash scripts/tests/deploy_test.sh
bash -n scripts/deploy.sh
git add scripts/deploy.sh scripts/tests/deploy_test.sh
git commit -m "feat: orchestrate deployment over ssh"
```

### Task 8: Operator Documentation and Final Verification

**Files:**

- Create: `docs/deployment.md`
- Modify: `docs/superpowers/specs/2026-06-22-ssh-caddy-deployment-design.md`
- Modify: `scripts/deploy.sh`
- Modify: `scripts/deploy-remote.sh`
- Modify: `scripts/tests/deploy_test.sh`

- [ ] **Step 1: Document prerequisites and first deployment**

Include:

```bash
ssh root@<server-ip>

export BUS_DEPLOY_HOST=<server-ip>
export BUS_DEPLOY_DOMAIN=www.busiscoming.com

./scripts/deploy.sh deploy
./scripts/deploy.sh status
```

Document DNS, ports 22/80/443, strict known_hosts behavior, local tool requirements, root SSH, and the non-root backend service.

- [ ] **Step 2: Document normal operations**

Include exact examples for:

```bash
./scripts/deploy.sh list
./scripts/deploy.sh switch --version 20260622-153000-a07eaf4
./scripts/deploy.sh rollback
./scripts/deploy.sh logs --service backend
./scripts/deploy.sh logs --service caddy --lines 300
./scripts/deploy.sh deploy --skip-apk
./scripts/deploy.sh deploy --skip-tests
```

Explain that code rollback never changes the APK.

- [ ] **Step 3: Record implementation clarifications in the design**

Add:

- `node` is explicitly required locally because it parses `current.json`.
- `--skip-apk` requires an already valid remote APK; it cannot bootstrap an empty server.
- custom `BUS_DEPLOY_ROOT` must remain configured for later commands because it is needed to locate remote config.

- [ ] **Step 4: Run static shell verification**

```bash
bash -n scripts/deploy.sh
bash -n scripts/deploy-remote.sh
bash scripts/tests/deploy_test.sh
```

Expected: all exit zero.

If available:

```bash
shellcheck scripts/deploy.sh scripts/deploy-remote.sh scripts/tests/deploy_test.sh
```

Fix all errors and warnings that represent real defects. Do not install ShellCheck automatically.

- [ ] **Step 5: Run repository verification**

```bash
npm --prefix frontend test
npm --prefix frontend run openapi:lint
npm --prefix frontend run openapi:routes:lint
npm --prefix frontend run build
```

```bash
cd backend
GOCACHE="$(mktemp -d)" go test ./...
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
  GOCACHE="$(mktemp -d)" \
  go build -trimpath -ldflags="-s -w" \
  -o "$(mktemp -d)/busiscoming-server" ./cmd/server
```

Confirm with `file` that the binary is ELF 64-bit x86-64.

- [ ] **Step 6: Verify no unrelated files are staged**

Run:

```bash
git status --short
git diff -- frontend/vite.config.ts
```

Stage only:

```text
scripts/deploy.sh
scripts/deploy-remote.sh
scripts/tests/deploy_test.sh
docs/deployment.md
docs/superpowers/specs/2026-06-22-ssh-caddy-deployment-design.md
docs/superpowers/plans/2026-06-22-ssh-caddy-deployment.md
```

Do not stage `frontend/vite.config.ts` or `backend/bin/`.

- [ ] **Step 7: Commit final documentation and verification adjustments**

```bash
git add scripts/deploy.sh scripts/deploy-remote.sh scripts/tests/deploy_test.sh \
  docs/deployment.md \
  docs/superpowers/specs/2026-06-22-ssh-caddy-deployment-design.md \
  docs/superpowers/plans/2026-06-22-ssh-caddy-deployment.md
git commit -m "docs: document production deployment workflow"
```

## Execution Notes

- Do not run a real deployment without a concrete server IP and explicit user authorization to modify that server.
- The local test suite must never open SSH connections or write `/etc`, `/opt`, `/var/lock`, systemd, Caddy, or UFW.
- Production remote operations require root because they install packages and manage system services.
- Preserve the user's existing uncommitted `frontend/vite.config.ts` and `backend/bin/` throughout implementation.
