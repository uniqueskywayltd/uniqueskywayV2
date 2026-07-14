#!/usr/bin/env node
/**
 * Creates pre-launch review accounts (customer + admin) via Supabase Auth + app tables.
 *
 * Usage:
 *   node --env-file=.env.local scripts/create-review-accounts.mjs
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   DATABASE_URL
 */

import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const CUSTOMER = {
  email: "investor.review@uniqueskyway.com",
  password: "ReviewInvestor2026!",
  displayName: "Review Investor",
};

const ADMIN = {
  email: "admin.review@uniqueskyway.com",
  password: "ReviewAdmin2026!",
  displayName: "Review Admin",
  roleKey: "platform_admin",
};

function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.includes("replace-with") || value.includes("example.supabase")) {
    throw new Error(`Missing or placeholder ${name}. Create .env.local from .env.example first.`);
  }
  return value;
}

async function ensureAuthUser(admin, account) {
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listed.error) throw listed.error;
  const existing = listed.data.users.find(
    (user) => user.email?.toLowerCase() === account.email.toLowerCase(),
  );
  if (existing) {
    const updated = await admin.auth.admin.updateUserById(existing.id, {
      password: account.password,
      email_confirm: true,
      user_metadata: { displayName: account.displayName },
    });
    if (updated.error) throw updated.error;
    return updated.data.user;
  }

  const created = await admin.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: { displayName: account.displayName },
  });
  if (created.error) throw created.error;
  return created.data.user;
}

async function ensureAppUser(sql, authUser, email) {
  const existing = await sql`
    select id from public.users
     where auth_user_id = ${authUser.id}
        or lower(email) = lower(${email})
     limit 1
  `;
  if (existing[0]) {
    await sql`
      update public.users
         set email = ${email},
             email_verified_at = coalesce(email_verified_at, now()),
             status = 'active',
             updated_at = now()
       where id = ${existing[0].id}
    `;
    return existing[0].id;
  }

  const inserted = await sql`
    insert into public.users (auth_user_id, email, email_verified_at, status)
    values (${authUser.id}, ${email}, now(), 'active')
    returning id
  `;
  return inserted[0].id;
}

async function ensureCustomerSide(sql, userId, displayName) {
  await sql`
    insert into public.customer_profiles (user_id, display_name, onboarding_status, kyc_status, risk_status)
    values (${userId}, ${displayName}, 'not_started', 'not_started', 'not_reviewed')
    on conflict (user_id) do update
      set display_name = excluded.display_name,
          updated_at = now()
  `;

  const accountNumber = `USW-REV${String(Date.now()).slice(-8)}`;
  await sql`
    insert into public.customer_accounts (user_id, account_number, status)
    values (${userId}, ${accountNumber}, 'active')
    on conflict (user_id) do update
      set status = 'active',
          updated_at = now()
  `;
}

async function ensureAdminSide(sql, userId, roleKey) {
  await sql`
    insert into public.admin_profiles (user_id, status, must_change_password)
    values (${userId}, 'active', false)
    on conflict (user_id) do update
      set status = 'active',
          must_change_password = false,
          disabled_at = null,
          disabled_reason = null,
          updated_at = now()
  `;

  const role = await sql`select id from public.roles where key = ${roleKey} limit 1`;
  if (!role[0]) {
    throw new Error(`Role ${roleKey} not found. Run migrations/seed first.`);
  }

  await sql`
    insert into public.user_roles (user_id, role_id, granted_at)
    select ${userId}, ${role[0].id}, now()
     where not exists (
       select 1 from public.user_roles
        where user_id = ${userId} and role_id = ${role[0].id} and revoked_at is null
     )
  `;
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const databaseUrl = requireEnv("DATABASE_URL");

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const sql = postgres(databaseUrl, { max: 1 });

  try {
    await sql.begin(async (tx) => {
      const customerAuth = await ensureAuthUser(admin, CUSTOMER);
      const customerUserId = await ensureAppUser(tx, customerAuth, CUSTOMER.email);
      await ensureCustomerSide(tx, customerUserId, CUSTOMER.displayName);

      const adminAuth = await ensureAuthUser(admin, ADMIN);
      const adminUserId = await ensureAppUser(tx, adminAuth, ADMIN.email);
      await ensureCustomerSide(tx, adminUserId, ADMIN.displayName);
      await ensureAdminSide(tx, adminUserId, ADMIN.roleKey);
    });

    console.log("Review accounts ready.\n");
    console.log("Customer (dashboard)");
    console.log(`  Email:    ${CUSTOMER.email}`);
    console.log(`  Password: ${CUSTOMER.password}`);
    console.log(`  Login:    /auth/login → /dashboard\n`);
    console.log("Admin (console)");
    console.log(`  Email:    ${ADMIN.email}`);
    console.log(`  Password: ${ADMIN.password}`);
    console.log(`  Login:    /auth/login → /admin`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
