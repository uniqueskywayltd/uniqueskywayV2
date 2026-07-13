# PHASE_8_3_FEATURE_FLAGS_AUDIT.md

## Result

PASS

## Operations

| Operation | Endpoint | Permission |
| --- | --- | --- |
| List | `GET /api/admin/feature-flags` | `featureflags.manage` |
| Create / update | `POST /api/admin/feature-flags` | `featureflags.manage` |

## Controls

- Enable / disable via `status`
- Scheduled windows: `schedule_start_at`, `schedule_end_at`
- Percentage rollout: `rollout_percent`
- Internal only: `internal_only`
- Seed examples include `maintenance_mode`, `registration_enabled`, `withdrawals_enabled`, `deposits_enabled`, `investment_creation_enabled`, `email_delivery_enabled`, `referrals_enabled`

## Audit

Upserts append `feature_flag.upserted` with before/after snapshots.
