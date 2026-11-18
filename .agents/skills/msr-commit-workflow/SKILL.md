---
name: msr-commit-workflow
description: Use when preparing or creating a Git commit in MSR Core. Covers authorization, change review, commit messages, and local validation.
---

# MSR commit workflow

Use this skill for commit work in this repository. Follow the current `AGENTS.md` and `.husky/pre-commit` when they provide more specific or newer instructions.

## Before staging

- Confirm the repository and current branch. Review `git status`, the staged and unstaged diffs, and recent commit messages.
- Check `git config user.name` and `git config user.email`. Confirm they match the intended GitHub identity and the repository's recent commits. If the author is unclear or mismatched, stop before committing; do not silently change Git configuration.
- Stage only the files covered by the user's request. Use `git add -A` only when the user asks to commit all changes. Preserve unrelated staged or unstaged work and inspect the staged diff before committing.
- Stage and commit only after the user explicitly asks. A request to commit does not authorize pushing, opening a PR, publishing, or closing an issue; those are separate actions.

## Commit message

Use the repository format:

```text
#<issue number>: <concise title>

<body describing what changed and why>
```

- Use the relevant issue number with a `#` prefix. Determine it from the current task or explicit user context; do not guess.
- Write a concise title in imperative mood, for example `#58: Add SQL migration files support`.
- Explain what changed and why in the body. Use bullets for several changes and mention breaking changes when relevant.
- Do not add AI attribution or `Co-Authored-By` lines.

Example:

```text
#156: Align CLI and locking names with runner terminology

Rename the CLI factory and lock owner identifiers to match the public runner naming. Update tests and migration guidance so adapter authors can apply the breaking changes safely.
```

## Validation and completion

- Review the staged diff and run `git diff --cached --check` before the commit.
- The local pre-commit hook currently runs TypeScript type checking, build, lint, the test suite with coverage, and a 100% threshold check for statements, branches, functions, and lines. Read `.husky/pre-commit` if validation requirements may have changed, and let the hook run. Do not bypass it to force a commit.
- If the hook fails, report the failure and fix it before retrying. Do not claim the commit succeeded unless Git confirms it.
- After a successful commit, verify `HEAD` message and author and inspect `git status`. Report the commit hash and whether the worktree is clean. Do not push unless explicitly asked.
