---
layout: default
title: License
nav_order: 11
---

# License
{: .no_toc }

Understanding MSR's licensing terms and your rights.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

Migration Script Runner is licensed under the **MIT License with Commons Clause and Attribution Requirements**. This is a source-available license that grants you broad permissions while protecting against commercial exploitation of the software itself.

### Quick Summary

- ✅ **Free to use** in your applications (including commercial)
- ✅ **Free to modify** and improve
- ✅ **Free to fork** and contribute
- ❌ **Cannot sell** as a standalone product
- 🔒 **Must attribute** when creating adapters/extensions

---

## License Type: MIT + Commons Clause + Attribution

This three-part license combines:

1. **MIT License** - Permissive base license
2. **Commons Clause** - Prevents selling the software itself
3. **Attribution Requirement** - Ensures proper credit for derivatives

---

## What You Can Do

### ✅ Allowed Without Restrictions

- Use MSR in commercial applications (SaaS, enterprise, startups)
- Use MSR in internal company tools
- Modify MSR for your specific needs
- Fork and contribute improvements
- Bundle MSR with your product
- Deploy MSR in production

### ✅ Allowed With Attribution

- Create and share database adapters (PostgreSQL, MySQL, etc.)
- Build extensions on top of MSR
- Create forks with new features

### ❌ Not Allowed

- Sell MSR as a standalone product
- Sell database adapters as products
- Offer "MSR-as-a-Service" commercially
- Create paid "Pro" versions of MSR

---

## Can I Use MSR?

### ✅ YES - These Are Allowed

#### Use in Your Application

```typescript
// Your commercial web application
import { MigrationScriptRunner } from '@migration-script-runner/core';
import { IDB } from '@migration-script-runner/core';

class ExampleRunner<DB extends IDB> extends MigrationScriptRunner<DB> {}


const runner = new ExampleRunner({ handler , config });
await runner.migrate();

// ✅ This is completely free
// ✅ No attribution required
// ✅ Sell your app freely
```

**Examples:**
- Netflix uses MSR for database migrations ✅
- E-commerce platform uses MSR internally ✅
- SaaS startup uses MSR in their product ✅
- Mobile app backend uses MSR ✅

---

#### Internal Company Use

```
Your Company:
├── Internal Tools (using MSR) ✅
├── Production Apps (using MSR) ✅
├── Development Environment (using MSR) ✅
└── CI/CD Pipelines (using MSR) ✅

No restrictions on internal use!
```

---

#### Contributing Improvements

```bash
# Fork MSR and fix a bug
git clone https://github.com/migration-script-runner/msr-core.git
# Make improvements
git commit -m "Fix: Resolve migration ordering issue"
# Submit PR
gh pr create

# ✅ Completely allowed and encouraged!
```

---

#### Creating Free Adapters

```typescript
// @yourname/postgres-adapter (FREE, open source)
export class PostgresHandler implements IDatabaseMigrationHandler<IDB> {
  // Your PostgreSQL implementation
}

// ✅ Allowed if you:
// 1. Include attribution to MSR
// 2. Make it free (not sold)
// 3. Share source code
```

---

### ❌ NO - These Are Prohibited

#### Selling as a Product

```
❌ "PostgreSQL Migration Tool" - $99/month
❌ "MSR Pro Edition" - $199/year
❌ "Database Migrator (powered by MSR)" - $49 license
❌ "MSR Cloud Service" - $50/month hosting
```

**Why prohibited:** The product's value derives primarily from MSR functionality.

---

#### Selling Adapters

```typescript
// ❌ Selling this as a product is prohibited
// "Premium PostgreSQL Adapter for MSR" - $29

export class PostgresHandler implements IDatabaseMigrationHandler<IDB> {
  // Cannot sell this as a standalone product
}
```

---

#### Paid Services Around MSR

```
❌ "MSR Consulting Services" - $200/hour
   (Focused specifically on MSR implementation)

❌ "MSR Support Subscription" - $99/month
   (Paid support for MSR issues)

❌ "Managed MSR Service" - $150/month
   (Hosting/managing MSR for clients)
```

**Note:** General consulting that includes MSR as one part of application development is allowed.

---

## Attribution Requirements

### When Attribution Is Required

You **MUST** provide attribution if you create:

1. **Database Adapters**
   - PostgreSQL, MySQL, MongoDB adapters
   - Custom database implementations

2. **Migration Tools**
   - Alternative migration runners
   - Enhanced versions of MSR
   - Forks with new features

3. **Extensions**
   - Plugins that extend MSR functionality
   - Tools built on MSR architecture

### When Attribution Is NOT Required

You **do NOT need** attribution if you:

- ✅ Use MSR as a library in your application
- ✅ Integrate MSR into your product
- ✅ Use MSR internally within your company
- ✅ Write applications that happen to use MSR

---

## How to Provide Attribution

If you're creating an adapter or extension, include this in your README and documentation:

```markdown
## Attribution

This project is based on [Migration Script Runner](https://github.com/migration-script-runner/msr-core)
by Volodymyr Lavrynovych.

Original project: https://github.com/migration-script-runner/msr-core
License: MIT with Commons Clause and Attribution
```

And in your LICENSE file:

```
Based on Migration Script Runner
Copyright (c) 2023-2025 Volodymyr Lavrynovych
https://github.com/migration-script-runner/msr-core

[Your License]
```

---

## Common Scenarios

### Scenario 1: Building a Web Application

**Question:** Can I use MSR in my commercial SaaS application?

**Answer:** ✅ **YES!** Use it freely. No attribution required.

```typescript
import { MigrationScriptRunner } from '@migration-script-runner/core';
import { IDB } from '@migration-script-runner/core';

class ExampleRunner<DB extends IDB> extends MigrationScriptRunner<DB> {}

// Your app.ts
const runner = new ExampleRunner({ handler , config });
await runner.migrate();

// Sell your SaaS product - completely allowed
```

---

### Scenario 2: Creating a PostgreSQL Adapter

**Question:** Can I create a PostgreSQL adapter and share it?

**Answer:** ✅ **YES!** But you must:
1. Include attribution to MSR
2. Make it free (cannot sell)
3. Include the LICENSE file

```markdown
# postgres-adapter/README.md

Based on Migration Script Runner by Volodymyr Lavrynovych
https://github.com/migration-script-runner/msr-core
```

---

### Scenario 3: Building "DB Migrator Pro"

**Question:** Can I build a commercial migration tool based on MSR?

**Answer:** ❌ **NO.** You cannot sell products where the primary value is MSR's functionality.

---

### Scenario 4: Consulting Services

**Question:** Can I offer consulting that includes MSR setup?

**Answer:** ✅ **YES, with conditions:**

✅ **Allowed:** "We'll build your application and set up MSR for migrations"
   (MSR is one component of broader services)

❌ **Prohibited:** "MSR Implementation Service - $5000"
   (Service focused specifically on MSR)

---

### Scenario 5: Internal Company Tools

**Question:** Our company wants to use MSR in 50 internal tools. Any restrictions?

**Answer:** ✅ **Absolutely none!** Internal use is completely unrestricted.

---

### Scenario 6: Open Source Project

**Question:** Can my open-source project use MSR?

**Answer:** ✅ **YES!** Open source projects can freely use MSR as a dependency with no restrictions.

---

## Why This License?

### Goals

1. **Keep MSR free** for everyone to use in their applications
2. **Prevent commercial exploitation** where someone sells MSR itself
3. **Encourage contributions** by ensuring extensions remain accessible
4. **Protect the ecosystem** of free database adapters

### What We Want

✅ Companies using MSR in their products (free usage)
✅ Developers creating free database adapters (with attribution)
✅ Community improvements and bug fixes
✅ MSR becoming the standard migration framework

### What We Don't Want

❌ Companies selling "PostgreSQL Migrator" built on MSR
❌ Closed-source commercial adapters
❌ "MSR-as-a-Service" products
❌ Fragmentation of paid tools in the ecosystem

---

## Comparison with Other Licenses

| License | Use in Apps | Sell Product | Attribution | Source Required |
|---------|-------------|--------------|-------------|-----------------|
| **MSR (MIT+CC+Attrib)** | ✅ Free | ❌ No | 🔒 For extensions | For extensions |
| **MIT** | ✅ Free | ✅ Yes | ❌ No | ❌ No |
| **LGPL** | ✅ Free | ⚠️ Complex | ✅ Always | ✅ Always |
| **Apache 2.0** | ✅ Free | ✅ Yes | ⚠️ Optional | ❌ No |

---

## FAQ

### Is this "open source"?

Technically, **no**. The Open Source Initiative (OSI) requires the freedom to sell software. However, MSR is **source-available** and free for all non-commercial-distribution purposes.

### Can I fork MSR?

✅ **Yes!** You can fork, modify, and improve MSR. Just:
1. Keep the attribution
2. Don't sell it as a product
3. Share your improvements

### What if I want to sell a product based on MSR?

Contact the author to discuss commercial licensing options. We're open to case-by-case arrangements.

### Can I use MSR at my company?

✅ **Absolutely!** Companies can freely use MSR in all their applications, tools, and services. No restrictions on commercial use as a library.

### Do I need to mention MSR in my app's credits?

❌ **No.** Only if you're creating migration tools/adapters. Regular application use requires no attribution.

### Can I create paid training courses about MSR?

✅ **Yes.** Educational content about MSR is allowed.

### What about competitors using MSR?

✅ **They can!** Even your direct competitors can use MSR in their products. That's intentional - MSR should be available to everyone.

---

## Questions?

If you have questions about licensing:

1. **Read the [LICENSE](https://github.com/migration-script-runner/msr-core/blob/master/LICENSE) file** in the repository
2. **Check the [NOTICE](https://github.com/migration-script-runner/msr-core/blob/master/NOTICE) file** for quick FAQ
3. **Open an issue** at [github.com/migration-script-runner/msr-core/issues](https://github.com/migration-script-runner/msr-core/issues)

---

## Full License Text

For the complete legal text, see the [LICENSE](https://github.com/migration-script-runner/msr-core/blob/master/LICENSE) file in the repository.

---

{: .text-center }
**TL;DR:** Use MSR freely in your apps. Don't sell MSR itself. Attribute if extending. Questions? Ask us!
