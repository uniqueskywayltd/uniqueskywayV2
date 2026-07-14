"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BookOpen } from "lucide-react";

import { Button, EmptyState, Skeleton } from "@/components/ui";
import { getCustomerJson, postCustomerJson } from "@/features/customer/api-client";

interface LessonDetailPayload {
  lesson: {
    slug: string;
    title: string;
    question: string;
    summary: string;
    body: string;
    estimatedMinutes: number;
    pathId: string;
    pathTitle: string;
    relatedSlugs: string[];
    appHref: string | null;
    appHrefLabel: string | null;
    videoNote: string | null;
    completed: boolean;
    status: "completed" | "recommended";
  };
  related: Array<{
    slug: string;
    title: string;
    href: string;
    status: string;
  }>;
  nextAfterComplete: { slug: string; title: string; href: string } | null;
  footer: string;
}

export function LessonDetailView() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const [payload, setPayload] = useState<LessonDetailPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void getCustomerJson<LessonDetailPayload>(`/api/customer/learn/${encodeURIComponent(slug)}`).then(
      (result) => {
        if (!active) return;
        if (result.error) {
          setError(result.error);
          setLoading(false);
          return;
        }
        setPayload(result.data ?? null);
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, [slug]);

  async function markComplete() {
    setSaving(true);
    const result = await postCustomerJson<LessonDetailPayload>(
      `/api/customer/learn/${encodeURIComponent(slug)}/complete`,
      {},
    );
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setPayload(result.data ?? null);
  }

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-xl" aria-label="Loading lesson" />;
  }

  if (error || !payload) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Lesson unavailable"
        description={error ?? "This lesson could not be found."}
        action={
          <Button asChild>
            <Link href="/account/learn">Back to Learning</Link>
          </Button>
        }
      />
    );
  }

  const { lesson } = payload;

  return (
    <article className="space-y-6">
      <p className="sr-only">Primary question: What should I learn next?</p>
      <header className="space-y-2 rounded-xl border border-border/80 p-5">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {lesson.pathTitle}
        </p>
        <h2 className="text-xl font-semibold">{lesson.title}</h2>
        <p className="text-sm text-muted-foreground">{lesson.question}</p>
        <p className="text-sm text-muted-foreground">{lesson.summary}</p>
        <p className="text-xs text-muted-foreground">
          About {lesson.estimatedMinutes} min · {lesson.completed ? "Completed" : "Recommended"}
        </p>
      </header>

      <section className="prose-sm max-w-none space-y-3 text-sm leading-6 text-foreground/90">
        {lesson.body.split("\n").map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </section>

      {lesson.videoNote ? (
        <p className="text-sm text-muted-foreground">{lesson.videoNote}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Text-first lesson. Video is optional on Unique Sky Way and not required to continue.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {!lesson.completed ? (
          <Button type="button" onClick={() => void markComplete()} disabled={saving}>
            {saving ? "Saving…" : "Mark as read"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">Marked complete — revisit anytime.</p>
        )}
        {lesson.appHref && lesson.appHrefLabel ? (
          <Button asChild variant="outline">
            <Link href={lesson.appHref}>{lesson.appHrefLabel}</Link>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link href="/account/learn">All lessons</Link>
        </Button>
      </div>

      {payload.nextAfterComplete && lesson.completed ? (
        <section className="rounded-xl border border-dashed border-border/80 p-4">
          <h3 className="text-sm font-semibold">Suggested next</h3>
          <p className="mt-1 text-sm text-muted-foreground">{payload.nextAfterComplete.title}</p>
          <Button asChild variant="link" className="mt-2 h-auto px-0">
            <Link href={payload.nextAfterComplete.href}>Continue</Link>
          </Button>
        </section>
      ) : null}

      {payload.related.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Related lessons</h3>
          <ul className="space-y-2">
            {payload.related.map((item) => (
              <li key={item.slug}>
                <Button asChild variant="link" className="h-auto px-0">
                  <Link href={item.href}>{item.title}</Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="border-t pt-4 text-xs text-muted-foreground">{payload.footer}</footer>
    </article>
  );
}
