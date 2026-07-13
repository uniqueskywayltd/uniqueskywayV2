export type NotificationChannel = "in_app" | "email" | "sms" | "push";

export interface NotificationEnvelope {
  idempotencyKey: string;
  recipientId: string;
  type: string;
  channels: readonly NotificationChannel[];
  payload: Record<string, unknown>;
}

export interface NotificationDispatchResult {
  acceptedChannels: readonly NotificationChannel[];
}

export interface NotificationDispatcher {
  dispatch(envelope: NotificationEnvelope): Promise<NotificationDispatchResult>;
}
