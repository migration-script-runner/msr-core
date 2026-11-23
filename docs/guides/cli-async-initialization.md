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

## Async adapter initialization

Many database adapters need configuration before they can connect, authenticate, or create connection pools. The Core factory resolves one typed configuration first, then passes that same object to handler creation and runner construction.

### The Problem

The previous factory called `createHandler(options.config)` before the runner constructor loaded configuration. When `options.config` was omitted, asynchronous adapters could not use configuration from Core's file and environment sources before connecting.

```typescript
export class FirebaseRunner extends MigrationScriptRunner<IFirebaseDB, FirebaseHandler> {
    constructor(deps: IRunnerDependencies<IFirebaseDB, FirebaseHandler>) {
        super(deps);
    }

    static async getInstance(options: IFirebaseRunnerOptions): Promise<FirebaseRunner> {
        // Previously this could receive undefined even when a config file or
        // MSR_* variables provided the database URL.
        const handler = await FirebaseHandler.getInstance(options.config);
        return new FirebaseRunner({ handler, ...options });
    }
}
```

The handler may therefore connect with a different or incomplete configuration than the runner later uses.

### Use the Core factory

Override the base `getInstance()` with adapter-specific options. Delegate config resolution, handler creation, and runner construction to the protected `createInstance()` helper:

```typescript
export class FirebaseRunner extends MigrationScriptRunner<IFirebaseDB, FirebaseHandler> {
    private constructor(deps: IRunnerDependencies<IFirebaseDB, FirebaseHandler, FirebaseConfig>) {
        super(deps);
    }

    static override getInstance(options: IFirebaseRunnerOptions): Promise<FirebaseRunner> {
        return this.createInstance(
            options,
            () => new FirebaseConfig(),
            (config) => FirebaseHandler.getInstance(config),
            (dependencies) => new FirebaseRunner(dependencies)
        );
    }
}
```

The base class also provides a `getInstance()` fallback that throws a clear error when an adapter forgets to override it. The typed override can keep its narrower `IFirebaseRunnerOptions` parameter and `FirebaseRunner` return type.

The private constructor is supported because the adapter passes a construction callback from inside its static method; Core does not need a public constructor reference or a type cast.

### Type Parameters

The `createInstance` method supports all runner generics:

```typescript
protected static async createInstance<
    DB extends IDB,                                           // Your database interface
    TConfig extends Config,                                   // Custom config type
    THandler extends IDatabaseMigrationHandler<DB>,           // Your handler type
    TRunner extends MigrationScriptRunner<DB, THandler, TConfig>,  // Your runner subclass
    TOptions extends IRunnerOptions<DB, TConfig>               // Custom options
>(
    options: TOptions,
    createDefaultConfig: () => TConfig,
    createHandler: (config: TConfig) => Promise<THandler>,
    createRunner: (dependencies: IRunnerDependencies<DB, THandler, TConfig>) => TRunner
): Promise<TRunner>
```

When `options.config` is supplied, Core uses that instance directly and skips the loader. Otherwise it starts with `createDefaultConfig()`, then the selected config loader applies its normal file and environment handling. The resolved config is passed unchanged to both callbacks and into the runner dependencies. Pass `configLoader` in `IRunnerOptions` to customize loading.

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
    private constructor(deps: IRunnerDependencies<IFirebaseDB, FirebaseHandler, FirebaseConfig>) {
        super(deps);
    }

    static override getInstance(options: IFirebaseRunnerOptions): Promise<FirebaseRunner> {
        return this.createInstance(
            options,
            () => new FirebaseConfig(),
            async (config) => {
                // Your async initialization logic
                const app = await initializeApp(config.credential);
                return new FirebaseHandler(app, config);
            },
            (dependencies) => new FirebaseRunner(dependencies)
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
    private constructor(deps: IRunnerDependencies<IMongoDb, MongoHandler>) {
        super(deps);
    }

    static override getInstance(options: IRunnerOptions<IMongoDb>): Promise<MongoRunner> {
        return this.createInstance(
            options,
            () => new Config(),
            async (config) => {
                // Connect to MongoDB
                const client = await MongoClient.connect(config.connectionString);
                const db = client.db(config.database);
                return new MongoHandler(db, config);
            },
            (dependencies) => new MongoRunner(dependencies)
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
static override getInstance(options: IRunnerOptions<IDB>): Promise<MyRunner> {
    return this.createInstance(
        options,
        () => new Config(),
        async (config) => {
            try {
                const client = await DatabaseClient.connect(config.connectionString);
                return new MyHandler(client, config);
            } catch (error) {
                throw new Error(`Failed to connect to database: ${error.message}`);
            }
        },
        (dependencies) => new MyRunner(dependencies)
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
