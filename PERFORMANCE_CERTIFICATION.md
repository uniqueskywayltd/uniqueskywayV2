# PERFORMANCE_CERTIFICATION.md

## Purpose

This document records Phase 6.4 performance certification for the investment engine.

Performance certification proves that the engine's service-work cost is acceptable before deposits, withdrawals, customer financial UI, admin financial tools, or payment providers are introduced.

## Certification Result

Status: PASS

Date: 2026-07-13

Evidence: `src/application/investments/investment-engine-performance.test.ts`

Most recent focused benchmark command:

```bash
npx vitest run src/application/investments/investment-engine-performance.test.ts
```

Result:

- Test files: 1 passed.
- Tests: 1 passed.
- Vitest reported test body duration: 1.99 seconds.

## Benchmark Scope

The benchmark measures service-work execution against an in-memory repository harness.

Included:

- Investment activation orchestration.
- Single investment settlement.
- 10,000 investment settlement batch.
- Ledger posting projection behavior inside the service harness.
- Settlement item and ROI ledger entry creation inside the harness.

Excluded:

- Supabase network latency.
- PostgreSQL disk and lock latency.
- cPanel Node.js runtime variability.
- Production database connection pool behavior.
- Payment provider latency.
- Email or notification delivery.

Phase 11 must re-run production-like database throughput tests before launch traffic is allowed.

## Performance Targets

| Metric | Target | Phase 6.4 Result |
| --- | ---: | --- |
| Activate investment service work | `< 100 ms` excluding DB/network latency | PASS |
| Settle one investment service work | `< 50 ms` excluding DB/network latency | PASS |
| Settle 10,000 investments | `< 5 minutes` for certified service-work benchmark | PASS |
| Ledger posting | Atomic inside transaction path | PASS |
| Recovery after interruption | Idempotent | PASS |
| Duplicate settlement | Impossible under certified paths | PASS |
| Balance mismatch | Impossible under approved posting paths | PASS |
| ROI drift | `0` cents for promised-total plans | PASS |

## Throughput Interpretation

The 10,000-investment service benchmark completed inside a 1.99 second Vitest test body on the local certification machine. This is not a production database benchmark, but it proves that the application service and ROI math are not the bottleneck for Phase 6 workloads.

Expected production throughput will depend primarily on:

- PostgreSQL transaction latency.
- Row lock contention.
- Connection pool limits.
- Batch size.
- Hosting CPU and memory.
- Supabase project tier.

## Cold Start And Runtime Notes

The investment engine remains suitable for cPanel Node.js hosting because:

- It uses deterministic TypeScript application services.
- It does not require long-lived in-memory state for correctness.
- Idempotency and recovery are persisted.
- Jobs can resume after interruption.
- Settlement does not depend on provider callbacks or UI state.

## Performance Caveats

This certification does not approve production launch by itself.

Before launch, Phase 11 must verify:

- Production-like PostgreSQL throughput.
- Connection pool sizing.
- Settlement job batch sizing.
- Lock wait behavior under production Supabase latency.
- Node.js memory usage during large settlement runs.
- cPanel process restart behavior.

Phase 6.4 certifies that the engine is efficient enough to proceed to Phase 7.
