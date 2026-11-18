---
layout: default
title: Mutation Testing
parent: Testing
nav_order: 1
---

# Mutation Testing Guide
{: .no_toc }

This project uses [Stryker Mutator](https://stryker-mutator.io/) for mutation testing to verify the quality of our test suite.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## What is Mutation Testing?

Mutation testing validates test quality by:
1. Introducing intentional bugs ("mutations") into the source code
2. Running the test suite against each mutation
3. Checking if tests catch the bugs

If tests don't catch a mutation, it indicates:
- Missing test coverage
- Weak test assertions
- Tests that don't actually verify behavior

## When to Run Mutation Tests

{: .note }
> **Mutation testing is not part of the regular pull request checks** because it takes substantially longer than the regular test suite.

### Recommended Usage

Run mutation tests in these scenarios:

- **After major test suite changes**: When you've added significant new tests
- **Before releases**: As part of the release quality checklist
- **Monthly or on demand**: Run the dedicated GitHub Actions workflow to track test quality without tying up a local machine
- **When investigating test quality**: If you suspect tests are passing without properly validating behavior
- **During test refactoring**: To ensure refactored tests still catch bugs effectively

### Not Recommended

- ❌ On every commit or pull request (too slow)
- ❌ During active development cycles (use incremental mode instead)
- ❌ In parallel with other tests (resource intensive)

---

## Running Mutation Tests

### Full Mutation Test Run

⚠️ **Warning**: A full mutation run can take hours, depending on the source files and runner capacity.

```bash
npm run test:mutation
```

**Use this for:**
- Release quality checks
- Scheduled CI jobs
- Initial mutation test runs
- Comprehensive quality assessment

### Incremental Mutation Testing

Only tests changes since the last run (much faster for iterative development):

```bash
npm run test:mutation:incremental
```

**Use this for:**
- Local development and testing
- Iterating on new test cases
- Quick validation after code changes
- Daily development workflow

### View Results

After running, open the HTML report:

```bash
open reports/mutation/mutation-report.html
```

## Understanding the Results

### Mutation Score

The **mutation score** indicates test quality:
- **90-100%**: Excellent - Tests catch almost all bugs
- **80-89%**: Good - Most bugs are caught
- **60-79%**: Fair - Significant gaps in test coverage
- **< 60%**: Poor - Tests may miss critical bugs

### Mutation Status

- **Killed**: ✅ Test detected the mutation (good!)
- **Survived**: ❌ Mutation wasn't caught by tests (bad!)
- **Timeout**: ⏱️ Test took too long (possible infinite loop)
- **No Coverage**: 📍 Code not covered by any test
- **Runtime Error**: 💥 Mutation caused a crash (good!)

## Configuration

See `stryker.conf.json` for configuration:
- **mutate**: Which files to mutate
- **thresholds**: Quality thresholds
  - `break: 50%` - Build fails below 50%
  - `low: 60%` - Warning below 60%
  - `high: 80%` - Target above 80%
- **maxConcurrentTestRunners**: Parallel test execution (adjust based on your CPU)

## Performance Tips

1. **Use incremental mode** during development
2. **Increase `maxConcurrentTestRunners`** if you have a powerful CPU
3. **Exclude slow tests** from mutation testing (if any)
4. **Run mutation tests in CI/CD** overnight or on a schedule

## Common Mutations

Stryker tests various mutation types:

| Mutation Type | Example | Description |
|---------------|---------|-------------|
| **Arithmetic** | `+` → `-` | Changes operators |
| **Conditional** | `>` → `>=` | Modifies comparisons |
| **Boolean** | `&&` → `\|\|` | Alters logic |
| **String** | `"text"` → `""` | Changes literals |
| **Array** | `arr.length` → `0` | Modifies arrays |
| **Block** | Removes statements | Tests statement necessity |

## Improving Mutation Score

If mutations survive:

1. **Add missing assertions**: Tests may be too vague
   ```typescript
   // Bad
   it('should return result', () => {
     const result = calculate(5);
     expect(result).toBeDefined(); // Weak!
   });

   // Good
   it('should return result', () => {
     const result = calculate(5);
     expect(result).toBe(25); // Specific!
   });
   ```

2. **Test edge cases**: Boundary conditions often survive
   ```typescript
   it('should handle zero', () => {
     expect(calculate(0)).toBe(0);
   });

   it('should handle negative numbers', () => {
     expect(calculate(-5)).toBe(25);
   });
   ```

3. **Test error paths**: Ensure error handling is tested
   ```typescript
   it('should throw on invalid input', () => {
     expect(() => calculate(null)).toThrow();
   });
   ```

## GitHub Actions Workflow

The `Mutation Tests` workflow runs on demand and monthly from the default branch. It selects a random sample from the current tracked TypeScript files under `src/` (except `src/index.ts`). Manual runs accept a `sample_size` input, which defaults to five; the monthly run also samples five files. Newly tracked source files automatically join the candidate pool. The run ID is used as the random seed, and the workflow summary records the selected files, pool size, mutation score, and seed.

To start a run manually, open **Actions → Mutation Tests → Run workflow**. The selected files are tested together and the JSON report is uploaded as an artifact; a summary job publishes the mutation score and the exact sample to the workflow summary. The workflow must first be present on the repository's default branch before GitHub can offer the manual run button.

## Troubleshooting

### "Stryker is stuck"

- Check `reports/mutation/mutation-report.html` for timeout mutations
- Increase `timeoutMS` in `stryker.conf.json`

### "Out of memory"

- Reduce `maxConcurrentTestRunners` in `stryker.conf.json`
- Increase Node memory: `NODE_OPTIONS=--max_old_space_size=4096 npm run test:mutation`

### "Too slow"

- Use incremental mode: `npm run test:mutation:incremental`
- Exclude benchmark tests temporarily
- Run on powerful CI/CD servers instead of locally

## References

- [Stryker Documentation](https://stryker-mutator.io/)
- [Mutation Testing Explained](https://stryker-mutator.io/docs/mutation-testing-elements/introduction/)
- [Best Practices](https://stryker-mutator.io/docs/General/guides/best-practices/)
