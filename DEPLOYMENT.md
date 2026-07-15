# DEPLOYMENT.md

## Purpose

This document designs deployment for Unique Sky Way V2 across development, production, Supabase, Resend, Namecheap Node.js Hosting, future VPS, and future AWS migration.

## Deployment Principles

- Production should be reproducible.
- Environment variables should be explicit and validated.
- Database migrations should be reviewed and reversible where possible.
- Background jobs must be idempotent.
- Hosting should not define domain behavior.
- No production launch without security, financial, and recovery certification.

## Environments

Recommended environments:

- Local development.
- Preview or staging.
- Production.

Each environment must have:

- Separate Supabase project or isolated database.
- Separate Resend API key/domain mode.
- Separate payment provider mode.
- Separate secrets.
- Separate storage buckets.

## Development

Local development should support:

- Next.js local dev server.
- Local or remote development Supabase.
- Seed data.
- Email sandbox or Resend test mode.
- Deterministic test clock for financial tests.

Rules:

- Developers should not use production service role keys locally.
- Seed data must not contain real customer PII.
- Financial fixtures should be deterministic.

## Production

Production requirements:

- HTTPS only.
- Managed Postgres with backups and point-in-time recovery.
- Resend domain verified.
- Webhook secrets configured.
- Monitoring and alerting.
- Error reporting.
- Access control for admin routes.
- Daily settlement scheduler.
- Outbox worker or scheduled processor.
- Backup restore runbook.

## Supabase

Supabase responsibilities:

- PostgreSQL database.
- Auth.
- Storage if chosen.
- RLS defense in depth.
- Database backups.
- Optional scheduled jobs or Edge Functions if deliberately selected.

Production setup:

- Enable RLS on exposed tables.
- Keep service role key server-only.
- Use separate projects per environment.
- Configure database backups.
- Enable performance and security advisors.
- Restrict exposed schemas.
- Store provider event ids for webhook idempotency.

## Resend

Resend responsibilities:

- Transactional email sending.
- Delivery events through webhooks.
- Domain authentication.

Production setup:

- Verify sending domain.
- Configure SPF, DKIM, and DMARC.
- Use idempotency keys for send requests.
- Configure webhook endpoint.
- Store webhook events idempotently.
- Monitor bounce and complaint rates.

## Namecheap Node.js Hosting

Namecheap can host Node.js applications through cPanel's Setup Node.js App flow. It can be used if current business constraints require it.

Recommended posture:

- Treat Namecheap shared Node hosting as an initial hosting target, not the final architecture limit.
- Avoid Vercel-only runtime features if Namecheap production is required.
- Use a standard Node runtime.
- Build Next.js in standalone output mode when implementation begins.
- Use cPanel Node.js startup file such as `server.js` according to the generated standalone server.
- Keep scheduled jobs external or database-coordinated, not dependent on an always-alive web process.

Risks:

- Shared hosting may have limited process control.
- Background workers may be unreliable.
- Observability may be limited.
- Scaling is coarse.
- Deployment automation can be weaker than modern platforms.

Mitigations:

- Database-backed outbox.
- Idempotent scheduled endpoints.
- External uptime monitor.
- External cron or Supabase-side scheduled trigger for settlement.
- Health endpoint.
- Manual rollback artifact.
- Strict production certification before launch.

## Production target: https://uniqueskyway.com/v2 (cPanel)

V2 deploys under the `/v2` subdirectory on existing cPanel Node.js hosting.

### Required environment

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://uniqueskyway.com/v2
NEXT_PUBLIC_BASE_PATH=/v2
# Plus existing secrets: DATABASE_URL, Supabase, Resend, INTERNAL_JOB_TOKEN, etc.
# See .env.example
```

### Build (on a trusted machine / CI)

```bash
npm ci
npm run build:cpanel
# → .next/standalone with public/ and .next/static copied in
```

Requires **Node.js ≥ 20.11**. Set `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_BASE_PATH` in the build environment when baking public asset URLs.

`build:cpanel` intentionally runs `next build --webpack`. CloudLinux NodeJS Selector stores `node_modules` outside the application root through a symlink, and Next.js 16 Turbopack can reject that layout during production builds. Webpack avoids that hosting-specific symlink validation while preserving the same Next.js App Router output contract.

### cPanel app

1. Create or update Node.js App; Application URL `/v2` (or reverse-proxy so traffic reaches the Node process under that path).
2. Application startup file: `.next/standalone/server.js` (upload standalone tree so paths resolve).
3. Set `HOSTNAME=127.0.0.1`, `PORT` to the cPanel-assigned port.
4. Start the app; smoke `GET /v2/api/health` (or proxied equivalent).
5. Keep settlement / outbox on **external cron** calling authenticated job routes — do not rely on an always-on worker inside shared hosting.

### Rollback

Keep the previous standalone artifact tarball. Swap files + restart Node app. Do not roll back schema without a forward-fix plan.

## Recommended Namecheap Deployment Flow

1. Build with `npm run build:cpanel` (standalone + static copy).
2. Run typecheck, lint, unit tests.
3. Run migration review (do not auto-migrate on boot).
4. Upload `.next/standalone` (and any required parent layout) to the Node app root.
5. Configure production env vars in cPanel (including `/v2` URL + base path).
6. Start Node app (`server.js` from standalone).
7. Hit `/api/health` (under `/v2`).
8. Smoke public home, login, and one authenticated money surface.
9. Verify external cron for settlement and outbox.

Important:

- Do not run migrations blindly during app startup.
- Do not run daily settlement from multiple uncoordinated cron sources.

## Future VPS

A VPS is the recommended next step if Namecheap shared hosting becomes limiting.

VPS architecture:

- Reverse proxy such as Nginx or Caddy.
- Node process managed by systemd or PM2.
- Separate worker process for outbox and settlement.
- Centralized logs.
- Automated deploy script or CI deploy.
- Firewall rules.
- Intrusion monitoring.
- Automated backups for any local state.

Benefits:

- Better control.
- Reliable worker process.
- Easier monitoring.
- More predictable performance.

Trade-offs:

- More operations responsibility.
- Security patching required.
- Need server hardening.

## Future AWS Migration

AWS target architecture when scale or compliance requires:

- Next.js app on ECS, App Runner, Amplify Hosting, or another approved runtime.
- Postgres on RDS or continue Supabase until migration justified.
- SQS for outbox/event processing.
- EventBridge for scheduled settlement.
- S3 for private documents.
- CloudFront for static assets.
- Secrets Manager or Parameter Store.
- CloudWatch logs and metrics.
- WAF for edge protection.

Migration approach:

1. Keep domain logic provider-agnostic.
2. Keep event contracts stable.
3. Abstract storage, email, payment, and scheduler ports.
4. Export and validate database.
5. Run dual-read or reconciliation process where needed.
6. Cut over during low-risk window.

## CI/CD

Required pipeline stages:

- Install dependencies.
- Type check.
- Lint.
- Unit tests.
- Financial regression tests.
- Integration tests.
- Build.
- Bundle analysis on release branches.
- Security dependency scan.
- Migration dry run.
- Deployment.
- Smoke tests.

## Rollback Strategy

Application rollback:

- Keep previous build artifact.
- Roll back app code quickly.
- Avoid app versions incompatible with already-applied migrations.

Database rollback:

- Prefer forward fixes for production migrations.
- Use reversible migrations where possible.
- Take backup before high-risk migrations.

Financial rollback:

- Never delete ledger entries.
- Use compensating ledger transactions.
- Audit every correction.

## Scheduled Jobs

Required jobs:

- Daily settlement trigger.
- Outbox processing.
- Payment reconciliation.
- Email webhook reconciliation if needed.
- Balance snapshot rebuild or verification.
- Ledger integrity check.

Rules:

- Jobs are idempotent.
- Jobs acquire database locks.
- Jobs record run status.
- Failed jobs are visible to admins.

## Production Launch Checklist

- Legal/compliance approval.
- Security review complete.
- Financial fixtures pass.
- Settlement catch-up tested.
- Ledger reconciliation tested.
- Backup restore tested.
- Webhook signatures verified.
- Rate limiting enabled.
- Admin MFA enabled.
- Monitoring enabled.
- Incident runbooks written.

## References

- Namecheap Node.js App hosting: https://www.namecheap.com/support/knowledgebase/article.aspx/10047/2182/how-to-work-with-nodejs-app/
- Namecheap Next.js deployment in cPanel: https://www.namecheap.com/support/knowledgebase/article.aspx/10686/29/how-to-deploy-reactjs-vitejs-react-native-and-nextjs-applications-in-cpanel/
- cPanel Node.js application docs: https://docs.cpanel.net/knowledge-base/web-services/how-to-install-a-node.js-application/
- Resend idempotency keys: https://resend.com/docs/dashboard/emails/idempotency-keys
