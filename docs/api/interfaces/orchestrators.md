---
layout: default
title: Orchestration contracts
parent: Interfaces
grand_parent: API Reference
nav_order: 8
---

# Orchestration contracts
{: .no_toc }

Interfaces for MSR components that coordinate database adapter capabilities.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Backup orchestration

**IBackupOrchestrator** describes MSR's configured backup lifecycle. **BackupOrchestrator** wraps the adapter's **IBackup** implementation with backup configuration and logging.

Its public operations are **backup()**, **restore(backupPath?)**, and **deleteBackup()**. Supply a custom implementation through the **backupOrchestrator** runner option when the built-in orchestration is not suitable.

## Schema version orchestration

**ISchemaVersionOrchestrator<DB>** describes the core wrapper around an adapter's **ISchemaVersion<DB>** implementation. **SchemaVersionOrchestrator<DB>** initializes and validates the version table, then delegates record operations to the adapter.

Its operations are **init(tableName)**, **save(details)**, **getAllMigratedScripts()**, and **remove(timestamp)**.

## Locking orchestration

**ILockingOrchestrator** is implemented by **LockingOrchestrator<DB>**. The core orchestrator uses an adapter's **ILockingProvider<DB>** and adds retries, ownership verification, hooks, and logging.

Its public operations are **acquireLock(executorId)**, **releaseLock(executorId)**, **getLockStatus()**, **forceReleaseLock()**, **checkAndReleaseExpiredLock()**, **initLockStorage()**, and **ensureLockStorageAccessible()**.

Adapters provide database-specific operations through [ILockingProvider](locking-provider); they do not implement the core orchestration contract.

---

## Relationship to adapter providers

Provider contracts describe capabilities an adapter supplies. Orchestrator contracts describe MSR coordination around those capabilities. Internal Service classes contain MSR business logic. **MigrationRollbackManager** remains a manager because it coordinates version-targeted rollback behavior.
