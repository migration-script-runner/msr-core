import { TestMigrationScriptRunner } from '../../helpers/TestMigrationScriptRunner';
import { expect } from 'chai';
import sinon from 'sinon';
import {
    MigrationScriptRunner,
    Config,
    SilentLogger,
    IDatabaseMigrationHandler,
    ISchemaVersion,
    IMigrationInfo,
    IDB,
    IMigrationHooks,
    RollbackStrategy,
    IBackupOrchestrator
} from '../../../src';

/**
 * Unit tests for MigrationScriptRunner restore hooks functionality.
 * Tests the onBeforeRestore and onAfterRestore hooks that execute during
 * backup restoration after migration failures.
 */
describe('MigrationScriptRunner - Restore Hooks (Unit)', () => {
    let handler: IDatabaseMigrationHandler<IDB>;
    let config: Config;
    const db: IDB = new class implements IDB {
        [key: string]: unknown;
        test() { throw new Error('Not implemented') }
        async checkConnection(): Promise<boolean> {
            return true;
        }
    }

    beforeEach(() => {
        config = new Config();
        config.folder = '/test/path';
        config.rollbackStrategy = RollbackStrategy.BACKUP;

        handler = {
            db,
            schemaVersion: {
                isInitialized: () => Promise.resolve(true),
                createTable: () => Promise.resolve(true),
                validateTable: () => Promise.resolve(true),
                migrationRecords: {
                    getAllExecuted: () => Promise.resolve([]),
                    save: (details: IMigrationInfo) => Promise.resolve(),
                    remove(timestamp: number): Promise<void> {
                        return Promise.resolve(undefined);
                    }
                }
            } as ISchemaVersion<IDB>,
            getName: () => 'TestHandler',
            getVersion: () => '1.0.0-test',
        } as IDatabaseMigrationHandler<IDB>;
    });

    afterEach(() => {
        sinon.restore();
    });

    /**
     * Test: rollbackWithBackup calls onBeforeRestore and onAfterRestore hooks
     * Covers lines 671-681 in MigrationScriptRunner.ts
     * Validates that restore hooks are called when rollback occurs with a valid backup path.
     */
    it('should call onBeforeRestore and onAfterRestore hooks when backupPath is provided', async () => {
        const restoreHooks: IMigrationHooks<IDB> = {
            onBeforeRestore: sinon.stub().resolves(),
            onAfterRestore: sinon.stub().resolves()
        };

        const mockBackupOrchestrator: IBackupOrchestrator = {
            backup: sinon.stub().resolves('/path/to/backup.bkp'),
            restore: sinon.stub().resolves(),
            deleteBackup: sinon.stub()
        };

        const runner = new TestMigrationScriptRunner<IDB>({ handler: handler, logger: new SilentLogger(),
            hooks: restoreHooks,
            backupOrchestrator: mockBackupOrchestrator
, config: config });

        // Test rollbackService.rollback with BACKUP strategy
        await (runner as any).core.rollback.rollback([], '/path/to/backup.bkp');

        // Verify restore hooks were called
        expect((restoreHooks.onBeforeRestore as sinon.SinonStub).calledOnce).to.be.true;
        expect((restoreHooks.onAfterRestore as sinon.SinonStub).calledOnce).to.be.true;
        expect((mockBackupOrchestrator.restore as sinon.SinonStub).calledOnce).to.be.true;
        expect((mockBackupOrchestrator.deleteBackup as sinon.SinonStub).calledOnce).to.be.true;
    });

    /**
     * Test: rollbackWithBackup calls restore hooks in correct order
     * Validates that onBeforeRestore is called before restoration,
     * and onAfterRestore is called after restoration completes.
     */
    it('should call restore hooks in correct order', async () => {
        const callOrder: string[] = [];

        const orderTrackingHooks: IMigrationHooks<IDB> = {
            onBeforeRestore: sinon.stub().callsFake(async () => {
                callOrder.push('onBeforeRestore');
            }),
            onAfterRestore: sinon.stub().callsFake(async () => {
                callOrder.push('onAfterRestore');
            })
        };

        const mockBackupOrchestrator: IBackupOrchestrator = {
            backup: sinon.stub().resolves('/path/to/backup.bkp'),
            restore: sinon.stub().callsFake(async () => {
                callOrder.push('restore');
            }),
            deleteBackup: sinon.stub().callsFake(() => {
                callOrder.push('deleteBackup');
            })
        };

        const runner = new TestMigrationScriptRunner<IDB>({ handler: handler, logger: new SilentLogger(),
            hooks: orderTrackingHooks,
            backupOrchestrator: mockBackupOrchestrator
, config: config });

        // Test rollbackService.rollback with BACKUP strategy
        await (runner as any).core.rollback.rollback([], '/path/to/backup.bkp');

        // Verify order: onBeforeRestore -> restore -> onAfterRestore -> deleteBackup
        expect(callOrder).to.deep.equal(['onBeforeRestore', 'restore', 'onAfterRestore', 'deleteBackup']);
    });

    /**
     * Test: rollbackWithBackup does not call restore hooks when backupPath is undefined
     * Validates that restore hooks are not called when no backup is available.
     */
    it('should not call restore hooks when backupPath is undefined', async () => {
        const restoreHooks: IMigrationHooks<IDB> = {
            onBeforeRestore: sinon.stub().resolves(),
            onAfterRestore: sinon.stub().resolves()
        };

        const mockBackupOrchestrator: IBackupOrchestrator = {
            backup: sinon.stub().resolves(),
            restore: sinon.stub().resolves(),
            deleteBackup: sinon.stub()
        };

        const runner = new TestMigrationScriptRunner<IDB>({ handler: handler, logger: new SilentLogger(),
            hooks: restoreHooks,
            backupOrchestrator: mockBackupOrchestrator
, config: config });

        // Test rollbackService.rollback with BACKUP strategy but no backup path
        await (runner as any).core.rollback.rollback([], undefined);

        // Verify restore hooks were NOT called
        expect((restoreHooks.onBeforeRestore as sinon.SinonStub).called).to.be.false;
        expect((restoreHooks.onAfterRestore as sinon.SinonStub).called).to.be.false;
        expect((mockBackupOrchestrator.restore as sinon.SinonStub).called).to.be.false;
    });

    /**
     * Test: rollbackWithBackup does not call hooks when hooks are not provided
     * Validates that the method handles missing hooks gracefully.
     */
    it('should handle missing hooks gracefully', async () => {
        const mockBackupOrchestrator: IBackupOrchestrator = {
            backup: sinon.stub().resolves('/path/to/backup.bkp'),
            restore: sinon.stub().resolves(),
            deleteBackup: sinon.stub()
        };

        const runner = new TestMigrationScriptRunner<IDB>({ handler: handler, logger: new SilentLogger(),
            backupOrchestrator: mockBackupOrchestrator
            // No hooks provided
, config: config });

        // Should not throw error - test rollbackService.rollback with BACKUP strategy
        await (runner as any).core.rollback.rollback([], '/path/to/backup.bkp');

        // Verify restore was still called
        expect((mockBackupOrchestrator.restore as sinon.SinonStub).calledOnce).to.be.true;
        expect((mockBackupOrchestrator.deleteBackup as sinon.SinonStub).calledOnce).to.be.true;
    });
});
