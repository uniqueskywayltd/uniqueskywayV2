# RTL_SUPPORT_GUIDE.md

## Status

**APPROVED** — Stage 1 (`DEC-0060`, score **99.8 / 100**)
Companion to `GLOBAL_EXPERIENCE_SPECIFICATION.md` (Milestone 7 / `v3.3.0`)

## Scope

Phase 1 includes **Arabic (`ar`)**, which requires first-class right-to-left (RTL) support—not string translation alone.

Future RTL languages (e.g. Hebrew) would reuse these rules; they are not Phase 1.

## Principles

### RTL-001: Document direction is authoritative

When active language is Arabic:

- Set `dir="rtl"` on the root document (or proven app shell boundary).  
- Set `lang` to the active BCP 47 tag.

### RTL-002: Prefer CSS logical properties

Use `margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `border-inline-start`, `text-align: start` instead of raw `left`/`right` for layout that must mirror.

Physical left/right allowed only for truly direction-agnostic charts or media that must not mirror.

### RTL-003: Mirroring expectations

| Element | Behavior |
| --- | --- |
| Navigation / drawers | Mirror edge attachment |
| Chevrons / forward affordances | Directional icons flip; brand logos typically do not |
| Progress steppers | Reading order follows RTL |
| Data tables | Follow RTL reading order; numeric columns remain readable |
| Media with embedded LTR text | Isolate with `dir="ltr"` where needed |

### RTL-004: Bidirectional isolation for codes

Transaction references, emails, URLs, IBAN-like strings, and amounts often need:

```html
<span dir="ltr">TXN-ABC-123</span>
```

or Unicode isolates so punctuation does not scramble.

### RTL-005: Numbers and money

- Digits may appear in locale-appropriate forms via `Intl`.  
- Do not reverse the **economic** meaning of the amount.  
- Currency formatted strings should be treated as embedded runs when placing them in RTL sentences.

### RTL-006: Language selector

- Remains reachable in headers/menus after mirroring.  
- Globe affordance may stay; label uses Arabic endonym when `ar` active.

### RTL-007: Forms and input

- Input caret and alignment follow RTL for Arabic free text.  
- OTP / numeric entry fields may force LTR for digit groups.  
- Validation messages follow document direction.

### RTL-008: Quality bar before “ar ready”

- Authenticated money home and primary money flows usable without horizontal clipping.  
- No overlapping icons on mirrored headers.  
- Focus order matches visual order.  
- Snapshot or e2e smoke for `/` and `/dashboard` at minimum in Stage 2.

## Anti-patterns

- Translating Arabic while leaving `dir=ltr`  
- Absolute positioning assume LTR coordinates  
- Flipping photographs that contain text  
- Manually reversing strings in code  

## Conflicts

If RTL layout and money clarity collide, **prefer clarity** (e.g. isolate LTR references) over visual purity.
