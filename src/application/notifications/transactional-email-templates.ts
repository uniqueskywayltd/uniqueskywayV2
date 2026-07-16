import "server-only";

import {
  renderProductionEmail,
  type RenderProductionEmailInput,
  type RenderedProductionEmail,
} from "./production-email-renderer";

export type RenderTransactionalEmailInput = RenderProductionEmailInput;
export type RenderedTransactionalEmail = Omit<RenderedProductionEmail, "previewId"> & {
  previewId?: string;
};

/** Renders every queued template with the canonical production React Email templates. */
export async function renderTransactionalEmail(
  input: RenderTransactionalEmailInput,
): Promise<RenderedTransactionalEmail> {
  const rendered = await renderProductionEmail(input);
  return {
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    previewId: rendered.previewId,
  };
}
