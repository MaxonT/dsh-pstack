import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

import type { Phase, RunRecord } from "../../types.ts";
import { REPORT_LAYOUT } from "./run-metadata.ts";

export interface ReportManifest {
  runId: string;
  phase: Phase;
  environment: string;
  generatedAt: string;
  scenarioIds: string[];
}

export function reportRunId(records: RunRecord[]): string {
  const capturedAt = records
    .map((record) => record.capturedAt)
    .sort()
    .at(-1);
  const date = new Date(capturedAt ?? Date.now());
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join("-") +
    `_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  );
}

export function readReportManifest(directory: string): ReportManifest | null {
  const file = join(directory, "manifest.json");
  if (!existsSync(file)) return null;
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as Partial<ReportManifest>;
    if (typeof parsed.runId !== "string" || !Array.isArray(parsed.scenarioIds)) return null;
    return {
      runId: parsed.runId,
      phase: parsed.phase as Phase,
      environment: parsed.environment as string,
      generatedAt: parsed.generatedAt as string,
      scenarioIds: parsed.scenarioIds.filter((id): id is string => typeof id === "string"),
    };
  } catch {
    return null;
  }
}

export function writeReportManifest(directory: string, manifest: ReportManifest): void {
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

function copyDirectoryIfExists(source: string, target: string): void {
  if (!existsSync(source) || !statSync(source).isDirectory() || existsSync(target)) return;
  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target, { recursive: true });
}

function copyFileIfExists(source: string, target: string): void {
  if (!existsSync(source) || !statSync(source).isFile()) return;
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
}

/** Copy the current phase's generated report state before it is overwritten. */
export function archivePreviousReport(
  reportDirectory: string,
  phase: Phase,
  environment: string,
  previousRunId: string,
): void {
  const history = join(reportDirectory, "history", previousRunId);
  copyDirectoryIfExists(
    join(reportDirectory, REPORT_LAYOUT.runs, `${phase}-${environment}`),
    join(history, REPORT_LAYOUT.runs, `${phase}-${environment}`),
  );
  copyDirectoryIfExists(
    join(reportDirectory, REPORT_LAYOUT.approvals),
    join(history, REPORT_LAYOUT.approvals),
  );
  copyFileIfExists(join(reportDirectory, "index.md"), join(history, "index.md"));

  const scenarios = join(reportDirectory, REPORT_LAYOUT.scenarios);
  if (!existsSync(scenarios)) return;
  for (const group of readdirSync(scenarios, { withFileTypes: true })) {
    if (!group.isDirectory()) continue;
    const groupDirectory = join(scenarios, group.name);
    for (const scenario of readdirSync(groupDirectory, { withFileTypes: true })) {
      if (!scenario.isDirectory()) continue;
      const scenarioDirectory = join(groupDirectory, scenario.name);
      const phaseDirectory = join(scenarioDirectory, `${phase}-${environment}`);
      if (!existsSync(phaseDirectory)) continue;
      copyDirectoryIfExists(
        phaseDirectory,
        join(
          history,
          REPORT_LAYOUT.scenarios,
          group.name,
          scenario.name,
          `${phase}-${environment}`,
        ),
      );
      if (phase === "adapted") {
        copyFileIfExists(
          join(scenarioDirectory, "comparison.md"),
          join(history, REPORT_LAYOUT.scenarios, group.name, scenario.name, "comparison.md"),
        );
      }
    }
  }
}

/** Remove current-phase evidence for scenarios that did not record in this run. */
export function pruneStalePhaseEvidence(
  reportDirectory: string,
  phase: Phase,
  environment: string,
  currentScenarioIds: Set<string>,
): void {
  const scenarios = join(reportDirectory, REPORT_LAYOUT.scenarios);
  if (!existsSync(scenarios)) return;
  for (const group of readdirSync(scenarios, { withFileTypes: true })) {
    if (!group.isDirectory()) continue;
    const groupDirectory = join(scenarios, group.name);
    for (const scenario of readdirSync(groupDirectory, { withFileTypes: true })) {
      if (!scenario.isDirectory()) continue;
      const scenarioDirectory = join(groupDirectory, scenario.name);
      const phaseDirectory = join(scenarioDirectory, `${phase}-${environment}`);
      if (!currentScenarioIds.has(scenario.name) && existsSync(phaseDirectory)) {
        rmSync(phaseDirectory, { recursive: true, force: true });
      }
      if (!currentScenarioIds.has(scenario.name) && phase === "adapted") {
        rmSync(join(scenarioDirectory, "comparison.md"), { force: true });
      }
    }
  }
}
