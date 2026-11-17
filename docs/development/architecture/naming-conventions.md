---
layout: default
title: Naming conventions
parent: Architecture
nav_order: 6
---

# Naming conventions
{: .no_toc }

Names that distinguish adapter capabilities from MSR orchestration and internal services.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Adapter contracts

Use I-prefixed domain names for database data-access contracts, such as **IDB**, **IBackup**, and **ISchemaVersion**.

Use the **Provider** suffix when an adapter supplies a capability that MSR consumes:

- **ILockingProvider** for database-backed migration locks.
- **ITransactionProvider** for transaction lifecycle operations.

Handler properties use the same names: **lockingProvider** and **transactionProvider**.

## MSR orchestration

Use the **Orchestrator** suffix for MSR components that wrap adapter contracts and add core behavior such as retries, hooks, logging, or configuration. Pair a public orchestrator contract with the I-prefixed interface name.

Current examples include **BackupOrchestrator** with **IBackupOrchestrator**, **SchemaVersionOrchestrator** with **ISchemaVersionOrchestrator**, and **LockingOrchestrator** with **ILockingOrchestrator**.

## Internal services

Use the **Service** suffix for MSR business logic that does not represent an adapter-provided capability or a wrapper around one. Examples include **MigrationService**, **RollbackService**, and **MigrationValidationService**.

Keep **MigrationRollbackManager** as the existing semantic exception: it manages rollback to a selected migration version.

## Before adding a public name

1. Identify whether the type belongs to the adapter contract, orchestration, or internal business-logic layer.
2. Match its suffix and handler or option property to that role.
3. Search existing source, tests, examples, and documentation for related names.
4. If the type already exists publicly, document a breaking migration path when renaming it.
