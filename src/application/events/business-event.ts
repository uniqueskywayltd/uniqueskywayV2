import type { IsoDateTimeString } from "@/domains/shared";

export interface EventAggregateRef {
  type: string;
  id: string;
}

export interface EventMetadata {
  requestId?: string;
  correlationId?: string;
  causationId?: string;
}

export interface BusinessEvent<
  TName extends string = string,
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;
  name: TName;
  aggregate: EventAggregateRef;
  occurredAt: IsoDateTimeString;
  payload: TPayload;
  metadata: EventMetadata;
}
