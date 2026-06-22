#!/usr/bin/env bash

set -u

TEST_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_REPO_ROOT="$(cd "${TEST_SCRIPT_DIR}/../.." && pwd)"
DEPLOY_SCRIPT="${TEST_REPO_ROOT}/scripts/deploy.sh"
FAILURES=0

source "${DEPLOY_SCRIPT}"

run_test() {
  local name="$1"
  shift

  if ( "$@" ); then
    printf 'ok - %s\n' "${name}"
  else
    printf 'not ok - %s\n' "${name}"
    FAILURES=$((FAILURES + 1))
  fi
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
  local status

  output="$("${DEPLOY_SCRIPT}" unknown 2>&1)"
  status=$?

  if [ "${status}" -eq 0 ]; then
    printf '  expected a nonzero exit status\n'
    return 1
  fi

  assert_contains "${output}" "Unknown command"
}

test_logs_rejects_invalid_service() {
  local output
  local status

  output="$(BUS_DEPLOY_HOST=192.0.2.10 "${DEPLOY_SCRIPT}" logs --service invalid 2>&1)"
  status=$?

  if [ "${status}" -eq 0 ]; then
    printf '  expected a nonzero exit status\n'
    return 1
  fi

  assert_contains "${output}" "backend or caddy"
}

test_status_rejects_deploy_option() {
  local output
  local status

  output="$(BUS_DEPLOY_HOST=192.0.2.10 "${DEPLOY_SCRIPT}" status --skip-tests 2>&1)"
  status=$?

  if [ "${status}" -eq 0 ]; then
    printf '  expected a nonzero exit status\n'
    return 1
  fi

  assert_contains "${output}" "Option --skip-tests is not valid for command: status"
}

test_list_rejects_logs_option() {
  local output
  local status

  output="$(BUS_DEPLOY_HOST=192.0.2.10 "${DEPLOY_SCRIPT}" list --service backend 2>&1)"
  status=$?

  if [ "${status}" -eq 0 ]; then
    printf '  expected a nonzero exit status\n'
    return 1
  fi

  assert_contains "${output}" "Option --service is not valid for command: list"
}

test_version_validation() {
  validate_version "20260622-120000-a07eaf4" || return 1
  ! validate_version "../escape"
  ! validate_version "has space"
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
      bash -c '
        source "$1"
        parse_args deploy
        printf "%s|%s|%s\n" "$HOST" "$DOMAIN" "$KEEP"
      ' _ "${DEPLOY_SCRIPT}"
  )"
  assert_equals "${defaults}" "192.0.2.10|www.env.example|7" || return 1

  overrides="$(
    BUS_DEPLOY_HOST=192.0.2.10 \
    BUS_DEPLOY_DOMAIN=www.env.example \
    BUS_DEPLOY_KEEP=7 \
      bash -c '
        source "$1"
        parse_args deploy --host 198.51.100.20 --domain www.cli.example
        printf "%s|%s|%s\n" "$HOST" "$DOMAIN" "$KEEP"
      ' _ "${DEPLOY_SCRIPT}"
  )"
  assert_equals "${overrides}" "198.51.100.20|www.cli.example|7"
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

  temp="$(mktemp -d)"
  mkdir -p "${temp}/repo/frontend/dist/assets" "${temp}/build"
  printf '<!doctype html>\n' > "${temp}/repo/frontend/dist/index.html"
  printf 'asset-data\n' > "${temp}/repo/frontend/dist/assets/app.js"
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
  frontend_lines="$(tail -2 "${manifest}")"
  assert_equals "${frontend_lines}" \
    "${asset_sha}  frontend/dist/assets/app.js
${frontend_sha}  frontend/dist/index.html" || return 1

  archive_sha="$(shasum -a 256 "${archive}" | awk '{print $1}')"
  checksum_contents="$(cat "${archive}.sha256")"
  assert_equals "${checksum_contents}" "${archive_sha}  $(basename "${archive}")" || return 1

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
run_test "APK metadata rejects unsafe basenames" test_apk_metadata_rejects_unsafe_basename
run_test "CLI values override environment defaults" test_environment_defaults_and_cli_overrides
run_test "dirty worktrees mark custom and default versions once" test_dirty_version_marking
run_test "APK artifacts are isolated and checksummed" test_apk_artifact_preparation
run_test "release archive contains verified build artifacts" test_release_archive_creation

exit "${FAILURES}"
