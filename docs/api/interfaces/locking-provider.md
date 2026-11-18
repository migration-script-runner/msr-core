---
layout: default
title: ILockingProvider
parent: Interfaces
grand_parent: API Reference
nav_order: 7
---

# ILockingProvider
{: .no_toc }

Database-specific contract for persistent migration locking.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Responsibility

An adapter implements `ILockingProvider<DB>` to perform atomic lock operations in its database or storage system. MSR's LockingOrchestrator adds retry behavior, ownership checks, hooks, and logging around this provider.

Register the provider on `IDatabaseMigrationHandler` as `lockingProvider`.

## Required operations

| Method | Purpose |
| --- | --- |
| `initLockStorage()` | Create or prepare the lock storage. |
| `ensureLockStorageAccessible()` | Confirm the storage is ready before migrations run. |
| `acquireLock(runnerId)` | Atomically acquire the lock when it is free. |
| `verifyLockOwnership(runnerId)` | Confirm that the caller still owns the lock. |
| `releaseLock(runnerId)` | Release the caller's lock. |
| `getLockStatus()` | Return current lock state or null. |
| `forceReleaseLock()` | Remove a lock regardless of owner for emergency recovery. |
| `checkAndReleaseExpiredLock()` | Remove expired lock records. |

The methods must use shared database-backed storage when several application instances can run migrations. An in-memory lock does not protect a distributed deployment.

## Handler example

~~~typescript
import {
  IDatabaseMigrationHandler,
  ILockingProvider,
  ILockStatus
} from '@migration-script-runner/core';

class PostgreSqlLockingProvider implements ILockingProvider<PostgreSqlDB> {
  async initLockStorage(): Promise<void> {
    // Create the lock table and its uniqueness constraint.
  }

  async ensureLockStorageAccessible(): Promise<boolean> {
    // Check database permissions and connectivity.
    return true;
  }

  async acquireLock(runnerId: string): Promise<boolean> {
    // Use an atomic insert or equivalent database operation.
    return true;
  }

  async verifyLockOwnership(runnerId: string): Promise<boolean> {
    return true;
  }

  async releaseLock(runnerId: string): Promise<void> {
    // Delete only the lock owned by runnerId.
  }

  async getLockStatus(): Promise<ILockStatus | null> {
    return null;
  }

  async forceReleaseLock(): Promise<void> {
    // Delete the lock without checking its owner.
  }

  async checkAndReleaseExpiredLock(): Promise<void> {
    // Delete expired lock records.
  }
}

const handler: IDatabaseMigrationHandler<PostgreSqlDB> = {
  db,
  schemaVersion,
  lockingProvider: new PostgreSqlLockingProvider(),
  getName: () => 'PostgreSQL',
  getVersion: () => '1.0.0'
};
~~~

---

## Related contracts

- [`IDatabaseMigrationHandler`](database-handler) accepts the provider.
- [Orchestration contracts](orchestrators) describe the core wrapper interfaces.
- Implementation requirements and settings are described in the [locking configuration guide](../../configuration/locking-settings).
