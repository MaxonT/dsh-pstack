import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

import { SCENARIO_GROUP_PHASES } from "../../types.ts";
import type { Phase, RunEnvironment, RunRecord } from "../../types.ts";
import { isRunRecord, latestRecords, recordFileName } from "./evidence.ts";
import { EVIDENCE_DIRECTORIES, EVIDENCE_FILES } from "./evidence-files.ts";
import { sanitizeRecord } from "./redaction.ts";
import { PLAYGROUND_DIRECTORY, workersDirectory } from "./run-metadata.ts";
import { loadScenario, listScenarioIds } from "./scenarios.ts";
import { workerPaths } from "./worker.ts";

export const REVIEWS_DIRECTORY = join(PLAYGROUND_DIRECTORY, "reviews");
export const STAGING_DIRECTORY = join(REVIEWS_DIRECTORY, ".staging");

export interface BatchMetadata {
  batchId: string;
  phase: Phase;
  environment: string;
  mode: "full" | "incremental";
  scope: string[];
  startedAt: string;
  upstreamRevision?: string;
}

export function reviewSnapshotDirectory(
  phase: Phase,
  environment: string,
  root = REVIEWS_DIRECTORY,
): string {
  return join(root, `${phase}-${environment}`);
}

export function batchMetadataFile(phase: Phase, environment: string): string {
  return join(workersDirectory(), phase, environment, "current-batch.json");
}

export function readBatchMetadata(phase: Phase, environment: string): BatchMetadata | null {
  const file = batchMetadataFile(phase, environment);
  if (!existsSync(file)) return null;
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as Partial<BatchMetadata>;
    if (
      typeof parsed.batchId !== "string" ||
      parsed.phase !== phase ||
      parsed.environment !== environment ||
      (parsed.mode !== "full" && parsed.mode !== "incremental") ||
      !Array.isArray(parsed.scope)
    )
      return null;
    return {
      batchId: parsed.batchId,
      phase: parsed.phase,
      environment: parsed.environment,
      mode: parsed.mode,
      scope: parsed.scope.filter((entry): entry is string => typeof entry === "string"),
      startedAt: typeof parsed.startedAt === "string" ? parsed.startedAt : "",
      ...(typeof parsed.upstreamRevision === "string"
        ? { upstreamRevision: parsed.upstreamRevision }
        : {}),
    };
  } catch {
    return null;
  }
}

export function writeBatchMetadata(metadata: BatchMetadata): void {
  const file = batchMetadataFile(metadata.phase, metadata.environment);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(metadata, null, 2)}\n`);
}

function readRecords(directory: string): RunRecord[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) return readRecords(file);
    if (!entry.name.endsWith(".json")) return [];
    try {
      const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
      return isRunRecord(parsed) ? [parsed] : [];
    } catch (error) {
      throw new Error(
        `invalid RunRecord JSON in ${file}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });
}

function phaseEligible(id: string, phase: Phase): boolean {
  const group = loadScenario(id).group;
  return group !== undefined && SCENARIO_GROUP_PHASES[group].includes(phase);
}

interface RecordSource {
  recordFile?: string;
  screenshotFile?: string;
  sessionFile?: string;
}

function sourceFor(record: RunRecord): RecordSource {
  const paths = workerPaths(record.environment.worker, record.environment.matrix.id, record.phase);
  const stamp = record.capturedAt.replace(/[:.]/g, "-");
  const sourceFile = join(
    paths.evidenceDir,
    recordFileName(record.scenarioId, record.phase, record.environment.matrix.id, stamp).replace(
      /\.json$/,
      EVIDENCE_FILES.sourceSuffix,
    ),
  );
  if (!existsSync(sourceFile)) throw new Error(`missing evidence source sidecar: ${sourceFile}`);
  return JSON.parse(readFileSync(sourceFile, "utf8")) as RecordSource;
}

function copyRunEvidence(record: RunRecord, directory: string): void {
  mkdirSync(directory, { recursive: true });
  const source = sourceFor(record);
  writeFileSync(
    join(directory, EVIDENCE_FILES.record),
    `${JSON.stringify(sanitizeRecord(record), null, 2)}\n`,
  );
  if (source.screenshotFile && existsSync(source.screenshotFile)) {
    copyFileSync(source.screenshotFile, join(directory, EVIDENCE_FILES.screenshot));
  }
  if (source.sessionFile && existsSync(source.sessionFile)) {
    copyFileSync(source.sessionFile, join(directory, EVIDENCE_FILES.session));
  }
}

function scenarioDirectory(
  phase: Phase,
  environment: string,
  scenarioId: string,
  root = REVIEWS_DIRECTORY,
): string {
  const group = loadScenario(scenarioId).group;
  if (group === undefined) throw new Error(`scenario ${scenarioId} has no group`);
  return join(
    reviewSnapshotDirectory(phase, environment, root),
    "scenarios",
    group,
    scenarioId,
    `${phase}-${environment}`,
  );
}

export interface ReviewSnapshotManifest {
  phase: Phase;
  environment: string;
  updatedAt: string;
  lastBatchId: string | null;
  lastMode: "full" | "incremental" | null;
  lastScope: string[];
  scenarioIds: string[];
  scenarios: Array<{
    id: string;
    capturedAt: string;
    batchId: string | null;
    environment: RunEnvironment;
  }>;
}

export function writeReviewSnapshot(
  phase: Phase,
  environment: string,
  batch: BatchMetadata | null,
  allRecords: RunRecord[],
  reviewsDirectory = REVIEWS_DIRECTORY,
): ReviewSnapshotManifest {
  const latest = latestRecords(allRecords);
  const current = latest.filter(
    (record) =>
      record.phase === phase &&
      record.environment.matrix.id === environment &&
      phaseEligible(record.scenarioId, phase),
  );
  const currentIds = new Set(current.map((record) => record.scenarioId));
  const snapshot = reviewSnapshotDirectory(phase, environment, reviewsDirectory);
  const scenarios = join(snapshot, EVIDENCE_DIRECTORIES.scenarios);

  if (existsSync(scenarios)) {
    for (const group of readdirSync(scenarios, { withFileTypes: true })) {
      if (!group.isDirectory()) continue;
      for (const scenario of readdirSync(join(scenarios, group.name), { withFileTypes: true })) {
        if (!scenario.isDirectory()) continue;
        if (!currentIds.has(scenario.name)) {
          rmSync(join(scenarios, group.name, scenario.name), { recursive: true, force: true });
        }
      }
    }
  }

  for (const record of current) {
    const directory = scenarioDirectory(phase, environment, record.scenarioId, reviewsDirectory);
    rmSync(directory, { recursive: true, force: true });
    copyRunEvidence(record, directory);
  }

  const manifest: ReviewSnapshotManifest = {
    phase,
    environment,
    updatedAt: new Date().toISOString(),
    lastBatchId: batch?.batchId ?? null,
    lastMode: batch?.mode ?? null,
    lastScope: batch?.scope ?? [],
    scenarioIds: [...currentIds].sort(),
    scenarios: current.map((record) => ({
      id: record.scenarioId,
      capturedAt: record.capturedAt,
      batchId: record.batchId ?? null,
      environment: record.environment,
    })),
  };
  mkdirSync(snapshot, { recursive: true });
  writeFileSync(join(snapshot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  const indexPath = join(snapshot, "index.md");
  if (!existsSync(indexPath)) {
    writeFileSync(
      indexPath,
      [
        `# ${phase}/${environment} 证据分析`,
        "",
        "> 当前快照由 collect 生成；问题问答和 dsh.md 适配审查由分析会话填写。",
        "",
      ].join("\n"),
    );
  }
  return manifest;
}

export function collectReviewSnapshot(phase: Phase, environment: string): ReviewSnapshotManifest {
  return writeReviewSnapshot(
    phase,
    environment,
    readBatchMetadata(phase, environment),
    readRecords(workersDirectory()),
  );
}

export function reviewScenarioIds(phase: Phase): string[] {
  return listScenarioIds().filter((id) => phaseEligible(id, phase));
}
