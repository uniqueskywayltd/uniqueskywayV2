import { describe, expect, it } from "vitest";

import {
  recommendNextLesson,
  recommendationOrder,
  searchLearningCatalog,
} from "@/application/customer/learning-catalog";

describe("learning catalog", () => {
  it("recommends the first incomplete lesson in journey order", () => {
    const first = recommendationOrder()[0];
    expect(recommendNextLesson([])?.slug).toBe(first);
    expect(recommendNextLesson([first!])?.slug).toBe(recommendationOrder()[1]);
  });

  it("returns null when every lesson is complete", () => {
    expect(recommendNextLesson(recommendationOrder())).toBeNull();
  });

  it("searches titles and bodies", () => {
    const result = searchLearningCatalog("accrued");
    expect(result.lessons.some((lesson) => lesson.slug === "accrued-vs-credited")).toBe(true);
  });
});
