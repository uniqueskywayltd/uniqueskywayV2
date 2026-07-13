import type { AppErrorCode } from "@/application/errors/error-codes";

export interface AppErrorInput {
  code: AppErrorCode;
  message: string;
  details?: Record<string, unknown>;
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(input: AppErrorInput) {
    super(input.message, input.cause === undefined ? undefined : { cause: input.cause });
    this.name = "AppError";
    this.code = input.code;
    this.details = Object.freeze(input.details ?? {});
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
