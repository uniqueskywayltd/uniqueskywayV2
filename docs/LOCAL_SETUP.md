# Local setup — Unique Sky Way V2

This guide creates **one customer** and **one administrator** for pre-launch review.

No fake ledgers. No fake ROI. No auth bypass.

## Prerequisites

1. Node.js ≥ 20.11
2. A provisioned Supabase project for V2
3. Database migrations applied (`npm run db:migrate`)

## 1. Environment

```bash
cp .env.example .env.local
```

Set at least:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
DATABASE_URL=postgres://...   # V2 Postgres (service role connection string)
```

Optional for `/v2` deploy testing:

```bash
NEXT_PUBLIC_BASE_PATH=/v2
```

## 2. Migrate

```bash
npm run db:migrate
```

## 3. Create review accounts

Certified bootstrap (Supabase Auth + app tables only):

```bash
npm run db:review-accounts
```

This script creates / resets:

| Role | Email | Password | After login |
|------|--------|----------|-------------|
| Customer | `investor.review@uniqueskyway.com` | `ReviewInvestor2026!` | `/dashboard` |
| Admin | `admin.review@uniqueskyway.com` | `ReviewAdmin2026!` | `/admin` |

Both emails are marked verified. Admin receives the seeded `platform_admin` role. No fabricated balances or investments are inserted.

## 4. Run the app

```bash
npm run dev
```

Open:

- Customer: http://localhost:3000/auth/login
- Admin: http://localhost:3000/auth/login → navigate to `/admin` after signing in with the admin account

## 5. Production `/v2` notes

```bash
npm run build:cpanel
```

See `DEPLOYMENT.md` for cPanel / subdirectory (`NEXT_PUBLIC_BASE_PATH=/v2`) steps.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Missing or placeholder NEXT_PUBLIC_SUPABASE_URL` | Fill real values in `.env.local` (not the example placeholders). |
| `Role platform_admin not found` | Run migrations/seed (`npm run db:migrate`). |
| Customer login works but `/admin` is blocked | Confirm you used `admin.review@uniqueskyway.com` and `user_roles` was granted. Re-run `npm run db:review-accounts`. |
| Language / CSRF chrome fails locally | Ensure `NEXT_PUBLIC_APP_URL` matches the origin you open in the browser. |

## What this script will never do

- Invent wallet balances or ledger entries
- Invent ROI or investment positions
- Disable authentication or RBAC
- Write secrets into the repository
