import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

function PaginationLink({
  isActive,
  className,
  ...props
}: React.ComponentProps<"a"> & { isActive?: boolean }) {
  return (
    <Button
      asChild
      variant={isActive ? "default" : "ghost"}
      size="icon-sm"
      aria-current={isActive ? "page" : undefined}
    >
      <a data-slot="pagination-link" className={className} {...props} />
    </Button>
  );
}

function PaginationPrevious({ className, ...props }: React.ComponentProps<"a">) {
  return (
    <Button asChild variant="ghost" size="sm">
      <a data-slot="pagination-previous" className={cn("gap-1", className)} {...props}>
        <ChevronLeft className="size-4" aria-hidden="true" />
        Previous
      </a>
    </Button>
  );
}

function PaginationNext({ className, ...props }: React.ComponentProps<"a">) {
  return (
    <Button asChild variant="ghost" size="sm">
      <a data-slot="pagination-next" className={cn("gap-1", className)} {...props}>
        Next
        <ChevronRight className="size-4" aria-hidden="true" />
      </a>
    </Button>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
