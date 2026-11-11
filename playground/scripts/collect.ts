import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import type { Phase, RunRecord } from "../types.ts";
import { assertSameEntry, isRunRecord, latestRecords } from "./lib/evidence.ts";
import { environmentMatrix, REPORT_DIRECTORY, workersDirectory } from "./lib/run-metadata.ts";
import { loadScenario, listScenarioIds } from "./lib/scenarios.ts";
import { exclusions } from "../scenarios/exclusions.ts";

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function records(directory: string): RunRecord[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) return records(file);
    if (!entry.name.endsWith(".json")) return [];
    try {
      const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
      return isRunRecord(parsed) ? [parsed] : [];
    } catch {
      return [];
    }
  });
}

function escape(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

export function reportFor(
  phase: Phase,
  environmentId: string,
  allRecords: RunRecord[],
): {
  markdown: string;
  archived: Array<{ record: RunRecord; source: string }>;
} {
  const latest = latestRecords(allRecords);
  const current = latest.filter(
    (record) => record.phase === phase && record.environment.matrix.id === environmentId,
  );
  const statuses = [
    "observed",
    "gap",
    "blocked",
    "unobserved",
    "verified",
    "not-verified",
    "inconclusive",
  ];
  const counts: Record<string, number> = Object.fromEntries(statuses.map((status) => [status, 0]));
  const archived: Array<{ record: RunRecord; source: string }> = [];
  const rows: string[] = [];
  let unrun = 0;
  for (const id of listScenarioIds()) {
    const record = current.find((entry) => entry.scenarioId === id);
    const scenario = loadScenario(id);
    if (!record) {
      unrun += 1;
      rows.push(
        `| ${id} | ${phase} | ${environmentId} | unrun | unavailable | pending | no RunRecord | ${escape(scenario.rubric.prompt)} | missing |`,
      );
      continue;
    }
    archived.push({ record, source: record.artifacts.recordFile });
    const comparison =
      phase === "adapted"
        ? latest.find(
            (entry) =>
              entry.phase === "raw" &&
              entry.scenarioId === id &&
              entry.environment.matrix.id === environmentId,
          )
        : undefined;
    const comparisonFailures =
      phase === "adapted"
        ? comparison
          ? assertSameEntry(comparison, record, scenario)
          : ["raw comparison is missing"]
        : [];
    const route = record.target
      ? `${record.target.provider}/${record.target.model}[${record.target.effort}]`
      : "unavailable";
    const reason = [record.semanticReview.reason, ...comparisonFailures].join("; ");
    // The row verdict is what the table shows: an adapted record without a raw
    // comparison reports inconclusive no matter what its recorded verdict says.
    const verdict = comparisonFailures.length > 0 ? "inconclusive" : record.verdict.status;
    counts[verdict] += 1;
    rows.push(
      `| ${id} | ${phase} | ${environmentId} | ${verdict} | ${escape(route)} | ${record.semanticReview.status} | ${escape(reason)} | ${escape(scenario.rubric.prompt)} | ${escape(record.artifacts.recordFile)} |`,
    );
  }
  for (const exclusion of exclusions) {
    rows.push(
      `| ${exclusion.id} | excluded | ${environmentId} | excluded | not run | not applicable | ${escape(exclusion.reason)} | ${escape(exclusion.evidence)} | excluded |`,
    );
  }
  const metadata = current[0]?.environment;
  const lines = [
    `# Playground ${phase} evidence`,
    "",
    `Environment: ${environmentId}. Registered scenarios: ${listScenarioIds().length}. Exclusions: ${exclusions.length}.`,
    `DSH: ${metadata?.dshVersion ?? "not observed"}. Upstream: ${metadata?.upstreamRevision ?? "not observed"}.`,
    `Config hash: ${metadata?.configHash ?? "not observed"}. Adapted package: ${metadata?.adaptedVersion ?? "none"}.`,
    "",
    "```json",
    JSON.stringify({ ...counts, unrun, excluded: exclusions.length }, null, 2),
    "```",
    "",
    "| scenario | phase | environment | verdict | actual route | semantic review | reason | rubric | evidence |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows,
    "",
  ];
  return { markdown: lines.join("\n"), archived };
}

function verdictOf(record: RunRecord | undefined): string {
  return record?.verdict.status ?? "unrun";
}

function analysisOf(record: RunRecord | undefined): {
  via: string;
  dependencies: string;
  warnings: string;
} {
  const analysis = record?.session?.analysis;
  if (!analysis)
    return { via: "unavailable", dependencies: "unavailable", warnings: "unavailable" };
  return {
    via: analysis.skillInvocation.loadedVia,
    dependencies:
      analysis.dependencies
        .map((entry) => `${entry.name}:${entry.available ? "available" : "missing"}`)
        .join(", ") || "none",
    warnings: analysis.warnings.join("; ") || "none",
  };
}

function copyRunEvidence(record: RunRecord, directory: string): void {
  mkdirSync(directory, { recursive: true });
  if (existsSync(record.artifacts.recordFile)) {
    copyFileSync(record.artifacts.recordFile, join(directory, "record.json"));
  }
  if (record.artifacts.screenshotFile && existsSync(record.artifacts.screenshotFile)) {
    copyFileSync(record.artifacts.screenshotFile, join(directory, "screenshot.png"));
  }
  if (record.artifacts.fullScreenshotFile && existsSync(record.artifacts.fullScreenshotFile)) {
    copyFileSync(record.artifacts.fullScreenshotFile, join(directory, "full.png"));
  }
  if (record.session?.sessionFile && existsSync(record.session.sessionFile)) {
    copyFileSync(record.session.sessionFile, join(directory, "session.jsonl.zstd"));
  }
}

function comparisonMarkdown(scenarioId: string, current: RunRecord, latest: RunRecord[]): string {
  const raw = latest.find(
    (record) =>
      record.scenarioId === scenarioId &&
      record.phase === "raw" &&
      record.environment.matrix.id === "base",
  );
  const adaptedBase = latest.find(
    (record) =>
      record.scenarioId === scenarioId &&
      record.phase === "adapted" &&
      record.environment.matrix.id === "base",
  );
  const unique = [
    ...new Map(
      [raw, adaptedBase, current]
        .filter((record): record is RunRecord => record !== undefined)
        .map((record) => [
          `${record.scenarioId}:${record.phase}:${record.environment.matrix.id}`,
          record,
        ]),
    ).values(),
  ];
  const rows = unique.map((record) => {
    const analysis = analysisOf(record);
    return `| ${record.environment.matrix.id} | ${record.phase} | ${record.verdict.status} | ${
      record.target
        ? `${record.target.provider}/${record.target.model}[${record.target.effort}]`
        : "unavailable"
    } | ${analysis.via} | ${escape(analysis.dependencies)} | ${escape(analysis.warnings)} |`;
  });
  return [
    `# ${scenarioId} comparison`,
    "",
    "| environment | phase | verdict | route | skill load | dependencies | warnings |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...rows,
    "",
  ].join("\n");
}

export function writeMirroredReports(
  phase: Phase,
  environmentId: string,
  allRecords: RunRecord[],
): void {
  const latest = latestRecords(allRecords);
  const current = latest.filter(
    (record) => record.phase === phase && record.environment.matrix.id === environmentId,
  );
  const rows: string[] = [];
  const groupRows = new Map<string, string[]>();
  for (const id of listScenarioIds()) {
    const scenario = loadScenario(id);
    const group = scenario.group ?? "skills";
    const record = current.find((entry) => entry.scenarioId === id);
    const caseRoot = join(REPORT_DIRECTORY, group, id);
    if (record) {
      copyRunEvidence(record, join(caseRoot, `${phase}-${environmentId}`));
      if (phase === "adapted") {
        writeFileSync(join(caseRoot, "comparison.md"), comparisonMarkdown(id, record, latest));
      }
    }
    const analysis = analysisOf(record);
    const row = `| ${id} | ${group} | ${verdictOf(record)} | ${analysis.via} | ${escape(analysis.dependencies)} | ${escape(analysis.warnings)} |`;
    rows.push(row);
    const bucket = groupRows.get(group) ?? [];
    bucket.push(row);
    groupRows.set(group, bucket);
  }
  const summary = [
    `# ${phase} ${environmentId} summary`,
    "",
    `Registered scenarios: ${listScenarioIds().length}.`,
    "",
    "| scenario | group | verdict | skill load | dependencies | warnings |",
    "| --- | --- | --- | --- | --- | --- |",
    ...rows,
    "",
  ].join("\n");
  const groupPath = join(REPORT_DIRECTORY, "summary");
  mkdirSync(groupPath, { recursive: true });
  writeFileSync(join(groupPath, `${phase}-${environmentId}.md`), summary);
  for (const [group, groupLines] of groupRows) {
    const directory = join(REPORT_DIRECTORY, group);
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      join(directory, `summary-${phase}-${environmentId}.md`),
      [
        `# ${group} ${phase} ${environmentId} summary`,
        "",
        "| scenario | group | verdict | skill load | dependencies | warnings |",
        "| --- | --- | --- | --- | --- | --- |",
        ...groupLines,
        "",
      ].join("\n"),
    );
  }

  if (phase === "adapted" && environmentId === "base") {
    const failed = current.filter((record) => record.verdict.status !== "verified");
    const registered = listScenarioIds().length;
    const unrun = registered - current.length;
    writeFileSync(
      join(REPORT_DIRECTORY, "approval-adapted-base.md"),
      [
        "# Adapted base approval",
        "",
        `Registered scenarios: ${registered}. Recorded: ${current.length}. Unrun: ${unrun}. Verified: ${current.length - failed.length}. Not verified: ${failed.length}.`,
        ...(unrun > 0
          ? [
              "",
              `> This is a partial run: ${unrun} registered scenarios have no record. Do not treat it as a full approval.`,
            ]
          : []),
        "",
        "| scenario | verdict | reason |",
        "| --- | --- | --- |",
        ...failed.map(
          (record) =>
            `| ${record.scenarioId} | ${record.verdict.status} | ${escape(
              "reason" in record.verdict ? (record.verdict.reason ?? "") : "",
            )} |`,
        ),
        "",
      ].join("\n"),
    );
  }
  if (phase === "adapted" && environmentId !== "base") {
    const official = latest.filter((record) => {
      const scenario = loadScenario(record.scenarioId);
      return record.phase === "adapted" && scenario.group === "official-plugins";
    });
    const registeredOfficial = listScenarioIds().filter(
      (id) => loadScenario(id).group === "official-plugins",
    ).length;
    const recordedScenarios = new Set(official.map((record) => record.scenarioId)).size;
    writeFileSync(
      join(REPORT_DIRECTORY, "approval-official-plugins.md"),
      [
        "# Official plugins approval",
        "",
        `Registered official-plugin scenarios: ${registeredOfficial}. Recorded cases: ${official.length}. Recorded scenarios: ${recordedScenarios}.`,
        ...(official.length === 0
          ? ["", "> No official-plugin run has been recorded yet; this is not an approval."]
          : []),
        "",
        "| scenario | environment | verdict |",
        "| --- | --- | --- |",
        ...official.map(
          (record) =>
            `| ${record.scenarioId} | ${record.environment.matrix.id} | ${record.verdict.status} |`,
        ),
        "",
      ].join("\n"),
    );
  }
  writeFileSync(
    join(REPORT_DIRECTORY, "index.md"),
    [
      "# Playground reports",
      "",
      "- `summary/`：按 phase 与环境汇总。",
      "- `skills/`、`playbooks/`、`official-plugins/`：每个 case 的运行记录、截图、comparison 与组根 `summary-*.md`。",
      "- `approval-adapted-base.md`：移植验收审批。",
      "- `approval-official-plugins.md`：官方插件矩阵审批。",
      "",
    ].join("\n"),
  );
}

function main(): void {
  const phase = argValue("--phase") as Phase | undefined;
  if (phase !== "raw" && phase !== "adapted")
    throw new Error("collect requires --phase raw|adapted --environment ID");
  const matrix = environmentMatrix(argValue("--environment"));
  writeMirroredReports(phase, matrix.id, records(workersDirectory()));
  console.log(`[collect] reports=${REPORT_DIRECTORY}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(`[collect] ERROR: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
