---
layout: default
title: Getting Started
nav_order: 2
---

# Getting Started
{: .no_toc }

Install MSR Core, connect a database adapter, and run your first migration.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Before you begin

- Node.js 22 or later.
- npm.
- A database and an MSR adapter for it. MSR Core does not include a database driver.

TypeScript is optional. MSR supports TypeScript, JavaScript, and SQL migration files.

---

## Install MSR Core

```bash
npm install @migration-script-runner/core
```

Choose an existing database adapter or build one using the [database handler contract](api/interfaces/database-handler) and [MigrationScriptRunner API](api/migration-script-runner). For example, [MSR Firebase](https://github.com/migration-script-runner/msr-firebase) provides an adapter for Firebase Realtime Database.

---

## Create migration scripts

Place migration files in the configured folder and name them `V{timestamp}_{description}`. For example:

```text
migrations/V202601150900_create_users.ts
```

See [Writing Migration Scripts](guides/writing-migrations) for TypeScript and JavaScript examples, reversible migrations, naming rules, and the `beforeMigrate` setup script. For SQL files, see [SQL Migrations](guides/sql-migrations).

---

## Implement a database handler

Implement the handler contract for your database and provide its typed database connection and schema-version store. In this example, assume `MyDatabase` extends `IDB` and the interface types are imported from MSR Core:

```typescript
class MyHandler implements IDatabaseMigrationHandler<MyDatabase> {
  constructor(readonly db: MyDatabase, readonly schemaVersion: ISchemaVersion<MyDatabase>) {}
  getName(): string { return 'My database'; }
  getVersion(): string { return '1.0.0'; }
}
```

The example is five lines. See the [Database Handler API](api/interfaces/database-handler) for the complete contract and the [IDB interface](api/interfaces/db) for the database type.

---

## Run migrations

Create a concrete runner in your adapter, then configure the migration folder and apply pending migrations:

```typescript
import { Config } from '@migration-script-runner/core';
const config = new Config();
config.folder = './migrations';
const runner = new MyDatabaseRunner({ handler, config });
const result = await runner.up();
```

`handler` and `MyDatabaseRunner` are supplied by your adapter. See the [MigrationScriptRunner API](api/migration-script-runner) and [CLI Adapter Development](guides/cli-adapter-development) for adapter patterns.

---

## Use an adapter CLI

If your adapter provides a CLI, use it to run and inspect migrations:

```bash
my-migration-cli migrate
my-migration-cli list --format json
```

The command name and adapter-specific flags depend on the adapter. See the [CLI Reference](api/cli-reference) for built-in commands and options, and [CLI Adapter Development](guides/cli-adapter-development) to build an adapter CLI.

---

## Next steps

- [Writing Migration Scripts](guides/writing-migrations) — create and organize migration files.
- [Configuration Reference](configuration/config-reference) — review configuration defaults and options.
- [Backup and Rollback](guides/backup-restore-workflows) — choose a recovery strategy.
- [Transaction Management](guides/transaction-management) — configure transaction behavior.
- [Validation](customization/validation/) — validate migration files and checksums.
- [Production Deployment](guides/production-deployment) — plan permissions and deployment workflows.
- [Version Migration Guides](version-migration/) — upgrade between MSR versions.
