---
layout: page
title: CLI Adapter Development
permalink: /guides/cli-adapter-development/
parent: Guides
nav_order: 8
has_children: true
---

# CLI Adapter Development
{: .no_toc }

Learn how to build a command-line interface for a database adapter using MSR Core.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

MSR Core provides a `createCLI()` factory function that creates a fully-featured command-line interface for your database adapter. The CLI includes all standard migration commands and can be extended with custom commands specific to your database.

Use the [CLI Reference](../api/cli-reference) for the exact built-in command, option, and exit-code list. The [MigrationScriptRunner API](../api/migration-script-runner) documents the public runner methods available to adapter code.

### Key Features

- **Built-in Commands**: migrate, list, down, validate, backup (create/restore/delete)
- **Configuration Waterfall**: Merges config from defaults → file → environment → options → CLI flags
- **Extensible**: Add custom database-specific commands with full type safety via `extendCLI` callback
- **Type-Safe**: Full TypeScript support with generics - no type casting needed
- **Logger Integration**: Support for console, file, and silent loggers

---

## Quick Start

### Async Adapter (Recommended Pattern)

Most database adapters require async initialization. Use the `createInstance` helper for clean, standardized adapters:

{: .important }
> **Best Practice:** Use this pattern for MongoDB, PostgreSQL, Firebase, MySQL, and most production databases.

```typescript
import {createCLI, MigrationScriptRunner, IRunnerDependencies, IRunnerOptions} from '@migration-script-runner/core';
import {MongoHandler} from './MongoHandler';
import {IMongoDb} from './types';

// Define your adapter with async initialization
class MongoRunner extends MigrationScriptRunner<IMongoDb, MongoHandler> {
  constructor(deps: IRunnerDependencies<IMongoDb, MongoHandler>) {
    super(deps);
  }

  static async getInstance(options: IRunnerOptions<IMongoDb>): Promise<MongoRunner> {
    return MigrationScriptRunner.createInstance(
      MongoRunner,
      options,
      async (config) => MongoHandler.connect(config.mongoUri || 'mongodb://localhost')
    );
  }
}

// Create CLI with async runner
const program = createCLI({
  name: 'msr-mongodb',
  description: 'MongoDB Migration Runner',
  version: '1.0.0',
  createRunner: async (config, {logger}) => {
    return MongoRunner.getInstance({config, logger});
  }
});

program.parse(process.argv);
```

The second `createRunner` argument carries the logger selected with `--logger`. Pass it to the runner options so the CLI choice is used; if `--logger` is omitted, the `logger` property is `undefined` and the runner's default logger applies.

**Benefits:**
- ✅ Handles async connections, authentication, pooling
- ✅ Standardized pattern across ecosystem
- ✅ Type-safe with zero boilerplate
- ✅ Consistent with other MSR adapters

### With Custom Commands

Add database-specific commands using the `extendCLI` callback:

```typescript
import {createCLI} from '@migration-script-runner/core';
import {MongoRunner} from './MongoRunner';

const program = createCLI({
  name: 'msr-mongodb',
  createRunner: async (config) => MongoRunner.getInstance({config}),

  // Add custom commands with full type safety
  extendCLI: (program, createRunner) => {
    program
      .command('mongo:stats')
      .description('Show database statistics')
      .action(async () => {
        const adapter = await createRunner(); // ✓ Typed as MongoRunner!
        const stats = await adapter.getHandler().getStats(); // ✓ Type-safe!
        console.table(stats);
        process.exit(0);
      });
  }
});

program.parse(process.argv);
```

### Sync Adapter (For Simple Cases)

For handlers without async initialization needs (in-memory databases, file-based storage):

```typescript
import {createCLI, MigrationScriptRunner} from '@migration-script-runner/core';
import {SimpleHandler} from './SimpleHandler';
import { IDB } from '@migration-script-runner/core';

class ExampleRunner<DB extends IDB> extends MigrationScriptRunner<DB> {}


const program = createCLI({
  name: 'msr-simple',
  createRunner: (config) => {
    const handler = new SimpleHandler();  // Synchronous
    return new ExampleRunner({handler, config});
  }
});

program.parse(process.argv);
```

{: .note }
> Use sync pattern only when your handler doesn't need async initialization. See [examples/simple-cli.ts](../../examples/simple-cli.ts) for a runnable example.

---

## Custom Configuration Types

{: .new }
> **NEW in v0.8.2:** Type-safe custom configuration with `TConfig` generic parameter

MSR allows you to extend the base `Config` class with adapter-specific properties, providing full type safety throughout your adapter implementation.

### Why Custom Config?

Database adapters often need additional configuration beyond MSR's base settings:

- **Connection Strings**: Database URLs, host/port combinations
- **Pool Settings**: Connection pool size, timeout settings
- **Authentication**: API keys, OAuth tokens, service account paths
- **Database-Specific Options**: Region, cluster name, replica set name

Instead of casting or using workarounds, v0.8.2 enables proper type-safe configuration.

### Basic Example

```typescript
import { Config, MigrationScriptRunner, IDB, IDatabaseMigrationHandler } from '@migration-script-runner/core';

// 1. Extend Config with adapter-specific properties
class AppConfig extends Config {
  databaseUrl?: string;
  connectionPoolSize?: number;
  apiKey?: string;
}

// 2. Use TConfig generic in your adapter
class MyRunner extends MigrationScriptRunner<IDB, MyHandler, AppConfig> {
  // this.config is now typed as AppConfig!

  async initializeConnection(): Promise<void> {
    // Full IDE autocomplete for custom properties
    const url = this.config.databaseUrl;
    const poolSize = this.config.connectionPoolSize ?? 10;
    const apiKey = this.config.apiKey;

    // Use properties to configure connection
    await this.handler.connect(url, { poolSize, apiKey });
  }
}

// 3. Pass config instance to runner
const config = new AppConfig();
config.databaseUrl = 'https://my-db.example.com';
config.connectionPoolSize = 20;
config.apiKey = process.env.API_KEY;

const adapter = new MyRunner({
  handler: new MyHandler(),
  config: config  // Typed as AppConfig
});
```

### CLI Integration

Use custom config with `createCLI()`:

```typescript
import { createCLI, IRunnerOptions } from '@migration-script-runner/core';

class FirebaseConfig extends Config {
  databaseUrl?: string;
  projectId?: string;
  serviceAccountPath?: string;
}

const program = createCLI<IDB, MyHandler, FirebaseConfig>({
  name: 'msr-firebase',
  version: '1.0.0',
  createRunner: (config: FirebaseConfig) => {
    // config is typed as FirebaseConfig
    const handler = new MyHandler({
      databaseUrl: config.databaseUrl,
      projectId: config.projectId,
      serviceAccountPath: config.serviceAccountPath
    });

    return new MyRunner({
      handler,
      config  // No casting needed!
    });
  }
});

program.parse(process.argv);
```

### Loading Custom Config from Files

Users can define custom properties in configuration files:

**msr.config.json:**
```json
{
  "migrationsPath": "./migrations",
  "databaseUrl": "https://my-project.firebaseio.com",
  "projectId": "my-project-id",
  "connectionPoolSize": 15,
  "apiKey": "${API_KEY}"
}
```

**msr.config.js:**
```javascript
module.exports = {
  migrationsPath: './migrations',
  databaseUrl: process.env.DATABASE_URL,
  projectId: 'my-project',
  connectionPoolSize: 15
};
```

The config loader automatically picks up custom properties when loading from files.

### Advanced: Custom Config Loader

For complex config needs, implement a custom `IConfigLoader<TConfig>`:

```typescript
import { IConfigLoader, ConfigLoader } from '@migration-script-runner/core';

class FirebaseConfigLoader implements IConfigLoader<FirebaseConfig> {
  load(): FirebaseConfig {
    // Load base config
    const baseLoader = new ConfigLoader<FirebaseConfig>();
    const config = baseLoader.load();

    // Add Firebase-specific defaults
    if (!config.databaseUrl) {
      config.databaseUrl = process.env.FIREBASE_DATABASE_URL;
    }
    if (!config.projectId) {
      config.projectId = process.env.FIREBASE_PROJECT_ID;
    }

    // Validate Firebase-specific config
    if (!config.databaseUrl) {
      throw new TypeError('databaseUrl is required for Firebase adapter');
    }

    return config;
  }
}

// Use custom loader in runner
const adapter = new MyRunner({
  handler: new MyHandler(),
  configLoader: new FirebaseConfigLoader()  // Custom loader
});
```

### Type Safety Benefits

**Before v0.8.2** (without TConfig):
```typescript
class MyRunner extends MigrationScriptRunner<IDB, MyHandler> {
  initializeConnection() {
    // Need to cast or use 'any' ❌
    const url = (this.config as any).databaseUrl;
    // OR create wrapper interface ❌
  }
}
```

**After v0.8.2** (with TConfig):
```typescript
class MyRunner extends MigrationScriptRunner<IDB, MyHandler, AppConfig> {
  initializeConnection() {
    // Full type safety ✅
    const url = this.config.databaseUrl;
    // IDE autocomplete works ✅
    // Compile-time validation ✅
  }
}
```

### Common Patterns

#### 1. Connection Configuration
```typescript
class MongoConfig extends Config {
  mongoUri?: string;
  replicaSet?: string;
  authDatabase?: string;
}
```

#### 2. Cloud Service Configuration
```typescript
class FirebaseConfig extends Config {
  databaseUrl?: string;
  projectId?: string;
  serviceAccountPath?: string;
  storageBucket?: string;
}
```

#### 3. Performance Tuning
```typescript
class PostgresConfig extends Config {
  connectionString?: string;
  maxConnections?: number;
  idleTimeoutMs?: number;
  statementTimeout?: number;
}
```

#### 4. Multi-Environment Configuration
```typescript
class AppConfig extends Config {
  environment?: 'development' | 'staging' | 'production';
  databaseUrl?: string;
  enableDebugLogging?: boolean;
  metricsEndpoint?: string;
}
```

### Best Practices

### Name database implementations with `Runner`

Name each database-specific class that extends `MigrationScriptRunner` as `<Database>Runner`, and use the same name for its source file and export. For example, use `FirebaseRunner`, `MongoRunner`, and `PostgresRunner` rather than `FirebaseAdapter`, `MongoAdapter`, or `PostgresAdapter`.

Keep database operations in a separate `<Database>Handler` class. “Adapter” can still describe the integration's role in prose, but the implementation class name should end in `Runner` so it is consistent with `MigrationScriptRunner` and the MSR project name.

1. **Optional Properties**: Make custom properties optional (`?`) with sensible defaults
2. **Environment Variables**: Support env vars for sensitive data (API keys, connection strings)
3. **Validation**: Validate required custom properties in your handler constructor
4. **Documentation**: Document custom config properties in your adapter's README
5. **Type Safety**: Leverage TypeScript - avoid `any` or type assertions

### Backward Compatibility

The `TConfig` generic parameter is **fully backward compatible**:

```typescript
// Still works - defaults to base Config
class MyRunner extends MigrationScriptRunner<IDB, MyHandler> {
  // this.config is typed as Config (base class)
}

// Or explicitly use base Config
class MyRunner extends MigrationScriptRunner<IDB, MyHandler, Config> {
  // Same as above
}
```

Existing adapters continue to work without changes.

---

**Continue:** [CLI options and built-in commands →](cli-options-and-flags)
