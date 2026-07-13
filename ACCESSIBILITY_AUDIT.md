# ACCESSIBILITY_AUDIT.md

## Result: PASS (WCAG AA+ target)

## Checks

| Area | Status | Evidence |
| --- | --- | --- |
| Semantic HTML | PASS | `main`, `article`, headings, lists, native FAQ `<details>` |
| Skip link | PASS | Root layout skip to `#main-content` |
| Keyboard | PASS | Nav (incl. mobile), forms, accordion summaries, tabs, links |
| Focus visibility | PASS | Focus rings via design-system input/button patterns |
| ARIA | PASS | Landmarks via `aria-label` purposes; live region on contact success; FAQ tabs |
| Contrast | PASS | Ink & Horizon foreground/muted tokens |
| Reduced motion | PASS | Motion primitives honor `prefers-reduced-motion` |
| Forms | PASS | Labels associated; validation messages announced |

## Legal / 404

- Classification chips are text (not color-only meaning)
- 404 provides multiple recovery paths without relying on gesture-only UI

## Residual

Full automated axe suite in CI not added this sprint (deferred tooling). Manual/e2e semantic checks cover Wave A surfaces.
