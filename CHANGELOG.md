# Changelog

Notable changes to MSR Core are recorded here. The project uses [Semantic Versioning](https://semver.org/). Dates below follow Git tags where available. Early `0.1.x` entries are reconstructed from version changes and commits because tags begin at `v0.1.7`.

## [1.0.0]

> Release notes for v1.0.0. The package metadata is currently `1.0.0-beta.1`; no stable release date is recorded here because the final tag has not been published.

### Added
- Added the common `--backup-mode` CLI option with validated values (`full`, `create_only`, `restore_only`, and `manual`) ([#153](https://github.com/migration-script-runner/msr-core/issues/153), [#173](https://github.com/migration-script-runner/msr-core/issues/173)).
- Added dot-notation support for adapter-specific CLI options, mapping flags such as `--mongo.uri` into nested configuration ([#162](https://github.com/migration-script-runner/msr-core/issues/162)).
- Added repository guidance, GitHub workflow documentation, security reporting guidance, contributor templates, compatibility policy, and CI security auditing ([#163](https://github.com/migration-script-runner/msr-core/issues/163), [#167](https://github.com/migration-script-runner/msr-core/issues/167)).
- Added an automated workflow that retrieves SonarCloud findings and opens a guarded Codex remediation PR ([#178](https://github.com/migration-script-runner/msr-core/issues/178)).

### Changed
- **Breaking:** Made `MigrationScriptRunner` an abstract base class for adapters ([#150](https://github.com/migration-script-runner/msr-core/issues/150)).
- **Breaking:** Replaced `MigrationScriptExecutor` and its option/dependency types with `MigrationScriptRunner`, `IRunnerOptions`, and `IRunnerDependencies` ([#155](https://github.com/migration-script-runner/msr-core/issues/155)).
- **Breaking:** Standardized provider and orchestrator API names, handler and runner option properties, the CLI factory (`createRunner`), adapter class naming (`<Database>Runner`), and lock owner identifiers (`runnerId` / `runner_id`) ([#156](https://github.com/migration-script-runner/msr-core/issues/156)).
- **Breaking:** Raised the minimum supported Node.js version from 20 to 22 and aligned CI, publishing, and runtime examples ([#192](https://github.com/migration-script-runner/msr-core/issues/192)).
- Updated `auto-envparse` to v3 and refreshed `figlet`, `lodash`, and `moment` to address dependency advisories ([#163](https://github.com/migration-script-runner/msr-core/issues/163), [#164](https://github.com/migration-script-runner/msr-core/issues/164)).
- Refreshed the Node.js 22-compatible development toolchain, upgraded the Stryker packages together, and declared `uuid` as a direct runtime dependency ([#192](https://github.com/migration-script-runner/msr-core/issues/192)).
- Expanded adapter, API, CLI, and release migration documentation and examples ([#154](https://github.com/migration-script-runner/msr-core/issues/154), [#174](https://github.com/migration-script-runner/msr-core/issues/174)).

### Fixed
- Validated supported values for `--backup-mode`, `--logger`, `--log-level`, and `--format`; the CLI now applies selected logger, log level, and JSON output to adapter runners ([#173](https://github.com/migration-script-runner/msr-core/issues/173)).
- Resolved 66 actionable findings from the v1.0.0 SonarCloud review with corresponding code and test improvements ([#175](https://github.com/migration-script-runner/msr-core/issues/175)).

## [0.8.4] - 2025-12-20
### Added
- A `TConfig` generic parameter for type-safe custom CLI configuration ([#152](https://github.com/migration-script-runner/msr-core/issues/152)).

## [0.8.3] - 2025-12-20
### Added
- Adapter-specific CLI flag support ([#151](https://github.com/migration-script-runner/msr-core/issues/151)).

## [0.8.2] - 2025-12-20
### Added
- Async executor creation, a `createInstance` factory, and generic configuration types for adapters ([#144](https://github.com/migration-script-runner/msr-core/issues/144), [#145](https://github.com/migration-script-runner/msr-core/issues/145), [#147](https://github.com/migration-script-runner/msr-core/issues/147)).
### Fixed
- Improved errors during adapter initialization ([#146](https://github.com/migration-script-runner/msr-core/issues/146)).

## [0.8.1] - 2025-12-19
### Added
- Centralized locking orchestration, locking initialization methods, and public handler access ([#140](https://github.com/migration-script-runner/msr-core/issues/140), [#141](https://github.com/migration-script-runner/msr-core/issues/141), [#142](https://github.com/migration-script-runner/msr-core/issues/142)).

## [0.8.0] - 2025-12-18
### Added
- Optional database-level migration locking, lock CLI commands, and handler generic typing.
### Fixed
- Down migration lookup now matches database records with filesystem scripts ([#139](https://github.com/migration-script-runner/msr-core/issues/139)).

## [0.7.4] - 2025-12-17
### Changed
- Publishing workflow moved to tag-based npm publication with provenance ([#133](https://github.com/migration-script-runner/msr-core/issues/133)). The repository also contained untagged `0.7.1`–`0.7.3` version updates during this publishing work.

## [0.7.0] - 2025-12-13
### Added
- CLI factory and commands, `.env` loading, and service facades.
### Changed
- Executor constructor and public service access; see the [migration guide](docs/version-migration/v0.6-to-v0.7.md).

## [0.6.0] - 2025-12-04
### Added
- Generic database types, improved runtime type guards, and automatic configuration loading.
### Changed
- Constructor dependency injection; see the [migration guide](docs/version-migration/v0.5-to-v0.6.md).

## [0.5.0] - 2025-12-01
### Added
- Transaction management, environment variable configuration, and transaction lifecycle hooks.

## [0.4.0] - 2025-11-30
### Added
- SQL migration files, dry run, execution summaries, and connection validation.
### Changed
- File pattern and API signatures; see the [migration guide](docs/version-migration/v0.3-to-v0.4.md).

## [0.3.0] - 2025-11-28
### Changed
- Migration state terminology and renderer methods; extracted migration scanning. See the [migration guide](docs/version-migration/v0.2-to-v0.3.md).

## [0.2.2] - 2025-11-22
### Added
- Contributor and publishing guidance.

## [0.2.1] - 2025-11-22
### Fixed
- GitHub Actions permissions for organization releases.

## [0.2.0] - 2025-11-22
### Changed
- Renamed the package to `@migration-script-runner/core` and moved it to the organization repository.
### Added
- Display limit configuration, a list method, JSDoc, and documentation site. See the [migration guide](docs/version-migration/v0.1-to-v0.2.md).

## 0.1.x development history

The Git history records package versions `0.1.0` through `0.1.11`; Git tags are available from `v0.1.7`. These early changes were part of initial development and publishing setup, so the list does not claim that every package version was published.

- **0.1.0:** Initial script runner, migration and schema version services, console output, tests, lint, and CI.
- **0.1.1:** Began package version and publication workflow changes ([#20](https://github.com/migration-script-runner/msr-core/issues/20)).
- **0.1.2:** Enabled compiled package output and excluded tests from the published build.
- **0.1.3:** Enabled the production publishing step.
- **0.1.4:** Added tag pushing to the publishing workflow.
- **0.1.5:** Replaced the tag action used by the workflow.
- **0.1.6:** Adjusted package version and tag-message handling.
- **0.1.7:** Continued tag-message and release automation fixes.
- **0.1.8:** Restored the package entry point during publishing work.
- **0.1.9:** Renamed classes, interfaces, and variables ([#22](https://github.com/migration-script-runner/msr-core/issues/22)).
- **0.1.10:** Lint fixes and package version update ([#32](https://github.com/migration-script-runner/msr-core/issues/32)).
- **0.1.11:** Corrected migration persistence result handling ([#32](https://github.com/migration-script-runner/msr-core/issues/32)).
