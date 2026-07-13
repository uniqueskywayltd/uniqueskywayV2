# Design System Accessibility Report

## Scope

This report covers the Phase 2 reusable UI foundation.

No business workflows, authentication flows, or financial flows were implemented in this phase.

## Accessibility Commitments

Every component must support:

- Keyboard navigation.
- Screen readers.
- Visible focus states.
- Reduced motion.
- ARIA attributes where needed.
- Colour contrast.

## Implementation Summary

### Keyboard Navigation

Interactive primitives are built on Radix UI where custom interaction is needed:

- Select.
- Checkbox.
- Radio Group.
- Dialog.
- Drawer.
- Dropdown Menu.
- Tabs.
- Toast.
- Avatar.
- Progress.

Radix primitives provide keyboard behavior, focus management, and ARIA semantics for these controls.

### Focus States

Global focus-visible styling is defined in `src/app/globals.css`.

Controls use token-based focus rings:

- `focus-visible:ring-3`.
- `focus-visible:ring-ring/50`.
- `focus-visible:border-ring`.

### Screen Reader Support

Patterns used:

- `aria-label` on icon-only actions.
- `aria-current` on active navigation and pagination.
- `role="status"` for loading and alert surfaces.
- `role="timer"` for countdown display.
- Semantic table elements for data tables.
- `nav` landmarks for breadcrumbs, pagination, top navigation, and sidebar navigation.

### Reduced Motion

The global stylesheet includes a `prefers-reduced-motion: reduce` rule that minimizes animations and transitions.

### Colour Contrast

The system uses semantic foreground/background token pairs:

- `background` / `foreground`.
- `card` / `card-foreground`.
- `primary` / `primary-foreground`.
- `brand` / `brand-foreground`.
- `success`, `warning`, `info`, and `destructive` semantic tones.

Future changes to tokens must be checked for contrast before merge.

## Component Notes

- `Button`: supports keyboard activation, disabled state, icon sizing, and visible focus.
- `Input` and `Textarea`: use native controls for browser and assistive technology compatibility.
- `Select`, `Checkbox`, `RadioGroup`, `Dialog`, `DropdownMenu`, and `Tabs`: use Radix primitives.
- `Dialog` and `Drawer`: include close buttons with accessible labels.
- `Toast`: uses Radix toast viewport and close control.
- `EmptyState`: supports optional icon, title, description, and action.
- `LoadingState`: includes a screen-reader-only loading label.
- `ProfileImageUploader`: uses a real file input and label association.

## Required Future Checks

Before production UI launch:

- Run automated accessibility checks with Playwright or an approved axe integration.
- Test keyboard-only navigation across real pages.
- Test screen reader names for form-heavy workflows.
- Confirm colour contrast after final brand assets are available.
- Confirm reduced-motion behavior for any future animations.

## Known Limitation

The repository does not yet contain an official image logo asset. `BrandMark` uses a text and monogram lockup until the approved brand asset is added.
