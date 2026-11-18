---
layout: default
title: Config Reference
parent: Configuration
grand_parent: API Reference
nav_order: 0
---

# Config Reference
{: .no_toc }

Properties, defaults, and environment-variable names for the `Config` object.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

Create `Config` in code or load it through `ConfigLoader`. The tables below describe the defaults from the current implementation. Paths shown as `process.cwd() + ...` are resolved against the process working directory.

Environment-variable names follow the `MSR_` prefix and nested property names in uppercase snake case. The exported `ENV` constants cover the names listed in the [Environment Variables API](../api/environment-variables); additional nested properties can be read by the automatic parser even when they do not have a named enum constant.

```typescript
import { Config, TransactionMode } from '@migration-script-runner/core';

const config = new Config();
config.folder = './database/migrations';
config.locking.enabled = true;
config.transaction.mode = TransactionMode.PER_MIGRATION;
```

## Core options

| Property | Type / values | Default | Purpose | Environment variable |
|---|---|---|---|---|
| `filePatterns` | `RegExp[]` | `V` + 12 digits + name; `.ts`, `.js`, and `.up.sql` patterns | Filenames recognized as migrations. | `MSR_FILE_PATTERNS` |
| `folder` | `string` | `process.cwd() + '/migrations'` | Directory scanned for migration files. | `MSR_FOLDER` |
| `tableName` | `string` | `schema_version` | Schema version table name. | `MSR_TABLE_NAME` |
| `displayLimit` | `number` | `0` (all) | Maximum migration rows displayed. | `MSR_DISPLAY_LIMIT` |
| `beforeMigrateName` | `string \| null` | `beforeMigrate` | Setup script name; `null` disables it. | `MSR_BEFORE_MIGRATE_NAME` |
| `recursive` | `boolean` | `true` | Scan migration subdirectories. | `MSR_RECURSIVE` |
| `rollbackStrategy` | `RollbackStrategy`: `backup`, `down`, `both`, `none` | `backup` | How failed migrations are rolled back. | `MSR_ROLLBACK_STRATEGY` |
| `backupMode` | `BackupMode`: `full`, `create_only`, `restore_only`, `manual` | `full` | Automatic backup and restore behavior. | `MSR_BACKUP_MODE` |
| `validateBeforeRun` | `boolean` | `true` | Validate pending migrations before execution. | `MSR_VALIDATE_BEFORE_RUN` |
| `strictValidation` | `boolean` | `false` | Treat validation warnings as errors. | `MSR_STRICT_VALIDATION` |
| `downMethodPolicy` | `DownMethodPolicy`: `AUTO`, `REQUIRED`, `RECOMMENDED`, `OPTIONAL` | `AUTO` | Policy for migrations without `down()`. | `MSR_DOWN_METHOD_POLICY` |
| `customValidators` | `IMigrationValidator[]` | `[]` | Additional programmatic validation rules. | Configure in code or a JavaScript config file. |
| `validateMigratedFiles` | `boolean` | `false` | Check integrity of already executed migration files. | `MSR_VALIDATE_MIGRATED_FILES` |
| `validateMigratedFilesLocation` | `boolean` | `true` | Require executed migration files to remain at their recorded paths. | `MSR_VALIDATE_MIGRATED_FILES_LOCATION` |
| `checksumAlgorithm` | `'md5' \| 'sha256'` | `sha256` | Hash algorithm used for migration checksums. | `MSR_CHECKSUM_ALGORITHM` |
| `duplicateTimestampMode` | `DuplicateTimestampMode`: `warn`, `error`, `ignore` | `warn` | Handling for duplicate migration timestamps. | `MSR_DUPLICATE_TIMESTAMP_MODE` |
| `dryRun` | `boolean` | `false` | Preview migrations without executing them. | `MSR_DRY_RUN` |
| `showBanner` | `boolean` | `true` | Display the startup banner. | `MSR_SHOW_BANNER` |
| `logLevel` | `'error' \| 'warn' \| 'info' \| 'debug'` | `info` | Minimum log severity to display. | `MSR_LOG_LEVEL` |
| `envFileSources` | `string[]` | `['.env.local', '.env', 'env']` | Env files loaded before environment parsing. | `MSR_ENV_FILE_SOURCES` |

`filePatterns` contains regular expressions in code. When supplying patterns through an environment variable or a non-JavaScript config format, check that the resulting values are regular expressions before running migrations; JavaScript config is the most direct option for custom regex patterns.

## Nested configuration

### `backup`

| Property | Type | Default | Purpose | Environment variable |
|---|---|---|---|---|
| `backup.timestamp` | `boolean` | `true` | Add a timestamp to the generated filename. | `MSR_BACKUP_TIMESTAMP` |
| `backup.deleteBackup` | `boolean` | `true` | Delete the backup after a successful migration. | `MSR_BACKUP_DELETE_BACKUP` |
| `backup.folder` | `string` | `process.cwd() + '/backups'` | Directory for backup files. | `MSR_BACKUP_FOLDER` |
| `backup.prefix` | `string` | `backup` | Filename prefix. | `MSR_BACKUP_PREFIX` |
| `backup.custom` | `string` | `''` | Custom filename component. | `MSR_BACKUP_CUSTOM` |
| `backup.suffix` | `string` | `''` | Filename suffix. | `MSR_BACKUP_SUFFIX` |
| `backup.timestampFormat` | `string` | `YYYY-MM-DD-HH-mm-ss` | Moment.js timestamp format. | `MSR_BACKUP_TIMESTAMP_FORMAT` |
| `backup.extension` | `string` | `bkp` | Filename extension without a dot. | `MSR_BACKUP_EXTENSION` |
| `backup.existingBackupPath` | `string \| undefined` | `undefined` | Existing backup used by `restore_only` mode. | `MSR_BACKUP_EXISTING_BACKUP_PATH` |

See [Backup Settings](backup-settings) for filename behavior and restore workflows.

### `transaction`

| Property | Type / values | Default | Purpose | Environment variable |
|---|---|---|---|---|
| `transaction.mode` | `TransactionMode`: `PER_MIGRATION`, `PER_BATCH`, `NONE` | `PER_MIGRATION` | Transaction scope for migration execution. | `MSR_TRANSACTION_MODE` |
| `transaction.isolation` | `IsolationLevel \| undefined`: `READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE` | `READ COMMITTED` | Database isolation level. | `MSR_TRANSACTION_ISOLATION` |
| `transaction.timeout` | `number \| undefined` | `30000` ms | Transaction timeout. | `MSR_TRANSACTION_TIMEOUT` |
| `transaction.retries` | `number \| undefined` | `3` | Retry attempts for transient failures. | `MSR_TRANSACTION_RETRIES` |
| `transaction.retryDelay` | `number \| undefined` | `100` ms | Initial delay between retries. | `MSR_TRANSACTION_RETRY_DELAY` |
| `transaction.retryBackoff` | `boolean \| undefined` | `true` | Apply exponential delay increase between retries. | `MSR_TRANSACTION_RETRY_BACKOFF` |

See [Transaction Settings](transaction-settings) for mode and isolation-level behavior.

### `locking`

| Property | Type | Default | Purpose | Environment variable |
|---|---|---|---|---|
| `locking.enabled` | `boolean` | `true` | Enable or disable migration locking. | `MSR_LOCKING_ENABLED` |
| `locking.timeout` | `number` | `600000` ms | Maximum lock lifetime. | `MSR_LOCKING_TIMEOUT` |
| `locking.tableName` | `string` | `migration_locks` | Database table storing lock records. | `MSR_LOCKING_TABLE_NAME` |
| `locking.retryAttempts` | `number` | `0` | Lock acquisition retries; zero fails fast. | `MSR_LOCKING_RETRY_ATTEMPTS` |
| `locking.retryDelay` | `number` | `1000` ms | Delay between lock retries. | `MSR_LOCKING_RETRY_DELAY` |

See [Locking Settings](locking-settings) for concurrency guidance.

### `logging`

Execution-summary logging is separate from the `logLevel` used for console verbosity.

| Property | Type / values | Default | Purpose | Environment variable |
|---|---|---|---|---|
| `logging.enabled` | `boolean` | `false` | Write migration execution summaries. | `MSR_LOGGING_ENABLED` |
| `logging.logSuccessful` | `boolean` | `false` | Include successful executions in summaries. | `MSR_LOGGING_LOG_SUCCESSFUL` |
| `logging.path` | `string` | `./logs/migrations` | Directory for summary files. | `MSR_LOGGING_PATH` |
| `logging.format` | `SummaryFormat`: `json`, `text`, `both` | `json` | Summary file format. | `MSR_LOGGING_FORMAT` |
| `logging.maxFiles` | `number` | `0` (unlimited) | Maximum summary files to retain. | `MSR_LOGGING_MAX_FILES` |

## Configuration loading

`ConfigLoader` merges configuration in this order:

1. Built-in defaults.
2. The first config file found. `MSR_CONFIG_FILE` takes precedence over automatic discovery.
3. Environment variables beginning with `MSR_`.
4. Explicit overrides passed to `ConfigLoader.load()` or in `IRunnerDependencies.config`.
5. In `createCLI()`, `CLIOptions.config`, standard CLI flags, and adapter `extendFlags` are applied afterward, in that order.

Automatic discovery searches `msr.config.js`, `msr.config.json`, `msr.config.yaml`, `msr.config.yml`, `msr.config.toml`, and `msr.config.xml` in that order. YAML, TOML, and XML support requires their optional parser packages (`js-yaml`, `@iarna/toml`, and `fast-xml-parser`).

TypeScript (`.ts`) config files are not auto-discovered by the current loader.

### Example config file

```yaml
folder: ./database/migrations
tableName: schema_version
dryRun: false
backupMode: full
rollbackStrategy: backup
locking:
  enabled: true
  timeout: 600000
transaction:
  mode: PER_MIGRATION
  retries: 3
```

Set one property with environment variables or use a complete JSON object for nested settings:

```bash
MSR_FOLDER=./database/migrations
MSR_BACKUP='{"folder":"./backups","deleteBackup":false}'
MSR_TRANSACTION_MODE=PER_BATCH
```

For environment-variable enums and examples, see [Environment Variables](../api/environment-variables). For detailed options, see [Migration Settings](migration-settings), [Validation Settings](validation-settings), [Rollback Settings](rollback-settings), [Backup Settings](backup-settings), [Transaction Settings](transaction-settings), and [Locking Settings](locking-settings).
