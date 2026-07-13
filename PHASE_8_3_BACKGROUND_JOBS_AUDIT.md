# PHASE_8_3_BACKGROUND_JOBS_AUDIT.md

## Result

PASS

## Operations

| Operation | Endpoint | Permission |
| --- | --- | --- |
| List (status filter) | `GET /api/admin/jobs` | `jobs.manage` |
| Retry | `POST /api/admin/jobs/[jobId]/retry` | `jobs.manage` |
| Cancel | `POST /api/admin/jobs/[jobId]/cancel` | `jobs.manage` |

## Visibility

Statuses covered: pending (queued), running, completed, failed, cancelled.

Retry resets failed/cancelled jobs to pending. Cancel marks jobs cancelled and clears locks.

## Audit

`background_job.retried` and `background_job.cancelled` capture before/after status.
