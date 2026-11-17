---
layout: page
title: Testing and troubleshooting
permalink: /guides/cli-testing-troubleshooting/
parent: CLI Adapter Development
grand_parent: Guides
nav_order: 5
---

# Testing and troubleshooting
{: .no_toc }

Test an adapter CLI, handle errors, and troubleshoot common problems.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Testing Your CLI

### Unit Testing

Test your CLI by mocking the runner:

```typescript
import {expect} from 'chai';
import sinon from 'sinon';
import {createCLI} from '@migration-script-runner/core';

describe('CLI', () => {
  it('should create program with custom commands', () => {
    const createRunnerStub = sinon.stub();

    const program = createCLI({
      createRunner: createRunnerStub,
    });

    program.command('custom').action(() => {});

    const commands = program.commands.map(cmd => cmd.name());
    expect(commands).to.include('custom');
  });
});
```

### Integration Testing

Test actual command execution:

```typescript
import {createCLI} from '@migration-script-runner/core';

describe('CLI Integration', () => {
  it('should execute migrate command', async () => {
    const mockRunner = {
      migrate: sinon.stub().resolves({success: true, executed: []}),
    };

    const program = createCLI({
      createRunner: () => mockRunner as any,
    });

    program.exitOverride(); // Prevent process.exit in tests

    await program.parseAsync(['node', 'test', 'migrate']);

    expect(mockRunner.migrate.calledOnce).to.be.true;
  });
});
```

---

## Best Practices

1. **Initialize Handlers in createRunner**: Use the config parameter to initialize your database handler with the correct settings.

2. **Provide Sensible Defaults**: Use the `config` option to set default values for your adapter.

3. **Document Custom Commands**: Add clear descriptions to custom commands.

4. **Handle Database Errors**: Ensure your handler properly propagates errors to the CLI.

5. **Version Your CLI**: Keep the CLI version in sync with your adapter package version.

6. **Test CLI Commands**: Write both unit and integration tests for your CLI.

7. **Use Environment Variables**: Support environment variables for sensitive data like connection strings.

---

## Troubleshooting

### Error: "Property 'handler' is missing"

**Full Error:**
```
TypeError: Handler is required in IRunnerDependencies.
```

**Cause:** You're likely using `IRunnerOptions` in your constructor instead of `IRunnerDependencies`, or forgetting to create the handler before calling `super()`.

**Solution (Async Initialization):**
```typescript
// ✅ CORRECT
export class MyRunner extends MigrationScriptRunner<IDB, MyHandler> {
    constructor(deps: IRunnerDependencies<IDB, MyHandler>) {
        super(deps);  // ✅ Has handler
    }

    static async getInstance(options: IRunnerOptions<IDB>): Promise<MyRunner> {
        const handler = await MyHandler.connect(options.config);
        return new MyRunner({ handler, ...options });  // Spread options
    }
}
```

**Solution (Sync Initialization):**
```typescript
// ✅ CORRECT
export class MyRunner extends MigrationScriptRunner<IDB, MyHandler> {
    constructor(options: IRunnerOptions<IDB>) {
        const handler = new MyHandler(options.config);  // Create handler first
        super({ handler, ...options });  // Pass to parent
    }
}
```

**Wrong Pattern:**
```typescript
// ❌ WRONG
export class MyRunner extends MigrationScriptRunner<IDB, MyHandler> {
    constructor(options: IRunnerOptions<IDB>) {  // Missing handler!
        super(options);  // ❌ Error
    }
}
```

---

### Error: Generic Type Mismatch

**Full Error:**
```
Type 'IRunnerDependencies<IDB>' is not assignable to parameter of type 'IRunnerDependencies<IDB, MyHandler>'
```

**Cause:** You didn't specify the handler type in your constructor parameter.

**Solution:**
```typescript
// ❌ WRONG - Missing THandler generic
constructor(deps: IRunnerDependencies<IDB>) {
    super(deps);
}

// ✅ CORRECT - Include THandler
constructor(deps: IRunnerDependencies<IDB, MyHandler>) {
    super(deps);
}
```

---

### IRunnerOptions vs IRunnerDependencies

**When to use each:**

| Interface | Use In | Includes Handler? | Purpose |
|-----------|--------|-------------------|---------|
| `IRunnerOptions` | Public factory methods (`getInstance()`) | ❌ No | Public API for users |
| `IRunnerDependencies` | Constructor | ✅ Yes (required) | Internal API for construction |

**Pattern:**
```typescript
export class MyRunner extends MigrationScriptRunner<IDB, MyHandler> {
    // Constructor - uses IRunnerDependencies
    constructor(deps: IRunnerDependencies<IDB, MyHandler>) {
        super(deps);
    }

    // Public factory - uses IRunnerOptions
    static async getInstance(options: IRunnerOptions<IDB>): Promise<MyRunner> {
        const handler = await MyHandler.connect(options.config);
        // Spread IRunnerOptions into IRunnerDependencies
        return new MyRunner({ handler, ...options });
    }
}
```

---

### TypeScript Errors with Custom Config

**Issue:** You want to use a custom config type but getting type errors.

**Solution (v0.8.2+):**
```typescript
// Define custom config
class AppConfig extends Config {
    databaseUrl?: string;
    poolSize?: number;
}

// Use TConfig generic parameter
export class MyRunner extends MigrationScriptRunner<IDB, MyHandler, AppConfig> {
    constructor(deps: IRunnerDependencies<IDB, MyHandler, AppConfig>) {
        super(deps);
        // this.config is now typed as AppConfig
        console.log(this.config.databaseUrl);  // ✅ Type-safe!
    }

    static async getInstance(options: IRunnerOptions<IDB, AppConfig>): Promise<MyRunner> {
        const handler = await MyHandler.connect(options.config.databaseUrl);
        return new MyRunner({ handler, ...options });
    }
}
```

---

### Async Initialization Not Working

**Issue:** Your adapter requires async initialization but getting type errors or runtime issues.

**Solution:** Use the `createInstance` helper (v0.8.2+):

```typescript
export class MyRunner extends MigrationScriptRunner<IDB, MyHandler> {
    constructor(deps: IRunnerDependencies<IDB, MyHandler>) {
        super(deps);
    }

    static async getInstance(options: IRunnerOptions<IDB>): Promise<MyRunner> {
        return MigrationScriptRunner.createInstance(
            MyRunner,
            options,
            async (config) => MyHandler.connect(config)
        );
    }
}
```

**Benefits:**
- ✅ Standardized pattern
- ✅ Reduces boilerplate
- ✅ Type-safe
- ✅ Handles option spreading automatically

See [Async Adapter Initialization](cli-async-initialization#async-adapter-initialization-v082) for details.

---

### CLI Commands Not Working

**Issue:** Custom commands not appearing or getting type errors.

**Solution:** Use `extendCLI` callback with proper typing:

```typescript
const program = createCLI<IDB, MyRunner>({
    name: 'my-cli',
    createRunner: async (config) => MyRunner.getInstance({ config }),

    extendCLI: (program, createRunner) => {
        program
            .command('custom:command')
            .action(async () => {
                const adapter = await createRunner();  // ✅ Typed!
                const handler = adapter.getHandler();    // ✅ Access handler
                // Your custom logic
            });
    }
});
```

---

## Next Steps

- [Writing Migrations](./writing-migrations.html)
- [Configuration](../configuration/)
- [Environment Variables](./environment-variables.html)
- [Transaction Management](./transaction-management.html)

---

**Previous:** [Complete adapter example](cli-complete-example)
