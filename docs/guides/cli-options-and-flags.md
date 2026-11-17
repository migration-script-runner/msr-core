---
layout: page
title: CLI options and built-in commands
permalink: /guides/cli-options-and-flags/
parent: CLI Adapter Development
grand_parent: Guides
nav_order: 1
---

# CLI options and built-in commands
{: .no_toc }

Configure the common CLI options, built-in commands, and adapter-specific flags.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## CLI Options

The `createCLI()` function accepts a `CLIOptions` object:

### Required Options

#### `createRunner`

Factory function that receives the final merged configuration and CLI-selected dependencies, then returns a `MigrationScriptRunner` instance (your adapter).

**Type**: `(config: Config, cliOptions: {logger?: ILogger; renderStrategy?: IRenderStrategy<DB>}) => MigrationScriptRunner<DB>`

**Example**:
```typescript
createRunner: (config, {logger, renderStrategy}) => {
  // Initialize your database handler with the merged config
  const handler = new PostgresHandler({
    connectionString: config.postgresUri,
    ssl: config.ssl,
  });

  // Return your adapter instance
  return new PostgresRunner({handler, config, logger, renderStrategy});
}
```

`--log-level` is applied to `config.logLevel`. `cliOptions.logger` contains the logger selected with `--logger`. `cliOptions.renderStrategy` contains a `JsonRenderStrategy` when `--format json` is selected; otherwise it is `undefined` and the runner's default table renderer applies. Forward these options to the runner so the CLI flags take effect.

{: .important-title }
> Configuration Waterfall
>
> The `config` parameter contains the final merged configuration with this priority:
> 1. Built-in defaults
> 2. Config file (if `--config-file` flag provided)
> 3. Environment variables (`MSR_*`)
> 4. `options.config` (if provided)
> 5. CLI flags (highest priority)

### Optional Options

#### `name`

CLI program name. Defaults to `'msr'`.

```typescript
name: 'msr-postgres'
```

#### `description`

CLI program description. Defaults to `'Migration Script Runner'`.

```typescript
description: 'PostgreSQL Migration Runner'
```

#### `version`

CLI program version. Defaults to `'1.0.0'`.

```typescript
version: '2.1.0'
```

#### `config`

Partial configuration to merge with defaults. This is merged after file/environment config but before CLI flags.

```typescript
config: {
  folder: './migrations',
  tableName: 'schema_versions',
  displayLimit: 20,
}
```

#### `configLoader`

Custom configuration loader implementing `IConfigLoader<Config>`. If not provided, uses the default `ConfigLoader`.

```typescript
import {ConfigLoader} from '@migration-script-runner/core';

const customLoader = new ConfigLoader<Config>();
// Customize loader as needed

const program = createCLI({
  createRunner: (config) => new MyRunner({config}),
  configLoader: customLoader,
});
```

#### `extendCLI` (Recommended for custom commands)

Optional callback to add custom commands with full type safety. Called after base commands are registered.

**Type**: `(program: Command, createRunner: () => TRunner) => void`

**Benefits**:
- ✅ Full TypeScript type inference - no casting needed
- ✅ Config already merged with CLI flags
- ✅ Clean API - all custom commands in one place
- ✅ Type-safe access to adapter methods

**Example**:
```typescript
// v0.8.0+: Type-safe handler access with second generic parameter
class PostgresRunner extends MigrationScriptRunner<IPostgresDB, PostgresHandler> {
  async vacuum(): Promise<void> {
    // ✓ this.handler is typed as PostgresHandler (full IDE autocomplete!)
    await this.handler.db.query('VACUUM ANALYZE');
  }

  getConnectionInfo() {
    // ✓ Access handler-specific properties without casting
    return {
      host: this.handler.config.host,
      port: this.handler.config.port
    };
  }
}

const program = createCLI({
  createRunner: (config) => new PostgresRunner({handler, config}),

  extendCLI: (program, createRunner) => {
    program
      .command('vacuum')
      .description('Run VACUUM ANALYZE')
      .action(async () => {
        const adapter = await createRunner(); // ✓ Typed as PostgresRunner!
        await adapter.vacuum(); // ✓ TypeScript knows about vacuum()
        console.log('✓ Vacuum completed');
        process.exit(0);
      });

    program
      .command('connection-info')
      .description('Display connection information')
      .action(async () => {
        const adapter = await createRunner();
        const info = adapter.getConnectionInfo(); // ✓ Full type safety
        console.log(`Host: ${info.host}:${info.port}`);
        process.exit(0);
      });
  }
});
```

{: .tip }
> **v0.8.0+**: Use the second generic parameter (`THandler`) for type-safe handler access in your adapter. This eliminates the need for casting and provides full IDE autocomplete for handler-specific properties.

{: .note }
> The `createRunner` function passed to `extendCLI` returns your adapter with the exact type you specified, enabling full IntelliSense and compile-time checking.

#### `addCustomOptions` & `extendFlags` (NEW in v0.8.3)

Add adapter-specific CLI options that integrate seamlessly with the config waterfall.

**Type**:
- `addCustomOptions`: `(program: Command) => void`
- `extendFlags`: `(config: Config, flags: CLIFlags) => void`

**Use Cases**:
- Database connection parameters (URLs, hosts, ports, credentials)
- Authentication settings (service account keys, tokens)
- Performance tuning (connection pools, timeouts)
- Feature flags (enable/disable specific functionality)

**Benefits**:
- ✅ Single command execution - no environment variable setup needed
- ✅ Highest priority in config waterfall (overrides file, env, and options.config)
- ✅ Follows familiar Commander.js patterns
- ✅ Appears in `--help` output automatically
- ✅ Perfect for CI/CD pipelines and quick testing

The Firebase and MongoDB examples below use flat option names with explicit
`extendFlags` mapping. This style remains supported. For nested adapter config,
use dot-notation flags as shown in [Nested Configuration Flags](#nested-configuration-flags).

**Example - Firebase Adapter**:
```typescript
const program = createCLI({
  name: 'msr-firebase',

  // Step 1: Add custom CLI flags
  addCustomOptions: (program) => {
    program
      .option('--database-url <url>', 'Firebase Realtime Database URL')
      .option('--credentials <path>', 'Path to service account key file')
      .option('--timeout [ms]', 'Connection timeout in milliseconds');
  },

  // Step 2: Map flag values to config
  extendFlags: (config, flags) => {
    if (flags.databaseUrl) {
      config.databaseUrl = flags.databaseUrl;
    }
    if (flags.credentials) {
      config.applicationCredentials = flags.credentials;
    }
    if (flags.timeout) {
      config.connectionTimeout = parseInt(flags.timeout, 10);
    }
  },

  createRunner: async (config) => {
    // config now contains databaseUrl, applicationCredentials, and connectionTimeout
    return FirebaseRunner.getInstance({ config });
  }
});
```

**Usage**:
```bash
# All config from CLI flags - no environment variables needed
npx msr-firebase migrate \
  --database-url https://my-project.firebaseio.com \
  --credentials ./serviceAccountKey.json \
  --timeout 30000

# Flags work with all commands
npx msr-firebase list --database-url https://my-project.firebaseio.com
npx msr-firebase validate --credentials ./key.json
```

**Example - MongoDB Adapter**:
```typescript
const program = createCLI({
  name: 'msr-mongodb',

  addCustomOptions: (program) => {
    program
      .option('--mongo-uri <uri>', 'MongoDB connection string')
      .option('--auth-source [source]', 'Authentication database (default: admin)')
      .option('--ssl', 'Enable SSL/TLS connection');
  },

  extendFlags: (config, flags) => {
    if (flags.mongoUri) {
      config.mongoUri = flags.mongoUri;
    }
    if (flags.authSource) {
      config.authSource = flags.authSource;
    }
    if (flags.ssl) {
      config.useSSL = flags.ssl;
    }
  },

  createRunner: (config) => new MongoRunner({ config })
});
```

**Commander.js Flag Syntax**:
- Required value: `--flag <value>` (must be provided)
- Optional value: `--flag [value]` (can be omitted)
- Boolean flag: `--flag` (presence = true, absence = false)
- Short + long: `-f, --flag <value>` (both work)

#### Nested Configuration Flags

Use dot notation in adapter-specific option names to map values directly into
nested configuration. `createCLI` detects these flags and applies them before
`extendFlags`, so the callback can still override or further transform values.

```typescript
import {setNestedValue} from '@migration-script-runner/core/cli/utils';

const program = createCLI({
  addCustomOptions: (program) => {
    program
      .option('--firebase.databaseUrl <url>', 'Firebase Database URL')
      .option('--firebase.credentials <path>', 'Service account key path')
      .option('--firebase.ssl <enabled>', 'Enable SSL')
      .option('--firebase.hosts.0 <host>', 'Primary Firebase host');
  },
  extendFlags: (config, flags) => {
    // Use the same helper for nested values from differently named flags.
    if (flags.legacyDatabaseUrl) {
      setNestedValue(config, 'firebase.databaseUrl', flags.legacyDatabaseUrl);
    }
  },
  createRunner: (config) => new FirebaseRunner({config})
});
```

```bash
msr-firebase migrate \
  --firebase.databaseUrl https://my-app.firebaseio.com \
  --firebase.credentials ./service-account.json \
  --firebase.ssl true \
  --firebase.hosts.0 primary.example.com
```

The resulting config contains `firebase.databaseUrl`,
`firebase.credentials`, `firebase.ssl: true`, and a `firebase.hosts` array.
Exact strings `true` and `false`, plus finite integer and decimal strings,
are converted to booleans and numbers. Other strings remain unchanged. Existing
object properties are retained when a nested CLI value updates another field.
Numeric path segments create arrays; they must be non-negative integer indexes.
Empty path segments and prototype-related keys are rejected.

**MongoDB example:**

```bash
msr-mongodb migrate \
  --mongo.uri mongodb://localhost:27017 \
  --mongo.authSource admin \
  --mongo.maxPoolSize 100
```

This produces a nested `mongo` config with `uri`, `authSource`, and numeric
`maxPoolSize` properties.

When you need to map a differently named flat flag, you can assign the nested
property directly in `extendFlags`. The adapter's config type should declare
the nested properties:

```typescript
import {Config, CLIFlags} from '@migration-script-runner/core';

interface FirebaseConfig extends Config {
  firebase?: {databaseUrl?: string};
}

const extendFlags = (config: FirebaseConfig, flags: CLIFlags): void => {
  if (typeof flags.legacyDatabaseUrl === 'string') {
    config.firebase = config.firebase || {};
    config.firebase.databaseUrl = flags.legacyDatabaseUrl;
  }
};
```

`setNestedValue` is also available from the package root:

```typescript
import {setNestedValue} from '@migration-script-runner/core';
```

**Flag Name Conversion**:
Commander.js automatically converts kebab-case flags to camelCase:
- `--database-url` becomes `flags.databaseUrl`
- `--auth-source` becomes `flags.authSource`
- `--connection-timeout` becomes `flags.connectionTimeout`
- `--firebase.databaseUrl` remains the `flags['firebase.databaseUrl']` key

**Config Waterfall Priority**:
```
1. Built-in defaults (lowest)
2. Config file (if --config-file flag provided)
3. Environment variables (MSR_*)
4. options.config (if provided)
5. Standard CLI flags (--folder, --table-name, etc.)
6. Custom CLI flags via extendFlags (highest priority)
```

{: .tip }
> **Best Practice**: Use `addCustomOptions` for database-specific parameters and `extendCLI` for database-specific commands. This keeps your CLI clean and follows the single responsibility principle.

{: .warning }
> **Type Safety**: The `flags` parameter in `extendFlags` has type `CLIFlags` which uses an index signature. You may need to cast values when assigning to strongly-typed config properties (e.g., `flags.timeout as string`).

---

## Built-in Commands

The CLI automatically includes these commands:

### `migrate [targetVersion]`

Runs pending migrations up to an optional target version.

**Aliases**: `up`

```bash
# Run all pending migrations
msr migrate

# Migrate to specific version
msr migrate 202501220100

# With options
msr migrate --dry-run --logger console --log-level debug
```

### `list`

Lists all migrations with their execution status.

```bash
# List all migrations
msr list

# List only last 10 migrations
msr list --number 10
msr list -n 10
```

### `down <targetVersion>`

Rolls back migrations to a specific target version.

**Aliases**: `rollback`

```bash
# Roll back to version
msr down 202501220100

# With options
msr down 202501220100 --dry-run
```

### `validate`

Validates all migration scripts without executing them.

```bash
# Validate all migrations
msr validate

# With logging
msr validate --logger console --log-level debug
```

### `backup`

Backup and restore operations (subcommands).

#### `backup create`

Creates a database backup.

```bash
msr backup create
```

#### `backup restore [backupPath]`

Restores from a backup file. Uses most recent backup if path not provided.

```bash
# Restore from specific backup
msr backup restore ./backups/backup-2025-01-22.bkp

# Restore from most recent backup
msr backup restore
```

#### `backup delete`

Deletes backup file.

```bash
msr backup delete
```

---

## Common CLI Flags

All commands support these common flags. Descriptions for options with a finite set
of values list those values in the CLI help output, and the CLI rejects values outside those choices.

| Flag | Short | Description | Type | Example |
|------|-------|-------------|------|---------|
| `--config-file` | `-c` | Configuration file path | string | `--config-file ./config.json` |
| `--folder` | | Migrations folder | string | `--folder ./db/migrations` |
| `--table-name` | | Schema version table name | string | `--table-name _versions` |
| `--display-limit` | | Max migrations to display | number | `--display-limit 50` |
| `--dry-run` | | Simulate without executing | boolean | `--dry-run` |
| `--backup-mode` | | Backup/restore behavior | `full\|create_only\|restore_only\|manual` | `--backup-mode manual` |
| `--logger` | | Logger type | console\|file\|silent | `--logger file` |
| `--log-level` | | Log level | error\|warn\|info\|debug | `--log-level debug` |
| `--log-file` | | Log file path (required with --logger file) | string | `--log-file ./logs/msr.log` |
| `--format` | | Output format | table\|json | `--format json` |

### Configuration Priority

CLI flags have the highest priority in the configuration waterfall:

```
Built-in defaults
    ↓
Config file (if --config-file provided)
    ↓
Environment variables (MSR_*)
    ↓
options.config (from createCLI)
    ↓
CLI flags (highest priority)
```

---

**Previous:** [CLI Adapter Development](cli-adapter-development) · **Next:** [Custom CLI commands](cli-custom-commands)
