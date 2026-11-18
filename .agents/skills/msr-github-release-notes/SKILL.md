---
name: msr-github-release-notes
description: Draft or revise MSR Core GitHub Release titles and notes using verified release scope and the style of prior MSR releases. Do not use for unrelated repositories or general marketing copy.
---

# MSR GitHub Release Notes

Write user-facing GitHub Release notes for MSR Core that explain what changed, why it matters, and how users can upgrade. Keep them consistent with the project's previous releases without copying irrelevant sections or inventing facts.

## Reference examples

Review the relevant prior releases when preparing notes:

- [v0.8.0 — Production-Ready Locking & Enhanced Type Safety](https://github.com/migration-script-runner/msr-core/releases/tag/v0.8.0) explains major features through practical value, implementation examples, compatibility, upgrade guidance, and documentation links.
- [v0.8.2 — Developer Experience Improvements](https://github.com/migration-script-runner/msr-core/releases/tag/v0.8.2) links feature sections to their issues, uses before/after examples, and summarizes migration impact, documentation, and verified metrics.

Use these as evidence for the project's established style, not as a mandatory section checklist. Choose a length and structure that match the release scope.

## Establish the release scope

Before drafting, verify the included changes against the release milestone/issues, merged pull requests, current changelog and migration guide, and relevant code or documentation. Read `docs/development/github-project-workflow.md` before any GitHub release operation. Keep implementation detail only when it helps a user understand adoption or behavior.

Do not invent release dates, compatibility claims, issue counts, test/coverage metrics, API behavior, or included work. Confirm each issue number and link it to its specific section. If a metric or claim cannot be verified, omit it.

## Writing recommendations

- Give the release a descriptive title in the project's established form: `vX.Y.Z - <user-visible theme>`. Name its defining benefit or feature rather than using a generic title.
- Start with a short overview that says who benefits and what the release changes. For a major release, state clearly whether it includes breaking changes.
- Organize notes around meaningful user-visible features and fixes. Link each related issue directly in the section heading or nearby bullet, for example `[#150](https://github.com/migration-script-runner/msr-core/issues/150)`; do not leave issue references only in a detached issue list.
- For substantial API or CLI changes, include a compact verified before/after example, configuration snippet, or command. Explain the practical reason for the change and its benefit.
- Separate breaking changes from additive features and fixes. Give users a concise migration checklist and link the relevant migration guide.
- Call out security, dependencies, and repository-maintenance work when relevant, but keep internal automation secondary to user-facing functionality.
- Link the migration guide, full changelog or compare view, and relevant documentation. Do not add a `Related Releases` section or enumerate previous releases; GitHub already records the release history.
- Include installation commands only after confirming the package/version is actually available. A draft release is not a published package.
- Add metrics only when verified and useful. Do not add a `Contributors` section; GitHub already displays release contributors. Do not copy old test counts, coverage claims, dates, or compatibility statements into a new release.

A useful outline for a substantial release is: title and overview; feature/fix sections with issue links; breaking changes and migration; security or maintenance notes; documentation and upgrade links; full changelog. Omit sections that add no useful information. Never add `Contributors` or `Related Releases` sections.

## Draft and publication boundaries

Preparing or updating release-note text does not authorize publishing a release, creating or pushing a tag, or publishing a package. Follow the user's requested release state and verify it afterward. Per repository guidance, run `gh` only from the main project checkout root. For changelog files, migration guides, and documentation navigation, also follow [`.agents/skills/msr-release-changelog/SKILL.md`](../msr-release-changelog/SKILL.md).
