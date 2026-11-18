import { TestMigrationScriptRunner } from '../../helpers/TestMigrationScriptRunner';
import {expect} from 'chai';
import sinon from 'sinon';
import {
    Config,
    IDB,
    IDatabaseMigrationHandler,
    MigrationScriptRunner,
    IBackup,
    ISchemaVersion,
    SilentLogger,
    LevelAwareLogger
} from "../../../src";
import {TestUtils} from "../../helpers";

/**
 * Integration tests for MigrationScriptRunner dependency injection.
 * Tests constructor and custom service injection.
 */
describe('MigrationScriptRunner - Dependency Injection', () => {

    let handler: IDatabaseMigrationHandler<IDB>;
    let cfg: Config;

    before(() => {
        cfg = TestUtils.getConfig();
        const db: IDB = new class implements IDB {
            [key: string]: unknown;
            test() { throw new Error('Not implemented') }
            async checkConnection(): Promise<boolean> {
                return true;
            }
        }
        handler = new class implements IDatabaseMigrationHandler<IDB> {
            backup: IBackup<IDB> = {
                backup(): Promise<string> { return Promise.resolve('content') },
                restore(data: string): Promise<any> { return Promise.resolve('restored') }
            };
            schemaVersion: ISchemaVersion<IDB> = {
                migrationRecords: {
                    getAllExecuted: sinon.stub().resolves([]),
                    save: sinon.stub().resolves(),
                    remove(timestamp: number): Promise<void> {
                        return Promise.resolve(undefined);
                    }
                },
                isInitialized: sinon.stub().resolves(true),
                createTable: sinon.stub().resolves(),
                validateTable: sinon.stub().resolves(true)
            };
            db: IDB = db;
            getName(): string { return "Test Implementation" }
            getVersion(): string { return "1.0.0-test" }
        }
    });

    describe('Constructor', () => {
        /**
         * Test: Constructor uses default ConsoleLogger when logger not provided
         * Validates that the default logger parameter works correctly
         */
        it('should use default ConsoleLogger when logger not provided', () => {
            const runnerWithDefaultLogger = new TestMigrationScriptRunner<IDB>({ handler , config: cfg });
            expect(runnerWithDefaultLogger).to.be.instanceOf(MigrationScriptRunner);
        })

        /**
         * Test: Constructor accepts custom logger through dependencies
         * Validates that custom logger is wrapped with LevelAwareLogger
         */
        it('should use custom logger when provided', () => {
            const customLogger = new SilentLogger();
            const runnerWithCustomLogger = new TestMigrationScriptRunner<IDB>({ handler: handler, logger: customLogger
, config: cfg });
            // Logger should be wrapped with LevelAwareLogger for level filtering
            expect((runnerWithCustomLogger as any).output.logger).to.be.instanceOf(LevelAwareLogger);
        })

        /**
         * Test: Constructor accepts custom backupOrchestrator through dependencies
         * Validates that custom backupOrchestrator is used instead of default
         */
        it('should use custom backupOrchestrator when provided', () => {
            const mockBackupOrchestrator = {
                backup: sinon.stub().resolves(),
                restore: sinon.stub().resolves(),
                deleteBackup: sinon.stub()
            };
            const runnerWithCustomBackup = new TestMigrationScriptRunner<IDB>({ handler: handler, backupOrchestrator: mockBackupOrchestrator
, config: cfg });
            expect((runnerWithCustomBackup as any).core.backup).to.equal(mockBackupOrchestrator);
        })

        /**
         * Test: Constructor accepts custom schemaVersionOrchestrator through dependencies
         * Validates that custom schemaVersionOrchestrator is used instead of default
         */
        it('should use custom schemaVersionOrchestrator when provided', () => {
            const mockSchemaVersionOrchestrator = {
                init: sinon.stub().resolves(),
                save: sinon.stub().resolves(),
                getAllMigratedScripts: sinon.stub().resolves([]),
                remove: sinon.stub().resolves()
            };
            const runnerWithCustomSchema = new TestMigrationScriptRunner<IDB>({ handler: handler, schemaVersionOrchestrator: mockSchemaVersionOrchestrator
, config: cfg });
            expect((runnerWithCustomSchema as any).core.schemaVersion).to.equal(mockSchemaVersionOrchestrator);
        })

        /**
         * Test: Constructor accepts custom migrationRenderer through dependencies
         * Validates that custom migrationRenderer is used instead of default
         */
        it('should use custom migrationRenderer when provided', () => {
            cfg.showBanner = true;  // Enable banner to test renderer is called
            const mockRenderer = {
                drawFiglet: sinon.stub(),
                drawMigrated: sinon.stub(),
                drawPending: sinon.stub(),
                drawIgnored: sinon.stub(),
                drawExecuted: sinon.stub()
            };
            const runnerWithCustomRenderer = new TestMigrationScriptRunner<IDB>({ handler: handler, migrationRenderer: mockRenderer
, config: cfg });
            expect((runnerWithCustomRenderer as any).output.renderer).to.equal(mockRenderer);
            expect(mockRenderer.drawFiglet.calledOnce).to.be.true;
        })

        /**
         * Test: Constructor accepts custom migrationService through dependencies
         * Validates that custom migrationService is used instead of default
         */
        it('should use custom migrationService when provided', () => {
            const mockMigrationService = {
                findMigrationScripts: sinon.stub().resolves([]),
                findBeforeMigrateScript: sinon.stub().resolves(undefined)
            };
            const runnerWithCustomMigration = new TestMigrationScriptRunner<IDB>({ handler: handler, migrationService: mockMigrationService
, config: cfg });
            expect((runnerWithCustomMigration as any).core.migration).to.equal(mockMigrationService);
        })

        /**
         * Test: Constructor accepts custom migrationScanner through dependencies
         * Validates that custom migrationScanner is used instead of default
         */
        it('should use custom migrationScanner when provided', () => {
            const mockMigrationScanner = {
                scan: sinon.stub().resolves({
                    all: [],
                    migrated: [],
                    pending: [],
                    ignored: [],
                    executed: []
                })
            };
            const runnerWithCustomScanner = new TestMigrationScriptRunner<IDB>({ handler: handler, migrationScanner: mockMigrationScanner
, config: cfg });
            expect((runnerWithCustomScanner as any).core.scanner).to.equal(mockMigrationScanner);
        })

        /**
         * Test: Constructor accepts all custom dependencies at once
         * Validates that all custom dependencies can be injected together
         */
        it('should use all custom dependencies when provided', () => {
            const customLogger = new SilentLogger();
            const mockBackupOrchestrator = {
                backup: sinon.stub().resolves(),
                restore: sinon.stub().resolves(),
                deleteBackup: sinon.stub()
            };
            const mockSchemaVersionOrchestrator = {
                init: sinon.stub().resolves(),
                save: sinon.stub().resolves(),
                getAllMigratedScripts: sinon.stub().resolves([]),
                remove: sinon.stub().resolves()
            };
            const mockRenderer = {
                drawFiglet: sinon.stub(),
                drawMigrated: sinon.stub(),
                drawPending: sinon.stub(),
                drawIgnored: sinon.stub(),
                drawExecuted: sinon.stub()
            };
            const mockMigrationService = {
                findMigrationScripts: sinon.stub().resolves([]),
                findBeforeMigrateScript: sinon.stub().resolves(undefined)
            };

            const runnerWithAllCustom = new TestMigrationScriptRunner<IDB>({ handler: handler, logger: customLogger,
                backupOrchestrator: mockBackupOrchestrator,
                schemaVersionOrchestrator: mockSchemaVersionOrchestrator,
                migrationRenderer: mockRenderer,
                migrationService: mockMigrationService
, config: cfg });

            // Logger should be wrapped with LevelAwareLogger for level filtering
            expect((runnerWithAllCustom as any).output.logger).to.be.instanceOf(LevelAwareLogger);
            expect((runnerWithAllCustom as any).core.backup).to.equal(mockBackupOrchestrator);
            expect((runnerWithAllCustom as any).core.schemaVersion).to.equal(mockSchemaVersionOrchestrator);
            expect((runnerWithAllCustom as any).output.renderer).to.equal(mockRenderer);
            expect((runnerWithAllCustom as any).core.migration).to.equal(mockMigrationService);
        })

        /**
         * Test: Constructor auto-loads config when not provided
         * Validates that ConfigLoader.load() is called when config parameter is undefined
         */
        it('should auto-load config using ConfigLoader when config not provided', () => {
            // Call constructor without config parameter - should use ConfigLoader.load()
            const runnerWithAutoConfig = new TestMigrationScriptRunner<IDB>({ handler: handler });

            // Verify runner was created successfully
            expect(runnerWithAutoConfig).to.be.instanceOf(MigrationScriptRunner);

            // Verify config was loaded (should have default values from ConfigLoader)
            // Note: config is private, so we cast to any for testing
            expect((runnerWithAutoConfig as any).config).to.exist;
            expect((runnerWithAutoConfig as any).config).to.be.instanceOf(Config);
        })

    })

});
