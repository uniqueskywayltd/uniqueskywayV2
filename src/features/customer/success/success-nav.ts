import { Award, BookOpen, FileText, Gift, Compass, type LucideIcon } from "lucide-react";

import type { MessageKey } from "@/i18n/messages/en";

/** Milestone 6 G1 — Success IA entries (`DEC-0046`). Shells only; no business logic. */
export const SUCCESS_HUB_LINKS = [
  {
    href: "/account/learn",
    titleKey: "success.hub.link.learn.title",
    descriptionKey: "success.hub.link.learn.description",
    sprintNoteKey: "success.hub.link.learn.note",
    icon: BookOpen,
  },
  {
    href: "/account/statements",
    titleKey: "success.hub.link.statements.title",
    descriptionKey: "success.hub.link.statements.description",
    sprintNoteKey: "success.hub.link.statements.note",
    icon: FileText,
  },
  {
    href: "/account/referrals",
    titleKey: "success.hub.link.referrals.title",
    descriptionKey: "success.hub.link.referrals.description",
    sprintNoteKey: "success.hub.link.referrals.note",
    icon: Gift,
  },
  {
    href: "/account/milestones",
    titleKey: "success.hub.link.milestones.title",
    descriptionKey: "success.hub.link.milestones.description",
    sprintNoteKey: "success.hub.link.milestones.note",
    icon: Award,
  },
  {
    href: "/account/help",
    titleKey: "success.hub.link.help.title",
    descriptionKey: "success.hub.link.help.description",
    sprintNoteKey: "success.hub.link.help.note",
    icon: Compass,
  },
] as const satisfies ReadonlyArray<{
  href: string;
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  sprintNoteKey: MessageKey;
  icon: LucideIcon;
}>;

/** Static progress pillars — educational framework only (no live scoring). */
export const SUCCESS_PROGRESS_PILLARS = [
  {
    id: "orient",
    titleKey: "success.pillar.orient.title",
    descriptionKey: "success.pillar.orient.description",
    href: "/dashboard",
    hrefLabelKey: "success.pillar.orient.href_label",
  },
  {
    id: "understand",
    titleKey: "success.pillar.understand.title",
    descriptionKey: "success.pillar.understand.description",
    href: "/account/learn",
    hrefLabelKey: "success.pillar.understand.href_label",
  },
  {
    id: "records",
    titleKey: "success.pillar.records.title",
    descriptionKey: "success.pillar.records.description",
    href: "/account/statements",
    hrefLabelKey: "success.pillar.records.href_label",
  },
  {
    id: "share",
    titleKey: "success.pillar.share.title",
    descriptionKey: "success.pillar.share.description",
    href: "/account/referrals",
    hrefLabelKey: "success.pillar.share.href_label",
  },
  {
    id: "milestones",
    titleKey: "success.pillar.milestones.title",
    descriptionKey: "success.pillar.milestones.description",
    href: "/account/milestones",
    hrefLabelKey: "success.pillar.milestones.href_label",
  },
] as const satisfies ReadonlyArray<{
  id: string;
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  href: string;
  hrefLabelKey: MessageKey;
}>;
