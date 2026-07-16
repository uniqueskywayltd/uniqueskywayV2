import "server-only";

import { Resend, type CreateEmailOptions } from "resend";

import { AppError } from "@/application/errors";
import type { EmailSender, EmailSendResult, PreparedEmail } from "@/application/ports";
import { logger } from "@/infrastructure/logging/logger";

export class ResendEmailSender implements EmailSender {
  constructor(private readonly client: Resend) {}

  static fromApiKey(apiKey: string): ResendEmailSender {
    logger.info(
      {
        event: "email.resend.client_initialized",
        apiKeyLoaded: apiKey.length > 0,
        apiKeyNonEmpty: apiKey.trim().length > 0,
        apiKeyLength: apiKey.length,
      },
      "Resend client initialized",
    );
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

    logger.info(
      {
        event: "email.resend.request",
        provider: "resend",
        requestBody: {
          from: payload.from,
          to: payload.to,
          subject: payload.subject,
          headers: payload.headers,
          tags: payload.tags,
          htmlBytes: typeof payload.html === "string" ? Buffer.byteLength(payload.html, "utf8") : 0,
          textBytes: typeof payload.text === "string" ? Buffer.byteLength(payload.text, "utf8") : 0,
          htmlAndTextRedacted: true,
        },
      },
      "Resend API request started",
    );

    const result = await this.client.emails
      .send(payload, {
        idempotencyKey: message.idempotencyKey,
      })
      .catch((error: unknown) => {
        logger.error(
          {
            event: "email.resend.exception",
            provider: "resend",
            err: error,
          },
          "Resend SDK threw an exception",
        );
        throw error;
      });

    logger.info(
      {
        event: "email.resend.response",
        provider: "resend",
        resendResponse: result,
        providerMessageId: result.data?.id ?? null,
        success: result.error === null,
      },
      "Resend API response received",
    );

    if (result.error !== null) {
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: result.error.message,
        details: {
          provider: "resend",
          response: result.error,
        },
      });
    }

    return {
      providerMessageId: result.data.id,
    };
  }
}
