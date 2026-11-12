import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { Phase, RuntimeFinding } from "../../types.ts";
import { PLAYGROUND_DIRECTORY } from "./run-metadata.ts";

export const RUNTIME_REVIEW_DIRECTORY = join(PLAYGROUND_DIRECTORY, "reviews/runtime-review");

export type RuntimeReviewNoteDecision = "pending" | "accept" | "reject" | "needs-human";

export interface RuntimeReviewNote {
  decision: RuntimeReviewNoteDecision;
  comment: string;
}

export interface RuntimeReviewNotes {
  phase: Phase;
  environment: string;
  notes: Record<string, RuntimeReviewNote>;
}

export function runtimeReviewNotesFile(phase: Phase, environment: string): string {
  return join(RUNTIME_REVIEW_DIRECTORY, `${phase}-${environment}.json`);
}

export function runtimeFindingId(group: string, skill: string, finding: RuntimeFinding): string {
  return `rt-${createHash("sha1")
    .update(
      [
        group,
        skill,
        finding.kind,
        finding.severity,
        finding.decision,
        finding.observation,
        finding.action,
      ].join("\0"),
    )
    .digest("hex")
    .slice(0, 8)}`;
}

export function readRuntimeReviewNotes(phase: Phase, environment: string): RuntimeReviewNotes {
  const file = runtimeReviewNotesFile(phase, environment);
  if (!existsSync(file)) return { phase, environment, notes: {} };
  const parsed = JSON.parse(readFileSync(file, "utf8")) as Partial<RuntimeReviewNotes>;
  return {
    phase,
    environment,
    notes: parsed.notes ?? {},
  };
}

/** Create missing skeleton entries without overwriting existing comments. */
export function ensureRuntimeReviewNotes(
  phase: Phase,
  environment: string,
  findings: Array<{ id: string }>,
): RuntimeReviewNotes {
  const existing = readRuntimeReviewNotes(phase, environment);
  let changed = false;
  for (const finding of findings) {
    if (existing.notes[finding.id] !== undefined) continue;
    existing.notes[finding.id] = { decision: "pending", comment: "" };
    changed = true;
  }
  if (changed || !existsSync(runtimeReviewNotesFile(phase, environment))) {
    mkdirSync(dirname(runtimeReviewNotesFile(phase, environment)), { recursive: true });
    writeFileSync(
      runtimeReviewNotesFile(phase, environment),
      `${JSON.stringify(existing, null, 2)}\n`,
    );
  }
  return existing;
}

export function removeRuntimeReviewNotes(phase: Phase, environment: string): void {
  rmSync(runtimeReviewNotesFile(phase, environment), { force: true });
}
