# PHASE_8_3_NOTIFICATION_TEMPLATE_AUDIT.md

## Result

PASS

## Channels

Catalog supports `email`, `in_app`, and future `sms`, `push`, `whatsapp` via `template_channel` enum.

## Operations

| Operation | Endpoint | Permission |
| --- | --- | --- |
| List | `GET /api/admin/notification-templates` | `notifications.manage` |
| Preview | `GET /api/admin/notification-templates/[key]` | `notifications.manage` |
| Enable / disable | `PATCH /api/admin/notification-templates/[key]` | `notifications.manage` |
| Test | `POST /api/admin/notification-templates/[key]/test` | `notifications.manage` |

## Notes

Test action enqueues an outbox event (`admin.notification_template.test`) without changing delivery workers.
