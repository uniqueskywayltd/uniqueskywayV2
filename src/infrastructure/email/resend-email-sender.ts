import "server-only";

import { Resend, type CreateEmailOptions } from "resend";

import { AppError } from "@/application/errors";
import type { EmailSender, EmailSendResult, PreparedEmail } from "@/application/ports";

export class ResendEmailSender implements EmailSender {
  constructor(private readonly client: Resend) {}

  static fromApiKey(apiKey: string): ResendEmailSender {
    return new ResendEmailSender(new Resend(apiKey));
  }

  async send(message: PreparedEmail): Promise<EmailSendResult> {
    const payload: CreateEmailOptions = {
      from: message.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.headers === undefined ? {} : { headers: message.headers }),
      ...(message.tags === undefined ? {} : { tags: message.tags }),
    };

    const result = await this.client.emails.send(
      payload,
      {
        idempotencyKey: message.idempotencyKey,
      },
    );

    if (result.error !== null) {
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: result.error.message,
        details: {
          provider: "resend",
          providerCode: result.error.name,
          statusCode: result.error.statusCode,
        },
      });
    }

    return {
      providerMessageId: result.data.id,
    };
  }
}
