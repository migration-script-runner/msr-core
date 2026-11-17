import { ILockStatus } from './ILockingProvider';

/**
 * Lifecycle hooks for lock operations.
 *
 * **NEW in v0.8.1:** Standardized hook interface for observability and integration.
 *
 * Provides hook points throughout the lock lifecycle for:
 * - **Metrics collection**: Track lock acquisitions, conflicts, failures
 * - **Alerting**: Send notifications on lock conflicts or errors
 * - **Audit logging**: Record lock operations for compliance
 * - **Monitoring**: Integrate with observability platforms
 *
 * All hooks are optional and should not throw errors to avoid breaking
 * the lock workflow. Wrap hook implementations in try-catch if needed.
 *
 * @example
 * ```typescript
 * // Metrics collection
 * const hooks: ILockingHooks = {
 *   async onLockAcquired(runnerId, status) {
 *     await metrics.increment('locks.acquired');
 *     await auditLog.write({ event: 'lock_acquired', runnerId });
 *   },
 *   async onLockAcquisitionFailed(runnerId, currentOwner) {
 *     await metrics.increment('locks.conflicts');
 *     await sendAlert(`Lock conflict: ${runnerId} vs ${currentOwner}`);
 *   }
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Alerting and monitoring
 * const hooks: ILockingHooks = {
 *   async onLockError(operation, error, runnerId) {
 *     await sendAlert({
 *       severity: 'high',
 *       message: `Lock ${operation} failed: ${error.message}`,
 *       runnerId
 *     });
 *   },
 *   async onAcquireRetry(runnerId, attempt, currentOwner) {
 *     console.warn(`Retry ${attempt}: Lock held by ${currentOwner}`);
 *   }
 * };
 * ```
 */
export interface ILockingHooks {
    /**
     * Called before attempting to acquire the lock.
     *
     * Use for:
     * - Pre-acquisition logging
     * - Metrics start timing
     * - Validation checks
     *
     * @param runnerId Unique identifier for this runner
     * @param timeout Lock timeout in milliseconds
     */
    onBeforeAcquireLock?(runnerId: string, timeout: number): Promise<void>;

    /**
     * Called after successfully acquiring and verifying the lock.
     *
     * Use for:
     * - Success metrics
     * - Audit logging
     * - Notification of lock acquisition
     *
     * @param runnerId Unique identifier for this runner
     * @param status Current lock status information
     */
    onLockAcquired?(runnerId: string, status: ILockStatus): Promise<void>;

    /**
     * Called when lock acquisition fails (already held by another runner).
     *
     * Use for:
     * - Conflict metrics
     * - Alerting on lock contention
     * - Debugging concurrent execution attempts
     *
     * @param runnerId Unique identifier for this runner
     * @param currentOwner Runner ID currently holding the lock
     */
    onLockAcquisitionFailed?(runnerId: string, currentOwner: string): Promise<void>;

    /**
     * Called before each retry attempt to acquire the lock.
     *
     * Use for:
     * - Retry metrics
     * - Progress logging
     * - Monitoring lock wait times
     *
     * @param runnerId Unique identifier for this runner
     * @param attempt Retry attempt number (1-based)
     * @param currentOwner Runner ID currently holding the lock
     */
    onAcquireRetry?(runnerId: string, attempt: number, currentOwner: string): Promise<void>;

    /**
     * Called when lock ownership verification fails after acquisition.
     *
     * **Critical event**: Indicates race condition or lock stolen between
     * acquisition and verification.
     *
     * Use for:
     * - Security alerts
     * - Race condition detection
     * - Clock skew monitoring
     *
     * @param runnerId Unique identifier for this runner
     */
    onOwnershipVerificationFailed?(runnerId: string): Promise<void>;

    /**
     * Called before releasing the lock.
     *
     * Use for:
     * - Pre-release logging
     * - Lock hold time calculation
     * - Cleanup operations
     *
     * @param runnerId Unique identifier for this runner
     */
    onBeforeReleaseLock?(runnerId: string): Promise<void>;

    /**
     * Called after successfully releasing the lock.
     *
     * Use for:
     * - Release metrics
     * - Audit logging
     * - Notification of lock release
     *
     * @param runnerId Unique identifier for this runner
     */
    onLockReleased?(runnerId: string): Promise<void>;

    /**
     * Called when forcing lock release (regardless of ownership).
     *
     * **Dangerous operation**: Use for alerting and audit logging.
     *
     * Use for:
     * - Security audit logs
     * - High-priority alerts
     * - Force-release tracking
     *
     * @param status Lock status before force release (null if no lock existed)
     */
    onForceReleaseLock?(status: ILockStatus | null): Promise<void>;

    /**
     * Called when a lock operation fails with an error.
     *
     * Use for:
     * - Error metrics
     * - High-priority alerts
     * - Error aggregation and analysis
     *
     * @param operation Operation that failed (e.g., 'acquire', 'release', 'verify')
     * @param error Error that occurred
     * @param runnerId Runner ID (may be undefined for some operations)
     */
    onLockError?(operation: string, error: Error, runnerId?: string): Promise<void>;
}
