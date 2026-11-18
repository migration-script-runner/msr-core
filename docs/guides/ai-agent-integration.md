---
layout: default
title: AI Agent Integration Guide
parent: Guides
nav_order: 13
---

# AI Agent Integration Guide
{: .no_toc }

A repository-aware workflow for AI coding agents integrating MSR Core into an existing TypeScript or JavaScript application.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Purpose

Use this guide when a user asks you to add or configure MSR in an application repository. It is an orientation map; the host application's instructions, existing architecture, and the detailed MSR documentation remain authoritative.

Before making changes, read the host repository's agent instructions (such as `AGENTS.md` or `CLAUDE.md`) and inspect its package manager, Node.js version, database client or ORM, current migration setup, scripts, and test conventions. Preserve the existing migration system unless the user asks to replace it.

Suggested task prompt: “Read the [MSR AI Agent Integration Guide](https://core.migration-script-runner.dev/guides/ai-agent-integration), inspect this application, and propose then implement the smallest suitable MSR integration. Follow this repository's instructions and conventions. Do not apply migrations to a shared or production database without my explicit authorization.”

## Choose an integration route

MSR Core coordinates migration discovery, validation, execution, tracking, and rollback. It does not bundle a database driver or a database-specific adapter. First check the project's existing dependencies and the current [MSR ecosystem](https://migration-script-runner.dev/) for an adapter that supports the database and MSR Core version in use.

| Application need | Recommended route |
|------------------|-------------------|
| Use an existing database adapter | Follow that adapter's installation and configuration instructions, then use [Getting Started](../getting-started). The [repository README](https://github.com/migration-script-runner/msr-core/blob/master/README.md) links to the currently listed ecosystem implementations. |
| Integrate migrations in application code | Use the [MigrationScriptRunner API](../api/migration-script-runner) and [CLI vs API guide](cli-vs-api). |
| Keep migrations as SQL files | Follow the [SQL Migrations Guide](sql-migrations). The database connection type exposed by the handler must implement `ISqlDB`. |
| Replace an existing Flyway workflow | Follow [Migrating from Flyway](migrating-from-flyway), especially its history-mapping and cutover checks. |
| Build a project-specific database integration | Implement the [database handler contract](../api/interfaces/database-handler) and provide a concrete `MigrationScriptRunner` subclass. |
| Build a reusable adapter CLI | Follow [CLI Adapter Development](cli-adapter-development), then consult the [CLI Reference](../api/cli-reference). |

If there is no suitable adapter, do not assume Core can connect directly to the database. Check whether the user wants a project-specific handler or a reusable adapter before expanding the task into a new integration package.

## Integration workflow

1. **Inspect the host project.** Identify its runtime and package manager from the lockfile and `package.json`; locate the database connection setup, migration files, deployment commands, tests, and environment configuration.
2. **Check compatibility.** Compare the project's Node.js version and TypeScript setup with the selected MSR Core and adapter versions. The repository's `package.json` and release information describe the checked-out version; they may differ from the published package.
3. **Choose API or CLI.** Prefer the programmatic API when migrations belong to the application's startup or deployment orchestration. Use a CLI when the project already manages migrations through explicit commands. Do not add automatic migration execution as a startup side effect unless the user requests it.
4. **Add the smallest integration.** Follow the host project's conventions. Reuse its database connection and configuration, add only the required handler, runner, config, migration files, and scripts, and keep credentials in the host project's secret-management mechanism.
5. **Select a migration format.** MSR supports TypeScript, JavaScript, and SQL migrations. SQL migration files use timestamped `.up.sql` files and optional `.down.sql` files; follow the relevant guide instead of inventing a naming convention.
6. **Verify without changing a live database.** Run the host project's type checks, tests, lint, or build as appropriate. Review the generated diff and the migration SQL. Do not run migrations against a shared, staging, or production database unless the user explicitly authorizes that operation.

## Database integration responsibilities

For a custom integration, the handler supplies the database connection and schema-version tracking through `IDatabaseMigrationHandler<DB>`. Implement the database-specific behavior in the host project or its adapter, not in MSR Core's generic migration logic.

- `IDB` is the base database contract; extend it with the methods migrations need.
- `ISchemaVersion<DB>` records which migrations have been applied.
- For SQL migrations, the handler's database type implements `ISqlDB` and its `query()` method.
- Backup, transaction, and locking providers are optional and depend on the chosen rollback and deployment requirements.
- A database-specific runner extends `MigrationScriptRunner`. Follow the adapter guide for runner and CLI naming conventions when creating a reusable adapter.

Use the [handler reference](../api/interfaces/database-handler), [runner reference](../api/migration-script-runner), and [configuration reference](../configuration/config-reference) for exact signatures and defaults.

## Documentation map

| Question | Start here |
|----------|------------|
| How do I install MSR and run the first migration? | [Getting Started](../getting-started) |
| How should migration files be structured? | [Writing Migrations](writing-migrations) and [SQL Migrations](sql-migrations) |
| Which command-line options and exit codes are supported? | [CLI Reference](../api/cli-reference) |
| How do I choose between the library API and CLI? | [CLI vs API Usage](cli-vs-api) |
| How do I configure transactions, retries, locks, or rollback? | [Transaction Management](transaction-management), [Lock Commands](lock-commands), and [Rollback Settings](../configuration/rollback-settings) |
| How should migrations run in CI/CD or containers? | [CI/CD Integration](ci-cd-integration) and [Docker & Kubernetes](docker-kubernetes) |
| What changed between MSR versions? | [Version Migration Guides](../version-migration/) |

## Report the integration clearly

When you finish, summarize the adapter and API/CLI path selected, the files and commands changed, the checks run, and any assumptions or decisions that still need the user's input. Distinguish local verification from migrations actually applied to a database.
