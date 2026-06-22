#!/usr/bin/env bash

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DEPLOY_SCRIPT="${REPO_ROOT}/scripts/deploy.sh"
FAILURES=0

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

run_test "help lists deployment commands" test_help_lists_commands
run_test "unknown command fails clearly" test_unknown_command_fails
run_test "logs rejects an invalid service" test_logs_rejects_invalid_service
run_test "status rejects deploy-only options" test_status_rejects_deploy_option
run_test "list rejects logs-only options" test_list_rejects_logs_option

exit "${FAILURES}"
