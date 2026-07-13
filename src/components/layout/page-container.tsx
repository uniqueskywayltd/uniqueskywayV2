import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface PageContainerProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "page";
}

const sizeClassName: Record<NonNullable<PageContainerProps["size"]>, string> = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  page: "max-w-[90rem]",
};

export function PageContainer({ children, className, size = "page" }: PageContainerProps) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizeClassName[size], className)}>
      {children}
    </div>
  );
}
