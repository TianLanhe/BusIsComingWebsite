#!/usr/bin/env bash

set -euo pipefail

COMMAND=""
ROOT="/opt/busiscoming"
DOMAIN=""
BARE_DOMAIN=""
VERSION=""
ARCHIVE=""
ARCHIVE_SHA=""
APK_DIR=""
SERVICE=""
KEEP=3
LINES=100
TEST_MODE="${BUS_DEPLOY_TEST_MODE:-0}"
TEST_BIN="${BUS_DEPLOY_TEST_BIN:-}"
CONFIG_PRESENT=0
STATUS_FAILED=0

die() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

validate_root() {
  local value
  local remaining
  local segment

  if [[ $# -gt 0 ]]; then
    value="$1"
  else
    value="${ROOT:-}"
  fi

  [[ -n "${value}" && "${value}" == /* ]] || return 1
  [[ "${value}" =~ ^/[A-Za-z0-9._/-]+$ ]] || return 1
  case "${value}" in
    /|/etc|/usr|/var|/home|/root)
      return 1
      ;;
  esac
  [[ "${value}" != *//* && "${value}" != */ ]] || return 1
  if [[ -e "${value}" || -L "${value}" ]]; then
    [[ -d "${value}" && ! -L "${value}" ]] || return 1
  fi

  remaining="${value#/}"
  while :; do
    segment="${remaining%%/*}"
    [[ -n "${segment}" && "${segment}" != "." && "${segment}" != ".." ]] ||
      return 1
    [[ "${remaining}" == */* ]] || break
    remaining="${remaining#*/}"
  done
}

validate_optional_managed_directory() {
  local path="$1"

  if [[ ! -e "${path}" && ! -L "${path}" ]]; then
    return 0
  fi
  [[ -d "${path}" && ! -L "${path}" ]] ||
    die "Managed path must be a real directory: ${path}"
}

validate_version() {
  local value="${1:-}"

  [[ -n "${value}" ]] &&
    [[ "${#value}" -le 128 ]] &&
    [[ "${value}" != "." && "${value}" != ".." ]] &&
    [[ "${value}" =~ ^[A-Za-z0-9._-]+$ ]]
}

validate_positive_integer() {
  [[ "${1:-}" =~ ^[1-9][0-9]*$ ]]
}

validate_domain() {
  local value="${1:-}"
  local remaining
  local label

  [[ -n "${value}" && "${#value}" -le 253 ]] || return 1
  [[ "${value}" != *..* ]] || return 1

  remaining="${value}"
  while :; do
    label="${remaining%%.*}"
    [[ "${#label}" -le 63 ]] || return 1
    [[ "${label}" =~ ^[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?$ ]] ||
      return 1
    [[ "${remaining}" == *.* ]] || break
    remaining="${remaining#*.}"
  done
}

physical_directory() {
  local directory="$1"
  local physical

  physical="$(cd "${directory}" 2>/dev/null && pwd -P)" || return 1
  while [[ "${physical}" == //* ]]; do
    physical="${physical#/}"
  done
  printf '%s\n' "${physical}"
}

test_command_path() {
  local command_name="$1"
  local test_bin="${TEST_BIN%/}"
  local command_path="${test_bin}/${command_name}"
  local physical_test_bin
  local physical_command_parent
  local physical_path_entry
  local path_entry
  local remaining_path
  local path_matches=0

  [[ "${command_name}" =~ ^[A-Za-z0-9._-]+$ ]] || return 1
  [[ -n "${test_bin}" && "${test_bin}" == /* ]] || return 1
  physical_test_bin="$(physical_directory "${test_bin}")" || return 1

  case "${physical_test_bin}" in
    /|/bin|/bin/*|/sbin|/sbin/*|/usr|/usr/*|/lib|/lib/*|/lib64|/lib64/*|/System|/System/*|/Library|/Library/*|/Applications|/Applications/*|/opt/homebrew|/opt/homebrew/*|/opt/local|/opt/local/*)
      return 1
      ;;
  esac

  remaining_path="${PATH}:"
  while [[ "${remaining_path}" == *:* ]]; do
    path_entry="${remaining_path%%:*}"
    remaining_path="${remaining_path#*:}"
    [[ -n "${path_entry}" && "${path_entry}" == /* ]] || continue
    physical_path_entry="$(physical_directory "${path_entry}")" || continue
    if [[ "${physical_path_entry}" == "${physical_test_bin}" ]]; then
      path_matches=1
      break
    fi
  done
  [[ "${path_matches}" -eq 1 ]] || return 1

  [[ -f "${command_path}" && -x "${command_path}" && ! -L "${command_path}" ]] ||
    return 1
  physical_command_parent="$(
    physical_directory "${command_path%/*}"
  )" || return 1
  [[ "${physical_command_parent}" == "${physical_test_bin}" ]] || return 1

  command_path="${physical_command_parent}/${command_path##*/}"
  [[ -f "${command_path}" && -x "${command_path}" && ! -L "${command_path}" ]] ||
    return 1

  printf '%s\n' "${command_path}"
}

validate_command_option() {
  local option="$1"

  case "${COMMAND}:${option}" in
    list:--root|status:--root)
      return 0
      ;;
    logs:--root|logs:--service|logs:--lines)
      return 0
      ;;
    *)
      die "Option ${option} is not valid for command: ${COMMAND}"
      ;;
  esac
}

require_option_value() {
  local option="$1"
  local count="$2"
  local value="${3:-}"

  [[ "${count}" -ge 2 && -n "${value}" && "${value}" != --* ]] ||
    die "${option} requires a value"
}

parse_args() {
  [[ $# -gt 0 ]] || die "remote command required"

  COMMAND="$1"
  shift
  case "${COMMAND}" in
    list|status|logs)
      ;;
    *)
      die "Unknown remote command: ${COMMAND}"
      ;;
  esac

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --root|--service|--lines)
        validate_command_option "$1"
        require_option_value "$1" "$#" "${2:-}"
        case "$1" in
          --root)
            ROOT="$2"
            ;;
          --service)
            SERVICE="$2"
            ;;
          --lines)
            LINES="$2"
            ;;
        esac
        shift 2
        ;;
      --*)
        die "Unknown option: $1"
        ;;
      *)
        die "Unexpected argument: $1"
        ;;
    esac
  done
}

validate_command_args() {
  validate_root "${ROOT}" || die "Unsafe deployment root: ${ROOT}"
  validate_positive_integer "${KEEP}" ||
    die "KEEP must be a positive integer"
  case "${TEST_MODE}" in
    0|1)
      ;;
    *)
      die "BUS_DEPLOY_TEST_MODE must be 0 or 1"
      ;;
  esac

  if [[ "${COMMAND}" == "logs" ]]; then
    case "${SERVICE}" in
      backend|caddy)
        ;;
      *)
        die "--service must be backend or caddy"
        ;;
    esac
    validate_positive_integer "${LINES}" ||
      die "--lines must be a positive integer"
  fi
}

version_from_link() {
  local link="$1"
  local target
  local version

  validate_optional_managed_directory "${ROOT}/releases"
  if [[ ! -e "${link}" && ! -L "${link}" ]]; then
    return 0
  fi
  [[ -L "${link}" ]] ||
    die "Managed link path is not a symlink: ${link}"
  target="$(readlink "${link}")" ||
    die "Managed link target cannot be read: ${link}"
  [[ "${target}" == /* ]] ||
    die "Managed link target must be absolute: ${link} -> ${target}"

  version="$(basename "${target}")"
  validate_version "${version}" ||
    die "Managed link target has an invalid version: ${link} -> ${target}"
  [[ "${target}" == "${ROOT}/releases/${version}" ]] ||
    die "Managed link target is outside the release root: ${link} -> ${target}"
  [[ -d "${target}" && ! -L "${target}" ]] ||
    die "Managed link target is not a real release directory: ${link} -> ${target}"
  printf '%s\n' "${version}"
}

command_list() {
  local current
  local previous
  local release
  local name
  local marker

  validate_optional_managed_directory "${ROOT}/releases"
  current="$(version_from_link "${ROOT}/current")"
  previous="$(version_from_link "${ROOT}/previous")"
  [[ -d "${ROOT}/releases" ]] || return 0

  (
    shopt -s dotglob nullglob
    for release in "${ROOT}"/releases/*; do
      [[ -d "${release}" && ! -L "${release}" ]] || continue
      name="$(basename "${release}")"
      validate_version "${name}" || continue

      marker=""
      [[ "${name}" == "${current}" ]] && marker="${marker} [current]"
      [[ "${name}" == "${previous}" ]] && marker="${marker} [previous]"
      printf '%s%s\n' "${name}" "${marker}"
    done
  ) | LC_ALL=C sort
}

load_config() {
  local shared="${ROOT}/shared"
  local deploy="${ROOT}/shared/deploy"
  local config="${ROOT}/shared/deploy/config.env"
  local line
  local key
  local value
  local seen_domain=0
  local seen_bare_domain=0
  local seen_root=0
  local seen_keep=0
  local config_domain=""
  local config_bare_domain=""
  local config_keep=""

  validate_optional_managed_directory "${shared}"
  validate_optional_managed_directory "${deploy}"
  [[ ! -L "${config}" ]] ||
    die "Invalid deployment config: Managed path must not be a symlink: ${config}"
  if [[ ! -e "${config}" && ! -L "${config}" ]]; then
    return 0
  fi
  [[ -f "${config}" && ! -L "${config}" && -r "${config}" ]] ||
    die "Invalid deployment config: ${config}"
  CONFIG_PRESENT=1

  # 配置文件属于 root 管理边界，只接受固定 KEY=VALUE，禁止 shell 求值。
  while IFS= read -r line || [[ -n "${line}" ]]; do
    [[ -n "${line}" ]] || continue
    case "${line}" in
      *=*)
        key="${line%%=*}"
        value="${line#*=}"
        ;;
      *)
        die "Invalid deployment config: malformed line"
        ;;
    esac

    case "${key}" in
      DOMAIN)
        [[ "${seen_domain}" -eq 0 ]] ||
          die "Invalid deployment config: duplicate DOMAIN"
        validate_domain "${value}" ||
          die "Invalid deployment config: unsafe DOMAIN"
        config_domain="${value}"
        seen_domain=1
        ;;
      BARE_DOMAIN)
        [[ "${seen_bare_domain}" -eq 0 ]] ||
          die "Invalid deployment config: duplicate BARE_DOMAIN"
        validate_domain "${value}" ||
          die "Invalid deployment config: unsafe BARE_DOMAIN"
        config_bare_domain="${value}"
        seen_bare_domain=1
        ;;
      DEPLOY_ROOT)
        [[ "${seen_root}" -eq 0 ]] ||
          die "Invalid deployment config: duplicate DEPLOY_ROOT"
        validate_root "${value}" ||
          die "Invalid deployment config: unsafe DEPLOY_ROOT"
        [[ "${value}" == "${ROOT}" ]] ||
          die "Invalid deployment config: DEPLOY_ROOT does not match requested root"
        seen_root=1
        ;;
      KEEP)
        [[ "${seen_keep}" -eq 0 ]] ||
          die "Invalid deployment config: duplicate KEEP"
        validate_positive_integer "${value}" ||
          die "Invalid deployment config: KEEP must be a positive integer"
        config_keep="${value}"
        seen_keep=1
        ;;
      *)
        die "Invalid deployment config: unknown key ${key}"
        ;;
    esac
  done < "${config}"

  [[ "${seen_domain}" -eq 1 ]] ||
    die "Invalid deployment config: missing DOMAIN"
  [[ "${seen_bare_domain}" -eq 1 ]] ||
    die "Invalid deployment config: missing BARE_DOMAIN"
  [[ "${seen_root}" -eq 1 ]] ||
    die "Invalid deployment config: missing DEPLOY_ROOT"
  [[ "${seen_keep}" -eq 1 ]] ||
    die "Invalid deployment config: missing KEEP"
  [[ "${config_domain}" == www.* && -n "${config_domain#www.}" ]] ||
    die "Invalid deployment config: DOMAIN must start with www."
  [[ "${config_bare_domain}" == "${config_domain#www.}" ]] ||
    die "Invalid deployment config: BARE_DOMAIN must match DOMAIN"

  DOMAIN="${config_domain}"
  BARE_DOMAIN="${config_bare_domain}"
  KEEP="${config_keep}"
}

print_link_status() {
  local label="$1"
  local link="$2"
  local version

  version="$(version_from_link "${link}")"
  if [[ -n "${version}" ]]; then
    printf '%s: %s\n' "${label}" "${version}"
  else
    printf '%s: (none)\n' "${label}"
  fi
}

check_service() {
  local label="$1"
  local unit="$2"
  local systemctl_command="systemctl"
  local state

  if [[ "${TEST_MODE}" -eq 1 ]]; then
    if ! systemctl_command="$(test_command_path systemctl)"; then
      printf '%s: skipped (test command unavailable)\n' "${label}"
      return 0
    fi
  fi

  if state="$("${systemctl_command}" is-active "${unit}" 2>&1)" &&
    [[ "${state}" == "active" ]]; then
    printf '%s: active\n' "${label}"
    return 0
  fi

  [[ -n "${state}" ]] || state="unknown"
  printf '%s: %s (failed)\n' "${label}" "${state}"
  STATUS_FAILED=1
}

check_url() {
  local label="$1"
  local url="$2"
  local mode="${3:-get}"
  local curl_command="curl"
  local -a curl_args

  if [[ "${TEST_MODE}" -eq 1 ]]; then
    if ! curl_command="$(test_command_path curl)"; then
      printf '%s: skipped (test command unavailable)\n' "${label}"
      return 0
    fi
  fi

  curl_args=(--fail --silent --show-error --max-time 10)
  if [[ "${mode}" == "head" ]]; then
    curl_args+=(--head)
  fi

  if "${curl_command}" "${curl_args[@]}" "${url}" >/dev/null; then
    printf '%s: ok\n' "${label}"
    return 0
  fi

  printf '%s: failed\n' "${label}"
  STATUS_FAILED=1
}

command_status() {
  STATUS_FAILED=0
  load_config

  print_link_status "current" "${ROOT}/current"
  print_link_status "previous" "${ROOT}/previous"
  if [[ "${CONFIG_PRESENT}" -eq 1 ]]; then
    printf 'config: %s\n' "${ROOT}/shared/deploy/config.env"
    printf 'domain: %s\n' "${DOMAIN}"
    printf 'bare domain: %s\n' "${BARE_DOMAIN}"
    printf 'deploy root: %s\n' "${ROOT}"
    printf 'keep: %s\n' "${KEEP}"
  else
    printf 'config: (absent)\n'
  fi

  check_service "backend" "busiscoming-backend"
  check_service "caddy" "caddy"
  check_url "local health" "http://127.0.0.1:8080/healthz"

  if [[ "${CONFIG_PRESENT}" -eq 1 ]]; then
    check_url "main HTTPS" "https://${DOMAIN}/" head
    check_url "bare URL" "https://${BARE_DOMAIN}/" head
  fi

  [[ "${STATUS_FAILED}" -eq 0 ]]
}

command_logs() {
  local journalctl_command="journalctl"
  local unit

  case "${SERVICE}" in
    backend)
      unit="busiscoming-backend"
      ;;
    caddy)
      unit="caddy"
      ;;
  esac

  if [[ "${TEST_MODE}" -eq 1 ]]; then
    journalctl_command="$(test_command_path journalctl)" ||
      die "Test mode requires an injected fake journalctl command"
  fi

  "${journalctl_command}" -u "${unit}" -n "${LINES}" --no-pager
}

main() {
  parse_args "$@"
  validate_command_args

  case "${COMMAND}" in
    list)
      command_list
      ;;
    status)
      command_status
      ;;
    logs)
      command_logs
      ;;
  esac
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi
