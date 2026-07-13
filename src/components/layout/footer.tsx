import { APP_METADATA } from "@/config/constants";
import { cn } from "@/lib/utils";

export interface FooterProps {
  links?: readonly {
    label: string;
    href: string;
  }[];
  className?: string;
}

export function Footer({ links = [], className }: FooterProps) {
  return (
    <footer className={cn("border-t bg-background", className)}>
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>{APP_METADATA.displayName}</p>
        {links.length > 0 ? (
          <nav className="flex flex-wrap gap-4" aria-label="Footer">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
    </footer>
  );
}
