import type { ReactNode } from "react";

import { AdminShell } from "@/features/admin/components/admin-shell";
import { requireAdminPageAccess } from "@/features/admin/require-admin-page";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPageAccess();
  return <AdminShell>{children}</AdminShell>;
}
