#!/usr/bin/env bash

set -euo pipefail

JSON_MODE=false
DRY_RUN=false
ALLOW_EXISTING=false
EXACT_BRANCH="${GIT_BRANCH_NAME:-}"
SHORT_NAME=""
BRANCH_NUMBER=""
USE_TIMESTAMP=false
ARGS=()

i=1
while [ "$i" -le "$#" ]; do
    arg="${!i}"
    case "$arg" in
        --json)
            JSON_MODE=true
            ;;
        --dry-run)
            DRY_RUN=true
            ;;
        --allow-existing-branch)
            ALLOW_EXISTING=true
            ;;
        --branch-name)
            if [ $((i + 1)) -gt "$#" ]; then
                echo "Error: --branch-name requires a value" >&2
                exit 1
            fi
            i=$((i + 1))
            EXACT_BRANCH="${!i}"
            ;;
        --short-name)
            if [ $((i + 1)) -gt "$#" ]; then
                echo "Error: --short-name requires a value" >&2
                exit 1
            fi
            i=$((i + 1))
            SHORT_NAME="${!i}"
            ;;
        --number)
            if [ $((i + 1)) -gt "$#" ]; then
                echo "Error: --number requires a value" >&2
                exit 1
            fi
            i=$((i + 1))
            BRANCH_NUMBER="${!i}"
            ;;
        --timestamp)
            USE_TIMESTAMP=true
            ;;
        --help|-h)
            echo "Usage: $0 [--json] [--dry-run] [--allow-existing-branch] [--branch-name <name>] [--short-name <name>] [--number N] [--timestamp] <feature_description>"
            exit 0
            ;;
        *)
            ARGS+=("$arg")
            ;;
    esac
    i=$((i + 1))
done

FEATURE_DESCRIPTION="${ARGS[*]}"
FEATURE_DESCRIPTION=$(printf "%s" "$FEATURE_DESCRIPTION" | sed -E 's/^[[:space:]]+|[[:space:]]+$//g')

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(CDPATH="" cd "$SCRIPT_DIR/../../../../.." && pwd)"
CREATE_FEATURE_SCRIPT="$REPO_ROOT/.specify/scripts/bash/create-new-feature.sh"

if [ ! -x "$CREATE_FEATURE_SCRIPT" ] && [ ! -f "$CREATE_FEATURE_SCRIPT" ]; then
    echo "Error: Spec Kit create-new-feature.sh not found at $CREATE_FEATURE_SCRIPT" >&2
    exit 1
fi

if [ -z "$FEATURE_DESCRIPTION" ] && [ -z "$EXACT_BRANCH" ]; then
    echo "Error: feature description or GIT_BRANCH_NAME is required" >&2
    exit 1
fi

cd "$REPO_ROOT"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Error: not inside a git worktree" >&2
    exit 1
fi

GEN_ARGS=(--json --dry-run)
if [ -n "$SHORT_NAME" ]; then
    GEN_ARGS+=(--short-name "$SHORT_NAME")
fi
if [ -n "$BRANCH_NUMBER" ]; then
    GEN_ARGS+=(--number "$BRANCH_NUMBER")
fi
if [ "$USE_TIMESTAMP" = true ]; then
    GEN_ARGS+=(--timestamp)
fi
if [ -n "$FEATURE_DESCRIPTION" ]; then
    GEN_ARGS+=("$FEATURE_DESCRIPTION")
else
    GEN_ARGS+=("$EXACT_BRANCH")
fi

DRY_JSON="$(bash "$CREATE_FEATURE_SCRIPT" "${GEN_ARGS[@]}")"
BASE_BRANCH="$(printf "%s" "$DRY_JSON" | sed -n 's/.*"BRANCH_NAME":"\([^"]*\)".*/\1/p')"
FEATURE_NUM="$(printf "%s" "$DRY_JSON" | sed -n 's/.*"FEATURE_NUM":"\([^"]*\)".*/\1/p')"

if [ -z "$BASE_BRANCH" ] || [ -z "$FEATURE_NUM" ]; then
    echo "Error: failed to derive branch name from create-new-feature.sh output: $DRY_JSON" >&2
    exit 1
fi

# 中文描述会被上游分支名清洗逻辑移除；保留编号并使用稳定兜底后缀。
if [[ "$BASE_BRANCH" =~ ^([0-9]{3,}|[0-9]{8}-[0-9]{6})-$ ]]; then
    BASE_BRANCH="${FEATURE_NUM}-feature"
fi

if [ -n "$EXACT_BRANCH" ]; then
    BRANCH_NAME="$EXACT_BRANCH"
else
    BRANCH_PREFIX="${GIT_BRANCH_PREFIX-codex/}"
    BRANCH_NAME="${BRANCH_PREFIX}${BASE_BRANCH}"
fi

CURRENT_BRANCH="$(git branch --show-current 2>/dev/null || true)"

if [ "$DRY_RUN" != true ]; then
    if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
        if [ "$ALLOW_EXISTING" = true ]; then
            git switch "$BRANCH_NAME" >/dev/null
        else
            echo "Error: branch '$BRANCH_NAME' already exists. Use --allow-existing-branch to switch to it." >&2
            exit 1
        fi
    else
        git switch -c "$BRANCH_NAME" >/dev/null
    fi
fi

if [ "$JSON_MODE" = true ]; then
    if command -v jq >/dev/null 2>&1; then
        jq -cn \
            --arg branch_name "$BRANCH_NAME" \
            --arg feature_num "$FEATURE_NUM" \
            --arg previous_branch "$CURRENT_BRANCH" \
            --argjson dry_run "$DRY_RUN" \
            '{BRANCH_NAME:$branch_name,FEATURE_NUM:$feature_num,PREVIOUS_BRANCH:$previous_branch,DRY_RUN:$dry_run}'
    else
        printf '{"BRANCH_NAME":"%s","FEATURE_NUM":"%s","PREVIOUS_BRANCH":"%s","DRY_RUN":%s}\n' \
            "$BRANCH_NAME" "$FEATURE_NUM" "$CURRENT_BRANCH" "$DRY_RUN"
    fi
else
    echo "BRANCH_NAME: $BRANCH_NAME"
    echo "FEATURE_NUM: $FEATURE_NUM"
    echo "PREVIOUS_BRANCH: $CURRENT_BRANCH"
    echo "DRY_RUN: $DRY_RUN"
fi
