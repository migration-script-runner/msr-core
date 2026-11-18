---
layout: default
title: Lock Commands
parent: Guides
nav_order: 10
---

# Lock Commands
{: .no_toc }

Manage migration locks to prevent concurrent execution and recover from stuck locks
{: .fs-6 .fw-300 }

## Table of Contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

MSR provides two lock management commands to help you:
- **Check lock status**: See who holds the migration lock
- **Release stuck locks**: Recover from crashed processes

These commands are registered by an adapter CLI built with MSR Core and work with the [locking mechanism](../configuration/locking-settings). The Core package provides the CLI factory, while the adapter supplies the executable name. The commands below assume an npm script named `migration` that points to your adapter CLI:

```json
{
  "scripts": {
    "migration": "your-adapter-cli"
  }
}
```

Replace `your-adapter-cli` with the executable provided by your database adapter. Run the commands as `npm run migration -- <command>`.

---

## lock:status

Display the current migration lock status.

### Usage

```bash
npm run migration -- lock:status
```

### Outputs

#### No Lock (Unlocked)

```bash
$ npm run migration -- lock:status

Lock Status: UNLOCKED
No migration is currently running.
```

#### Lock Held

```bash
$ npm run migration -- lock:status

Lock Status: LOCKED
Locked by: macbook-pro-12345-a1b2c3d4-e5f6-7890-abcd
Locked at: 2025-12-18T14:32:10.123Z
Expires at: 2025-12-18T14:42:10.123Z
Process ID: 12345

Another migration is currently running.
If you believe this is a stale lock, use: npm run migration -- lock:release --force
```

#### Locking Not Configured

```bash
$ npm run migration -- lock:status

Lock Status: NOT CONFIGURED
Locking service is not available in your database handler.
See documentation for implementing ILockingProvider.
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success (lock status retrieved) |
| 1 | Error (unable to check status) |

---

## lock:release

Force-release a stuck migration lock.

{: .warning }
> **⚠️ DANGEROUS OPERATION**: Only use when you're CERTAIN no migration is running. Releasing an active lock can corrupt your database.

### Usage

```bash
npm run migration -- lock:release --force
```

### Required Flag

The `--force` flag is **required** to continue to the confirmation prompt. It does not skip confirmation.

```bash
# ❌ This will fail
$ npm run migration -- lock:release
✗ Error: --force flag is required for safety

# ✅ This will work
$ npm run migration -- lock:release --force
```

### Interactive Confirmation

When releasing a lock, MSR shows details and asks for confirmation:

```bash
$ npm run migration -- lock:release --force

⚠️  WARNING: Force releasing migration lock
──────────────────────────────────────────────────────
Lock held by: macbook-pro-12345-a1b2c3d4-e5f6-7890-abcd
Locked at: 2025-12-18T14:32:10.123Z
Expires at: 2025-12-18T14:42:10.123Z
──────────────────────────────────────────────────────

Releasing this lock while a migration is running could cause:
  • Race conditions
  • Corrupted migration state
  • Data loss

Only proceed if you are CERTAIN the migration process has crashed.

Are you sure you want to release this lock? (y/N): _
```

### Response Options

```bash
# Cancel (default)
Are you sure you want to release this lock? (y/N): n

✓ Operation cancelled
```

```bash
# Proceed
Are you sure you want to release this lock? (y/N): y

✓ Lock forcibly released
You can now run migrations again.
```

### No Lock to Release

```bash
$ npm run migration -- lock:release --force

✓ No lock to release
The lock is already released or was never acquired.
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success (lock released or no lock to release) |
| 1 | Error (unable to release lock) |

---

## Common Workflows

### 1. Check Before Releasing

Always check the lock status before releasing:

```bash
# Step 1: Check who holds the lock
$ npm run migration -- lock:status

Lock Status: LOCKED
Locked by: server-prod-01-12345-uuid
Locked at: 2025-12-18T14:32:10.123Z
Expires at: 2025-12-18T14:42:10.123Z

# Step 2: Verify the process is truly stuck
# - Check if server-prod-01 crashed
# - Check if migration is still running
# - Check if lock is expired

# Step 3: Only release if you're sure it's stale
$ npm run migration -- lock:release --force
```

---

### 2. Recovery from Crashed Process

When a migration process crashes:

```bash
# The lock remains until timeout (default: 10 minutes)
$ npm run migration -- lock:status

Lock Status: LOCKED
Locked by: crashed-process-uuid
Locked at: 2025-12-18T14:30:00.000Z
Expires at: 2025-12-18T14:40:00.000Z  # Still 5 minutes away

# Option 1: Let the next migration run check and clear the expired lock
# Expiration is checked during lock acquisition, not continuously

# Option 2: Manually release if urgent
$ npm run migration -- lock:release --force
```

---

### 3. CI/CD Pipeline Stuck

When a CI/CD pipeline gets stuck:

```bash
# Check if lock is from abandoned CI job
$ npm run migration -- lock:status

Lock Status: LOCKED
Locked by: ci-runner-5-12345-uuid
Locked at: 2025-12-18T14:00:00.000Z  # 1 hour ago!
Expires at: 2025-12-18T14:10:00.000Z  # Already expired!

# Release the expired lock
$ npm run migration -- lock:release --force
```

{: .tip }
> **Expired locks**: Expiration is checked when a migration attempts to acquire the lock, not continuously. A later migration run can clear an expired lock through the adapter provider. Use `lock:release --force` for manual recovery only after confirming the original migration process has stopped.

---

### 4. Disable Locking for Emergency

If locking is causing issues during an incident:

```bash
# Option 1: Disable for single run
$ npm run migration -- migrate --no-lock

# Option 2: Force release and run normally
$ npm run migration -- lock:release --force
$ npm run migration -- migrate
```

{: .warning }
> Only disable locking during emergencies. Always re-enable it after resolving the issue.

---

## Troubleshooting

### "Lock ownership verification failed"

**Symptom**: Lock was acquired but immediately lost.

**Causes**:
- System clock differences between servers
- Database connection issues
- Extremely high concurrency

**Solution**:
1. Check system clocks are synchronized (NTP)
2. Verify database connectivity is stable
3. Check for competing migration processes

---

### Lock Always Held

**Symptom**: `npm run migration -- lock:status` always shows the lock as held, even after releasing.

**Possible causes**:
- Another process continuously acquires the lock
- Multiple MSR instances configured incorrectly

**Solution**:
```bash
# Check if multiple processes are running
$ ps aux | grep msr

# Use different table names for different apps
# In config:
config.locking.tableName = 'app1_migration_locks';  // App 1
config.locking.tableName = 'app2_migration_locks';  // App 2
```

---

### Can't Release Lock

**Symptom**: `npm run migration -- lock:release --force` fails with database error.

**Possible causes**:
- Database connection issues
- Permission problems
- Lock table doesn't exist

**Solution**:
```bash
# Check database connectivity
$ npm run migration -- list  # If this works, database is accessible

# Check lock table exists (SQL example)
$ psql -c "SELECT * FROM migration_locks;"

# Manually delete lock (DANGEROUS - use only as last resort)
$ psql -c "DELETE FROM migration_locks;"
```

---

## Integration with Monitoring

### Shell-based status checks

Use the command output in a monitoring script. This is a shell integration example, not a built-in Prometheus exporter:

```bash
#!/bin/bash
# check-lock-status.sh
# Returns 0 if unlocked, 1 if locked

npm run migration -- lock:status | grep -q "UNLOCKED"
exit $?
```

---

### Alerting

Set up alerts for long-held locks:

```bash
#!/bin/bash
# alert-stale-lock.sh
# Alert if lock is held longer than expected

OUTPUT=$(npm run migration -- lock:status)

if echo "$OUTPUT" | grep -q "LOCKED"; then
  LOCKED_AT=$(echo "$OUTPUT" | grep "Locked at:" | cut -d: -f2-)
  # Calculate duration and alert if > threshold
  # (implementation depends on your alerting system)
fi
```

---

## API alternative

Pass the adapter handler and configuration into a helper so the example declares its dependencies. Only request a release after confirming that the process holding the lock has stopped:

```typescript
import {
  Config,
  IDB,
  IDatabaseMigrationHandler,
  MigrationScriptRunner
} from '@migration-script-runner/core';

class ExampleRunner<DB extends IDB> extends MigrationScriptRunner<DB> {}

async function inspectLock(
  handler: IDatabaseMigrationHandler<IDB>,
  config: Config,
  confirmedStaleLock = false
): Promise<void> {
  const runner = new ExampleRunner<IDB>({ handler, config });
  const status = await runner.getLockStatus();

  if (status === null) {
    console.log('Locking is not configured');
    return;
  }

  if (!status.isLocked) {
    console.log('No migration lock is held');
    return;
  }

  console.log(`Lock held by: ${status.lockedBy}`);
  console.log(`Expires at: ${status.expiresAt}`);

  if (confirmedStaleLock) {
    await runner.forceReleaseLock();
  }
}
```

See the [API Documentation](../api/) for details.

---

## Related

- [Locking Settings](../configuration/locking-settings) - Configure locking behavior
- [CLI vs API](cli-vs-api) - When to use CLI vs API
- [Transaction Settings](../configuration/transaction-settings) - Transaction configuration
- [Production Deployment](../guides/production-deployment) - Deployment patterns and operational guidance
