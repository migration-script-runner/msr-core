---
name: msr-release-changelog
description: Use when updating MSR Core release notes in CHANGELOG.md or the documentation site, including version migration guides and their sidebar placement. Do not use for unrelated repositories or general release writing.
---

# MSR Release Changelog

Keep MSR Core's root `CHANGELOG.md`, migration guides, and version-migration navigation consistent when recording or preparing a release.

## Read before editing

In the target checkout, read:

- `docs/development/documentation-writing-standards.md`
- `docs/development/publishing.md`
- `CHANGELOG.md`
- The current migration-guide index and relevant existing guide

Verify release facts against the issue or pull request, changed code, `package.json`, Git tags, and GitHub release state as applicable. A package version bump or release branch alone does not mean a release was published. Do not invent dates, included changes, compatibility statements, or issue links. Preserve existing historical entries unless the user asks to correct them and evidence supports the correction.

## Update release notes and guides

- Add unreleased, user-visible changes under `## [Unreleased]` in the existing category structure. Use concise bullets and link the related issue when its number is known.
- When a release is confirmed published, move the relevant unreleased entries under its version heading and use the verified release date. Do not create tags, publish packages, or create GitHub releases unless explicitly asked.
- Create or update a version migration guide when the change requires user upgrade steps, especially for breaking API changes. Include verified before/after examples, actionable steps, and relevant behavior changes.
- Preserve old API names in historical guides when they describe an earlier release. In a new guide, distinguish old names from current names clearly.
- Update release links in README or other index pages when they point to the migration guide being changed.

## Maintain version-migration navigation

Treat `docs/version-migration/index.md`, `docs/version-migration/previous.md`, and guide front matter as one navigation structure:

- List the latest upgrade path under **Current Upgrade Guide**.
- When a newer guide becomes current, move the former current entry to **Previous Releases** and link it from `previous.md`.
- For a historical guide shown in the Previous sidebar submenu, set `parent: Previous`, `grand_parent: Version Migration`, and an appropriate `nav_order`.
- Keep the Previous landing page and sidebar ordering consistent with the release chronology.

Follow the repository's writing and navigation requirements in `docs/development/documentation-writing-standards.md`; use `docs/development/publishing.md` for the full release checklist.

## Verify

Run `git diff --check`, build the documentation site with `npm run docs:build`, and inspect the rendered navigation and changed links. Review the diff to confirm that release notes match verified changes and that historical entries were not accidentally rewritten. Do not stage, commit, or push unless the user explicitly requests those operations.
