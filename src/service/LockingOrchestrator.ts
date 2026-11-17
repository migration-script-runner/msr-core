import { IDB } from '../interface/dao';
import { ILockingProvider, ILockStatus } from '../interface/service/ILockingProvider';
import { ILockingOrchestrator } from '../interface/service/ILockingOrchestrator';
import { ILockingHooks } from '../interface/service/ILockingHooks';
import { LockingConfig } from '../model/LockingConfig';
import { ILogger } from '../interface/ILogger';

/**
 * Orchestrates lock operations with retry logic, hooks, and logging.
 *
 * **NEW in v0.8.1:** Decorator pattern for centralized lock management.
 *
 * The LockingOrchestrator wraps an ILockingProvider implementation and adds:
 * - **Retry logic**: Configurable attempts and delays
 * - **Two-phase locking**: Acquire → verify ownership for race condition prevention
 * - **Hooks**: Lifecycle events for metrics, alerting, and audit logging
 * - **Logging**: Structured logging at info/warn/error levels
 * - **Error handling**: Consistent error propagation and context preservation
 *
 * This follows MSR's established pattern where **Core handles orchestration**
 * and **adapters handle database-specific operations**, similar to BackupOrchestrator
 * and RollbackService.
 *
 * @template DB - Database interface type extending IDB
 *
 * @example
 * ```typescript
 * // PostgreSQL adapter provides pure database operations
 * const lockingProvider = new PostgresLockingProvider(db);
 *
 * // Core orchestrates with retry, hooks, and logging
 * const orchestrator = new LockingOrchestrator(
 *   lockingProvider,
 *   config.locking,
 *   logger,
 *   {
 *     async onLockAcquired(executorId, status) {
 *       await metrics.increment('locks.acquired');
 *     },
 *     async onLockError(operation, error) {
 *       await sendAlert(`Lock ${operation} failed: ${error.message}`);
 *     }
 *   }
 * );
 *
 * // Use orchestrator for all lock operations
 * const executorId = generateExecutorId();
 * try {
 *   const acquired = await orchestrator.acquireLock(executorId);
 *   if (acquired) {
 *     await runMigrations();
 *   }
 * } finally {
 *   await orchestrator.releaseLock(executorId);
 * }
 * ```
 */
export class LockingOrchestrator<DB extends IDB> implements ILockingOrchestrator {
    /**
     * Create a new LockingOrchestrator.
     *
     * @param lockingProvider Database-specific lock implementation
     * @param config Locking configuration (timeout, retries)
     * @param logger Logger for structured logging
     * @param hooks Optional lifecycle hooks for observability
     */
    constructor(
        private readonly lockingProvider: ILockingProvider<DB>,
        private readonly config: LockingConfig,
        private readonly logger: ILogger,
        private readonly hooks?: ILockingHooks
    ) {}

    /**
     * Acquire lock with retry logic and two-phase verification.
     *
     * **Process:**
     * 1. Call onBeforeAcquireLock hook
     * 2. Attempt to acquire lock (with retries if configured)
     * 3. Verify lock ownership (two-phase locking)
     * 4. Call onLockAcquired or onLockAcquisitionFailed hook
     *
     * **Retry Logic:**
     * - Retries up to config.retryAttempts times
     * - Waits config.retryDelay milliseconds between retries
     * - Calls onAcquireRetry hook on each retry
     *
     * @param executorId Unique identifier for this executor
     * @returns true if lock acquired and verified, false if locked by another
     * @throws Error if database operation fails
     */
    async acquireLock(executorId: string): Promise<boolean> {
        try {
            // Hook: before acquire
            await this.hooks?.onBeforeAcquireLock?.(executorId, this.config.timeout);

            this.logger.info(`Attempting to acquire lock: ${executorId}`);

            // Retry logic
            for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
                try {
                    // Delegate to adapter for database-specific acquisition
                    const acquired = await this.lockingProvider.acquireLock(executorId);

                    if (acquired) {
                        // Two-phase locking: verify ownership after acquisition
                        const verified = await this.lockingProvider.verifyLockOwnership(executorId);

                        if (!verified) {
                            this.logger.error('Lock ownership verification failed');
                            await this.hooks?.onOwnershipVerificationFailed?.(executorId);
                            throw new Error(
                                'Lock ownership verification failed. Lock was acquired but is no longer owned by this executor. ' +
                                'This may indicate a race condition or clock skew between servers.'
                            );
                        }

                        // Success: acquired and verified
                        const status = await this.lockingProvider.getLockStatus();
                        this.logger.info(`✓ Lock acquired: ${executorId}`);
                        await this.hooks?.onLockAcquired?.(executorId, status!);

                        return true;
                    }

                    // Lock already held - retry if configured
                    if (attempt < this.config.retryAttempts) {
                        const currentOwner = (await this.lockingProvider.getLockStatus())?.lockedBy || 'unknown';
                        this.logger.warn(
                            `Lock held by ${currentOwner}, retrying... (${attempt + 1}/${this.config.retryAttempts})`
                        );
                        await this.hooks?.onAcquireRetry?.(executorId, attempt + 1, currentOwner);
                        await this.sleep(this.config.retryDelay);
                    } else {
                        // Max retries exceeded
                        const currentOwner = (await this.lockingProvider.getLockStatus())?.lockedBy || 'unknown';
                        this.logger.error(`Failed to acquire lock after ${this.config.retryAttempts} attempts`);
                        await this.hooks?.onLockAcquisitionFailed?.(executorId, currentOwner);
                        return false;
                    }
                } catch (error) {
                    // Database error during acquire/verify
                    this.logger.error(`Lock acquisition error: ${error}`);
                    await this.hooks?.onLockError?.('acquire', error as Error, executorId);
                    throw error;
                }
            }

            /* istanbul ignore next */
            return false; // Unreachable: loop always returns inside
        } catch (error) {
            // Hook invocation error or unexpected error
            this.logger.error(`Lock acquisition failed: ${error}`);
            await this.hooks?.onLockError?.('acquire', error as Error, executorId);
            throw error;
        }
    }

    /**
     * Release the migration lock.
     *
     * Should be called in a finally block to ensure cleanup.
     * Only releases if the executor still owns the lock.
     *
     * @param executorId Unique identifier for this executor
     * @throws Error if database operation fails
     */
    async releaseLock(executorId: string): Promise<void> {
        try {
            await this.hooks?.onBeforeReleaseLock?.(executorId);
            this.logger.info(`Releasing lock: ${executorId}`);

            // Delegate to adapter
            await this.lockingProvider.releaseLock(executorId);

            this.logger.info(`✓ Lock released: ${executorId}`);
            await this.hooks?.onLockReleased?.(executorId);
        } catch (error) {
            this.logger.error(`Failed to release lock: ${error}`);
            await this.hooks?.onLockError?.('release', error as Error, executorId);
            throw error;
        }
    }

    /**
     * Get current lock status.
     *
     * @returns Current lock status or null if no lock exists
     * @throws Error if database operation fails
     */
    async getLockStatus(): Promise<ILockStatus | null> {
        try {
            return await this.lockingProvider.getLockStatus();
        } catch (error) {
            this.logger.error(`Failed to get lock status: ${error}`);
            await this.hooks?.onLockError?.('status', error as Error);
            throw error;
        }
    }

    /**
     * Force-release the migration lock regardless of ownership.
     *
     * **DANGEROUS:** Only use when certain no migration is running.
     * Used by CLI `lock:release --force` command.
     *
     * @throws Error if database operation fails
     */
    async forceReleaseLock(): Promise<void> {
        try {
            const status = await this.lockingProvider.getLockStatus();

            if (status?.isLocked) {
                this.logger.warn(`⚠️ Force-releasing lock held by: ${status.lockedBy}`);
            }

            await this.lockingProvider.forceReleaseLock();

            this.logger.info('✓ Lock force-released');
            await this.hooks?.onForceReleaseLock?.(status);
        } catch (error) {
            this.logger.error(`Failed to force-release lock: ${error}`);
            await this.hooks?.onLockError?.('forceRelease', error as Error);
            throw error;
        }
    }

    /**
     * Check for and clean up expired locks.
     *
     * Called automatically before attempting to acquire a lock.
     *
     * @throws Error if database operation fails
     */
    async checkAndReleaseExpiredLock(): Promise<void> {
        try {
            await this.lockingProvider.checkAndReleaseExpiredLock();
        } catch (error) {
            this.logger.error(`Failed to cleanup expired locks: ${error}`);
            await this.hooks?.onLockError?.('cleanup', error as Error);
            throw error;
        }
    }

    /**
     * Initialize lock storage structures.
     *
     * Should be called during handler initialization.
     *
     * @throws Error if storage setup fails
     */
    async initLockStorage(): Promise<void> {
        try {
            this.logger.debug('Initializing lock storage');
            await this.lockingProvider.initLockStorage();
            this.logger.debug('✓ Lock storage initialized');
        } catch (error) {
            this.logger.error(`Failed to initialize lock storage: ${error}`);
            await this.hooks?.onLockError?.('init', error as Error);
            throw error;
        }
    }

    /**
     * Verify lock storage is accessible.
     *
     * Should be called during handler initialization after initLockStorage().
     *
     * @returns true if storage is accessible, false otherwise
     */
    async ensureLockStorageAccessible(): Promise<boolean> {
        try {
            const accessible = await this.lockingProvider.ensureLockStorageAccessible();
            if (accessible) {
                this.logger.debug('✓ Lock storage is accessible');
            } else {
                this.logger.warn('⚠️ Lock storage is not accessible');
            }
            return accessible;
        } catch (error) {
            this.logger.error(`Failed to check lock storage accessibility: ${error}`);
            await this.hooks?.onLockError?.('accessibility-check', error as Error);
            return false;
        }
    }

    /**
     * Sleep for specified milliseconds.
     *
     * @param ms Milliseconds to sleep
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
