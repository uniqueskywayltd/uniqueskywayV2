import type { ReactNode } from "react";

import { PublicShell } from "@/features/public/components/public-shell";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
