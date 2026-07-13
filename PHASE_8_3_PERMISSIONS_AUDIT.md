# PHASE_8_3_PERMISSIONS_AUDIT.md

## Result

PASS

## Model

- Catalog table: `permissions`
- Grants table: `role_permissions`
- Effective keys resolved via active `user_roles` + active roles
- Typed keys: `src/application/admin/capabilities.ts`
- Governance: `ADMIN_PERMISSION_MATRIX.md`

## Hardcoding Ban

Authorization decisions use `listActivePermissionKeysForUser`. Role names are not used as permission switches in production paths.

Test fixtures mirror the matrix only in `test-role-permissions.ts` for unit tests.

## Catalog Coverage

Includes customer, deposits, withdrawals, investments, settlements, reports, emails, notifications, feature flags, system, roles, permissions, staff, audit, jobs, security, monitoring, and overview namespaces without duplicated synonyms.
