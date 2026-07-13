# PHASE_8_3_SECURITY_CENTER_AUDIT.md

## Result

PASS

## Surfaces

| Surface | Source | Permission |
| --- | --- | --- |
| Security events | `security_events` | `security.read` |
| Admin activity | `audit_logs` (actorType=admin) | `security.read` |
| Audit log search | `GET /api/admin/audit-logs` | `audit.read` |
| System health | `GET /api/admin/system/health` | `monitoring.read` |

## Health Snapshot

Application status, queue counts, webhook failure/DLQ counts, memory, load average, uptime, package version, git commit, and release tag.

## Sensitive Operations

Permission changes, role changes, staff lock/unlock, session revocations, password resets, and template/settings/flag mutations all write audit records with permission used and request hashes.
