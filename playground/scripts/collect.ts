import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import type { Phase, RunRecord, RuntimeFinding, RuntimeReviewStatus } from "../types.ts";
import { assertSameEntry, isRunRecord, latestRecords } from "./lib/evidence.ts";
import { environmentMatrix, REPORT_DIRECTORY, workersDirectory } from "./lib/run-metadata.ts";
import {
  ensureRuntimeReviewNotes,
  readRuntimeReviewNotes,
  removeRuntimeReviewNotes,
  runtimeFindingId,
} from "./lib/runtime-review.ts";
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
        `| ${id} | ${phase} | ${environmentId} | unrun | unavailable | pending | unreviewed | no RunRecord | ${escape(scenario.rubric.prompt)} | missing |`,
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
      `| ${id} | ${phase} | ${environmentId} | ${verdict} | ${escape(route)} | ${record.semanticReview.status} | ${escape(runtimeOf(record).summary)} | ${escape(reason)} | ${escape(scenario.rubric.prompt)} | ${escape(record.artifacts.recordFile)} |`,
    );
  }
  for (const exclusion of exclusions) {
    rows.push(
      `| ${exclusion.id} | excluded | ${environmentId} | excluded | not run | not applicable | not applicable | ${escape(exclusion.reason)} | ${escape(exclusion.evidence)} | excluded |`,
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
    "| scenario | phase | environment | verdict | actual route | semantic review | runtime review | reason | rubric | evidence |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
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

function runtimeOf(record: RunRecord | undefined): {
  status: RuntimeReviewStatus | "unreviewed";
  summary: string;
  findings: RuntimeFinding[];
} {
  const review = record?.runtimeReview;
  if (!review) return { status: "unreviewed", summary: "unreviewed", findings: [] };
  return {
    status: review.status,
    summary: `${review.status}(${review.findings.length})`,
    findings: review.findings,
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
    } | ${analysis.via} | ${escape(runtimeOf(record).summary)} | ${escape(analysis.dependencies)} | ${escape(analysis.warnings)} |`;
  });
  return [
    `# ${scenarioId} comparison`,
    "",
    "| environment | phase | verdict | route | skill load | runtime review | dependencies | warnings |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows,
    "",
  ].join("\n");
}

function writeRuntimeReviews(current: RunRecord[], phase: Phase, environmentId: string): void {
  const counts: Record<string, number> = {};
  const findings = new Map<
    string,
    {
      id: string;
      group: string;
      skill: string;
      kind: string;
      severity: string;
      decision: string;
      observation: string;
      action: string;
      scenarios: Set<string>;
      evidence: Set<string>;
    }
  >();
  for (const record of current) {
    const scenario = loadScenario(record.scenarioId);
    const group = scenario.group ?? "skills";
    const runtime = runtimeOf(record);
    counts[runtime.status] = (counts[runtime.status] ?? 0) + 1;
    for (const finding of runtime.findings) {
      const key = [
        group,
        scenario.skill,
        finding.kind,
        finding.severity,
        finding.decision,
        finding.observation,
        finding.action,
      ].join("\0");
      const existing = findings.get(key) ?? {
        id: runtimeFindingId(group, scenario.skill, finding),
        group,
        skill: scenario.skill,
        kind: finding.kind,
        severity: finding.severity,
        decision: finding.decision,
        observation: finding.observation,
        action: finding.action,
        scenarios: new Set<string>(),
        evidence: new Set<string>(),
      };
      existing.scenarios.add(record.scenarioId);
      existing.evidence.add(finding.evidence);
      findings.set(key, existing);
    }
  }
  for (const group of ["skills", "playbooks", "official-plugins"]) {
    rmSync(join(REPORT_DIRECTORY, group, "runtime-review"), { recursive: true, force: true });
    rmSync(join(REPORT_DIRECTORY, group, "runtime-review.md"), { force: true });
  }
  rmSync(join(REPORT_DIRECTORY, "runtime-review"), { recursive: true, force: true });
  rmSync(join(REPORT_DIRECTORY, "runtime-review.md"), { force: true });
  const directory = join(REPORT_DIRECTORY, "runs", `${phase}-${environmentId}`);
  const file = join(directory, "runtime-review.md");
  if (findings.size === 0) {
    rmSync(file, { force: true });
    removeRuntimeReviewNotes(phase, environmentId);
    return;
  }
  const notes = ensureRuntimeReviewNotes(
    phase,
    environmentId,
    [...findings.values()].map(({ id }) => ({ id })),
  );
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    file,
    [
      "# Runtime review",
      "",
      `Phase: ${phase}. Environment: ${environmentId}. Scenarios: ${current.length}. Clean: ${counts["clean"] ?? 0}. Findings: ${findings.size}. Needs-review: ${counts["needs-review"] ?? 0}. Unreviewed: ${counts["unreviewed"] ?? 0}.`,
      "",
      "| id | group | skill | finding | severity | decision | scenarios | action | evidence | 你的点评 |",
      "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
      ...[...findings.values()].map((finding) => {
        const note = notes.notes[finding.id];
        const annotation = note
          ? `${note.decision}${note.comment ? `: ${note.comment}` : ""}`
          : "pending";
        return `| ${finding.id} | ${finding.group} | ${finding.skill} | ${finding.kind} | ${finding.severity} | ${finding.decision} | ${[...finding.scenarios].join(", ")} | ${escape(finding.action)} | ${escape([...finding.evidence].join("; "))} | ${escape(annotation)} |`;
      }),
      "",
    ].join("\n"),
  );
}

export function writeMirroredReports(
  phase: Phase,
  environmentId: string,
  allRecords: RunRecord[],
): void {
  const latest = latestRecords(allRecords);
  const current = latest.filter(
    (record) =>
      record.phase === phase &&
      record.environment.matrix.id === environmentId &&
      (phase !== "raw" || loadScenario(record.scenarioId).group !== "official-plugins"),
  );
  for (const legacy of ["skills", "playbooks", "official-plugins", "summary"]) {
    rmSync(join(REPORT_DIRECTORY, legacy), { recursive: true, force: true });
  }
  rmSync(join(REPORT_DIRECTORY, "approval-adapted-base.md"), { force: true });
  rmSync(join(REPORT_DIRECTORY, "approval-official-plugins.md"), { force: true });
  mkdirSync(join(REPORT_DIRECTORY, "approvals"), { recursive: true });
  const selectedIds = listScenarioIds().filter(
    (id) => phase !== "raw" || loadScenario(id).group !== "official-plugins",
  );
  const rows: string[] = [];
  const groupRows = new Map<string, string[]>();
  for (const id of selectedIds) {
    const scenario = loadScenario(id);
    const group = scenario.group ?? "skills";
    const record = current.find((entry) => entry.scenarioId === id);
    const caseRoot = join(REPORT_DIRECTORY, "scenarios", group, id);
    if (record) {
      copyRunEvidence(record, join(caseRoot, `${phase}-${environmentId}`));
      if (phase === "adapted") {
        writeFileSync(join(caseRoot, "comparison.md"), comparisonMarkdown(id, record, latest));
      }
    }
    const analysis = analysisOf(record);
    const row = `| ${id} | ${group} | ${verdictOf(record)} | ${escape(runtimeOf(record).summary)} | ${analysis.via} | ${escape(analysis.dependencies)} | ${escape(analysis.warnings)} |`;
    rows.push(row);
    const bucket = groupRows.get(group) ?? [];
    bucket.push(row);
    groupRows.set(group, bucket);
  }
  const summary = [
    `# ${phase} ${environmentId} summary`,
    "",
    `Registered scenarios: ${selectedIds.length}.`,
    "",
    "| scenario | group | verdict | runtime review | skill load | dependencies | warnings |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...rows,
    "",
  ].join("\n");
  const runPath = join(REPORT_DIRECTORY, "runs", `${phase}-${environmentId}`);
  mkdirSync(runPath, { recursive: true });
  for (const name of readdirSync(runPath)) {
    if (/^summary-.*\.md$/.test(name)) rmSync(join(runPath, name), { force: true });
  }
  writeFileSync(join(runPath, "summary.md"), summary);
  for (const [group, groupLines] of groupRows) {
    mkdirSync(runPath, { recursive: true });
    writeFileSync(
      join(runPath, `summary-${group}.md`),
      [
        `# ${group} ${phase} ${environmentId} summary`,
        "",
        "| scenario | group | verdict | runtime review | skill load | dependencies | warnings |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        ...groupLines,
        "",
      ].join("\n"),
    );
  }

  writeRuntimeReviews(current, phase, environmentId);

  if (phase === "adapted" && environmentId === "base") {
    const failed = current.filter((record) => record.verdict.status !== "verified");
    const registered = listScenarioIds().length;
    const unrun = registered - current.length;
    const runtimeCounts: Record<string, number> = {};
    const runtimeEntries = current.flatMap((record) => {
      const runtime = runtimeOf(record);
      runtimeCounts[runtime.status] = (runtimeCounts[runtime.status] ?? 0) + 1;
      return runtime.findings.map((finding) => ({
        record,
        finding,
        status: runtime.status,
      }));
    });
    for (const status of [
      "clean",
      "findings",
      "needs-review",
      "blocked",
      "environment-only",
      "upstream-only",
      "unreviewed",
    ]) {
      runtimeCounts[status] ??= 0;
    }
    const blockingRuntime = runtimeEntries.filter(
      ({ finding }) =>
        ["blocker", "major"].includes(finding.severity) &&
        ["dsh-md", "plugin", "skip"].includes(finding.decision),
    ).length;
    const noteCounts = { pending: 0, accept: 0, reject: 0, "needs-human": 0 };
    for (const note of Object.values(readRuntimeReviewNotes(phase, environmentId).notes)) {
      noteCounts[note.decision] += 1;
    }
    const runtimeGate =
      (runtimeCounts["needs-review"] ?? 0) +
        (runtimeCounts["blocked"] ?? 0) +
        (runtimeCounts["unreviewed"] ?? 0) +
        blockingRuntime +
        noteCounts.pending +
        noteCounts.reject +
        noteCounts["needs-human"] +
        unrun >
      0
        ? "blocked"
        : "clear";
    writeFileSync(
      join(REPORT_DIRECTORY, "approvals", "adapted-base.md"),
      [
        "# Adapted base approval",
        "",
        `Runtime gate: ${runtimeGate}.`,
        `Runtime review: clean=${runtimeCounts["clean"]}, findings=${runtimeCounts["findings"]}, needs-review=${runtimeCounts["needs-review"]}, blocked=${runtimeCounts["blocked"]}, environment-only=${runtimeCounts["environment-only"]}, upstream-only=${runtimeCounts["upstream-only"]}, unreviewed=${runtimeCounts["unreviewed"]}.`,
        `Runtime notes: pending=${noteCounts.pending}, accept=${noteCounts.accept}, reject=${noteCounts.reject}, needs-human=${noteCounts["needs-human"]}.`,
        `Semantic review: verified=${current.length - failed.length}, not-verified=${failed.length}. Registered=${registered}, recorded=${current.length}, unrun=${unrun}.`,
        ...(unrun > 0
          ? [
              "",
              `> This is a partial run: ${unrun} registered scenarios have no record. Do not treat it as a full approval.`,
            ]
          : []),
        "",
        "## Runtime issues",
        "| skill | scenario | finding | severity | decision | action |",
        "| --- | --- | --- | --- | --- | --- |",
        ...runtimeEntries.map(
          ({ record, finding }) =>
            `| ${escape(loadScenario(record.scenarioId).skill)} | ${record.scenarioId} | ${finding.kind} | ${finding.severity} | ${finding.decision} | ${escape(finding.action)} |`,
        ),
        "",
        "## Semantic failures",
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
    const officialRuntimeEntries = official.flatMap((record) =>
      runtimeOf(record).findings.map((finding) => ({ record, finding })),
    );
    const officialNoteCounts = { pending: 0, accept: 0, reject: 0, "needs-human": 0 };
    for (const note of Object.values(readRuntimeReviewNotes(phase, environmentId).notes)) {
      officialNoteCounts[note.decision] += 1;
    }
    const officialRuntimeGate =
      official.some((record) => {
        const status = runtimeOf(record).status;
        return status === "needs-review" || status === "blocked" || status === "unreviewed";
      }) ||
      officialRuntimeEntries.some(({ finding }) =>
        ["blocker", "major"].includes(finding.severity),
      ) ||
      officialNoteCounts.pending + officialNoteCounts.reject + officialNoteCounts["needs-human"] >
        0;
    writeFileSync(
      join(REPORT_DIRECTORY, "approvals", "official-plugins.md"),
      [
        "# Official plugins approval",
        "",
        `Runtime gate: ${officialRuntimeGate ? "blocked" : "clear"}.`,
        `Runtime notes: pending=${officialNoteCounts.pending}, accept=${officialNoteCounts.accept}, reject=${officialNoteCounts.reject}, needs-human=${officialNoteCounts["needs-human"]}.`,
        `Registered official-plugin scenarios: ${registeredOfficial}. Recorded cases: ${official.length}. Recorded scenarios: ${recordedScenarios}.`,
        ...(official.length === 0
          ? ["", "> No official-plugin run has been recorded yet; this is not an approval."]
          : []),
        "",
        "## Runtime issues",
        "| skill | scenario | environment | finding | severity | decision | action |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        ...officialRuntimeEntries.map(
          ({ record, finding }) =>
            `| ${escape(loadScenario(record.scenarioId).skill)} | ${record.scenarioId} | ${record.environment.matrix.id} | ${finding.kind} | ${finding.severity} | ${finding.decision} | ${escape(finding.action)} |`,
        ),
        "",
        "## Runs",
        "| scenario | environment | verdict | runtime review |",
        "| --- | --- | --- | --- |",
        ...official.map(
          (record) =>
            `| ${record.scenarioId} | ${record.environment.matrix.id} | ${record.verdict.status} | ${escape(runtimeOf(record).summary)} |`,
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
      "- `scenarios/`：当前 phase 的 case 证据与 comparison。",
      `- \`runs/${phase}-${environmentId}/\`：summary 和 runtime-review。`,
      ...(phase === "adapted" ? ["- `approvals/`：adapted-base 与 official-plugins。"] : []),
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
