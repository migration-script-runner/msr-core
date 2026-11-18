---
layout: default
title: Core Classes
parent: API Reference
nav_order: 1
---

# Core Classes
{: .no_toc }

The main classes for executing and managing migrations.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## MigrationScriptRunner

The abstract base class for executing database migrations. Create a database-specific subclass before constructing a runner; `MigrationScriptRunner` cannot be instantiated directly.

For the constructor and complete method reference, see [MigrationScriptRunner API](migration-script-runner).

**Generic type parameters:**
- `DB extends IDB` — database-specific type.
- `THandler extends IDatabaseMigrationHandler<DB>` — concrete handler type; defaults to the handler interface.
- `TConfig extends Config` — adapter-specific configuration type; defaults to `Config`.

```typescript
import {
  Config,
  IDB,
  IDatabaseMigrationHandler,
  MigrationScriptRunner
} from '@migration-script-runner/core';

interface IMyDatabase extends IDB {
  query(sql: string): Promise<unknown[]>;
}

type MyHandler = IDatabaseMigrationHandler<IMyDatabase> & {
  customProperty: string;
};

class AppConfig extends Config {
  databaseUrl?: string;
  connectionPoolSize?: number;
}

class MyRunner extends MigrationScriptRunner<IMyDatabase, MyHandler, AppConfig> {
  getConnectionInfo(): string {
    return this.handler.customProperty;
  }

  getDatabaseUrl(): string | undefined {
    return this.config.databaseUrl;
  }
}

function createRunner(handler: MyHandler, config: AppConfig): MyRunner {
  return new MyRunner({ handler, config });
}
```

### Constructor

The constructor accepts one dependency object. The database handler is required; configuration and service overrides are optional.

```typescript
constructor(dependencies: IRunnerDependencies<DB, THandler, TConfig>)
```

**Dependencies:**
- `handler`: Required database migration handler implementing `IDatabaseMigrationHandler<DB>`.
- `config`: Optional `TConfig`; if omitted, the configured loader resolves defaults, config files, and environment variables.
- `configLoader`: Optional custom configuration loader.
- `logger`: Optional logger; defaults to the console logger with configured log-level filtering.
- `backupOrchestrator`, `rollbackService`, `schemaVersionOrchestrator`, `migrationRenderer`, `migrationService`, `migrationScanner`, `validationService`: Optional replacements for the corresponding internal services.
- `renderStrategy`: Optional output strategy; defaults to the ASCII table strategy unless a custom migration renderer is supplied.
- `hooks`: Optional migration lifecycle hooks.
- `metricsCollectors`: Optional metrics collectors; defaults to an empty list.
- `loaderRegistry`: Optional custom registry; defaults to the built-in migration loaders.

### Public API

The `MigrationScriptRunner` provides high-level methods for migration operations. Services are not exposed as public properties; use documented public methods instead (e.g., `createBackup()`, `restoreFromBackup()`, `validate()`).

### Methods

The method examples below use a `runner` instance returned by `createRunner(handler, config)` in the preceding example.

#### getHandler()

Get the database migration handler instance.

```typescript
getHandler(): THandler
```

**Returns:** `THandler` - The database migration handler instance, fully typed according to the THandler generic parameter

**Behavior:**
- Returns the handler passed to the constructor
- Preserves full type information through THandler generic
- Enables CLI custom commands to access handler functionality
- Allows external code to access handler properties and methods

**Use Cases:**
- CLI custom commands that need database operations
- Accessing handler configuration or metadata
- Type-safe handler access with THandler generic parameter
- Custom integrations that need direct handler access

**Example (Basic Handler Access):**
```typescript
import { Config, IDatabaseMigrationHandler, IDB, MigrationScriptRunner } from '@migration-script-runner/core';

class ExampleRunner<DB extends IDB> extends MigrationScriptRunner<DB> {}

const config = new Config();
declare function createDatabaseHandler(config: Config): IDatabaseMigrationHandler<IDB>;
const handler = createDatabaseHandler(config);
const runner = new ExampleRunner({ handler, config });
const h = runner.getHandler();

console.log(`Database: ${h.getName()}`);
console.log(`Version: ${h.getVersion()}`);
```

**Example (CLI Custom Commands):**
```typescript
import { Config, createCLI, IDatabaseMigrationHandler, IDB, MigrationScriptRunner } from '@migration-script-runner/core';

class ExampleRunner<DB extends IDB> extends MigrationScriptRunner<DB> {}

declare function createDatabaseHandler(config: Config): IDatabaseMigrationHandler<IDB>;

const program = createCLI({
  createRunner: (config) => {
    const handler = createDatabaseHandler(config);
    return new ExampleRunner({ handler, config });
  },
  extendCLI: (program, createRunner) => {
    program
      .command('vacuum')
      .description('Run VACUUM ANALYZE on database')
      .action(async () => {
        const runner = await createRunner();
        const handler = runner.getHandler();

        // Direct database operation
        await handler.db.query('VACUUM ANALYZE');
        console.log('✓ Vacuum completed');
      });

    program
      .command('connection-info')
      .description('Display database connection details')
      .action(async () => {
        const runner = await createRunner();
        const handler = runner.getHandler();

        console.log(`Database: ${handler.getName()}`);
        console.log(`Version: ${handler.getVersion()}`);
      });
  }
});
```

**Example (Type-Safe Adapter with THandler Generic):**
```typescript
// Define custom handler interface
interface PostgresHandler extends IDatabaseMigrationHandler<IDB> {
  pool: { totalCount: number; idleCount: number };
  getConnectionInfo(): { host: string; port: number };
}

// Create adapter with THandler generic
class PostgresRunner extends MigrationScriptRunner<IDB, PostgresHandler> {
  displayPoolStats() {
    // Internal: this.handler is typed as PostgresHandler
    console.log(`Pool size: ${this.handler.pool.totalCount}`);
  }
}

// External access is also type-safe
const adapter = new PostgresRunner({ handler: postgresHandler, config });
const handler = adapter.getHandler();  // Typed as PostgresHandler!

console.log(`Idle connections: ${handler.pool.idleCount}`);
const info = handler.getConnectionInfo();  // ✓ Full type safety!
console.log(`Connected to ${info.host}:${info.port}`);
```

---

#### createInstance() (Static Factory Method)

Factory method for creating runner instances with async handler initialization.

```typescript
protected static async createInstance<
    DB extends IDB,
    THandler extends IDatabaseMigrationHandler<DB>,
    TRunner extends MigrationScriptRunner<DB, THandler, TConfig>,
    TConfig extends Config = Config,
    TOptions extends IRunnerOptions<DB, TConfig> = IRunnerOptions<DB, TConfig>
>(
    RunnerClass: new (deps: IRunnerDependencies<DB, THandler, TConfig>) => TRunner,
    options: TOptions,
    createHandler: (config: TConfig) => Promise<THandler>
): Promise<TRunner>
```

**Parameters:**
- `RunnerClass`: Constructor of the runner subclass
- `options`: Runner options (can be adapter-specific interface extending `IRunnerOptions`)
- `createHandler`: Async factory function for creating the handler

**Returns:** `Promise<TRunner>` - Instance of the runner subclass

{: .important }
> **Best Practice**: Always use `createInstance` for async adapters to ensure consistency across the MSR ecosystem and reduce boilerplate code.

**Example (Firebase Adapter):**
```typescript
export interface IFirebaseRunnerOptions extends IRunnerOptions<IFirebaseDB, FirebaseConfig> {
    // Can add Firebase-specific options here
}

export class FirebaseRunner extends MigrationScriptRunner<IFirebaseDB, FirebaseHandler, FirebaseConfig> {
    private constructor(deps: IRunnerDependencies<IFirebaseDB, FirebaseHandler, FirebaseConfig>) {
        super(deps);
    }

    static async getInstance(options: IFirebaseRunnerOptions): Promise<FirebaseRunner> {
        return MigrationScriptRunner.createInstance(
            FirebaseRunner,
            options,
            (config) => FirebaseHandler.getInstance(config)
        );
    }
}

// Usage
const runner = await FirebaseRunner.getInstance({
    config: new FirebaseConfig({ credential: './serviceAccount.json' })
});
await runner.up();
```

**Example (MongoDB Adapter with Custom Initialization):**
```typescript
export class MongoRunner extends MigrationScriptRunner<IMongoDb, MongoHandler> {
    private constructor(deps: IRunnerDependencies<IMongoDb, MongoHandler>) {
        super(deps);
    }

    static async getInstance(options: IRunnerOptions<IMongoDb>): Promise<MongoRunner> {
        return MigrationScriptRunner.createInstance(
            MongoRunner,
            options,
            async (config) => {
                const client = await MongoClient.connect(config.connectionString);
                return new MongoHandler(client, config);
            }
        );
    }
}
```

**Learn More:**
- [Async Adapter Initialization Guide](../guides/cli-async-initialization)
- [Design Patterns: Async Adapter Factory](../development/architecture/design-patterns)

---

#### migrate()

Execute all pending migrations and return a structured result.
`migrate(targetVersion?)` is an alias for [`up(targetVersion?)`](#up).

```typescript
migrate(targetVersion?: number): Promise<IMigrationResult<DB>>
```

**Returns:** `Promise<IMigrationResult<DB>>` containing:
- `success`: `boolean` - Whether all migrations completed successfully
- `executed`: `MigrationScript[]` - Migrations executed during this run
- `migrated`: `MigrationScript[]` - Previously executed migrations from database history
- `ignored`: `MigrationScript[]` - Migrations with timestamps older than the last executed
- `errors?`: `Error[]` - Array of errors if any occurred (only present when success is false)

**Example (Library Usage):**
```typescript
import { IMigrationResult } from '@migration-script-runner/core';

const result: IMigrationResult = await runner.migrate();

if (result.success) {
  console.log(`✅ Successfully executed ${result.executed.length} migrations`);
  console.log(`📋 Total migrated: ${result.migrated.length}`);
  // Continue with application startup
  startServer();
} else {
  console.error('❌ Migration failed:', result.errors);
  // Handle error gracefully without terminating process
  await sendAlert(result.errors);
}
```

**Example (CLI Usage):**
```typescript
const result = await runner.migrate();
process.exit(result.success ? 0 : 1);
```

---

#### list()

Display all migrations with their execution status.

```typescript
list(number?: number): Promise<void>
```

**Parameters:**
- `number` (optional): Maximum number of migrations to display (0 = all). Defaults to 0.

**Prints a formatted table showing:**
- Timestamp and name of each migration
- Execution date/time for completed migrations
- Duration of execution
- Whether the migration file still exists locally

**Example:**
```typescript
// List all migrations
await runner.list();

// List only the last 10 migrations
await runner.list(10);

// Outputs:
// +-------------+------------------+----------+----------+
// | Timestamp   | Name             | Executed | Duration |
// +-------------+------------------+----------+----------+
// | 202501220100| initial_setup    | ...      | 0.5s     |
// +-------------+------------------+----------+----------+
```

---

#### up()

Execute all pending migrations or migrate to a specific target version.

```typescript
up(targetVersion?: number): Promise<IMigrationResult<DB>>
```

**Parameters:**
- `targetVersion` (optional): The target version timestamp to migrate to (inclusive). If omitted, executes all pending migrations.

**Returns:** `Promise<IMigrationResult<DB>>` containing:
- `success`: `boolean` - Whether all migrations completed successfully
- `executed`: `MigrationScript[]` - Migrations executed during this run
- `migrated`: `MigrationScript[]` - Previously executed migrations from database history
- `ignored`: `MigrationScript[]` - Migrations with timestamps older than the last executed
- `errors?`: `Error[]` - Array of errors if any occurred (only present when success is false)

**Behavior:**
- Without parameter: Executes all pending migrations
- With targetVersion: Only executes migrations with timestamps <= targetVersion
- Skips if database is already at or beyond target version
- Creates backup before execution (if rollback strategy requires it)
- Executes beforeMigrate script if configured
- Saves migration state immediately after each execution
- Triggers rollback on failure according to configured strategy

**Example (Execute All Migrations):**
```typescript
const result = await runner.up();

if (result.success) {
  console.log(`✅ Executed ${result.executed.length} migrations`);
} else {
  console.error('❌ Migration failed:', result.errors);
  process.exit(1);
}
```

**Example (Controlled Deployment):**
```typescript
// Deploy up to specific version in production
const targetVersion = 202501220100;
const result = await runner.up(targetVersion);

if (result.success) {
  console.log(`✅ Database migrated to version ${targetVersion}`);
  console.log(`Executed ${result.executed.length} migrations`);
} else {
  console.error('❌ Migration failed:', result.errors);
  process.exit(1);
}
```

**Example (Partial Deployment):**
```typescript
// Deploy only migrations up to a specific point
// Useful for testing or staged deployments
const result = await runner.up(202501220300);

// Later, continue to next version
const result2 = await runner.up(202501220500);
```

{: .note }
> Migrations are saved to the database immediately after execution, ensuring the schema version table stays synchronized even if later migrations fail.

---

#### validate()

Validate pending and executed migrations without running them.

```typescript
validate(): Promise<{ pending: IValidationResult<DB>[], migrated: IValidationIssue[] }>
```

**Returns:** Object containing:
- `pending`: `IValidationResult[]` - Validation results for pending migrations
- `migrated`: `IValidationIssue[]` - Integrity check issues for executed migrations

**Behavior:**
- Validates structure and interface of pending migrations
- Validates integrity of already-executed migrations (checksums, file existence)
- Checks down() method requirements based on rollback strategy
- Runs custom validators if configured
- Does NOT execute migrations or connect to database for initialization

**Throws:** `ValidationError` if validation fails (errors found or warnings in strict mode)

**Example (CI/CD Pipeline):**
```typescript
try {
  await runner.validate();
  console.log('✓ All migrations are valid');
} catch (error) {
  console.error('❌ Migration validation failed:', error.message);
  process.exit(1);
}
```

---

#### createBackup()

Manually create a database backup.

```typescript
createBackup(): Promise<string>
```

**Returns:** `Promise<string>` - Absolute path to the created backup file

**Behavior:**
- Creates backup using configured backup settings
- Useful for manual backup workflows or when using `BackupMode.MANUAL`
- Backup file path follows configured naming conventions

**Example (Manual Backup Workflow):**
```typescript
import { BackupMode } from '@migration-script-runner/core';

// Configure for manual control
config.backupMode = BackupMode.MANUAL;

// Create backup manually
const backupPath = await runner.createBackup();
console.log(`Backup created: ${backupPath}`);

try {
  await runner.up();
  runner.deleteBackup();
} catch (error) {
  // Restore from backup on failure
  await runner.restoreFromBackup(backupPath);
}
```

**Example (Custom Backup Timing):**
```typescript
// Create backup before risky operation
const preUpdateBackup = await runner.createBackup();

// Perform operation
await performRiskyUpdate();

// Create another backup after
const postUpdateBackup = await runner.createBackup();
```

---

#### restoreFromBackup()

Restore database from a backup file.

```typescript
restoreFromBackup(backupPath?: string): Promise<void>
```

**Parameters:**
- `backupPath` (optional): Path to backup file. If not provided, uses the most recent backup created by `createBackup()`.

**Behavior:**
- Restores database to the state captured in the backup file
- Can restore from specific backup path or most recent backup
- Useful for manual restore workflows or selective restore based on conditions

**Example (Restore from Specific Backup):**
```typescript
await runner.restoreFromBackup('./backups/backup-2025-01-22.bkp');
```

**Example (Restore from Most Recent):**
```typescript
const backupPath = await runner.createBackup();
// ... migrations fail ...
await runner.restoreFromBackup(); // Uses backupPath automatically
```

**Example (Conditional Restore):**
```typescript
const backupPath = await runner.createBackup();
try {
  await runner.up();
} catch (error) {
  // Only restore for certain error types
  if (shouldRestore(error)) {
    await runner.restoreFromBackup(backupPath);
  }
}
```

---

#### deleteBackup()

Delete the backup file from disk.

```typescript
deleteBackup(): void
```

**Behavior:**
- Only deletes if `config.backup.deleteBackup` is `true`
- Safe to call multiple times (no error if file already deleted)
- Useful for manual cleanup after successful migrations

**Example (Manual Cleanup):**
```typescript
const backupPath = await runner.createBackup();
await runner.up();
runner.deleteBackup(); // Clean up after success
```

**Example (Conditional Cleanup):**
```typescript
config.backup.deleteBackup = true;
const backupPath = await runner.createBackup();

try {
  await runner.up();
  runner.deleteBackup(); // Auto-respects config
} catch (error) {
  // Keep backup for investigation
  console.log(`Backup preserved at: ${backupPath}`);
}
```

---

#### down()

Roll back migrations to a specific target version.

```typescript
down(targetVersion: number): Promise<IMigrationResult<DB>>
```

**Parameters:**
- `targetVersion`: The target version timestamp to downgrade to (migrations newer than this will be rolled back)

**Returns:** `Promise<IMigrationResult>` containing:
- `success`: `boolean` - Whether rollback completed successfully
- `executed`: `MigrationScript[]` - Migrations that were rolled back (empty after successful rollback)
- `migrated`: `MigrationScript[]` - Remaining migrations after rollback
- `ignored`: `MigrationScript[]` - Ignored migrations (typically empty for down)
- `errors?`: `Error[]` - Array of errors if any occurred (only present when success is false)

**Behavior:**
- Rolls back all migrations with timestamps > targetVersion
- Executes down() methods in reverse chronological order (newest first)
- Removes migration records from schema version table after successful rollback
- Throws error if any migration is missing a down() method
- Skips if database is already at or below target version

**Requirements:**
- All migrations to be rolled back **must** implement the `down()` method
- down() methods must be idempotent (safe to run multiple times)

**Example (Rollback to Specific Version):**
```typescript
// Current database version: 202501220300
// Rollback to version 202501220100
const result = await runner.down(202501220100);

if (result.success) {
  console.log(`✅ Rolled back to version 202501220100`);
  console.log(`Removed ${result.executed.length} migrations`);
} else {
  console.error('❌ Rollback failed:', result.errors);
  process.exit(1);
}
```

**Example (Complete Rollback):**
```typescript
// Rollback all migrations (return to empty database)
const result = await runner.down(0);

if (result.success) {
  console.log('✅ All migrations rolled back');
  console.log('Database returned to initial state');
}
```

**Example (Round-trip Migration for Testing):**
```typescript
// Test that migrations can be applied and rolled back
const upResult = await runner.up(202501220300);
console.log(`Applied ${upResult.executed.length} migrations`);

// Verify database state
await verifyDatabaseState();

// Rollback
const downResult = await runner.down(0);
console.log(`Rolled back ${downResult.executed.length} migrations`);
```

{: .warning }
> The rollback process calls `down()` methods in reverse chronological order and removes migration records from the schema version table. Ensure your down() methods properly reverse all changes made by the corresponding up() methods.

{: .important }
> If a migration is missing a down() method, `down()` will throw an error and stop. All migrations must implement down() if you plan to use rollback functionality.

---

#### getLockStatus()

Read the current migration lock status. Returns `null` when locking is not configured or when the provider reports no lock.

```typescript
getLockStatus(): Promise<ILockStatus | null>
```

```typescript
const status = await runner.getLockStatus();
if (status?.isLocked) {
  console.log(`Lock held by ${status.lockedBy}`);
}
```

See [Lock Commands](../guides/lock-commands) for CLI and recovery guidance.

---

#### forceReleaseLock()

Force-release the migration lock. This operation does not verify that the process holding the lock has stopped; confirm that it is stale before calling it.

```typescript
forceReleaseLock(): Promise<void>
```

```typescript
async function releaseConfirmedStaleLock(
  runner: MigrationScriptRunner<IDB>,
  confirmedStaleLock: boolean
): Promise<void> {
  if (confirmedStaleLock) {
    await runner.forceReleaseLock();
  }
}
```

The method rejects if the handler has no locking provider or the release fails. See [Lock Commands](../guides/lock-commands) for the safety procedure.

