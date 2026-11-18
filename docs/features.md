---
layout: default
title: Features
nav_order: 3
---

# Features
{: .no_toc }

MSR Core gives TypeScript and JavaScript projects a database-agnostic migration workflow. Core manages migrations and defines the contracts; database adapters provide database-specific behavior. See [MSR Ecosystem features](https://migration-script-runner.dev/features) for capabilities across adapters.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Core at a glance

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin: 24px 0;">
  <div style="background: #e8eaf6; padding: 20px; border-radius: 8px; border-left: 4px solid #5c6bc0;">
    <h3 style="color: #3f51b5; margin-top: 0;">🔌 Bring your own database</h3>
    <p style="margin-bottom: 0;">Use an existing adapter or implement the handler contracts for your own database. Core does not require a database-specific driver.</p>
  </div>
  <div style="background: #e1f5fe; padding: 20px; border-radius: 8px; border-left: 4px solid #29b6f6;">
    <h3 style="color: #0277bd; margin-top: 0;">🛡️ Control migration risk</h3>
    <p style="margin-bottom: 0;">Validate migrations before execution, detect checksum changes, and choose a rollback strategy that fits your database.</p>
  </div>
  <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #66bb6a;">
    <h3 style="color: #2e7d32; margin-top: 0;">⚙️ Fit your workflow</h3>
    <p style="margin-bottom: 0;">Run MSR through the CLI or as a library, then extend its loaders, validators, loggers, renderers, and lifecycle hooks.</p>
  </div>
  <div style="background: #fff3e0; padding: 20px; border-radius: 8px; border-left: 4px solid #ffa726;">
    <h3 style="color: #e65100; margin-top: 0;">📈 Operate with confidence</h3>
    <p style="margin-bottom: 0;">Use transactions, retries, optional migration locking, structured results, and execution metrics to support operational needs.</p>
  </div>
</div>

---

## Features by category

The tables group MSR Core capabilities by the work they support. Feature names link directly to their guides, configuration pages, or API references.

### Migration workflow

| Feature | What it provides |
|---------|------------------|
| **🎯 [Multiple migration formats](guides/writing-migrations)** | Run TypeScript, JavaScript, and SQL migrations in the same project. |
| **🔄 [Reversible migrations](guides/writing-migrations)** | Define `up()` and `down()` behavior, with configurable policies for migrations that cannot be reversed. |
| **📁 [Flexible file discovery](configuration/migration-settings)** | Find and order migration files with configurable patterns, recursive scanning, and version-based ordering. |
| **📦 [Batch execution](api/migration-script-runner)** | Execute multiple pending migrations with progress tracking and structured results. |
| **🎯 [Target and selective execution](guides/version-control)** | Run to a chosen version or select migrations through file patterns. |
| **📊 [Migration tracking and history](api/interfaces/schema-version)** | Track schema versions, applied migrations, execution timestamps, and checksums. |
| **⏱️ [Execution timing](customization/metrics/)** | Measure migration duration and include timing in execution results and metrics. |
| **🧰 [Setup migrations](guides/writing-migrations#special-beforemigrate-setup-script)** | Run an optional `beforeMigrate` script before MSR scans pending migrations. |
| **📋 [Migration status](api/cli-reference#commands)** | List migrations and inspect which are applied or pending through the CLI. |

### Safety, validation, and rollback

| Feature | What it provides |
|---------|------------------|
| **✅ [Pre-migration validation](customization/validation)** | Check migration structure and conventions before execution. |
| **🔎 [Duplicate and naming checks](customization/validation/built-in-validation)** | Detect duplicate timestamps and naming conflicts before they affect migration order. |
| **📂 [Checksum integrity and missing-file checks](customization/validation/checksum-integrity)** | Use checksums to detect changed migrations and identify missing files after they have been applied. |
| **⚠️ [Strict mode](customization/validation/built-in-validation)** | Treat validation warnings as errors when a stricter check is needed, including in CI/CD. |
| **📝 [Down-method policies](customization/validation/built-in-validation)** | Require, recommend, or allow migrations without a `down()` method according to rollback policy. |
| **🧪 [Dry-run mode](configuration/migration-settings#dryrun)** | Preview which migrations would run without making database changes or creating backups. |
| **💾 [Backup and restore](configuration/backup-settings)** | Let an adapter provide backup behavior; configure backup folders, names, timestamps, and cleanup. |
| **🔙 [Rollback strategies](configuration/rollback-settings)** | Choose `BACKUP`, `DOWN`, `BOTH`, or `NONE` according to your database and recovery needs. |

### Transactions and reliability

| Feature | What it provides |
|---------|------------------|
| **🔒 [Transaction modes](configuration/transaction-settings)** | Run migrations per migration, per batch, or without automatic transactions. |
| **🎚️ [SQL isolation levels](configuration/transaction-settings)** | Configure transaction isolation where the database adapter supports it. |
| **🔁 [Automatic retries](configuration/transaction-settings)** | Retry eligible transient failures with configurable attempts and exponential backoff. |
| **⚡ [Transient-error handling](guides/transaction-management#retriable-errors)** | Recognize retriable failures such as deadlocks and serialization conflicts. |
| **🌐 [NoSQL transactions](guides/transaction-management#nosql-database-support)** | Use callback-based transactions with compatible adapters, including Firestore and MongoDB integrations. SQL isolation levels do not apply to callback transactions. |
| **🔍 [Transaction capability detection](guides/transaction-management#automatic-detection)** | Use transaction support supplied by the adapter and validate compatibility before execution. |
| **⏲️ [Transaction timeouts](configuration/transaction-settings)** | Configure limits for transaction operations. |
| **🔐 [Optional migration locking](configuration/locking-settings)** | Coordinate migration runs across processes through an adapter-provided locking implementation. |
| **📈 [Transaction metrics](customization/metrics/)** | Observe transaction duration, retry attempts, and failures through the metrics APIs. |

### Adapters and extensibility

| Extension point | What it enables |
|-----------------|-----------------|
| **🗄️ [Database handler](api/interfaces/database-handler)** | Connect SQL, NoSQL, or custom data stores through the handler contract. Core does not require or bundle a database-specific driver. |
| **🧩 [CLI factory](guides/cli-adapter-development)** | Build a database-specific CLI on top of MSR's commands and adapter options. |
| **🖥️ [Built-in CLI commands](api/cli-reference)** | Run migration, list, down, validate, backup, and optional lock-management commands. |
| **🔢 [Nested adapter CLI options](guides/cli-options-and-flags#nested-configuration-flags)** | Map adapter flags such as `--mongo.uri` to nested configuration. |
| **📄 [Custom loaders](api/interfaces/index)** | Add migration file formats through loader interfaces. |
| **✅ [Custom validators](customization/validation/custom-validation)** | Add project-specific validation rules. |
| **🪝 [Lifecycle hooks](customization/hooks)** | Observe or extend migration lifecycle events for monitoring and application-specific behavior. |
| **🎨 [Custom renderers](customization/render-strategies/)** | Format CLI migration results for your workflow. |
| **📝 [Custom loggers](customization/loggers/)** | Send log output to the destinations and infrastructure your application uses. |

### Configuration and integration

| Feature | What it provides |
|---------|------------------|
| **⚙️ [Programmatic API](api/)** | Configure and run migrations from a TypeScript or JavaScript application. |
| **🖥️ [CLI support](api/cli-reference)** | Run built-in migration commands or extend the CLI for a database adapter. |
| **🌍 [Environment variables](guides/environment-variables)** | Configure MSR with `MSR_*` variables for deployment environments. |
| **🗂️ [`.env` files](guides/environment-variables)** | Load environment-specific `.env` files with configurable priority. |
| **📄 [Config files](configuration/)** | Use supported JavaScript, JSON, YAML, TOML, and XML formats; some formats use optional peer dependencies. |
| **🧱 [Configuration defaults](configuration/config-reference)** | Start with built-in defaults and override only the settings relevant to your application. |
| **🧰 [Configuration areas](configuration/)** | Dedicated settings cover migration discovery, validation, rollback, backups, and transactions. |

### Observability and operations

| Capability | What it provides |
|------------|------------------|
| **📊 [Execution summaries](customization/metrics/)** | Review structured JSON/text summaries and migration results. |
| **📈 [Metrics collectors](customization/metrics/)** | Collect metrics for console, logger, JSON, and CSV output. |
| **🎚️ [Log levels](api/environment-variables/core-variables)** | Set output verbosity to `error`, `warn`, `info`, or `debug`. |
| **🎭 [Multiple loggers](customization/loggers/composite-logger)** | Combine built-in or custom loggers to send output to multiple destinations. |
| **🪝 [Lifecycle events](customization/hooks)** | Connect hooks to monitoring, alerting, and other application behavior. |
| **🎨 [Output formats](customization/render-strategies/)** | Render output as ASCII tables, JSON, silent output, or a custom format. |

### Developer experience and quality

| Capability | What it means |
|------------|---------------|
| **📘 [TypeScript-first API](getting-started)** | Public types and generic database contracts provide typed migration development and IDE support. |
| **🧪 [100% test coverage](development/testing)** | The local pre-commit hook checks 100% statement, branch, function, and line coverage. |
| **📚 [Documentation and examples](.)** | Guides, API references, configuration pages, and migration examples support implementation and operation. |
| **🧩 [Modular architecture](development/architecture/)** | Separate responsibilities and dependency injection support adapter and application integration. |
| **📦 [npm package](https://www.npmjs.com/package/@migration-script-runner/core)** | Install MSR Core as `@migration-script-runner/core` in a Node.js project. |
| **🧰 [Library-first behavior](guides/cli-vs-api)** | Programmatic runs return structured results instead of terminating the host process with `process.exit()`. |

### Deployment and packaging

| Capability | What it means |
|------------|---------------|
| **🐳 [Docker and Kubernetes](guides/docker-kubernetes)** | Configure MSR in containerized deployments using environment variables and deployment secrets. |
| **🖥️ [Cross-platform Node.js](getting-started)** | Use MSR in Node.js applications deployed to Linux, macOS, or Windows, subject to the selected adapter and driver. |

---

## Choose by use case

| If you need to... | Start with... |
|-------------------|---------------|
| Run migrations during development | [Getting Started](getting-started) and [writing migrations](guides/writing-migrations) |
| Validate migrations in CI/CD | [Validation](customization/validation) and [environment variables](guides/environment-variables) |
| Reduce risk in production | [Rollback settings](configuration/rollback-settings), [transactions](guides/transaction-management), and [locking](configuration/locking-settings) |
| Monitor operations and migration history | [Metrics](customization/metrics/), [loggers](customization/loggers/), [hooks](customization/hooks), and [schema versioning](api/interfaces/schema-version) |
| Integrate a database or extend the CLI | [Database handler](api/interfaces/database-handler) and [CLI adapter development](guides/cli-adapter-development) |
| Embed migrations in an application | [API reference](api/) and [CLI vs API usage](guides/cli-vs-api) |

---

## Get started

- **[Getting Started](getting-started)** — Install MSR Core and run your first migration.
- **[Configuration](configuration/)** — Configure migration, validation, rollback, backup, and transaction behavior.
- **[Guides](guides/)** — Follow detailed implementation and operations guides.
- **[API Reference](api/)** — Explore public classes, interfaces, and types.
- **[MSR Ecosystem features](https://migration-script-runner.dev/features)** — Compare capabilities across database adapters.

---

## Release history and upgrades

- **[GitHub Releases](https://github.com/migration-script-runner/msr-core/releases)** — Browse release notes and changes for each version.
- **[Version migration guides](version-migration/)** — Follow upgrade instructions when moving between MSR Core versions.
