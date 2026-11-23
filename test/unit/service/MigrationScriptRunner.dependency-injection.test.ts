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
    IMigrationValidationService,
    IRollbackService,
    MigrationScript,
    ILoaderRegistry,
    IMigrationScriptLoader,
    IRunnerDependencies,
    IRunnerOptions,
    IConfigLoader,
    TransactionMode
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

            const runner = new TestMigrationScriptRunner<IDB>({ handler: handler, logger: new SilentLogger(),
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
            const runner = new TestMigrationScriptRunner<IDB>({ handler: handler, logger: new SilentLogger()
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

            const runner = new TestMigrationScriptRunner<IDB>({ handler: handler, logger: new SilentLogger(),
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
            const runner = new TestMigrationScriptRunner<IDB>({ handler: handler, logger: new SilentLogger()
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

            const runner = new TestMigrationScriptRunner<IDB>({ handler: handler, logger: new SilentLogger(),
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
            const runner = new TestMigrationScriptRunner<IDB>({ handler: handler, logger: new SilentLogger()
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
            const runner = new TestMigrationScriptRunner<IDB>({
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

            const runner = new TestMigrationScriptRunner<IDB>({
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

            const runner = new TestMigrationScriptRunner<IDB>({ handler: handler, logger: new SilentLogger()
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

            const runner = new TestMigrationScriptRunner<IDB>({
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

            const runner = new TestMigrationScriptRunner<IDB>({
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

            const runner = new TestMigrationScriptRunner<IDB>({
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
            const runner = new TestMigrationScriptRunner<IDB>({ handler: handler, logger: capturingLogger
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
            const runner = new TestMigrationScriptRunner<IDB>({
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
            const runner = new TestMigrationScriptRunner<IDB>({
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
            const runner = new TestMigrationScriptRunner<IDB>({
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

            const runner = new TestMigrationScriptRunner<IDB>({ handler: handler, logger: new SilentLogger(),
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

            const runner = new TestMigrationScriptRunner<IDB>({ handler: handler, logger: new SilentLogger(),
                migrationRenderer: rendererStub as any
, config: config });

            // Verify drawFiglet was NOT called
            expect(drawFigletSpy.called).to.be.false;
        });
    });

    describe('async adapter factory (v1.0.0)', () => {
        class AppConfig extends Config {
            databaseUrl = 'adapter-default';

            constructor() {
                super();
                this.showBanner = false;
                this.transaction.mode = TransactionMode.NONE;
            }
        }

        interface ICustomHandler extends IDatabaseMigrationHandler<IDB> {
            customMethod(): string;
        }

        const createCustomHandler = (): ICustomHandler => ({
            ...handler,
            customMethod: () => 'custom'
        });

        it('resolves typed configuration before handler creation and shares it with the runner', async () => {
            const phases: string[] = [];
            const customHandler = createCustomHandler();
            let resolvedConfig: AppConfig | undefined;
            const loader: IConfigLoader<AppConfig> = {
                load: (_overrides, _loaderOptions, defaults) => {
                    expect(defaults).to.be.instanceOf(AppConfig);
                    const loadedConfig = defaults ?? new AppConfig();
                    loadedConfig.databaseUrl = 'https://firebase.example.com';
                    phases.push('config');
                    return loadedConfig;
                },
                applyEnvironmentVariables: () => undefined
            };

            class FirebaseRunner extends MigrationScriptRunner<IDB, ICustomHandler, AppConfig> {
                private constructor(dependencies: IRunnerDependencies<IDB, ICustomHandler, AppConfig>) {
                    super(dependencies);
                }

                static override getInstance(options: IRunnerOptions<IDB, AppConfig>): Promise<FirebaseRunner> {
                    return this.createInstance(
                        options,
                        () => new AppConfig(),
                        async (resolved) => {
                            phases.push('handler');
                            resolvedConfig = resolved;
                            return customHandler;
                        },
                        (dependencies) => {
                            phases.push('runner');
                            expect(dependencies.config).to.equal(resolvedConfig);
                            expect(dependencies.handler).to.equal(customHandler);
                            return new FirebaseRunner(dependencies);
                        }
                    );
                }

                getDatabaseUrl(): string {
                    return this.config.databaseUrl;
                }

                getCustomValue(): string {
                    return this.handler.customMethod();
                }
            }

            const runner = await FirebaseRunner.getInstance({ configLoader: loader });

            expect(phases).to.deep.equal(['config', 'handler', 'runner']);
            expect(resolvedConfig).to.be.instanceOf(AppConfig);
            expect(runner.getDatabaseUrl()).to.equal('https://firebase.example.com');
            expect(runner.getCustomValue()).to.equal('custom');
        });

        it('uses explicit config without invoking loader or adapter defaults', async () => {
            const customHandler = createCustomHandler();
            const explicitConfig = new AppConfig();
            explicitConfig.databaseUrl = 'https://explicit.example.com';
            let defaultsCreated = 0;
            let loaderCalls = 0;
            let handlerConfig: AppConfig | undefined;

            const loader: IConfigLoader<AppConfig> = {
                load: () => {
                    loaderCalls += 1;
                    throw new Error('Explicit config should bypass loading');
                },
                applyEnvironmentVariables: () => undefined
            };

            class FirebaseRunner extends MigrationScriptRunner<IDB, ICustomHandler, AppConfig> {
                private constructor(dependencies: IRunnerDependencies<IDB, ICustomHandler, AppConfig>) {
                    super(dependencies);
                }

                static override getInstance(options: IRunnerOptions<IDB, AppConfig>): Promise<FirebaseRunner> {
                    return this.createInstance(
                        options,
                        () => {
                            defaultsCreated += 1;
                            return new AppConfig();
                        },
                        async (resolved) => {
                            handlerConfig = resolved;
                            return customHandler;
                        },
                        (dependencies) => new FirebaseRunner(dependencies)
                    );
                }

                getDatabaseUrl(): string {
                    return this.config.databaseUrl;
                }
            }

            const runner = await FirebaseRunner.getInstance({ config: explicitConfig, configLoader: loader });

            expect(loaderCalls).to.equal(0);
            expect(defaultsCreated).to.equal(0);
            expect(handlerConfig).to.equal(explicitConfig);
            expect(runner.getDatabaseUrl()).to.equal('https://explicit.example.com');
        });

        it('uses typed adapter defaults with the default Core loader', async () => {
            const customHandler = createCustomHandler();
            class FirebaseRunner extends MigrationScriptRunner<IDB, ICustomHandler, AppConfig> {
                private constructor(dependencies: IRunnerDependencies<IDB, ICustomHandler, AppConfig>) {
                    super(dependencies);
                }

                static override getInstance(options: IRunnerOptions<IDB, AppConfig>): Promise<FirebaseRunner> {
                    return this.createInstance(
                        options,
                        () => new AppConfig(),
                        async () => customHandler,
                        (dependencies) => new FirebaseRunner(dependencies)
                    );
                }

                getConfig(): AppConfig {
                    return this.config;
                }
            }

            const runner = await FirebaseRunner.getInstance({});

            expect(runner.getConfig()).to.be.instanceOf(AppConfig);
            expect(runner.getConfig().databaseUrl).to.equal('adapter-default');
            expect(runner.getConfig().transaction.mode).to.equal(TransactionMode.NONE);
        });

        it('propagates errors from config loaders and handler factories', async () => {
            const customHandler = createCustomHandler();
            const loadError = new Error('Config loader failed');
            const loader: IConfigLoader<AppConfig> = {
                load: () => { throw loadError; },
                applyEnvironmentVariables: () => undefined
            };

            class ConfigFailingRunner extends MigrationScriptRunner<IDB, ICustomHandler, AppConfig> {
                private constructor(dependencies: IRunnerDependencies<IDB, ICustomHandler, AppConfig>) {
                    super(dependencies);
                }

                static override getInstance(options: IRunnerOptions<IDB, AppConfig>): Promise<ConfigFailingRunner> {
                    return this.createInstance(
                        options,
                        () => new AppConfig(),
                        async () => customHandler,
                        (dependencies) => new ConfigFailingRunner(dependencies)
                    );
                }
            }

            await expect(ConfigFailingRunner.getInstance({ configLoader: loader }))
                .to.be.rejectedWith('Config loader failed');

            class HandlerFailingRunner extends MigrationScriptRunner<IDB, ICustomHandler, AppConfig> {
                private constructor(dependencies: IRunnerDependencies<IDB, ICustomHandler, AppConfig>) {
                    super(dependencies);
                }

                static override getInstance(options: IRunnerOptions<IDB, AppConfig>): Promise<HandlerFailingRunner> {
                    return this.createInstance(
                        options,
                        () => new AppConfig(),
                        async (): Promise<ICustomHandler> => { throw new Error('Connection failed'); },
                        (dependencies) => new HandlerFailingRunner(dependencies)
                    );
                }
            }

            await expect(HandlerFailingRunner.getInstance({ config: new AppConfig() }))
                .to.be.rejectedWith('Connection failed');
        });

        it('rejects when an adapter inherits the base getInstance fallback', async () => {
            class AdapterWithoutFactory extends MigrationScriptRunner<IDB> {}

            await expect(AdapterWithoutFactory.getInstance({}))
                .to.be.rejectedWith(Error, 'must override static getInstance()');
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
                new TestMigrationScriptRunner<IDB>({ config });
            }).to.throw(TypeError, /Handler is required in IRunnerDependencies/);
        });

        /**
         * Test: Error message includes solution for async initialization
         */
        it('should include async factory pattern in error message', () => {
            try {
                // @ts-expect-error - Intentionally missing handler for test
                new TestMigrationScriptRunner<IDB>({ config });
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error).to.be.instanceOf(TypeError);
                expect((error as Error).message).to.include('static override getInstance');
                expect((error as Error).message).to.include('MyHandler.connect');
            }
        });

        /**
         * Test: Error message includes solution for sync initialization
         */
        it('should include sync pattern in error message', () => {
            try {
                // @ts-expect-error - Intentionally missing handler for test
                new TestMigrationScriptRunner<IDB>({ config });
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
                new TestMigrationScriptRunner<IDB>({ config });
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
                new TestMigrationScriptRunner<IDB>({ handler, config, logger: new SilentLogger() });
            }).to.not.throw();
        });
    });
});
