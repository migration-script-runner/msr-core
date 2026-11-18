# Security Policy

## Supported versions

Security fixes are provided for the latest published release. Older releases are not maintained. See [Releases](https://github.com/migration-script-runner/msr-core/releases) for published versions.

## Report a vulnerability

Please do not open a public issue for a suspected vulnerability. Report it through [GitHub private vulnerability reporting](https://github.com/migration-script-runner/msr-core/security/advisories/new). Include affected versions, reproduction steps, impact, and any proposed fix. We will coordinate disclosure and publish a security advisory when appropriate.

## Deployment guidance

Keep MSR and its dependencies updated. Restrict database credentials and backup files to the migration process, use a separate least-privilege database account where possible, and test migrations and restores before production deployment. Enable [migration locking](https://core.migration-script-runner.dev/configuration/locking-settings) when multiple instances could migrate concurrently. See the [validation](https://core.migration-script-runner.dev/configuration/validation-settings) and [backup](https://core.migration-script-runner.dev/configuration/backup-settings) guides for checksums and recovery options. npm publication uses provenance attestations through the release workflow.
