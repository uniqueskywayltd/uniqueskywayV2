# Design System Components

## Purpose

This document is the component reference for Unique Sky Way V2.

Every future page should compose these primitives instead of creating page-specific UI. New primitives require review against the design goals, accessibility requirements, and performance constraints in the Phase 0 constitution.

## Design Language

The platform UI should feel premium, calm, financial, and trustworthy.

Principles:

- Use spacious layouts with compact controls.
- Prefer restrained borders, neutral surfaces, and semantic status colour.
- Use clear hierarchy instead of heavy gradients or visual effects.
- Keep client-side JavaScript limited to components that require interaction.
- Keep financial display consistent and clearly separated from financial source-of-truth logic.

## Token Source

Primary token files:

- `src/app/globals.css`: CSS custom properties consumed by Tailwind and shadcn/ui.
- `src/styles/tokens.ts`: typed token map for documentation and programmatic usage.

Token categories:

- Spacing.
- Typography.
- Radius.
- Elevation.
- Semantic colours.
- Financial colours.
- ROI colours.
- Investment status colours.
- Motion.
- Z-index.
- Breakpoints.
- Container widths.

## Component Inventory

| Component                  | File                                                                    | Purpose                          | Client JS |
| -------------------------- | ----------------------------------------------------------------------- | -------------------------------- | --------- |
| `Button`                   | `src/components/ui/button.tsx`                                          | Actions, links, icon buttons     | No        |
| `Input`, `Textarea`        | `src/components/ui/input.tsx`                                           | Text entry                       | No        |
| `Label`                    | `src/components/ui/label.tsx`                                           | Accessible form labeling         | Yes       |
| `Select`                   | `src/components/ui/select.tsx`                                          | Keyboard-accessible select menus | Yes       |
| `Checkbox`                 | `src/components/ui/checkbox.tsx`                                        | Boolean choice                   | Yes       |
| `RadioGroup`               | `src/components/ui/radio-group.tsx`                                     | Exclusive option groups          | Yes       |
| `Card`                     | `src/components/ui/card.tsx`                                            | Bounded content surface          | No        |
| `Table`                    | `src/components/ui/table.tsx`                                           | Dense tabular data               | No        |
| `Badge`                    | `src/components/ui/badge.tsx`                                           | Small labels                     | No        |
| `StatusChip`               | `src/components/ui/status-chip.tsx`                                     | Status labels with semantic tone | No        |
| `Alert`                    | `src/components/ui/alert.tsx`                                           | System feedback                  | No        |
| `Toast`                    | `src/components/ui/toast.tsx`                                           | Temporary notifications          | Yes       |
| `Dialog`                   | `src/components/ui/dialog.tsx`                                          | Modal framework                  | Yes       |
| `Drawer`                   | `src/components/ui/drawer.tsx`                                          | Side-panel framework             | Yes       |
| `DropdownMenu`             | `src/components/ui/dropdown-menu.tsx`                                   | Action menus                     | Yes       |
| `Tabs`                     | `src/components/ui/tabs.tsx`                                            | View switching                   | Yes       |
| `Breadcrumb`               | `src/components/ui/breadcrumb.tsx`                                      | Navigation hierarchy             | No        |
| `Pagination`               | `src/components/ui/pagination.tsx`                                      | Paged navigation                 | No        |
| `EmptyState`               | `src/components/ui/empty-state.tsx`                                     | Empty data surfaces              | No        |
| `LoadingState`, `Skeleton` | `src/components/ui/loading-state.tsx`, `src/components/ui/skeleton.tsx` | Loading feedback                 | No        |
| `Progress`                 | `src/components/ui/progress.tsx`                                        | Progress indicators              | Yes       |
| `ChartFrame`               | `src/components/ui/chart-frame.tsx`                                     | Dependency-free chart shell      | No        |
| `Avatar`                   | `src/components/ui/avatar.tsx`                                          | Profile image display            | Yes       |
| `ProfileImageUploader`     | `src/components/ui/profile-image-uploader.tsx`                          | Accessible image input           | Yes       |
| `CurrencyDisplay`          | `src/components/ui/display.tsx`                                         | Currency formatting              | No        |
| `PercentageDisplay`        | `src/components/ui/display.tsx`                                         | Percentage formatting            | No        |
| `DateDisplay`              | `src/components/ui/display.tsx`                                         | `MM/DD/YYYY` date formatting     | No        |
| `RoiDisplay`               | `src/components/ui/display.tsx`                                         | ROI display formatting           | No        |
| `CountdownTimer`           | `src/components/ui/countdown-timer.tsx`                                 | Live countdown display           | Yes       |
| `BrandMark`                | `src/components/layout/brand-mark.tsx`                                  | Brand lockup                     | No        |
| `TopBar`                   | `src/components/layout/top-bar.tsx`                                     | Header navigation                | No        |
| `Sidebar`                  | `src/components/layout/sidebar.tsx`                                     | Desktop sidebar navigation       | No        |
| `Footer`                   | `src/components/layout/footer.tsx`                                      | Footer navigation                | No        |
| `ResponsiveShell`          | `src/components/layout/responsive-shell.tsx`                            | Page shell                       | No        |
| `PageContainer`            | `src/components/layout/page-container.tsx`                              | Responsive content width         | No        |

## Usage Rules

- Import primitives from `src/components/ui` or their direct files.
- Do not create page-specific buttons, cards, tables, badges, or status styles.
- Prefer semantic props such as `variant`, `tone`, and `size` over ad hoc colour classes.
- Use `CurrencyDisplay`, `PercentageDisplay`, `DateDisplay`, and `RoiDisplay` for display formatting only.
- Do not place business rules inside display components.
- Use `Dialog` for non-destructive modal content.
- Use future `AlertDialog` only for destructive confirmation when added.
- Use `Drawer` for supporting detail, filters, or mobile-friendly side panels.
- Use `Toast` for temporary feedback, not as a replacement for persisted notifications.

## Showcase

The component showcase lives at:

- `/design-system`

The showcase exists only to demonstrate reusable UI. It must not become a dashboard, marketing page, login page, or business workflow.
