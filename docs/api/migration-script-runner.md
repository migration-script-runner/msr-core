---
layout: default
title: MigrationScriptRunner
parent: API Reference
nav_order: 8
---

# MigrationScriptRunner
{: .no_toc }

Public migration operations provided by the abstract base class for database adapters.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

`MigrationScriptRunner` coordinates migration execution, validation, rollback, backups, and lock operations. It is **abstract**; implement a database-specific subclass and provide an `IDatabaseMigrationHandler` before constructing it.

The class has three generic parameters:

| Parameter | Constraint | Default | Purpose |
|---|---|---|---|
| `DB` | `IDB` | Required | Database interface used by migrations and the handler. |
| `THandler` | `IDatabaseMigrationHandler<DB>` | `IDatabaseMigrationHandler<DB>` | Concrete handler type available to adapter code. |
| `TConfig` | `Config` | `Config` | Configuration type, including adapter-specific extensions. |

```typescript
import {
  Config,
  IDB,
  IDatabaseMigrationHandler,
  MigrationScriptRunner
} from '@migration-script-runner/core';

interface AppDatabase extends IDB {
  query(sql: string): Promise<unknown>;
}

interface AppHandler extends IDatabaseMigrationHandler<AppDatabase> {
  getConnectionName(): string;
}

class AppRunner extends MigrationScriptRunner<AppDatabase, AppHandler> {}

declare function createDatabaseHandler(config: Config): AppHandler;

const config = new Config();
config.folder = './migrations';
const handler = createDatabaseHandler(config); // Adapter-provided factory
const runner = new AppRunner({ handler, config });
const result = await runner.migrate();
```

## Constructor

```typescript
new MigrationScriptRunner<DB, THandler, TConfig>(
  dependencies: IRunnerDependencies<DB, THandler, TConfig>
)
```

The class is abstract, so construct a concrete subclass. `dependencies.handler` is required. Use `dependencies.config` to provide a `TConfig`; otherwise the default `ConfigLoader` loads defaults, a config file, environment variables, and then dependency overrides. See [constructor details](core-classes#migrationscriptrunner) and the [configuration reference](../configuration/config-reference).

```typescript
class PostgresRunner extends MigrationScriptRunner<PostgresDB, PostgresHandler> {}

declare function createPostgresHandler(): PostgresHandler;
const postgresHandler = createPostgresHandler(); // Adapter-provided factory
const runner = new PostgresRunner({
  handler: postgresHandler,
  config: new Config()
});
```

## Public methods

### `createBackup()`

Create a backup using the configured backup settings and return its path. Useful for explicit backup workflows and `BackupMode.MANUAL`.

**Signature:** `createBackup(): Promise<string>`

**Returns:** The absolute path to the created backup file.

**Throws:** Errors from the database handler's backup implementation.

**Example:**

```typescript
const backupPath = await runner.createBackup();
console.log(`Backup created at ${backupPath}`);
```

### `deleteBackup()`

Delete the current backup when the configured backup behavior permits cleanup.

**Signature:** `deleteBackup(): void`

**Returns:** Nothing.

**Throws:** An error if the backup cannot be deleted.

**Example:**

```typescript
runner.deleteBackup();
```

### `down(targetVersion)`

Roll back migrations to the specified version, executing available `down()` methods in reverse chronological order.

**Signature:** `down(targetVersion: number): Promise<IMigrationResult<DB>>`

**Parameters:** `targetVersion` is the migration timestamp to roll back to.

**Returns:** A migration result describing the rollback operation.

**Throws:** An error if the target is invalid, a required `down()` method is missing, or rollback fails.

**Example:**

```typescript
const result = await runner.down(202501220100);
if (result.success) {
  console.log(`Rolled back ${result.executed.length} migration(s)`);
}
```

### `forceReleaseLock()`

Force-release the current migration lock. This is an administrative recovery operation: only call it after confirming that no migration is still running.

**Signature:** `forceReleaseLock(): Promise<void>`

**Returns:** Resolves when the lock has been released.

**Throws:** An error if the handler has no locking provider or the provider cannot release the lock.

**Example:**

```typescript
const status = await runner.getLockStatus();
if (status?.isLocked && confirmedStaleLock) {
  await runner.forceReleaseLock();
}
```

### `getHandler()`

Return the handler supplied to the constructor. Its type is preserved as `THandler`, so adapters can expose database-specific operations without casts.

**Signature:** `getHandler(): THandler`

**Returns:** The database migration handler.

**Example:**

```typescript
const handler = runner.getHandler();
console.log(handler.getName());
```

### `getLockStatus()`

Read the lock state from the handler's locking provider.

**Signature:** `getLockStatus(): Promise<ILockStatus | null>`

**Returns:** Lock details when a locking provider is configured, or `null` when it is not.

**Throws:** An error if the configured locking provider fails to read its status.

**Example:**

```typescript
const status = await runner.getLockStatus();
if (status?.isLocked) {
  console.log(`Lock held by ${status.lockedBy ?? 'unknown'}`);
}
```

### `list(number?)`

Display migration history. Pass a positive number to limit the displayed history; `0` (the default) displays all migrations.

**Signature:** `list(number?: number): Promise<void>`

**Parameters:** `number` is the maximum number of migrations to display. Defaults to `0`.

**Returns:** Resolves after rendering the migration history.

**Throws:** An error if MSR cannot initialize or read migration history.

**Example:**

```typescript
await runner.list();    // all migrations
await runner.list(10);  // last 10 migrations
```

### `migrate(targetVersion?)`

Run pending migrations. This is an alias for `up()`.

**Signature:** `migrate(targetVersion?: number): Promise<IMigrationResult<DB>>`

**Parameters:** `targetVersion`, when provided, limits execution to that migration timestamp.

**Returns:** The result of the migration run.

**Throws:** An error if the database connection check fails. Migration execution failures are also reported in the returned result.

**Example:**

```typescript
const result = await runner.migrate();
// Or stop at a particular migration:
const targeted = await runner.migrate(202501220100);
```

### `restoreFromBackup(backupPath?)`

Restore the database from a backup. If no path is provided, the configured backup service selects its most recent backup.

**Signature:** `restoreFromBackup(backupPath?: string): Promise<void>`

**Parameters:** `backupPath` is an optional path to the backup file.

**Returns:** Resolves when restore completes.

**Throws:** Errors from the database handler's restore implementation.

**Example:**

```typescript
await runner.restoreFromBackup('./backups/pre-deploy.bkp');
```

### `up(targetVersion?)`

Run pending migrations, optionally stopping at a target timestamp.

**Signature:** `up(targetVersion?: number): Promise<IMigrationResult<DB>>`

**Parameters:** `targetVersion` is an optional migration timestamp.

**Returns:** A result containing the migration outcome and executed migrations.

**Throws:** An error if the database connection check fails. Migration execution failures are also reported in the returned result.

**Example:**

```typescript
const result = await runner.up();
```

### `validate()`

Validate pending and previously executed migrations without executing them.

**Signature:**

```typescript
validate(): Promise<{
  pending: IValidationResult<DB>[];
  migrated: IValidationIssue[];
}>
```

**Returns:** Validation results for pending migrations and integrity issues for migrated files.

**Throws:** `ValidationError` when validation errors are found or strict validation treats warnings as errors.

**Example:**

```typescript
const results = await runner.validate();
console.log(`Pending checked: ${results.pending.length}`);
```

## Async adapter initialization

`MigrationScriptRunner.createInstance()` is a **protected static helper**, not a public factory that consumers call directly. Adapters can wrap it in a public `getInstance()` method when the handler needs asynchronous initialization. See [Async Adapter Initialization](../guides/cli-async-initialization).

**Signature:**

```typescript
protected static createInstance<
  DB extends IDB,
  THandler extends IDatabaseMigrationHandler<DB>,
  TRunner extends MigrationScriptRunner<DB, THandler, TConfig>,
  TConfig extends Config = Config,
  TOptions extends IRunnerOptions<DB, TConfig> = IRunnerOptions<DB, TConfig>
>(
  RunnerClass: new (dependencies: IRunnerDependencies<DB, THandler, TConfig>) => TRunner,
  options: TOptions,
  createHandler: (config: TConfig) => Promise<THandler>
): Promise<TRunner>
```

```typescript
static async getInstance(options: IRunnerOptions<AppDatabase>): Promise<AppRunner> {
  return MigrationScriptRunner.createInstance(
    AppRunner,
    options,
    (config) => AppHandler.connect(config)
  );
}
```

The adapter's `getInstance()` method is the public API.

## Related references

- [CLI reference](cli-reference)
- [Configuration reference](../configuration/config-reference)
- [Database handler interface](interfaces/database-handler)
- [Migration result type](interfaces/index)
