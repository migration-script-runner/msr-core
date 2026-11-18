---
layout: default
title: Development Setup
parent: Development
nav_order: 1
---

# Development Setup
{: .no_toc }

Set up your development environment for contributing to MSR.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Prerequisites

### Required Software

- **Node.js**: 22.x or higher (see `engines` in `package.json`)
- **npm**: Use the npm version bundled with your supported Node.js installation
- **Git**: 2.x or higher

### Recommended Tools

- **IDE**: VSCode, WebStorm, or any TypeScript-aware editor
- **Git UI**: GitKraken, SourceTree, or built-in IDE git

---

## Initial Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/msr-core.git
cd msr-core
```

### 2. Install Dependencies

```bash
npm ci
```

`npm ci` installs the exact dependency versions from `package-lock.json` and runs the package's `prepare` script, which installs the Husky hooks.

This installs:
- TypeScript compiler
- Mocha test framework
- Chai assertion library
- ESLint for linting
- NYC for coverage
- Stryker for mutation testing
- **Husky** for pre-commit hooks

{: .note }
> **Pre-Commit Hook:** Dependency installation sets up the Git hook via Husky. Before each commit, it runs TypeScript type checking, a build, ESLint, tests with coverage, and a local check requiring 100% statement, branch, function, and line coverage. This local threshold does not block CI: GitHub Actions and CircleCI generate coverage reports without enforcing the 100% threshold.

### 3. Verify Installation

```bash
# Build the project
npm run build

# Run tests
npm test

# Check coverage
npm run test:coverage
```

Test counts can change as tests are added. Confirm the commands complete successfully. The 100% threshold is checked by the local pre-commit hook; CI generates coverage reports without making that threshold a CI gate.

---

## Project Structure

```
msr-core/
├── src/                   # TypeScript source
│   ├── cli/              # CLI commands and utilities
│   ├── error/             # Error classes
│   ├── hooks/             # Lifecycle hooks
│   ├── interface/         # Public and internal interfaces
│   ├── loader/            # Migration loaders
│   ├── logger/            # Logger implementations
│   ├── metrics/           # Metrics and collectors
│   ├── model/             # Models and configuration
│   ├── service/           # Services and renderers
│   └── util/              # Shared utilities
├── test/                  # Unit, integration, and benchmark tests
├── docs/                  # Jekyll documentation site
├── dist/                  # Compiled output
└── reports/               # Test and coverage reports
```

---

## npm Scripts

### Building

```bash
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run specific test file
npm run test:one -- test/unit/service/RollbackService.test.ts

# Watch mode (auto-run on changes)
npm run test:watch
```

### Linting

```bash
# Run ESLint
npm run lint
```

There is no `lint:fix` npm script. Fix reported issues in the source and rerun the linter.

### Mutation Testing

```bash
# Run mutation tests (takes longer)
npm run test:mutation

# Incremental mode (only changed files)
npm run test:mutation:incremental
```

---

## IDE Configuration

### VSCode

**Recommended Extensions:**
- ESLint
- TypeScript and JavaScript Language Features
- GitLens
- Test Explorer UI

**Settings (`.vscode/settings.json`):**
```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "eslint.validate": [
    "javascript",
    "typescript"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.formatOnSave": true,
  "files.exclude": {
    "**/dist": true,
    "**/coverage": true,
    "**/.nyc_output": true
  }
}
```

### WebStorm / IntelliJ

1. **TypeScript**: Settings → Languages & Frameworks → TypeScript
   - Enable TypeScript Language Service
   - Use project TypeScript version

2. **ESLint**: Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
   - Enable automatic ESLint configuration

3. **Test Runner**: Run → Edit Configurations
   - Add Mocha configuration
   - Test directory: `test`
   - User interface: `bdd`

---

## Development Workflow

### 1. Create a Branch

Choose the base branch according to the issue's milestone and the [Development Workflow](workflow). For a versioned milestone, use its matching `release/X.Y.Z` branch when available.

```bash
git checkout -b feature/my-feature
# or
git checkout -b fix/issue-123
```

### 2. Make Changes

- Edit source files in `src/`
- Add/update tests in `test/`
- Update documentation in `docs/`

### 3. Verify Changes

```bash
# Build
npm run build

# Test
npm test

# Generate the coverage report
npm run test:coverage

```

`npm test` already runs ESLint followed by the Mocha suite. `npm run test:coverage` runs the suite with coverage instrumentation. The local pre-commit hook separately checks the 100% threshold; the CI workflows do not fail on that threshold.

### 4. Commit Changes

```bash
git add .
git commit -m "#123: Add new feature"
```

**Commit Message Format:**
```
#<issue-number>: <short description>

<detailed description>

<breaking changes if any>
```

### 5. Push and Create PR

```bash
git push origin feature/my-feature
```

Then create a Pull Request on GitHub.

---

## Pre-Commit Hook

MSR uses [Husky](https://typicode.github.io/husky/) to automatically run quality checks before every commit.

### What Gets Checked

Pre-commit hooks run these checks in sequence:

1. **TypeScript Type Check** - Validates types without emitting files (`tsc --noEmit`)
2. **Build Check** - Ensures project compiles successfully
3. **ESLint** - Enforces code style and catches errors
4. **Tests with Coverage** - Runs the Mocha suite and creates a coverage report
5. **Coverage Threshold** - Runs `nyc check-coverage` and requires 100% statements, branches, functions, and lines

The hook is a local commit gate. The current GitHub Actions and CircleCI workflows generate coverage reports but do not fail because coverage is below 100%.

**Expected output when committing:**
```
🔍 Running pre-commit checks...
📘 Type checking TypeScript...
🔨 Building project...
📝 Running ESLint...
🧪 Running tests with coverage...
📊 Verifying 100% coverage...
✅ All pre-commit checks passed!
```

### Automatic Setup

Hooks are installed by the package's `prepare` script when you run:
```bash
npm ci
```

The `prepare` script in `package.json` invokes Husky.

### Bypassing Hooks

{: .warning }
> **Use sparingly!** Bypassing hooks should only be done for work-in-progress commits on feature branches.

To bypass pre-commit hooks (for WIP commits):
```bash
git commit --no-verify -m "WIP: work in progress"
```

{: .important }
> **Never bypass hooks** when committing to `master` or `release/*` branches. All code merged to these branches must pass all quality checks.

### Troubleshooting Hooks

**Issue:** Hooks do not run after dependency installation

**Solution:**
```bash
# Reinstall dependencies and the Husky hook
npm ci
```

**Issue:** Hooks fail even though manual checks pass

**Solution:**
```bash
# Run the hook manually to see the exact error
./.husky/pre-commit
```

**Issue:** Hooks run but take too long

Pre-commit checks include type checking, a build, linting, tests, and coverage verification. Run the narrow relevant checks while iterating, then let the hook run before committing. Watch mode is available with `npm run test:watch`.

---

## Troubleshooting

### Build Errors

**Issue:** TypeScript compilation fails

**Solution:**
```bash
# Clean and rebuild
rm -rf dist node_modules
npm ci
npm run build
```

### Test Failures

**Issue:** Tests fail after a fresh clone

**Solution:**
```bash
# Install locked dependencies
npm ci

# Create the directory used by CI and some tests, if it is absent
mkdir -p backups

# Try running specific test
npm run test:one -- test/unit/service/YourService.test.ts
```

### Coverage Below 100%

**Issue:** Coverage report shows < 100%

**Solution:**
- Add tests for uncovered lines
- Check branch coverage
- Run `npx nyc check-coverage --lines 100 --branches 100 --functions 100 --statements 100` to check the local commit threshold
- See [Testing Guide](testing/) for coverage requirements

Coverage below 100% does not fail the current CI workflows; the local pre-commit hook enforces that threshold.

### Permission Errors (macOS)

**Issue:** `EACCES` errors during dependency installation

**Solution:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

---

## Next Steps

- Read [Development Workflow](workflow) for the contribution process
- Review [Architecture](architecture) to understand the codebase
- Check [Testing Guide](testing/) for testing standards
- See [Contributing Guide](contributing) for PR guidelines

---

## Common Commands Quick Reference

| Command | Purpose |
|---------|---------|
| `npm ci` | Install locked dependencies and set up Git hooks |
| `npm run build` | Compile TypeScript |
| `npm test` | Run all tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run lint` | Run ESLint |
| `npm run test:mutation` | Run mutation tests |
| `npm run docs:install` | Install the Jekyll site's Ruby dependencies |
| `npm run docs:build` | Build the Jekyll documentation site |

## Continuous Integration

The GitHub Actions test workflow currently runs on pushes to `master`, `develop`, and `release/*`, and on pull requests targeting `master` or `develop`. It tests on Node.js 22.x and 26.x, installs with `npm ci`, creates `backups/`, runs lint and tests, and generates a coverage report. A task PR targeting `release/*` is covered by the push workflow when commits reach that branch; the pull request event filter currently names only `master` and `develop`.

CircleCI currently uses Node.js 22, runs `npm run test:report`, and uploads the coverage report to Coveralls. Neither CI workflow enforces the local 100% coverage threshold.
