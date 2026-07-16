-- Seed full production email template catalog (canonical preview IDs).
insert into public.email_template_catalog (key, name, description, status, current_version)
values
  ('auth.welcome', 'Welcome', 'Welcome / admin-created account.', 'enabled', 'v1'),
  ('auth.verify_email', 'Verify email', 'Customer email verification with OTP.', 'enabled', 'v1'),
  ('auth.email_verified', 'Email verified', 'Email verification confirmation.', 'enabled', 'v1'),
  ('auth.password_reset', 'Password reset', 'Customer password reset with OTP.', 'enabled', 'v1'),
  ('auth.password_changed', 'Password changed', 'Password change security alert.', 'enabled', 'v1'),
  ('auth.new_device_sign_in', 'New device sign-in', 'New or unrecognized device login alert.', 'enabled', 'v1'),
  ('auth.account_locked', 'Account locked', 'Temporary lockout notice.', 'enabled', 'v1'),
  ('auth.account_unlocked', 'Account unlocked', 'Lockout cleared notice.', 'enabled', 'v1'),
  ('deposit.initiated', 'Deposit submitted', 'Deposit request submitted.', 'enabled', 'v1'),
  ('deposit.confirmed', 'Deposit approved', 'Deposit approved and credited.', 'enabled', 'v1'),
  ('deposit.failed', 'Deposit rejected', 'Deposit failed or rejected.', 'enabled', 'v1'),
  ('deposit.cancelled', 'Deposit cancelled', 'Deposit cancelled.', 'enabled', 'v1'),
  ('deposit.reversed', 'Deposit reversed', 'Deposit reversed.', 'enabled', 'v1'),
  ('withdrawal.requested', 'Withdrawal submitted', 'Withdrawal request submitted.', 'enabled', 'v1'),
  ('withdrawal.approved', 'Withdrawal approved', 'Withdrawal approved.', 'enabled', 'v1'),
  ('withdrawal.rejected', 'Withdrawal rejected', 'Withdrawal rejected.', 'enabled', 'v1'),
  ('withdrawal.paid', 'Withdrawal completed', 'Withdrawal paid out.', 'enabled', 'v1'),
  ('withdrawal.failed', 'Withdrawal failed', 'Withdrawal payout failed.', 'enabled', 'v1'),
  ('withdrawal.cancelled', 'Withdrawal cancelled', 'Withdrawal cancelled.', 'enabled', 'v1'),
  ('investment.activated', 'Investment activated', 'Investment position activated.', 'enabled', 'v1'),
  ('investment.roi_credited', 'Daily ROI', 'Daily ROI credited.', 'enabled', 'v1'),
  ('investment.completed', 'Investment matured', 'Investment matured or reinvested.', 'enabled', 'v1'),
  ('referral.reward', 'Referral commission', 'Referral commission credited.', 'enabled', 'v1'),
  ('admin.broadcast', 'Broadcast', 'Admin platform announcement.', 'enabled', 'v1'),
  ('platform.broadcast', 'Platform broadcast', 'Platform announcement alias.', 'enabled', 'v1')
on conflict (key) do update
set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  current_version = excluded.current_version;
