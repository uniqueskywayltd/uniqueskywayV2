# Design System Performance Notes

## Scope

This document records Phase 2 design-system performance decisions.

No dashboard, authentication, marketing, or financial workflow was implemented.

## Performance Principles

- Prefer Server Components by default.
- Isolate client-side JavaScript to interactive primitives only.
- Avoid page-specific styling.
- Avoid unnecessary UI dependencies.
- Keep charting dependency-free until a real chart requirement exists.
- Keep visual effects restrained.

## Server Components

The following components are server-compatible:

- Card.
- Table.
- Badge.
- StatusChip.
- Alert.
- Skeleton.
- EmptyState.
- LoadingState.
- Breadcrumb.
- Pagination.
- ChartFrame.
- CurrencyDisplay.
- PercentageDisplay.
- DateDisplay.
- RoiDisplay.
- BrandMark.
- TopBar.
- Sidebar.
- Footer.
- ResponsiveShell.
- PageContainer.

## Client Components

Client components are limited to controls that need browser state, focus management, portals, timers, or file input behavior:

- Label.
- Checkbox.
- RadioGroup.
- Select.
- Dialog.
- Drawer.
- DropdownMenu.
- Tabs.
- Toast.
- Avatar.
- Progress.
- CountdownTimer.
- ProfileImageUploader.

## Dependency Choices

Existing dependencies reused:

- Radix UI through the already initialized shadcn setup.
- Lucide React for icons.
- class-variance-authority, clsx, and tailwind-merge for variant and class composition.

Dependencies deliberately not added:

- Charting libraries.
- Animation libraries.
- Theme provider packages.
- Form UI abstraction packages beyond existing React Hook Form support.

## Chart Strategy

`ChartFrame` is only a layout wrapper. It does not choose a charting library.

When a future feature requires charts, the team should evaluate:

- Bundle size.
- SSR compatibility.
- Accessibility.
- Data density.
- Dynamic import strategy.

## Motion

Motion is tokenized and restrained.

The global reduced-motion rule limits animations and transitions for users who prefer reduced motion.

## Bundle Expectations

Future pages should import only the components they need.

Avoid:

- Barrel-importing all UI components into large client components.
- Making entire pages client components.
- Adding chart or date libraries for formatting already handled by platform APIs.

## Verification

Phase 2 must pass:

- Type-check.
- Lint.
- Unit tests.
- Production build.
- Existing Playwright health check.
