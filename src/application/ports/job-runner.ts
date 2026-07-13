import type { Logger } from "pino";

export interface BackgroundJobContext {
  logger: Logger;
  startedAt: Date;
  signal?: AbortSignal;
}

export interface BackgroundJobResult {
  status: "completed" | "skipped";
  metadata?: Record<string, unknown>;
}

export interface BackgroundJob {
  name: string;
  run(context: BackgroundJobContext): Promise<BackgroundJobResult>;
}

export interface JobRunner {
  run(job: BackgroundJob, signal?: AbortSignal): Promise<BackgroundJobResult>;
}
