---
layout: default
title: Features
nav_order: 3
---

# Features
{: .no_toc }

Migration Script Runner is a production-ready migration framework packed with powerful features for safe, reliable database migrations.
{: .fs-6 .fw-300 }

## Table of Contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Complete Features List

### Migration Execution
- **[Multi-Format Migrations](guides/writing-migrations)** - TypeScript, JavaScript, and SQL migrations in the same project
- **[Up/Down Methods](guides/writing-migrations#updown-methods)** - Reversible migrations with flexible down() policies
- **[Batch Execution](guides/basic-usage#running-migrations)** - Execute multiple migrations with progress tracking
- **[Target Version Migration](guides/basic-usage#target-version)** - Migrate up to specific version or down to a version
- **[Selective Execution](configuration/migration-settings#file-patterns)** - Control which migrations run with file patterns

### Safety & Rollback
- **[Dry Run Mode](guides/dry-run)** - Test migrations in transactions without committing
- **[Automatic Backups](guides/backup-restore)** - Create database backups before migration execution
- **[Multiple Rollback Strategies](guides/rollback-strategies)** - BACKUP, DOWN, BOTH, or NONE strategies
- **[Checksum Validation](guides/checksum-validation)** - Detect unauthorized changes to executed migrations
- **[Pre-Migration Validation](guides/validation)** - Catch issues before execution starts

### Transaction Management
- **[Configurable Transaction Modes](guides/transaction-management)** - PER_MIGRATION, PER_BATCH, or NONE
- **[SQL Isolation Levels](guides/transaction-management#isolation-levels)** - Full control over transaction isolation
- **[Automatic Retry Logic](guides/transaction-management#retry-configuration)** - Built-in retry with exponential backoff
- **[Transient Error Detection](guides/transaction-management#error-detection)** - Smart detection of retriable errors (deadlocks, serialization failures)
- **[NoSQL Transaction Support](guides/transaction-management#nosql-databases)** - Callback-based transactions for DynamoDB, Firestore, MongoDB

### Validation & Quality
- **[Built-in Validators](customization/validation/built-in-validation)** - Structure, syntax, and convention validation
- **[Custom Validators](customization/validation/custom-validators)** - Extend with your own validation rules
- **[Strict Mode](customization/validation/built-in-validation#strict-mode)** - Treat warnings as errors in CI/CD
- **[Duplicate Detection](customization/validation/built-in-validation#duplicate-timestamp-detection)** - Prevent timestamp collisions
- **[Down Method Policies](customization/validation/built-in-validation#down-method-policy)** - Enforce reversible migrations

### Monitoring & Logging
- **[Metrics Collection](customization/metrics/)** - Built-in collectors for console, JSON, CSV, and logger-based output
- **[Execution Summary](guides/execution-summary)** - Detailed JSON/text summaries with metrics
- **[Multiple Loggers](customization/loggers/)** - Console, File, Silent, or custom loggers
- **[Log Level Control](api/environment-variables/core-variables#msr_log_level)** - Configure output verbosity (error, warn, info, debug)
- **[Lifecycle Hooks](customization/hooks)** - Monitor and extend migration lifecycle
- **[Rich Metrics](guides/execution-summary#metrics)** - Track timing, retries, and performance
- **[Custom Output Formats](customization/renderers)** - ASCII tables, JSON, or custom rendering

### Configuration
- **[Environment Variables](guides/environment-variables)** - 12-factor app configuration with MSR_* variables
- **[.env File Support](guides/environment-variables#env-file-support-v070)** (v0.7.0+) - Load configuration from .env, .env.production, .env.local files with priority control
- **[Config Files](configuration/)** - Support for JS, JSON, YAML, TOML, and XML formats
- **[Programmatic API](api/)** - Full TypeScript API for application integration
- **[Migration Settings](configuration/migration-settings)** - File patterns, display limits, folder configuration
- **[Validation Settings](configuration/validation-settings)** - Control validation behavior and strictness
- **[Rollback Settings](configuration/rollback-settings)** - Configure backup and rollback behavior
- **[Transaction Settings](configuration/transaction-settings)** - Transaction modes, isolation, and retry settings

### Extensibility
- **[Custom Database Handlers](customization/database-handlers)** - Implement handlers for any database
- **[CLI Factory](guides/cli-adapter-development)** (v0.7.0+) - Create command-line interfaces for database adapters with built-in commands
- **[Custom Loaders](customization/loaders)** - Add support for new file formats
- **[Custom Validators](customization/validation/custom-validators)** - Extend validation with custom rules
- **[Custom Loggers](customization/loggers/)** - Integrate with existing logging infrastructure
- **[Custom Renderers](customization/renderers)** - Control migration output format
- **[Custom Hooks](customization/hooks)** - Extend lifecycle for monitoring, metrics, or custom logic

### Developer Experience
- **[TypeScript First](getting-started)** - Written in TypeScript with full type definitions
- **[100% Test Coverage](development/testing)** - Fully tested with mutation testing
- **[Comprehensive Documentation](.)** - Complete guides, examples, and API reference
- **[Zero Config Defaults](getting-started#quick-start)** - Works out of the box with sensible defaults
- **Library-First Design** - Returns structured results instead of calling process.exit()

---

## Features by Category

### Core Migration Features

| Feature | Description |
|---------|-------------|
| **🎯 Multi-File Format Support** | Run migrations written in TypeScript, JavaScript, or SQL - all in the same project |
| **📁 Flexible File Discovery** | Automatic discovery with customizable patterns, recursive scanning, and version-based ordering |
| **📊 Migration Tracking** | Built-in schema versioning with execution history, timestamps, and checksum validation |
| **⏱️ Execution Timing** | Track migration performance with millisecond-precision timing for each operation |
| **🔄 Up & Down Migrations** | Support for both forward (up) and reverse (down) migrations with flexible policies |
| **📦 Batch Operations** | Execute multiple migrations in a single batch with progress tracking |

## Safety & Rollback

| Feature | Description |
|---------|-------------|
| **💾 Automatic Backups** | Create database backups before migrations with customizable naming and retention |
| **🔙 Multiple Rollback Strategies** | Choose from backup restore, down() methods, both, or none based on your needs |
| **🛡️ Integrity Validation** | Checksum-based detection of modified migrations with configurable enforcement |
| **🧪 Dry Run Mode** | Test migrations in transactions without committing changes to verify safety |
| **🔐 Pre-Migration Validation** | Validate all migrations before execution to catch issues early |

## Transaction Management

| Feature | Description |
|---------|-------------|
| **🔒 Flexible Transaction Modes** | Run migrations per-migration, per-batch, or without transactions |
| **🎚️ Isolation Level Control** | Configure SQL transaction isolation from read uncommitted to serializable |
| **🔁 Automatic Retry Logic** | Built-in retry with exponential backoff for deadlocks and transient failures |
| **⏲️ Transaction Timeouts** | Configurable timeouts to prevent long-running transactions |
| **📈 Transaction Metrics** | Track retries, duration, and failures for monitoring and alerting |

## Validation & Quality

| Feature | Description |
|---------|-------------|
| **✅ Built-in Validators** | Validate structure, syntax, and conventions automatically |
| **🔍 Custom Validators** | Extend with your own validation rules for naming, documentation, or SQL safety |
| **⚠️ Strict Mode** | Treat warnings as errors in CI/CD for maximum quality enforcement |
| **📝 Down Method Policies** | Enforce, recommend, or make optional down() methods based on strategy |
| **🔎 Checksum Verification** | Detect unauthorized changes to executed migrations |

## Configuration & Flexibility

| Feature | Description |
|---------|-------------|
| **🌍 Environment Variables** | Configure via MSR_* environment variables following 12-factor app principles |
| **🗂️ .env File Support** | Load configuration from .env, .env.production, .env.local files with configurable priority (v0.7.0) |
| **📄 Config Files** | Support for JS, JSON, YAML, TOML, and XML config formats with automatic discovery and optional dependencies |
| **⚙️ Programmatic API** | Full TypeScript API for integration into your applications |
| **🔌 Extensible Loaders** | Add custom loaders for new file formats beyond TypeScript, JavaScript, SQL |
| **🎨 Custom Handlers** | Implement your own database handlers for any database system |

## Logging & Monitoring

| Feature | Description |
|---------|-------------|
| **📊 Execution Summaries** | Detailed JSON and text summaries of migration runs with all metrics |
| **🎭 Multiple Logger Support** | Console, file, silent, or custom loggers - use multiple simultaneously |
| **🎚️ Log Level Control** | Configure output verbosity with error, warn, info, or debug levels |
| **🪝 Lifecycle Hooks** | Hook into migration lifecycle for monitoring, alerting, or custom logic |
| **📈 Rich Metrics** | Track execution time, transaction metrics, retry attempts, and more |
| **🎨 Customizable Output** | ASCII tables, JSON, or silent rendering - choose your display format |

## Developer Experience

| Feature | Description |
|---------|-------------|
| **📘 TypeScript First** | Written in TypeScript with full type safety and IntelliSense support |
| **🎯 Zero Dependencies** | Minimal footprint - only database driver and your dependencies needed |
| **📚 Comprehensive Docs** | Detailed documentation with examples, guides, and API reference |
| **🧩 Modular Architecture** | Clean separation of concerns with dependency injection throughout |
| **🧪 100% Test Coverage** | Fully tested with unit, integration, and mutation testing |
| **🚀 Production Ready** | Battle-tested features for reliability, performance, and safety |

## Database Support

| Feature | Description |
|---------|-------------|
| **🗄️ SQL Databases** | PostgreSQL, MySQL, SQLite, SQL Server, and any SQL database |
| **📊 NoSQL Databases** | MongoDB, Cassandra, and other NoSQL systems via custom handlers |
| **🔄 Transaction Support** | Automatic detection and use of database transaction capabilities |
| **💾 Backup Support** | Flexible backup interface for any database backup strategy |

## Advanced Features

| Feature | Description |
|---------|-------------|
| **🔀 Migration Dependencies** | beforeMigrate hook for setup tasks that run once before migrations |
| **🎯 Selective Execution** | Target specific migrations, run up to a version, or skip certain files |
| **📊 Status Reporting** | View current schema version, pending migrations, and execution history |
| **🔍 Migration Discovery** | Smart detection of duplicate timestamps, naming conflicts, and missing files |
| **🎨 Custom Rendering** | Create custom renderers for integration with external systems |
| **🪝 Custom Hooks** | Implement custom lifecycle hooks for logging, metrics, or business logic |

## Security & Compliance

| Feature | Description |
|---------|-------------|
| **🔐 Checksum Validation** | Detect unauthorized modifications to executed migrations |
| **📜 Audit Trail** | Complete history of migrations with timestamps, checksums, and user tracking |
| **🔒 Strict Validation** | Enforce quality and security standards before execution |
| **🛡️ Safe Rollback** | Multiple safety mechanisms including backups and reversible migrations |

## Platform Support

| Feature | Description |
|---------|-------------|
| **🖥️ Cross-Platform** | Works on Linux, macOS, and Windows |
| **🐳 Docker Ready** | Environment variable configuration perfect for containers |
| **☸️ Kubernetes Compatible** | ConfigMaps and Secrets integration via environment variables |
| **📦 npm Package** | Easy installation from npm registry |
| **🔧 CLI & Programmatic** | Use as CLI tool or integrate into your Node.js application |

---

## Quick Feature Comparison

Compare MSR features across different use cases:

| Use Case | Key Features |
|----------|--------------|
| **Development** | Fast iteration, down() methods, flexible validation, dry run testing, debug logging, .env file loading |
| **CI/CD** | Strict validation, checksum verification, automated testing, environment variables |
| **Production** | Automatic backups, transaction management, retry logic, execution summaries, log level control, .env.production files |
| **Enterprise** | Audit trails, custom validators, hooks for monitoring, comprehensive logging |
| **Multi-Database** | Custom handlers, flexible loaders, both SQL and NoSQL support |

---

## Getting Started

Ready to use these features? Start here:

- **[Getting Started Guide](./getting-started.md)** - Quick start in 5 minutes
- **[Configuration](./configuration/)** - Configure MSR for your needs
- **[Guides](./guides/)** - In-depth guides and practical examples
- **[API Reference](./api/)** - Complete API documentation

---

## Feature Highlights by Version

### v0.7.0 (Current)
- 🖥️ **CLI Factory** - Create command-line interfaces with built-in commands (migrate, list, down, validate, backup) using Commander.js
- 🗂️ **.env File Support** - Load configuration from .env, .env.production, .env.local files with priority control
- 🎨 **Facade Pattern** - Services grouped into logical facades for better organization
- 🏭 **Factory Pattern** - Dedicated service factory reduces constructor complexity by 83%
- 🔧 **Protected Facades** - Adapters can extend runner and access internal services
- ✨ **Extensible Configuration** - IConfigLoader interface for custom environment variable handling
- 🔨 **Simplified Constructor** - Single parameter with config moved to dependencies (**BREAKING**)

### v0.6.0
- 🛡️ **Generic Type Parameters** - Database-specific type safety with `<DB extends IDB>` throughout API (**BREAKING**)
- 📊 **Metrics Collection** - Built-in collectors for observability (Console, Logger, JSON, CSV)
- 📄 **Multi-Format Config** - YAML, TOML, and XML configuration file support
- 🔌 **Plugin Architecture** - Extensible loader system with optional peer dependencies
- 🎚️ **Log Level Control** - Configure output verbosity (error, warn, info, debug) via MSR_LOG_LEVEL
- 🔨 **Constructor DI Pattern** - Dependency injection pattern for better extensibility (**BREAKING**)

### v0.5.0
- ✨ **Transaction Management** - Full transaction control with retry logic
- ✨ **Environment Variables** - 12-factor app configuration support
- ✨ **Execution Summaries** - Detailed JSON/text summaries with metrics
- ✨ **Lifecycle Hooks** - Monitor and customize migration lifecycle

### v0.4.0
- ✨ **SQL Migrations** - Native .sql file support
- ✨ **Custom Validators** - Extensible validation framework
- ✨ **Checksum Validation** - Detect unauthorized changes

### v0.3.0
- ✨ **Backup & Restore** - Automatic database backups
- ✨ **Rollback Strategies** - Multiple rollback approaches
- ✨ **Custom Logging** - Flexible logger system

### v0.2.0
- ✨ **Migration Validation** - Pre-execution validation
- ✨ **Down Methods** - Reversible migrations
- ✨ **Schema Tracking** - Migration history management

### v0.1.0
- ✨ **Core Engine** - Basic migration execution
- ✨ **TypeScript Support** - Type-safe migrations
- ✨ **Version Control** - Timestamp-based versioning
