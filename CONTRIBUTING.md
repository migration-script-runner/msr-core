# Contributing to MSR Core

Thank you for contributing. The full [contributing guide](https://core.migration-script-runner.dev/development/contributing) and [development setup](https://core.migration-script-runner.dev/development/setup) describe the project workflow.

## Quick start

1. Fork and clone the repository, then install Node.js 22 or newer and run `npm ci`.
2. Create a branch from the release branch named by the issue's milestone. For work without a versioned target, follow the maintainer's chosen base branch.
3. Make the code, tests, and documentation changes described in the issue.
4. Run `npm run build`, `npm run lint`, and `npm run test:coverage`. The local pre-commit hook checks 100% coverage.
5. Open a pull request against the branch selected for the issue.

## Pull request checklist

- Link the relevant issue and describe the behavior change.
- Update tests and relevant pages under `docs/`.
- Confirm the build, lint, and tests pass.
- Use the commit format `#<issue number>: <imperative title>` with a body explaining what changed and why.

Use the [bug report](https://github.com/migration-script-runner/msr-core/issues/new?template=bug_report.yml) or [feature request](https://github.com/migration-script-runner/msr-core/issues/new?template=feature_request.yml) template when opening an issue. Please follow the [Code of Conduct](CODE_OF_CONDUCT.md). Report security concerns privately as described in [SECURITY.md](SECURITY.md).
