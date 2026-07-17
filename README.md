# Unique Sky Way V2

Production investment platform: Next.js App Router, Supabase Postgres/Auth, Resend email, Vercel hosting.

Live site: [https://uniqueskyway.com](https://uniqueskyway.com)

## Requirements

- Node.js ≥ 20.11
- npm
- Supabase CLI ≥ 2.x (for migrations)
- Access to the project’s Supabase and Vercel accounts for production work

## Quick start (local)

```bash
git clone <repo-url>
cd uniqueskywayV2
npm install
cp .env.example .env.local
# Fill Supabase, DATABASE_URL, Resend, and INTERNAL_JOB_TOKEN values
```

Apply migrations (linked remote or local):

```bash
# Linked production/staging project (requires supabase login + link)
supabase db push --linked

# Or the repo helper (uses DATABASE_URL from .env.local)
npm run db:migrate
```

Optional review accounts:

```bash
npm run db:review-accounts
```

Run the app:

```bash
npm run dev
```

## Quality gates

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Production deploy

Primary host is **Vercel** (production alias `https://uniqueskyway.com`).

```bash
npx vercel --prod --yes
```

Environment variables must be set in the Vercel project (never commit secrets). See `.env.example` and `DEPLOYMENT.md`.

Optional cPanel/standalone artifact:

```bash
npm run build:cpanel
node scripts/package-cpanel-deploy.mjs
```

## Database

Migrations live in `supabase/migrations/` and are the source of truth.

```bash
supabase migration list --linked
supabase db push --linked
```

Project ref (production): `lngjjttkiuqlclalccah`.

## Languages

Customer UI: English, العربية, Español, Français. Admin remains English.

## Documentation map

| Doc                   | Purpose                       |
| --------------------- | ----------------------------- |
| `DEPLOYMENT.md`       | Environments, hosting, jobs   |
| `docs/LOCAL_SETUP.md` | Review accounts and local env |
| `DATABASE.md`         | Schema and migration policy   |
| `SECURITY.md`         | Auth, RLS, secrets            |
| `CHANGELOG.md`        | Release history               |

## Release tag

Production releases are tagged in Git (example: `v2.0.0-production`). Every release should have a clean working tree, passing quality gates, applied migrations, and a successful Vercel production deploy.
