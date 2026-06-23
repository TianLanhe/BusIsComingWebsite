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

  remaining="${value#/}"
  while :; do
    segment="${remaining%%/*}"
    [[ -n "${segment}" && "${segment}" != "." && "${segment}" != ".." ]] ||
      return 1
    [[ "${remaining}" == */* ]] || break
    remaining="${remaining#*/}"
  done
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

  [[ -L "${link}" ]] || return 0
  target="$(readlink "${link}")" || return 0
  [[ "${target}" == /* ]] || return 0

  version="$(basename "${target}")"
  validate_version "${version}" || return 0
  [[ "${target}" == "${ROOT}/releases/${version}" ]] || return 0
  printf '%s\n' "${version}"
}

command_list() {
  local current
  local previous
  local release
  local name
  local marker

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

  [[ -e "${config}" ]] || return 0
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
  local state

  if state="$(systemctl is-active "${unit}" 2>&1)" &&
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
  local -a curl_args

  curl_args=(--fail --silent --show-error --max-time 10)
  if [[ "${mode}" == "head" ]]; then
    curl_args+=(--head)
  fi

  if curl "${curl_args[@]}" "${url}" >/dev/null; then
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
  local unit

  case "${SERVICE}" in
    backend)
      unit="busiscoming-backend"
      ;;
    caddy)
      unit="caddy"
      ;;
  esac

  journalctl -u "${unit}" -n "${LINES}" --no-pager
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
