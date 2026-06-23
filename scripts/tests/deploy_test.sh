#!/usr/bin/env bash

set -u

TEST_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_REPO_ROOT="$(cd "${TEST_SCRIPT_DIR}/../.." && pwd)"
DEPLOY_SCRIPT="${TEST_REPO_ROOT}/scripts/deploy.sh"
REMOTE_SCRIPT="${TEST_REPO_ROOT}/scripts/deploy-remote.sh"
FAILURES=0

source "${DEPLOY_SCRIPT}"

run_test() {
  local name="$1"
  local status
  local had_errexit=0
  shift

  case "$-" in
    *e*)
      had_errexit=1
      ;;
  esac

  set +e
  (
    set -euo pipefail
    "$@"
  )
  status=$?
  if [ "${had_errexit}" -eq 1 ]; then
    set -e
  fi

  if [ "${status}" -eq 0 ]; then
    printf 'ok - %s\n' "${name}"
  else
    printf 'not ok - %s\n' "${name}"
    FAILURES=$((FAILURES + 1))
  fi
  return 0
}

assert_contains() {
  local output="$1"
  local expected="$2"

  case "${output}" in
    *"${expected}"*)
      return 0
      ;;
    *)
      printf '  expected output to contain: %s\n' "${expected}"
      printf '  actual output: %s\n' "${output}"
      return 1
      ;;
  esac
}

assert_equals() {
  local actual="$1"
  local expected="$2"

  if [ "${actual}" = "${expected}" ]; then
    return 0
  fi

  printf '  expected: %s\n' "${expected}"
  printf '  actual: %s\n' "${actual}"
  return 1
}

assert_not_contains() {
  local output="$1"
  local unexpected="$2"

  case "${output}" in
    *"${unexpected}"*)
      printf '  expected output not to contain: %s\n' "${unexpected}"
      printf '  actual output: %s\n' "${output}"
      return 1
      ;;
    *)
      return 0
      ;;
  esac
}

write_fake_git() {
  local bin_dir="$1"

  mkdir -p "${bin_dir}"
  cat > "${bin_dir}/git" <<'EOF'
#!/bin/sh
if [ "${1:-}" = "-C" ]; then
  shift 2
fi

case "${1:-}:${2:-}" in
  branch:--show-current)
    printf '%s\n' "${FAKE_GIT_BRANCH:-master}"
    ;;
  status:--porcelain)
    if [ "${FAKE_GIT_DIRTY:-0}" = "1" ]; then
      printf ' M controlled-file\n'
    fi
    ;;
  rev-parse:--short=7)
    printf 'a07eaf4\n'
    ;;
  rev-parse:HEAD)
    printf 'a07eaf4a07eaf4a07eaf4a07eaf4a07eaf4a07e\n'
    ;;
  *)
    printf 'unexpected fake git invocation: %s\n' "$*" >&2
    exit 1
    ;;
esac
EOF
  chmod +x "${bin_dir}/git"
}

write_fake_dig() {
  local bin_dir="$1"

  mkdir -p "${bin_dir}"
  cat > "${bin_dir}/dig" <<'EOF'
#!/bin/sh
printf '%s\n' "$*" >> "${FAKE_DIG_LOG}"

case "${3:-}" in
  "${FAKE_DIG_MAIN_NAME}")
    printf '%s\n' "${FAKE_DIG_MAIN_RESULT}"
    ;;
  "${FAKE_DIG_BARE_NAME}")
    printf '%s\n' "${FAKE_DIG_BARE_RESULT}"
    ;;
  *)
    printf 'unexpected DNS name: %s\n' "${3:-}" >&2
    exit 1
    ;;
esac
EOF
  chmod +x "${bin_dir}/dig"
}

write_fake_build_tools() {
  local bin_dir="$1"

  mkdir -p "${bin_dir}"
  cat > "${bin_dir}/npm" <<'EOF'
#!/bin/sh
printf 'npm|cwd=%s|args=%s\n' "$PWD" "$*" >> "${FAKE_BUILD_LOG}"
if [ -n "${FAKE_NPM_FAIL_ARGS:-}" ] && [ "$*" = "${FAKE_NPM_FAIL_ARGS}" ]; then
  exit "${FAKE_NPM_FAIL_STATUS:-23}"
fi
EOF
  cat > "${bin_dir}/go" <<'EOF'
#!/bin/sh
printf 'go|cwd=%s|cgo=%s|goos=%s|goarch=%s|gocache=%s|args=%s\n' \
  "$PWD" "${CGO_ENABLED:-}" "${GOOS:-}" "${GOARCH:-}" "${GOCACHE:-}" "$*" \
  >> "${FAKE_BUILD_LOG}"

if [ -n "${FAKE_GO_FAIL_ARGS:-}" ] && [ "$*" = "${FAKE_GO_FAIL_ARGS}" ]; then
  exit "${FAKE_GO_FAIL_STATUS:-24}"
fi

if [ "${1:-}" = "build" ]; then
  output=""
  previous=""
  for argument in "$@"; do
    if [ "${previous}" = "-o" ]; then
      output="${argument}"
      break
    fi
    previous="${argument}"
  done
  [ -n "${output}" ] || exit 1
  mkdir -p "$(dirname "${output}")"
  printf 'fake-linux-binary\n' > "${output}"
  chmod +x "${output}"
fi
EOF
  cat > "${bin_dir}/file" <<'EOF'
#!/bin/sh
printf 'file|cwd=%s|args=%s\n' "$PWD" "$*" >> "${FAKE_BUILD_LOG}"
if [ "${FAKE_FILE_STATIC:-1}" = "1" ]; then
  printf '%s: ELF 64-bit LSB executable, x86-64, statically linked, stripped\n' "$1"
else
  printf '%s: ELF 64-bit LSB pie executable, x86-64, dynamically linked, stripped\n' "$1"
fi
EOF
  chmod +x "${bin_dir}/npm" "${bin_dir}/go" "${bin_dir}/file"
}

write_fake_remote_commands() {
  local bin_dir="$1"

  mkdir -p "${bin_dir}"
  cat > "${bin_dir}/systemctl" <<'EOF'
#!/bin/sh
printf 'systemctl|%s\n' "$*" >> "${FAKE_REMOTE_LOG}"

[ "${1:-}" = "is-active" ] || exit 41
case "${2:-}" in
  busiscoming-backend)
    printf '%s\n' "${FAKE_BACKEND_STATE:-active}"
    [ "${FAKE_BACKEND_STATE:-active}" = "active" ]
    ;;
  caddy)
    printf '%s\n' "${FAKE_CADDY_STATE:-active}"
    [ "${FAKE_CADDY_STATE:-active}" = "active" ]
    ;;
  *)
    exit 42
    ;;
esac
EOF
  cat > "${bin_dir}/curl" <<'EOF'
#!/bin/sh
url=""
for argument in "$@"; do
  url="${argument}"
done
printf 'curl|%s\n' "$*" >> "${FAKE_REMOTE_LOG}"

case "${url}" in
  http://127.0.0.1:8080/healthz)
    [ "${FAKE_LOCAL_HEALTH:-ok}" = "ok" ]
    ;;
  "https://${FAKE_DOMAIN:-www.busiscoming.com}/")
    [ "${FAKE_MAIN_HEALTH:-ok}" = "ok" ]
    ;;
  "https://${FAKE_BARE_DOMAIN:-busiscoming.com}/")
    [ "${FAKE_BARE_HEALTH:-ok}" = "ok" ]
    ;;
  *)
    printf 'unexpected fake curl URL: %s\n' "${url}" >&2
    exit 43
    ;;
esac
EOF
  cat > "${bin_dir}/journalctl" <<'EOF'
#!/bin/sh
printf 'journalctl|%s\n' "$*" >> "${FAKE_REMOTE_LOG}"
printf 'fake journal output\n'
EOF
  chmod +x \
    "${bin_dir}/systemctl" \
    "${bin_dir}/curl" \
    "${bin_dir}/journalctl"
}

remote_helper_succeeds() {
  local helper="$1"
  local value="$2"

  bash -c 'source "$1"; "$2" "$3"' _ "${REMOTE_SCRIPT}" "${helper}" "${value}"
}

write_remote_config() {
  local root="$1"
  local domain="${2:-www.busiscoming.com}"
  local bare_domain="${3:-busiscoming.com}"
  local configured_root="${4:-${root}}"
  local keep="${5:-3}"

  mkdir -p "${root}/shared/deploy"
  cat > "${root}/shared/deploy/config.env" <<EOF
DOMAIN=${domain}
BARE_DOMAIN=${bare_domain}
DEPLOY_ROOT=${configured_root}
KEEP=${keep}
EOF
}

assert_remote_inspection_fails() {
  local root="$1"
  local expected="$2"
  local command_name
  local output

  for command_name in list status; do
    if output="$(
      BUS_DEPLOY_TEST_MODE=1 \
        "${REMOTE_SCRIPT}" "${command_name}" --root "${root}" 2>&1
    )"; then
      printf '  expected %s to reject malformed state under: %s\n' \
        "${command_name}" "${root}"
      return 1
    fi
    assert_contains "${output}" "${expected}" || return 1
  done
}

write_apk_fixture() {
  local directory="$1"
  local metadata_name="${2:-BusIsComing.apk}"
  local sha
  local size

  mkdir -p "${directory}"
  printf 'apk-data' > "${directory}/BusIsComing.apk"
  sha="$(shasum -a 256 "${directory}/BusIsComing.apk" | awk '{print $1}')"
  size="$(wc -c < "${directory}/BusIsComing.apk" | tr -d ' ')"
  cat > "${directory}/current.json" <<EOF
{"fileName":"BusIsComing.apk","relativePath":"${metadata_name}","sizeBytes":${size},"sha256":"${sha}","status":"available"}
EOF
  (
    cd "${directory}"
    shasum -a 256 BusIsComing.apk > BusIsComing.apk.sha256
    shasum -a 256 current.json > current.json.sha256
  )
}

write_release_fixture() {
  local directory="$1"
  local version="$2"
  local stage="${directory}/stage-${version}"
  local backend_sha
  local frontend_sha

  rm -rf "${stage}"
  mkdir -p "${stage}/frontend/dist" "${stage}/backend"
  printf '<!doctype html><title>%s</title>\n' "${version}" \
    > "${stage}/frontend/dist/index.html"
  printf 'fake backend %s\n' "${version}" \
    > "${stage}/backend/busiscoming-server"
  chmod +x "${stage}/backend/busiscoming-server"
  backend_sha="$(
    shasum -a 256 "${stage}/backend/busiscoming-server" | awk '{print $1}'
  )"
  frontend_sha="$(
    shasum -a 256 "${stage}/frontend/dist/index.html" | awk '{print $1}'
  )"
  cat > "${stage}/release-manifest.txt" <<EOF
version=${version}
branch=master
commit=a07eaf4a07eaf4a07eaf4a07eaf4a07eaf4a07e
dirty=false
built_at=2026-06-23T00:00:00Z
target=linux/amd64
backend_sha256=${backend_sha}
${frontend_sha}  frontend/dist/index.html
EOF
  (
    cd "${stage}"
    tar -czf "${directory}/release-${version}.tar.gz" .
  )
  (
    cd "${directory}"
    shasum -a 256 "release-${version}.tar.gz" \
      > "release-${version}.tar.gz.sha256"
  )
}

write_fake_deployment_commands() {
  local bin_dir="$1"

  mkdir -p "${bin_dir}"
  cat > "${bin_dir}/systemctl" <<'EOF'
#!/bin/sh
printf 'systemctl|%s\n' "$*" >> "${FAKE_DEPLOY_LOG}"
case "${1:-}" in
  restart)
    [ "${FAKE_DEPLOY_BACKEND_RESTART:-ok}" = "ok" ]
    ;;
  is-active)
    [ "${FAKE_DEPLOY_BACKEND_ACTIVE:-ok}" = "ok" ]
    ;;
  *)
    exit 1
    ;;
esac
EOF
  cat > "${bin_dir}/curl" <<'EOF'
#!/bin/sh
printf 'curl|%s\n' "$*" >> "${FAKE_DEPLOY_LOG}"
url=""
write_out=""
previous=""
for argument in "$@"; do
  if [ "${previous}" = "--write-out" ]; then
    write_out="${argument}"
  fi
  previous="${argument}"
  url="${argument}"
done
case "${url}" in
  http://127.0.0.1:8080/healthz)
    [ "${FAKE_DEPLOY_LOCAL:-ok}" = "ok" ]
    ;;
  "https://${FAKE_DOMAIN:-www.busiscoming.com}/")
    if [ "${FAKE_DEPLOY_MAIN:-ok}" = "ok" ]; then
      [ -z "${write_out}" ] || printf '200'
      exit 0
    fi
    [ -z "${write_out}" ] || printf '503'
    exit 22
    ;;
  "https://${FAKE_BARE_DOMAIN:-busiscoming.com}/")
    if [ "${FAKE_DEPLOY_BARE:-ok}" = "ok" ]; then
      printf '308\nhttps://%s/\n' "${FAKE_DOMAIN:-www.busiscoming.com}"
      exit 0
    fi
    printf '200\n\n'
    exit 0
    ;;
  *)
    printf 'unexpected deployment curl URL: %s\n' "${url}" >&2
    exit 43
    ;;
esac
EOF
  chmod +x "${bin_dir}/systemctl" "${bin_dir}/curl"
}

write_fake_ssh_scp() {
  local bin_dir="$1"

  mkdir -p "${bin_dir}"
  cat > "${bin_dir}/ssh" <<'EOF'
#!/bin/sh
printf 'ssh|%s\n' "$*" >> "${FAKE_TRANSPORT_LOG}"
EOF
  cat > "${bin_dir}/scp" <<'EOF'
#!/bin/sh
printf 'scp|%s\n' "$*" >> "${FAKE_TRANSPORT_LOG}"
EOF
  chmod +x "${bin_dir}/ssh" "${bin_dir}/scp"
}

deploy_fixture_release() {
  local temp="$1"
  local version="$2"
  local apk_dir="${3:-}"

  if [ -n "${apk_dir}" ]; then
    PATH="${temp}/bin:/usr/bin:/bin" \
      FAKE_DEPLOY_LOG="${temp}/deploy.log" \
      FAKE_DOMAIN="www.busiscoming.com" \
      FAKE_BARE_DOMAIN="busiscoming.com" \
      BUS_DEPLOY_TEST_BIN="${temp}/bin" \
      BUS_DEPLOY_TEST_MODE=1 \
      BUS_DEPLOY_ETC_ROOT="${temp}/etc-root" \
      "${REMOTE_SCRIPT}" deploy \
        --root "${temp}/root" \
        --domain www.busiscoming.com \
        --bare-domain busiscoming.com \
        --keep 3 \
        --version "${version}" \
        --archive "${temp}/release-${version}.tar.gz" \
        --archive-sha "${temp}/release-${version}.tar.gz.sha256" \
        --apk-dir "${apk_dir}"
    return
  fi

  PATH="${temp}/bin:/usr/bin:/bin" \
    FAKE_DEPLOY_LOG="${temp}/deploy.log" \
    FAKE_DOMAIN="www.busiscoming.com" \
    FAKE_BARE_DOMAIN="busiscoming.com" \
    BUS_DEPLOY_TEST_BIN="${temp}/bin" \
    BUS_DEPLOY_TEST_MODE=1 \
    BUS_DEPLOY_ETC_ROOT="${temp}/etc-root" \
    "${REMOTE_SCRIPT}" deploy \
      --root "${temp}/root" \
      --domain www.busiscoming.com \
      --bare-domain busiscoming.com \
      --keep 3 \
      --version "${version}" \
      --archive "${temp}/release-${version}.tar.gz" \
      --archive-sha "${temp}/release-${version}.tar.gz.sha256"
}

test_link_version() {
  basename "$(readlink "$1")"
}

test_help_lists_commands() {
  local command
  local output
  local status

  output="$("${DEPLOY_SCRIPT}" --help 2>&1)"
  status=$?

  if [ "${status}" -ne 0 ]; then
    printf '  expected exit status 0, got %s\n' "${status}"
    return 1
  fi

  for command in deploy list switch rollback status logs; do
    assert_contains "${output}" "${command}" || return 1
  done
}

test_unknown_command_fails() {
  local output

  if output="$("${DEPLOY_SCRIPT}" unknown 2>&1)"; then
    printf '  expected a nonzero exit status\n'
    return 1
  fi

  assert_contains "${output}" "Unknown command"
}

test_logs_rejects_invalid_service() {
  local output

  if output="$(BUS_DEPLOY_HOST=192.0.2.10 "${DEPLOY_SCRIPT}" logs --service invalid 2>&1)"; then
    printf '  expected a nonzero exit status\n'
    return 1
  fi

  assert_contains "${output}" "backend or caddy"
}

test_status_rejects_deploy_option() {
  local output

  if output="$(BUS_DEPLOY_HOST=192.0.2.10 "${DEPLOY_SCRIPT}" status --skip-tests 2>&1)"; then
    printf '  expected a nonzero exit status\n'
    return 1
  fi

  assert_contains "${output}" "Option --skip-tests is not valid for command: status"
}

test_list_rejects_logs_option() {
  local output

  if output="$(BUS_DEPLOY_HOST=192.0.2.10 "${DEPLOY_SCRIPT}" list --service backend 2>&1)"; then
    printf '  expected a nonzero exit status\n'
    return 1
  fi

  assert_contains "${output}" "Option --service is not valid for command: list"
}

test_version_validation() {
  local max_length
  local too_long

  max_length="$(printf '%128s' '' | tr ' ' a)"
  too_long="${max_length}a"

  validate_version "20260622-120000-a07eaf4" || return 1
  validate_version "${max_length}" || return 1
  ! validate_version "../escape"
  ! validate_version "has space"
  ! validate_version "."
  ! validate_version ".."
  ! validate_version "${too_long}"
}

test_network_value_validation() {
  validate_ipv4 "192.0.2.10" || return 1
  ! validate_ipv4 "192.0.2.999"
  validate_domain "www.busiscoming.com" || return 1
  ! validate_domain "www.busiscoming.com;id"
}

test_bare_domain_derivation() {
  local output

  output="$(derive_bare_domain "www.busiscoming.com")"
  assert_equals "${output}" "busiscoming.com" || return 1
  ! derive_bare_domain "api.busiscoming.com" >/dev/null 2>&1
}

test_apk_metadata_validation() {
  local temp

  temp="$(mktemp -d)"
  write_apk_fixture "${temp}"
  validate_apk_input "${temp}/BusIsComing.apk" "${temp}/current.json" || return 1

  rm -rf "${temp}"
}

test_apk_metadata_allows_safe_relative_directory() {
  local temp

  temp="$(mktemp -d)"
  write_apk_fixture "${temp}" "downloads/android/BusIsComing.apk"
  validate_apk_input "${temp}/BusIsComing.apk" "${temp}/current.json" || return 1

  rm -rf "${temp}"
}

test_apk_metadata_rejects_unsafe_basename() {
  local temp

  temp="$(mktemp -d)"
  write_apk_fixture "${temp}" "../BusIsComing.apk"
  ! validate_apk_input "${temp}/BusIsComing.apk" "${temp}/current.json"

  rm -rf "${temp}"
}

test_environment_defaults_and_cli_overrides() {
  local defaults
  local overrides

  defaults="$(
    BUS_DEPLOY_HOST=192.0.2.10 \
    BUS_DEPLOY_DOMAIN=www.env.example \
    BUS_DEPLOY_KEEP=7 \
    BUS_DEPLOY_DNS_MODE=proxied \
      bash -c '
        source "$1"
        parse_args deploy
        printf "%s|%s|%s|%s\n" "$HOST" "$DOMAIN" "$KEEP" "$DNS_MODE"
      ' _ "${DEPLOY_SCRIPT}"
  )"
  assert_equals "${defaults}" "192.0.2.10|www.env.example|7|proxied" || return 1

  overrides="$(
    BUS_DEPLOY_HOST=192.0.2.10 \
    BUS_DEPLOY_DOMAIN=www.env.example \
    BUS_DEPLOY_KEEP=7 \
    BUS_DEPLOY_DNS_MODE=proxied \
      bash -c '
        source "$1"
        parse_args deploy --host 198.51.100.20 --domain www.cli.example --dns-mode direct
        printf "%s|%s|%s|%s\n" "$HOST" "$DOMAIN" "$KEEP" "$DNS_MODE"
      ' _ "${DEPLOY_SCRIPT}"
  )"
  assert_equals "${overrides}" "198.51.100.20|www.cli.example|7|direct"
}

test_require_command_uses_path() {
  local temp
  local output

  temp="$(mktemp -d)"
  mkdir -p "${temp}/bin"
  cat > "${temp}/bin/available-tool" <<'EOF'
#!/bin/sh
exit 0
EOF
  chmod +x "${temp}/bin/available-tool"

  PATH="${temp}/bin" require_command available-tool || return 1
  output="$(
    (
      PATH="${temp}/bin"
      require_command missing-tool
    ) 2>&1
  )" && {
    printf '  expected missing command to fail\n'
    return 1
  }
  assert_contains "${output}" "Required command not found: missing-tool" || return 1

  rm -rf "${temp}"
}

test_git_preflight_honors_branch_and_dirty_overrides() {
  local temp
  local output

  temp="$(mktemp -d)"
  write_fake_git "${temp}/bin"

  output="$(
    PATH="${temp}/bin:${PATH}" FAKE_GIT_BRANCH=feature FAKE_GIT_DIRTY=0 \
      REPO_ROOT="${temp}/repo" ALLOW_NON_MASTER=0 ALLOW_DIRTY=0 \
      git_preflight 2>&1
  )" && {
    printf '  expected non-master branch to fail\n'
    return 1
  }
  assert_contains "${output}" "Deployments must run from master" || return 1

  PATH="${temp}/bin:${PATH}" FAKE_GIT_BRANCH=feature FAKE_GIT_DIRTY=0 \
    REPO_ROOT="${temp}/repo" ALLOW_NON_MASTER=1 ALLOW_DIRTY=0 \
    git_preflight || return 1

  output="$(
    PATH="${temp}/bin:${PATH}" FAKE_GIT_BRANCH=master FAKE_GIT_DIRTY=1 \
      REPO_ROOT="${temp}/repo" ALLOW_NON_MASTER=0 ALLOW_DIRTY=0 \
      git_preflight 2>&1
  )" && {
    printf '  expected dirty worktree to fail\n'
    return 1
  }
  assert_contains "${output}" "Git worktree is dirty" || return 1

  PATH="${temp}/bin:${PATH}" FAKE_GIT_BRANCH=master FAKE_GIT_DIRTY=1 \
    REPO_ROOT="${temp}/repo" ALLOW_NON_MASTER=0 ALLOW_DIRTY=1 \
    git_preflight || return 1

  rm -rf "${temp}"
}

test_validate_dns_queries_both_names_and_requires_exact_host() {
  local temp
  local output
  local query_log

  temp="$(mktemp -d)"
  write_fake_dig "${temp}/bin"

  (
    export PATH="${temp}/bin:${PATH}"
    export FAKE_DIG_LOG="${temp}/queries.log"
    export FAKE_DIG_MAIN_NAME="www.busiscoming.com"
    export FAKE_DIG_BARE_NAME="busiscoming.com"
    export FAKE_DIG_MAIN_RESULT="203.0.113.4
192.0.2.10"
    export FAKE_DIG_BARE_RESULT="192.0.2.10"
    HOST="192.0.2.10"
    DOMAIN="www.busiscoming.com"
    DNS_MODE=direct
    validate_dns
  ) || return 1

  query_log="$(cat "${temp}/queries.log")"
  assert_equals "${query_log}" \
    "+short A www.busiscoming.com
+short A busiscoming.com" || return 1

  output="$(
    (
      export PATH="${temp}/bin:${PATH}"
      export FAKE_DIG_LOG="${temp}/mismatch-queries.log"
      export FAKE_DIG_MAIN_NAME="www.busiscoming.com"
      export FAKE_DIG_BARE_NAME="busiscoming.com"
      export FAKE_DIG_MAIN_RESULT="192.0.2.100"
      export FAKE_DIG_BARE_RESULT="192.0.2.10"
      HOST="192.0.2.10"
      DOMAIN="www.busiscoming.com"
      DNS_MODE=direct
      validate_dns
    ) 2>&1
  )" && {
    printf '  expected partial IPv4 match to fail\n'
    return 1
  }
  assert_contains "${output}" \
    "DNS A record for www.busiscoming.com does not include 192.0.2.10" || return 1

  rm -rf "${temp}"
}

test_validate_dns_allows_proxied_records_when_explicit() {
  local temp
  local output

  temp="$(mktemp -d)"
  write_fake_dig "${temp}/bin"

  (
    export PATH="${temp}/bin:${PATH}"
    export FAKE_DIG_LOG="${temp}/proxied-queries.log"
    export FAKE_DIG_MAIN_NAME="www.busiscoming.com"
    export FAKE_DIG_BARE_NAME="busiscoming.com"
    export FAKE_DIG_MAIN_RESULT="104.21.33.2
172.67.139.49"
    export FAKE_DIG_BARE_RESULT="104.21.33.2
172.67.139.49"
    HOST="192.0.2.10"
    DOMAIN="www.busiscoming.com"
    DNS_MODE=proxied
    validate_dns
  ) || return 1

  output="$(
    (
      export PATH="${temp}/bin:${PATH}"
      export FAKE_DIG_LOG="${temp}/empty-queries.log"
      export FAKE_DIG_MAIN_NAME="www.busiscoming.com"
      export FAKE_DIG_BARE_NAME="busiscoming.com"
      export FAKE_DIG_MAIN_RESULT=""
      export FAKE_DIG_BARE_RESULT="104.21.33.2"
      HOST="192.0.2.10"
      DOMAIN="www.busiscoming.com"
      DNS_MODE=proxied
      validate_dns
    ) 2>&1
  )" && {
    printf '  expected proxied DNS mode to reject empty records\n'
    return 1
  }
  assert_contains "${output}" "DNS A record for www.busiscoming.com is empty" || return 1

  rm -rf "${temp}"
}

test_dirty_version_marking() {
  local temp
  local clean
  local dirty
  local already_dirty
  local generated

  temp="$(mktemp -d)"
  write_fake_git "${temp}/bin"

  clean="$(
    PATH="${temp}/bin:${PATH}" FAKE_GIT_DIRTY=0 \
      mark_dirty_version "release-candidate"
  )"
  dirty="$(
    PATH="${temp}/bin:${PATH}" FAKE_GIT_DIRTY=1 \
      mark_dirty_version "release-candidate"
  )"
  already_dirty="$(
    PATH="${temp}/bin:${PATH}" FAKE_GIT_DIRTY=1 \
      mark_dirty_version "release-candidate-dirty"
  )"
  generated="$(
    PATH="${temp}/bin:${PATH}" FAKE_GIT_DIRTY=1 \
      default_version
  )"

  assert_equals "${clean}" "release-candidate" || return 1
  assert_equals "${dirty}" "release-candidate-dirty" || return 1
  assert_equals "${already_dirty}" "release-candidate-dirty" || return 1
  [[ "${generated}" =~ ^[0-9]{8}-[0-9]{6}-a07eaf4-dirty$ ]] || {
    printf '  unexpected generated version: %s\n' "${generated}"
    return 1
  }

  rm -rf "${temp}"
}

test_run_local_build_sequences_commands_from_expected_directories() {
  local temp
  local log
  local build_output_pattern

  temp="$(mktemp -d)"
  mkdir -p "${temp}/repo/frontend" "${temp}/repo/backend"
  write_fake_build_tools "${temp}/bin"

  (
    export PATH="${temp}/bin:${PATH}"
    export FAKE_BUILD_LOG="${temp}/build.log"
    export FAKE_FILE_STATIC=1
    REPO_ROOT="${temp}/repo"
    SKIP_TESTS=0
    run_local_build
  ) || return 1

  log="$(cat "${temp}/build.log")"
  assert_equals "$(sed -n '1p' "${temp}/build.log")" \
    "npm|cwd=${temp}/repo/frontend|args=ci" || return 1
  assert_equals "$(sed -n '2p' "${temp}/build.log")" \
    "npm|cwd=${temp}/repo/frontend|args=test" || return 1
  assert_equals "$(sed -n '3p' "${temp}/build.log")" \
    "npm|cwd=${temp}/repo/frontend|args=run openapi:lint" || return 1
  assert_equals "$(sed -n '4p' "${temp}/build.log")" \
    "npm|cwd=${temp}/repo/frontend|args=run openapi:routes:lint" || return 1
  assert_contains "$(sed -n '5p' "${temp}/build.log")" \
    "go|cwd=${temp}/repo/backend|cgo=|goos=|goarch=|gocache=" || return 1
  assert_contains "$(sed -n '5p' "${temp}/build.log")" \
    "/go-cache|args=test ./..." || return 1
  assert_equals "$(sed -n '6p' "${temp}/build.log")" \
    "npm|cwd=${temp}/repo/frontend|args=run build" || return 1
  assert_contains "$(sed -n '7p' "${temp}/build.log")" \
    "go|cwd=${temp}/repo/backend|cgo=0|goos=linux|goarch=amd64" || return 1
  assert_contains "$(sed -n '7p' "${temp}/build.log")" \
    "/go-cache|args=build " || return 1
  assert_contains "$(sed -n '7p' "${temp}/build.log")" \
    "|args=build -trimpath -ldflags=-s -w -o " || return 1
  assert_contains "$(sed -n '7p' "${temp}/build.log")" \
    "/busiscoming-server ./cmd/server" || return 1
  build_output_pattern="${TMPDIR:-/tmp}/busiscoming-deploy."
  assert_contains "$(sed -n '8p' "${temp}/build.log")" \
    "file|cwd=${TEST_REPO_ROOT}|args=${build_output_pattern}" || return 1
  assert_not_contains "${log}" "backend/bin" || return 1
  assert_not_contains "${log}" " --prefix " || return 1
  assert_equals "$(wc -l < "${temp}/build.log" | tr -d ' ')" "8" || return 1
  [ ! -e "${temp}/repo/backend/bin" ] || return 1

  rm -rf "${temp}"
}

test_run_local_build_skips_only_tests_when_requested() {
  local temp
  local log

  temp="$(mktemp -d)"
  mkdir -p "${temp}/repo/frontend" "${temp}/repo/backend"
  write_fake_build_tools "${temp}/bin"

  (
    export PATH="${temp}/bin:${PATH}"
    export FAKE_BUILD_LOG="${temp}/build.log"
    export FAKE_FILE_STATIC=1
    REPO_ROOT="${temp}/repo"
    SKIP_TESTS=1
    run_local_build
  ) || return 1

  log="$(cat "${temp}/build.log")"
  assert_equals "$(sed -n '1p' "${temp}/build.log")" \
    "npm|cwd=${temp}/repo/frontend|args=ci" || return 1
  assert_equals "$(sed -n '2p' "${temp}/build.log")" \
    "npm|cwd=${temp}/repo/frontend|args=run build" || return 1
  assert_contains "$(sed -n '3p' "${temp}/build.log")" "|args=build " || return 1
  assert_contains "$(sed -n '4p' "${temp}/build.log")" "file|" || return 1
  assert_equals "$(wc -l < "${temp}/build.log" | tr -d ' ')" "4" || return 1
  assert_not_contains "${log}" "openapi:lint" || return 1
  assert_not_contains "${log}" "openapi:routes:lint" || return 1
  assert_not_contains "${log}" "args=test" || return 1

  rm -rf "${temp}"
}

test_run_local_build_rejects_dynamic_linux_binary() {
  local temp
  local output

  temp="$(mktemp -d)"
  mkdir -p "${temp}/repo/frontend" "${temp}/repo/backend"
  write_fake_build_tools "${temp}/bin"

  output="$(
    (
      export PATH="${temp}/bin:${PATH}"
      export FAKE_BUILD_LOG="${temp}/build.log"
      export FAKE_FILE_STATIC=0
      REPO_ROOT="${temp}/repo"
      SKIP_TESTS=1
      run_local_build
    ) 2>&1
  )" && {
    printf '  expected dynamically linked binary to fail verification\n'
    return 1
  }
  assert_contains "${output}" "statically linked Linux x86_64 binary" || return 1

  rm -rf "${temp}"
}

test_run_local_build_preserves_existing_traps() {
  local temp
  local before
  local after

  temp="$(mktemp -d)"
  mkdir -p "${temp}/repo/frontend" "${temp}/repo/backend"
  write_fake_build_tools "${temp}/bin"

  (
    export PATH="${temp}/bin:${PATH}"
    export FAKE_BUILD_LOG="${temp}/build.log"
    export FAKE_FILE_STATIC=1
    REPO_ROOT="${temp}/repo"
    SKIP_TESTS=1
    trap ':' EXIT
    trap ':' INT
    trap ':' TERM
    before="$(trap -p EXIT INT TERM)"
    run_local_build
    after="$(trap -p EXIT INT TERM)"
    assert_equals "${after}" "${before}"
    cleanup_all
  ) || return 1

  rm -rf "${temp}"
}

test_cleanup_all_removes_build_root_and_runs_future_hook() {
  local temp

  temp="$(mktemp -d)"
  mkdir -p "${temp}/repo/frontend" "${temp}/repo/backend"
  write_fake_build_tools "${temp}/bin"

  (
    export PATH="${temp}/bin:${PATH}"
    export FAKE_BUILD_LOG="${temp}/build.log"
    export FAKE_FILE_STATIC=1
    REPO_ROOT="${temp}/repo"
    SKIP_TESTS=1
    run_local_build
    [ -d "${BUILD_ROOT}" ]
    remote_cleanup() {
      printf 'remote-cleaned\n' > "${temp}/remote-cleanup.log"
    }
    cleanup_all
    [ -z "${BUILD_ROOT}" ]
    [ "${BUILD_ROOT_OWNED}" -eq 0 ]
    [ -f "${temp}/remote-cleanup.log" ]
  ) || return 1

  rm -rf "${temp}"
}

test_cleanup_traps_are_registered_once() {
  local first
  local second

  (
    install_cleanup_traps
    first="$(trap -p EXIT INT TERM)"
    install_cleanup_traps
    second="$(trap -p EXIT INT TERM)"
    assert_equals "${second}" "${first}"
  )
}

test_run_local_build_failures_propagate_and_cleanup() {
  local temp
  local status

  temp="$(mktemp -d)"
  mkdir -p "${temp}/repo/frontend" "${temp}/repo/backend" "${temp}/tmp"
  write_fake_build_tools "${temp}/bin"

  set +e
  (
    set -euo pipefail
    export PATH="${temp}/bin:${PATH}"
    export TMPDIR="${temp}/tmp"
    export FAKE_BUILD_LOG="${temp}/npm-failure.log"
    export FAKE_NPM_FAIL_ARGS="ci"
    export FAKE_NPM_FAIL_STATUS=23
    REPO_ROOT="${temp}/repo"
    SKIP_TESTS=1
    install_cleanup_traps
    run_local_build
  )
  status=$?
  set -e
  assert_equals "${status}" "23" || return 1
  [ -z "$(find "${temp}/tmp" -mindepth 1 -maxdepth 1 -print)" ] || return 1

  set +e
  (
    set -euo pipefail
    export PATH="${temp}/bin:${PATH}"
    export TMPDIR="${temp}/tmp"
    export FAKE_BUILD_LOG="${temp}/go-failure.log"
    export FAKE_GO_FAIL_ARGS="test ./..."
    export FAKE_GO_FAIL_STATUS=24
    REPO_ROOT="${temp}/repo"
    SKIP_TESTS=0
    install_cleanup_traps
    run_local_build
  )
  status=$?
  set -e
  assert_equals "${status}" "24" || return 1
  [ -z "$(find "${temp}/tmp" -mindepth 1 -maxdepth 1 -print)" ] || return 1

  rm -rf "${temp}"
}

test_run_test_stops_after_first_failure() {
  local temp
  local output

  temp="$(mktemp -d)"
  injected_failure_test() {
    false
    printf 'continued\n' > "${temp}/continued"
  }

  output="$(run_test "injected harness failure" injected_failure_test)"
  assert_contains "${output}" "not ok - injected harness failure" || return 1
  [ ! -e "${temp}/continued" ] || {
    printf '  test continued after a failing command\n'
    return 1
  }

  rm -rf "${temp}"
}

test_apk_artifact_preparation() {
  local temp

  temp="$(mktemp -d)"
  write_apk_fixture "${temp}/input"
  mkdir -p "${temp}/build"

  (
    BUILD_ROOT="${temp}/build"
    APK_INPUT="${temp}/input/BusIsComing.apk"
    APK_METADATA_INPUT="${temp}/input/current.json"
    SKIP_APK=0
    prepare_apk_artifacts

    [ "${APK_DIR}" = "${temp}/build/apk" ]
    cmp "${APK_INPUT}" "${APK_DIR}/BusIsComing.apk"
    cmp "${APK_METADATA_INPUT}" "${APK_DIR}/current.json"
    [ -f "${APK_DIR}/BusIsComing.apk.sha256" ]
    [ -f "${APK_DIR}/current.json.sha256" ]
  ) || return 1

  (
    BUILD_ROOT="${temp}/build-skip"
    APK_INPUT="${temp}/missing.apk"
    APK_METADATA_INPUT="${temp}/missing.json"
    SKIP_APK=1
    APK_DIR="stale"
    prepare_apk_artifacts
    [ -z "${APK_DIR}" ]
  ) || return 1

  rm -rf "${temp}"
}

test_apk_artifacts_validate_staged_copies() {
  local temp
  local real_cp
  local output

  temp="$(mktemp -d)"
  write_apk_fixture "${temp}/input"
  mkdir -p "${temp}/build" "${temp}/bin"
  real_cp="$(command -v cp)"
  cat > "${temp}/bin/cp" <<'EOF'
#!/bin/sh
"${REAL_CP}" "$@"
case "${1:-}" in
  *.apk)
    printf 'tampered-after-copy\n' > "${2}"
    ;;
esac
EOF
  chmod +x "${temp}/bin/cp"

  if output="$(
    (
      export PATH="${temp}/bin:${PATH}"
      export REAL_CP="${real_cp}"
      BUILD_ROOT="${temp}/build"
      APK_INPUT="${temp}/input/BusIsComing.apk"
      APK_METADATA_INPUT="${temp}/input/current.json"
      SKIP_APK=0
      prepare_apk_artifacts
    ) 2>&1
  )"; then
    printf '  expected staged APK validation to reject a changed copy\n'
    return 1
  fi
  assert_contains "${output}" "APK input or metadata validation failed" || return 1

  rm -rf "${temp}"
}

test_release_archive_creation() {
  local temp
  local version="20260622-120000-a07eaf4"
  local archive
  local manifest
  local backend_sha
  local asset_sha
  local frontend_sha
  local frontend_lines
  local archive_sha
  local checksum_contents
  local listing
  local expected_frontend_files
  local manifest_frontend_files
  local checksum_line
  local checksum_path
  local expected_checksum
  local actual_checksum

  temp="$(mktemp -d)"
  mkdir -p "${temp}/repo/frontend/dist/assets/nested" "${temp}/build"
  printf '<!doctype html>\n' > "${temp}/repo/frontend/dist/index.html"
  printf 'asset-data\n' > "${temp}/repo/frontend/dist/assets/app.js"
  printf 'nested-data\n' > "${temp}/repo/frontend/dist/assets/nested/chunk.css"
  printf '#!/bin/sh\nexit 0\n' > "${temp}/build/busiscoming-server"
  chmod +x "${temp}/build/busiscoming-server"
  write_fake_git "${temp}/bin"

  (
    REPO_ROOT="${temp}/repo"
    BUILD_ROOT="${temp}/build"
    VERSION="${version}"
    SKIP_APK=1
    PATH="${temp}/bin:${PATH}"
    FAKE_GIT_DIRTY=0
    create_release_archive
  )

  archive="${temp}/build/release-${version}.tar.gz"
  manifest="${temp}/build/release/release-manifest.txt"
  [ -f "${archive}" ] || return 1
  [ -f "${archive}.sha256" ] || return 1
  [ -x "${temp}/build/release/backend/busiscoming-server" ] || return 1

  listing="$(tar -tzf "${archive}")"
  assert_contains "${listing}" "./frontend/dist/index.html" || return 1
  assert_contains "${listing}" "./backend/busiscoming-server" || return 1
  assert_contains "${listing}" "./release-manifest.txt" || return 1

  assert_contains "$(cat "${manifest}")" "version=${version}" || return 1
  assert_contains "$(cat "${manifest}")" "branch=master" || return 1
  assert_contains "$(cat "${manifest}")" "commit=a07eaf4a07eaf4a07eaf4a07eaf4a07eaf4a07e" || return 1
  assert_contains "$(cat "${manifest}")" "dirty=false" || return 1
  grep -E '^built_at=[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$' \
    "${manifest}" >/dev/null || return 1
  assert_contains "$(cat "${manifest}")" "target=linux/amd64" || return 1

  backend_sha="$(shasum -a 256 "${temp}/build/release/backend/busiscoming-server" | awk '{print $1}')"
  asset_sha="$(shasum -a 256 "${temp}/build/release/frontend/dist/assets/app.js" | awk '{print $1}')"
  frontend_sha="$(shasum -a 256 "${temp}/build/release/frontend/dist/index.html" | awk '{print $1}')"
  assert_contains "$(cat "${manifest}")" "backend_sha256=${backend_sha}" || return 1
  frontend_lines="$(tail -3 "${manifest}")"
  assert_contains "${frontend_lines}" \
    "${asset_sha}  frontend/dist/assets/app.js" || return 1
  assert_contains "${frontend_lines}" \
    "${frontend_sha}  frontend/dist/index.html" || return 1
  expected_frontend_files="$(
    cd "${temp}/repo"
    find frontend/dist -type f -print | LC_ALL=C sort
  )"
  manifest_frontend_files="$(
    awk 'NR > 7 { sub(/^[0-9a-f]+  /, ""); print }' "${manifest}"
  )"
  assert_equals "${manifest_frontend_files}" "${expected_frontend_files}" || return 1
  while IFS= read -r checksum_line; do
    expected_checksum="${checksum_line%% *}"
    checksum_path="${checksum_line#*  }"
    actual_checksum="$(
      shasum -a 256 "${temp}/build/release/${checksum_path}" | awk '{print $1}'
    )"
    assert_equals "${actual_checksum}" "${expected_checksum}" || return 1
  done < <(tail -n +8 "${manifest}")

  archive_sha="$(shasum -a 256 "${archive}" | awk '{print $1}')"
  checksum_contents="$(cat "${archive}.sha256")"
  assert_equals "${checksum_contents}" "${archive_sha}  $(basename "${archive}")" || return 1

  rm -rf "${temp}"
}

test_release_archive_rejects_frontend_symlink() {
  local temp
  local output
  local version="20260622-120000-a07eaf4"

  temp="$(mktemp -d)"
  mkdir -p "${temp}/repo/frontend/dist" "${temp}/build"
  printf 'external-data\n' > "${temp}/external.txt"
  printf '<!doctype html>\n' > "${temp}/repo/frontend/dist/index.html"
  ln -s "${temp}/external.txt" "${temp}/repo/frontend/dist/external.txt"
  printf '#!/bin/sh\nexit 0\n' > "${temp}/build/busiscoming-server"
  chmod +x "${temp}/build/busiscoming-server"
  write_fake_git "${temp}/bin"

  if output="$(
    (
      REPO_ROOT="${temp}/repo"
      BUILD_ROOT="${temp}/build"
      VERSION="${version}"
      SKIP_APK=1
      PATH="${temp}/bin:${PATH}"
      FAKE_GIT_DIRTY=0
      create_release_archive
    ) 2>&1
  )"; then
    printf '  expected frontend symlink to be rejected\n'
    return 1
  fi
  assert_contains "${output}" "Frontend build output contains unsupported entry" || return 1
  [ ! -e "${temp}/build/release-${version}.tar.gz" ] || return 1

  rm -rf "${temp}"
}

test_frontend_validation_fails_when_find_fails() {
  local temp
  local output
  local real_find

  temp="$(mktemp -d)"
  mkdir -p "${temp}/dist" "${temp}/bin" "${temp}/tmp"
  printf 'content\n' > "${temp}/dist/index.html"
  real_find="$(command -v find)"
  cat > "${temp}/bin/find" <<'EOF'
#!/bin/sh
printf '%s\0' "$1"
exit 42
EOF
  chmod +x "${temp}/bin/find"

  if output="$(
    (
      export PATH="${temp}/bin:${PATH}"
      export TMPDIR="${temp}/tmp"
      validate_frontend_dist_entries "${temp}/dist"
    ) 2>&1
  )"; then
    printf '  expected frontend validation to fail when find fails\n'
    return 1
  fi
  assert_contains "${output}" "Unable to inspect frontend build output" || return 1
  [ -z "$("${real_find}" "${temp}/tmp" -mindepth 1 -maxdepth 1 -print)" ] ||
    return 1

  rm -rf "${temp}"
}

test_remote_root_validation() {
  local value

  bash -c '
    source "$1"
    ROOT="/opt/busiscoming"
    validate_root
  ' _ "${REMOTE_SCRIPT}" || return 1

  for value in \
    "/opt/busiscoming" \
    "/srv/bus.is-coming_1/releases"; do
    remote_helper_succeeds validate_root "${value}" || return 1
  done

  for value in \
    "relative/root" \
    "/opt/bus iscoming" \
    "/opt/bus\$iscoming" \
    "/" \
    "/etc" \
    "/usr" \
    "/var" \
    "/home" \
    "/root" \
    "/opt//busiscoming" \
    "/opt/./busiscoming" \
    "/opt/../busiscoming"; do
    if remote_helper_succeeds validate_root "${value}" >/dev/null 2>&1; then
      printf '  expected unsafe root to fail: %s\n' "${value}"
      return 1
    fi
  done
}

test_remote_rejects_symlinked_root() {
  local temp
  local output

  temp="$(mktemp -d)"
  mkdir -p "${temp}/real-root/releases/v1"
  ln -s "${temp}/real-root" "${temp}/linked-root"

  if output="$(
    BUS_DEPLOY_TEST_MODE=1 \
      "${REMOTE_SCRIPT}" list --root "${temp}/linked-root" 2>&1
  )"; then
    printf '  expected a symlinked deployment root to fail\n'
    return 1
  fi
  assert_contains "${output}" "Unsafe deployment root" || return 1

  rm -rf "${temp}"
}

test_remote_allows_genuinely_absent_first_deploy_state() {
  local temp
  local missing_root
  local output

  temp="$(mktemp -d)"
  missing_root="${temp}/missing-root"

  output="$(
    BUS_DEPLOY_TEST_MODE=1 \
      "${REMOTE_SCRIPT}" list --root "${missing_root}"
  )" || return 1
  assert_equals "${output}" "" || return 1

  output="$(
    BUS_DEPLOY_TEST_MODE=1 \
      "${REMOTE_SCRIPT}" status --root "${missing_root}"
  )" || return 1
  assert_contains "${output}" "current: (none)" || return 1
  assert_contains "${output}" "previous: (none)" || return 1
  assert_contains "${output}" "config: (absent)" || return 1

  mkdir -p "${missing_root}"
  output="$(
    BUS_DEPLOY_TEST_MODE=1 \
      "${REMOTE_SCRIPT}" list --root "${missing_root}"
  )" || return 1
  assert_equals "${output}" "" || return 1

  rm -rf "${temp}"
}

test_remote_rejects_wrong_type_root_and_releases() {
  local temp

  temp="$(mktemp -d)"
  printf 'not a directory\n' > "${temp}/root-file"
  assert_remote_inspection_fails \
    "${temp}/root-file" "Unsafe deployment root" || return 1

  mkdir -p "${temp}/root"
  printf 'not a directory\n' > "${temp}/root/releases"
  assert_remote_inspection_fails \
    "${temp}/root" "Managed path must be a real directory" || return 1

  rm -rf "${temp}"
}

test_remote_version_and_positive_integer_validation() {
  local max_length
  local too_long
  local value

  max_length="$(printf '%128s' '' | tr ' ' a)"
  too_long="${max_length}a"

  for value in "v1" "20260622-120000_a.1" "${max_length}"; do
    remote_helper_succeeds validate_version "${value}" || return 1
  done
  for value in "" "." ".." "../v1" "has space" "v1/child" "${too_long}"; do
    if remote_helper_succeeds validate_version "${value}" >/dev/null 2>&1; then
      printf '  expected unsafe version to fail: %s\n' "${value}"
      return 1
    fi
  done

  for value in 1 3 100; do
    remote_helper_succeeds validate_positive_integer "${value}" || return 1
  done
  for value in "" 0 -1 1.5 abc; do
    if remote_helper_succeeds validate_positive_integer "${value}" >/dev/null 2>&1; then
      printf '  expected non-positive integer to fail: %s\n' "${value}"
      return 1
    fi
  done
}

test_remote_argument_allowlists_and_missing_values() {
  local temp
  local output

  temp="$(mktemp -d)"

  if output="$(BUS_DEPLOY_TEST_MODE=1 "${REMOTE_SCRIPT}" 2>&1)"; then
    printf '  expected a missing command to fail\n'
    return 1
  fi
  assert_contains "${output}" "remote command required" || return 1

  if output="$(BUS_DEPLOY_TEST_MODE=1 "${REMOTE_SCRIPT}" activate --root "${temp}" 2>&1)"; then
    printf '  expected an unknown command to fail\n'
    return 1
  fi
  assert_contains "${output}" "Unknown remote command" || return 1

  if output="$(BUS_DEPLOY_TEST_MODE=1 "${REMOTE_SCRIPT}" list --lines 5 2>&1)"; then
    printf '  expected list to reject --lines\n'
    return 1
  fi
  assert_contains "${output}" "not valid for command: list" || return 1

  if output="$(BUS_DEPLOY_TEST_MODE=1 "${REMOTE_SCRIPT}" status --service caddy 2>&1)"; then
    printf '  expected status to reject --service\n'
    return 1
  fi
  assert_contains "${output}" "not valid for command: status" || return 1

  if output="$(BUS_DEPLOY_TEST_MODE=1 "${REMOTE_SCRIPT}" logs --keep 2 2>&1)"; then
    printf '  expected logs to reject an unknown option\n'
    return 1
  fi
  assert_contains "${output}" "not valid for command: logs" || return 1

  if output="$(BUS_DEPLOY_TEST_MODE=1 "${REMOTE_SCRIPT}" list --root 2>&1)"; then
    printf '  expected a missing --root value to fail\n'
    return 1
  fi
  assert_contains "${output}" "--root requires a value" || return 1

  if output="$(
    BUS_DEPLOY_TEST_MODE=1 "${REMOTE_SCRIPT}" logs \
      --root "${temp}" --service caddy --lines 0 2>&1
  )"; then
    printf '  expected zero log lines to fail\n'
    return 1
  fi
  assert_contains "${output}" "--lines must be a positive integer" || return 1

  rm -rf "${temp}"
}

test_remote_list_marks_only_valid_absolute_links() {
  local temp
  local output

  temp="$(mktemp -d)"
  mkdir -p \
    "${temp}/releases/.v3" \
    "${temp}/releases/v1" \
    "${temp}/releases/v2" \
    "${temp}/releases/v10"
  printf 'not a release\n' > "${temp}/releases/file-entry"
  ln -s "${temp}/releases/v2" "${temp}/current"
  ln -s "${temp}/releases/v1" "${temp}/previous"
  ln -s "${temp}/releases/v1" "${temp}/releases/symlink-entry"

  output="$(BUS_DEPLOY_TEST_MODE=1 "${REMOTE_SCRIPT}" list --root "${temp}")" ||
    return 1
  assert_equals "${output}" \
    ".v3
v1 [previous]
v10
v2 [current]" || return 1
  assert_not_contains "${output}" "file-entry" || return 1
  assert_not_contains "${output}" "symlink-entry" || return 1

  rm -rf "${temp}"
}

test_remote_rejects_malformed_current_and_previous() {
  local temp
  local managed_path
  local malformed_case

  temp="$(mktemp -d)"
  mkdir -p "${temp}/root/releases/v1" "${temp}/external"
  managed_path="${temp}/root/current"

  for malformed_case in \
    file \
    directory \
    relative_link \
    outside_link \
    dangling_link \
    malformed_link; do
    rm -rf "${managed_path}"
    case "${malformed_case}" in
      file)
        printf 'not a link\n' > "${managed_path}"
        ;;
      directory)
        mkdir -p "${managed_path}"
        ;;
      relative_link)
        ln -s "releases/v1" "${managed_path}"
        ;;
      outside_link)
        ln -s "${temp}/external" "${managed_path}"
        ;;
      dangling_link)
        ln -s "${temp}/root/releases/missing" "${managed_path}"
        ;;
      malformed_link)
        ln -s "${temp}/root/releases/v1/child" "${managed_path}"
        ;;
    esac
    assert_remote_inspection_fails \
      "${temp}/root" "Managed link" || return 1
  done

  rm -rf "${managed_path}"
  printf 'not a link\n' > "${temp}/root/previous"
  assert_remote_inspection_fails \
    "${temp}/root" "Managed link" || return 1

  rm -rf "${temp}"
}

test_remote_list_rejects_invalid_managed_release_targets() {
  local temp
  local output

  temp="$(mktemp -d)"
  mkdir -p "${temp}/releases"
  ln -s "${temp}/releases/missing" "${temp}/current"

  if output="$(
    BUS_DEPLOY_TEST_MODE=1 "${REMOTE_SCRIPT}" list --root "${temp}" 2>&1
  )"; then
    printf '  expected a dangling managed release link to fail\n'
    return 1
  fi
  assert_contains "${output}" "Managed link target is not a real release directory" ||
    return 1

  rm "${temp}/current"
  mkdir -p "${temp}/external"
  ln -s "${temp}/external" "${temp}/releases/v1"
  ln -s "${temp}/releases/v1" "${temp}/current"

  if output="$(
    BUS_DEPLOY_TEST_MODE=1 "${REMOTE_SCRIPT}" list --root "${temp}" 2>&1
  )"; then
    printf '  expected a symlinked release directory to fail\n'
    return 1
  fi
  assert_contains "${output}" "Managed link target is not a real release directory" ||
    return 1

  rm -rf "${temp}"
}

test_remote_list_rejects_symlinked_releases_directory() {
  local temp
  local output

  temp="$(mktemp -d)"
  mkdir -p "${temp}/root" "${temp}/external-releases/v1"
  ln -s "${temp}/external-releases" "${temp}/root/releases"
  ln -s "${temp}/root/releases/v1" "${temp}/root/current"

  if output="$(
    BUS_DEPLOY_TEST_MODE=1 \
      "${REMOTE_SCRIPT}" list --root "${temp}/root" 2>&1
  )"; then
    printf '  expected a symlinked releases directory to fail\n'
    return 1
  fi
  assert_contains "${output}" "Managed path must be a real directory" || return 1
  assert_contains "${output}" "${temp}/root/releases" || return 1

  rm -rf "${temp}"
}

test_remote_logs_validates_service_and_maps_units() {
  local temp
  local output
  local log

  temp="$(mktemp -d)"
  write_fake_remote_commands "${temp}/bin"

  if output="$(
    PATH="${temp}/bin:/usr/bin:/bin" \
      BUS_DEPLOY_TEST_MODE=1 \
      "${REMOTE_SCRIPT}" logs --root "${temp}" --service invalid 2>&1
  )"; then
    printf '  expected invalid log service to fail\n'
    return 1
  fi
  assert_contains "${output}" "backend or caddy" || return 1

  : > "${temp}/remote.log"
  PATH="${temp}/bin:/usr/bin:/bin" \
    FAKE_REMOTE_LOG="${temp}/remote.log" \
    BUS_DEPLOY_TEST_BIN="${temp}/bin" \
    BUS_DEPLOY_TEST_MODE=1 \
    "${REMOTE_SCRIPT}" logs --root "${temp}" --service backend --lines 25 \
    >/dev/null || return 1
  PATH="${temp}/bin:/usr/bin:/bin" \
    FAKE_REMOTE_LOG="${temp}/remote.log" \
    BUS_DEPLOY_TEST_BIN="${temp}/bin" \
    BUS_DEPLOY_TEST_MODE=1 \
    "${REMOTE_SCRIPT}" logs --root "${temp}" --service caddy \
    >/dev/null || return 1

  log="$(cat "${temp}/remote.log")"
  assert_equals "${log}" \
    "journalctl|-u busiscoming-backend -n 25 --no-pager
journalctl|-u caddy -n 100 --no-pager" || return 1

  rm -rf "${temp}"
}

test_remote_test_mode_rejects_system_commands_and_skips_without_fakes() {
  local temp
  local output

  temp="$(mktemp -d)"
  write_remote_config "${temp}"
  write_fake_remote_commands "${temp}/guard-bin"
  : > "${temp}/guard.log"

  /bin/bash -c '
    source "$1"
    TEST_MODE=1
    TEST_BIN=""
    PATH="/usr/bin:/bin"
    ! test_command_path curl >/dev/null 2>&1
  ' _ "${REMOTE_SCRIPT}" || return 1

  output="$(
    PATH="${temp}/guard-bin:/usr/bin:/bin" \
      FAKE_REMOTE_LOG="${temp}/guard.log" \
      BUS_DEPLOY_TEST_MODE=1 \
      /bin/bash "${REMOTE_SCRIPT}" status --root "${temp}"
  )" || return 1

  assert_contains "${output}" "backend: skipped (test command unavailable)" ||
    return 1
  assert_contains "${output}" "caddy: skipped (test command unavailable)" ||
    return 1
  assert_contains "${output}" "local health: skipped (test command unavailable)" ||
    return 1
  assert_contains "${output}" "main HTTPS: skipped (test command unavailable)" ||
    return 1
  assert_contains "${output}" "bare URL: skipped (test command unavailable)" ||
    return 1
  [ ! -s "${temp}/guard.log" ] || {
    printf '  test mode executed a PATH command without explicit injection\n'
    return 1
  }

  if output="$(
    PATH="${temp}/guard-bin:/usr/bin:/bin" \
      FAKE_REMOTE_LOG="${temp}/guard.log" \
      BUS_DEPLOY_TEST_MODE=1 \
      /bin/bash "${REMOTE_SCRIPT}" logs \
        --root "${temp}" --service backend 2>&1
  )"; then
    printf '  expected test logs without fake journalctl to fail\n'
    return 1
  fi
  assert_contains "${output}" \
    "Test mode requires an injected fake journalctl command" || return 1
  [ ! -s "${temp}/guard.log" ] || {
    printf '  test logs executed a PATH command without explicit injection\n'
    return 1
  }

  rm -rf "${temp}"
}

test_remote_test_mode_rejects_physical_system_bin_aliases() {
  local temp
  local alias_path

  temp="$(mktemp -d)"
  mkdir -p "${temp}/aliases"
  ln -s / "${temp}/aliases/root"
  ln -s /usr/bin "${temp}/aliases/system-bin"

  for alias_path in \
    "${temp}/aliases/root/usr/bin" \
    "${temp}/aliases/system-bin"; do
    if BUS_DEPLOY_TEST_BIN="${alias_path}" \
      PATH="${alias_path}:/usr/bin:/bin" \
      bash -c 'source "$1"; test_command_path true' \
        _ "${REMOTE_SCRIPT}" >/dev/null 2>&1; then
      printf '  expected physical system bin alias to be rejected: %s\n' \
        "${alias_path}"
      return 1
    fi
  done

  rm -rf "${temp}"
}

test_remote_test_mode_rejects_symlinked_fake_command() {
  local temp
  local output

  temp="$(mktemp -d)"
  mkdir -p "${temp}/bin"
  ln -s /usr/bin/true "${temp}/bin/journalctl"

  if output="$(
    PATH="${temp}/bin:/usr/bin:/bin" \
      BUS_DEPLOY_TEST_BIN="${temp}/bin" \
      BUS_DEPLOY_TEST_MODE=1 \
      "${REMOTE_SCRIPT}" logs \
        --root "${temp}" --service backend 2>&1
  )"; then
    printf '  expected a symlinked fake command to be rejected\n'
    return 1
  fi
  assert_contains "${output}" \
    "Test mode requires an injected fake journalctl command" || return 1

  rm -rf "${temp}"
}

test_remote_config_loader_rejects_unsafe_files() {
  local temp
  local output
  local case_name

  temp="$(mktemp -d)"
  mkdir -p "${temp}/shared/deploy"

  for case_name in duplicate unknown malformed unsafe_domain mismatched_root bad_keep malicious; do
    case "${case_name}" in
      duplicate)
        cat > "${temp}/shared/deploy/config.env" <<EOF
DOMAIN=www.busiscoming.com
DOMAIN=www.duplicate.example
BARE_DOMAIN=busiscoming.com
DEPLOY_ROOT=${temp}
KEEP=3
EOF
        ;;
      unknown)
        cat > "${temp}/shared/deploy/config.env" <<EOF
DOMAIN=www.busiscoming.com
BARE_DOMAIN=busiscoming.com
DEPLOY_ROOT=${temp}
KEEP=3
TOKEN=secret
EOF
        ;;
      malformed)
        printf 'DOMAIN www.busiscoming.com\n' > "${temp}/shared/deploy/config.env"
        ;;
      unsafe_domain)
        write_remote_config "${temp}" "www.busiscoming.com;id"
        ;;
      mismatched_root)
        write_remote_config "${temp}" \
          "www.busiscoming.com" "busiscoming.com" "/opt/other"
        ;;
      bad_keep)
        write_remote_config "${temp}" \
          "www.busiscoming.com" "busiscoming.com" "${temp}" "0"
        ;;
      malicious)
        cat > "${temp}/shared/deploy/config.env" <<EOF
DOMAIN=\$(touch ${temp}/executed)
BARE_DOMAIN=busiscoming.com
DEPLOY_ROOT=${temp}
KEEP=3
EOF
        ;;
    esac

    if output="$(
      BUS_DEPLOY_TEST_MODE=1 "${REMOTE_SCRIPT}" status --root "${temp}" 2>&1
    )"; then
      printf '  expected unsafe config case to fail: %s\n' "${case_name}"
      return 1
    fi
    assert_contains "${output}" "config" || return 1
    [ ! -e "${temp}/executed" ] || {
      printf '  config content was executed\n'
      return 1
    }
  done

  rm -rf "${temp}"
}

test_remote_config_loader_rejects_dangling_symlink() {
  local temp
  local output

  temp="$(mktemp -d)"
  mkdir -p "${temp}/empty-bin" "${temp}/shared/deploy"
  ln -s "${temp}/missing-config.env" "${temp}/shared/deploy/config.env"

  if output="$(
    PATH="${temp}/empty-bin" \
      BUS_DEPLOY_TEST_MODE=1 \
      /bin/bash "${REMOTE_SCRIPT}" status --root "${temp}" 2>&1
  )"; then
    printf '  expected a dangling config symlink to fail\n'
    return 1
  fi
  assert_contains "${output}" "Invalid deployment config" || return 1

  rm -rf "${temp}"
}

test_remote_config_loader_rejects_symlinked_parent_paths() {
  local temp
  local output
  local parent_case

  temp="$(mktemp -d)"
  mkdir -p "${temp}/root" "${temp}/external/shared/deploy"
  cat > "${temp}/external/shared/deploy/config.env" <<EOF
DOMAIN=www.busiscoming.com
BARE_DOMAIN=busiscoming.com
DEPLOY_ROOT=${temp}/root
KEEP=3
EOF

  for parent_case in shared deploy; do
    rm -rf "${temp}/root/shared"
    case "${parent_case}" in
      shared)
        ln -s "${temp}/external/shared" "${temp}/root/shared"
        ;;
      deploy)
        mkdir -p "${temp}/root/shared"
        ln -s \
          "${temp}/external/shared/deploy" \
          "${temp}/root/shared/deploy"
        ;;
    esac

    if output="$(
      BUS_DEPLOY_TEST_MODE=1 \
        "${REMOTE_SCRIPT}" status --root "${temp}/root" 2>&1
    )"; then
      printf '  expected symlinked config parent to fail: %s\n' "${parent_case}"
      return 1
    fi
    assert_contains "${output}" "Managed path must be a real directory" ||
      return 1
  done

  rm -rf "${temp}"
}

test_remote_config_loader_rejects_wrong_type_paths() {
  local temp
  local output
  local wrong_type

  temp="$(mktemp -d)"
  mkdir -p "${temp}/root"

  for wrong_type in shared deploy config; do
    rm -rf "${temp}/root/shared"
    case "${wrong_type}" in
      shared)
        printf 'not a directory\n' > "${temp}/root/shared"
        ;;
      deploy)
        mkdir -p "${temp}/root/shared"
        printf 'not a directory\n' > "${temp}/root/shared/deploy"
        ;;
      config)
        mkdir -p "${temp}/root/shared/deploy/config.env"
        ;;
    esac

    if output="$(
      BUS_DEPLOY_TEST_MODE=1 \
        "${REMOTE_SCRIPT}" status --root "${temp}/root" 2>&1
    )"; then
      printf '  expected wrong-type config path to fail: %s\n' "${wrong_type}"
      return 1
    fi
    case "${wrong_type}" in
      shared|deploy)
        assert_contains "${output}" "Managed path must be a real directory" ||
          return 1
        ;;
      config)
        assert_contains "${output}" "Invalid deployment config" || return 1
        ;;
    esac
  done

  rm -rf "${temp}"
}

test_remote_config_requires_www_domain_and_matching_bare_domain() {
  local temp
  local output
  local config_case

  temp="$(mktemp -d)"

  for config_case in non_www empty_www mismatched_bare; do
    case "${config_case}" in
      non_www)
        write_remote_config "${temp}" "api.busiscoming.com" "busiscoming.com"
        ;;
      empty_www)
        write_remote_config "${temp}" "www." "busiscoming.com"
        ;;
      mismatched_bare)
        write_remote_config \
          "${temp}" "www.busiscoming.com" "other.example"
        ;;
    esac

    if output="$(
      BUS_DEPLOY_TEST_MODE=1 \
        "${REMOTE_SCRIPT}" status --root "${temp}" 2>&1
    )"; then
      printf '  expected invalid domain relationship to fail: %s\n' \
        "${config_case}"
      return 1
    fi
    assert_contains "${output}" "Invalid deployment config" || return 1
  done

  rm -rf "${temp}"
}

test_remote_status_uses_fake_checks_and_prints_config() {
  local temp
  local output
  local log

  temp="$(mktemp -d)"
  mkdir -p "${temp}/releases/v1" "${temp}/releases/v2"
  ln -s "${temp}/releases/v2" "${temp}/current"
  ln -s "${temp}/releases/v1" "${temp}/previous"
  write_remote_config "${temp}"
  write_fake_remote_commands "${temp}/bin"
  : > "${temp}/remote.log"

  output="$(
    PATH="${temp}/bin:/usr/bin:/bin" \
      FAKE_REMOTE_LOG="${temp}/remote.log" \
      FAKE_DOMAIN="www.busiscoming.com" \
      FAKE_BARE_DOMAIN="busiscoming.com" \
      BUS_DEPLOY_TEST_BIN="${temp}/bin" \
      BUS_DEPLOY_TEST_MODE=1 \
      "${REMOTE_SCRIPT}" status --root "${temp}"
  )" || return 1

  assert_contains "${output}" "current: v2" || return 1
  assert_contains "${output}" "previous: v1" || return 1
  assert_contains "${output}" "domain: www.busiscoming.com" || return 1
  assert_contains "${output}" "bare domain: busiscoming.com" || return 1
  assert_contains "${output}" "deploy root: ${temp}" || return 1
  assert_contains "${output}" "keep: 3" || return 1
  assert_contains "${output}" "backend: active" || return 1
  assert_contains "${output}" "caddy: active" || return 1
  assert_contains "${output}" "local health: ok" || return 1
  assert_contains "${output}" "main HTTPS: ok" || return 1
  assert_contains "${output}" "bare URL: ok" || return 1

  log="$(cat "${temp}/remote.log")"
  assert_contains "${log}" "systemctl|is-active busiscoming-backend" || return 1
  assert_contains "${log}" "systemctl|is-active caddy" || return 1
  assert_contains "${log}" "http://127.0.0.1:8080/healthz" || return 1
  assert_contains "${log}" "https://www.busiscoming.com/" || return 1
  assert_contains "${log}" "https://busiscoming.com/" || return 1
  assert_equals "$(wc -l < "${temp}/remote.log" | tr -d ' ')" "5" || return 1

  rm -rf "${temp}"
}

test_remote_status_skips_public_checks_without_config() {
  local temp
  local output
  local log

  temp="$(mktemp -d)"
  write_fake_remote_commands "${temp}/bin"
  : > "${temp}/remote.log"

  output="$(
    PATH="${temp}/bin:/usr/bin:/bin" \
      FAKE_REMOTE_LOG="${temp}/remote.log" \
      BUS_DEPLOY_TEST_BIN="${temp}/bin" \
      BUS_DEPLOY_TEST_MODE=1 \
      "${REMOTE_SCRIPT}" status --root "${temp}"
  )" || return 1

  assert_contains "${output}" "current: (none)" || return 1
  assert_contains "${output}" "previous: (none)" || return 1
  assert_contains "${output}" "config: (absent)" || return 1
  assert_not_contains "${output}" "main HTTPS:" || return 1
  assert_not_contains "${output}" "bare URL:" || return 1

  log="$(cat "${temp}/remote.log")"
  assert_equals "$(wc -l < "${temp}/remote.log" | tr -d ' ')" "3" || return 1
  assert_not_contains "${log}" "https://" || return 1

  rm -rf "${temp}"
}

test_remote_status_fails_required_checks() {
  local temp
  local output
  local failure_case

  temp="$(mktemp -d)"
  write_remote_config "${temp}"
  write_fake_remote_commands "${temp}/bin"

  for failure_case in backend caddy local main bare; do
    : > "${temp}/remote.log"
    if output="$(
      PATH="${temp}/bin:/usr/bin:/bin" \
        FAKE_REMOTE_LOG="${temp}/remote.log" \
        FAKE_DOMAIN="www.busiscoming.com" \
        FAKE_BARE_DOMAIN="busiscoming.com" \
        BUS_DEPLOY_TEST_BIN="${temp}/bin" \
        FAKE_BACKEND_STATE="$(
          [ "${failure_case}" = "backend" ] && printf inactive || printf active
        )" \
        FAKE_CADDY_STATE="$(
          [ "${failure_case}" = "caddy" ] && printf inactive || printf active
        )" \
        FAKE_LOCAL_HEALTH="$(
          [ "${failure_case}" = "local" ] && printf fail || printf ok
        )" \
        FAKE_MAIN_HEALTH="$(
          [ "${failure_case}" = "main" ] && printf fail || printf ok
        )" \
        FAKE_BARE_HEALTH="$(
          [ "${failure_case}" = "bare" ] && printf fail || printf ok
        )" \
        BUS_DEPLOY_TEST_MODE=1 \
        "${REMOTE_SCRIPT}" status --root "${temp}" 2>&1
    )"; then
      printf '  expected status failure for: %s\n' "${failure_case}"
      return 1
    fi
    assert_contains "${output}" "failed" || return 1
  done

  rm -rf "${temp}"
}

test_remote_production_status_runs_checks_and_fails_closed() {
  local temp
  local output
  local log

  temp="$(mktemp -d)"
  write_fake_remote_commands "${temp}/bin"
  : > "${temp}/remote.log"

  if output="$(
    PATH="${temp}/bin:/usr/bin:/bin" \
      FAKE_REMOTE_LOG="${temp}/remote.log" \
      FAKE_BACKEND_STATE="inactive" \
      BUS_DEPLOY_TEST_MODE=0 \
      "${REMOTE_SCRIPT}" status --root "${temp}" 2>&1
  )"; then
    printf '  expected production status to fail on inactive backend\n'
    return 1
  fi

  assert_contains "${output}" "backend: inactive (failed)" || return 1
  assert_contains "${output}" "caddy: active" || return 1
  assert_contains "${output}" "local health: ok" || return 1
  log="$(cat "${temp}/remote.log")"
  assert_contains "${log}" "systemctl|is-active busiscoming-backend" || return 1
  assert_contains "${log}" "systemctl|is-active caddy" || return 1
  assert_contains "${log}" "http://127.0.0.1:8080/healthz" || return 1

  rm -rf "${temp}"
}

test_remote_renders_systemd_caddy_and_environment() {
  local temp
  local env_file
  local service_file
  local caddy_file
  local original_env

  temp="$(mktemp -d)"
  BUS_DEPLOY_TEST_MODE=1 \
    BUS_DEPLOY_ETC_ROOT="${temp}" \
    "${REMOTE_SCRIPT}" render-config \
      --root "${temp}/opt/busiscoming" \
      --domain www.busiscoming.com \
      --bare-domain busiscoming.com

  env_file="${temp}/opt/busiscoming/shared/env/backend.env"
  service_file="${temp}/etc/systemd/system/busiscoming-backend.service"
  caddy_file="${temp}/etc/caddy/Caddyfile"

  grep -F "BUS_HTTP_HOST=127.0.0.1" "${env_file}" >/dev/null
  grep -F "PORT=8080" "${env_file}" >/dev/null
  grep -F \
    "BUS_DOWNLOAD_ROOT=${temp}/opt/busiscoming/shared/downloads/android" \
    "${env_file}" >/dev/null
  grep -F "ROUTE_QUERY_TOKEN_SECRET=test-only-secret" "${env_file}" >/dev/null

  grep -F "User=busiscoming" "${service_file}" >/dev/null
  grep -F \
    "ExecStart=${temp}/opt/busiscoming/current/backend/busiscoming-server" \
    "${service_file}" >/dev/null
  grep -F "NoNewPrivileges=true" "${service_file}" >/dev/null
  grep -F "ProtectSystem=strict" "${service_file}" >/dev/null

  grep -F "reverse_proxy 127.0.0.1:8080" "${caddy_file}" >/dev/null
  grep -F \
    "redir https://www.busiscoming.com{uri} permanent" \
    "${caddy_file}" >/dev/null
  grep -F \
    "root * ${temp}/opt/busiscoming/current/frontend/dist" \
    "${caddy_file}" >/dev/null
  grep -F "try_files {path} /index.html" "${caddy_file}" >/dev/null

  original_env="$(cat "${env_file}")"
  BUS_DEPLOY_TEST_MODE=1 \
    BUS_DEPLOY_ETC_ROOT="${temp}" \
    "${REMOTE_SCRIPT}" render-config \
      --root "${temp}/opt/busiscoming" \
      --domain www.busiscoming.com \
      --bare-domain busiscoming.com
  assert_equals "$(cat "${env_file}")" "${original_env}" || return 1

  rm -rf "${temp}"
}

test_remote_render_config_is_test_only_and_validates_domains() {
  local temp
  local output

  temp="$(mktemp -d)"

  if output="$(
    BUS_DEPLOY_ETC_ROOT="${temp}" \
      "${REMOTE_SCRIPT}" render-config \
        --root "${temp}/root" \
        --domain www.busiscoming.com \
        --bare-domain busiscoming.com 2>&1
  )"; then
    printf '  expected production render-config to fail\n'
    return 1
  fi
  assert_contains "${output}" "only in test mode" || return 1

  if output="$(
    BUS_DEPLOY_TEST_MODE=1 \
      BUS_DEPLOY_ETC_ROOT="${temp}" \
      "${REMOTE_SCRIPT}" render-config \
        --root "${temp}/root" \
        --domain www.busiscoming.com \
        --bare-domain other.example 2>&1
  )"; then
    printf '  expected mismatched domains to fail\n'
    return 1
  fi
  assert_contains "${output}" "Bare domain must match domain" || return 1

  rm -rf "${temp}"
}

test_remote_caddy_config_restores_previous_file_on_reload_failure() {
  local temp
  local output

  temp="$(mktemp -d)"
  mkdir -p "${temp}/bin" "${temp}/etc/caddy"
  printf 'old configuration\n' > "${temp}/etc/caddy/Caddyfile"
  cat > "${temp}/bin/caddy" <<'EOF'
#!/bin/sh
exit 0
EOF
  cat > "${temp}/bin/systemctl" <<'EOF'
#!/bin/sh
exit 1
EOF
  chmod +x "${temp}/bin/caddy" "${temp}/bin/systemctl"

  if output="$(
    PATH="${temp}/bin:/usr/bin:/bin" \
      bash -c '
        source "$1"
        TEST_MODE=0
        ETC_ROOT="$2"
        ROOT="$2/opt/busiscoming"
        DOMAIN="www.busiscoming.com"
        BARE_DOMAIN="busiscoming.com"
        install_caddy_config
      ' _ "${REMOTE_SCRIPT}" "${temp}" 2>&1
  )"; then
    printf '  expected failed Caddy reload to fail\n'
    return 1
  fi
  assert_contains "${output}" "previous configuration restored" || return 1
  assert_equals "$(cat "${temp}/etc/caddy/Caddyfile")" \
    "old configuration" || return 1

  rm -rf "${temp}"
}

test_remote_port_and_ufw_guards_are_non_destructive() {
  local temp
  local output
  local log

  temp="$(mktemp -d)"
  mkdir -p "${temp}/bin"
  cat > "${temp}/bin/ss" <<'EOF'
#!/bin/sh
printf '%s\n' 'State Recv-Q Send-Q Local Address:Port Peer Address:Port Process'
printf '%s\n' "${FAKE_SS_LINE:-}"
EOF
  cat > "${temp}/bin/ufw" <<'EOF'
#!/bin/sh
printf 'ufw|%s\n' "$*" >> "${FAKE_UFW_LOG}"
if [ "${1:-}" = "status" ]; then
  printf 'Status: %s\n' "${FAKE_UFW_STATUS:-inactive}"
fi
EOF
  chmod +x "${temp}/bin/ss" "${temp}/bin/ufw"

  if output="$(
    PATH="${temp}/bin:/usr/bin:/bin" \
      FAKE_SS_LINE='LISTEN 0 4096 0.0.0.0:80 0.0.0.0:* users:(("nginx",pid=1,fd=1))' \
      bash -c 'source "$1"; TEST_MODE=0; check_public_ports' \
        _ "${REMOTE_SCRIPT}" 2>&1
  )"; then
    printf '  expected non-Caddy port listener to fail\n'
    return 1
  fi
  assert_contains "${output}" "non-Caddy process" || return 1

  PATH="${temp}/bin:/usr/bin:/bin" \
    FAKE_SS_LINE='LISTEN 0 4096 0.0.0.0:80 0.0.0.0:* users:(("caddy",pid=1,fd=1))' \
    bash -c 'source "$1"; TEST_MODE=0; check_public_ports' \
      _ "${REMOTE_SCRIPT}" || return 1

  : > "${temp}/ufw.log"
  PATH="${temp}/bin:/usr/bin:/bin" \
    FAKE_UFW_LOG="${temp}/ufw.log" \
    FAKE_UFW_STATUS=active \
    bash -c 'source "$1"; TEST_MODE=0; configure_ufw' \
      _ "${REMOTE_SCRIPT}" || return 1
  log="$(cat "${temp}/ufw.log")"
  assert_contains "${log}" "ufw|allow OpenSSH" || return 1
  assert_contains "${log}" "ufw|allow Caddy Full" || return 1

  : > "${temp}/ufw.log"
  PATH="${temp}/bin:/usr/bin:/bin" \
    FAKE_UFW_LOG="${temp}/ufw.log" \
    FAKE_UFW_STATUS=inactive \
    bash -c 'source "$1"; TEST_MODE=0; configure_ufw' \
      _ "${REMOTE_SCRIPT}" || return 1
  assert_equals "$(cat "${temp}/ufw.log")" "ufw|status" || return 1

  rm -rf "${temp}"
}

test_remote_deploy_installs_first_release_and_apk() {
  local temp
  local current_target
  local log

  temp="$(mktemp -d)"
  write_release_fixture "${temp}" "v1"
  write_apk_fixture "${temp}/apk"
  write_fake_deployment_commands "${temp}/bin"
  : > "${temp}/deploy.log"

  PATH="${temp}/bin:/usr/bin:/bin" \
    FAKE_DEPLOY_LOG="${temp}/deploy.log" \
    FAKE_DOMAIN="www.busiscoming.com" \
    FAKE_BARE_DOMAIN="busiscoming.com" \
    BUS_DEPLOY_TEST_BIN="${temp}/bin" \
    BUS_DEPLOY_TEST_MODE=1 \
    BUS_DEPLOY_ETC_ROOT="${temp}/etc-root" \
    "${REMOTE_SCRIPT}" deploy \
      --root "${temp}/root" \
      --domain www.busiscoming.com \
      --bare-domain busiscoming.com \
      --keep 3 \
      --version v1 \
      --archive "${temp}/release-v1.tar.gz" \
      --archive-sha "${temp}/release-v1.tar.gz.sha256" \
      --apk-dir "${temp}/apk" || return 1

  current_target="$(readlink "${temp}/root/current")"
  assert_equals "$(basename "${current_target}")" "v1" || return 1
  [ -f "${temp}/root/releases/v1/frontend/dist/index.html" ] || return 1
  [ -x "${temp}/root/releases/v1/backend/busiscoming-server" ] || return 1
  [ -f "${temp}/root/shared/downloads/android/BusIsComing.apk" ] || return 1
  [ -f "${temp}/root/shared/downloads/android/current.json" ] || return 1
  [ ! -e "${temp}/root/previous" ] || return 1
  log="$(cat "${temp}/deploy.log")"
  assert_contains "${log}" "systemctl|restart busiscoming-backend" || return 1
  assert_contains "${log}" "curl|--fail --silent --show-error --max-time 5 http://127.0.0.1:8080/healthz" || return 1

  rm -rf "${temp}"
}

test_remote_deploy_restores_code_on_health_failure() {
  local temp
  local output

  temp="$(mktemp -d)"
  write_release_fixture "${temp}" "v1"
  write_release_fixture "${temp}" "v2"
  write_apk_fixture "${temp}/apk"
  write_fake_deployment_commands "${temp}/bin"
  : > "${temp}/deploy.log"

  PATH="${temp}/bin:/usr/bin:/bin" \
    FAKE_DEPLOY_LOG="${temp}/deploy.log" \
    FAKE_DOMAIN="www.busiscoming.com" \
    FAKE_BARE_DOMAIN="busiscoming.com" \
    BUS_DEPLOY_TEST_BIN="${temp}/bin" \
    BUS_DEPLOY_TEST_MODE=1 \
    BUS_DEPLOY_ETC_ROOT="${temp}/etc-root" \
    "${REMOTE_SCRIPT}" deploy \
      --root "${temp}/root" \
      --domain www.busiscoming.com \
      --bare-domain busiscoming.com \
      --keep 3 \
      --version v1 \
      --archive "${temp}/release-v1.tar.gz" \
      --archive-sha "${temp}/release-v1.tar.gz.sha256" \
      --apk-dir "${temp}/apk" || return 1

  if output="$(
    PATH="${temp}/bin:/usr/bin:/bin" \
      FAKE_DEPLOY_LOG="${temp}/deploy.log" \
      FAKE_DOMAIN="www.busiscoming.com" \
      FAKE_BARE_DOMAIN="busiscoming.com" \
      FAKE_DEPLOY_MAIN=fail \
      BUS_DEPLOY_TEST_BIN="${temp}/bin" \
      BUS_DEPLOY_TEST_MODE=1 \
      BUS_DEPLOY_ETC_ROOT="${temp}/etc-root" \
      "${REMOTE_SCRIPT}" deploy \
        --root "${temp}/root" \
        --domain www.busiscoming.com \
        --bare-domain busiscoming.com \
        --keep 3 \
        --version v2 \
        --archive "${temp}/release-v2.tar.gz" \
        --archive-sha "${temp}/release-v2.tar.gz.sha256" \
        --apk-dir "${temp}/apk" 2>&1
  )"; then
    printf '  expected health failure to abort deployment\n'
    return 1
  fi

  assert_contains "${output}" "previous release restored" || return 1
  assert_equals "$(basename "$(readlink "${temp}/root/current")")" "v1" || return 1
  [ ! -e "${temp}/root/previous" ] || return 1
  [ -d "${temp}/root/releases/v2" ] || return 1
  [ -f "${temp}/root/shared/downloads/android/BusIsComing.apk" ] || return 1

  rm -rf "${temp}"
}

test_remote_deploy_without_apk_requires_existing_valid_apk() {
  local temp
  local output

  temp="$(mktemp -d)"
  write_release_fixture "${temp}" "v1"
  write_release_fixture "${temp}" "v2"
  write_apk_fixture "${temp}/apk"
  write_fake_deployment_commands "${temp}/bin"
  : > "${temp}/deploy.log"

  if output="$(
    PATH="${temp}/bin:/usr/bin:/bin" \
      FAKE_DEPLOY_LOG="${temp}/deploy.log" \
      FAKE_DOMAIN="www.busiscoming.com" \
      FAKE_BARE_DOMAIN="busiscoming.com" \
      BUS_DEPLOY_TEST_BIN="${temp}/bin" \
      BUS_DEPLOY_TEST_MODE=1 \
      BUS_DEPLOY_ETC_ROOT="${temp}/etc-root" \
      "${REMOTE_SCRIPT}" deploy \
        --root "${temp}/root" \
        --domain www.busiscoming.com \
        --bare-domain busiscoming.com \
        --keep 3 \
        --version v1 \
        --archive "${temp}/release-v1.tar.gz" \
        --archive-sha "${temp}/release-v1.tar.gz.sha256" 2>&1
  )"; then
    printf '  expected first deployment without APK to fail\n'
    return 1
  fi
  assert_contains "${output}" "APK directory is missing or unsafe" || return 1

  PATH="${temp}/bin:/usr/bin:/bin" \
    FAKE_DEPLOY_LOG="${temp}/deploy.log" \
    FAKE_DOMAIN="www.busiscoming.com" \
    FAKE_BARE_DOMAIN="busiscoming.com" \
    BUS_DEPLOY_TEST_BIN="${temp}/bin" \
    BUS_DEPLOY_TEST_MODE=1 \
    BUS_DEPLOY_ETC_ROOT="${temp}/etc-root" \
    "${REMOTE_SCRIPT}" deploy \
      --root "${temp}/root" \
      --domain www.busiscoming.com \
      --bare-domain busiscoming.com \
      --keep 3 \
      --version v1 \
      --archive "${temp}/release-v1.tar.gz" \
      --archive-sha "${temp}/release-v1.tar.gz.sha256" \
      --apk-dir "${temp}/apk" || return 1

  PATH="${temp}/bin:/usr/bin:/bin" \
    FAKE_DEPLOY_LOG="${temp}/deploy.log" \
    FAKE_DOMAIN="www.busiscoming.com" \
    FAKE_BARE_DOMAIN="busiscoming.com" \
    BUS_DEPLOY_TEST_BIN="${temp}/bin" \
    BUS_DEPLOY_TEST_MODE=1 \
    BUS_DEPLOY_ETC_ROOT="${temp}/etc-root" \
    "${REMOTE_SCRIPT}" deploy \
      --root "${temp}/root" \
      --domain www.busiscoming.com \
      --bare-domain busiscoming.com \
      --keep 3 \
      --version v2 \
      --archive "${temp}/release-v2.tar.gz" \
      --archive-sha "${temp}/release-v2.tar.gz.sha256" || return 1

  assert_equals "$(basename "$(readlink "${temp}/root/current")")" "v2" || return 1
  assert_equals "$(basename "$(readlink "${temp}/root/previous")")" "v1" || return 1
  [ -f "${temp}/root/shared/downloads/android/BusIsComing.apk" ] || return 1

  rm -rf "${temp}"
}

test_remote_deploy_creates_runtime_user_before_group_owned_directories() {
  local temp
  local order

  temp="$(mktemp -d)"
  if ! BUS_DEPLOY_TEST_MODE=0 bash -c '
    set -euo pipefail
    source "$1"
    ROOT="$2"
    DOMAIN=www.busiscoming.com
    BARE_DOMAIN=busiscoming.com
    VERSION=v1
    APK_DIR="$2/apk"
    ARCHIVE="$2/release-v1.tar.gz"
    ARCHIVE_SHA="$2/release-v1.tar.gz.sha256"
    KEEP=3
    TEST_MODE=0
    : > "$2/order.log"

    acquire_lock() { printf "lock\n" >> "$ROOT/order.log"; }
    ensure_runtime_user() { printf "user\n" >> "$ROOT/order.log"; }
    ensure_directories() {
      printf "dirs\n" >> "$ROOT/order.log"
      mkdir -p "$ROOT/.deploy-tmp" "$ROOT/shared/deploy"
    }
    snapshot_caddy_config() { printf "absent\n"; }
    managed_link_target() { return 0; }
    initialize_runtime() { printf "init\n" >> "$ROOT/order.log"; }
    validate_remote_apk_directory() { printf "apk\n" >> "$ROOT/order.log"; }
    install_release_archive() {
      printf "archive\n" >> "$ROOT/order.log"
      mkdir -p "$ROOT/releases/v1"
      printf "%s/releases/v1\n" "$ROOT"
    }
    replace_apk_directory() { printf "replace-apk\n" >> "$ROOT/order.log"; }
    atomic_link() { printf "link:%s:%s\n" "$1" "$2" >> "$ROOT/order.log"; }
    verify_active_release() { printf "health\n" >> "$ROOT/order.log"; }
    write_deploy_config() { printf "config\n" >> "$ROOT/order.log"; }
    prune_releases() { printf "prune\n" >> "$ROOT/order.log"; }

    command_deploy
  ' _ "${REMOTE_SCRIPT}" "${temp}"; then
    return 1
  fi

  order="$(cat "${temp}/order.log")"
  assert_contains "${order}" "user
dirs" || return 1

  rm -rf "${temp}"
}

test_remote_switch_and_rollback_update_release_links() {
  local temp

  temp="$(mktemp -d)"
  write_release_fixture "${temp}" "v1"
  write_release_fixture "${temp}" "v2"
  write_apk_fixture "${temp}/apk"
  write_fake_deployment_commands "${temp}/bin"
  : > "${temp}/deploy.log"

  deploy_fixture_release "${temp}" "v1" "${temp}/apk" || return 1
  deploy_fixture_release "${temp}" "v2" || return 1

  PATH="${temp}/bin:/usr/bin:/bin" \
    FAKE_DEPLOY_LOG="${temp}/deploy.log" \
    FAKE_DOMAIN="www.busiscoming.com" \
    FAKE_BARE_DOMAIN="busiscoming.com" \
    BUS_DEPLOY_TEST_BIN="${temp}/bin" \
    BUS_DEPLOY_TEST_MODE=1 \
    BUS_DEPLOY_ETC_ROOT="${temp}/etc-root" \
    "${REMOTE_SCRIPT}" switch \
      --root "${temp}/root" \
      --domain www.busiscoming.com \
      --bare-domain busiscoming.com \
      --version v1 || return 1

  assert_equals "$(test_link_version "${temp}/root/current")" "v1" || return 1
  assert_equals "$(test_link_version "${temp}/root/previous")" "v2" || return 1

  PATH="${temp}/bin:/usr/bin:/bin" \
    FAKE_DEPLOY_LOG="${temp}/deploy.log" \
    FAKE_DOMAIN="www.busiscoming.com" \
    FAKE_BARE_DOMAIN="busiscoming.com" \
    BUS_DEPLOY_TEST_BIN="${temp}/bin" \
    BUS_DEPLOY_TEST_MODE=1 \
    BUS_DEPLOY_ETC_ROOT="${temp}/etc-root" \
    "${REMOTE_SCRIPT}" rollback \
      --root "${temp}/root" \
      --domain www.busiscoming.com \
      --bare-domain busiscoming.com || return 1

  assert_equals "$(test_link_version "${temp}/root/current")" "v2" || return 1
  assert_equals "$(test_link_version "${temp}/root/previous")" "v1" || return 1

  rm -rf "${temp}"
}

test_remote_switch_restores_links_on_health_failure() {
  local temp
  local output

  temp="$(mktemp -d)"
  write_release_fixture "${temp}" "v1"
  write_release_fixture "${temp}" "v2"
  write_apk_fixture "${temp}/apk"
  write_fake_deployment_commands "${temp}/bin"
  : > "${temp}/deploy.log"

  deploy_fixture_release "${temp}" "v1" "${temp}/apk" || return 1
  deploy_fixture_release "${temp}" "v2" || return 1

  if output="$(
    PATH="${temp}/bin:/usr/bin:/bin" \
      FAKE_DEPLOY_LOG="${temp}/deploy.log" \
      FAKE_DOMAIN="www.busiscoming.com" \
      FAKE_BARE_DOMAIN="busiscoming.com" \
      FAKE_DEPLOY_MAIN=fail \
      BUS_DEPLOY_TEST_BIN="${temp}/bin" \
      BUS_DEPLOY_TEST_MODE=1 \
      BUS_DEPLOY_ETC_ROOT="${temp}/etc-root" \
      "${REMOTE_SCRIPT}" switch \
        --root "${temp}/root" \
        --domain www.busiscoming.com \
        --bare-domain busiscoming.com \
        --version v1 2>&1
  )"; then
    printf '  expected switch health failure to abort\n'
    return 1
  fi

  assert_contains "${output}" "Switch health checks failed" || return 1
  assert_equals "$(test_link_version "${temp}/root/current")" "v2" || return 1
  assert_equals "$(test_link_version "${temp}/root/previous")" "v1" || return 1

  rm -rf "${temp}"
}

test_remote_cleanup_protects_current_previous_and_newest_releases() {
  local temp
  local version

  temp="$(mktemp -d)"
  mkdir -p "${temp}/root/releases"
  for version in v0 v1 v2 v3 v4 v5; do
    mkdir -p "${temp}/root/releases/${version}"
  done
  touch -t 202606220000 "${temp}/root/releases/v0"
  touch -t 202606220001 "${temp}/root/releases/v1"
  touch -t 202606220002 "${temp}/root/releases/v2"
  touch -t 202606220003 "${temp}/root/releases/v3"
  touch -t 202606220004 "${temp}/root/releases/v4"
  touch -t 202606220005 "${temp}/root/releases/v5"
  ln -s "${temp}/root/releases/v1" "${temp}/root/current"
  ln -s "${temp}/root/releases/v2" "${temp}/root/previous"

  BUS_DEPLOY_TEST_MODE=1 \
    bash -c '
      source "$1"
      ROOT="$2"
      KEEP=3
      prune_releases
    ' _ "${REMOTE_SCRIPT}" "${temp}/root" || return 1

  [ ! -e "${temp}/root/releases/v0" ] || return 1
  for version in v1 v2 v3 v4 v5; do
    [ -d "${temp}/root/releases/${version}" ] || {
      printf '  expected protected release to remain: %s\n' "${version}"
      return 1
    }
  done

  rm -rf "${temp}"
}

test_local_status_uses_ssh_without_running_builds() {
  local temp
  local log

  temp="$(mktemp -d)"
  write_fake_ssh_scp "${temp}/bin"
  : > "${temp}/transport.log"

  PATH="${temp}/bin:/usr/bin:/bin" \
    FAKE_TRANSPORT_LOG="${temp}/transport.log" \
    BUS_DEPLOY_HOST=192.0.2.10 \
    BUS_DEPLOY_TEST_MODE=1 \
    "${DEPLOY_SCRIPT}" status || return 1

  log="$(cat "${temp}/transport.log")"
  assert_contains "${log}" "ssh|root@192.0.2.10 mkdir -p /tmp/busiscoming-deploy-" || return 1
  assert_contains "${log}" "scp|${REMOTE_SCRIPT} root@192.0.2.10:/tmp/busiscoming-deploy-" || return 1
  assert_contains "${log}" "ssh|root@192.0.2.10 chmod 0700 /tmp/busiscoming-deploy-" || return 1
  assert_contains "${log}" "deploy-remote.sh status --root /opt/busiscoming" || return 1
  assert_not_contains "${log}" "StrictHostKeyChecking=no" || return 1
  assert_not_contains "${log}" "npm" || return 1
  assert_not_contains "${log}" " go " || return 1

  rm -rf "${temp}"
}

test_local_deploy_uploads_artifacts_and_invokes_remote_deploy() {
  local temp
  local log

  temp="$(mktemp -d)"
  write_release_fixture "${temp}" "v1"
  write_apk_fixture "${temp}/apk"
  write_fake_ssh_scp "${temp}/bin"
  : > "${temp}/transport.log"

  PATH="${temp}/bin:/usr/bin:/bin" \
    FAKE_TRANSPORT_LOG="${temp}/transport.log" \
    BUS_DEPLOY_HOST=192.0.2.10 \
    BUS_DEPLOY_DOMAIN=www.busiscoming.com \
    BUS_DEPLOY_TEST_MODE=1 \
    BUS_DEPLOY_TEST_ARTIFACT_ROOT="${temp}" \
    "${DEPLOY_SCRIPT}" deploy --version v1 || return 1

  log="$(cat "${temp}/transport.log")"
  assert_contains "${log}" "scp|${REMOTE_SCRIPT} root@192.0.2.10:/tmp/busiscoming-deploy-" || return 1
  assert_contains "${log}" "scp|${temp}/release-v1.tar.gz ${temp}/release-v1.tar.gz.sha256 root@192.0.2.10:/tmp/busiscoming-deploy-" || return 1
  assert_contains "${log}" "scp|${temp}/apk/BusIsComing.apk ${temp}/apk/current.json" || return 1
  assert_contains "${log}" "deploy-remote.sh deploy --root /opt/busiscoming --domain www.busiscoming.com --bare-domain busiscoming.com --keep 3 --version v1" || return 1
  assert_contains "${log}" "--archive /tmp/busiscoming-deploy-" || return 1
  assert_contains "${log}" "--archive-sha /tmp/busiscoming-deploy-" || return 1
  assert_contains "${log}" "--apk-dir /tmp/busiscoming-deploy-" || return 1
  assert_not_contains "${log}" "StrictHostKeyChecking=no" || return 1

  rm -rf "${temp}"
}

run_test "help lists deployment commands" test_help_lists_commands
run_test "unknown command fails clearly" test_unknown_command_fails
run_test "logs rejects an invalid service" test_logs_rejects_invalid_service
run_test "status rejects deploy-only options" test_status_rejects_deploy_option
run_test "list rejects logs-only options" test_list_rejects_logs_option
run_test "version names use the approved character set" test_version_validation
run_test "IPv4 and domain values reject unsafe input" test_network_value_validation
run_test "bare domain derivation only accepts www domains" test_bare_domain_derivation
run_test "APK metadata matches the APK input" test_apk_metadata_validation
run_test "APK metadata allows a safe relative directory" test_apk_metadata_allows_safe_relative_directory
run_test "APK metadata rejects unsafe basenames" test_apk_metadata_rejects_unsafe_basename
run_test "CLI values override environment defaults" test_environment_defaults_and_cli_overrides
run_test "required commands are resolved through PATH" test_require_command_uses_path
run_test "Git preflight honors branch and dirty overrides" test_git_preflight_honors_branch_and_dirty_overrides
run_test "DNS validation queries both names and matches the exact host" test_validate_dns_queries_both_names_and_requires_exact_host
run_test "DNS validation supports explicit proxied records" test_validate_dns_allows_proxied_records_when_explicit
run_test "dirty worktrees mark custom and default versions once" test_dirty_version_marking
run_test "local build sequences commands from expected directories" test_run_local_build_sequences_commands_from_expected_directories
run_test "local build skips only test stages when requested" test_run_local_build_skips_only_tests_when_requested
run_test "local build rejects a dynamically linked Linux binary" test_run_local_build_rejects_dynamic_linux_binary
run_test "local build preserves existing process traps" test_run_local_build_preserves_existing_traps
run_test "central cleanup removes build state and supports future hooks" test_cleanup_all_removes_build_root_and_runs_future_hook
run_test "cleanup traps are registered only once" test_cleanup_traps_are_registered_once
run_test "npm and Go failures propagate while cleanup runs" test_run_local_build_failures_propagate_and_cleanup
run_test "test harness stops after the first failing command" test_run_test_stops_after_first_failure
run_test "APK artifacts are isolated and checksummed" test_apk_artifact_preparation
run_test "APK artifacts validate staged copies" test_apk_artifacts_validate_staged_copies
run_test "release archive contains verified build artifacts" test_release_archive_creation
run_test "release archive rejects frontend symlinks" test_release_archive_rejects_frontend_symlink
run_test "frontend validation fails closed when find fails" test_frontend_validation_fails_when_find_fails
run_test "remote roots reject unsafe absolute paths" test_remote_root_validation
run_test "remote rejects a symlinked deployment root" test_remote_rejects_symlinked_root
run_test "remote allows genuinely absent first-deploy state" test_remote_allows_genuinely_absent_first_deploy_state
run_test "remote rejects wrong-type root and releases paths" test_remote_rejects_wrong_type_root_and_releases
run_test "remote versions and counts use strict validators" test_remote_version_and_positive_integer_validation
run_test "remote commands enforce option allowlists and values" test_remote_argument_allowlists_and_missing_values
run_test "remote list marks only valid absolute release links" test_remote_list_marks_only_valid_absolute_links
run_test "remote inspections reject malformed current and previous" test_remote_rejects_malformed_current_and_previous
run_test "remote list rejects invalid managed release targets" test_remote_list_rejects_invalid_managed_release_targets
run_test "remote list rejects a symlinked releases directory" test_remote_list_rejects_symlinked_releases_directory
run_test "remote logs validate services and map journal units" test_remote_logs_validates_service_and_maps_units
run_test "remote test mode rejects system commands and skips without fakes" test_remote_test_mode_rejects_system_commands_and_skips_without_fakes
run_test "remote test mode rejects physical system bin aliases" test_remote_test_mode_rejects_physical_system_bin_aliases
run_test "remote test mode rejects symlinked fake commands" test_remote_test_mode_rejects_symlinked_fake_command
run_test "remote config parsing rejects unsafe files" test_remote_config_loader_rejects_unsafe_files
run_test "remote config parsing rejects dangling symlinks" test_remote_config_loader_rejects_dangling_symlink
run_test "remote config parsing rejects symlinked parent paths" test_remote_config_loader_rejects_symlinked_parent_paths
run_test "remote config parsing rejects wrong-type paths" test_remote_config_loader_rejects_wrong_type_paths
run_test "remote config requires www and matching bare domain" test_remote_config_requires_www_domain_and_matching_bare_domain
run_test "remote status uses fake checks and prints configuration" test_remote_status_uses_fake_checks_and_prints_config
run_test "remote status skips public checks without configuration" test_remote_status_skips_public_checks_without_config
run_test "remote status fails required service and health checks" test_remote_status_fails_required_checks
run_test "remote production status runs checks and fails closed" test_remote_production_status_runs_checks_and_fails_closed
run_test "remote renders systemd Caddy and backend environment" test_remote_renders_systemd_caddy_and_environment
run_test "remote render-config is test-only and validates domains" test_remote_render_config_is_test_only_and_validates_domains
run_test "remote restores Caddy config after reload failure" test_remote_caddy_config_restores_previous_file_on_reload_failure
run_test "remote port and UFW guards are non-destructive" test_remote_port_and_ufw_guards_are_non_destructive
run_test "remote deploy installs first release and APK" test_remote_deploy_installs_first_release_and_apk
run_test "remote deploy restores code on health failure" test_remote_deploy_restores_code_on_health_failure
run_test "remote deploy without APK requires an existing valid APK" test_remote_deploy_without_apk_requires_existing_valid_apk
run_test "remote deploy creates runtime user before group-owned directories" test_remote_deploy_creates_runtime_user_before_group_owned_directories
run_test "remote switch and rollback update release links" test_remote_switch_and_rollback_update_release_links
run_test "remote switch restores links on health failure" test_remote_switch_restores_links_on_health_failure
run_test "remote cleanup protects current previous and newest releases" test_remote_cleanup_protects_current_previous_and_newest_releases
run_test "local status uses SSH without running builds" test_local_status_uses_ssh_without_running_builds
run_test "local deploy uploads artifacts and invokes remote deploy" test_local_deploy_uploads_artifacts_and_invokes_remote_deploy

exit "${FAILURES}"
