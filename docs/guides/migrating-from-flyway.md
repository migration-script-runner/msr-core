---
layout: default
title: Migrating from Flyway
parent: Guides
nav_order: 14
---

# Migrating from Flyway to MSR
{: .no_toc }

A cautious migration plan for teams moving an existing Flyway project to MSR Core.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Start with the adapter and migration history

Flyway and MSR both run ordered migrations and keep a database history, but the history formats and migration identifiers are different. MSR Core is database-agnostic: it does not include a database driver or automatically import Flyway's history. Before changing application code or migration files, confirm that an MSR adapter exists for the database and can safely represent the existing applied-migration state. If there is no suitable adapter, implement and verify that database integration first.

A database adapter alone does not imply a Flyway history importer. If an adapter intended for Flyway migration becomes available, verify its supported Flyway versions, migration states, and import behavior against the actual project before relying on it.

Do not point MSR at a production database with an empty MSR history table and assume it will infer what Flyway has already applied. That can cause old migrations to execute again. Treat migration-history transfer as a required cutover step.

## Inventory the Flyway project

Record the current setup before changing it:

- Database engine, schemas, Flyway version, configuration, migration locations, and active environments.
- Every versioned, repeatable, baseline, and undo migration, in Flyway's actual execution order.
- Applied, pending, ignored, failed, out-of-order, and baselined entries from `flyway info` and `flyway_schema_history`.
- Use of callbacks, placeholders, target versions, `outOfOrder`, custom validation, or other Flyway-specific behavior.
- How the deployment pipeline chooses credentials, serializes deployments, and runs migrations.

Flyway records applied versions, checksums, and execution results in its schema history table. That table is an implementation detail of Flyway; do not modify or drop it as an assumed part of an MSR migration. Keep a verified backup and a read-only copy of the history for the cutover audit. See Flyway's [schema history reference](https://documentation.red-gate.com/flyway/flyway-concepts/migrations/flyway-schema-history-table) and [versioned migration guide](https://documentation.red-gate.com/fd/versioned-migrations-273973333.html).

## Map behavior explicitly

| Flyway project element | MSR migration consideration |
|------------------------|-----------------------------|
| Versioned SQL files, such as `V001.002__AddIndex.sql` | MSR's built-in SQL format uses timestamped `V{timestamp}_{name}.up.sql` files and optional matching `.down.sql` files. Preserve each SQL script's meaning and order; create a deterministic version crosswalk if identifiers change. |
| Applied migration history | MSR's [`ISchemaVersion`](../api/interfaces/schema-version) contract stores numeric migration timestamps and MSR execution metadata. Implement a reviewed mapping/import or a verified baseline strategy so already-applied changes are not run again. |
| Repeatable migrations (`R__...`) | Flyway reruns these when their checksum changes. Do not treat them as one-time MSR migrations without deciding how future edits should be applied. Convert them into explicit versioned changes or design and test an equivalent process. |
| Baseline version or baseline migration | Preserve the current schema as the starting state for existing databases. Test separately how a new empty database will be initialized; a baseline for existing environments and a bootstrap migration for new environments may have different roles. |
| Placeholders | Find every placeholder and decide how its value will be supplied safely in the MSR project. Do not replace secrets with committed literal values. |
| Callbacks and deployment hooks | Map each required action to an MSR lifecycle hook or to an explicit deployment step. Confirm ordering and failure behavior rather than assuming callback equivalence. |
| Undo migrations | MSR uses its configured rollback strategy and optional `.down.sql` files. Compare the behavior and operational safeguards with the Flyway edition and commands currently in use. |
| `filePatterns` | A custom pattern can change which filenames MSR recognizes; it does not import Flyway history or reproduce Flyway's repeatable, baseline, callback, or validation semantics. See [migration settings](../configuration/migration-settings#filepatterns). |

MSR's built-in SQL migration naming and database requirements are described in the [SQL Migrations Guide](sql-migrations). Do not rename a large migration directory mechanically before confirming how the chosen adapter derives and stores migration identifiers.

## Plan the cutover

1. **Freeze changes to the migration set.** Agree on a short window or a specific commit so the Flyway inventory and conversion map cannot drift during the transition.
2. **Create the conversion map.** For every Flyway migration, record its original version and filename, the MSR filename and numeric timestamp, whether it is already applied in each environment, and any behavior that needs a separate implementation.
3. **Prepare history handling.** Decide whether the adapter will read/import Flyway records into the MSR contract or whether each environment will receive a verified MSR baseline. Test this on a restored database copy. Preserve Flyway's table through the validation period.
4. **Convert pending migrations only after mapping identifiers.** Keep SQL content unchanged where possible. Review every edit required for naming, placeholders, dialect, or handler behavior. New MSR migrations must sort after the imported or baselined state.
5. **Test two database states.** On a clone containing the existing Flyway schema, prove that MSR identifies historical migrations as applied and runs only pending work. On a clean database, prove that the new initialization path reaches the expected schema and data state.
6. **Switch one migration owner at a time.** Update the deployment command and pipeline as one reviewed cutover. Do not let Flyway and MSR independently apply migrations to the same environment during the transition.
7. **Observe before cleanup.** Compare resulting schema and migration records across environments. Retain Flyway scripts and its history table until the team has verified the cutover and agreed on their archival or removal.

Never run the first MSR migration against production as a way to discover whether history mapping is correct. Use a disposable database or a restored production-like copy first; obtain explicit authorization before applying migrations to shared or production databases.

## Cutover acceptance checks

- Every Flyway migration has a documented MSR disposition: imported as applied, represented by a baseline, converted to pending MSR work, or intentionally retired with a rationale.
- The existing database clone receives no replay of migrations already applied by Flyway.
- A clean database can be initialized using the documented MSR path.
- Repeatables, callbacks, placeholders, baselines, and rollback behavior have explicit tested decisions.
- The application and CI/CD pipeline have one clear migration owner after cutover.
- Backup, recovery, and rollback responsibilities are understood before production use.

## References

- [Flyway schema history table](https://documentation.red-gate.com/flyway/flyway-concepts/migrations/flyway-schema-history-table)
- [Flyway versioned migrations](https://documentation.red-gate.com/fd/versioned-migrations-273973333.html)
- [Flyway repeatable migrations](https://documentation.red-gate.com/flyway/flyway-concepts/migrations/repeatable-migrations)
- [MSR SQL Migrations Guide](sql-migrations)
- [MSR schema-version interface](../api/interfaces/schema-version)
- [MSR migration settings](../configuration/migration-settings)
