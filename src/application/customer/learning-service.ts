import "server-only";

import { AppError } from "@/application/errors";
import type { IdentityProvider } from "@/application/auth";
import type {
  DrizzleTransactionManager,
  IdentityRepository,
  OperationsRepository,
} from "@/infrastructure/database";

import type { RequestAuditContext } from "./customer-experience-service";
import {
  getLesson,
  getPath,
  LEARNING_LESSONS,
  LEARNING_PATHS,
  recommendNextLesson,
  searchLearningCatalog,
  type LearningPathId,
} from "./learning-catalog";

export interface CustomerLearningServiceDependencies {
  identityProvider: IdentityProvider;
  identityRepository: IdentityRepository;
  operationsRepository: OperationsRepository;
  transactionManager: DrizzleTransactionManager;
}

const COMPLETE_ACTION = "customer.lesson_completed";
const COMPLETE_TARGET = "learning_lesson";

export class CustomerLearningService {
  constructor(private readonly deps: CustomerLearningServiceDependencies) {}

  async getLearnHome(input: { q?: string; pathId?: LearningPathId | "all" } = {}) {
    const appUser = await this.requireCurrentAppUser();
    const completed = await this.listCompletedSlugs(appUser.id);
    const recommended = recommendNextLesson(completed);
    const search = searchLearningCatalog(input.q ?? "");

    const paths = LEARNING_PATHS.map((path) => {
      const lessonsForPath = path.lessonSlugs
        .map((slug) => getLesson(slug))
        .filter((lesson): lesson is NonNullable<typeof lesson> => Boolean(lesson));
      const completedCount = lessonsForPath.filter((lesson) =>
        completed.includes(lesson.slug),
      ).length;
      return {
        id: path.id,
        title: path.title,
        description: path.description,
        lessonCount: lessonsForPath.length,
        completedCount,
        status:
          completedCount === 0
            ? ("recommended" as const)
            : completedCount === lessonsForPath.length
              ? ("completed" as const)
              : ("in_progress" as const),
        href: `/account/learn?path=${path.id}`,
      };
    });

    let lessons = (input.q?.trim() ? search.lessons : LEARNING_LESSONS).map((lesson) =>
      presentLessonSummary(lesson, completed),
    );

    if (input.pathId && input.pathId !== "all") {
      lessons = lessons.filter((lesson) => lesson.pathId === input.pathId);
    }

    return {
      understanding:
        "What should I learn next? Short, glossary-honest lessons — never a mandatory course before money actions.",
      recommended: recommended
        ? {
            ...presentLessonSummary(recommended, completed),
            reason: completed.length
              ? "Next incomplete lesson in your journey order."
              : "Start here — a calm first orientation.",
          }
        : {
            slug: null,
            title: "You’re caught up",
            reason: "Every listed lesson is marked complete. Revisit any path anytime, or open Help.",
            href: "/account/help",
          },
      progress: {
        completedCount: completed.length,
        totalCount: LEARNING_LESSONS.length,
        completed,
        inProgressPaths: paths.filter((path) => path.status === "in_progress").map((p) => p.id),
      },
      paths,
      lessons,
      emptyHint:
        lessons.length === 0
          ? "No lessons match that search. Try another phrase, or open Help."
          : null,
    };
  }

  async getLessonDetail(slug: string) {
    const appUser = await this.requireCurrentAppUser();
    const lesson = getLesson(slug);
    if (!lesson) {
      throw new AppError({ code: "NOT_FOUND", message: "Lesson was not found." });
    }

    const completed = await this.listCompletedSlugs(appUser.id);
    const path = getPath(lesson.pathId);
    const related = lesson.relatedSlugs
      .map((relatedSlug) => getLesson(relatedSlug))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item) => presentLessonSummary(item, completed));

    const next = recommendNextLesson(completed.includes(slug) ? completed : [...completed, slug]);

    return {
      lesson: {
        ...lesson,
        pathTitle: path?.title ?? lesson.pathId,
        completed: completed.includes(slug),
        status: completed.includes(slug) ? ("completed" as const) : ("recommended" as const),
      },
      related,
      nextAfterComplete: next
        ? presentLessonSummary(next, completed.includes(slug) ? [...completed, slug] : completed)
        : null,
      footer: "This is educational guidance — not investment, tax, or legal advice.",
    };
  }

  async markLessonComplete(slug: string, audit: RequestAuditContext) {
    const appUser = await this.requireCurrentAppUser();
    const lesson = getLesson(slug);
    if (!lesson) {
      throw new AppError({ code: "NOT_FOUND", message: "Lesson was not found." });
    }

    const completed = await this.listCompletedSlugs(appUser.id);
    if (!completed.includes(slug)) {
      await this.deps.transactionManager.runInTransaction(async (tx) => {
        await this.deps.operationsRepository.appendAuditLog(tx, {
          actorUserId: appUser.id,
          actorType: "customer",
          action: COMPLETE_ACTION,
          targetType: COMPLETE_TARGET,
          targetId: slug,
          metadata: { pathId: lesson.pathId, title: lesson.title },
          requestId: audit.requestId,
          ipAddressHash: audit.ipAddressHash,
          userAgentHash: audit.userAgentHash,
        });
      });
    }

    return this.getLessonDetail(slug);
  }

  private async listCompletedSlugs(userId: string): Promise<string[]> {
    const logs = await this.deps.operationsRepository.listAuditLogsByActorUserId(userId, 100);
    const slugs = logs
      .filter((row) => row.action === COMPLETE_ACTION && row.targetType === COMPLETE_TARGET)
      .map((row) => row.targetId);
    return [...new Set(slugs)];
  }

  private async requireCurrentAppUser() {
    const currentUser = await this.deps.identityProvider.getCurrentUser();
    if (!currentUser) {
      throw new AppError({ code: "AUTHENTICATION_ERROR", message: "Authentication is required." });
    }
    const appUser = await this.deps.identityRepository.findUserByAuthUserId(currentUser.authUserId);
    if (!appUser) {
      throw new AppError({
        code: "AUTHENTICATION_ERROR",
        message: "Authenticated user is not registered.",
      });
    }
    return appUser;
  }
}

function presentLessonSummary(
  lesson: NonNullable<ReturnType<typeof getLesson>>,
  completed: ReadonlyArray<string>,
) {
  const isComplete = completed.includes(lesson.slug);
  return {
    slug: lesson.slug,
    title: lesson.title,
    question: lesson.question,
    summary: lesson.summary,
    estimatedMinutes: lesson.estimatedMinutes,
    pathId: lesson.pathId,
    status: isComplete ? ("completed" as const) : ("recommended" as const),
    href: `/account/learn/${lesson.slug}`,
  };
}
