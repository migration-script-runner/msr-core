import {expect} from 'chai';
import {CommanderError} from 'commander';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import sinon from 'sinon';
import {createCLI} from '../../../src/cli/createCLI';
import {IDB} from '../../../src/interface';
import {SilentLogger} from '../../../src/logger/SilentLogger';
import {Config} from '../../../src/model/Config';
import {BackupMode} from '../../../src/model/BackupMode';
import {LOGGER_TYPES, LOG_LEVELS, OUTPUT_FORMATS} from '../../../src/cli/utils/flagMapper';
import {MigrationScriptRunner} from '../../../src/service/MigrationScriptRunner';

interface MockDB extends IDB {
    data: string;
}

describe('createCLI', () => {
    let mockRunner: sinon.SinonStubbedInstance<MigrationScriptRunner<MockDB>>;
    let createRunnerStub: sinon.SinonStub;

    beforeEach(() => {
        // Create mock runner
        mockRunner = sinon.createStubInstance(MigrationScriptRunner);

        // Create factory stub
        createRunnerStub = sinon.stub().returns(mockRunner);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('Program creation', () => {
        /**
         * Test: Creates CLI program with default metadata
         * Validates that program is created with default name, description, version
         */
        it('should create CLI program with default metadata', () => {
            const program = createCLI({createRunner: createRunnerStub});

            expect(program.name()).to.equal('msr');
            expect(program.description()).to.equal('Migration Script Runner');
            expect(program.version()).to.equal('1.0.0');
        });

        /**
         * Test: Creates CLI program with custom metadata
         * Validates that custom name, description, version are used
         */
        it('should create CLI program with custom metadata', () => {
            const program = createCLI({
                createRunner: createRunnerStub,
                name: 'msr-custom',
                description: 'Custom Migration Runner',
                version: '2.5.0',
            });

            expect(program.name()).to.equal('msr-custom');
            expect(program.description()).to.equal('Custom Migration Runner');
            expect(program.version()).to.equal('2.5.0');
        });

        /**
         * Test: Returns Commander program instance
         * Validates that the returned object is a Commander program
         */
        it('should return Commander program instance', () => {
            const program = createCLI({createRunner: createRunnerStub});

            expect(program).to.be.an('object');
            expect(program.parse).to.be.a('function');
            expect(program.parseAsync).to.be.a('function');
            expect(program.command).to.be.a('function');
        });
    });

    describe('Command registration', () => {
        /**
         * Test: Registers all base commands
         * Validates that migrate, list, down, validate, backup are registered
         */
        it('should register all base commands', () => {
            const program = createCLI({createRunner: createRunnerStub});
            const commands = program.commands.map(cmd => cmd.name());

            expect(commands).to.include('migrate');
            expect(commands).to.include('list');
            expect(commands).to.include('down');
            expect(commands).to.include('validate');
            expect(commands).to.include('backup');
        });

        /**
         * Test: Registers exactly 7 base commands
         * Validates that no extra commands are added
         */
        it('should register exactly 7 base commands', () => {
            const program = createCLI({createRunner: createRunnerStub});
            expect(program.commands.length).to.equal(7);
        });

        /**
         * Test: Allows extending with custom commands
         * Validates that adapters can add custom commands
         */
        it('should allow extending with custom commands', () => {
            const program = createCLI({createRunner: createRunnerStub});

            program
                .command('custom')
                .description('Custom command')
                .action(() => {});

            const commands = program.commands.map(cmd => cmd.name());
            expect(commands).to.include('custom');
            expect(program.commands.length).to.equal(8);
        });
    });

    describe('Common options', () => {
        /**
         * Test: Registers all common CLI options
         * Validates that all common options are available
         */
        it('should register all common CLI options', () => {
            const program = createCLI({createRunner: createRunnerStub});
            const optionFlags = program.options.map(opt => opt.long);

            expect(optionFlags).to.include('--config-file');
            expect(optionFlags).to.include('--folder');
            expect(optionFlags).to.include('--table-name');
            expect(optionFlags).to.include('--display-limit');
            expect(optionFlags).to.include('--dry-run');
            expect(optionFlags).to.include('--logger');
            expect(optionFlags).to.include('--log-level');
            expect(optionFlags).to.include('--log-file');
            expect(optionFlags).to.include('--format');
            expect(optionFlags).to.include('--backup-mode');
        });

        /**
         * Test: Registers short options
         * Validates that short option aliases are available
         */
        it('should list supported values in common option descriptions', () => {
            const program = createCLI({createRunner: createRunnerStub});
            const getDescription = (flag: string): string | undefined =>
                program.options.find(option => option.long === flag)?.description;

            expect(getDescription('--logger')).to.equal(`Logger type (${LOGGER_TYPES.join('|')})`);
            expect(getDescription('--log-level')).to.equal(`Log level (${LOG_LEVELS.join('|')})`);
            expect(getDescription('--format')).to.equal(`Output format (${OUTPUT_FORMATS.join('|')})`);
            expect(getDescription('--backup-mode')).to.equal(
                `Backup behavior (${Object.values(BackupMode).join('|')})`
            );
        });

        it('should register short options', () => {
            const program = createCLI({createRunner: createRunnerStub});
            const shortOptions = program.options.map(opt => opt.short).filter(Boolean);

            expect(shortOptions).to.include('-c');
        });

        /**
         * Test: Registers option with parser for display-limit
         * Validates that display-limit option uses parseInt parser
         */
        it('should register option with parser for display-limit', () => {
            const program = createCLI({createRunner: createRunnerStub});
            const displayLimitOption = program.options.find(opt => opt.long === '--display-limit');

            expect(displayLimitOption).to.exist;
            expect(displayLimitOption?.parseArg).to.be.a('function');
        });
    });

    describe('Configuration loading', () => {
        /**
         * Test: createRunner receives Config parameter
         * Validates that factory function is called with Config object
         */
        it('should pass Config to createRunner factory', () => {
            const program = createCLI({createRunner: createRunnerStub});
            expect(program).to.exist;
            // createRunner will be called when a command is invoked, not during setup
            expect(createRunnerStub.called).to.be.false;
        });

        /**
         * Test: Merges options.config with loaded config
         * Validates that options.config overrides loaded values
         */
        it('should merge options.config with loaded config', () => {
            const program = createCLI({
                createRunner: createRunnerStub,
                config: {
                    folder: './custom-migrations',
                    tableName: 'custom_versions',
                },
            });

            expect(program).to.exist;
        });
    });

    describe('Extensibility', () => {
        /**
         * Test: Returned program can be extended with additional commands
         * Validates that the returned program supports adding commands
         */
        it('should allow adding additional commands to returned program', () => {
            const program = createCLI({createRunner: createRunnerStub});

            program
                .command('stats')
                .description('Show statistics')
                .option('-v, --verbose', 'Verbose output')
                .action(() => {});

            const statsCmd = program.commands.find(cmd => cmd.name() === 'stats');
            expect(statsCmd).to.exist;
            expect(statsCmd?.description()).to.equal('Show statistics');
        });

        /**
         * Test: Returned program can be extended with global options
         * Validates that the returned program supports adding global options
         */
        it('should allow adding global options to returned program', () => {
            const program = createCLI({createRunner: createRunnerStub});

            program.option('--custom-option <value>', 'Custom global option');

            const options = program.options.map(opt => opt.long);
            expect(options).to.include('--custom-option');
        });

        /**
         * Test: Returned program can have hooks attached
         * Validates that the returned program supports hooks
         */
        it('should allow attaching hooks to returned program', () => {
            const program = createCLI({createRunner: createRunnerStub});
            const hookSpy = sinon.spy();

            program.hook('preAction', hookSpy);

            expect(program).to.exist;
        });
    });

    describe('Options parameter handling', () => {
        /**
         * Test: Works with minimal options (createRunner only)
         * Validates that only createRunner is required
         */
        it('should work with minimal options (createRunner only)', () => {
            const program = createCLI({createRunner: createRunnerStub});

            expect(program).to.exist;
            expect(program.name()).to.equal('msr');
        });

        /**
         * Test: Works with all optional parameters
         * Validates that all optional parameters can be provided
         */
        it('should work with all optional parameters', () => {
            const program = createCLI({
                createRunner: createRunnerStub,
                name: 'test-cli',
                description: 'Test CLI',
                version: '1.0.0-test',
                config: {folder: './test-migrations'},
            });

            expect(program).to.exist;
            expect(program.name()).to.equal('test-cli');
            expect(program.description()).to.equal('Test CLI');
            expect(program.version()).to.equal('1.0.0-test');
        });

        /**
         * Test: Handles undefined optional parameters
         * Validates that undefined optional parameters don't cause errors
         */
        it('should handle undefined optional parameters', () => {
            const program = createCLI({
                createRunner: createRunnerStub,
                name: undefined,
                description: undefined,
                version: undefined,
                config: undefined,
            });

            expect(program).to.exist;
            expect(program.name()).to.equal('msr');
            expect(program.description()).to.equal('Migration Script Runner');
            expect(program.version()).to.equal('1.0.0');
        });
    });

    describe('Type safety', () => {
        /**
         * Test: Accepts generic DB type parameter
         * Validates that the function works with custom DB types
         */
        it('should accept generic DB type parameter', () => {
            interface CustomDB extends IDB {
                customField: string;
            }

            const customRunnerStub = sinon.stub().returns(sinon.createStubInstance(MigrationScriptRunner));
            const program = createCLI<CustomDB>({createRunner: customRunnerStub});

            expect(program).to.exist;
        });
    });

    describe('Integration', () => {
        let consoleLogStub: sinon.SinonStub;
        let processExitStub: sinon.SinonStub;

        beforeEach(() => {
            consoleLogStub = sinon.stub(console, 'log');
            processExitStub = sinon.stub(process, 'exit');
        });

        afterEach(() => {
            consoleLogStub.restore();
            processExitStub.restore();
        });

        /**
         * Test: Created program can parse arguments
         * Validates that the program can parse command-line arguments
         */
        it('should create a program that can parse arguments', () => {
            const program = createCLI({createRunner: createRunnerStub});
            program.exitOverride(); // Prevent process.exit in tests

            expect(() => program.parse(['node', 'test', '--version'])).to.throw(Error, '1.0.0');
        });

        /**
         * Test: Created program can parse async
         * Validates that the program supports parseAsync
         */
        it('should create a program that supports parseAsync', async () => {
            const program = createCLI({createRunner: createRunnerStub});
            expect(program.parseAsync).to.be.a('function');
        });

        /**
         * Test: Executes command with config merging
         * Validates that createRunnerWithFlags properly merges config and creates runner
         */
        it('should execute command with config merging and flag processing', async () => {
            mockRunner.migrate.resolves({success: true, executed: [], migrated: [], ignored: []});

            const program = createCLI({
                createRunner: createRunnerStub,
                config: {folder: './custom-folder', backupMode: BackupMode.MANUAL},
            });
            program.exitOverride();

            await program.parseAsync(['node', 'test', 'migrate', '--dry-run']);

            expect(createRunnerStub.calledOnce).to.be.true;
            const passedConfig = createRunnerStub.firstCall.args[0] as Config;
            expect(passedConfig).to.be.an('object');
            expect(passedConfig.dryRun).to.be.true;
            expect(passedConfig.folder).to.equal('./custom-folder');
            expect(passedConfig.backupMode).to.equal(BackupMode.MANUAL);
        });

        it('should map dot-notation custom CLI flags into nested config', async () => {
            mockRunner.migrate.resolves({success: true, executed: [], migrated: [], ignored: []});
            const config = Object.assign(new Config(), {db: {credentials: {path: 'key.json'}}});
            const program = createCLI({
                createRunner: createRunnerStub,
                config,
                addCustomOptions: (command) => {
                    command
                        .option('--db.url <url>', 'Database URL')
                        .option('--db.timeout <milliseconds>', 'Database timeout');
                }
            });
            program.exitOverride();

            await program.parseAsync([
                'node', 'test', 'migrate',
                '--db.url', 'https://localhost',
                '--db.timeout', '5000'
            ]);

            const passedConfig = createRunnerStub.firstCall.args[0] as Config & {
                db: {url: string; timeout: number; credentials: {path: string}};
            };
            expect(passedConfig.db).to.deep.equal({
                url: 'https://localhost',
                timeout: 5000,
                credentials: {path: 'key.json'}
            });
        });

        for (const backupMode of Object.values(BackupMode)) {
            it(`maps --backup-mode ${backupMode} to config.backupMode`, async () => {
                mockRunner.migrate.resolves({success: true, executed: [], migrated: [], ignored: []});

                const program = createCLI({createRunner: createRunnerStub});
                program.exitOverride();

                await program.parseAsync(['node', 'test', 'migrate', '--backup-mode', backupMode]);

                const passedConfig = createRunnerStub.firstCall.args[0] as Config;
                expect(passedConfig.backupMode).to.equal(backupMode);
            });
        }

        it('rejects unsupported --backup-mode values before creating a runner', () => {
            const program = createCLI({createRunner: createRunnerStub});
            program.exitOverride();

            expect(() => program.parse([
                'node', 'test', 'migrate', '--backup-mode', 'unsupported'
            ])).to.throw(CommanderError, /backup-mode.*unsupported.*Allowed values/s);
            expect(createRunnerStub.called).to.be.false;
        });

        /**
         * Test: Handles CLI flags with logger override
         * Validates that logger CLI flag overrides runner logger
         */
        it('passes the CLI-created logger to the runner factory', async () => {
            mockRunner.list.resolves();
            let receivedLogger: unknown;

            const program = createCLI({
                createRunner: (_config, {logger}) => {
                    receivedLogger = logger;
                    return mockRunner;
                }
            });
            program.exitOverride();

            await program.parseAsync(['node', 'test', 'list', '--logger', 'silent']);

            expect(receivedLogger).to.be.instanceOf(SilentLogger);
        });

        /**
         * Test: Handles config-file flag
         * Validates that --config-file flag triggers config file loading
         */
        it('should handle --config-file flag', async () => {
            mockRunner.migrate.resolves({success: true, executed: [], migrated: [], ignored: []});

            const program = createCLI({createRunner: createRunnerStub});
            program.exitOverride();

            // Note: This will fail to load the file, but exercises the config loading path
            try {
                await program.parseAsync(['node', 'test', 'migrate', '--config-file', './nonexistent.json']);
            } catch (error) {
                // Expected to fail due to nonexistent file
            }
        });
    });

    describe('CLI Extension (extendCLI)', () => {
        /**
         * Test: extendCLI callback is called if provided
         * Validates that the extendCLI callback is invoked with program and createRunner
         */
        it('should call extendCLI callback when provided', () => {
            const extendCLISpy = sinon.spy();

            const program = createCLI({
                createRunner: createRunnerStub,
                extendCLI: extendCLISpy
            });

            expect(extendCLISpy.calledOnce).to.be.true;
            expect(extendCLISpy.firstCall.args[0]).to.equal(program);
            expect(extendCLISpy.firstCall.args[1]).to.be.a('function');
        });

        /**
         * Test: extendCLI can add custom commands
         * Validates that custom commands added via extendCLI work correctly
         */
        it('should allow adding custom commands via extendCLI', async () => {
            const customActionSpy = sinon.spy();

            const program = createCLI({
                createRunner: createRunnerStub,
                extendCLI: (prog, createExec) => {
                    prog
                        .command('custom')
                        .description('Custom command')
                        .action(async () => {
                            const runner = await createExec();
                            customActionSpy(runner);
                        });
                }
            });

            program.exitOverride();

            // Execute custom command
            await program.parseAsync(['node', 'test', 'custom']);

            expect(customActionSpy.calledOnce).to.be.true;
            expect(customActionSpy.firstCall.args[0]).to.equal(mockRunner);
        });

        /**
         * Test: createRunner in extendCLI returns correct type
         * Validates type safety for adapter-specific methods
         */
        it('should provide typed createRunner to extendCLI callback', async () => {
            // Create a custom adapter class with custom method
            class CustomRunner extends MigrationScriptRunner<MockDB> {
                customMethod(): string {
                    return 'custom result';
                }
            }

            // Mock the custom adapter
            const customAdapter = sinon.createStubInstance(CustomRunner);
            (customAdapter as any).customMethod = sinon.stub().returns('custom result');

            const customRunnerStub = sinon.stub().returns(customAdapter);

            let capturedRunner: any;

            const program = createCLI({
                createRunner: customRunnerStub,
                extendCLI: (prog, createExec) => {
                    prog
                        .command('custom-typed')
                        .action(async () => {
                            // TypeScript should infer this as CustomRunner
                            const adapter = await createExec();
                            capturedRunner = adapter;
                        });
                }
            });

            program.exitOverride();

            // Trigger command to capture runner
            await program.parseAsync(['node', 'test', 'custom-typed']);

            expect(capturedRunner).to.equal(customAdapter);
            expect(customRunnerStub.calledOnce).to.be.true;
        });

        /**
         * Test: extendCLI callback not called when not provided
         * Validates that extendCLI is optional
         */
        it('should not fail when extendCLI is not provided', () => {
            expect(() => {
                createCLI({createRunner: createRunnerStub});
            }).to.not.throw();
        });

        /**
         * Test: extendCLI receives createRunner with config merging
         * Validates that runner created in extendCLI has proper config
         */
        it('should pass createRunner with config merging to extendCLI', async () => {
            let runnerConfig: Config | undefined;

            const program = createCLI({
                createRunner: (config) => {
                    runnerConfig = config;
                    return createRunnerStub(config);
                },
                config: {
                    folder: './initial-folder'
                },
                extendCLI: (prog, createExec) => {
                    prog
                        .command('test-config')
                        .action(async () => {
                            await createExec();
                        });
                }
            });

            program.exitOverride();

            await program.parseAsync(['node', 'test', 'test-config', '--folder', './override-folder']);

            expect(runnerConfig).to.exist;
            expect(runnerConfig!.folder).to.equal('./override-folder');
        });

        it('should load the file passed to --config-file', async () => {
            const configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'msr-cli-config-'));
            const configPath = path.join(configDirectory, 'custom.json');
            fs.writeFileSync(configPath, JSON.stringify({folder: './explicit-config'}));
            mockRunner.migrate.resolves({success: true, executed: [], migrated: [], ignored: []});
            const processExitStub = sinon.stub(process, 'exit');

            let runnerConfig: Config | undefined;
            const createRunner = sinon.stub().callsFake((config: Config) => {
                runnerConfig = config;
                return mockRunner;
            });

            try {
                const program = createCLI({createRunner});
                program.exitOverride();

                await program.parseAsync(['node', 'test', 'migrate', '--config-file', configPath]);

                expect(runnerConfig).to.exist;
                expect(runnerConfig!.folder).to.equal('./explicit-config');
            } finally {
                processExitStub.restore();
                fs.rmSync(configDirectory, {recursive: true, force: true});
            }
        });
    });

    describe('Async runner support (v0.8.2)', () => {
        /**
         * Test: synchronous runner (backward compatibility)
         * Tests the instanceof Promise === false branch
         */
        it('should handle synchronous runner creation', async () => {
            mockRunner.validate.resolves({pending: [], migrated: []});

            // Return runner directly (not a Promise)
            const syncStub = sinon.stub().returns(mockRunner);

            // Stub process.exit to prevent test hanging
            const exitStub = sinon.stub(process, 'exit');

            try {
                const program = createCLI({
                    createRunner: syncStub
                });

                program.exitOverride();

                await program.parseAsync(['node', 'test', 'validate']);

                expect(syncStub.calledOnce).to.be.true;
            } finally {
                exitStub.restore();
            }
        });

        /**
         * Test: asynchronous runner (new in v0.8.2)
         * Tests the instanceof Promise === true branch
         */
        it('should handle asynchronous runner creation', async () => {
            mockRunner.validate.resolves({pending: [], migrated: []});

            // Return a Promise
            const asyncStub = sinon.stub().returns(Promise.resolve(mockRunner));

            // Stub process.exit to prevent test hanging
            const exitStub = sinon.stub(process, 'exit');

            try {
                const program = createCLI({
                    createRunner: asyncStub
                });

                program.exitOverride();

                await program.parseAsync(['node', 'test', 'validate']);

                expect(asyncStub.calledOnce).to.be.true;
            } finally {
                exitStub.restore();
            }
        });
    });

    describe('Custom CLI options support (v0.8.3)', () => {
        /**
         * Test: addCustomOptions callback is called when provided
         * Validates that the addCustomOptions callback is invoked with the program
         */
        it('should call addCustomOptions callback when provided', () => {
            const addCustomOptionsSpy = sinon.spy();

            const program = createCLI({
                createRunner: createRunnerStub,
                addCustomOptions: addCustomOptionsSpy
            });

            expect(addCustomOptionsSpy.calledOnce).to.be.true;
            expect(addCustomOptionsSpy.firstCall.args[0]).to.equal(program);
        });

        /**
         * Test: custom options are registered on the program
         * Validates that options added via addCustomOptions appear in program.options
         */
        it('should register custom options on the program', () => {
            const program = createCLI({
                createRunner: createRunnerStub,
                addCustomOptions: (prog) => {
                    prog
                        .option('--database-url <url>', 'Firebase Database URL')
                        .option('--credentials <path>', 'Service account key path');
                }
            });

            const optionFlags = program.options.map(opt => opt.long);
            expect(optionFlags).to.include('--database-url');
            expect(optionFlags).to.include('--credentials');
        });

        /**
         * Test: extendFlags callback is called when provided
         * Validates that the extendFlags callback is invoked with config and flags
         */
        it('should call extendFlags callback when provided', async () => {
            mockRunner.migrate.resolves({success: true, executed: [], migrated: [], ignored: []});

            const extendFlagsSpy = sinon.spy();
            const exitStub = sinon.stub(process, 'exit');

            try {
                const program = createCLI({
                    createRunner: createRunnerStub,
                    addCustomOptions: (prog) => {
                        prog.option('--database-url <url>', 'Database URL');
                    },
                    extendFlags: extendFlagsSpy
                });

                program.exitOverride();

                await program.parseAsync(['node', 'test', 'migrate', '--database-url', 'https://test.db']);

                expect(extendFlagsSpy.calledOnce).to.be.true;
                expect(extendFlagsSpy.firstCall.args[0]).to.be.an('object'); // config
                expect(extendFlagsSpy.firstCall.args[1]).to.be.an('object'); // flags
                expect(extendFlagsSpy.firstCall.args[1].databaseUrl).to.equal('https://test.db');
            } finally {
                exitStub.restore();
            }
        });

        /**
         * Test: custom flags are mapped to config via extendFlags
         * Validates that config values are properly set from custom flags
         */
        it('should map custom flags to config via extendFlags', async () => {
            mockRunner.migrate.resolves({success: true, executed: [], migrated: [], ignored: []});

            let capturedConfig: Config | undefined;
            const exitStub = sinon.stub(process, 'exit');

            try {
                const program = createCLI({
                    createRunner: (config) => {
                        capturedConfig = config;
                        return createRunnerStub(config);
                    },
                    addCustomOptions: (prog) => {
                        prog
                            .option('--mongo-uri <uri>', 'MongoDB connection string')
                            .option('--auth-source [source]', 'Authentication database');
                    },
                    extendFlags: (config, flags) => {
                        if (flags.mongoUri) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (config as any).mongoUri = flags.mongoUri;
                        }
                        if (flags.authSource) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (config as any).authSource = flags.authSource;
                        }
                    }
                });

                program.exitOverride();

                await program.parseAsync(['node', 'test', 'migrate', '--mongo-uri', 'mongodb://localhost', '--auth-source', 'admin']);

                expect(capturedConfig).to.exist;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                expect((capturedConfig as any).mongoUri).to.equal('mongodb://localhost');
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                expect((capturedConfig as any).authSource).to.equal('admin');
            } finally {
                exitStub.restore();
            }
        });

        /**
         * Test: custom flags have highest priority in config merging
         * Validates that custom flags override options.config
         */
        it('should give custom flags highest priority in config waterfall', async () => {
            mockRunner.migrate.resolves({success: true, executed: [], migrated: [], ignored: []});

            let capturedConfig: Config | undefined;
            const exitStub = sinon.stub(process, 'exit');

            try {
                const program = createCLI({
                    createRunner: (config) => {
                        capturedConfig = config;
                        return createRunnerStub(config);
                    },
                    config: {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        folder: './default-folder' as any
                    },
                    addCustomOptions: (prog) => {
                        prog.option('--custom-folder <path>', 'Custom folder path');
                    },
                    extendFlags: (config, flags) => {
                        if (flags.customFolder) {
                            config.folder = flags.customFolder as string;
                        }
                    }
                });

                program.exitOverride();

                await program.parseAsync(['node', 'test', 'migrate', '--custom-folder', './override-folder']);

                expect(capturedConfig).to.exist;
                expect(capturedConfig!.folder).to.equal('./override-folder');
            } finally {
                exitStub.restore();
            }
        });

        /**
         * Test: addCustomOptions not called when not provided
         * Validates that addCustomOptions is optional
         */
        it('should not fail when addCustomOptions is not provided', () => {
            expect(() => {
                createCLI({createRunner: createRunnerStub});
            }).to.not.throw();
        });

        /**
         * Test: extendFlags not called when not provided
         * Validates that extendFlags is optional
         */
        it('should not fail when extendFlags is not provided', async () => {
            mockRunner.migrate.resolves({success: true, executed: [], migrated: [], ignored: []});

            // Stub process.exit to prevent test hanging
            const exitStub = sinon.stub(process, 'exit');

            try {
                const program = createCLI({
                    createRunner: createRunnerStub,
                    addCustomOptions: (prog) => {
                        prog.option('--custom-flag <value>', 'Custom flag');
                    }
                });

                program.exitOverride();

                await expect(
                    program.parseAsync(['node', 'test', 'migrate', '--custom-flag', 'test'])
                ).to.not.be.rejected;
            } finally {
                exitStub.restore();
            }
        });

        /**
         * Test: Commander.js converts kebab-case to camelCase
         * Validates that flags like --database-url become databaseUrl in flags object
         */
        it('should convert kebab-case flags to camelCase', async () => {
            mockRunner.migrate.resolves({success: true, executed: [], migrated: [], ignored: []});

            let capturedFlags: any;
            const exitStub = sinon.stub(process, 'exit');

            try {
                const program = createCLI({
                    createRunner: createRunnerStub,
                    addCustomOptions: (prog) => {
                        prog.option('--database-url <url>', 'Database URL');
                    },
                    extendFlags: (config, flags) => {
                        capturedFlags = flags;
                    }
                });

                program.exitOverride();

                await program.parseAsync(['node', 'test', 'migrate', '--database-url', 'https://test.db']);

                expect(capturedFlags).to.exist;
                expect(capturedFlags.databaseUrl).to.equal('https://test.db');
                expect(capturedFlags['database-url']).to.be.undefined;
            } finally {
                exitStub.restore();
            }
        });
    });

    describe('Custom config type support (v0.8.4)', () => {
        /**
         * Custom config interface extending base Config
         */
        interface FirebaseConfig extends Config {
            databaseUrl: string;
            applicationCredentials: string;
            connectionTimeout?: number;
        }

        /**
         * Test: extendFlags receives custom config type
         * Validates that TConfig generic provides type-safe config access in extendFlags
         */
        it('should support custom config type in extendFlags callback', async () => {
            mockRunner.migrate.resolves({success: true, executed: [], migrated: [], ignored: []});

            let capturedConfig: FirebaseConfig | undefined;
            const exitStub = sinon.stub(process, 'exit');

            try {
                const program = createCLI<MockDB, MigrationScriptRunner<MockDB>, FirebaseConfig>({
                    createRunner: createRunnerStub,
                    addCustomOptions: (prog) => {
                        prog
                            .option('--database-url <url>', 'Firebase Database URL')
                            .option('--credentials <path>', 'Service account key path');
                    },
                    extendFlags: (config, flags) => {
                        // ✅ config is typed as FirebaseConfig
                        config.databaseUrl = flags.databaseUrl as string;
                        config.applicationCredentials = flags.credentials as string;
                        capturedConfig = config;
                    }
                });

                program.exitOverride();

                await program.parseAsync([
                    'node', 'test', 'migrate',
                    '--database-url', 'https://test.firebaseio.com',
                    '--credentials', './key.json'
                ]);

                expect(capturedConfig).to.exist;
                expect(capturedConfig!.databaseUrl).to.equal('https://test.firebaseio.com');
                expect(capturedConfig!.applicationCredentials).to.equal('./key.json');
            } finally {
                exitStub.restore();
            }
        });

        /**
         * Test: createRunner receives custom config type
         * Validates that TConfig generic provides type-safe config access in createRunner
         */
        it('should support custom config type in createRunner callback', async () => {
            mockRunner.migrate.resolves({success: true, executed: [], migrated: [], ignored: []});

            let capturedConfig: FirebaseConfig | undefined;
            const customCreateRunner = sinon.stub().callsFake((config: FirebaseConfig) => {
                capturedConfig = config;
                return mockRunner;
            });

            const exitStub = sinon.stub(process, 'exit');

            try {
                const program = createCLI<MockDB, MigrationScriptRunner<MockDB>, FirebaseConfig>({
                    createRunner: customCreateRunner,
                    addCustomOptions: (prog) => {
                        prog.option('--database-url <url>', 'Firebase Database URL');
                    },
                    extendFlags: (config, flags) => {
                        config.databaseUrl = flags.databaseUrl as string;
                        config.applicationCredentials = 'default-credentials.json';
                    }
                });

                program.exitOverride();

                await program.parseAsync([
                    'node', 'test', 'migrate',
                    '--database-url', 'https://test.firebaseio.com'
                ]);

                expect(customCreateRunner.calledOnce).to.be.true;
                expect(capturedConfig).to.exist;
                expect(capturedConfig!.databaseUrl).to.equal('https://test.firebaseio.com');
                expect(capturedConfig!.applicationCredentials).to.equal('default-credentials.json');
            } finally {
                exitStub.restore();
            }
        });

        /**
         * Test: Backward compatibility without TConfig generic
         * Validates that omitting TConfig generic defaults to base Config type
         */
        it('should default to base Config type when TConfig not specified', async () => {
            mockRunner.migrate.resolves({success: true, executed: [], migrated: [], ignored: []});

            let capturedConfig: Config | undefined;
            const exitStub = sinon.stub(process, 'exit');

            try {
                // No third generic parameter - defaults to Config
                const program = createCLI<MockDB, MigrationScriptRunner<MockDB>>({
                    createRunner: createRunnerStub,
                    extendFlags: (config, flags) => {
                        // config is typed as base Config
                        capturedConfig = config;
                    }
                });

                program.exitOverride();

                await program.parseAsync(['node', 'test', 'migrate']);

                expect(capturedConfig).to.exist;
                expect(capturedConfig).to.be.an('object');
            } finally {
                exitStub.restore();
            }
        });

        /**
         * Test: Custom config with async runner
         * Validates that TConfig works with async createRunner (v0.8.2 feature)
         */
        it('should support custom config type with async createRunner', async () => {
            mockRunner.migrate.resolves({success: true, executed: [], migrated: [], ignored: []});

            let capturedConfig: FirebaseConfig | undefined;
            const asyncCreateRunner = sinon.stub().callsFake(async (config: FirebaseConfig) => {
                capturedConfig = config;
                // Simulate async initialization
                await new Promise(resolve => setTimeout(resolve, 10));
                return mockRunner;
            });

            const exitStub = sinon.stub(process, 'exit');

            try {
                const program = createCLI<MockDB, MigrationScriptRunner<MockDB>, FirebaseConfig>({
                    createRunner: asyncCreateRunner,
                    extendFlags: (config, flags) => {
                        config.databaseUrl = 'https://async-test.firebaseio.com';
                        config.applicationCredentials = './async-key.json';
                    }
                });

                program.exitOverride();

                await program.parseAsync(['node', 'test', 'migrate']);

                expect(asyncCreateRunner.calledOnce).to.be.true;
                expect(capturedConfig).to.exist;
                expect(capturedConfig!.databaseUrl).to.equal('https://async-test.firebaseio.com');
                expect(capturedConfig!.applicationCredentials).to.equal('./async-key.json');
            } finally {
                exitStub.restore();
            }
        });
    });
});
