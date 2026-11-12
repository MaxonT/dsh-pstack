import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { Phase, RuntimeFinding } from "../../types.ts";
import { REVIEWS_DIRECTORY } from "./review.ts";
import { REPORT_LAYOUT } from "./run-metadata.ts";

export const RUNTIME_REVIEW_DIRECTORY = join(
  REVIEWS_DIRECTORY,
  REPORT_LAYOUT.runtimeReviewDirectory,
);

export const RUNTIME_REVIEW_NOTE_DECISIONS = [
  "pending",
  "accept",
  "reject",
  "needs-human",
] as const;
export type RuntimeReviewNoteDecision = (typeof RUNTIME_REVIEW_NOTE_DECISIONS)[number];
export type RuntimeReviewNoteCounts = Record<RuntimeReviewNoteDecision, number>;

export function emptyRuntimeReviewNoteCounts(): RuntimeReviewNoteCounts {
  return Object.fromEntries(
    RUNTIME_REVIEW_NOTE_DECISIONS.map((decision) => [decision, 0]),
  ) as RuntimeReviewNoteCounts;
}

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
  if (parsed.notes === undefined) return { phase, environment, notes: {} };
  if (typeof parsed.notes !== "object" || parsed.notes === null || Array.isArray(parsed.notes)) {
    throw new Error(`${file}: notes must be an object`);
  }
  const decisions = new Set<string>(RUNTIME_REVIEW_NOTE_DECISIONS);
  const notes: Record<string, RuntimeReviewNote> = {};
  for (const [id, note] of Object.entries(parsed.notes)) {
    if (
      typeof note !== "object" ||
      note === null ||
      typeof note.decision !== "string" ||
      !decisions.has(note.decision) ||
      typeof note.comment !== "string"
    ) {
      throw new Error(`${file}: invalid note for ${id}`);
    }
    notes[id] = { decision: note.decision as RuntimeReviewNoteDecision, comment: note.comment };
  }
  return { phase, environment, notes };
}

/** Create missing skeleton entries without overwriting existing comments. */
export function ensureRuntimeReviewNotes(
  phase: Phase,
  environment: string,
  findings: Array<{ id: string }>,
): RuntimeReviewNotes {
  const existing = readRuntimeReviewNotes(phase, environment);
  const currentIds = new Set(findings.map((finding) => finding.id));
  let changed = false;
  for (const id of Object.keys(existing.notes)) {
    if (currentIds.has(id)) continue;
    delete existing.notes[id];
    changed = true;
  }
  for (const finding of findings) {
    if (existing.notes[finding.id] !== undefined) continue;
    existing.notes[finding.id] = { decision: RUNTIME_REVIEW_NOTE_DECISIONS[0], comment: "" };
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
