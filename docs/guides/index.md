---
layout: default
title: Guides
nav_order: 5
has_children: true
---

# Guides

Comprehensive guides and practical examples for using Migration Script Runner effectively.

## Core Usage

### [Writing Migrations](writing-migrations)
Best practices for creating migration scripts:
- Migration file structure
- up() and down() methods
- Database operations
- Error handling

### [SQL Migrations](sql-migrations)
Complete guide to SQL migration files (v0.4.0+):
- Using .up.sql and .down.sql files
- ISqlDB interface implementation
- Mixing TypeScript and SQL migrations
- Database-specific SQL features

### [Migrating from Flyway](migrating-from-flyway)
Plan a careful migration from an existing Flyway project:
- Inventory Flyway migration history and behavior
- Map file formats, identifiers, and the MSR schema-version contract
- Test the cutover on existing and clean database copies

### [Version Control](version-control)
Controlled migrations and rollbacks:
- up() for specific versions
- down() for rollbacks
- Version targeting strategies
- Migration workflows

### [Backup & Restore Workflows](backup-restore-workflows)
Database backup and restore operations:
- Environment synchronization
- Disaster recovery
- Database cloning
- Production to staging workflows

### [CLI Adapter Development](cli-adapter-development)
Build a command-line interface for a database adapter, then follow the topic pages:
- [CLI options and built-in commands](cli-options-and-flags)
- [Custom CLI commands](cli-custom-commands)
- [Async adapter initialization](cli-async-initialization)
- [Complete adapter example](cli-complete-example)
- [Testing and troubleshooting](cli-testing-troubleshooting)

---

## Practical Examples

### [AI Agent Integration Guide](ai-agent-integration)
Repository-aware steps for integrating MSR Core into an existing application:
- Inspect the host project's database, migration setup, and conventions
- Choose an existing adapter, the programmatic API, or a CLI integration
- Find the right API, configuration, migration, and deployment references
- Verify changes without unexpectedly running migrations against a live database

### [Recipes](recipes/)
Complete, copy-paste-ready implementations for common scenarios:
- PostgreSQL with backup/restore
- MongoDB migrations
- Testing patterns
- Multi-database coordination
- Custom validation

---

