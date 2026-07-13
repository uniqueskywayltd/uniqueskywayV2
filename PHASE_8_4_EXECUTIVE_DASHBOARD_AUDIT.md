# PHASE_8_4_EXECUTIVE_DASHBOARD_AUDIT.md

## Result

PASS

## Endpoint

`GET /api/admin/reports/executive` — permission `reports.read`

## Metrics

| Metric | Source |
| --- | --- |
| Total / verified / suspended customers | `customer_accounts`, `customer_profiles.kyc_status='approved'` |
| Active / matured investments | `investments.status` |
| Pending deposits / withdrawals | `deposit_intents` created+pending; withdrawals under_review+approved |
| Total deposits / withdrawals / ROI paid | confirmed deposit sums, paid withdrawal sums, posted `roi_ledger_entries` |
| System health summary | DB probe + failed jobs + webhook DLQ counts |
