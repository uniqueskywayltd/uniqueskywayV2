# DATE_TIME_LOCALIZATION_GUIDE.md

## Status

**APPROVED** — Stage 1 (`DEC-0060`, score **99.8 / 100**)
Companion to `GLOBAL_EXPERIENCE_SPECIFICATION.md` (Milestone 7 / `v3.3.0`)

## Hard constraints (frozen)

| Topic | Platform reality | Localization implication |
| --- | --- | --- |
| Financial timezone for settlement semantics | America/New_York (certified money movement) | Do not imply “local bank midnight” settlement |
| Storage | Prefer ISO-8601 / timestamptz honesty | Localize **display**, not storage |
| Profile timezone | Existing customer preference surfaces | Use for “wall clock” display where designed |

## Principles

### DT-001: Separate event time from settlement language

- **Event timestamps** (deposit confirmed, notification created): show in the customer’s display timezone when preference exists; otherwise a documented default with zone abbreviation when ambiguity matters.  
- **Settlement / business-day language**: remain honest to certified financial timezone and business-day rules—even if the customer is in Lagos, London, or Tokyo.

### DT-002: Prefer unambiguous date forms in UI

For customer money and statements:

- Prefer day-month-year with month name or unambiguous numeric forms informed by locale (`Intl.DateTimeFormat`).  
- Avoid US-only ambiguous `03/04/2026` in mixed audiences without locale-correct formatting.

### DT-003: Statements and exports

- Statement **period boundaries** remain defined by product rules (UTC or financial TZ as already certified)—localization does not redefine the period math.  
- Exported filenames and column headers may localize; ISO date columns in machine-oriented exports should stay unambiguous.

### DT-004: Relative time is secondary

“2 hours ago” may localize, but critical money events should still offer absolute local time on detail views.

### DT-005: Calendars

Phase 1 uses Gregorian display via `Intl`. Do not invent alternate fiscal calendars in UI without ADR.

### DT-006: Mail timestamps

Emails should include absolute times with offset or named zone when action deadlines matter (security OTPs may use relative copy carefully).

## Examples (illustrative)

| Context | Good | Bad |
| --- | --- | --- |
| ROI credit expectancy | “Credited on business days per platform settlement calendar” | “Your bank will clear overnight in your country” |
| Deposit confirmed | Local wall time + confirmation id | Translated id “for readability” |
| Statement period | Period defined by engine; labels translated | Changing period math per locale |

## Conflicts

Settlement honesty and `FINANCIAL_INVARIANTS.md` win over “what local banks usually do” copy.
