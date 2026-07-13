import type {
  NotificationDispatcher,
  NotificationDispatchResult,
  NotificationEnvelope,
} from "@/application/ports";

export class NoopNotificationDispatcher implements NotificationDispatcher {
  async dispatch(envelope: NotificationEnvelope): Promise<NotificationDispatchResult> {
    return {
      acceptedChannels: envelope.channels,
    };
  }
}
