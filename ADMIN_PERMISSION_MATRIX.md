# ADMIN_PERMISSION_MATRIX.md

## Purpose

This document is the single source of truth for Unique Sky Way V2 administrative authorization.

It defines:

- System roles
- Permission keys
- Default role → permission grants
- Elevated privilege rules
- Future two-person approval candidates

Runtime authorization must load grants from the database (`permissions`, `role_permissions`, `user_roles`).  
This matrix is the seed and governance baseline. Changing grants in production must be audited.

Related decisions:

- `DEC-0022` — Money movement frozen
- `DEC-0016` — Investment engine locked

Phase 8.3 implements configurable RBAC. Phase 8.1/8.2 capability checks must resolve through these permission keys.

## System Roles

| Role key | Display name | Purpose |
| --- | --- | --- |
| `super_admin` | Super Admin | Full platform control including staff and roles |
| `platform_admin` | Administrator | Platform configuration and operational administration |
| `finance_manager` | Finance Manager | Full finance review authority |
| `finance_officer` | Finance Officer | Day-to-day deposit/withdrawal review |
| `support_manager` | Support Manager | Customer support leadership |
| `support_agent` | Support Agent | Customer support read/write notes |
| `compliance_officer` | Compliance Officer | KYC, suspensions, compliance review |
| `auditor` | Auditor | Read-only audit and security visibility |
| `read_only` | Read Only | Read-only operational visibility |

Legacy keys retained for compatibility:

| Legacy key | Maps to |
| --- | --- |
| `finance_admin` | Treated as `finance_manager` grants at seed time; prefer `finance_manager` / `finance_officer` going forward |
| `platform_admin` | Remains `platform_admin` |

## Permission Catalog

Permission keys use dotted namespaces. Keys are stable API identifiers.

### Customer administration

| Key | Description | Elevated |
| --- | --- | --- |
| `customers.read` | Search and view customer details | No |
| `customers.update` | Update non-financial customer profile fields | No |
| `customers.suspend` | Restrict / reactivate / close customer accounts | Yes |
| `customers.notes` | Create customer notes | No |
| `customers.kyc` | Update KYC / risk verification state | Yes |

### Financial operations (wrap certified engines only)

| Key | Description | Elevated |
| --- | --- | --- |
| `deposits.read` | View deposit queues and details | No |
| `deposits.review` | Review deposits, add deposit notes | Yes |
| `deposits.approve` | Approve or reject deposits via certified engine | Yes |
| `withdrawals.read` | View withdrawal queues and details | No |
| `withdrawals.review` | Review withdrawals, add withdrawal notes | Yes |
| `withdrawals.approve` | Approve, reject, or queue payouts via certified engine | Yes |
| `investments.read` | Read-only investment viewer | No |
| `settlements.read` | Read-only settlement viewer | No |

### Reporting (Phase 8.4)

| Key | Description | Elevated |
| --- | --- | --- |
| `reports.read` | View operational reports | No |
| `reports.export` | Export CSV / Excel | Yes |

### Communications templates

| Key | Description | Elevated |
| --- | --- | --- |
| `emails.manage` | Manage email template catalog enablement / test send | Yes |
| `notifications.manage` | Manage notification template catalog | Yes |

### Platform administration

| Key | Description | Elevated |
| --- | --- | --- |
| `featureflags.manage` | Create and toggle feature flags | Yes |
| `system.manage` | Manage system settings | Yes |
| `roles.manage` | Create/edit/disable roles and assign permissions | Yes |
| `permissions.manage` | View permission catalog and role grants | Yes |
| `staff.manage` | Invite, activate, disable staff; manage staff roles | Yes |
| `staff.reset_password` | Trigger staff password reset | Yes |
| `audit.read` | View global audit logs | No |
| `jobs.manage` | View and retry/cancel background jobs | Yes |
| `security.read` | View security center events | No |
| `monitoring.read` | View financial monitoring and system health | No |
| `overview.read` | View admin overview metrics | No |

## Default Role Grants

`✓` = granted at seed. Empty = not granted.

| Permission | super | platform | finance_mgr | finance_off | support_mgr | support | compliance | auditor | read_only |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `customers.read` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `customers.update` | ✓ | ✓ | | | ✓ | | ✓ | | |
| `customers.suspend` | ✓ | | | | | | ✓ | | |
| `customers.notes` | ✓ | ✓ | | | ✓ | ✓ | ✓ | | |
| `customers.kyc` | ✓ | | | | | | ✓ | | |
| `deposits.read` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `deposits.review` | ✓ | ✓ | ✓ | ✓ | | | | | |
| `deposits.approve` | ✓ | ✓ | ✓ | ✓ | | | | | |
| `withdrawals.read` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `withdrawals.review` | ✓ | ✓ | ✓ | ✓ | | | | | |
| `withdrawals.approve` | ✓ | ✓ | ✓ | ✓ | | | | | |
| `investments.read` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `settlements.read` | ✓ | ✓ | ✓ | ✓ | | | | ✓ | ✓ |
| `reports.read` | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ | ✓ |
| `reports.export` | ✓ | ✓ | ✓ | | | | ✓ | | |
| `emails.manage` | ✓ | ✓ | | | | | | | |
| `notifications.manage` | ✓ | ✓ | | | | | | | |
| `featureflags.manage` | ✓ | ✓ | | | | | | | |
| `system.manage` | ✓ | ✓ | | | | | | | |
| `roles.manage` | ✓ | | | | | | | | |
| `permissions.manage` | ✓ | ✓ | | | | | | ✓ | |
| `staff.manage` | ✓ | | | | | | | | |
| `staff.reset_password` | ✓ | | | | | | | | |
| `audit.read` | ✓ | ✓ | ✓ | | ✓ | | ✓ | ✓ | |
| `jobs.manage` | ✓ | ✓ | ✓ | | | | | | |
| `security.read` | ✓ | ✓ | | | ✓ | | ✓ | ✓ | |
| `monitoring.read` | ✓ | ✓ | ✓ | ✓ | | | | ✓ | |
| `overview.read` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Legacy `finance_admin` receives the same grants as `finance_manager`.

## Elevated Privilege Rules

Elevated actions require:

1. Active staff user (`users.status = active`)
2. Active `admin_profiles` row
3. Active role grant containing the permission
4. Audit log with actor, permission used, target, before/after when applicable
5. Explicit reason for: customer suspend/close, KYC changes, deposit/withdrawal approve/reject, role/permission changes, staff disable

## Future Two-Person Approval Candidates

Not implemented in Phase 8.3. Reserved for later ADR:

- High-value withdrawal approval above a configurable threshold
- Customer permanent close
- Role permission grant of `roles.manage` or `staff.manage`
- Disabling `deposits_enabled` / `withdrawals_enabled` / `investment_creation_enabled` feature flags
- Super admin creation

## Compatibility Mapping (Phase 8.1 / 8.2)

| Previous capability string | Canonical permission |
| --- | --- |
| `admin.users.read` | `customers.read` |
| `admin.users.restrict` | `customers.suspend` |
| `admin.kyc.review` | `customers.kyc` |
| `admin.users.notes.write` | `customers.notes` |
| `admin.deposits.read` | `deposits.read` |
| `admin.deposits.review` | `deposits.approve` |
| `admin.withdrawals.read` | `withdrawals.read` |
| `admin.withdrawals.review` | `withdrawals.approve` |
| `admin.investments.read` | `investments.read` |
| `admin.settlements.read` | `settlements.read` |
| `admin.monitoring.read` | `monitoring.read` |
| `admin.overview.read` | `overview.read` |
| `admin.financial.notes.write` | `deposits.review` / `withdrawals.review` |

Application code must use canonical permission keys. Compatibility aliases may exist only in a temporary resolver during migration.

## Change Control

Any change to this matrix requires:

1. ADR when introducing new elevated financial permissions or two-person approval
2. Seed/migration update for default grants
3. Regression tests for authorization
4. Audit coverage for grant/revoke paths
