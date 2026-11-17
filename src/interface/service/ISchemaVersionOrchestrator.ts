import { IMigrationInfo } from '../IMigrationInfo';
import { MigrationScript } from '../../model';
import { IDB } from '../dao';

/**
 * MSR orchestration contract for schema version tracking operations.
 *
 * @template DB - Database interface type extending IDB
 *
 * @example
 * ```typescript
 * const orchestrator = new SchemaVersionOrchestrator<PostgreSqlDB>(schemaVersionProvider);
 * await orchestrator.init('schema_version');
 * ```
 */
export interface ISchemaVersionOrchestrator<DB extends IDB> {
    /**
     * Initializes and validates the schema version storage.
     *
     * @param tableName Name of the schema version table.
     * @returns A promise that resolves when initialization completes.
     * @throws Error If the table cannot be created or is invalid.
     * @example `await schemaVersionOrchestrator.init('schema_version');`
     */
    init(tableName: string): Promise<void>;

    /**
     * Records metadata for a completed migration.
     *
     * @param details Migration metadata to persist.
     * @returns A promise that resolves when the record is saved.
     * @throws Error If persistence fails.
     * @example `await schemaVersionOrchestrator.save(migrationInfo);`
     */
    save(details: IMigrationInfo): Promise<void>;

    /**
     * Returns migration scripts recorded as executed.
     *
     * @returns Executed migration scripts for this database type.
     * @throws Error If the records cannot be loaded.
     * @example `const scripts = await schemaVersionOrchestrator.getAllMigratedScripts();`
     */
    getAllMigratedScripts(): Promise<MigrationScript<DB>[]>;

    /**
     * Removes the execution record for a migration.
     *
     * @param timestamp Timestamp identifying the migration record.
     * @returns A promise that resolves when the record is removed.
     * @throws Error If the record cannot be removed.
     * @example `await schemaVersionOrchestrator.remove(timestamp);`
     */
    remove(timestamp: number): Promise<void>;
}
