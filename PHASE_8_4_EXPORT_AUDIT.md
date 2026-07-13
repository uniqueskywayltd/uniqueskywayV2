# PHASE_8_4_EXPORT_AUDIT.md

## Result

PASS

## Formats

- CSV (`text/csv`)
- Excel `.xlsx` via `exceljs`

## Security

- Requires `reports.export`
- Writes `report.exported` audit log with report key, filters, format, row count, truncation flag, IP/UA hashes
- Hard row cap: 10,000 with `truncated` metadata
