## Instructions

### Work Pattern (MANDATORY)

Every code change MUST follow this three-step pattern:

1. **Update the code** - Make the necessary changes to source files
2. **Update/fix/add tests** - Ensure 100% test coverage is maintained
3. **Update the documentation** - Update ALL relevant files in `/docs`

**Never skip any step.** A task is NOT complete until all three steps are done.

When completing a task, verify:
- ✅ Code changes are complete
- ✅ Tests pass with 100% coverage
- ✅ Documentation (/docs) is updated

### Code Quality Standards (SonarCloud)

All rules below are based on SonarCloud issues fixed in #109. Follow these to prevent code quality regressions.

#### Type Safety
- **Never use `any` type** in production or test code - always use specific types or generics
  - ❌ BAD: `function process(data: any): any`
  - ✅ GOOD: `function process<T>(data: T): T` or `function process(data: ConfigData): ProcessedResult`
- **Never use `as any`** type assertions in production or test code
- When creating mock objects for tests, cast the entire object to the interface rather than individual properties
  - ✅ GOOD: `{ backup: {...} } as IDatabaseMigrationHandler`
  - ❌ BAD: `{ backup: {...}, db: {} as any, schemaVersion: {} as any }`
- Avoid double-casting patterns like `as any as SomeType` - populate required properties instead
- For edge case testing where a property must be invalid, only cast that specific property

#### Module Imports
- **Use `node:` prefix for built-in Node.js modules** - improves clarity and follows modern conventions
  - ✅ GOOD: `import * as fs from 'node:fs'`
  - ✅ GOOD: `import * as path from 'node:path'`
  - ✅ GOOD: `import { promises as fsPromises } from 'node:fs'`
  - ❌ BAD: `import * as fs from 'fs'`
  - ❌ BAD: `import * as path from 'path'`
- Apply to all built-in modules: `node:fs`, `node:path`, `node:util`, `node:crypto`, etc.

#### Immutability
- **Use `readonly` modifier for fields that are never reassigned** - prevents accidental mutations
  - ✅ GOOD: `private readonly logger: ILogger`
  - ✅ GOOD: `private readonly config: CollectorConfig`
  - ❌ BAD: `private logger: ILogger` (if never reassigned after constructor)
- Apply to class fields, interface properties, and array types where appropriate

#### Code Complexity
- **Keep function cognitive complexity below 15** - break down complex functions into smaller ones
  - Split complex conditionals into named helper functions
  - Extract nested loops into separate methods
  - Use early returns to reduce nesting depth
  - SonarCloud tracks: nesting levels, boolean operators, recursion, jumps (break/continue)

#### Code Clarity
- **Avoid negated conditions** - use positive logic for better readability
  - ❌ BAD: `if (!isInvalid) { process(); }`
  - ✅ GOOD: `if (isValid) { process(); }`
  - ❌ BAD: `if (!config) { throw error; } else { use(config); }`
  - ✅ GOOD: `if (config) { use(config); } else { throw error; }`
- **Avoid nested template literals** - extract to separate variables for clarity
  - ❌ BAD: `` `Outer ${`Inner ${value}`}` ``
  - ✅ GOOD: `const inner = `Inner ${value}`; const outer = `Outer ${inner}`;`

#### Error Types
- **Use specific error types** - helps with error handling and debugging
  - ✅ GOOD: `throw new TypeError('Expected string, got number')`
  - ✅ GOOD: `throw new RangeError('Value must be between 0 and 100')`
  - ❌ BAD: `throw new Error('Expected string, got number')` (for type validation)
- Use `TypeError` for type validation failures
- Use `RangeError` for value range violations
- Use `Error` only for general errors that don't fit specific categories

#### Completeness Verification
- When making systematic changes (like refactoring APIs or updating documentation):
  1. Use grep/search to find ALL instances of the pattern across the codebase
  2. Count the instances and track them
  3. Verify completion by re-running the search before claiming the task is done
  4. Show verification steps in the work process

#### Documentation Updates
- When API signatures change, update ALL documentation files, not just the obvious ones
- Check these locations systematically:
  - Main documentation files (getting-started.md, index.md, etc.)
  - API reference docs
  - Guide files (guides/*.md)
  - Architecture docs
  - Migration guides (should show BEFORE and AFTER examples)
  - Related feature docs (rendering/*.md, loggers/*.md, etc.)

### Project Architecture

#### Design Principles
- Follow **Single Responsibility Principle** - services should have focused, clear responsibilities
- Prefer **dependency injection** - pass dependencies explicitly rather than embedding them
- Maintain **separation of concerns** - keep configuration, business logic, and data access separate

#### Documentation Standards
- **All public APIs must have JSDoc comments** - classes, interfaces, methods, and functions
- JSDoc should include:
  - Clear description of purpose and behavior
  - `@param` tags for all parameters with descriptions
  - `@returns` tag describing return value and type
  - `@throws` tag for any exceptions that may be thrown
  - `@example` tags showing typical usage patterns
- Keep JSDoc concise but complete - explain the "why" and "what", not just the "how"

#### Testing Standards
- **Maintain 100% test coverage** - all branches, lines, functions, and statements must be covered for 100%
- When adding new code, always add corresponding tests to maintain 100% coverage
- When modifying existing code, update tests and verify coverage remains at 100%
- Keep test output clean using appropriate loggers (SilentLogger in tests)
- Mock only what's necessary for the test - avoid over-specification
- Use proper interface casting for type safety in mocks
- You can use reflection or even update source code for better testability

#### Test Assertions
- **All tests must include assertions** - tests without assertions are BLOCKER issues
  - ❌ BAD: `it('should call handler', async () => { await executor.run(); })`
  - ✅ GOOD: `it('should call handler', async () => { await executor.run(); expect(handlerSpy).to.have.been.called; })`
- **Specify concrete error types in `.to.throw()`** - validates that the right error type is thrown
  - ✅ GOOD: `expect(() => fn()).to.throw(Error, 'Expected message')`
  - ✅ GOOD: `expect(() => fn()).to.throw(TypeError, filePath)`
  - ❌ BAD: `expect(() => fn()).to.throw()` - too generic, MAJOR issue
  - ❌ BAD: `expect(() => fn()).to.throw(Error)` - missing message validation, MAJOR issue
- **Include error message validation** - ensures the right error is thrown with the right message
  - The second parameter to `.to.throw()` can be:
    - A specific error message string
    - A file path or identifier that appears in the error
    - A regex pattern matching the expected message
- **Each test should verify specific behavior** - avoid generic catch-all assertions



## Git Workflow

### IMPORTANT: Git Operations Policy

- **NEVER commit or stage changes unless explicitly requested**
- **NEVER push to remote unless explicitly requested**
- When asked to "close the issue", ONLY close the issue on GitHub
  - Do NOT close if not asked
  - Do NOT commit changes
  - Do NOT stage files
  - Do NOT push changes
- Only perform git operations (commit, stage, push) when the user explicitly asks for them

### When to Perform Git Operations

**Only execute these when directly requested:**
- `git add` / `git stage` - Only when user says "stage changes" or "add files"
- `git commit` - Only when user says "commit" or "create a commit"
- `git push` - Only when user says "push"
- `gh issue close` - Only when user says "close issue #X"

**These are separate operations** - closing an issue does NOT imply committing or pushing.

### Issue Creation Standards

When creating new GitHub issues:

- **ALWAYS assign labels** based on `/docs/config/labels.yml`
  - Add appropriate type label (🐛 Bug, ✨ Feature, 🧹 Tech Debt, 📝 Documentation, etc.)
  - Add priority label (🔥 Critical, ⚡ High, 🟡 Medium, 🟢 Low)
  - Add testing effort label (🟢 Low, 🟡 Medium, 🔴 High, ❌ Not Needed)
  - Add additional labels as appropriate (📚 Needs: Documentation, 🧪 Needs: Tests, etc.)
- **ALWAYS assign the issue to `vlavrynovych`**

Example:
```bash
gh issue create --title "Add feature X" --body "..." \
  --label "✨ Type: Feature" \
  --label "🟡 Priority: Medium" \
  --label "🟡 Test: Medium" \
  --assignee vlavrynovych
```

### Standard Issues for Every Versioned Release

For every **versioned release milestone** (vX.Y.Z), ensure exactly one Code Review issue and one Documentation Review issue exist and belong to that milestone. This applies whether the milestone is new or already exists. Search open and closed issues first; create only missing issues. If an equivalent issue already exists, verify its scope, labels, assignee, and milestone.

When creating a new versioned milestone, create or verify both standard issues as part of milestone setup.

#### 1. Code Review Issue
```bash
gh issue create \
  --milestone "vX.Y.Z" \
  --title "Code Review: vX.Y.Z quality and consistency improvements" \
  --label "🧹 Type: Tech Debt" \
  --label "⚡ Priority: High" \
  --label "❌ Test: Not Needed" \
  --assignee vlavrynovych \
  --body "[Use template from #109 as reference]"
```

**Purpose:** Comprehensive code review of all changes to ensure quality, consistency, and best practices.

**Must include:**
- SonarQube analysis review
- Code quality checks (complexity, duplication, type safety)
- Performance review
- Architecture adherence
- Testing completeness
- Documentation completeness

#### 2. Documentation Review Issue
```bash
gh issue create \
  --milestone "vX.Y.Z" \
  --title "Documentation Review: Update docs and create vX.(Y-1).x → vX.Y.Z migration guide" \
  --label "📝 Type: Documentation" \
  --label "⚡ Priority: High" \
  --label "❌ Test: Not Needed" \
  --assignee vlavrynovych \
  --body "[Use template from #110 as reference]"
```

**Purpose:** Systematic documentation review and migration guide creation.

**Must include:**
- Migration guide creation (v[previous] → v[current])
- Systematic review of all /docs files
- README.md updates with "What's New" section
- Version reference updates
- Link validation

**Examples:**
- v0.5.0: Issues #94 (Code Review) and #95 (Documentation)
- v0.6.0: Issues #109 (Code Review) and #110 (Documentation)

**Note:** These issues ensure every release maintains quality standards and provides clear upgrade paths for users.

### Commit Message Standards

#### Format

```
#<issue number>: <concise title>

<body describing what and why>
```

#### Rules

- **DO NOT** add AI attribution (no "🤖 Generated with Codex" or "Co-Authored-By: Codex")
- **Title**: Concise, imperative mood (e.g., "Add feature" not "Added feature")
- **Issue number**: Always reference the issue number with `#` prefix
- **Body**: Explain WHAT changed and WHY, not HOW
  - Use bullet points for multiple changes
  - Include context for future developers
  - Mention breaking changes if any

#### Examples

**Good:**
```
#58: Add SQL migration files support with ISqlDB interface

Implemented golang-migrate style SQL migrations (.up.sql/.down.sql files).

Added loader architecture:
- IMigrationScriptLoader interface for extensible file handling
- ILoaderRegistry for dynamic loader registration
- TypeScriptLoader and SqlLoader implementations

Added ISqlDB interface:
- Explicit contract with query(sql: string) method
- Type-safe validation with type guard pattern

Breaking changes:
- Removed deprecated filePattern property from Config
- filePatterns now required with default values
```

**Bad:**
```
Fixed stuff

Updated some files and made it work better.

🤖 Generated with Codex
```

## MSR Core Repository-Specific Instructions

These additions reflect the current repository configuration. Keep them aligned with `package.json`, `.github/workflows/`, `.circleci/config.yml`, `.husky/pre-commit`, and the development guides.

### GitHub project management

Before any GitHub issue, pull request, milestone, label, GitHub Release, tag, or npm publication operation, read [`docs/development/github-project-workflow.md`](docs/development/github-project-workflow.md) and follow it. Its procedures are mandatory. Search and inspect existing remote state before writing, then verify every authorized change. Do not perform a remote mutation unless the user explicitly requests it.

- For task PR creation or updates, use the project skill [`.agents/skills/msr-github-pr/SKILL.md`](.agents/skills/msr-github-pr/SKILL.md) and its helper script. It applies the repository title, target branch, assignee, labels, milestone, and Development-link rules. The command requires an already-pushed, clean task branch; it never commits or pushes.
- Link the related issue through GitHub's **Development** relationship. Do not put `Closes #<issue>` in the PR description. The script creates and verifies the manual link through GitHub GraphQL's `addCloseIssueReferences` mutation.

### SonarCloud issue retrieval

- For findings tied to a pull request, retrieve the issue payload from SonarCloud's `/api/issues/search` endpoint. Include `pullRequest`, `componentKeys`, `organization`, and `issueStatuses=OPEN,CONFIRMED`; use `s=IMPACT_RANK`, `sinceLeakPeriod=true`, `facets=impactSoftwareQualities,impactSeverities`, and `additionalFields=_all` when reproducing the release-review report.
- Page through the results. Read `total` and `paging` from the response, request `p=1..N` with `ps=50` (or another suitable page size), and confirm the collected issue count matches `total`. A request with `ps=1` returns one issue plus the total/facets; it does not return the complete list.
- Inspect each issue's `key`, `rule`, `severity`, `impacts`, `component`, `line`, and `message`; facets summarize counts and are not a substitute for the issue rows. Add severity/quality filters only when intentionally narrowing the report, and also retrieve the unfiltered list for complete triage.

Example URL pattern:

```text
https://sonarcloud.io/api/issues/search?pullRequest=<PR>&componentKeys=<project>&organization=<organization>&ps=50&p=<page>&facets=impactSoftwareQualities%2CimpactSeverities&s=IMPACT_RANK&sinceLeakPeriod=true&issueStatuses=OPEN%2CCONFIRMED&additionalFields=_all
```

### Current validation setup

- The package requires Node.js `>=20.0.0`. GitHub Actions currently tests Node.js 20.x and 22.x; CircleCI currently uses Node.js 20.18.
- Install dependencies from the lockfile with `npm ci`. The package `prepare` script installs Husky.
- CI and some tests expect a `backups/` directory; create it with `mkdir -p backups` when needed.
- Use the npm scripts that exist in `package.json`, including `npm run build`, `npm run lint`, `npm test`, `npm run test:coverage`, and `npm run test:mutation`. The documentation site uses `npm run docs:install` and `npm run docs:build`.
- `npm test` runs lint and the Mocha test suite. `npm run test:coverage` generates a coverage report.
- The local `.husky/pre-commit` hook runs `npx tsc --noEmit`, build, lint, tests with coverage, and `nyc check-coverage` with 100% thresholds for statements, branches, functions, and lines.
- User decision: retain the 100% coverage threshold as a local hook requirement. GitHub Actions and CircleCI may report coverage, but MUST NOT fail CI based on that threshold unless the user explicitly changes this decision.
- GitHub Actions currently runs on pushes to `master`, `develop`, and `release/*`; pull request events target `master` and `develop`. Check the current workflow before relying on CI to run for a PR into another base branch.

### Branch and release workflow

- Choose the base branch from the issue's milestone and the current release plan.
- For an issue assigned to a versioned milestone `vX.Y.Z`, use the matching `release/X.Y.Z` branch as the task base when it exists. Create a task branch from it and target the task PR back to that release branch.
- Promote a completed release with a separate PR from `release/X.Y.Z` into `master`, titled `Release vX.Y.Z`.
- For work without a versioned release target, use the base branch specified by the issue or maintainer; otherwise use `master`.
- If a versioned milestone has no matching release branch, do not create one or guess a target; confirm the intended release target first.
- Name task branches `<type>/<description>`. Existing prefixes include `feature/`, `fix/`, `docs/`, `refactor/`, `test/`, `chore/`, and `hotfix/`.
- Before creating a branch or PR, check the current issue/milestone and any existing release PRs. Keep the task branch up to date with its selected target.
- Tags matching `v*` trigger npm publication via `.github/workflows/npm-publish.yml`. Do not create or push a release tag, publish a package, or manually trigger the publishing workflow unless the user explicitly asks.
