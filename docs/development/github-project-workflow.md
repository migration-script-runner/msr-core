---
layout: default
title: GitHub Project Workflow
parent: Development
nav_order: 9
---

# GitHub Project Workflow
{: .no_toc }

Required workflow for managing MSR Core GitHub issues, milestones, labels, and releases.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Scope and tools

Use this guide for GitHub issues, milestones, labels, GitHub Releases, release tags, and npm publication.

- Prefer the connected GitHub plugin when it supports the required operation.
- Use `gh` CLI when the plugin does not support the operation. Check authentication with `gh auth status`; never expose tokens in notes, output, or issue text.
- Search and inspect existing repository state before creating or changing remote objects.
- After each write, fetch the affected object and verify its title, body, labels, assignees, milestone, state, tag, or release status as applicable.
- Perform a remote write only when the user explicitly asks for that operation. A request to create an issue does not authorize closing it, and a request to close an issue does not authorize committing or pushing code.

## Issues

### Before creating an issue

1. Search open and closed issues for duplicates and related work.
2. Check the issue format used by nearby issues in the repository. Most implementation issues use sections such as `Summary`, `Context`, `Tasks`, `Testing Requirements`, and `Acceptance Criteria`; adapt these to the task instead of adding irrelevant sections.
3. Confirm the intended milestone. Do not invent a milestone, due date, priority, or technical requirement.
4. Write a concise title and a specific description that explains the problem or goal, why it matters, the work to complete, and how completion can be verified.

### Labels and assignee

When creating an issue:

- Assign one suitable type label, one priority label, and one testing-effort label from [`docs/config/labels.yml`](../config/labels.yml).
- Add other relevant labels, such as `📚 Needs: Documentation`, `🧪 Needs: Tests`, `🔍 Needs: Investigation`, or `🚀 Release`.
- Assign the issue to `vlavrynovych`.
- Check that each selected label exists in the GitHub repository. If a required label is missing, report that instead of creating or renaming repository labels without authorization.

Do not apply a label just because its name exists in the YAML file; use the task's actual type, priority, and testing effort.

### Updating and closing issues

- Change an issue's title, body, labels, assignee, or milestone only when the user asks for that change.
- Close an issue only when the user explicitly asks to close it. Verify that the correct issue is closed afterward.
- When an issue is closed, add a concise completion comment only if the user also requested a comment or the request clearly includes one.

## Milestones

### Existing milestones

Before assigning an issue, list the repository's milestones and confirm the exact milestone name. For versioned releases, use the `vX.Y.Z` naming format. Do not create a milestone as a side effect of creating an issue unless the user asks for a new milestone.

Do not guess milestone due dates or change an existing milestone's title, description, due date, or state without an explicit request.

### Standard issues for every versioned release

For every versioned release milestone (`vX.Y.Z`), ensure exactly one Code Review issue and one Documentation Review issue exist and belong to that milestone. This applies to existing milestones as well as newly created ones. Search open and closed issues before writing; create only missing issues. If an equivalent issue exists, verify that its scope, labels, assignee, and milestone match the release.

When creating a new versioned milestone, create or verify both issues as part of milestone setup.

1. **Code review issue**, based on #109. Include SonarQube analysis, code quality, complexity, duplication, type safety, performance, architecture, test completeness, and documentation completeness.
2. **Documentation review issue**, based on #110. Include a migration guide from the previous version, a systematic `docs/` review, README release information, version references, and link validation.

Use the issue labels and assignee rules above and assign both issues to the new milestone.

## Labels

- Treat [`docs/config/labels.yml`](../config/labels.yml) as the repository's label catalog and check the actual GitHub labels before applying them.
- Use existing labels consistently. Do not create, rename, or delete repository labels unless the user explicitly asks.
- When an issue's classification is unclear, ask or leave that classification unchanged rather than guessing.

## Releases

### Release branch and pull request flow

- Choose the target from the issue's milestone and the current release plan.
- For a task in milestone `vX.Y.Z`, use the matching `release/X.Y.Z` branch when it exists. Create a task branch from it and open the task PR into that release branch.
- If the milestone has no matching release branch, do not create one or guess the PR target. Confirm the intended target.
- Promote the completed release with a separate PR from `release/X.Y.Z` into `master`, titled `Release vX.Y.Z`.
- Check the current CI filters before relying on PR checks. GitHub Actions currently runs for pushes to `master`, `develop`, and `release/*`, and for PRs targeting `master` and `develop`.

### GitHub Release and npm publication

- Review [`docs/development/publishing.md`](publishing) for the release checklist, and verify each command and step against the current `package.json` and workflow files before use.
- Confirm the release PR is merged and the selected tag points to the intended commit before creating a GitHub Release.
- A pushed tag matching `v*` triggers `.github/workflows/npm-publish.yml`, which publishes the package to npm. The workflow can also be run manually from GitHub Actions.
- Creating or pushing a release tag, creating or publishing a GitHub Release, publishing to npm, or manually starting the publication workflow requires an explicit user request. Never infer this authorization from a request to prepare release notes, review a release, or create a release PR.
- Do not run `npm version` as a convenience: it creates a commit and tag. Use it only when the user explicitly requests the version bump and resulting Git operations.
- After an authorized release action, verify the tag, GitHub Release, workflow result, and published package version as applicable.

## Completion checklist

Before reporting a GitHub project-management task complete:

- Confirm the intended repository and exact issue or milestone.
- Confirm that no duplicate issue or milestone was created.
- Verify the resulting title, body, labels, assignees, milestone, state, release tag, and publication status as relevant.
- State which remote changes were made and which requested operations remain unperformed.
