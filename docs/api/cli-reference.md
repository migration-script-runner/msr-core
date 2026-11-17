---
layout: default
title: CLI Reference
parent: API Reference
nav_order: 9
---

# CLI Reference
{: .no_toc }

Commands and options registered by `createCLI()` in MSR Core.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

`createCLI()` registers seven built-in top-level commands. Adapters provide a `createRunner` factory and can add their own commands and options. See [CLI Adapter Development](../guides/cli-adapter-development) for the full setup guide.

```typescript
import { createCLI } from '@migration-script-runner/core';

const program = createCLI({
  createRunner: (config, {logger, renderStrategy}) => new PostgresRunner({ handler, config, logger, renderStrategy })
});

program.parse(process.argv);
```

The examples below use `msr` as the executable name. An adapter may set a different name with `CLIOptions.name`.

## Global options

The following options are registered on the root command and apply to built-in commands:

| Option | Description | Values / behavior |
|---|---|---|
| `-c, --config-file <path>` | Select a configuration file. | Path to a supported config file. |
| `--folder <path>` | Override the migration directory. | Path. |
| `--table-name <name>` | Override the schema version table. | String. |
| `--display-limit <number>` | Limit migration rows displayed. | Number. |
| `--dry-run` | Preview migrations without executing them. | Boolean flag. |
| `--no-lock` | Disable migration locking for this run. | Boolean flag. |
| `--logger <type>` | Choose the CLI logger. | `console`, `file`, `silent`. |
| `--log-level <level>` | Set output verbosity. | `error`, `warn`, `info`, `debug`. |
| `--log-file <path>` | Set the log file path. | Required when `--logger file` is selected. |
| `--format <format>` | Select the output format. | `table`, `json`. |
| `--backup-mode <mode>` | Override backup behavior; other values are rejected. | `full`, `create_only`, `restore_only`, `manual`. |

Values outside the documented choices for `--logger`, `--log-level`, `--format`, and `--backup-mode` are rejected before a runner is created.

When `--logger` is provided, `createCLI()` passes the selected logger to the second `createRunner` argument as `{logger}`. Pass it into the runner dependencies so the selected logger is used. If the flag is omitted, `logger` is `undefined` and the runner's default applies.

When `--log-level` is provided, `createCLI()` applies it to `config.logLevel` before calling the runner factory. If omitted, a level loaded from configuration or the default remains in effect.

When `--format json` is provided, `createCLI()` passes a `JsonRenderStrategy` to the runner factory. `--format table` and an omitted `--format` use the runner's default table strategy.

Adapter-defined options are registered with `addCustomOptions`; see [Adapter options and flags](../guides/cli-options-and-flags).

## Commands

### `migrate [targetVersion]`

Run pending migrations. The `up` alias invokes the same command.

```bash
msr migrate
msr migrate 202501220100
msr up --dry-run
```

`targetVersion` is an optional numeric migration timestamp. All global options are available.

### `list`

Show the migration history. `--number` limits the display; `0` means all.

```bash
msr list
msr list --number 10
msr list -n 10 --format json
```

| Option | Description | Default |
|---|---|---|
| `-n, --number <count>` | Number of migrations to display. | `0` (all) |

### `down <targetVersion>`

Roll back to the target migration timestamp. `targetVersion` is a required positional argument.

```bash
msr down 202501220100
msr down 202501220100 --logger console --log-level debug
```

All global options are available. The rollback requires usable `down()` migration methods or a configured rollback strategy that supports the operation.

### `validate`

Validate migration scripts without executing migrations.

```bash
msr validate
msr validate --config-file ./msr.config.yaml
```

All global options are available. A validation failure returns a non-zero exit code.

### `backup`

The `backup` command contains three operations:

| Command | Behavior | Example |
|---|---|---|
| `backup create` | Create a backup. | `msr backup create` |
| `backup restore [backupPath]` | Restore from the given path, or the most recent backup when omitted. | `msr backup restore ./backups/pre-deploy.bkp` |
| `backup delete` | Delete the current backup file. | `msr backup delete` |

Global options are available on these commands.

### `lock:status`

Display whether a migration lock is configured, unlocked, or held, and show lock metadata when available.

```bash
msr lock:status
```

If the handler has no locking provider, the command reports that locking is not configured.

### `lock:release`

Force-release a stale migration lock. This is a dangerous administrative operation; confirm that no migration is running before using it.

```bash
msr lock:release --force
```

| Option | Description |
|---|---|
| `-f, --force` | Required to proceed without the safety prompt. |

## Adapter-specific options and commands

Use `addCustomOptions(program)` to register adapter flags and `extendFlags(config, flags)` to map flat flag names to adapter configuration. Dot-notation flags are mapped into nested config automatically. Numeric and boolean string values are coerced; numeric path segments create arrays.

```typescript
addCustomOptions: (program) => {
  program.option('--db.url <url>', 'Database URL');
  program.option('--db.timeout <milliseconds>', 'Connection timeout');
}
```

```bash
msr migrate \
  --db.url postgresql://localhost/app \
  --db.timeout 5000
```

See [Nested Configuration Flags](../guides/cli-options-and-flags#nested-configuration-flags) and [Custom Commands](../guides/cli-custom-commands).

## Exit codes

| Code | Meaning |
|---:|---|
| `0` | Success. |
| `1` | General or unknown error. |
| `2` | Validation failure. |
| `3` | Migration execution failure. |
| `4` | Rollback failure. |
| `5` | Backup creation failure. |
| `6` | Restore failure. |
| `7` | Database connection error. |

## Configuration precedence

For `createCLI()`, configuration is loaded from built-in defaults, then a config file, environment variables, `CLIOptions.config`, built-in CLI flags, and finally adapter `extendFlags` mapping. The last source that sets a property wins. See the [configuration reference](../configuration/config-reference#configuration-loading).

## Related references

- [MigrationScriptRunner API](migration-script-runner)
- [Configuration reference](../configuration/config-reference)
- [CLI Adapter Development](../guides/cli-adapter-development)
