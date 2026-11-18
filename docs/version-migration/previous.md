---
layout: default
title: Previous
parent: Version Migration
nav_order: 1
has_children: true
---

# Previous Version Migrations
{: .no_toc }

Migration guides for releases before v1.0.0. For the current upgrade path, see [v0.8.x → v1.0.0](v0.8-to-v1.0.md).

- [**v0.7.x → v0.8.0**](v0.7-to-v0.8.md) - **Non-breaking:** Migration locking, handler generic type, down migration fix, and npm provenance
- [**v0.6.x → v0.7.0**](v0.6-to-v0.7.md) - **Breaking:** Single-parameter constructor, configuration in dependencies, and extensible `ConfigLoader`
- [**v0.5.x → v0.6.0**](v0.5-to-v0.6.md) - **Breaking:** Generic type parameters, constructor changes, and metrics collection
- [**v0.4.x → v0.5.0**](v0.4-to-v0.5.md) - **Non-breaking:** Transaction management, environment variables, and enhanced hooks
- [**v0.3.x → v0.4.0**](v0.3-to-v0.4.md) - **Breaking:** SQL migrations, `up()` / `down()` API, file patterns, and required `checkConnection()`
- [**v0.2.x → v0.3.0**](v0.2-to-v0.3.md) - **Breaking:** `migrate()` returns `IMigrationResult` and no longer calls `process.exit()`
- [**v0.1.x → v0.2.0**](v0.1-to-v0.2.md) - Package renamed to `@migration-script-runner/core`
