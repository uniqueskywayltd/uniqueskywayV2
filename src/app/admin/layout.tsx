import type { ReactNode } from "react";

import { I18nProvider } from "@/features/i18n/i18n-provider";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { requireAdminPageAccess } from "@/features/admin/require-admin-page";

/** Admin remains English-only regardless of customer language preference. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPageAccess();
  return (
    <I18nProvider initialLanguage="en" syncDocument={false}>
      <AdminShell>{children}</AdminShell>
    </I18nProvider>
  );
}
