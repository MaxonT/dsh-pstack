import type { Exclusion } from "../types.ts";

/**
 * Upstream capabilities that cannot run without Cursor cloud services. Every other
 * upstream skill must have a scenario; the coverage guard fails when both are missing.
 */
export const exclusions: readonly Exclusion[] = [
  {
    id: "make-bot-ui",
    skill: "make-bot-ui",
    reason: "Its workflow requires Cursor routines, a Grok Bot webhook, and SendToUser secrets.",
    evidence: "pstack/skills/make-bot-ui/SKILL.md#create-the-webhook-routine",
  },
  {
    id: "automations-benny",
    skill: "automations/benny",
    reason: "The automation pack requires two live Cursor automations.",
    evidence: "pstack/automations/benny/skills/setup-benny/SKILL.md",
  },
];
