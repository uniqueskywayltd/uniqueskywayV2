import type { BusinessEvent } from "@/application/events";

export interface EventPublisher {
  publish(event: BusinessEvent): Promise<void>;
  publishMany(events: readonly BusinessEvent[]): Promise<void>;
}
