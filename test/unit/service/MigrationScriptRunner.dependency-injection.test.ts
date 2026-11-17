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
    IMigrationValidationService,
    IRollbackService,
    MigrationScript,
    ILoaderRegistry,
    IMigrationScriptLoader
} from '../../../src';

describe('MigrationScriptRunner - Dependency Injection', () => {
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
        config.showBanner = false;  // Disable banner in tests

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

    describe('Constructor dependency injection', () => {
        /**
         * Test: Constructor accepts custom validationService via dependencies
         * Covers line 161 (dependencies?.validationService branch)
         * Validates that a custom validation service can be injected, enabling
         * testing and customization of validation behavior.
         */
        it('should use custom validationService when provided', () => {
            const customValidationService: IMigrationValidationService<IDB> = {
                validateAll: sinon.stub().resolves([]),
                validateOne: sinon.stub().resolves({} as any),
                validateMigratedFileIntegrity: sinon.stub().resolves([]),
                validateTransactionConfiguration: sinon.stub().returns([])
            };

            const runner = new MigrationScriptRunner<IDB>({ handler: handler, logger: new SilentLogger(),
                validationService: customValidationService
, config: config });

            expect((runner as any).core.validation).to.equal(customValidationService);
        });

        /**
         * Test: Constructor creates default validationService when not provided
         * Validates that when no custom validation service is provided,
         * a default MigrationValidationService instance is created.
         */
        it('should create default validationService when not provided', () => {
            const runner = new MigrationScriptRunner<IDB>({ handler: handler, logger: new SilentLogger()
, config: config });

            expect((runner as any).core.validation).to.exist;
            expect((runner as any).core.validation).to.have.property('validateAll');
            expect((runner as any).core.validation).to.have.property('validateMigratedFileIntegrity');
        });

        /**
         * Test: Constructor accepts custom rollbackService via dependencies
         * Covers line 169 (dependencies?.rollbackService branch)
         * Validates that a custom rollback service can be injected, enabling
         * testing and customization of rollback behavior.
         */
        it('should use custom rollbackService when provided', () => {
            const customRollbackService: IRollbackService<IDB> = {
                rollback: sinon.stub().resolves(),
                shouldCreateBackup: sinon.stub().returns(true)
            };

            const runner = new MigrationScriptRunner<IDB>({ handler: handler, logger: new SilentLogger(),
                rollbackService: customRollbackService
, config: config });

            expect((runner as any).core.rollback).to.equal(customRollbackService);
        });

        /**
         * Test: Constructor creates default rollbackService when not provided
         * Validates that when no custom rollback service is provided,
         * a default RollbackService instance is created.
         */
        it('should create default rollbackService when not provided', () => {
            const runner = new MigrationScriptRunner<IDB>({ handler: handler, logger: new SilentLogger()
, config: config });

            expect((runner as any).core.rollback).to.exist;
            expect((runner as any).core.rollback).to.have.property('rollback');
            expect((runner as any).core.rollback).to.have.property('shouldCreateBackup');
        });

        /**
         * Test: Constructor accepts custom loaderRegistry via dependencies
         * Covers line 147 (dependencies?.loaderRegistry branch)
         * Validates that a custom loader registry can be injected, enabling
         * testing and customization of migration file loading behavior.
         */
        it('should use custom loaderRegistry when provided', () => {
            const customLoader: IMigrationScriptLoader<IDB> = {
                canHandle: () => true,
                load: sinon.stub().resolves({
                    up: async () => 'custom',
                    down: async () => 'custom down'
                }),
                getName: () => 'CustomLoader'
            };

            const customRegistry: ILoaderRegistry<IDB> = {
                register: sinon.stub(),
                findLoader: sinon.stub().returns(customLoader),
                getLoaders: sinon.stub().returns([customLoader])
            };

            const runner = new MigrationScriptRunner<IDB>({ handler: handler, logger: new SilentLogger(),
                loaderRegistry: customRegistry
, config: config });

            expect((runner as any).loaderRegistry).to.equal(customRegistry);
        });

        /**
         * Test: Constructor creates default loaderRegistry when not provided
         * Covers line 147 (LoaderRegistry.createDefault fallback)
         * Validates that when no custom loader registry is provided,
         * a default LoaderRegistry with TypeScriptLoader and SqlLoader is created.
         */
        it('should create default loaderRegistry when not provided', () => {
            const runner = new MigrationScriptRunner<IDB>({ handler: handler, logger: new SilentLogger()
, config: config });

            const registry = (runner as any).loaderRegistry as ILoaderRegistry<IDB>;
            expect(registry).to.exist;
            expect(registry.getLoaders()).to.have.lengthOf(2);

            const loaderNames = registry.getLoaders().map(l => l.getName());
            expect(loaderNames).to.include('TypeScriptLoader');
            expect(loaderNames).to.include('SqlLoader');
        });

        /**
         * Test: Constructor creates default ConfigLoader when configLoader not provided
         * Covers line 197 (dependencies?.configLoader fallback)
         * Validates that when no custom config loader is provided,
         * a default ConfigLoader instance is created and used.
         */
        it('should create default ConfigLoader when configLoader not provided', () => {
            // Don't provide config or configLoader - will use default ConfigLoader
            const runner = new MigrationScriptRunner<IDB>({
                handler: handler,
                logger: new SilentLogger()
            });

            // Verify runner was created successfully with auto-loaded config
            expect(runner).to.exist;
            expect((runner as any).config).to.exist;
            expect((runner as any).config.folder).to.be.a('string');
        });

        /**
         * Test: Constructor accepts custom configLoader via dependencies
         * Covers line 197 (dependencies?.configLoader branch)
         * Validates that a custom config loader can be injected.
         */
        it('should use custom configLoader when provided', () => {
            const customConfig = new Config();
            customConfig.folder = './custom-migrations';

            const loadStub = sinon.stub().returns(customConfig);
            const customConfigLoader = {
                load: loadStub,
                applyEnvironmentVariables: sinon.stub()
            };

            const runner = new MigrationScriptRunner<IDB>({
                handler: handler,
                logger: new SilentLogger(),
                configLoader: customConfigLoader
            });

            // Verify custom configLoader was used
            expect(loadStub.called).to.be.true;
            expect((runner as any).config.folder).to.equal('./custom-migrations');
        });
    });

    describe('Transaction Manager Creation', () => {
        /**
         * Test: Returns undefined when transaction mode is NONE
         * Covers line 245 in MigrationScriptRunner.ts
         * Validates that no transaction manager is created when mode is NONE.
         */
        it('should return undefined when transaction mode is NONE', () => {
            config.transaction.mode = 'NONE' as any;

            const runner = new MigrationScriptRunner<IDB>({ handler: handler, logger: new SilentLogger()
, config: config });

            // Check that transaction manager was not created via factory
            const transactionProvider = (runner as any).execution.transactionProvider;

            expect(transactionProvider).to.be.undefined;
        });

        /**
         * Test: Uses custom transaction manager from handler
         * Covers lines 250-251 in MigrationScriptRunner.ts
         * Validates that when handler provides a custom transaction manager, it is used.
         */
        it('should use custom transaction manager from handler', () => {
            const customTxManager = {
                begin: () => Promise.resolve(),
                commit: () => Promise.resolve(),
                rollback: () => Promise.resolve()
            };

            const handlerWithTx = {
                ...handler,
                transactionProvider: customTxManager
            };

            const runner = new MigrationScriptRunner<IDB>({
                handler: handlerWithTx as any,
                logger: new SilentLogger()
            , config: config });

            // Check that custom transaction manager was used via factory
            const transactionProvider = (runner as any).execution.transactionProvider;

            expect(transactionProvider).to.equal(customTxManager);
        });

        /**
         * Test: Auto-creates DefaultTransactionProvider for ITransactionalDB
         * Covers lines 256-257 in MigrationScriptRunner.ts
         * Validates that DefaultTransactionProvider is auto-created when db implements ITransactionalDB.
         */
        it('should auto-create DefaultTransactionProvider when db implements ITransactionalDB', () => {
            const transactionalDB = {
                query: () => Promise.resolve([]),
                checkConnection: () => Promise.resolve(true),
                beginTransaction: () => Promise.resolve(),
                commit: () => Promise.resolve(),
                rollback: () => Promise.resolve()
            };

            const handlerWithTransactionalDB = {
                ...handler,
                db: transactionalDB
            };

            const runner = new MigrationScriptRunner<IDB>({
                handler: handlerWithTransactionalDB as any,
                logger: new SilentLogger()
            , config: config });

            // Check that transaction manager was auto-created via factory
            const transactionProvider = (runner as any).execution.transactionProvider;

            expect(transactionProvider).to.exist;
            expect(transactionProvider.begin).to.be.a('function');
            expect(transactionProvider.commit).to.be.a('function');
            expect(transactionProvider.rollback).to.be.a('function');
        });

        /**
         * Test: Auto-creates CallbackTransactionProvider for ICallbackTransactionalDB
         * Covers lines 284-285 in MigrationScriptRunner.ts
         * Validates that CallbackTransactionProvider is auto-created when db implements ICallbackTransactionalDB.
         */
        it('should auto-create CallbackTransactionProvider when db implements ICallbackTransactionalDB', () => {
            const callbackTransactionalDB = {
                query: () => Promise.resolve([]),
                checkConnection: () => Promise.resolve(true),
                runTransaction: async <T>(callback: (tx: unknown) => Promise<T>): Promise<T> => {
                    return callback({});
                }
            };

            const handlerWithCallbackDB = {
                ...handler,
                db: callbackTransactionalDB
            };

            config.transaction.mode = 'PER_MIGRATION' as any; // Enable transactions

            const runner = new MigrationScriptRunner<IDB>({
                handler: handlerWithCallbackDB as any,
                logger: new SilentLogger()
            , config: config });

            // Check that transaction manager was auto-created via factory
            const transactionProvider = (runner as any).execution.transactionProvider;

            expect(transactionProvider).to.exist;
            expect(transactionProvider.begin).to.be.a('function');
            expect(transactionProvider.commit).to.be.a('function');
            expect(transactionProvider.rollback).to.be.a('function');
        });
    });

    describe('Optional chaining coverage', () => {
        /**
         * Test: Covers optional chaining branch at line 657 in MigrationScriptRunner.ts
         * Uses reflection to directly test the executeDryRun private method with empty executed array.
         * This covers the `?.name` optional chaining when scripts.executed has no elements.
         */
        it('should handle empty scripts.executed array in error logging (line 657)', async () => {
            config.transaction.mode = 'PER_MIGRATION' as any;

            // Create handler with transactional DB
            const transactionalDB = {
                query: () => Promise.resolve([]),
                checkConnection: () => Promise.resolve(true),
                beginTransaction: () => Promise.resolve(),
                commit: () => Promise.resolve(),
                rollback: () => Promise.resolve()
            };

            handler.db = transactionalDB as any;

            // Capture logger messages
            let errorMessages: string[] = [];
            const capturingLogger = {
                info: (msg: string) => {},
                error: (msg: string) => errorMessages.push(msg),
                warn: (msg: string) => {},
                success: (msg: string) => {},
                debug: (msg: string) => {},
                log: (msg: string) => {}
            };

            // Enable dry run mode
            config.dryRun = true;
            const runner = new MigrationScriptRunner<IDB>({ handler: handler, logger: capturingLogger
, config: config });

            // Mock hookExecutor.executeWithHooks to throw error immediately
            (runner as any).orchestration.workflow.hookExecutor.executeWithHooks = sinon.stub().rejects(new Error('Execution failed'));

            // Create scripts object with empty executed array
            const scripts = {
                all: [],
                migrated: [],
                pending: [{
                    timestamp: 1,
                    name: 'V1__test',
                    filepath: '/fake/V1__test.ts',
                    init: async () => {},
                    script: {
                        up: async () => {},
                        down: async () => {}
                    }
                }],
                ignored: [],
                executed: [] // Empty array - this triggers the optional chaining
            };

            // Stub migrationScanner and validation
            sinon.stub((runner as any).core.scanner, 'scan').resolves(scripts);
            sinon.stub((runner as any).orchestration.workflow.validationOrchestrator, 'validateMigrations').resolves();

            // Call through public API which triggers workflow orchestrator
            try {
                await runner.up();
                expect.fail('Should have thrown error');
            } catch (error) {
                // Expected error
            }

            // Verify error message with 'unknown' was logged (covers line 657 optional chaining)
            const hasUnknownMessage = errorMessages.some(msg =>
                msg.includes('Failed at:') && msg.includes('unknown')
            );

            expect(hasUnknownMessage).to.be.true;
        });
    });

    describe('getHandler() method', () => {
        /**
         * Test: getHandler() returns the handler instance
         * Validates that the getHandler() public method returns the handler that was passed
         * to the constructor, enabling external access to handler functionality.
         */
        it('should return the handler instance', () => {
            const runner = new MigrationScriptRunner<IDB>({
                handler: handler,
                logger: new SilentLogger(),
                config: config
            });

            const retrievedHandler = runner.getHandler();

            expect(retrievedHandler).to.equal(handler);
            expect(retrievedHandler.getName()).to.equal('TestHandler');
            expect(retrievedHandler.getVersion()).to.equal('1.0.0-test');
        });

        /**
         * Test: getHandler() preserves handler type information
         * Validates that the returned handler maintains all its properties and methods,
         * enabling type-safe access to handler-specific functionality.
         */
        it('should preserve handler type information', () => {
            const runner = new MigrationScriptRunner<IDB>({
                handler: handler,
                logger: new SilentLogger(),
                config: config
            });

            const retrievedHandler = runner.getHandler();

            // Verify all handler properties are accessible
            expect(retrievedHandler).to.have.property('db');
            expect(retrievedHandler).to.have.property('schemaVersion');
            expect(retrievedHandler.getName).to.be.a('function');
            expect(retrievedHandler.getVersion).to.be.a('function');
        });

        /**
         * Test: getHandler() works with custom handler types (THandler generic)
         * Validates that when using the THandler generic parameter, getHandler() returns
         * a properly typed handler that includes custom properties and methods.
         */
        it('should work with custom handler types using THandler generic', () => {
            // Create custom handler interface with additional properties
            interface CustomHandler extends IDatabaseMigrationHandler<IDB> {
                customProperty: string;
                customMethod(): string;
            }

            const customHandler: CustomHandler = {
                ...handler,
                customProperty: 'custom-value',
                customMethod: () => 'custom-result'
            };

            // Create runner with THandler generic
            class CustomRunner extends MigrationScriptRunner<IDB, CustomHandler> {}

            const runner = new CustomRunner({
                handler: customHandler,
                logger: new SilentLogger(),
                config: config
            });

            const retrievedHandler = runner.getHandler();

            // Verify custom properties are accessible (TypeScript would catch type errors at compile time)
            expect(retrievedHandler.customProperty).to.equal('custom-value');
            expect(retrievedHandler.customMethod()).to.equal('custom-result');
            expect(retrievedHandler.getName()).to.equal('TestHandler');
        });

        /**
         * Test: getHandler() is a public method accessible externally
         * Validates that getHandler() can be called from external code (not just internally),
         * enabling CLI commands and external integrations to access the handler.
         */
        it('should be accessible as a public method', () => {
            const runner = new MigrationScriptRunner<IDB>({
                handler: handler,
                logger: new SilentLogger(),
                config: config
            });

            // Verify method exists and is callable
            expect(runner.getHandler).to.be.a('function');
            expect(runner.getHandler()).to.exist;
        });
    });

    describe('Banner display control', () => {
        /**
         * Test: Banner is displayed by default (showBanner: true)
         * Validates that drawFiglet is called when showBanner is true (default behavior).
         */
        it('should display banner when showBanner is true (default)', () => {
            config.showBanner = true;

            const drawFigletSpy = sinon.spy();
            const rendererStub = {
                drawFiglet: drawFigletSpy,
                render: sinon.stub(),
                renderOne: sinon.stub(),
                renderDryRunTable: sinon.stub()
            };

            const runner = new MigrationScriptRunner<IDB>({ handler: handler, logger: new SilentLogger(),
                migrationRenderer: rendererStub as any
, config: config });

            // Verify drawFiglet was called
            expect(drawFigletSpy.calledOnce).to.be.true;
        });

        /**
         * Test: Banner is not displayed when showBanner is false
         * Validates that drawFiglet is NOT called when showBanner is false.
         */
        it('should not display banner when showBanner is false', () => {
            config.showBanner = false;

            const drawFigletSpy = sinon.spy();
            const rendererStub = {
                drawFiglet: drawFigletSpy,
                render: sinon.stub(),
                renderOne: sinon.stub(),
                renderDryRunTable: sinon.stub()
            };

            const runner = new MigrationScriptRunner<IDB>({ handler: handler, logger: new SilentLogger(),
                migrationRenderer: rendererStub as any
, config: config });

            // Verify drawFiglet was NOT called
            expect(drawFigletSpy.called).to.be.false;
        });
    });

    describe('createInstance factory method (v0.8.2)', () => {
        /**
         * Test: createInstance creates runner with async handler initialization
         * Validates that adapters can use the factory method to create instances
         * with asynchronous handler creation.
         */
        it('should create runner instance with async handler initialization', async () => {
            // Simulate async handler creation
            const createHandlerSpy = sinon.stub().resolves(handler);

            // Create a test subclass
            class TestRunner extends MigrationScriptRunner<IDB> {
                private constructor(deps: any) {
                    super(deps);
                }

                static async getInstance(options: any): Promise<TestRunner> {
                    return (MigrationScriptRunner as any).createInstance(
                        TestRunner,
                        options,
                        createHandlerSpy
                    );
                }
            }

            // Create instance
            const runner = await TestRunner.getInstance({ config });

            // Verify handler creation was called
            expect(createHandlerSpy.calledOnce).to.be.true;
            expect(createHandlerSpy.firstCall.args[0]).to.equal(config);

            // Verify runner was created
            expect(runner).to.be.instanceOf(TestRunner);
            expect(runner).to.be.instanceOf(MigrationScriptRunner);
        });

        /**
         * Test: createInstance preserves handler type through THandler generic
         * Validates that the created runner has correctly typed handler.
         */
        it('should preserve handler type through THandler generic', async () => {
            // Custom handler interface
            interface ICustomHandler extends IDatabaseMigrationHandler<IDB> {
                customMethod(): string;
            }

            const customHandler: ICustomHandler = {
                ...handler,
                customMethod: () => 'custom'
            };

            class TestRunner extends MigrationScriptRunner<IDB, ICustomHandler> {
                private constructor(deps: any) {
                    super(deps);
                }

                static async getInstance(options: any): Promise<TestRunner> {
                    return (MigrationScriptRunner as any).createInstance(
                        TestRunner,
                        options,
                        async () => customHandler
                    );
                }

                getCustomValue(): string {
                    return this.handler.customMethod();
                }
            }

            const runner = await TestRunner.getInstance({ config });

            // Verify handler method is accessible
            expect(runner.getCustomValue()).to.equal('custom');
        });

        /**
         * Test: createInstance propagates all options to runner
         * Validates that logger, hooks, and other services are passed through.
         */
        it('should propagate all options to runner', async () => {
            const customLogger = new SilentLogger();
            const customHooks = {
                onBeforeMigrate: sinon.stub()
            };

            class TestRunner extends MigrationScriptRunner<IDB> {
                private constructor(deps: any) {
                    super(deps);
                }

                static async getInstance(options: any): Promise<TestRunner> {
                    return (MigrationScriptRunner as any).createInstance(
                        TestRunner,
                        options,
                        async () => handler
                    );
                }
            }

            const runner = await TestRunner.getInstance({
                config,
                logger: customLogger,
                hooks: customHooks
            });

            // Verify options were passed through
            // Logger is wrapped in LevelAwareLogger, check the underlying logger
            expect((runner as any).output.logger.logger).to.equal(customLogger);
            // Hooks are wrapped in CompositeHooks, check it contains our hooks
            expect((runner as any).hooks.hooks).to.deep.include(customHooks);
        });

        /**
         * Test: createInstance handles handler creation errors
         * Validates that errors from async handler creation propagate correctly.
         */
        it('should propagate errors from handler creation', async () => {
            const createHandlerStub = sinon.stub().rejects(new Error('Connection failed'));

            class TestRunner extends MigrationScriptRunner<IDB> {
                private constructor(deps: any) {
                    super(deps);
                }

                static async getInstance(options: any): Promise<TestRunner> {
                    return (MigrationScriptRunner as any).createInstance(
                        TestRunner,
                        options,
                        createHandlerStub
                    );
                }
            }

            // Verify error is propagated
            await expect(TestRunner.getInstance({ config }))
                .to.be.rejectedWith('Connection failed');
        });

        /**
         * Test: createInstance works with custom config type (TConfig generic)
         * Validates that custom config types are properly typed through generics.
         */
        it('should work with custom config type (TConfig generic)', async () => {
            // Custom config class
            class AppConfig extends Config {
                databaseUrl?: string;
            }

            const appConfig = new AppConfig();
            appConfig.databaseUrl = 'https://mydb.example.com';

            const createHandlerSpy = sinon.stub().resolves(handler);

            class TestRunner extends MigrationScriptRunner<IDB, IDatabaseMigrationHandler<IDB>, AppConfig> {
                private constructor(deps: any) {
                    super(deps);
                }

                static async getInstance(options: any): Promise<TestRunner> {
                    return (MigrationScriptRunner as any).createInstance(
                        TestRunner,
                        options,
                        createHandlerSpy
                    );
                }

                getDatabaseUrl(): string | undefined {
                    return this.config.databaseUrl;
                }
            }

            const runner = await TestRunner.getInstance({ config: appConfig });

            // Verify config is passed to handler creation
            expect(createHandlerSpy.calledOnce).to.be.true;
            expect(createHandlerSpy.firstCall.args[0]).to.equal(appConfig);

            // Verify custom config property is accessible
            expect(runner.getDatabaseUrl()).to.equal('https://mydb.example.com');
        });

        /**
         * Test: createInstance supports adapter-specific options (TOptions extends IRunnerOptions)
         * Validates that adapters can define custom options interfaces.
         */
        it('should support adapter-specific options extending IRunnerOptions', async () => {
            // Adapter-specific options
            interface IFirebaseRunnerOptions {
                config?: Config;
                logger?: any;
                customFirebaseOption?: string;
            }

            const firebaseOptions: IFirebaseRunnerOptions = {
                config,
                customFirebaseOption: 'firebase-specific-value'
            };

            class FirebaseRunner extends MigrationScriptRunner<IDB> {
                private constructor(deps: any) {
                    super(deps);
                }

                static async getInstance(options: IFirebaseRunnerOptions): Promise<FirebaseRunner> {
                    return (MigrationScriptRunner as any).createInstance(
                        FirebaseRunner,
                        options,
                        async () => handler
                    );
                }
            }

            const runner = await FirebaseRunner.getInstance(firebaseOptions);

            // Verify instance was created
            expect(runner).to.be.instanceOf(FirebaseRunner);
            expect(runner).to.be.instanceOf(MigrationScriptRunner);
        });
    });

    describe('Runtime validation (v0.8.2)', () => {
        /**
         * Test: Constructor throws helpful error when handler is missing
         * Validates that developers get clear guidance when they make common mistakes.
         */
        it('should throw helpful error when handler is missing', () => {
            expect(() => {
                // @ts-expect-error - Intentionally missing handler for test
                new MigrationScriptRunner<IDB>({ config });
            }).to.throw(TypeError, /Handler is required in IRunnerDependencies/);
        });

        /**
         * Test: Error message includes solution for async initialization
         */
        it('should include async factory pattern in error message', () => {
            try {
                // @ts-expect-error - Intentionally missing handler for test
                new MigrationScriptRunner<IDB>({ config });
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error).to.be.instanceOf(TypeError);
                expect((error as Error).message).to.include('static async getInstance');
                expect((error as Error).message).to.include('MyHandler.connect');
            }
        });

        /**
         * Test: Error message includes solution for sync initialization
         */
        it('should include sync pattern in error message', () => {
            try {
                // @ts-expect-error - Intentionally missing handler for test
                new MigrationScriptRunner<IDB>({ config });
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error).to.be.instanceOf(TypeError);
                expect((error as Error).message).to.include('constructor(options: IRunnerOptions');
                expect((error as Error).message).to.include('super({ handler, ...options })');
            }
        });

        /**
         * Test: Error message includes link to documentation
         */
        it('should include documentation link in error message', () => {
            try {
                // @ts-expect-error - Intentionally missing handler for test
                new MigrationScriptRunner<IDB>({ config });
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error).to.be.instanceOf(TypeError);
                expect((error as Error).message).to.include('https://github.com/migration-script-runner/msr-core');
                expect((error as Error).message).to.include('cli-adapter-development.md');
            }
        });

        /**
         * Test: Constructor succeeds when handler is provided
         * Validates that normal operation is not affected by validation.
         */
        it('should not throw when handler is provided', () => {
            expect(() => {
                new MigrationScriptRunner<IDB>({ handler, config, logger: new SilentLogger() });
            }).to.not.throw();
        });
    });
});
