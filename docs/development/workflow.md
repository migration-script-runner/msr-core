---
layout: default
title: Development Workflow
parent: Development
nav_order: 2
---

# Development Workflow
{: .no_toc }

The development process for contributing to MSR.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

This document describes the end-to-end development workflow for contributing to Migration Script Runner, from finding an issue to getting your changes merged.

---

## 1. Finding Work

### Check Existing Issues

Browse [GitHub Issues](https://github.com/migration-script-runner/msr-core/issues) for:
- `good first issue` - Good for first-time contributors
- `help wanted` - Maintainers need help
- `bug` - Bug fixes needed
- `enhancement` - New features

### Create New Issue

If you find a bug or have an idea:

1. **Search first** - Check if issue already exists
2. **Use templates** - Fill out bug/feature template
3. **Wait for triage** - Maintainers will review and label
4. **Get assigned** - Comment to request assignment

---

## 2. Branching Strategy

### Branch selection and naming

Choose the base branch from the issue's milestone and the current release plan before creating a branch.

- For an issue assigned to a versioned milestone, use the matching `release/X.Y.Z` branch when it exists. Create a task branch from it and open the task PR back into that release branch.
- Promote a completed release with a separate PR from `release/X.Y.Z` into `master`. Use a title such as `Release vX.Y.Z`.
- For work without a versioned release target, use the base branch specified by the issue or maintainer; otherwise use `master`.
- If a versioned milestone has no matching release branch, do not create one or guess a base branch. Confirm the intended release target first.

Task branch names use `<type>/<description>`:

```
<type>/<description>
```

**Types:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation only
- `refactor/` - Code refactoring
- `test/` - Test improvements
- `chore/` - Maintenance tasks
- `hotfix/` - Urgent fixes based on the production branch

**Examples:**
```bash
git checkout -b feature/add-mysql-handler
git checkout -b fix/issue-123-backup-error
git checkout -b docs/improve-api-reference
```

For a release-targeted issue, include the issue number or a short description in the task branch name and base it on the matching release branch, for example:

```bash
git checkout release/1.0.0
git checkout -b docs/167-agents-guidance
```

### Working on Your Branch

```bash
# Check out the target selected above and create a task branch
git checkout <target-branch>
git checkout -b <type>/<description>

# Make changes
# ... edit files ...

# Stage and commit
git add .
git commit -m "#123: Add my feature"

# Push to your fork
git push origin feature/my-feature
```

---

## 3. Making Changes

### The Three-Step Pattern (MANDATORY)

**Every code change MUST follow this pattern:**

1. **Update the code** - Make necessary changes to source files
2. **Update/add tests** - Ensure 100% test coverage is maintained
3. **Update documentation** - Update ALL relevant files in `/docs`

**Never skip any step.** A task is NOT complete until all three steps are done.

### Code Changes

**Locations:**
- `/src` - All source code
- TypeScript only, no JavaScript
- Follow existing code style
- Use interfaces, not `any` types

**Quality Standards:**
- Zero `any` types in production code
- Proper JSDoc comments on all public APIs
- SOLID principles
- Single Responsibility Principle

### Test Changes

**Locations:**
- `/test/unit` - Unit tests
- `/test/integration` - Integration tests

**Requirements:**
- 100% test coverage (statements, branches, functions, lines)
- Test both happy path and edge cases
- Use `SilentLogger` in tests to keep output clean
- Mock external dependencies appropriately

**Example:**
```typescript
import { expect } from 'chai';
import { MyService, SilentLogger } from '../../../src';

describe('MyService', () => {
    it('should do something', () => {
        const service = new MyService(new SilentLogger());
        const result = service.doSomething();
        expect(result).to.equal('expected');
    });
});
```

### Documentation Changes

**Update these when relevant:**
- `/docs/api` - API reference
- `/docs/guides` - User guides
- `/docs/configuration` - Config documentation
- `/README.md` - If user-facing feature
- JSDoc comments in source code

**Use grep to find all instances:**
```bash
# Find all places that mention a feature
grep -r "oldFeatureName" docs/
```

---

## 4. Testing Your Changes

### Run Tests

```bash
# Build
npm run build

# All tests
npm test

# Generate the coverage report
npm run test:coverage

# Specific test file
npm run test:one -- test/unit/service/MyService.test.ts
```

The local pre-commit hook enforces 100% statements, branches, functions, and lines. Test counts and coverage totals vary as the source and tests change, so do not rely on a fixed count in documentation.

### Run Linter

```bash
npm run lint
```

Fix any linting errors before committing.

---

## 5. Commit Guidelines

### Commit Message Format

```
#<issue>: <short description>

<detailed description>

<breaking changes if any>
```

**Example:**
```
#123: Add MySQL database handler support

- Implement IDatabaseMigrationHandler for MySQL
- Add connection pooling
- Include comprehensive tests for CRUD operations

No breaking changes.
```

**Rules:**
- Start with issue number (`#123`)
- Use imperative mood ("Add" not "Added")
- Keep first line under 72 characters
- Explain WHAT and WHY, not HOW
- Mention breaking changes

### Pre-Commit Hook

{: .note }
> **Automatic Quality Checks:** Pre-commit hooks run automatically when you commit, ensuring code quality before your changes reach the repository.

When you run `git commit`, these checks run automatically:

1. **TypeScript Type Check** - `npx tsc --noEmit`
2. **Build Check** - `npm run build`
3. **ESLint** - `npm run lint`
4. **Tests with Coverage** - `npm run test:coverage`
5. **Coverage Threshold** - `npx nyc check-coverage --lines 100 --branches 100 --functions 100 --statements 100`

The 100% coverage threshold is a local pre-commit requirement. GitHub Actions and CircleCI generate coverage reports but do not enforce this threshold.

**If checks fail:**
```bash
# Fix the issues, then run the relevant checks
npm run lint
npm test
npm run test:coverage
git add .
git commit -m "#123: Fix issues"
```

**Bypassing hooks (WIP commits only):**
```bash
# Use sparingly for work-in-progress commits on feature branches
git commit --no-verify -m "WIP: work in progress"
```

{: .warning }
> **Never bypass hooks** for commits to `master` or `release/*` branches. All merged code must pass quality checks.

See [Pre-Commit Hook](setup#pre-commit-hook) in the Setup guide for detailed information.

### What to Commit

**Do commit:**
- Source code changes (`src/`)
- Test changes (`test/`)
- Documentation changes (`docs/`)
- Configuration files if needed

**Don't commit:**
- `node_modules/`
- `dist/`
- `coverage/`
- `.nyc_output/`
- IDE-specific files (unless .gitignored)
- Personal notes or temp files

---

## 6. Creating a Pull Request

### Before Creating PR

**Checklist:**
- ✅ All tests pass (`npm test`)
- ✅ 100% coverage maintained
- ✅ No linting errors (`npm run lint`)
- ✅ Documentation updated
- ✅ Commits follow format
- ✅ Branch is based on the target specified by the issue and is up-to-date with that target

### Create PR

1. Push your task branch to the configured remote
2. Create a pull request into the selected target branch (the matching release branch for release-targeted tasks)
3. Fill out the PR template:
   - Link to issue (`Fixes #123`)
   - Description of changes
   - Testing done
   - Breaking changes (if any)

### PR Title Format

```
#<issue>: <description>
```

**Example:**
```
#123: Add MySQL database handler support
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Related Issue
Fixes #123

## Changes
- Added XYZ feature
- Fixed ABC bug
- Updated documentation for PQR

## Testing
- All existing tests pass
- Added 15 new test cases
- Coverage remains at 100%

## Breaking Changes
- None

OR

- Changed ABC API from X to Y
- Migration guide: [Migration Guide](../version-migration/)
```

---

## 7. Code Review Process

### What to Expect

1. **Automated Checks** - GitHub Actions runs lint, tests, and coverage reporting on supported branches; CircleCI runs the report workflow
2. **Maintainer Review** - Code review by maintainers
3. **Feedback** - Requested changes or approval
4. **Merge** - Task PRs merge into their target branch; release PRs promote `release/X.Y.Z` into `master`

### Addressing Feedback

```bash
# Make requested changes
# ... edit files ...

# Commit fixes
git add .
git commit -m "Address review feedback"

# Push updates
git push origin feature/my-feature
```

PR updates automatically.

### Common Review Feedback

- "Add tests for edge case X"
- "Update documentation for feature Y"
- "Refactor method Z for better clarity"
- "Fix linting errors"
- "Improve type safety (remove `any`)"

---

## 8. After Merge

### Clean Up

```bash
# Switch back to the branch that was the PR target
git checkout <target-branch>

# Update it from the configured remote
git pull <remote> <target-branch>

# Delete feature branch
git branch -d <task-branch>
git push <remote> --delete <task-branch>
```

### Your Contribution

Your changes are now part of MSR! 🎉

- Appears in next release
- Listed in CHANGELOG
- You're credited in contributors

---

## Best Practices

### 1. Small, Focused PRs

✅ **Good:**
- One feature per PR
- Clear scope
- Easy to review

❌ **Bad:**
- Multiple unrelated changes
- Huge diffs
- Hard to review

### 2. Test-Driven Development

```
1. Write failing test
2. Write code to make it pass
3. Refactor
4. Repeat
```

### 3. Frequent Commits

- Commit after each logical change
- Don't wait until everything is done
- Makes review easier

### 4. Update Documentation

- Update docs as you code
- Don't leave it until the end
- Helps reviewers understand changes

### 5. Keep Branch Updated

```bash
# Regularly sync with the selected PR target
git fetch <remote>
git rebase <remote>/<target-branch>
```

---

## Troubleshooting

### PR Conflicts

```bash
# Fetch latest PR target
git fetch <remote>

# Rebase the task branch onto the target
git rebase <remote>/<target-branch>

# Resolve conflicts
# ... edit files ...
git add .
git rebase --continue

# Push the rebased task branch (use --force-with-lease only if a rebase rewrote already-pushed commits)
git push <remote> <task-branch> --force-with-lease
```

### Failed CI Checks

1. Check CI logs for specific failure
2. Reproduce locally
3. Fix the issue
4. Push fix (CI runs again)

### Stale PR

If PR is open for a while:
1. Rebase on the latest PR target
2. Address any new feedback
3. Ping maintainers if needed

---

