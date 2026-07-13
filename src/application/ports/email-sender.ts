export interface EmailTag {
  name: string;
  value: string;
}

export interface PreparedEmail {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
  headers?: Record<string, string>;
  tags?: EmailTag[];
}

export interface EmailSendResult {
  providerMessageId: string;
}

export interface EmailSender {
  send(message: PreparedEmail): Promise<EmailSendResult>;
}
