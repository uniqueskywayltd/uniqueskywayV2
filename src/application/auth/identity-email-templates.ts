import "server-only";

import {
  renderProductionEmail,
  type RenderedProductionEmail,
} from "@/application/notifications/production-email-renderer";

import type { IdentityEmailTemplate } from "./identity-email-queue";

export interface RenderIdentityEmailInput {
  templateKey: IdentityEmailTemplate;
  metadata: Record<string, unknown>;
}

export type RenderedIdentityEmail = Omit<RenderedProductionEmail, "previewId">;

/** Identity emails use the same canonical production templates. */
export async function renderIdentityEmail(
  input: RenderIdentityEmailInput,
): Promise<RenderedIdentityEmail> {
  const rendered = await renderProductionEmail({
    templateKey: input.templateKey,
    metadata: input.metadata,
  });
  return {
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  };
}
