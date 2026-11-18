---
layout: default
title: Comparison
nav_order: 9
---

# How MSR Compares

Migration Script Runner takes a unique approach to database migrations, combining the best ideas from across the ecosystem with some innovations of our own.

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Our Philosophy

MSR is designed for **production safety, developer experience, and flexibility**. We believe migration tools should:
- Provide multiple ways to accomplish tasks (TypeScript AND SQL)
- Give visibility into what's happening (dry run, execution summaries)
- Support both development and production workflows
- Stay out of your way when you don't need them

## Feature Highlights

### What Makes MSR Unique

| Feature | MSR | Typical Tools |
|---------|-----|---------------|
| **Concurrent Execution Protection** | ✅ Optional adapter-provided migration locking | Varies by tool |
| **Hybrid Migrations** | ✅ Both TypeScript & SQL | Usually one or the other |
| **Generic Type Safety** | ✅ Database-specific types (v0.6.0) | Limited or none |
| **Metrics Collection** | ✅ Built-in collectors (v0.6.0) | Usually custom |
| **Multi-Format Config** | ✅ YAML, TOML, XML, JSON, JS (v0.6.0) | Limited formats |
| **Transaction Management** | ✅ Configurable modes with retry (v0.5.0) | Basic or none |
| **Environment Variables** | ✅ Full 12-factor config (v0.5.0) | Limited |
| **.env File Support** | ✅ Multi-source with priority (v0.7.0) | Varies |
| **Dry Run Mode** | ✅ Built-in | Varies by tool and edition |
| **Execution Summaries** | ✅ Detailed success/failure logs | Basic output only |
| **Lifecycle Hooks** | ✅ Process, script, backup, transaction (v0.5.0) | Rare |
| **Flexible Rendering** | ✅ Table, JSON, Silent modes | Fixed format |
| **TypeScript-First** | ✅ Full type safety | Varies |

MSR includes several production-oriented capabilities that overlap with needs often described as “enterprise”: optional adapter-provided migration locking, pre-migration validation and checksum checks, dry runs, configurable transactions and retries, backup integration, rollback strategies, and metrics. These are documented in the [Features](features) page. They do **not** make MSR equivalent to Flyway Teams or Enterprise: MSR has no paid enterprise tier or built-in deployment governance suite such as Flyway's deployment rules, schema drift detection, or state-based deployment tooling. Flyway's official [feature summary](https://documentation.red-gate.com/flyway/learn-more-about-flyway/feature-summary) distinguishes features by Community, Teams, and Enterprise editions.

### Core Capabilities

| Capability | MSR Status |
|------------|-----------|
| Up/Down Migrations | ✅ |
| SQL Migrations | ✅ v0.4.0 |
| Concurrent Execution Protection | ✅ Optional adapter-provided locking with CLI management |
| Generic Type Safety | ✅ v0.6.0 - Database-specific types with `<DB extends IDB>` |
| Metrics Collection | ✅ v0.6.0 - Console, Logger, JSON, CSV collectors |
| Multi-Format Config | ✅ v0.6.0 - YAML, TOML, XML, JSON, JS |
| Transaction Support | ✅ v0.5.0 - Configurable modes, isolation levels, auto-retry |
| Environment Variables | ✅ v0.5.0 - 33 MSR_* variables |
| .env File Support | ✅ v0.7.0 - .env, .env.production, .env.local with priority control |
| Rollback | ✅ |
| Connection Validation | ✅ v0.4.0 |
| Programmatic API | ✅ |
| Multi-Database | ✅ PostgreSQL, MongoDB, MySQL, SQLite |
| Migration Tracking | ✅ |
| Backup Integration | ✅ |
| TypeScript Support | ✅ |

## Common Migration Tool Patterns

### JavaScript/TypeScript Ecosystem

**Knex.js** - Query builder with migrations
- Strengths: Mature, flexible, good locking mechanism
- Best for: Projects already using Knex for queries

**TypeORM** - ORM with migration support
- Strengths: Tight ORM integration, auto-generation
- Best for: TypeORM users who want unified tooling

**Prisma Migrate** - Schema-first migrations
- Strengths: Modern DX, schema drift detection
- Best for: New projects, Prisma users

**Sequelize** - ORM with migration CLI
- Strengths: Established ecosystem, multiple dialects
- Best for: Sequelize users

### Other Ecosystems

**Flyway** (Java) - SQL-first migrations
- Strengths: SQL-focused migrations, with additional deployment and governance capabilities in its Teams and Enterprise editions
- Best for: Java projects, teams that prefer SQL

**Liquibase** (Java) - Change tracking with multiple formats
- Strengths: Enterprise features, XML/YAML/SQL support
- Best for: Complex enterprise requirements

**Alembic** (Python) - SQLAlchemy migrations
- Strengths: Python integration, autogenerate
- Best for: Python/SQLAlchemy projects

**Rails Migrations** (Ruby) - Convention over configuration
- Strengths: Excellent conventions, schema dumping
- Best for: Rails applications

**golang-migrate** (Go) - Minimal migration library
- Strengths: Simple, no magic, multiple sources
- Best for: Go projects

**Supabase CLI** (PostgreSQL platform) - Local development and database deployment tooling
- Strengths: SQL migrations, schema diff and declarative schema workflows, migration history management, and preview branches integrated with Supabase
- Best for: Applications built on Supabase that want database changes and related backend configuration managed through the Supabase CLI

## When to Choose MSR

MSR is a great fit when you:

- ✅ Run migrations in environments with concurrent deployments (CI/CD, Kubernetes)
- ✅ Want flexibility to use TypeScript OR SQL migrations
- ✅ Need production-ready safety features (dry run, summaries, locking)
- ✅ Need reliable transaction management with automatic retry
- ✅ Deploy in containers/Kubernetes with environment variable and .env file config
- ✅ Value developer experience and type safety
- ✅ Want lifecycle hooks for custom logic
- ✅ Need multi-database support in one tool
- ✅ Prefer programmatic control with optional CLI
- ✅ Want a tool that doesn't force you into an ORM

## When to Choose Something Else

MSR supports SQL-only projects: write forward migrations as `.up.sql` files and add optional `.down.sql` files for rollback. Pure SQL by itself is not a reason to choose another tool; see the [SQL Migrations Guide](guides/sql-migrations).

Consider other tools if you:

- Already heavily invested in an ORM (TypeORM, Sequelize) and want tight integration
- Need automatic migration generation from schema changes
- Need a migration tool native to a Java/JVM application or your existing database deployment platform
- Want a schema-first approach (Prisma)
- Need an enterprise deployment-governance suite, such as Flyway's deployment rules and drift detection or Liquibase's commercial capabilities
- Build on Supabase and want migrations integrated with Supabase's local stack, hosted projects, schema-diff workflow, and preview branches

## Detailed Comparison Table

Comprehensive comparison of MSR with popular migration tools in the JavaScript/TypeScript ecosystem:

| Feature | MSR | Knex.js | TypeORM | Prisma Migrate | Sequelize | node-pg-migrate | Umzug |
|---------|-----|---------|---------|----------------|-----------|-----------------|-------|
| **Language** | TypeScript | JavaScript | TypeScript | TypeScript | JavaScript | JavaScript | TypeScript |
| **Database Support** | Any (adapter-based) | PostgreSQL, MySQL, SQLite, MSSQL | PostgreSQL, MySQL, SQLite, MSSQL, MongoDB, Oracle | PostgreSQL, MySQL, SQLite, MSSQL, CockroachDB | PostgreSQL, MySQL, SQLite, MSSQL, MariaDB, Oracle | PostgreSQL only | Any (storage-based) |
| **Migration Format** | TypeScript + SQL | JavaScript/TypeScript | TypeScript | Prisma Schema DSL | JavaScript | SQL + JavaScript | JavaScript/TypeScript |
| **Hybrid Migrations** | ✅ Both TS & SQL | ❌ JS/TS only | ❌ TS only | ❌ Schema DSL only | ❌ JS only | ✅ SQL + JS | ❌ JS/TS only |
| **Concurrent Protection** | ✅ Database locks | ✅ Database locks | ❌ None | ⚠️ Limited | ❌ None | ✅ Advisory locks | ❌ None |
| **Transaction Support** | ✅ Configurable modes + retry | ✅ Basic | ✅ Basic | ✅ Automatic | ✅ Basic | ✅ Automatic | ⚠️ Custom only |
| **Rollback Strategy** | ✅ Multiple (backup, down(), both, none) | ✅ Down migrations | ✅ Down migrations | ⚠️ Limited (shadow DB) | ✅ Down migrations | ✅ Down migrations | ✅ Down migrations |
| **Dry Run Mode** | ✅ Built-in | ❌ None | ❌ None | ✅ Built-in | ❌ None | ⚠️ Via --dry-run flag | ❌ None |
| **Environment Variables** | ✅ 33 MSR_* variables | ⚠️ Limited | ⚠️ Limited | ✅ Good support | ⚠️ Limited | ⚠️ Via custom code | ⚠️ Via custom code |
| **.env File Support** | ✅ Multi-source with priority | ⚠️ Manual | ⚠️ Manual | ✅ Built-in | ⚠️ Manual | ⚠️ Manual | ⚠️ Manual |
| **Config Formats** | ✅ JS, JSON, YAML, TOML, XML | ✅ JS, JSON | ✅ JS, JSON, YAML, XML | ✅ Prisma schema | ✅ JS, JSON | ⚠️ Via custom code | ⚠️ Via custom code |
| **Type Safety** | ✅ Generic types `<DB>` | ⚠️ Partial | ✅ Full with ORM | ✅ Generated types | ⚠️ Partial | ❌ None | ⚠️ Partial |
| **Lifecycle Hooks** | ✅ Process, script, backup, transaction | ❌ None | ⚠️ Limited | ⚠️ Limited | ⚠️ Limited | ❌ None | ✅ Before/After hooks |
| **Metrics Collection** | ✅ Built-in collectors | ❌ Custom only | ❌ Custom only | ❌ Custom only | ❌ Custom only | ❌ Custom only | ❌ Custom only |
| **Output Formats** | ✅ Table, JSON, Silent | ⚠️ Fixed | ⚠️ Fixed | ⚠️ Fixed | ⚠️ Fixed | ⚠️ Fixed | ⚠️ Via custom code |
| **Backup Integration** | ✅ Built-in interface | ❌ Custom only | ❌ Custom only | ❌ None | ❌ Custom only | ❌ Custom only | ❌ Custom only |
| **Migration Tracking** | ✅ Custom table | ✅ Custom table | ✅ Custom table | ✅ _prisma_migrations | ✅ Custom table | ✅ pgmigrations | ✅ Custom storage |
| **CLI** | ✅ Extensible factory | ✅ Built-in | ✅ Built-in | ✅ Built-in | ✅ Built-in | ✅ Built-in | ⚠️ Custom only |
| **Programmatic API** | ✅ Library-first | ✅ Available | ✅ Available | ⚠️ Limited | ✅ Available | ✅ Available | ✅ Library-first |
| **ORM Integration** | ❌ Database-agnostic | ✅ Knex query builder | ✅ TypeORM entities | ✅ Prisma Client | ✅ Sequelize models | ❌ None | ❌ None |
| **Auto-generation** | ❌ Manual | ❌ Manual | ✅ From entities | ✅ From schema | ✅ From models | ❌ Manual | ❌ Manual |
| **Schema Drift Detection** | ❌ None | ❌ None | ⚠️ Via sync | ✅ Built-in | ⚠️ Via sync | ❌ None | ❌ None |
| **Maturity** | 🟢 Active | 🟢 Mature | 🟢 Mature | 🟢 Mature | 🟢 Mature | 🟢 Mature | 🟢 Mature |
| **Best For** | Multi-DB, production safety, flexibility | Knex users, PostgreSQL | TypeORM projects | Prisma users, modern DX | Sequelize projects | PostgreSQL experts | Custom migration logic |

**Legend:**
- ✅ Full support / Built-in
- ⚠️ Partial support / Requires custom code
- ❌ Not supported / None

### Supabase CLI

Supabase CLI and MSR Core can both manage database migrations, but they target different scopes. Supabase CLI is part of the Supabase development and deployment platform and focuses on PostgreSQL projects. MSR Core is a database-agnostic migration library and CLI framework that connects through database adapters.

| Area | MSR Core | Supabase CLI |
|------|----------|--------------|
| **Scope** | Database-agnostic core with adapter-provided database behavior | Supabase platform tooling for PostgreSQL projects, including hosted and self-hosted setups |
| **Migration formats** | TypeScript, JavaScript, and SQL | Versioned SQL migration files |
| **Schema-to-migration workflow** | Write migration scripts directly | Generate SQL migrations from schema differences; also supports declarative schema workflows |
| **Apply and track migrations** | Run through the library or CLI; adapter stores migration history | Apply pending migrations with the CLI and compare local and remote migration history |
| **Rollback and recovery** | Configurable `DOWN`, `BACKUP`, `BOTH`, or `NONE` strategy, subject to adapter capabilities | CLI provides migration down/reset and history-repair commands; history repair changes metadata and does not reverse SQL changes |
| **Preview environments** | Not provided by Core; use external deployment infrastructure | Supabase Branching can create preview environments for pull requests |
| **Best fit** | TypeScript/JavaScript applications needing a reusable migration engine across database adapters | Applications already using Supabase and its database, local development, and deployment workflows |

See the official Supabase documentation for [database migrations](https://supabase.com/docs/guides/deployment/database-migrations), [declarative database schemas](https://supabase.com/docs/guides/local-development/declarative-database-schemas), and [branching](https://supabase.com/docs/guides/deployment/branching).

## Comparison with Cross-Platform Tools

Comparing MSR with popular migration tools from other ecosystems:

| Feature | MSR (Node.js) | Flyway (Java) | Liquibase (Java) | Alembic (Python) | Rails Migrations (Ruby) | golang-migrate (Go) |
|---------|---------------|---------------|------------------|------------------|-------------------------|---------------------|
| **Language** | TypeScript/JavaScript | Java/JVM | Java/JVM | Python | Ruby | Go |
| **Migration Format** | TypeScript + SQL | SQL | SQL, XML, YAML, JSON | Python | Ruby DSL | SQL + Go |
| **Concurrent Protection** | ✅ Database locks | ✅ Database locks | ✅ Database locks | ❌ None | ❌ None | ⚠️ Via custom locks |
| **Transaction Support** | ✅ Configurable + retry | ✅ Automatic | ✅ Automatic | ✅ Automatic | ✅ Automatic | ⚠️ Manual |
| **Rollback** | ✅ Multiple strategies | ✅ Undo migrations | ✅ Rollback tags | ✅ Down migrations | ✅ Down migrations | ✅ Down migrations |
| **Dry Run** | ✅ Built-in | ⚠️ Teams+ | ⚠️ Paid (Pro) | ❌ None | ❌ None | ❌ None |
| **Commercial governance suite** | ❌ No enterprise tier; includes operational safety features described above | ✅ Teams/Enterprise | ✅ Pro/Enterprise | ❌ None | ❌ None | ❌ None |
| **Environment Config** | ✅ 12-factor + .env | ✅ Config files | ✅ Config files | ⚠️ Manual | ✅ Rails config | ⚠️ Manual |
| **Type Safety** | ✅ Full TypeScript | ❌ SQL only | ❌ SQL/XML only | ⚠️ Python types | ❌ DSL only | ⚠️ Go types |
| **Best For** | Node.js projects | Java/JVM, SQL-first teams | Enterprise, complex requirements | Python/SQLAlchemy | Rails applications | Go projects, simplicity |

---

---

{: .note }
The Supabase and Flyway descriptions were checked against their official documentation in November 2026. The other vendor comparisons reflect research from December 2025. Capabilities and commercial editions change over time; verify details with each vendor's current documentation before making a decision.
