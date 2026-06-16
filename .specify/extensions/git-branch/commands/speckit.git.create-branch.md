---
description: "Create and switch to a new git branch before specification"
---

# Create Git Branch Before Specify

This command is intended for the `before_specify` hook. It creates and switches to a new git branch before `/speckit-specify` writes the feature specification.

## Behavior

- Uses the `/speckit-specify` feature description to generate the same numbered short name style as Spec Kit.
- Does not create the spec directory or spec file; the core `/speckit-specify` command still owns those artifacts.
- Uses `GIT_BRANCH_NAME` when provided, so callers can force an exact branch name.
- Defaults generated branches to the `codex/` prefix. Set `GIT_BRANCH_PREFIX=""` to disable the prefix or another value to override it.
- Refuses to reuse an existing branch unless `--allow-existing-branch` is passed.
- Emits JSON containing `BRANCH_NAME` and `FEATURE_NUM` for the specify command to reference.

## Execution

```bash
bash .specify/extensions/git-branch/scripts/bash/create-branch.sh --json "$ARGUMENTS"
```

Useful options:

- `--branch-name <name>`: exact branch name, equivalent to setting `GIT_BRANCH_NAME`.
- `--short-name <name>`: short name used for generated branch suffix.
- `--number <N>`: exact numeric feature prefix.
- `--timestamp`: use a timestamp prefix instead of sequential numbering.
- `--allow-existing-branch`: switch to an existing branch instead of failing.
- `--dry-run`: print the branch decision without switching branches.
