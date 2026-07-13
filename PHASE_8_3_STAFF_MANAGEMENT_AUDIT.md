# PHASE_8_3_STAFF_MANAGEMENT_AUDIT.md

## Result

PASS

## Capabilities

| Capability | API / Service | Permission |
| --- | --- | --- |
| Staff search | `GET /api/admin/staff` | `staff.manage` |
| Staff details (roles, sessions, login history, last activity) | `GET /api/admin/staff/[userId]` | `staff.manage` |
| Staff invite | `POST /api/admin/staff` | `staff.manage` |
| Activate / disable | `PATCH /api/admin/staff/[userId]/status` | `staff.manage` |
| Lock / unlock | `POST .../lock`, `POST .../unlock` | `staff.manage` |
| Role assignment | `PUT /api/admin/staff/[userId]/roles` | `staff.manage` |
| Reset password | `POST .../reset-password` | `staff.reset_password` |
| Force password change | `POST .../force-password-change` | `staff.manage` |
| Session revoke | `POST .../sessions/[sessionId]/revoke` | `staff.manage` |

## Persistence

- `admin_profiles` extended with `must_change_password`, `last_active_at`, `disabled_at`, `disabled_reason`
- `staff_invites` / `staff_invite_roles` for invite workflow
- Existing `sessions` / `security_events` reused for session management and login history

## Audit

Invite, status, roles, password reset, force password change, and session revoke append `audit_logs` with actor, permission used, before/after where applicable.
