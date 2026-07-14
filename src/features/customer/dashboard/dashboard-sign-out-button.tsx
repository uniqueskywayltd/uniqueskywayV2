"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { postAuthJson } from "@/features/auth/api-client";
import { cn } from "@/lib/utils";

export function DashboardSignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "gap-2 focus-visible:ring-offset-background",
      )}
      onClick={() => {
        if (pending) return;
        setPending(true);
        void postAuthJson("/api/auth/logout", {}).then((result) => {
          if (result.error) {
            setPending(false);
            return;
          }
          router.replace("/auth/login");
          router.refresh();
        });
      }}
    >
      <LogOut className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}
