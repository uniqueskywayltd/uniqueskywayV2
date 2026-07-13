import type { BackgroundJob, BackgroundJobResult, Clock, JobRunner } from "@/application/ports";
import { logger } from "@/infrastructure/logging/logger";
import { systemClock } from "@/infrastructure/time/system-clock";

export class SequentialJobRunner implements JobRunner {
  constructor(private readonly clock: Clock = systemClock) {}

  async run(job: BackgroundJob, signal?: AbortSignal): Promise<BackgroundJobResult> {
    const startedAt = this.clock.now();
    const jobLogger = logger.child({ module: "jobs", job: job.name });

    jobLogger.info({ startedAt: startedAt.toISOString() }, "background job started");

    const result = await job.run({
      logger: jobLogger,
      startedAt,
      ...(signal === undefined ? {} : { signal }),
    });

    jobLogger.info({ status: result.status }, "background job finished");

    return result;
  }
}
