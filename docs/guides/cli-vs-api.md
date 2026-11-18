---
layout: default
title: CLI vs API Usage
parent: Guides
nav_order: 9
---

# CLI vs API: When to Use Each
{: .no_toc }

Choose whether migrations should run as a separate deployment command or from application code. Both approaches use the same MSR Core runner and database adapter.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Quick decision guide

| Situation | Suggested approach | Reason |
|-----------|--------------------|--------|
| Production deployment | CLI in one deployment job | Runs before application instances start and separates migration credentials from app credentials. |
| CI/CD validation or deployment | CLI | The command and its result are visible in the job log. |
| Local development | API or CLI | Use the API to integrate with a local app workflow, or the CLI for a repeatable command. |
| Automated tests | API | Test setup and teardown can be controlled by the test runner. |
| Multiple application instances | One CLI job or API with locking | Neither CLI nor API prevents concurrent runs by itself. Use one migration process or configure adapter locking. |
| Serverless deployment | CLI in the deployment pipeline | Avoid running migrations once per function instance or request. |

For the API, MSR exposes methods such as `up()`, `down()`, `list()`, and `validate()`. For CLI use, an adapter supplies the executable and registers commands through Core's `createCLI()` factory. See the [CLI reference](../api/cli-reference) and [CLI adapter development](cli-adapter-development).

---

## The CLI approach

### What it is

The CLI approach runs migrations as a separate process, usually in a release command, CI/CD job, container job, or operator-run task. This makes it straightforward to run the migration once before application instances are updated.

MSR Core does not publish a standalone `msr` executable. The database adapter provides the CLI executable. The examples below use `my-adapter-cli` as a placeholder; replace it with the executable from your adapter.

Add an npm script to your application:

```json
{
  "scripts": {
    "migrate": "my-adapter-cli migrate"
  }
}
```

Run migrations before starting the application:

```bash
npm run migrate
npm start
```

### When to use the CLI

- **Production deployments:** Run a single migration job before rolling out application instances.
- **CI/CD:** Validate or migrate in an explicit pipeline step and stop the deployment if it fails.
- **Manual operations:** Run or inspect migrations with the adapter's commands and visible output.
- **Container platforms:** Use a one-off job or deployment task instead of starting migrations in every replica.
- **Separate credentials:** Give the migration job schema-change permissions while keeping the application account more restricted, where your database supports this split.

### Benefits and limits

| Benefit | What it means |
|---------|---------------|
| **🔒 Credential separation** | The migration process can use a separate account from the running application. |
| **🎯 Explicit execution** | Deployment configuration shows when migrations run. |
| **📊 Visible output** | Migration logs appear with the deployment or CI/CD job. |
| **🚦 Startup control** | The application rollout can wait for a successful migration job. |
| **⚠️ Concurrency still matters** | Starting the same CLI command from several jobs or replicas can still create concurrent runs. Use a single job or adapter locking. |

### CI/CD example

```yaml
- name: Run database migrations
  run: npm run migrate
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Docker Compose example

The application image needs the adapter CLI and the `migrate` npm script. The database must be reachable using `DATABASE_URL`. The migration service runs once; the application waits for it to finish successfully.

```yaml
services:
  migrate:
    image: myapp:latest
    command: ["npm", "run", "migrate"]
    environment:
      DATABASE_URL: ${DATABASE_URL}
    restart: "no"

  app:
    image: myapp:latest
    command: ["npm", "start"]
    environment:
      DATABASE_URL: ${DATABASE_URL}
    depends_on:
      migrate:
        condition: service_completed_successfully
```

For Kubernetes, use a Job or a deployment system's pre-deployment step, rather than an init container in every application pod. See [Docker and Kubernetes](docker-kubernetes) for container configuration details.

---

## The API approach

### What it is

The API approach creates an adapter runner in application code and calls its migration methods directly. It is useful when the application or test framework must control the migration lifecycle.

```typescript
import {
  Config,
  IDB,
  IDatabaseMigrationHandler,
  MigrationScriptRunner
} from '@migration-script-runner/core';

class ExampleRunner<DB extends IDB> extends MigrationScriptRunner<DB> {}

export async function runMigrations(
  handler: IDatabaseMigrationHandler<IDB>,
  config: Config
) {
  const runner = new ExampleRunner<IDB>({ handler, config });
  return runner.up();
}
```

The handler is created by your database adapter; the configuration can be loaded or constructed by your application. The example declares both as function parameters so the runner dependencies are explicit.

### When to use the API

- **Local development:** Integrate migrations with an application startup or developer command.
- **Automated tests:** Prepare a database before each suite and roll it back or recreate it afterward.
- **Application-controlled workflows:** Run migrations from an administration tool or another controlled process.
- **A dedicated migration process:** Use the API in a one-off process when it is easier to construct the adapter in code than in a CLI command.

Avoid running migrations independently from every web-server or serverless instance. If the API runs in a multi-instance environment, coordinate it through a single process or configure the adapter's [migration locking](../configuration/locking-settings).

### Benefits and limits

| Benefit | What it means |
|---------|---------------|
| **🔄 Programmatic control** | Decide when to call `up()`, `down()`, `validate()`, or other runner methods. |
| **🧪 Test integration** | Prepare and clean up test databases from test lifecycle hooks. |
| **📦 In-process access** | Use the runner and handler from application code without invoking another process. |
| **⚠️ Deployment responsibility** | Your code must ensure migrations run at the right time and are not started by every replica. |

### Startup example

Pass the handler and configuration from the application composition root. Handle a failed result before accepting traffic:

```typescript
async function prepareApplication(
  handler: IDatabaseMigrationHandler<IDB>,
  config: Config,
  startServer: () => Promise<void>
): Promise<void> {
  const runner = new ExampleRunner<IDB>({ handler, config });
  const result = await runner.up();

  if (!result.success) {
    throw new Error(`Migration failed: ${result.errors?.map((error) => error.message).join(', ')}`);
  }

  await startServer();
}
```

Only call this from one controlled process in a deployment. If every application instance calls it, configure [locking](../configuration/locking-settings) and confirm the adapter implements the locking provider.

### Test setup example

The test runner supplies the handler and test configuration. `down(0)` rolls back migrations to version zero, so use it only with a disposable test database.

```typescript
async function setupTestDatabase(
  handler: IDatabaseMigrationHandler<IDB>,
  config: Config
): Promise<void> {
  const runner = new ExampleRunner<IDB>({ handler, config });
  const result = await runner.up();

  if (!result.success) {
    throw new Error(`Test database migration failed: ${result.errors?.map((error) => error.message).join(', ')}`);
  }
}

async function teardownTestDatabase(
  handler: IDatabaseMigrationHandler<IDB>,
  config: Config
): Promise<void> {
  const runner = new ExampleRunner<IDB>({ handler, config });
  await runner.down(0);
}
```

---

## Common mistakes

### Starting migrations from every replica

This can cause competing processes to migrate at once. Prefer one deployment job. If your architecture requires startup migrations, implement adapter locking and verify it is configured for every instance.

### Giving the application account unnecessary schema permissions

Where the database allows it, use a migration account for schema changes and a more restricted account for normal application queries. Choose permissions based on the operations your migrations and application actually need.

### Ignoring migration failures

Check the `success` value returned by `up()` and fail the deployment or startup before serving traffic. Do not continue as if migrations succeeded.

### Mixing CLI and API without coordination

Both approaches can be used in one project, for example CLI in production and API in tests. Ensure they cannot start concurrently against the same database unless locking is configured.

---

## Platform patterns

- **CI/CD:** Run the npm migration script as a deployment step and stop the rollout if it fails.
- **Kubernetes:** Run one Job before updating the application Deployment.
- **Docker Compose:** Use a one-off migration service and wait for successful completion.
- **Serverless:** Run migrations in CI/CD or a separate deployment task; do not run them from every function invocation.

Platform command syntax changes over time. Follow the deployment platform's current documentation and point its migration step to the same adapter CLI script used locally.

---

## Best practices

- Use a single migration process per deployment, or configure adapter locking for concurrent environments.
- Keep the migration command in an npm script so local and deployment usage stay consistent.
- Separate migration credentials from application credentials when practical.
- Validate migrations in CI/CD and stop the deployment when validation or execution fails.
- Keep migration output in CI/CD or deployment logs.
- Use the API for controlled application workflows and test setup, not as an uncoordinated action in every replica.

---

## Quick reference

| Goal | Suggested approach |
|------|--------------------|
| Deploy to production | One CLI migration job before application rollout |
| Run migrations locally | CLI script or API, depending on the development workflow |
| Prepare a test database | API in test setup |
| Deploy to Kubernetes | One Job or deployment step, not one migration command per pod |
| Run in CI/CD | Adapter CLI through `npm run migrate` |
| Embed migrations in an application | API with explicit failure handling and deployment coordination |

---

## FAQ

### Can I use the API in production?

Yes, if a controlled process runs it once before application instances start, or if the adapter's locking implementation safely coordinates concurrent attempts. A CLI command does not provide concurrency protection by itself; deployment orchestration and locking determine that.

### What if my platform has no pre-deployment hook?

Run a separate migration job or task in CI/CD before updating the application. A Kubernetes Job or a manual deployment step can serve the same purpose.

### How should serverless applications run migrations?

Run migrations in the deployment pipeline or a dedicated task. Avoid triggering them from each cold start or request. If a dedicated process may overlap with another, configure locking.

### Can I use CLI and API in one project?

Yes. For example, use the adapter CLI in deployment and the API in tests. Coordinate both so they do not run simultaneously against the same database unless locking is configured.
