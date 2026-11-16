---
layout: default
title: Contributing
parent: Development
nav_order: 8
---

# Contributing to MSR
{: .no_toc }

Guide for contributors and maintainers.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Development Setup

### Prerequisites

- Node.js 20 or higher (see [Compatibility](../compatibility))
- npm bundled with the supported Node.js installation
- Git

### Clone and Install

```bash
git clone https://github.com/migration-script-runner/msr-core.git
cd msr-core
npm ci
```

---

## Development Workflow

### Running Tests

```bash
# Run all tests (linter + unit + integration)
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run mutation tests (slow)
npm run test:mutation
```

### Building

```bash
# Build the project
npm run build

# The compiled output will be in ./dist
```

### Code Quality

```bash
# Run linter
npm run lint

# Generate all reports (lint + coverage)
npm run test:report
```

{: .note }
> **Pre-Commit Hooks (v0.7.0+):** When you run `git commit`, these checks run automatically via Husky. If they fail, the commit is blocked. See [Pre-Commit Hooks](setup#pre-commit-hooks-v070) for more details.

---

## Publishing New Versions

Maintainers follow the [publishing guide](publishing) and [GitHub project workflow](github-project-workflow). The release branch is promoted through a PR to `master`; a pushed `v*` tag triggers npm publication. Contributors should not create version commits or tags as part of an ordinary change.

---

## Code Style

- Follow existing code conventions
- Use TypeScript for all code
- Add JSDoc comments for all public APIs
- Keep test coverage at 100%
- Use meaningful variable and function names

---

## Pull Request Process

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Write tests** for new functionality
5. **Run tests** to ensure everything passes
6. **Commit your changes** with descriptive messages
7. **Push to your fork**
8. **Open a Pull Request** with:
   - Clear description of changes
   - Link to related issues
   - Test results

---

## Commit Message Guidelines

Use the repository format `#<issue number>: <imperative title>`, followed by a body explaining what changed and why. For example:

```text
#123: Add database handler support

Add the handler contract and tests so adapters can use the new database type.
```

Do not add AI attribution. See the [development workflow](workflow) for branch and review details.

---

## Documentation

### Updating Documentation

Documentation is in the `docs/` folder using Jekyll and Just the Docs theme.

**Local preview:**
```bash
# Install Jekyll (one time)
gem install bundler jekyll

# Run locally
cd docs
bundle exec jekyll serve

# View at http://localhost:4000/msr-core/
```

**Documentation structure:**
- `docs/index.md` - Homepage
- `docs/getting-started.md` - Getting started guide
- `docs/configuration.md` - Configuration reference
- `docs/api/` - API documentation
- `docs/guides/` - User guides
- `do../version-migration/` - Migration guides

---

## Need Help?

- **Issues:** https://github.com/migration-script-runner/msr-core/issues
- **Discussions:** https://github.com/migration-script-runner/msr-core/discussions
- **Email:** volodyalavrynovych@gmail.com

Thank you for contributing! 🎉
