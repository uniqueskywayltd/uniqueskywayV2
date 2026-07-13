import Link from "next/link";

import { Button } from "@/components/ui";
import { FadeIn } from "@/features/public/components/motion";
import { PublicPageContainer } from "@/features/public/components/public-shell";

/**
 * Sprint A1 placeholder only.
 * Homepage marketing composition is deferred to Sprint A2.
 */
export default function PublicFoundationPage() {
  return (
    <PublicPageContainer className="py-20 sm:py-28">
      <FadeIn className="mx-auto max-w-3xl">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Unique Sky Way
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-instrument-serif)] text-4xl leading-tight tracking-normal text-foreground sm:text-5xl">
          Public foundation is ready.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          Navigation, layout, theme tokens, accessibility basics, and SEO infrastructure are in
          place for Wave A. Homepage storytelling ships in Sprint A2.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/auth/register">Get started</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/auth/login">Sign in</Link>
          </Button>
        </div>
      </FadeIn>
    </PublicPageContainer>
  );
}
