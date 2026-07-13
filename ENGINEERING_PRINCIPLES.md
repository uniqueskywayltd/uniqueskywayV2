# ENGINEERING_PRINCIPLES.md

## Purpose

This document defines how engineers should think when building Unique Sky Way V2.

`CONTRIBUTING.md` explains how to contribute.
This document explains how to make engineering trade-offs.

The goal is to keep the platform simple, correct, secure, and maintainable as more engineers and more financial workflows are added.

## Authority

These principles apply to all design, implementation, review, testing, and operational work.

When a decision is not fully answered by code, tests, or existing documentation, use these principles as the decision lens.

If a proposed change conflicts with these principles, it requires one of:

- A smaller implementation that preserves the principle.
- A documented alternative in `DECISIONS.md`.
- Rejection.

## Required Context

Before making production decisions, engineers must understand:

- `ARCHITECTURE.md`.
- `DECISIONS.md`.
- `FINANCIAL_INVARIANTS.md`.
- `CONTRIBUTING.md`.
- `GLOSSARY.md`.
- `TESTING.md`.

These documents are complementary. None replaces the others.

## Core Principles

### EP-001: Correctness Before Convenience

Choose the correct design even when a shortcut is faster.

Convenience is acceptable only when it does not weaken correctness, security, auditability, maintainability, or performance.

### EP-002: Financial Correctness Before UI Polish

Customer-facing polish matters, but it must never outrank financial correctness.

If financial state is uncertain, the UI must not pretend it is certain.

### EP-003: Security Before Feature Velocity

Authentication, authorization, secrets, sessions, uploads, and admin access must be designed deliberately.

No feature is urgent enough to justify exposing privileged data, weakening rate limits, bypassing CSRF protections, or leaking secrets to the browser.

### EP-004: Simplicity Is A Feature

Prefer the simplest design that satisfies the documented requirements and invariants.

Simple does not mean under-designed. It means each part has a clear reason to exist and an obvious home.

### EP-005: Domain First, Framework Second

Business rules belong in the domain and application layers, not in framework glue.

Next.js, Supabase, Drizzle, Resend, and hosting providers are implementation details around the product domain.

### EP-006: Server First By Default

Prefer server-side execution for data access, authorization, financial workflows, and sensitive logic.

Client-side code is for interaction, not authority.

### EP-007: One Source Of Truth Per Concept

Every important concept must have exactly one authoritative source.

Examples:

- Financial balances come from the ledger.
- Investment terms come from activation snapshots.
- Terminology comes from `GLOSSARY.md`.
- Architectural decisions come from `DECISIONS.md`.
- Financial invariants come from `FINANCIAL_INVARIANTS.md`.

Duplicate sources of truth create drift, support burden, and audit risk.

### EP-008: No Hidden Business Rules

Business rules must be visible in named domain services, application services, tests, and documentation.

Do not hide business policy inside:

- React components.
- Route handlers.
- Database triggers without documentation.
- Generic helpers.
- Provider adapters.
- One-off scripts.

### EP-009: Explicit Is Better Than Implicit

Prefer clear names, explicit states, explicit transaction boundaries, explicit permissions, and explicit error handling.

Avoid designs that require readers to infer business behavior from side effects.

### EP-010: Tests Prove Behavior, Documentation Explains Intent

Documentation is not a substitute for tests.

Tests prove what the system does.
Documentation explains why it should do that.

Financial behavior requires both.

### EP-011: Make Invalid States Unrepresentable Where Practical

Use types, schemas, constraints, enums, and database rules to prevent invalid states.

Runtime checks are still required at trust boundaries, but the normal path should make invalid states hard to create.

### EP-012: Prefer Constraints Over Conventions

If a rule can be enforced by the database, type system, schema validation, or unique constraint, prefer that over relying on human discipline.

Conventions are useful. Constraints are stronger.

### EP-013: Transactions Are Design Boundaries

Any workflow that changes financial or security-sensitive state must define its transaction boundary before implementation.

If the transaction boundary is unclear, the design is not ready.

### EP-014: Idempotency Is A Product Requirement

Retries are normal.
Duplicate requests are normal.
Provider webhooks repeat.
Jobs resume.

The platform must treat idempotency as part of the business behavior, not as an infrastructure afterthought.

### EP-015: Auditability Is A Feature

A financial platform must be able to explain itself.

Every meaningful state change should answer:

- What happened?
- Who or what initiated it?
- When did it happen?
- Which records changed?
- Which ledger transaction or event represents it?
- Which request, job, or provider event caused it?

### EP-016: Prefer Deletion Over Abstraction

Do not add abstractions to make code look sophisticated.

Add an abstraction only when it:

- Removes real duplication.
- Clarifies ownership.
- Protects a boundary.
- Encodes a stable concept.
- Improves testability.

If a feature can be made simpler by deleting code, prefer deletion.

### EP-017: Small PRs Over Large Rewrites

Small, reviewable changes protect quality.

Large rewrites require stronger justification, explicit scope, dedicated tests, and clear rollback strategy.

### EP-018: Measure Before Optimizing

Performance matters, especially for authenticated customer flows and financial jobs.

Optimize based on evidence:

- Bundle size.
- Query plans.
- Latency.
- Memory.
- Cold starts.
- Job throughput.

Do not add caching, denormalization, or complexity without a measured reason and an invalidation strategy.

### EP-019: Caching Must Never Lie About Money

Caching is allowed only when freshness and invalidation are understood.

Financial source-of-truth state must not be cached in a way that can display or act on stale authoritative values.

Stale financial data must be clearly a projection, preview, or historical snapshot.

### EP-020: Public APIs Are Contracts

Public and client-consumed APIs must be treated as contracts.

Breaking changes require:

- Versioning or migration plan.
- Updated tests.
- Updated documentation.
- Review of client impact.

### EP-021: Errors Should Be Useful And Safe

Errors must help engineers and customers recover without leaking sensitive internals.

Use precise internal logging and safe external messages.

Financial errors must preserve enough context for audit and reconciliation.

### EP-022: No Legacy Leakage

Unique Sky Way V2 is a greenfield platform.

From Milestone 5 onward, the previous project may be used as a **screen reference library** when a specific page is about to be designed: extract business flow, useful copy, customer journey, and visual hierarchy only.

Do not copy legacy architecture, services, middleware, controllers, routing, authentication, helpers, utilities, state management, schema design, HTML, CSS, JavaScript, PHP, theme kits, or production code.

### EP-023: Operations Are Part Of The Product

Jobs, migrations, logs, alerts, retries, recovery paths, and reconciliation are first-class engineering concerns.

A feature is not complete if it cannot be operated, diagnosed, and recovered.

### EP-024: Admin Power Requires Extra Restraint

Admin tools must never bypass domain rules or financial invariants.

Admin workflows may approve, reject, review, correct, or trigger operations, but the underlying financial behavior must still flow through approved services, transactions, ledger postings, audit logs, and idempotency controls.

### EP-025: Certification Is Earned, Not Assumed

A phase is not complete because the code compiles.

A phase is complete only when:

- Scope boundaries are respected.
- Tests prove behavior.
- Documentation is updated.
- Security and financial risks are reviewed.
- Build and verification pass.
- Git history and release checkpoints are clean.

### EP-026: Design Before Implementation (Customer Experience Waves)

For Milestone 5 Customer Experience waves:

1. Design / UX specification
2. Explicit approval
3. Implementation
4. Test
5. Audit
6. Freeze (wave checkpoint)

**No production implementation work begins until the UX specification for that wave is approved.**

Wave design deliverables are documentation and mockups only: information architecture, journeys, wireframes, component inventory, mobile layouts, copy hierarchy, trust placement, SEO structure, accessibility plan, design tokens, API mapping, legacy business comparison, and redesign list.

### EP-027: Platform Vs Product Mode

Through `v2.3.0`, Unique Sky Way prioritized certified platform subsystems (engines, money movement, administration).

From `v3.0.0`, Customer Experience work prioritizes trust, journey, and product UX **on top of** frozen financial logic. Product obsession must never reopen frozen engines without ADR, regression tests, and recertification.

## Decision Lenses

When evaluating multiple valid designs, prefer the design that is:

1. More correct.
2. Easier to audit.
3. Easier to test.
4. Easier to explain.
5. Easier to operate.
6. Less coupled to infrastructure.
7. Less surprising to future engineers.
8. Less likely to create irreversible financial state.

If a design is clever but hard to explain, choose a clearer design.

## Financial Engineering Lens

For financial work, every design must answer:

- What is the source of truth?
- What transaction commits the change?
- What ledger transaction represents the change?
- What idempotency key prevents duplicates?
- What database constraint backs the rule?
- What audit record explains the action?
- What happens on retry?
- What happens on partial failure?
- What proves the math?
- What reconciles the result?

If any answer is missing, the design is not ready.

## Review Lens

Code review should ask:

- Does this preserve the documented architecture?
- Does this keep business rules out of UI and route handlers?
- Does this use the existing terminology?
- Does this introduce a second source of truth?
- Does this create hidden coupling?
- Does this make failure modes explicit?
- Does this need an ADR?
- Does this need more tests?
- Does this change financial behavior?
- Does this change security behavior?
- Can this be made smaller?

## Phase 6 Lens

During Phase 6, the investment engine must be built in isolation.

Do not implement:

- Deposits.
- Withdrawals.
- Payment provider workflows.
- Admin financial overrides.
- Customer money movement UI.

Phase 6 exists to prove:

- Investment plans and versions.
- Investment activation.
- ROI mathematics.
- Settlement.
- Live earnings previews.
- Maturity.
- Reconciliation.
- Ledger-backed correctness.

The platform should not accept real customer funds until the investment engine is mathematically and operationally certified.

## Principle Maintenance

This document should change rarely.

Update it when:

- A repeated review issue reveals a missing principle.
- A new engineering risk appears.
- An accepted ADR changes how the team should make decisions.
- A phase certification discovers a durable lesson.

Do not update it to justify a shortcut already taken.
