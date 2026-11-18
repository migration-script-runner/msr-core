---
layout: default
title: Compatibility
nav_order: 8
---

# Compatibility

## Node.js

`package.json` requires Node.js `>=20.0.0`. The GitHub Actions test matrix currently verifies Node.js 20.x and 22.x; CircleCI uses 20.18. Other Node.js versions that satisfy the engine range are not currently covered by CI. Use Node.js 20 for local development (`.nvmrc`). Any change to the minimum supported version should update `package.json`, CI, this page, and the release notes together. Support for a Node.js line will be removed only with a documented release and a version change consistent with the project's SemVer policy.

## TypeScript and JavaScript

The project is built with TypeScript 5.9 and targets ES2019 CommonJS. JavaScript consumers use the compiled package; TypeScript consumers use its generated declaration files. The repository does not currently run a compatibility matrix for older TypeScript compiler versions, so no older compiler minimum is guaranteed.

## Databases and adapters

MSR Core is database agnostic. Database support depends on the adapter and the handler interfaces it implements. Check the adapter's own compatibility statement for database versions and optional capabilities such as transactions, locking, and backup/restore.

## Release changes

Breaking API or runtime support changes belong in the [changelog](https://github.com/migration-script-runner/msr-core/blob/master/CHANGELOG.md) and the appropriate [migration guide](version-migration/). Refer to the [release process](development/publishing) before publishing a new version.
