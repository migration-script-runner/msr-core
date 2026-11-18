---
layout: page
title: Complete adapter example
permalink: /guides/cli-complete-example/
parent: CLI Adapter Development
grand_parent: Guides
nav_order: 4
---

# Complete adapter example
{: .no_toc }

Follow a complete example of a MongoDB adapter and its CLI.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Complete Example

Here's a complete example of a MongoDB adapter CLI:

### Project Structure

```
msr-mongodb/
├── src/
│   ├── MongoHandler.ts       # Database handler
│   ├── MongoRunner.ts        # Adapter extending MigrationScriptRunner
│   └── cli.ts                 # CLI entry point
├── package.json
└── tsconfig.json
```

### `src/MongoHandler.ts`

```typescript
import {MongoClient, Db} from 'mongodb';
import {IDatabaseMigrationHandler, IDB} from '@migration-script-runner/core';

export interface MongoDBInterface extends IDB {
  db: Db;
  client: MongoClient;
}

export class MongoHandler implements IDatabaseMigrationHandler<MongoDBInterface> {
  private client!: MongoClient;
  private db!: Db;

  constructor(private uri: string) {}

  async connect(): Promise<MongoDBInterface> {
    this.client = await MongoClient.connect(this.uri);
    this.db = this.client.db();
    return {db: this.db, client: this.client};
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  // Implement other required methods...
}
```

### `src/MongoRunner.ts`

```typescript
import {
  MigrationScriptRunner,
  IRunnerDependencies,
  IRunnerOptions
} from '@migration-script-runner/core';
import {MongoHandler, MongoDBInterface} from './MongoHandler';

export class MongoRunner extends MigrationScriptRunner<MongoDBInterface, MongoHandler> {
  constructor(deps: IRunnerDependencies<MongoDBInterface, MongoHandler>) {
    super(deps);
  }

  // Async factory method using createInstance helper
  static async getInstance(options: IRunnerOptions<MongoDBInterface>): Promise<MongoRunner> {
    return MigrationScriptRunner.createInstance(
      MongoRunner,
      options,
      async (config) => {
        const handler = new MongoHandler(config.mongoUri || 'mongodb://localhost');
        await handler.connect();  // Async initialization
        return handler;
      }
    );
  }

  // Custom MongoDB-specific methods
  async getIndexes(): Promise<any[]> {
    const db = this.handler.db.db;
    const collections = await db.listCollections().toArray();
    const indexes = [];

    for (const coll of collections) {
      const collIndexes = await db.collection(coll.name).indexes();
      indexes.push({collection: coll.name, indexes: collIndexes});
    }

    return indexes;
  }

  async getCollections(): Promise<any[]> {
    const db = this.handler.db.db;
    const collections = await db.listCollections().toArray();
    return collections.map(c => ({name: c.name, type: c.type}));
  }
}
```

### `src/cli.ts`

```typescript
import {createCLI} from '@migration-script-runner/core';
import {MongoRunner} from './MongoRunner';
import {MongoDBInterface} from './MongoHandler';

// Create CLI with custom MongoDB commands using extendCLI
const program = createCLI<MongoDBInterface, MongoRunner>({
  name: 'msr-mongodb',
  description: 'MongoDB Migration Runner',
  version: '1.0.0',

  // Default config merged before CLI flags
  config: {
    folder: './migrations',
    tableName: '_schema_versions',
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/mydb'
  },

  // Async factory using getInstance (v0.8.2+)
  createRunner: async (config) => {
    return MongoRunner.getInstance({config});
  },

  // Add MongoDB-specific commands with full type safety
  extendCLI: (program, createRunner) => {
    program
      .command('mongo:indexes')
      .description('Show all indexes in database')
      .action(async () => {
        try {
          const adapter = await createRunner(); // ✓ Typed as MongoRunner!
          const indexes = await adapter.getIndexes(); // ✓ TypeScript knows this method!

          for (const {collection, indexes: collIndexes} of indexes) {
            console.log(`\n${collection}:`);
            console.table(collIndexes);
          }

          process.exit(0);
        } catch (error) {
          console.error('Error:', error);
          process.exit(1);
        }
      });

    program
      .command('mongo:collections')
      .description('List all collections')
      .action(async () => {
        try {
          const adapter = await createRunner(); // ✓ Async runner support!
          const collections = await adapter.getCollections();
          console.table(collections);
          process.exit(0);
        } catch (error) {
          console.error('Error:', error);
          process.exit(1);
        }
      });
  }
});

// Parse arguments
program.parse(process.argv);
```

### `package.json`

```json
{
  "name": "msr-mongodb",
  "version": "1.0.0",
  "main": "dist/index.js",
  "bin": {
    "msr-mongodb": "./dist/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "@migration-script-runner/core": "^0.6.0",
    "commander": "^12.0.0",
    "mongodb": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## Error Handling

The CLI automatically handles errors and exits with appropriate exit codes:

| Exit Code | Description |
|-----------|-------------|
| 0 | Success |
| 1 | General error |
| 2 | Validation error |
| 3 | Migration failed |
| 4 | Rollback failed |
| 5 | Backup failed |
| 6 | Restore failed |
| 7 | Database connection error |

### Custom Error Handling

```typescript
const program = createCLI({
  createRunner: (config) => new MyRunner({config}),
});

// Add custom error handling
program.exitOverride((err) => {
  console.error('Custom error handler:', err.message);
  process.exit(err.exitCode);
});

program.parse(process.argv);
```

---

**Previous:** [Async adapter initialization](cli-async-initialization) · **Next:** [Testing and troubleshooting](cli-testing-troubleshooting)
