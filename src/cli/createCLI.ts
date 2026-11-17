import {Command} from 'commander';
import {MigrationScriptRunner} from '../service/MigrationScriptRunner';
import {IConfigLoader} from '../interface/IConfigLoader';
import {Config} from '../model/Config';
import {BackupMode} from '../model/BackupMode';
import {IDB} from '../interface';
import {ConfigLoader} from '../util/ConfigLoader';
import {
    mapFlagsToConfig,
    CLIFlags,
    LOGGER_TYPES,
    LOG_LEVELS,
    OUTPUT_FORMATS
} from './utils/flagMapper';
import {
    addMigrateCommand,
    addListCommand,
    addDownCommand,
    addValidateCommand,
    addBackupCommand,
    addLockStatusCommand,
    addLockReleaseCommand
} from './commands';

/**
 * Options for creating a CLI instance.
 *
 * @template DB - Database interface type
 * @template TRunner - Runner type (MigrationScriptRunner or adapter extending it)
 * @template TConfig - Configuration type (Config or adapter-specific config extending it)
 */
export interface CLIOptions<
    DB extends IDB,
    TRunner extends MigrationScriptRunner<DB> = MigrationScriptRunner<DB>,
    TConfig extends Config = Config
> {
    /**
     * Factory function to create MigrationScriptRunner instance.
     *
     * Receives the final merged Config (defaults → file → env vars → CLI flags)
     * and should return an instance of MigrationScriptRunner or adapter that extends it.
     *
     * **NEW in v0.8.2:** Supports both synchronous and asynchronous runner creation.
     * Use async when your database adapter requires async initialization (connections, auth, etc).
     *
     * **NEW in v0.8.4:** Supports custom config types via TConfig generic parameter.
     * Use this when your adapter has FirebaseConfig extends Config with custom properties.
     *
     * @param config - Final merged configuration with CLI flags applied
     * @returns MigrationScriptRunner instance (or Promise) or adapter extending it
     *
     * @example
     * ```typescript
     * // Synchronous runner (backward compatible)
     * createRunner: (config) => {
     *   const handler = new MongoHandler(config.mongoUri);
     *   return new MongoRunner({ handler, config });
     * }
     * ```
     *
     * @example
     * ```typescript
     * // Asynchronous runner (NEW in v0.8.2)
     * createRunner: async (config) => {
     *   const handler = await FirebaseHandler.getInstance(config);
     *   return new FirebaseRunner({ handler, config });
     * }
     * ```
     *
     * @example
     * ```typescript
     * // With custom config type (NEW in v0.8.4)
     * interface FirebaseConfig extends Config {
     *   databaseUrl: string;
     *   applicationCredentials: string;
     * }
     *
     * createRunner: async (config: FirebaseConfig) => {
     *   // ✅ config.databaseUrl is typed and autocompletes!
     *   return FirebaseRunner.getInstance({ config });
     * }
     * ```
     */
    createRunner: (config: TConfig) => TRunner | Promise<TRunner>;

    /**
     * CLI metadata (optional).
     */
    name?: string;
    description?: string;
    version?: string;

    /**
     * Initial config to merge with defaults (optional).
     * Will be merged after waterfall config loading but before CLI flags.
     */
    config?: Partial<TConfig>;

    /**
     * Custom config loader (optional).
     * If not provided, uses default ConfigLoader.
     */
    configLoader?: IConfigLoader<TConfig>;

    /**
     * Optional callback to extend the CLI with custom commands.
     *
     * Called after base commands are registered but before program is returned.
     * Use this to add adapter-specific commands that call custom methods on your adapter.
     *
     * **NEW in v0.8.2:** createRunner returns Promise to support async initialization.
     *
     * @param program - Commander program to extend with custom commands
     * @param createRunner - Factory function that creates your adapter with merged config (returns Promise)
     *
     * @example
     * ```typescript
     * extendCLI: (program, createRunner) => {
     *   program
     *     .command('vacuum')
     *     .description('Run VACUUM ANALYZE on PostgreSQL database')
     *     .action(async () => {
     *       const adapter = await createRunner(); // NEW: await required
     *       await adapter.vacuum(); // Custom method on adapter
     *       console.log('✓ Vacuum completed');
     *       process.exit(0);
     *     });
     * }
     * ```
     */
    extendCLI?: (program: Command, createRunner: () => Promise<TRunner>) => void;

    /**
     * Optional callback to add adapter-specific CLI options.
     *
     * Called during program setup to register custom command-line flags for your adapter.
     * Use this to add database-specific options that are available on all commands.
     *
     * **NEW in v0.8.3**
     *
     * @param program - Commander program to add custom options to
     *
     * @example
     * ```typescript
     * // Firebase adapter with database URL and credentials flags
     * const program = createCLI({
     *   name: 'msr-firebase',
     *
     *   // Add custom options
     *   addCustomOptions: (program) => {
     *     program
     *       .option('--database-url <url>', 'Firebase Realtime Database URL')
     *       .option('--credentials <path>', 'Path to service account key file');
     *   },
     *
     *   // Map custom flags to config
     *   extendFlags: (config, flags) => {
     *     if (flags.databaseUrl) {
     *       config.databaseUrl = flags.databaseUrl;
     *     }
     *     if (flags.credentials) {
     *       config.applicationCredentials = flags.credentials;
     *     }
     *   },
     *
     *   createRunner: async (config) => {
     *     // config.databaseUrl and config.applicationCredentials available here
     *     return FirebaseRunner.getInstance({ config });
     *   }
     * });
     *
     * // Usage:
     * // npx msr-firebase migrate --database-url https://my-project.firebaseio.com --credentials ./key.json
     * ```
     */
    addCustomOptions?: (program: Command) => void;

    /**
     * Optional callback to map custom CLI flags to config properties.
     *
     * Called after standard config loading but before createRunner, allowing you to
     * map your custom CLI flags to config properties. Custom flags have highest priority
     * in the config waterfall (override defaults → file → env → options.config → custom flags).
     *
     * **NEW in v0.8.3**
     *
     * **NEW in v0.8.4:** Config parameter is typed as TConfig for full type safety with custom configs.
     *
     * @param config - Config object to update with custom flag values (typed as TConfig)
     * @param flags - Parsed CLI flags from Commander.js (includes both standard and custom flags)
     *
     * @example
     * ```typescript
     * // MongoDB adapter mapping connection string and auth options
     * const program = createCLI({
     *   name: 'msr-mongodb',
     *
     *   addCustomOptions: (program) => {
     *     program
     *       .option('--mongo-uri <uri>', 'MongoDB connection string')
     *       .option('--auth-source [source]', 'Authentication database');
     *   },
     *
     *   extendFlags: (config, flags) => {
     *     if (flags.mongoUri) {
     *       config.mongoUri = flags.mongoUri;
     *     }
     *     if (flags.authSource) {
     *       config.authSource = flags.authSource;
     *     }
     *   },
     *
     *   createRunner: (config) => new MongoRunner({ config })
     * });
     * ```
     *
     * @example
     * ```typescript
     * // Firebase adapter with custom config type (NEW in v0.8.4)
     * interface FirebaseConfig extends Config {
     *   databaseUrl: string;
     *   applicationCredentials: string;
     * }
     *
     * const program = createCLI<IFirebaseDB, FirebaseRunner, FirebaseConfig>({
     *   extendFlags: (config, flags) => {
     *     // ✅ config is typed as FirebaseConfig - full IntelliSense!
     *     config.databaseUrl = flags.databaseUrl as string;
     *     config.applicationCredentials = flags.credentials as string;
     *   },
     *
     *   createRunner: async (config) => {
     *     // ✅ config.databaseUrl is typed!
     *     return FirebaseRunner.getInstance({ config });
     *   }
     * });
     * ```
     */
    extendFlags?: (config: TConfig, flags: CLIFlags) => void;
}

/**
 * Create a CLI program with base migration commands.
 *
 * This factory function creates a Commander.js program with all base MSR commands
 * (migrate, list, down, validate, backup) pre-configured. Adapters can extend
 * the CLI with custom commands using the `extendCLI` callback.
 *
 * **Configuration Loading (Waterfall):**
 * 1. Built-in defaults
 * 2. Config file (if --config-file flag provided)
 * 3. Environment variables (MSR_*)
 * 4. options.config (if provided)
 * 5. CLI flags (highest priority)
 *
 * The common `--backup-mode` flag accepts `full`, `create_only`, `restore_only`,
 * or `manual`. If omitted, the loaded configuration's backup mode is preserved.
 *
 * The final merged config is passed to your `createRunner` factory function,
 * allowing you to initialize your adapter with the correct configuration.
 *
 * @template DB - Database interface type
 * @template TRunner - Runner type (inferred from createRunner return type)
 * @template TConfig - Configuration type (Config or adapter-specific config extending it)
 * @param options - CLI creation options
 * @returns Commander program ready for parsing or extension
 *
 * @example
 * ```typescript
 * // Basic usage with adapter
 * import { createCLI } from '@migration-script-runner/core';
 * import { MongoRunner } from './MongoRunner';
 * import { MongoHandler } from './MongoHandler';
 *
 * const program = createCLI({
 *   name: 'msr-mongodb',
 *   description: 'MongoDB Migration Runner',
 *   version: '1.0.0',
 *   createRunner: (config) => {
 *     const handler = new MongoHandler(config.mongoUri || 'mongodb://localhost');
 *     return new MongoRunner({ handler, config });
 *   }
 * });
 *
 * program.parse(process.argv);
 * ```
 *
 * @example
 * ```typescript
 * // Extending with custom commands via extendCLI callback
 * class PostgresRunner extends MigrationScriptRunner<IPostgresDB> {
 *   async vacuum(): Promise<void> {
 *     await this.handler.db.query('VACUUM ANALYZE');
 *   }
 * }
 *
 * const program = createCLI({
 *   name: 'msr-postgres',
 *   createRunner: (config) => new PostgresRunner({ handler, config }),
 *
 *   // Add custom commands with full type safety
 *   extendCLI: (program, createRunner) => {
 *     program
 *       .command('vacuum')
 *       .description('Run VACUUM ANALYZE on database')
 *       .action(async () => {
 *         const adapter = await createRunner(); // Typed as PostgresRunner!
 *         await adapter.vacuum(); // ✓ TypeScript knows about vacuum()
 *         console.log('✓ Vacuum completed');
 *         process.exit(0);
 *       });
 *   }
 * });
 *
 * program.parse(process.argv);
 * ```
 *
 * @example
 * ```typescript
 * // With custom config type (NEW in v0.8.4)
 * interface FirebaseConfig extends Config {
 *   databaseUrl: string;
 *   applicationCredentials: string;
 * }
 *
 * const program = createCLI<IFirebaseDB, FirebaseRunner, FirebaseConfig>({
 *   name: 'msr-firebase',
 *
 *   addCustomOptions: (program) => {
 *     program
 *       .option('--database-url <url>', 'Firebase Database URL')
 *       .option('--credentials <path>', 'Service account key');
 *   },
 *
 *   extendFlags: (config, flags) => {
 *     // ✅ config is typed as FirebaseConfig!
 *     config.databaseUrl = flags.databaseUrl as string;
 *     config.applicationCredentials = flags.credentials as string;
 *   },
 *
 *   createRunner: async (config) => {
 *     // ✅ config is typed as FirebaseConfig!
 *     return FirebaseRunner.getInstance({ config });
 *   }
 * });
 * ```
 */
export function createCLI<
    DB extends IDB,
    TRunner extends MigrationScriptRunner<DB> = MigrationScriptRunner<DB>,
    TConfig extends Config = Config
>(
    options: CLIOptions<DB, TRunner, TConfig>
): Command {
    const loggerTypes = LOGGER_TYPES.join('|');
    const logLevels = LOG_LEVELS.join('|');
    const outputFormats = OUTPUT_FORMATS.join('|');
    const backupModes = Object.values(BackupMode).join('|');
    const program = new Command();

    // Set CLI metadata
    program
        .name(options.name || 'msr')
        .description(options.description || 'Migration Script Runner')
        .version(options.version || '1.0.0');

    // Add common options to all commands
    program
        .option('-c, --config-file <path>', 'Configuration file path')
        .option('--folder <path>', 'Migrations folder')
        .option('--table-name <name>', 'Schema version table name')
        .option('--display-limit <number>', 'Maximum migrations to display', parseInt)
        .option('--dry-run', 'Simulate without executing')
        .option('--no-lock', 'Disable migration locking for this run')
        .option('--logger <type>', `Logger type (${loggerTypes})`)
        .option('--log-level <level>', `Log level (${logLevels})`)
        .option('--log-file <path>', 'Log file path (required with --logger file)')
        .option('--format <format>', `Output format (${outputFormats})`)
        .option('--backup-mode <mode>', `Backup behavior (${backupModes})`);

    // Call adapter's custom options callback if provided
    if (options.addCustomOptions) {
        options.addCustomOptions(program);
    }

    // Factory function to create runner based on parsed CLI flags
    const createRunnerWithFlags = async (): Promise<TRunner> => {
        const opts = program.opts<CLIFlags>();

        // 1. Load base config using waterfall (defaults → file → env vars)
        const configLoader = options.configLoader || new ConfigLoader<TConfig>();
        const config: TConfig = opts.configFile
            ? configLoader.load({}, {baseDir: opts.configFile})
            : configLoader.load(); // Uses waterfall without explicit file

        // 2. Merge with options.config if provided
        if (options.config) {
            Object.assign(config, options.config);
        }

        // 3. Map CLI flags to config (highest priority)
        const logger = mapFlagsToConfig(config, opts);

        // 4. Call adapter's custom flag mapper if provided (highest priority)
        if (options.extendFlags) {
            options.extendFlags(config, opts);
        }

        // 5. Call adapter's factory function with final merged config (supports both sync and async)
        const runnerOrPromise = options.createRunner(config);
        const runner = runnerOrPromise instanceof Promise
            ? await runnerOrPromise
            : runnerOrPromise;

        // 6. If logger was created from CLI flags, override runner's logger
        if (logger) {
            // Note: This assumes runner has a way to set logger
            // We'll need to verify this works with the runner's implementation
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (runner as any).logger = logger;
        }

        return runner;
    };

    // Add base commands - pass factory function
    addMigrateCommand(program, createRunnerWithFlags);
    addListCommand(program, createRunnerWithFlags);
    addDownCommand(program, createRunnerWithFlags);
    addValidateCommand(program, createRunnerWithFlags);
    addBackupCommand(program, createRunnerWithFlags);
    addLockStatusCommand(program, createRunnerWithFlags);
    addLockReleaseCommand(program, createRunnerWithFlags);

    // Call extendCLI callback if provided
    if (options.extendCLI) {
        options.extendCLI(program, createRunnerWithFlags);
    }

    return program;
}
