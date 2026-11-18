---
layout: default
title: SilentRenderStrategy
parent: Render Strategies
nav_order: 3
---

# SilentRenderStrategy

The `SilentRenderStrategy` suppresses all rendering output, making it ideal for testing, library usage, and scenarios where visual output is not desired.

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

SilentRenderStrategy produces zero output, ensuring completely silent operation. This is perfect for unit tests, automated systems, and library integrations where rendering output would clutter logs or interfere with other output.

## Features

- ✅ Zero output (complete silence)
- ✅ Zero configuration required
- ✅ Fastest performance (no I/O operations)
- ✅ Clean test output
- ✅ Library-friendly
- ✅ No file system overhead
- ✅ Perfect for headless environments

## Installation

SilentRenderStrategy is included in the core MSR package:

```typescript
import { SilentRenderStrategy } from '@migration-script-runner/core';
```

## Basic Usage

### With MigrationScriptRunner

```typescript
import { MigrationScriptRunner, SilentRenderStrategy } from '@migration-script-runner/core';
import { IDB } from '@migration-script-runner/core';

class ExampleRunner<DB extends IDB> extends MigrationScriptRunner<DB> {}


const runner = new ExampleRunner({ handler,
    renderStrategy: new SilentRenderStrategy()
});

await runner.migrate();  // No output produced
```

### In Tests

```typescript
import { MigrationScriptRunner, SilentRenderStrategy, SilentLogger } from '@migration-script-runner/core';
import { IDB } from '@migration-script-runner/core';

class ExampleRunner<DB extends IDB> extends MigrationScriptRunner<DB> {}


describe('Migration Tests', () => {
    let runner: MigrationScriptRunner;

    beforeEach(() => {
        runner = new ExampleRunner({ handler,
            logger: new SilentLogger(),
            renderStrategy: new SilentRenderStrategy()
        });
    });

    it('should execute migrations without output', async () => {
        // No console clutter during test execution
        const result = await runner.migrate();
        expect(result.success).toBe(true);
    });
});
```

### Library Integration

```typescript
import { MigrationScriptRunner, SilentRenderStrategy } from '@migration-script-runner/core';
import { IDB } from '@migration-script-runner/core';

class ExampleRunner<DB extends IDB> extends MigrationScriptRunner<DB> {}


class MyApplication {
    async initDatabase() {
        // Run migrations silently during app startup
        const runner = new ExampleRunner({ handler,
            renderStrategy: new SilentRenderStrategy()
        });

        const result = await runner.migrate();

        if (!result.success) {
            throw new Error('Database migration failed');
        }

        // Continue with application startup
    }
}
```

## Output Examples

All methods produce no output:

```typescript
const strategy = new SilentRenderStrategy();

strategy.renderBanner('0.3.0', 'PostgreSQL');     // No output
strategy.renderMigrated(scripts, handler);         // No output
strategy.renderPending(pendingScripts);            // No output
strategy.renderExecuted(executedScripts);          // No output
strategy.renderIgnored(ignoredScripts);            // No output
```

## Use Cases

### Unit Testing

Keep test output clean and focused:

```typescript
import { MigrationScriptRunner, SilentRenderStrategy, SilentLogger } from '@migration-script-runner/core';
import { IDB } from '@migration-script-runner/core';

class ExampleRunner<DB extends IDB> extends MigrationScriptRunner<DB> {}


describe('MigrationScriptRunner', () => {
    it('should handle empty migration list', async () => {
        const runner = new ExampleRunner({ handler,
            logger: new SilentLogger(),
            renderStrategy: new SilentRenderStrategy()
        });

        const result = await runner.migrate();

        // Clean output, only test results shown
        expect(result.executed).toHaveLength(0);
    });
});
```

**Without SilentRenderStrategy:**
```
  MigrationScriptRunner
  __  __ _                 _   _               ____            _       _
 |  \/  (_) __ _ _ __ __ _| |_(_) ___  _ __   / ___|  ___ _ __(_)_ __ | |_
 ...
+---------------------------------------+
|             Migrated                  |
+---------------------------------------+
...
    ✓ should handle empty migration list
```

**With SilentRenderStrategy:**
```
  MigrationScriptRunner
    ✓ should handle empty migration list
```

### Library Usage

When embedding MSR in a library:

```typescript
import { MigrationScriptRunner, SilentRenderStrategy } from '@migration-script-runner/core';
import { IDB } from '@migration-script-runner/core';

class ExampleRunner<DB extends IDB> extends MigrationScriptRunner<DB> {}


export class DatabaseManager {
    async initialize() {
        const runner = new ExampleRunner({ handler,
            renderStrategy: new SilentRenderStrategy()
        });

        const result = await runner.migrate();

        // Library users don't see migration output
        // Only application logs are shown
        if (result.success) {
            console.log('Database initialized successfully');
        }
    }
}
```

### Background Jobs

For scheduled or background migration tasks:

```typescript
import { MigrationScriptRunner, SilentRenderStrategy } from '@migration-script-runner/core';
import { IDB } from '@migration-script-runner/core';

class ExampleRunner<DB extends IDB> extends MigrationScriptRunner<DB> {}


// Cron job or scheduled task
async function runScheduledMigrations() {
    const runner = new ExampleRunner({ handler,
        renderStrategy: new SilentRenderStrategy()
    });

    const result = await runner.migrate();

    // Only log important events, not migration tables
    if (result.executed.length > 0) {
        logger.info(`Executed ${result.executed.length} migrations`);
    }
}
```

### Automated Systems

For fully automated deployments:

```typescript
import { MigrationScriptRunner, SilentRenderStrategy, FileLogger } from '@migration-script-runner/core';
import { IDB } from '@migration-script-runner/core';

class ExampleRunner<DB extends IDB> extends MigrationScriptRunner<DB> {}


async function deployApplication() {
    // Run migrations silently, log to file
    const runner = new ExampleRunner({ handler,
        logger: new FileLogger({ logPath: './deploy.log' }),
        renderStrategy: new SilentRenderStrategy()
    });

    try {
        const result = await runner.migrate();

        // Only log summary, not tables
        console.log(`Deployment: ${result.executed.length} migrations applied`);

        await startApplication();
    } catch (error) {
        console.error('Deployment failed:', error);
        process.exit(1);
    }
}
```

### Headless Environments

For Docker containers, Lambda functions, etc.:

```typescript
import { MigrationScriptRunner, SilentRenderStrategy } from '@migration-script-runner/core';
import { IDB } from '@migration-script-runner/core';

class ExampleRunner<DB extends IDB> extends MigrationScriptRunner<DB> {}


// Lambda function
export const handler = async (event) => {
    const runner = new ExampleRunner(dbHandler, config, {
        renderStrategy: new SilentRenderStrategy()
    });

    const result = await runner.migrate();

    return {
        statusCode: result.success ? 200 : 500,
        body: JSON.stringify({
            executed: result.executed.length,
            success: result.success
        })
    };
};
```

### Integration Tests

For end-to-end testing:

```typescript
import { MigrationScriptRunner } from '@migration-script-runner/core';
import { IDB } from '@migration-script-runner/core';

class ExampleRunner<DB extends IDB> extends MigrationScriptRunner<DB> {}

describe('E2E Tests', () => {
    beforeAll(async () => {
        // Set up test database silently
        const runner = new ExampleRunner(testHandler, config, {
            renderStrategy: new SilentRenderStrategy()
        });

        await runner.migrate();
    });

    it('should create users', async () => {
        // Test actual functionality, not migration output
        const user = await createUser({ name: 'Test' });
        expect(user).toBeDefined();
    });
});
```

## Best Practices

### 1. Combine with SilentLogger for Complete Silence

```typescript
import { MigrationScriptRunner } from '@migration-script-runner/core';
import { IDB } from '@migration-script-runner/core';

class ExampleRunner<DB extends IDB> extends MigrationScriptRunner<DB> {}

// Good: Complete silence
const runner = new ExampleRunner({ handler,
    logger: new SilentLogger(),
    renderStrategy: new SilentRenderStrategy()
});

// Partial: Logger still produces output
const runner = new ExampleRunner({ handler,
    renderStrategy: new SilentRenderStrategy()
    // Default ConsoleLogger still logs
});
```

### 2. Use in Test Environments Only

```typescript
import { MigrationScriptRunner } from '@migration-script-runner/core';
import { IDB } from '@migration-script-runner/core';

class ExampleRunner<DB extends IDB> extends MigrationScriptRunner<DB> {}

// Good: Environment-specific configuration
const renderStrategy = process.env.NODE_ENV === 'test'
    ? new SilentRenderStrategy()
    : new AsciiTableRenderStrategy();

const runner = new ExampleRunner({ handler,  renderStrategy });

// Avoid: Silent in production (makes debugging hard)
const runner = new ExampleRunner({ handler,
    renderStrategy: new SilentRenderStrategy()  // Hard to debug
});
```

### 3. Still Check Migration Results

```typescript
import { MigrationScriptRunner } from '@migration-script-runner/core';
import { IDB } from '@migration-script-runner/core';

class ExampleRunner<DB extends IDB> extends MigrationScriptRunner<DB> {}

// Good: Silent but validate results
const runner = new ExampleRunner({ handler,
    renderStrategy: new SilentRenderStrategy()
});

const result = await runner.migrate();

if (!result.success) {
    console.error('Migrations failed:', result.errors);
    process.exit(1);
}

// Avoid: Silent and ignoring results
await runner.migrate();  // Errors not handled
```

### 4. Document Why Silence is Needed

```typescript
import { MigrationScriptRunner } from '@migration-script-runner/core';
import { IDB } from '@migration-script-runner/core';

class ExampleRunner<DB extends IDB> extends MigrationScriptRunner<DB> {}

// Good: Clear intent
// Use SilentRenderStrategy to avoid cluttering test output
// Migration status is checked via result.success
const runner = new ExampleRunner({ handler,
    renderStrategy: new SilentRenderStrategy()
});

// Avoid: No explanation
const runner = new ExampleRunner({ handler,
    renderStrategy: new SilentRenderStrategy()  // Why?
});
```

### 5. Provide Alternative Feedback

```typescript
import { MigrationScriptRunner } from '@migration-script-runner/core';
import { IDB } from '@migration-script-runner/core';

class ExampleRunner<DB extends IDB> extends MigrationScriptRunner<DB> {}

// Good: Silent tables, but provide feedback
const runner = new ExampleRunner({ handler,
    renderStrategy: new SilentRenderStrategy()
});

const result = await runner.migrate();

if (result.executed.length > 0) {
    console.log(`✓ Applied ${result.executed.length} migrations`);
}

// Avoid: Complete silence with no feedback
await runner.migrate();  // User has no idea what happened
```

## Performance

SilentRenderStrategy is the fastest rendering strategy because it performs no I/O operations:

| Strategy | Overhead | I/O Operations |
|----------|----------|----------------|
| SilentRenderStrategy | < 0.1ms | 0 |
| AsciiTableRenderStrategy | 5-50ms | Console/file writes |
| JsonRenderStrategy (compact) | 1-10ms | Console/file writes |
| JsonRenderStrategy (pretty) | 2-15ms | Console/file writes |

## Limitations

- **No visual feedback**: Users get no output at all
- **Harder debugging**: Can't see what migrations ran
- **Not suitable for CLI**: Interactive users expect output
- **Not suitable for production monitoring**: No way to track progress

For production deployments, consider [JsonRenderStrategy](json-strategy.md) with structured logging.

## API Reference

### Constructor

```typescript
constructor()
```

Creates a new SilentRenderStrategy instance. No configuration required.

**Example:**
```typescript
const strategy = new SilentRenderStrategy();
```

### Methods

All methods are no-ops (produce no output):

#### `renderMigrated(scripts: IScripts, handler: IDatabaseMigrationHandler, limit?: number): void`

No-op: Produces no output for migrated scripts.

#### `renderPending(scripts: MigrationScript[]): void`

No-op: Produces no output for pending migrations.

#### `renderExecuted(scripts: IMigrationInfo[]): void`

No-op: Produces no output for executed migrations.

#### `renderIgnored(scripts: MigrationScript[]): void`

No-op: Produces no output for ignored migrations.

#### `renderBanner(version: string, handlerName: string): void`

No-op: Produces no banner output.

