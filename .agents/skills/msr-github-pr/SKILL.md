---
name: msr-github-pr
description: Use when creating or updating a task pull request in the MSR Core repository. Applies the repository's title, release target, assignee, labels, milestone, and Development-link conventions.
---

# MSR GitHub pull requests

Use this skill for task PRs in MSR Core. Read [`docs/development/github-project-workflow.md`](../../../docs/development/github-project-workflow.md) and the repository's `AGENTS.md` before changing GitHub state.

## Create or update a task PR

After the task branch has been pushed and the checkout is clean, run the helper from the repository root:

```bash
node .agents/skills/msr-github-pr/scripts/manage-pr.mjs \
  --issue <issue-number> \
  --title "#<issue-number>: <imperative title>" \
  --body-file <path-to-pr-body>
```

The helper derives `release/X.Y.Z` from a versioned milestone, copies the issue's assignee, milestone, and labels (excluding `🔍 Needs: Investigation`), and creates or updates the open PR for the current branch. For a non-versioned milestone, pass the explicitly approved target with `--base`. Use `--head` only when the current checkout is at the pushed tip of that branch.

The PR title must follow `#<issue>: <imperative title>`. Keep that issue number out of the PR description. The helper manually links the issue through GitHub's **Development** relationship with the GraphQL `addCloseIssueReferences` mutation and verifies the link. This matters for task PRs into release branches, where closing keywords in the description do not create the relationship.

The helper does not commit or push. Run it only when the user has authorized creating or updating the PR. Do not use it for release promotion PRs such as `Release vX.Y.Z`.

## Verify

Confirm the PR title, head and base branches, assignee, labels, milestone, and the issue's **Development** link. The helper performs these checks for the fields it manages; if it reports an error, inspect remote state before retrying. Do not close the issue unless the user separately asks.
