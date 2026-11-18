---
layout: page
title: Async adapter initialization
permalink: /guides/cli-async-initialization/
parent: CLI Adapter Development
grand_parent: Guides
nav_order: 3
---

# Async adapter initialization
{: .no_toc }

Initialize database connections and other asynchronous dependencies when creating an adapter.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Async Adapter Initialization (v0.8.2)

Many database adapters require asynchronous initialization - connecting to a database, authenticating, setting up connection pools, etc. MSR Core v0.8.2 provides a standardized factory pattern to eliminate boilerplate code and ensure consistency across adapters.

### The Problem

Without the factory pattern, every adapter must implement the same boilerplate:

```typescript
export class FirebaseRunner extends MigrationScriptRunner<IFirebaseDB, FirebaseHandler> {
    constructor(deps: IRunnerDependencies<IFirebaseDB, FirebaseHandler>) {
        super(deps);
    }

    static async getInstance(options: IFirebaseRunnerOptions): Promise<FirebaseRunner> {
        // Boilerplate: Create handler async
        const handler = await FirebaseHandler.getInstance(options.config);
        // Boilerplate: Construct with handler + options
        return new FirebaseRunner({ handler, ...options });
    }
}
```

**Problems:**
- ❌ Code duplication across every async adapter
- ❌ Easy to forget spreading `...options`
- ❌ Inconsistent patterns between adapters

### The Solution: `createInstance` Factory Method

MSR Core v0.8.2 provides a `protected static createInstance()` helper that standardizes the pattern:

```typescript
export class FirebaseRunner extends MigrationScriptRunner<IFirebaseDB, FirebaseHandler> {
    constructor(deps: IRunnerDependencies<IFirebaseDB, FirebaseHandler>) {
        super(deps);
    }

    static async getInstance(options: IFirebaseRunnerOptions): Promise<FirebaseRunner> {
        return MigrationScriptRunner.createInstance(
            FirebaseRunner,                                    // Runner class
            options,                                           // Options (IRunnerOptions or extension)
            (config) => FirebaseHandler.getInstance(config)    // Handler factory function
        );
    }
}
```

**Benefits:**
- ✅ Reduces boilerplate to 3 lines
- ✅ Consistent pattern across all adapters
- ✅ Type-safe with full generic support
- ✅ Handles option spreading automatically

### Type Parameters

The `createInstance` method supports all runner generics:

```typescript
protected static async createInstance<
    DB extends IDB,                                           // Your database interface
    THandler extends IDatabaseMigrationHandler<DB>,           // Your handler type
    TRunner extends MigrationScriptRunner<DB, THandler, TConfig>,  // Your runner subclass
    TConfig extends Config = Config,                          // Custom config type
    TOptions extends IRunnerOptions<DB, TConfig> = IRunnerOptions<DB, TConfig>  // Custom options
>(
    RunnerClass: new (deps: IRunnerDependencies<DB, THandler, TConfig>) => TRunner,
    options: TOptions,
    createHandler: (config: TConfig) => Promise<THandler>
): Promise<TRunner>
```

### Example: Firebase Adapter

```typescript
// Firebase-specific config
export class FirebaseConfig extends Config {
    credential?: string;
    databaseURL?: string;
}

// Firebase-specific options (optional - can extend IRunnerOptions)
export interface IFirebaseRunnerOptions extends IRunnerOptions<IFirebaseDB, FirebaseConfig> {
    // Can add Firebase-specific options here if needed
}

export class FirebaseRunner extends MigrationScriptRunner<IFirebaseDB, FirebaseHandler, FirebaseConfig> {
    constructor(deps: IRunnerDependencies<IFirebaseDB, FirebaseHandler, FirebaseConfig>) {
        super(deps);
    }

    static async getInstance(options: IFirebaseRunnerOptions): Promise<FirebaseRunner> {
        return MigrationScriptRunner.createInstance(
            FirebaseRunner,
            options,
            async (config) => {
                // Your async initialization logic
                const app = await initializeApp(config.credential);
                return new FirebaseHandler(app, config);
            }
        );
    }
}

// Usage
const runner = await FirebaseRunner.getInstance({
    config: new FirebaseConfig({
        credential: './serviceAccount.json',
        databaseURL: 'https://my-app.firebaseio.com'
    })
});

await runner.up();
```

### Example: MongoDB Adapter

```typescript
export class MongoRunner extends MigrationScriptRunner<IMongoDb, MongoHandler> {
    constructor(deps: IRunnerDependencies<IMongoDb, MongoHandler>) {
        super(deps);
    }

    static async getInstance(options: IRunnerOptions<IMongoDb>): Promise<MongoRunner> {
        return MigrationScriptRunner.createInstance(
            MongoRunner,
            options,
            async (config) => {
                // Connect to MongoDB
                const client = await MongoClient.connect(config.connectionString);
                const db = client.db(config.database);
                return new MongoHandler(db, config);
            }
        );
    }
}
```

### When to Use

**Use `createInstance` when:**
- ✅ Handler requires async initialization (database connections, authentication, etc.)
- ✅ You want consistency with other async adapters
- ✅ You want to reduce boilerplate code

**Don't use `createInstance` when:**
- ⛔ Handler is synchronous (no async initialization needed)
- ⛔ You need custom constructor logic before handler creation
- ⛔ Your initialization pattern doesn't fit the factory approach

### Synchronous Adapters

Synchronous adapters don't need the factory pattern - just use the regular constructor:

```typescript
export class SimpleRunner extends MigrationScriptRunner<IDB, SimpleHandler> {
    constructor(options: IRunnerOptions<IDB>) {
        const handler = new SimpleHandler(options.config);  // Synchronous
        super({ handler, ...options });
    }
}

// Usage
const adapter = new SimpleRunner({ config });
await adapter.up();
```

### Error Handling

The factory method propagates errors from handler creation:

```typescript
static async getInstance(options: IRunnerOptions<IDB>): Promise<MyRunner> {
    return MigrationScriptRunner.createInstance(
        MyRunner,
        options,
        async (config) => {
            try {
                const client = await DatabaseClient.connect(config.connectionString);
                return new MyHandler(client, config);
            } catch (error) {
                throw new Error(`Failed to connect to database: ${error.message}`);
            }
        }
    );
}
```

### CLI Integration

Use the factory method with async runner support (v0.8.2) and custom config type (v0.8.4):

This example keeps flat option names to demonstrate explicit mapping into the
typed `FirebaseConfig`. Dot-notation options are an additive alternative when
the adapter config itself uses nested properties.

```typescript
import {createCLI} from '@migration-script-runner/core';
import {FirebaseRunner} from './FirebaseRunner';
import {FirebaseConfig} from './FirebaseConfig';
import {IFirebaseDB} from './FirebaseHandler';

// ✅ NEW in v0.8.4: Use TConfig generic for type-safe config
const program = createCLI<IFirebaseDB, FirebaseRunner, FirebaseConfig>({
    name: 'firebase-migrations',

    // Custom CLI flags (v0.8.3)
    addCustomOptions: (program) => {
        program
            .option('--database-url <url>', 'Firebase Realtime Database URL')
            .option('--credentials <path>', 'Path to service account key file');
    },

    // ✅ config is typed as FirebaseConfig - no casting needed!
    extendFlags: (config, flags) => {
        if (flags.databaseUrl) {
            config.databaseURL = flags.databaseUrl as string;
        }
        if (flags.credentials) {
            config.credential = flags.credentials as string;
        }
    },

    // ✅ config is typed as FirebaseConfig - no casting needed!
    createRunner: async (config) => {
        return FirebaseRunner.getInstance({ config });
    }
});

program.parse(process.argv);
```

**Before v0.8.4 (required type casting):**
```typescript
const program = createCLI({
    createRunner: async (config) => {
        // ❌ Required cast because config was typed as base Config
        return FirebaseRunner.getInstance({
            config: config as FirebaseConfig
        });
    }
});
```

**After v0.8.4 (type-safe with TConfig):**
```typescript
// ✅ Third generic parameter provides type safety
const program = createCLI<IFirebaseDB, FirebaseRunner, FirebaseConfig>({
    createRunner: async (config) => {
        // ✅ config is automatically typed as FirebaseConfig!
        return FirebaseRunner.getInstance({ config });
    }
});
```

---

**Previous:** [Custom CLI commands](cli-custom-commands) · **Next:** [Complete adapter example](cli-complete-example)
