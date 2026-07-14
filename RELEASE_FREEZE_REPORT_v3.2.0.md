# RELEASE_FREEZE_REPORT_v3.2.0.md

## Release

**`v3.2.0` — Customer Success Experience (Frozen)**

Date: 2026-07-13  
Tag: annotated SemVer **`v3.2.0`**  
Freeze decisions: `DEC-0058`, `DEC-0059`

## Scope shipped since v3.1.0

- Success Hub + progress framework (G1)
- Ledger-projected statements (G2)
- Learning experience (G3)
- Responsible referral hub (G4)
- Certification package + statement data dictionary (G5)

## Gate verdict

All G5 gates PASS (lint, typecheck, unit 198, db:check, build, e2e 44).

## Post-freeze policy

Do not casually modify Milestone 6 surfaces without ADR, regression tests, and (where required) UX/recertification. Next train: International Platform `v3.3.0` under Design → Approve → Implement.
