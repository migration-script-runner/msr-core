import { IDatabaseMigrationHandler, IRunnerDependencies } from '../../src/interface';
import { IDB } from '../../src/interface/dao';
import { Config } from '../../src/model';
import { MigrationScriptRunner } from '../../src/service/MigrationScriptRunner';

/** Concrete runner used to exercise the abstract runner implementation in tests. */
export class TestMigrationScriptRunner<
    DB extends IDB,
    THandler extends IDatabaseMigrationHandler<DB> = IDatabaseMigrationHandler<DB>,
    TConfig extends Config = Config
> extends MigrationScriptRunner<DB, THandler, TConfig> {
    constructor(dependencies: IRunnerDependencies<DB, THandler, TConfig>) {
        super(dependencies);
    }
}
