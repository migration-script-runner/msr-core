import { ILockStatus } from './ILockingProvider';

/**
 * MSR's orchestration contract for migration locking.
 *
 * The orchestrator coordinates retry, ownership checks, logging, and hooks
 * around the database-specific {@link ILockingProvider} implementation.
 *
 * @example
 * const acquired = await lockingOrchestrator.acquireLock(executorId);
 * if (acquired) await runMigrations();
 */
export interface ILockingOrchestrator {
    /**
     * Acquires and verifies a migration lock.
     *
     * @param executorId Unique identifier for the migration runner.
     * @returns Whether the lock was acquired and ownership verified.
     * @throws Error If the provider operation fails.
     * @example `await lockingOrchestrator.acquireLock(executorId);`
     */
    acquireLock(executorId: string): Promise<boolean>;

    /**
     * Releases the lock held by the given runner.
     *
     * @param executorId Unique identifier for the migration runner.
     * @returns A promise that resolves when the release completes.
     * @throws Error If the provider operation fails.
     * @example `await lockingOrchestrator.releaseLock(executorId);`
     */
    releaseLock(executorId: string): Promise<void>;

    /**
     * Returns the current migration lock state.
     *
     * @returns Current lock status, or null when no lock is held.
     * @throws Error If the provider operation fails.
     * @example `const status = await lockingOrchestrator.getLockStatus();`
     */
    getLockStatus(): Promise<ILockStatus | null>;

    /**
     * Force-releases the current migration lock.
     *
     * @returns A promise that resolves when the lock is released.
     * @throws Error If the provider operation fails.
     * @example `await lockingOrchestrator.forceReleaseLock();`
     */
    forceReleaseLock(): Promise<void>;

    /**
     * Removes expired locks from the provider's storage.
     *
     * @returns A promise that resolves when cleanup completes.
     * @throws Error If the provider operation fails.
     * @example `await lockingOrchestrator.checkAndReleaseExpiredLock();`
     */
    checkAndReleaseExpiredLock(): Promise<void>;

    /**
     * Initializes the provider's lock storage.
     *
     * @returns A promise that resolves when initialization completes.
     * @throws Error If the provider cannot initialize its storage.
     * @example `await lockingOrchestrator.initLockStorage();`
     */
    initLockStorage(): Promise<void>;

    /**
     * Checks whether the provider's lock storage can be accessed.
     *
     * @returns Whether the storage is accessible.
     * @throws Error If the provider cannot check storage access.
     * @example `const accessible = await lockingOrchestrator.ensureLockStorageAccessible();`
     */
    ensureLockStorageAccessible(): Promise<boolean>;
}
