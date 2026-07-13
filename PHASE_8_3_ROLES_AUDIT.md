# PHASE_8_3_ROLES_AUDIT.md

## Result

PASS

## System Roles Seeded

`super_admin`, `platform_admin`, `finance_manager`, `finance_officer`, `support_manager`, `support_agent`, `compliance_officer`, `auditor`, `read_only` (+ legacy `finance_admin` compatibility grants)

System roles are marked `is_system = true` and cannot be disabled or deleted.

## Operations

| Operation | Endpoint | Notes |
| --- | --- | --- |
| List / create | `GET|POST /api/admin/roles` | Custom roles are configurable |
| Get / edit / delete unused | `GET|PATCH|DELETE /api/admin/roles/[roleId]` | Delete blocked if assignments exist |
| Set permissions | `PUT /api/admin/roles/[roleId]/permissions` | Replaces grants from catalog keys |
| Clone | `POST /api/admin/roles/[roleId]/clone` | Copies permission keys |
| Disable | `POST /api/admin/roles/[roleId]/disable` | Non-system only |

## Audit

Role create/update/disable/delete/permission changes write `audit_logs` with before/after payloads.
