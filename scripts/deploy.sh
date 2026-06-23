#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
REMOTE_SCRIPT="${SCRIPT_DIR}/deploy-remote.sh"

COMMAND=""
HOST="${BUS_DEPLOY_HOST:-}"
DOMAIN="${BUS_DEPLOY_DOMAIN:-}"
KEEP="${BUS_DEPLOY_KEEP:-3}"
DEPLOY_ROOT="${BUS_DEPLOY_ROOT:-/opt/busiscoming}"
DNS_MODE="${BUS_DEPLOY_DNS_MODE:-direct}"
VERSION=""
SERVICE=""
LINES=100
SKIP_APK=0
SKIP_TESTS=0
ALLOW_DIRTY=0
ALLOW_NON_MASTER=0
BARE_DOMAIN=""
BUILD_ROOT=""
BUILD_ROOT_OWNED=0
CLEANUP_TRAPS_INSTALLED=0
ARCHIVE=""
APK_DIR=""
TEST_MODE="${BUS_DEPLOY_TEST_MODE:-0}"
TEST_ARTIFACT_ROOT="${BUS_DEPLOY_TEST_ARTIFACT_ROOT:-}"
SSH_TARGET=""
REMOTE_TEMP=""
APK_INPUT="${REPO_ROOT}/backend/downloads/android/BusIsComing.apk"
APK_METADATA_INPUT="${REPO_ROOT}/backend/downloads/android/current.json"

usage() {
  cat <<'EOF'
Usage:
  deploy.sh deploy [--host IP] [--domain DOMAIN] [--version VERSION]
                   [--dns-mode direct|proxied]
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

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

preflight_requirements() {
  local command_name

  for command_name in bash ssh scp tar git npm node go shasum dig file mktemp; do
    require_command "${command_name}"
  done
}

transport_requirements() {
  require_command ssh
  require_command scp
  require_command mktemp
}

validate_version() {
  local value="$1"

  [[ "${#value}" -le 128 ]] &&
    [[ "${value}" != "." && "${value}" != ".." ]] &&
    [[ "${value}" =~ ^[A-Za-z0-9._-]+$ ]]
}

validate_ipv4() {
  local value="$1"
  local part
  local decimal
  local old_ifs="${IFS}"

  [[ "${value}" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]] ||
    return 1

  IFS=.
  set -- ${value}
  IFS="${old_ifs}"

  for part in "$@"; do
    decimal=$((10#${part}))
    [[ "${decimal}" -ge 0 && "${decimal}" -le 255 ]] || return 1
  done
}

validate_domain() {
  [[ "$1" =~ ^[A-Za-z0-9.-]+$ ]] &&
    [[ "$1" != .* && "$1" != *. && "$1" != *..* ]]
}

derive_bare_domain() {
  case "$1" in
    www.*)
      printf '%s\n' "${1#www.}"
      ;;
    *)
      return 1
      ;;
  esac
}

json_field() {
  local file="$1"
  local field="$2"

  node -e '
    const fs = require("fs");
    const value = JSON.parse(fs.readFileSync(process.argv[1], "utf8"))[process.argv[2]];
    if (value === undefined || value === null) {
      process.exit(2);
    }
    process.stdout.write(String(value));
  ' "${file}" "${field}"
}

validate_safe_relative_path() {
  local value="$1"
  local remaining
  local segment

  [[ "${value}" =~ ^[A-Za-z0-9._-]+(/[A-Za-z0-9._-]+)*$ ]] || return 1

  remaining="${value}"
  while :; do
    segment="${remaining%%/*}"
    [[ "${segment}" != "." && "${segment}" != ".." ]] || return 1
    [[ "${remaining}" == */* ]] || break
    remaining="${remaining#*/}"
  done
}

validate_apk_input() {
  local apk="$1"
  local metadata="$2"
  local name
  local expected_size
  local expected_sha
  local status
  local actual_size
  local actual_sha

  [[ -f "${apk}" && -f "${metadata}" ]] || return 1

  if ! name="$(json_field "${metadata}" relativePath 2>/dev/null)"; then
    name="$(json_field "${metadata}" fileName)" || return 1
  fi
  expected_size="$(json_field "${metadata}" sizeBytes)" || return 1
  expected_sha="$(json_field "${metadata}" sha256)" || return 1
  status="$(json_field "${metadata}" status)" || return 1

  validate_safe_relative_path "${name}" || return 1
  [[ "${name##*/}" == "${apk##*/}" ]] || return 1
  [[ "${expected_size}" =~ ^[0-9]+$ ]] || return 1
  [[ "${expected_sha}" =~ ^[A-Fa-f0-9]{64}$ ]] || return 1

  actual_size="$(wc -c < "${apk}" | tr -d '[:space:]')"
  actual_sha="$(shasum -a 256 "${apk}" | awk '{print $1}')"

  [[ "${expected_size}" == "${actual_size}" ]] || return 1
  [[ "${expected_sha}" == "${actual_sha}" ]] || return 1
  [[ "${status}" == "available" ]]
}

git_worktree_is_dirty() {
  [[ -n "$(git -C "${REPO_ROOT}" status --porcelain)" ]]
}

git_preflight() {
  local branch

  branch="$(git -C "${REPO_ROOT}" branch --show-current)"
  if [[ "${branch}" != "master" && "${ALLOW_NON_MASTER}" -ne 1 ]]; then
    die "Deployments must run from master; current branch: ${branch}"
  fi
  if git_worktree_is_dirty && [[ "${ALLOW_DIRTY}" -ne 1 ]]; then
    die "Git worktree is dirty; commit changes or pass --allow-dirty"
  fi
}

validate_dns() {
  local name
  local resolved
  local matched
  local has_record

  BARE_DOMAIN="$(derive_bare_domain "${DOMAIN}")" ||
    die "Domain must start with www."

  for name in "${DOMAIN}" "${BARE_DOMAIN}"; do
    matched=0
    has_record=0
    while IFS= read -r resolved; do
      [[ -n "${resolved}" ]] || continue
      has_record=1
      if [[ "${resolved}" == "${HOST}" ]]; then
        matched=1
        break
      fi
    done < <(dig +short A "${name}")

    [[ "${has_record}" -eq 1 ]] ||
      die "DNS A record for ${name} is empty"
    if [[ "${DNS_MODE}" == "direct" ]]; then
      [[ "${matched}" -eq 1 ]] ||
        die "DNS A record for ${name} does not include ${HOST}"
    fi
  done
}

mark_dirty_version() {
  local value="$1"

  if git_worktree_is_dirty && [[ "${value}" != *-dirty ]]; then
    printf '%s-dirty\n' "${value}"
  else
    printf '%s\n' "${value}"
  fi
}

default_version() {
  local stamp
  local commit

  stamp="$(date '+%Y%m%d-%H%M%S')"
  commit="$(git -C "${REPO_ROOT}" rev-parse --short=7 HEAD)"
  mark_dirty_version "${stamp}-${commit}"
}

validate_deploy_inputs() {
  [[ "${KEEP}" =~ ^[1-9][0-9]*$ ]] ||
    die "BUS_DEPLOY_KEEP must be a positive integer"
  validate_ipv4 "${HOST}" || die "Deploy host must be an IPv4 address"
  validate_domain "${DOMAIN}" || die "Invalid deployment domain: ${DOMAIN}"
  case "${DNS_MODE}" in
    direct|proxied)
      ;;
    *)
      die "DNS mode must be direct or proxied"
      ;;
  esac

  BARE_DOMAIN="$(derive_bare_domain "${DOMAIN}")" ||
    die "Domain must start with www."
  validate_domain "${BARE_DOMAIN}" ||
    die "Invalid bare deployment domain: ${BARE_DOMAIN}"

  if [[ -n "${VERSION}" ]]; then
    validate_version "${VERSION}" || die "Invalid version: ${VERSION}"
  fi
}

resolve_version() {
  if [[ -z "${VERSION}" ]]; then
    VERSION="$(default_version)"
  else
    VERSION="$(mark_dirty_version "${VERSION}")"
  fi
  validate_version "${VERSION}" || die "Invalid version: ${VERSION}"
}

deployment_preflight() {
  preflight_requirements
  validate_deploy_inputs
  git_preflight
  resolve_version
  validate_dns
}

cleanup_build_root() {
  local cleanup_status=0

  if [[ "${BUILD_ROOT_OWNED:-0}" -eq 1 &&
    "${BUILD_ROOT:-}" == "${TMPDIR:-/tmp}"/busiscoming-deploy.* &&
    -d "${BUILD_ROOT}" ]]; then
    rm -rf "${BUILD_ROOT}" || cleanup_status=$?
  fi
  BUILD_ROOT=""
  BUILD_ROOT_OWNED=0
  return "${cleanup_status}"
}

cleanup_all() {
  if ! cleanup_build_root; then
    printf 'Warning: failed to clean local build directory\n' >&2
  fi
  if declare -F remote_cleanup >/dev/null 2>&1; then
    if ! remote_cleanup; then
      printf 'Warning: failed to clean remote deployment directory\n' >&2
    fi
  fi
  return 0
}

remote_cleanup() {
  if [[ -z "${SSH_TARGET:-}" || -z "${REMOTE_TEMP:-}" ]]; then
    return 0
  fi
  case "${REMOTE_TEMP}" in
    /tmp/busiscoming-deploy-*)
      ssh "${SSH_TARGET}" rm -rf -- "${REMOTE_TEMP}" >/dev/null 2>&1 || true
      ;;
  esac
}

handle_cleanup_signal() {
  local status="$1"

  cleanup_all
  trap - EXIT
  exit "${status}"
}

install_cleanup_traps() {
  if [[ "${CLEANUP_TRAPS_INSTALLED}" -eq 1 ]]; then
    return 0
  fi

  trap 'cleanup_all' EXIT
  trap 'handle_cleanup_signal 130' INT
  trap 'handle_cleanup_signal 143' TERM
  CLEANUP_TRAPS_INSTALLED=1
}

run_local_build() {
  local binary_description

  BUILD_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/busiscoming-deploy.XXXXXX")"
  BUILD_ROOT_OWNED=1

  (
    cd "${REPO_ROOT}/frontend"
    npm ci
  )
  if [[ "${SKIP_TESTS}" -ne 1 ]]; then
    (
      cd "${REPO_ROOT}/frontend"
      npm test
      npm run openapi:lint
      npm run openapi:routes:lint
    )
    (
      cd "${REPO_ROOT}/backend"
      GOCACHE="${BUILD_ROOT}/go-cache" go test ./...
    )
  fi

  (
    cd "${REPO_ROOT}/frontend"
    npm run build
  )
  (
    cd "${REPO_ROOT}/backend"
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
      GOCACHE="${BUILD_ROOT}/go-cache" \
      go build -trimpath -ldflags="-s -w" \
      -o "${BUILD_ROOT}/busiscoming-server" ./cmd/server
  )

  binary_description="$(file "${BUILD_ROOT}/busiscoming-server")"
  if [[ ! "${binary_description}" =~ ELF\ 64-bit.*x86-64 ]] ||
    [[ "${binary_description}" != *"statically linked"* ]]; then
    die "Go build did not produce a statically linked Linux x86_64 binary: ${binary_description}"
  fi
}

prepare_apk_artifacts() {
  local apk_name
  local metadata_name

  APK_DIR=""
  if [[ "${SKIP_APK}" -eq 1 ]]; then
    return 0
  fi

  [[ -n "${BUILD_ROOT:-}" && -d "${BUILD_ROOT}" ]] ||
    die "Build root is not available"

  apk_name="${APK_INPUT##*/}"
  metadata_name="${APK_METADATA_INPUT##*/}"
  APK_DIR="${BUILD_ROOT}/apk"
  rm -rf "${APK_DIR}"
  mkdir -p "${APK_DIR}"
  cp "${APK_INPUT}" "${APK_DIR}/${apk_name}"
  cp "${APK_METADATA_INPUT}" "${APK_DIR}/${metadata_name}"
  validate_apk_input \
    "${APK_DIR}/${apk_name}" "${APK_DIR}/${metadata_name}" ||
    die "APK input or metadata validation failed"

  (
    cd "${APK_DIR}"
    shasum -a 256 "${apk_name}" > "${apk_name}.sha256"
    shasum -a 256 "${metadata_name}" > "${metadata_name}.sha256"
  )
}

validate_frontend_dist_entries() {
  local dist_root="$1"
  local entry
  local entries_file
  local unsupported_entry=""

  entries_file="$(
    mktemp "${TMPDIR:-/tmp}/busiscoming-dist-entries.XXXXXX"
  )" || die "Unable to create frontend build inspection file"

  if ! find "${dist_root}" -print0 > "${entries_file}"; then
    rm -f "${entries_file}"
    die "Unable to inspect frontend build output: ${dist_root}"
  fi

  while IFS= read -r -d '' entry; do
    if [[ -L "${entry}" || (! -f "${entry}" && ! -d "${entry}") ]]; then
      unsupported_entry="${entry}"
      break
    fi
  done < "${entries_file}"

  rm -f "${entries_file}"
  if [[ -n "${unsupported_entry}" ]]; then
    die "Frontend build output contains unsupported entry: ${unsupported_entry}"
  fi
}

create_release_archive() {
  local stage
  local manifest
  local branch
  local commit
  local dirty
  local built_at
  local backend_sha
  local archive_sha

  [[ -n "${BUILD_ROOT:-}" && -d "${BUILD_ROOT}" ]] ||
    die "Build root is not available"
  [[ -d "${REPO_ROOT}/frontend/dist" ]] ||
    die "Frontend build output is missing"
  [[ -f "${BUILD_ROOT}/busiscoming-server" ]] ||
    die "Backend build output is missing"
  validate_version "${VERSION}" || die "Invalid version: ${VERSION}"
  validate_frontend_dist_entries "${REPO_ROOT}/frontend/dist"

  stage="${BUILD_ROOT}/release"
  manifest="${stage}/release-manifest.txt"
  rm -rf "${stage}"
  mkdir -p "${stage}/frontend" "${stage}/backend"
  cp -R "${REPO_ROOT}/frontend/dist" "${stage}/frontend/dist"
  validate_frontend_dist_entries "${stage}/frontend/dist"
  cp "${BUILD_ROOT}/busiscoming-server" "${stage}/backend/busiscoming-server"
  chmod 0755 "${stage}/backend/busiscoming-server"

  branch="$(git -C "${REPO_ROOT}" branch --show-current)"
  commit="$(git -C "${REPO_ROOT}" rev-parse HEAD)"
  if git_worktree_is_dirty; then
    dirty=true
  else
    dirty=false
  fi
  built_at="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  backend_sha="$(
    shasum -a 256 "${stage}/backend/busiscoming-server" | awk '{print $1}'
  )"

  {
    printf 'version=%s\n' "${VERSION}"
    printf 'branch=%s\n' "${branch}"
    printf 'commit=%s\n' "${commit}"
    printf 'dirty=%s\n' "${dirty}"
    printf 'built_at=%s\n' "${built_at}"
    printf 'target=linux/amd64\n'
    printf 'backend_sha256=%s\n' "${backend_sha}"
  } > "${manifest}"

  (
    cd "${stage}"
    find frontend/dist -type f -print |
      LC_ALL=C sort |
      while IFS= read -r frontend_file; do
        shasum -a 256 "${frontend_file}"
      done >> release-manifest.txt
  )

  ARCHIVE="${BUILD_ROOT}/release-${VERSION}.tar.gz"
  COPYFILE_DISABLE=1 tar -C "${stage}" -czf "${ARCHIVE}" .
  archive_sha="$(shasum -a 256 "${ARCHIVE}" | awk '{print $1}')"
  printf '%s  %s\n' "${archive_sha}" "${ARCHIVE##*/}" > "${ARCHIVE}.sha256"

  prepare_apk_artifacts
}

progress() {
  printf '%s\n' "$*" >&2
}

prepare_test_artifacts() {
  [[ -n "${TEST_ARTIFACT_ROOT}" && -d "${TEST_ARTIFACT_ROOT}" ]] ||
    die "BUS_DEPLOY_TEST_ARTIFACT_ROOT is required in test mode"
  [[ -n "${VERSION}" ]] ||
    die "Test mode deploy requires --version"

  BUILD_ROOT="${TEST_ARTIFACT_ROOT}"
  BUILD_ROOT_OWNED=0
  ARCHIVE="${TEST_ARTIFACT_ROOT}/release-${VERSION}.tar.gz"
  [[ -f "${ARCHIVE}" && -f "${ARCHIVE}.sha256" ]] ||
    die "Test release archive fixture is missing"

  APK_DIR=""
  if [[ "${SKIP_APK}" -ne 1 ]]; then
    APK_DIR="${TEST_ARTIFACT_ROOT}/apk"
    [[ -d "${APK_DIR}" ]] ||
      die "Test APK fixture is missing"
  fi
}

remote_setup() {
  transport_requirements
  [[ -f "${REMOTE_SCRIPT}" ]] ||
    die "Remote helper is missing: ${REMOTE_SCRIPT}"

  SSH_TARGET="root@${HOST}"
  REMOTE_TEMP="/tmp/busiscoming-deploy-$(date '+%s')-$$"
  ssh "${SSH_TARGET}" mkdir -p "${REMOTE_TEMP}"
  scp "${REMOTE_SCRIPT}" "${SSH_TARGET}:${REMOTE_TEMP}/deploy-remote.sh"
  ssh "${SSH_TARGET}" chmod 0700 "${REMOTE_TEMP}/deploy-remote.sh"
}

remote_run() {
  ssh "${SSH_TARGET}" "${REMOTE_TEMP}/deploy-remote.sh" "$@"
}

upload_release_artifacts() {
  [[ -f "${ARCHIVE}" && -f "${ARCHIVE}.sha256" ]] ||
    die "Release archive is missing"
  scp "${ARCHIVE}" "${ARCHIVE}.sha256" "${SSH_TARGET}:${REMOTE_TEMP}/"
}

upload_apk_artifacts() {
  [[ -n "${APK_DIR}" && -d "${APK_DIR}" ]] ||
    die "APK artifacts are missing"
  ssh "${SSH_TARGET}" mkdir -p "${REMOTE_TEMP}/apk"
  scp \
    "${APK_DIR}/BusIsComing.apk" \
    "${APK_DIR}/current.json" \
    "${APK_DIR}/BusIsComing.apk.sha256" \
    "${APK_DIR}/current.json.sha256" \
    "${SSH_TARGET}:${REMOTE_TEMP}/apk/"
}

command_deploy() {
  local remote_archive
  local remote_archive_sha
  local remote_args

  if [[ "${TEST_MODE}" -eq 1 ]]; then
    validate_deploy_inputs
    BARE_DOMAIN="$(derive_bare_domain "${DOMAIN}")"
    validate_version "${VERSION}" || die "Invalid version: ${VERSION}"
    progress "[1/6] Validating repository"
    prepare_test_artifacts
  else
    progress "[1/6] Validating repository"
    deployment_preflight
    progress "[2/6] Running tests"
    progress "[3/6] Building release"
    run_local_build
    create_release_archive
  fi

  progress "[4/6] Uploading artifacts"
  remote_setup
  upload_release_artifacts
  if [[ "${SKIP_APK}" -ne 1 ]]; then
    upload_apk_artifacts
  fi

  remote_archive="${REMOTE_TEMP}/${ARCHIVE##*/}"
  remote_archive_sha="${remote_archive}.sha256"
  remote_args=(
    deploy
    --root "${DEPLOY_ROOT}"
    --domain "${DOMAIN}"
    --bare-domain "${BARE_DOMAIN}"
    --keep "${KEEP}"
    --version "${VERSION}"
    --archive "${remote_archive}"
    --archive-sha "${remote_archive_sha}"
  )
  if [[ "${SKIP_APK}" -ne 1 ]]; then
    remote_args+=(--apk-dir "${REMOTE_TEMP}/apk")
  fi

  progress "[5/6] Activating remote release"
  remote_run "${remote_args[@]}"
  progress "[6/6] Deployment verified"
}

command_remote_passthrough() {
  local remote_args

  remote_setup
  remote_args=("${COMMAND}" --root "${DEPLOY_ROOT}")
  case "${COMMAND}" in
    switch)
      remote_args+=(--version "${VERSION}")
      ;;
    logs)
      remote_args+=(--service "${SERVICE}" --lines "${LINES}")
      ;;
  esac
  remote_run "${remote_args[@]}"
}

validate_command_option() {
  local option="$1"

  case "${COMMAND}:${option}" in
    deploy:--host|deploy:--domain|deploy:--version|deploy:--dns-mode|deploy:--skip-apk|deploy:--skip-tests|deploy:--allow-dirty|deploy:--allow-non-master)
      return 0
      ;;
    list:--host|status:--host|rollback:--host)
      return 0
      ;;
    switch:--host|switch:--version)
      return 0
      ;;
    logs:--host|logs:--service|logs:--lines)
      return 0
      ;;
    *)
      die "Option ${option} is not valid for command: ${COMMAND}"
      ;;
  esac
}

parse_args() {
  [[ $# -gt 0 ]] || {
    usage
    exit 1
  }

  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    deploy|list|switch|rollback|status|logs)
      COMMAND="$1"
      shift
      ;;
    *)
      die "Unknown command: $1"
      ;;
  esac

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --host)
        validate_command_option "$1"
        [[ $# -ge 2 ]] || die "--host requires a value"
        HOST="$2"
        shift 2
        ;;
      --domain)
        validate_command_option "$1"
        [[ $# -ge 2 ]] || die "--domain requires a value"
        DOMAIN="$2"
        shift 2
        ;;
      --version)
        validate_command_option "$1"
        [[ $# -ge 2 ]] || die "--version requires a value"
        VERSION="$2"
        shift 2
        ;;
      --dns-mode)
        validate_command_option "$1"
        [[ $# -ge 2 ]] || die "--dns-mode requires a value"
        DNS_MODE="$2"
        shift 2
        ;;
      --service)
        validate_command_option "$1"
        [[ $# -ge 2 ]] || die "--service requires a value"
        SERVICE="$2"
        shift 2
        ;;
      --lines)
        validate_command_option "$1"
        [[ $# -ge 2 ]] || die "--lines requires a value"
        LINES="$2"
        shift 2
        ;;
      --skip-apk)
        validate_command_option "$1"
        SKIP_APK=1
        shift
        ;;
      --skip-tests)
        validate_command_option "$1"
        SKIP_TESTS=1
        shift
        ;;
      --allow-dirty)
        validate_command_option "$1"
        ALLOW_DIRTY=1
        shift
        ;;
      --allow-non-master)
        validate_command_option "$1"
        ALLOW_NON_MASTER=1
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        die "Unknown option: $1"
        ;;
    esac
  done
}

validate_command_args() {
  [[ -n "${HOST}" ]] || die "Server host is required via --host or BUS_DEPLOY_HOST"

  case "${COMMAND}" in
    deploy)
      [[ -n "${DOMAIN}" ]] || die "Domain is required via --domain or BUS_DEPLOY_DOMAIN"
      validate_deploy_inputs
      ;;
    switch)
      [[ -n "${VERSION}" ]] || die "switch requires --version"
      validate_version "${VERSION}" || die "Invalid version: ${VERSION}"
      ;;
    logs)
      case "${SERVICE}" in
        backend|caddy)
          ;;
        *)
          die "--service must be backend or caddy"
          ;;
      esac
      [[ "${LINES}" =~ ^[1-9][0-9]*$ ]] || die "--lines must be a positive integer"
      ;;
  esac
}

main() {
  install_cleanup_traps
  parse_args "$@"
  validate_command_args
  case "${COMMAND}" in
    deploy)
      command_deploy
      ;;
    list|switch|rollback|status|logs)
      command_remote_passthrough
      ;;
  esac
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi
