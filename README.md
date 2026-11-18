# Migration Script Runner

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/migration-script-runner/msr-core/tree/master.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/migration-script-runner/msr-core/tree/master)
[![Test](https://github.com/migration-script-runner/msr-core/actions/workflows/test.yml/badge.svg)](https://github.com/migration-script-runner/msr-core/actions/workflows/test.yml)
[![Security audit](https://github.com/migration-script-runner/msr-core/actions/workflows/security.yml/badge.svg)](https://github.com/migration-script-runner/msr-core/actions/workflows/security.yml)
[![Coverage Status](https://coveralls.io/repos/github/migration-script-runner/msr-core/badge.svg?branch=master)](https://coveralls.io/github/migration-script-runner/msr-core?branch=master)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=vlavrynovych_msr&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=vlavrynovych_msr)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=vlavrynovych_msr&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=vlavrynovych_msr)
[![GitHub issues](https://img.shields.io/github/issues/migration-script-runner/msr-core.svg)](https://github.com/migration-script-runner/msr-core/issues)
[![License](https://img.shields.io/badge/license-MIT%20%2B%20CC%20%2B%20Attribution-blue.svg)](https://raw.githubusercontent.com/migration-script-runner/msr-core/master/LICENSE)
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
![Static Badge](https://img.shields.io/badge/in%20Ukraine-dodgerblue?label=Proudly%20made&labelColor=%23FFFF00)

[npm-image]: https://img.shields.io/npm/v/@migration-script-runner/core.svg?style=flat
[npm-url]: https://npmjs.org/package/@migration-script-runner/core
[npm-downloads-image]: https://img.shields.io/npm/dm/@migration-script-runner/core.svg?style=flat

---

[🌐 Official Website](https://migration-script-runner.dev/) · [🔥 MSR Firebase](https://github.com/migration-script-runner/msr-firebase) · [📖 MSR Core Documentation](https://core.migration-script-runner.dev/) · [🤖 AI Agent Integration Guide](https://core.migration-script-runner.dev/guides/ai-agent-integration) · [📦 npm](https://www.npmjs.com/package/@migration-script-runner/core)

**A database-agnostic migration framework for TypeScript and JavaScript projects.**

MSR provides a lightweight, flexible framework for managing database migrations without locking you into a specific ORM or database system. Bring your own database implementation and let MSR handle the migration workflow, versioning, validation, and execution.

## Contents

- [The MSR Ecosystem](#msr-ecosystem)
- [What's New in v1.0.0](#whats-new-v100)
- [Previous Releases](#previous-releases)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Why MSR Exists](#why-msr-exists)
- [Why MSR?](#why-msr)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

<a id="msr-ecosystem"></a>

## The MSR Ecosystem

**One core. Built for different databases.**

MSR Core powers the Migration Script Runner family with versioned migrations, checksum validation, locking for distributed deployments, backup and rollback strategies, and a shared CLI. Each implementation adds the behavior its database needs.

- **[MSR Firebase →](https://github.com/migration-script-runner/msr-firebase)** — Bring the MSR workflow to Firebase Realtime Database, with Firebase-specific backup, restore, and locking.
- **MSR PostgreSQL** — In development. The MSR foundation, adapted for PostgreSQL.

Find shared pages, public documentation, and resources for MSR projects on the **[official website →](https://migration-script-runner.dev/)**.

---

<a id="whats-new-v100"></a>

## 🎉 What's New in v1.0.0

**A new foundation for database adapters, with a consistent runner API and a more capable CLI:**

- **🏗️ Runner API (breaking)** - `MigrationScriptExecutor` is replaced by the abstract `MigrationScriptRunner`. Adapters provide concrete runners, named `<Database>Runner`, and update their options and dependency types to `IRunnerOptions` and `IRunnerDependencies`.
- **🧭 Consistent adapter architecture (breaking)** - Provider and orchestrator APIs now have explicit names, including `ILockingProvider`, `ITransactionProvider`, `BackupOrchestrator`, and `SchemaVersionOrchestrator`. The CLI factory is now `createRunner`, and lock ownership uses `runnerId` / `runner_id`.
- **🖥️ More expressive CLI** - The built-in `--backup-mode` flag supports `full`, `create_only`, `restore_only`, and `manual`. Adapter flags can use dot notation, such as `--mongo.uri`, to populate nested configuration.
- **✅ Reliable CLI choices** - Unsupported values for `--backup-mode`, `--logger`, `--log-level`, and `--format` are rejected. The selected logger, log level, and JSON output format are applied to the runner.
- **🔐 Security and maintenance** - Updated `auto-envparse` to v3 and refreshed `figlet`, `lodash`, and `moment`; added vulnerability reporting and CI auditing; and resolved the release SonarCloud findings.
- **📚 Adapter and contributor guidance** - Expanded adapter/API documentation, migration examples, and repository contribution and workflow guidance.

This release includes breaking API changes. Follow the [v0.8.x → v1.0.0 Migration Guide](https://core.migration-script-runner.dev/version-migration/v0.8-to-v1.0) before upgrading. See [GitHub Releases](https://github.com/migration-script-runner/msr-core/releases) for release history.

---

<a id="previous-releases"></a>

## 📜 Previous Releases

For information about previous releases, see the [Version Migration Guide](https://core.migration-script-runner.dev/version-migration/).

---

<a id="features"></a>

## ✨ Features

- **🔒 Migration Locking** - Database-level locking prevents concurrent migrations in multi-instance deployments (v0.8.0)
- **🖥️ CLI Factory** - Built-in command-line interface with migrate, list, down, validate, backup, and lock commands (v0.7.0+)
- **🔌 Database Agnostic** - Works with any database (SQL, NoSQL, NewSQL) by implementing a simple interface
- **🛡️ Type Safe** - Full TypeScript support with complete type definitions and handler generics (v0.8.0)
- **💾 Smart Rollback** - Multiple strategies: backup/restore, down() methods, both, or none
- **🔒 Transaction Control** - Configurable transaction modes with automatic retry and isolation levels (v0.5.0)
- **⚙️ Environment Variables** - Full 12-factor app configuration support with MSR_* variables (v0.5.0)
- **🗂️ .env File Support** - Load configuration from .env, .env.production, .env.local, etc. with priority control (v0.7.0)
- **📄 Multi-Format Config** - Support for JS, JSON, YAML, TOML, and XML configuration files (v0.6.0)
- **🎚️ Log Level Control** - Configurable verbosity (error, warn, info, debug) for different environments (v0.6.0)
- **📊 Migration Tracking** - Maintains execution history in your database with checksums
- **✅ Built-in Validation** - Detects conflicts, missing files, and integrity issues
- **🎨 Multiple Output Formats** - ASCII tables, JSON, or silent output
- **📝 Flexible Logging** - Console, file, or custom loggers with level-aware filtering (v0.6.0)
- **📈 Metrics Collection** - Built-in collectors for monitoring performance and tracking execution (v0.6.0)
- **🪝 Lifecycle Hooks** - Process, script, backup, and transaction lifecycle hooks (v0.5.0)
- **📦 Library-First Design** - Returns structured results, safe for web servers and long-running apps

---

<a id="installation"></a>

## 📦 Installation

```bash
npm install @migration-script-runner/core
```

Or with yarn:

```bash
yarn add @migration-script-runner/core
```

---

<a id="quick-start"></a>

## 🚀 Quick Start

### 1. Implement Database Handler

```typescript
import { IDatabaseMigrationHandler, IDB, ISqlDB } from '@migration-script-runner/core';

// For SQL databases, implement ISqlDB
interface IMyDatabase extends ISqlDB {
  query(sql: string): Promise<unknown>;
}

export class MyDatabaseHandler implements IDatabaseMigrationHandler<IMyDatabase> {
  db: IMyDatabase;
  schemaVersion: ISchemaVersion<IMyDatabase>;
  backup?: IBackup<IMyDatabase>;

  async checkConnection(): Promise<void> {
    await this.db.query('SELECT 1');
  }

  getName(): string {
    return 'My Database Handler';
  }
}
```

### 2. Create Migration Script

**TypeScript Migration:**
```typescript
// migrations/V202501280100_create_users.ts
import { IRunnableScript, IMigrationInfo, IDB } from '@migration-script-runner/core';

export default class CreateUsers implements IRunnableScript<IDB> {
  async up(db: IDB, info: IMigrationInfo): Promise<string> {
    await db.query(`
      CREATE TABLE users (
        id INT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE
      )
    `);
    return 'Users table created';
  }

  async down(db: IDB): Promise<string> {
    await db.query('DROP TABLE users');
    return 'Users table dropped';
  }
}
```

**SQL Migration:**
```sql
-- migrations/V202501280100_create_users.up.sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE
);
```

### 3. Run Migrations

```typescript
import { MigrationScriptRunner, Config } from '@migration-script-runner/core';
import { MyDatabaseHandler } from './database-handler';
import { IDB } from '@migration-script-runner/core';

class ExampleRunner<DB extends IDB> extends MigrationScriptRunner<DB> {}


const config = new Config();
config.folder = './migrations';
config.logLevel = 'info';  // v0.6.0: 'error' | 'warn' | 'info' | 'debug'

const handler = new MyDatabaseHandler();
const runner = new ExampleRunner<IMyDatabase>({ handler, config });

// Library usage - returns structured result
const result = await runner.up();

if (result.success) {
  console.log(`✅ Executed ${result.executed.length} migrations`);
} else {
  console.error('❌ Migration failed:', result.errors);
  process.exit(1);
}
```

**Quick Config Examples:**

```bash
# Environment variable configuration (v0.5.0+)
MSR_FOLDER=./migrations
MSR_LOG_LEVEL=debug  # v0.6.0: Control output verbosity

# Or use config file (v0.6.0+)
# msr.config.yaml
folder: ./migrations
logLevel: debug  # error | warn | info | debug
```

### CLI Usage (v0.7.0)

**Create a CLI for your database adapter:**

```typescript
// cli.ts
import { createCLI, MigrationScriptRunner } from '@migration-script-runner/core';
import { MyDatabaseHandler } from './database-handler';
import { IDB } from '@migration-script-runner/core';

class ExampleRunner<DB extends IDB> extends MigrationScriptRunner<DB> {}


const program = createCLI({
  name: 'my-db-migrate',
  version: '1.0.0',
  description: 'Database migration CLI',
  createRunner: (config) => {
    const handler = new MyDatabaseHandler();
    return new ExampleRunner({ handler, config });
  }
});

program.parse(process.argv);
```

**Run migrations from command line:**

```bash
# Run all pending migrations
npx my-db-migrate migrate

# List all migrations with status
npx my-db-migrate list

# Rollback last migration
npx my-db-migrate down

# Validate migrations without running
npx my-db-migrate validate

# Create database backup
npx my-db-migrate backup

# Check lock status (v0.8.0)
npx my-db-migrate lock:status

# Force-release stuck lock (v0.8.0)
npx my-db-migrate lock:release --force

# Run migration without locking (v0.8.0)
npx my-db-migrate migrate --no-lock

# Use environment-specific config
npx my-db-migrate migrate --config-file .env.production
```

**Nested adapter options:** An adapter registers dot-notation options with `addCustomOptions`:

```typescript
addCustomOptions: (program) => {
  program
    .option('--db.url <url>', 'Database URL')
    .option('--db.timeout <ms>', 'Connection timeout');
}
```

Once registered, use them with the adapter's CLI:

```bash
npx my-db-migrate migrate \
  --db.url https://localhost:5432 \
  --db.timeout 5000
```

The adapter receives these values as `config.db.url` and `config.db.timeout` (`5000` is converted to a number).
See the [adapter development guide](https://core.migration-script-runner.dev/guides/cli-options-and-flags#nested-configuration-flags) for details.

**[→ Full CLI Documentation](https://core.migration-script-runner.dev/guides/cli-adapter-development)**

---

<a id="documentation"></a>

## 📚 Documentation

**[📖 Full Documentation](https://core.migration-script-runner.dev/)** - Complete guides, API reference, and examples

### Getting Started
- **[Getting Started Guide](https://core.migration-script-runner.dev/getting-started)** - Complete setup walkthrough
- **[Writing Migrations](https://core.migration-script-runner.dev/guides/writing-migrations)** - Best practices and patterns
- **[SQL Migrations](https://core.migration-script-runner.dev/guides/sql-migrations)** - Using .sql migration files
- **[Version Control](https://core.migration-script-runner.dev/guides/version-control)** - Target specific versions

### Configuration & Customization
- **[Configuration](https://core.migration-script-runner.dev/configuration/)** - Migration settings, validation, rollback strategies
- **[Custom Loggers](https://core.migration-script-runner.dev/customization/loggers/)** - Console, file, or cloud logging
- **[Metrics Collection](https://core.migration-script-runner.dev/customization/metrics/)** - Built-in collectors for observability and performance monitoring
- **[Render Strategies](https://core.migration-script-runner.dev/customization/render-strategies/)** - ASCII tables, JSON, or custom formats
- **[Validation](https://core.migration-script-runner.dev/customization/validation/)** - Custom validation rules

### Reference
- **[API Reference](https://core.migration-script-runner.dev/api/)** - Complete API documentation
- **[Recipes](https://core.migration-script-runner.dev/guides/recipes/)** - Common patterns (PostgreSQL, MongoDB, testing)
- **[Comparison](https://core.migration-script-runner.dev/comparison)** - Compare with other migration tools

### Upgrading
- **[Version Migration](https://core.migration-script-runner.dev/version-migration/)** - Upgrade guides between versions

---

<a id="why-msr-exists"></a>

## 🌱 Why MSR Exists

MSR grew from a practical need to make database migrations safer and more flexible. The official website shares the story behind the project and the principles that guide its design.

- **[Read the MSR origin story →](https://migration-script-runner.dev/origin-story)**
- **[Explore the design philosophy →](https://migration-script-runner.dev/design-philosophy)**

---

<a id="why-msr"></a>

## 🎯 Why MSR?

**Bring your own database.** MSR doesn't lock you into a specific ORM or database system. Whether you're using PostgreSQL, MongoDB, DynamoDB, or a custom database, MSR handles the migration workflow while you maintain full control.

**Perfect for:**
- 🔌 Any database system (SQL, NoSQL, NewSQL, or custom)
- 🎯 Production applications (returns structured results instead of calling `process.exit()`)
- 🛡️ Type-safe migrations with full TypeScript support
- 📦 Library or CLI usage in web servers, workers, or serverless functions
- ⚡ Flexible workflows with multiple rollback strategies and lifecycle hooks
- 🐳 Container deployments with environment variable configuration (v0.5.0)

**What makes MSR different:**
- **Library-first design** - Safe for web servers and long-running applications
- **True database agnosticism** - No SQL assumptions, works with any database
- **Production-grade transactions** - Configurable modes with automatic retry and isolation control (v0.5.0)
- **Cloud-native configuration** - Complete environment variable support for Docker/Kubernetes (v0.5.0)
- **Multiple rollback strategies** - Choose backup, down() methods, both, or none
- **SQL file support** - Use `.up.sql` and `.down.sql` files alongside TypeScript migrations
- **Well tested** - 100% code coverage with mutation testing

---

<a id="contributing"></a>

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](https://core.migration-script-runner.dev/development/contributing) for guidelines on code style, testing requirements, and pull request process.

See our [GitHub Issues](https://github.com/migration-script-runner/msr-core/issues) for tasks that need help. Read the [Code of Conduct](CODE_OF_CONDUCT.md) and [Security Policy](SECURITY.md) before reporting community or security concerns.

See the [Changelog](CHANGELOG.md) for release history and the [Compatibility Guide](https://core.migration-script-runner.dev/compatibility) for supported environments.

---

<a id="license"></a>

## 📄 License

This project is licensed under the **MIT License with Commons Clause and Attribution Requirements**.

**Quick Summary:**
- ✅ Free to use in your applications (including commercial)
- ✅ Free to modify and contribute
- ❌ Cannot sell MSR or database adapters as standalone products
- 🔒 Database adapters require attribution

See the [LICENSE](LICENSE) file or read the [License Documentation](https://core.migration-script-runner.dev/license) for detailed examples and FAQ.

---

<a id="support"></a>

## 📞 Support

- **📚 Documentation:** https://migration-script-runner.dev/
- **🐛 Issues:** https://github.com/migration-script-runner/msr-core/issues
- **💬 Discussions:** https://github.com/migration-script-runner/msr-core/discussions
- **📦 npm:** https://www.npmjs.com/package/@migration-script-runner/core

---

**By [Volodymyr Lavrynovych](https://github.com/vlavrynovych)** • Created in Ukraine 🇺🇦
