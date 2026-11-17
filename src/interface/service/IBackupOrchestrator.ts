/**
 * MSR orchestration contract for configured backup and restore operations.
 *
 * @example
 * ```typescript
 * const backupPath = await runnerServices.backup.backup();
 * await runnerServices.backup.restore(backupPath);
 * ```
 */
export interface IBackupOrchestrator {
    /**
     * Creates a backup using the configured adapter and backup settings.
     *
     * @returns The path or identifier of the created backup.
     * @throws Error If backup creation fails.
     * @example
     * ```typescript
     * const backupPath = await backupOrchestrator.backup();
     * ```
     */
    backup(): Promise<string>;

    /**
     * Restores a backup through the configured adapter.
     *
     * @param backupPath Optional path or identifier of the backup to restore.
     * @returns A promise that resolves after restoration completes.
     * @throws Error If restoration fails.
     * @example
     * ```typescript
     * await backupOrchestrator.restore('./backups/latest.bkp');
     * ```
     */
    restore(backupPath?: string): Promise<void>;

    /**
     * Deletes the backup created for the current operation when configured.
     *
     * @returns Nothing.
     * @throws Error If backup deletion fails.
     * @example
     * ```typescript
     * backupOrchestrator.deleteBackup();
     * ```
     */
    deleteBackup(): void;
}
