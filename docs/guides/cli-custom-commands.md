---
layout: page
title: Custom CLI commands
permalink: /guides/cli-custom-commands/
parent: CLI Adapter Development
grand_parent: Guides
nav_order: 2
---

# Custom CLI commands
{: .no_toc }

Add database-specific commands and safely access adapter functionality from the CLI.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Extending with Custom Commands

Add database-specific commands to your CLI using the `extendCLI` callback for full type safety.

### Preferred Approach: Using `extendCLI` Callback

The `extendCLI` callback provides access to your adapter with full TypeScript type inference, eliminating the need for type casting:

```typescript
import {createCLI} from '@migration-script-runner/core';

// Define adapter with custom methods
class PostgresRunner extends MigrationScriptRunner<IPostgresDB> {
  async vacuum(options: {full?: boolean; analyze?: boolean}): Promise<void> {
    const sql = `VACUUM ${options.full ? 'FULL' : ''} ${options.analyze ? 'ANALYZE' : ''}`;
    await this.handler.db.query(sql);
  }

  async getStats(): Promise<any[]> {
    return await this.handler.db.query('SELECT * FROM pg_stat_database');
  }
}

const program = createCLI({
  name: 'msr-postgres',
  createRunner: (config) => new PostgresRunner({handler, config}),

  // Add custom commands with full type safety
  extendCLI: (program, createRunner) => {
    program
      .command('vacuum')
      .description('Run VACUUM on database')
      .option('--full', 'Run VACUUM FULL')
      .option('--analyze', 'Run VACUUM ANALYZE')
      .action(async (options) => {
        const adapter = await createRunner(); // ✓ Typed as PostgresRunner!
        await adapter.vacuum(options); // ✓ TypeScript knows about vacuum()
        console.log('✓ VACUUM completed');
        process.exit(0);
      });

    program
      .command('stats')
      .description('Show database statistics')
      .action(async () => {
        const adapter = await createRunner(); // Config already merged
        const stats = await adapter.getStats();
        console.table(stats);
        process.exit(0);
      });
  }
});

program.parse(process.argv);
```

**Benefits of `extendCLI`:**
- ✅ **Full type safety** - No type casting needed, TypeScript infers your adapter type
- ✅ **Config merging** - `createRunner()` already has CLI flags merged
- ✅ **Clean API** - All custom commands in one place
- ✅ **Reusability** - `createRunner` function handles all config loading

### Alternative: Manual Command Registration

You can also add commands to the returned program manually, but you'll need to handle config loading yourself:

```typescript
const program = createCLI({
  name: 'msr-postgres',
  createRunner: (config) => new PostgresRunner({handler, config}),
});

// Manually add command after createCLI
program
  .command('vacuum')
  .description('Run VACUUM on database')
  .action(async () => {
    // Need to manually load config and create adapter
    const config = new ConfigLoader<Config>().load();
    const adapter = new PostgresRunner({handler, config}) as PostgresRunner;
    await adapter.vacuum(); // ⚠️ Requires type casting
  });

program.parse(process.argv);
```

{: .note }
> The `extendCLI` approach is recommended because it provides better type safety and automatic config merging.

### Accessing the Handler Directly (v0.8.1+)

{: .new }
> **NEW in v0.8.1:** The `getHandler()` method provides direct access to the database handler for custom CLI commands without needing adapter wrapper methods.

Starting in v0.8.1, you can access the handler directly using the `getHandler()` public method. This is especially useful for database operations that don't need adapter abstraction:

```typescript
import {createCLI, MigrationScriptRunner} from '@migration-script-runner/core';

// Define handler interface with specific properties
interface PostgresHandler extends IDatabaseMigrationHandler<IDB> {
  config: { host: string; port: number; database: string };
}

// Create adapter with THandler generic for type-safe handler access
class PostgresRunner extends MigrationScriptRunner<IPostgresDB, PostgresHandler> {
  // Adapter methods can use this.handler internally...
}

const program = createCLI({
  name: 'msr-postgres',
  createRunner: (config) => new PostgresRunner({handler: postgresHandler, config}),

  extendCLI: (program, createRunner) => {
    program
      .command('vacuum')
      .description('Run VACUUM ANALYZE')
      .action(async () => {
        const adapter = await createRunner();
        const handler = adapter.getHandler(); // ✓ Typed as PostgresHandler!

        // Direct database operation without adapter method
        await handler.db.query('VACUUM ANALYZE');
        console.log('✓ Vacuum completed');
        process.exit(0);
      });

    program
      .command('connection-info')
      .description('Display database connection details')
      .action(async () => {
        const adapter = await createRunner();
        const handler = adapter.getHandler();

        // Access handler properties with full type safety
        console.log(`Database: ${handler.getName()}`);
        console.log(`Version: ${handler.getVersion()}`);
        console.log(`Host: ${handler.config.host}:${handler.config.port}`);
        console.log(`Database: ${handler.config.database}`);
        process.exit(0);
      });

    program
      .command('query <sql>')
      .description('Execute a raw SQL query')
      .action(async (sql: string) => {
        const adapter = await createRunner();
        const handler = adapter.getHandler();

        try {
          // Direct database query
          const result = await handler.db.query(sql);
          console.table(result.rows);
          process.exit(0);
        } catch (error) {
          console.error('Query failed:', error.message);
          process.exit(1);
        }
      });
  }
});

program.parse(process.argv);
```

**When to use `getHandler()` vs adapter methods:**

| Scenario | Recommended Approach | Reason |
|----------|---------------------|---------|
| Simple database operations | `getHandler()` | No need for adapter abstraction |
| Handler metadata access | `getHandler()` | Direct access to getName(), getVersion() |
| One-off CLI commands | `getHandler()` | Less code, more direct |
| Reusable business logic | Adapter method | Better abstraction, testable |
| Complex operations | Adapter method | Encapsulation, separation of concerns |
| Multiple related operations | Adapter method | Group related functionality |

**Example comparing both approaches:**

```typescript
// Approach 1: Using adapter methods (better for reusable logic)
class PostgresRunner extends MigrationScriptRunner<IPostgresDB, PostgresHandler> {
  async vacuum(options: {full?: boolean; analyze?: boolean}): Promise<void> {
    const sql = `VACUUM ${options.full ? 'FULL' : ''} ${options.analyze ? 'ANALYZE' : ''}`.trim();
    await this.handler.db.query(sql);
  }

  async getStats(): Promise<DatabaseStats> {
    const result = await this.handler.db.query('SELECT * FROM pg_stat_database');
    return this.formatStats(result); // Additional processing
  }

  private formatStats(result: any): DatabaseStats {
    // Complex formatting logic...
    return formatted;
  }
}

// Approach 2: Using getHandler() (better for simple CLI operations)
extendCLI: (program, createRunner) => {
  program
    .command('vacuum')
    .action(async () => {
      const adapter = await createRunner();
      const handler = adapter.getHandler();

      // Direct operation - no adapter method needed
      await handler.db.query('VACUUM ANALYZE');
      console.log('✓ Done');
      process.exit(0);
    });
}
```

{: .tip }
> **Best Practice:** Use `getHandler()` for simple CLI commands that don't need business logic. Use adapter methods when operations are reusable, complex, or need testing.

---

**Previous:** [CLI options and built-in commands](cli-options-and-flags) · **Next:** [Async adapter initialization](cli-async-initialization)
