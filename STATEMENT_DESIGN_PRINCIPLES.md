# STATEMENT_DESIGN_PRINCIPLES.md

## Status

**ACCEPTED** — `DEC-0050`  
Experience authority for customer statements in Milestone 6 (`v3.2.0`).  
Complements:

| Document | Governs |
| --- | --- |
| `STATEMENT_EXPERIENCE_GUIDE.md` | Product scope & STA-* rules |
| `STATEMENT_DESIGN_PRINCIPLES.md` | **Experience** — reading order, layout, empties, downloads |
| `STATEMENT_DATA_DICTIONARY.md` | **Data fields** (required before G5) |
| `DEC-0047` | Ledger projection only — no independent math |

## North star (`EP-029`)

> **Can I understand my financial history?**

Understanding first. Download and export are secondary.

## Monthly statement philosophy

1. A month is a **New York calendar month** (`America/New_York`), labeled explicitly.  
2. The statement is an **activity projection** of certified postings for that period — not a redesigned ledger.  
3. Customers should grasp, in order: **what period**, **period totals**, **what moved**, **how to go deeper**.  
4. Quiet, printable, adult — same calm brand as Wave B money UX.  
5. Empty months are honest success, not failure.

## Reading order (detail)

1. Title & statement type  
2. Period label + timezone  
3. Generated / projected at (timestamp)  
4. One-line understanding summary (“Totals are summed from your ledger for this period.”)  
5. Period summary hierarchy (below)  
6. Line items (chronological or reverse-chronological — reverse default to match ledger)  
7. Related investment activity (if type includes it)  
8. Links: live ledger · wallet · portfolio · Success Hub  
9. Legal / disclaimer footer  

## Summary hierarchy

Highest → lowest importance:

1. **Period credit total** (posted credits in scope)  
2. **Period debit total** (posted debits in scope)  
3. **Net of this period’s lines** (credits − debits of listed lines only — clearly labeled as period activity net, **not** available balance)  
4. Counts (number of line items)  
5. Category tips only if directly summed from line `walletCategory`  

**Never** present invented opening/closing “available balance” unless reconstructed end-to-end from certified history and labeled as such in the data dictionary. Prefer omitting fake closing balances.

## Print layout

- Single column; system font stack OK for print  
- Mono or tabular figures for amounts  
- Page margins ≥ 0.5in  
- Header repeats statement title + period on each printed page when possible  
- Color never sole carrier of credit vs debit (use +/− or Cr/Dr labels)  
- `prefers-reduced-motion` irrelevant for print; keep on-screen motion minimal  

## Mobile layout

- Sticky “Period” chip under title  
- Summary cards stack vertically  
- Line items: amount right-aligned; swipe not required  
- Download CTA reachable without covering money figures  
- Search/filters collapse into a single “Filter” disclosure  

## Download experience

1. Preview on-screen first (STA-003).  
2. Primary: **Download CSV** of the same projected lines (presentation of certified data).  
3. Optional: **Print** (browser print of detail).  
4. Confirm quietly: “Download started — same totals as on screen.”  
5. Record download in **download history** (audit-backed).  
6. PDF may wrap the same HTML/print view later — no second math engine (`DEC-0047`).

## Empty states

| State | Message intent |
| --- | --- |
| No periods yet | “No posted activity to statement yet. When deposits, ROI, or withdrawals post, months appear here.” → wallet / ledger |
| Period with zero lines | Should not normally appear; if filter yields none → “No statements match” + clear filters |
| Detail with no lines | “No activity in this period.” → adjust period |
| Download history empty | “No downloads yet. Open a statement and download CSV when you need a copy.” |

## Generated date

- Show **Projected at** = server time when the projection was built.  
- Clarify: “Rebuilt from your ledger each time you open it — totals stay ledger-honest.”  
- Do not pretend immutable archival PDF storage in G2 unless product stores a sealed artifact later.

## Timezone presentation

- Always show: `Timezone: America/New_York (financial calendar)`  
- Period label example: `June 2026` with parenthetical `2026-06-01 → 2026-06-30 (NY)`  
- Line timestamps may show absolute ISO rendered in NY via existing date display components  

## Legal footer (minimum)

Include on every detail/print/export footer:

> Unique Sky Way statements project posted ledger activity for the stated period. They are not tax advice. Accrued earnings that are not yet credited are not included unless explicitly labeled. For personal tax questions, consult a qualified professional.

## Customer explanations (microcopy anchors)

- “Can I understand my financial history?”  
- “These totals match your ledger for this period.”  
- “Net activity is not your available balance.”  
- “Pending deposits may appear on your wallet before they post here.”  

## Explicit non-goals (G2)

- ROI formula changes  
- New ledger accounts or posting rules  
- Tax calculation engines  
- Admin reporting rebuild  
- Invented closing balances  
- Casino celebration on download  

## Acceptance (experience)

- [ ] Reading order followed on detail  
- [ ] NY timezone labeled  
- [ ] Footer present  
- [ ] Empty states honest  
- [ ] Download matches on-screen lines  
- [ ] No independent financial figures  
