"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Search } from "lucide-react";

import { Button, EmptyState, Skeleton } from "@/components/ui";
import { getCustomerJson } from "@/features/customer/api-client";

interface LearnHomePayload {
  understanding: string;
  recommended: {
    slug: string | null;
    title: string;
    summary?: string;
    reason: string;
    href: string;
    estimatedMinutes?: number;
  };
  progress: {
    completedCount: number;
    totalCount: number;
    completed: string[];
  };
  paths: Array<{
    id: string;
    title: string;
    description: string;
    lessonCount: number;
    completedCount: number;
    status: "recommended" | "in_progress" | "completed";
    href: string;
  }>;
  lessons: Array<{
    slug: string;
    title: string;
    question: string;
    summary: string;
    estimatedMinutes: number;
    pathId: string;
    status: "recommended" | "completed";
    href: string;
  }>;
  emptyHint: string | null;
}

export function LearningHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathId = searchParams.get("path") ?? "all";
  const query = searchParams.get("q") ?? "";
  const [q, setQ] = useState(query);
  const [payload, setPayload] = useState<LearnHomePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (pathId !== "all") params.set("path", pathId);
    const url = `/api/customer/learn${params.size ? `?${params}` : ""}`;

    void getCustomerJson<LearnHomePayload>(url).then((result) => {
      if (!active) return;
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setPayload(result.data ?? null);
      setError(null);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [query, pathId]);

  function navigateLearn(next: { pathId?: string; query?: string }) {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    const nextPath = next.pathId ?? pathId;
    const nextQuery = next.query ?? query;
    if (nextPath !== "all") params.set("path", nextPath);
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    const qs = params.toString();
    router.push(qs ? `/account/learn?${qs}` : "/account/learn");
  }

  if (error) {
    return (
      <section className="rounded-xl border border-border/80 p-6">
        <h2 className="text-base font-semibold">Learning unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/account/help">Open Help</Link>
        </Button>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <p className="sr-only">Primary question: What should I learn next?</p>

      <section className="rounded-xl border border-border/80 p-5">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
          <div className="space-y-2">
            <h2 className="text-base font-semibold">Recommended next</h2>
            <p className="text-sm text-muted-foreground">
              {payload?.understanding ??
                "Short lessons that help you succeed — never points, quizzes, or pressure."}
            </p>
            {loading && !payload ? (
              <Skeleton className="h-20 w-full rounded-lg" aria-label="Loading recommendation" />
            ) : payload ? (
              <div className="rounded-lg border border-dashed border-border/80 p-4">
                <p className="text-sm font-semibold text-foreground">{payload.recommended.title}</p>
                {payload.recommended.summary ? (
                  <p className="mt-1 text-sm text-muted-foreground">{payload.recommended.summary}</p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">{payload.recommended.reason}</p>
                {payload.recommended.estimatedMinutes ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    About {payload.recommended.estimatedMinutes} min
                  </p>
                ) : null}
                <Button asChild className="mt-3" size="sm">
                  <Link href={payload.recommended.href}>
                    {payload.recommended.slug ? "Open lesson" : "Open Help"}
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Progress: {payload?.progress.completedCount ?? 0} of {payload?.progress.totalCount ?? 0}{" "}
          lessons marked complete — private, calm, optional.
        </p>
        <form
          className="flex w-full max-w-sm gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            navigateLearn({ query: q });
          }}
        >
          <label className="sr-only" htmlFor="learn-search">
            Search lessons
          </label>
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              id="learn-search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search learning"
              className="h-9 w-full rounded-md border bg-background pr-3 pl-9 text-sm"
            />
          </div>
          <Button type="submit" size="sm" variant="outline">
            Search
          </Button>
        </form>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Learning paths</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={pathId === "all" ? "default" : "outline"}
            onClick={() => navigateLearn({ pathId: "all" })}
          >
            All
          </Button>
          {(payload?.paths ?? []).map((path) => (
            <Button
              key={path.id}
              type="button"
              size="sm"
              variant={pathId === path.id ? "default" : "outline"}
              onClick={() => navigateLearn({ pathId: path.id })}
            >
              {path.title}
            </Button>
          ))}
        </div>
        {loading ? (
          <Skeleton className="h-40 w-full rounded-xl" aria-label="Loading paths" />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {(payload?.paths ?? []).map((path) => (
              <li key={path.id} className="rounded-xl border border-border/80 p-4">
                <h3 className="text-sm font-semibold">{path.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{path.description}</p>
                <p className="mt-2 text-xs text-muted-foreground capitalize">
                  {path.status.replaceAll("_", " ")} · {path.completedCount}/{path.lessonCount}
                </p>
                <Button asChild variant="link" className="mt-2 h-auto px-0">
                  <Link href={path.href}>View path</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Lessons</h2>
        {loading ? (
          <Skeleton className="h-40 w-full rounded-xl" aria-label="Loading lessons" />
        ) : !payload || payload.lessons.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No matching lessons"
            description={payload?.emptyHint ?? "Try another search or open Help."}
            action={
              <Button asChild>
                <Link href="/account/help">Open Help</Link>
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border/70 rounded-xl border border-border/80">
            {payload.lessons.map((lesson) => (
              <li key={lesson.slug}>
                <Link
                  href={lesson.href}
                  className="flex flex-col gap-1 px-4 py-4 hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{lesson.title}</p>
                    <p className="text-xs text-muted-foreground">{lesson.summary}</p>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {lesson.status} · {lesson.estimatedMinutes} min
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
