import { describe, expect, it } from "vitest";

import { AppError, isAppError } from "@/application/errors";

describe("AppError", () => {
  it("preserves typed error code and details", () => {
    const error = new AppError({
      code: "VALIDATION_ERROR",
      message: "Invalid input",
      details: { field: "email" },
    });

    expect(isAppError(error)).toBe(true);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details).toEqual({ field: "email" });
  });
});
