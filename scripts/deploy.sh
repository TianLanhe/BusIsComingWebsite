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

validate_command_option() {
  local option="$1"

  case "${COMMAND}:${option}" in
    deploy:--host|deploy:--domain|deploy:--version|deploy:--skip-apk|deploy:--skip-tests|deploy:--allow-dirty|deploy:--allow-non-master)
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
      ;;
    switch)
      [[ -n "${VERSION}" ]] || die "switch requires --version"
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
  parse_args "$@"
  validate_command_args
  die "Command implementation is not available yet: ${COMMAND}"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi
