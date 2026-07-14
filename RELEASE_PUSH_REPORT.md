# RELEASE_PUSH_REPORT.md

## Release

**v3.2.0** — Customer Success Experience (Milestone 6)

Date: 2026-07-13

## Hashes

| Object | Hash |
| --- | --- |
| Release commit (`HEAD` / `main` / `v3.2.0^{}`) | `eb0d555bd94ab1a3fbd646af1cfeb01ad3e6d4b2` |
| Annotated tag object (`v3.2.0`) | `d9f8ec8089d6ab0e0fd426a182c7bf5c1b71e8cc` |

Commit subject: *Certify Milestone 6 Customer Success Experience as v3.2.0.*

## Pre-push verification

| Check | Result |
| --- | --- |
| Working tree clean | PASS |
| Branch `main` | PASS |
| `HEAD` == intended release commit | PASS (`eb0d555…`) |
| Tag `v3.2.0` is annotated | PASS |
| Tag peels to release commit | PASS |

## Push status

| Ref | Status |
| --- | --- |
| `origin/main` | PUSHED (`2e8e670` → `eb0d555`) |
| `origin/v3.2.0` | PUSHED (new annotated tag) |

## Post-push verification

| Check | Result |
| --- | --- |
| `origin/main` == local `HEAD` | PASS (`eb0d555…`) |
| `origin/v3.2.0` exists | PASS |
| Tag target == release commit | PASS |
| `main` in sync with `origin/main` | PASS |

## Gates (certification)

| Gate | Result |
| --- | --- |
| Lint | PASS |
| Typecheck | PASS |
| Unit tests | PASS — 198 |
| `db:check` | PASS |
| Production build | PASS |
| E2E | PASS — 44 |

## Notes

- No production code was modified for the G5 certification package (docs, ADRs, audits only).
- Remote host: `https://github.com/uniqueskywayltd/uniqueskywayV2.git`
- After verification, this report may be committed docs-only. Annotated tag **`v3.2.0` remains on release commit `eb0d555`** (intentionally not moved).
- ADRs: **DEC-0058** (Customer Success Certified), **DEC-0059** (v3.2.0 Frozen).
