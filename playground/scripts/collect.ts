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

import {
  BLOCKING_RUNTIME_DECISIONS,
  BLOCKING_RUNTIME_SEVERITIES,
  isOfficialPluginScenario,
  isPhase,
  RUNTIME_REVIEW_STATUSES,
  SCENARIO_GROUP_PHASES,
  SCENARIO_GROUPS,
  VERDICT_STATUSES,
} from "../types.ts";
import type {
  Phase,
  RunRecord,
  RuntimeFinding,
  RuntimeReviewStatus,
  ScenarioGroup,
} from "../types.ts";
import { assertSameEntry, isRunRecord, latestRecords } from "./lib/evidence.ts";
import {
  APPROVAL_FILES,
  environmentMatrix,
  REPORT_DIRECTORY,
  REPORT_LAYOUT,
  workersDirectory,
} from "./lib/run-metadata.ts";
import {
  archivePreviousReport,
  pruneStalePhaseEvidence,
  readReportManifest,
  reportRunId,
  writeReportManifest,
} from "./lib/report-history.ts";
import {
  archiveRuntimeReviewNotes,
  emptyRuntimeReviewNoteCounts,
  ensureRuntimeReviewNotes,
  readRuntimeReviewNotes,
  removeRuntimeReviewNotes,
  runtimeFindingId,
} from "./lib/runtime-review.ts";
import { loadScenario, listScenarioIds } from "./lib/scenarios.ts";
import { exclusions } from "../scenarios/exclusions.ts";

const GROUP_LABELS: Record<string, string> = {
  skills: "技能",
  playbooks: "playbook 场景",
  "official-plugins": "官方插件",
  "runtime-tools": "运行时工具",
};

const VERDICT_LABELS: Record<string, string> = {
  observed: "已观察",
  gap: "缺口",
  blocked: "阻塞",
  unobserved: "未观察",
  verified: "验证通过",
  "not-verified": "未验证",
  inconclusive: "不确定",
  unrun: "未运行",
};

const RUNTIME_STATUS_LABELS: Record<string, string> = {
  clean: "干净",
  findings: "发现",
  blocked: "阻塞",
  "environment-only": "仅环境限制",
  "upstream-only": "仅上游问题",
  "needs-review": "待审查",
  unreviewed: "未审查",
};

const SKILL_LOAD_LABELS: Record<string, string> = {
  skill: "技能工具",
  pstack_skill: "pstack 工具",
  read: "读取回退",
  "user-gesture": "用户手势",
  none: "无",
};

const FINDING_KIND_LABELS: Record<string, string> = {
  "runtime-missing": "运行时缺失",
  "runtime-difference": "运行时差异",
  "adapter-gap": "适配缺口",
  "plugin-gap": "插件能力缺口",
  "environment-only": "仅环境限制",
  "upstream-skill": "上游技能问题",
  unclear: "不明确",
};

const SEVERITY_LABELS: Record<string, string> = {
  blocker: "阻断",
  major: "严重",
  minor: "轻微",
  info: "信息",
};

const DECISION_LABELS: Record<string, string> = {
  "dsh-md": "dsh.md",
  plugin: "插件",
  skip: "跳过",
  "ignore-environment": "忽略环境",
  upstream: "上游",
  "needs-human": "需要人工",
};

const NOTE_LABELS: Record<string, string> = {
  pending: "待点评",
  accept: "接受",
  reject: "拒绝",
  "needs-human": "需要人工",
};

const VERDICT_PRIORITY: Record<string, number> = {
  gap: 0,
  "not-verified": 1,
  blocked: 2,
  unobserved: 3,
  inconclusive: 4,
  unrun: 5,
  observed: 6,
  verified: 7,
};

const SEVERITY_PRIORITY: Record<string, number> = {
  blocker: 0,
  major: 1,
  minor: 2,
  info: 3,
};

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

function scenarioGroup(id: string): ScenarioGroup {
  const group = loadScenario(id).group;
  if (group === undefined) throw new Error(`scenario ${id} has no group`);
  return group;
}

function phaseEligible(id: string, phase: Phase): boolean {
  return SCENARIO_GROUP_PHASES[scenarioGroup(id)].includes(phase);
}

function visibleScenarioIds(phase: Phase): string[] {
  return listScenarioIds().filter((id) => phaseEligible(id, phase));
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
    (record) =>
      record.phase === phase &&
      record.environment.matrix.id === environmentId &&
      phaseEligible(record.scenarioId, phase),
  );
  const counts: Record<string, number> = Object.fromEntries(
    VERDICT_STATUSES.map((status) => [status, 0]),
  );
  const archived: Array<{ record: RunRecord; source: string }> = [];
  const rows: string[] = [];
  let unrun = 0;
  for (const id of visibleScenarioIds(phase)) {
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
    `Environment: ${environmentId}. Registered scenarios: ${visibleScenarioIds(phase).length}. Exclusions: ${exclusions.length}.`,
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

function warningText(warnings: string[]): string {
  const translated = warnings.map((warning) => {
    const notLoaded = /^skill (.+) was not loaded$/.exec(warning);
    if (notLoaded) return `技能 ${notLoaded[1]} 未加载`;
    const dependencyMissing = /^dependency (.+) is unavailable$/.exec(warning);
    if (dependencyMissing) return `依赖 ${dependencyMissing[1]} 不可用`;
    const dependencyNotLoaded = /^dependency (.+) was not loaded$/.exec(warning);
    if (dependencyNotLoaded) return `依赖 ${dependencyNotLoaded[1]} 未加载`;
    const retries = /^(.+) needed (\d+) attempts with (\d+) failures$/.exec(warning);
    if (retries) return `${retries[1]} 重试 ${retries[2]} 次，失败 ${retries[3]} 次`;
    return warning;
  });
  return translated.join("；") || "无";
}

function analysisOf(record: RunRecord | undefined): {
  via: string;
  dependencies: string;
  warnings: string;
} {
  const analysis = record?.session?.analysis;
  if (!analysis) return { via: "不可用", dependencies: "不可用", warnings: "不可用" };
  return {
    via:
      SKILL_LOAD_LABELS[analysis.skillInvocation.loadedVia] ?? analysis.skillInvocation.loadedVia,
    dependencies:
      analysis.dependencies
        .map((entry) => `${entry.name}:${entry.available ? "可用" : "缺失"}`)
        .join(", ") || "无",
    warnings: warningText(analysis.warnings),
  };
}

function runtimeOf(record: RunRecord | undefined): {
  status: RuntimeReviewStatus | "unreviewed";
  summary: string;
  findings: RuntimeFinding[];
} {
  const review = record?.runtimeReview;
  if (!review) return { status: "unreviewed", summary: "未审查", findings: [] };
  return {
    status: review.status,
    summary: `${RUNTIME_STATUS_LABELS[review.status] ?? review.status}(${review.findings.length})`,
    findings: review.findings,
  };
}

function verdictLabel(record: RunRecord | undefined): string {
  const verdict = record?.verdict.status ?? "unrun";
  return VERDICT_LABELS[verdict] ?? verdict;
}

function summarySortOrder(ids: string[], records: RunRecord[]): string[] {
  const groupRank = new Map(SCENARIO_GROUPS.map((group, index) => [group, index]));
  return [...ids].sort((left, right) => {
    const leftRecord = records.find((record) => record.scenarioId === left);
    const rightRecord = records.find((record) => record.scenarioId === right);
    const priority =
      (VERDICT_PRIORITY[verdictOf(leftRecord)] ?? 99) -
      (VERDICT_PRIORITY[verdictOf(rightRecord)] ?? 99);
    if (priority !== 0) return priority;
    const group =
      (groupRank.get(scenarioGroup(left)) ?? 99) - (groupRank.get(scenarioGroup(right)) ?? 99);
    return group !== 0 ? group : left.localeCompare(right);
  });
}

function gateLabel(value: string): string {
  return value === "blocked" ? "未通过" : "通过";
}

function sortRuntimeEntries<T extends { finding: RuntimeFinding }>(entries: T[]): T[] {
  return [...entries].sort((left, right) => {
    const severity =
      (SEVERITY_PRIORITY[left.finding.severity] ?? 99) -
      (SEVERITY_PRIORITY[right.finding.severity] ?? 99);
    return severity !== 0
      ? severity
      : (FINDING_KIND_LABELS[left.finding.kind] ?? left.finding.kind).localeCompare(
          FINDING_KIND_LABELS[right.finding.kind] ?? right.finding.kind,
        );
  });
}

function runtimeCountText(counts: Record<string, number>): string {
  return [...RUNTIME_REVIEW_STATUSES, "unreviewed"]
    .map((status) => `${RUNTIME_STATUS_LABELS[status] ?? status}=${counts[status] ?? 0}`)
    .join("，");
}

function noteCountText(counts: Record<string, number>): string {
  return Object.entries(counts)
    .map(([decision, count]) => `${NOTE_LABELS[decision] ?? decision}=${count}`)
    .join("，");
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
    return `| ${record.environment.matrix.id} | ${record.phase} | ${verdictLabel(record)} | ${
      record.target
        ? `${record.target.provider}/${record.target.model}[${record.target.effort}]`
        : "不可用"
    } | ${analysis.via} | ${escape(runtimeOf(record).summary)} | ${escape(analysis.dependencies)} | ${escape(analysis.warnings)} |`;
  });
  return [
    `# ${scenarioId} 对比`,
    "",
    "| 环境 | 阶段 | 结论 | 路由 | 技能加载 | 运行时审查 | 依赖 | 警告 |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows,
    "",
  ].join("\n");
}

function writeRuntimeReviews(
  current: RunRecord[],
  phase: Phase,
  environmentId: string,
  runId: string,
): void {
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
    const group = scenarioGroup(record.scenarioId);
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
  for (const group of SCENARIO_GROUPS) {
    rmSync(join(REPORT_DIRECTORY, group, REPORT_LAYOUT.runtimeReviewDirectory), {
      recursive: true,
      force: true,
    });
    rmSync(join(REPORT_DIRECTORY, group, REPORT_LAYOUT.runtimeReview), { force: true });
  }
  rmSync(join(REPORT_DIRECTORY, REPORT_LAYOUT.runtimeReviewDirectory), {
    recursive: true,
    force: true,
  });
  rmSync(join(REPORT_DIRECTORY, REPORT_LAYOUT.runtimeReview), { force: true });
  archiveRuntimeReviewNotes(phase, environmentId, runId);
  const directory = join(REPORT_DIRECTORY, REPORT_LAYOUT.runs, `${phase}-${environmentId}`);
  const file = join(directory, REPORT_LAYOUT.runtimeReview);
  if (findings.size === 0) {
    rmSync(file, { force: true });
    removeRuntimeReviewNotes(phase, environmentId);
    return;
  }
  const orderedFindings = [...findings.values()].sort((left, right) => {
    const severity =
      (SEVERITY_PRIORITY[left.severity] ?? 99) - (SEVERITY_PRIORITY[right.severity] ?? 99);
    if (severity !== 0) return severity;
    const group = (GROUP_LABELS[left.group] ?? left.group).localeCompare(
      GROUP_LABELS[right.group] ?? right.group,
    );
    return group !== 0 ? group : left.skill.localeCompare(right.skill);
  });
  const notes = ensureRuntimeReviewNotes(
    phase,
    environmentId,
    orderedFindings.map(({ id }) => ({ id })),
  );
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    file,
    [
      "# 运行时审查",
      "",
      `阶段：${phase}。环境：${environmentId}。场景：${current.length}。干净：${counts["clean"] ?? 0}。发现：${findings.size}。待审查：${counts["needs-review"] ?? 0}。未审查：${counts["unreviewed"] ?? 0}。`,
      "",
      "| 严重度 | 编号 | 发现类型 | 分组 | 技能 | 场景 | 处置 | 建议 | 证据 | 你的点评 |",
      "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
      ...orderedFindings.map((finding) => {
        const note = notes.notes[finding.id];
        const annotation = note
          ? `${NOTE_LABELS[note.decision] ?? note.decision}${note.comment ? `：${note.comment}` : ""}`
          : "待点评";
        return `| ${SEVERITY_LABELS[finding.severity] ?? finding.severity} | ${finding.id} | ${FINDING_KIND_LABELS[finding.kind] ?? finding.kind} | ${GROUP_LABELS[finding.group] ?? finding.group} | ${finding.skill} | ${[...finding.scenarios].join(", ")} | ${DECISION_LABELS[finding.decision] ?? finding.decision} | ${escape(finding.action)} | ${escape([...finding.evidence].join("；"))} | ${escape(annotation)} |`;
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
      phaseEligible(record.scenarioId, phase),
  );
  const runPath = join(REPORT_DIRECTORY, REPORT_LAYOUT.runs, `${phase}-${environmentId}`);
  const runId = reportRunId(current);
  const previous = readReportManifest(runPath);
  if (previous && previous.runId !== runId) {
    archivePreviousReport(REPORT_DIRECTORY, phase, environmentId, previous.runId);
  }
  pruneStalePhaseEvidence(
    REPORT_DIRECTORY,
    phase,
    environmentId,
    new Set(current.map((record) => record.scenarioId)),
  );
  for (const legacy of [...SCENARIO_GROUPS, "summary"]) {
    rmSync(join(REPORT_DIRECTORY, legacy), { recursive: true, force: true });
  }
  rmSync(join(REPORT_DIRECTORY, APPROVAL_FILES.adaptedBase), { force: true });
  rmSync(join(REPORT_DIRECTORY, APPROVAL_FILES.officialPlugins), { force: true });
  mkdirSync(join(REPORT_DIRECTORY, REPORT_LAYOUT.approvals), { recursive: true });
  const selectedIds = summarySortOrder(visibleScenarioIds(phase), current);
  const rows: string[] = [];
  const groupRows = new Map<string, string[]>();
  for (const id of selectedIds) {
    const group = scenarioGroup(id);
    const record = current.find((entry) => entry.scenarioId === id);
    const caseRoot = join(REPORT_DIRECTORY, REPORT_LAYOUT.scenarios, group, id);
    if (record) {
      const caseDirectory = join(caseRoot, `${phase}-${environmentId}`);
      rmSync(caseDirectory, { recursive: true, force: true });
      copyRunEvidence(record, caseDirectory);
      if (phase === "adapted") {
        writeFileSync(join(caseRoot, "comparison.md"), comparisonMarkdown(id, record, latest));
      }
    }
    const analysis = analysisOf(record);
    const row = `| ${id} | ${GROUP_LABELS[group] ?? group} | ${verdictLabel(record)} | ${escape(runtimeOf(record).summary)} | ${analysis.via} | ${escape(analysis.dependencies)} | ${escape(analysis.warnings)} |`;
    rows.push(row);
    const bucket = groupRows.get(group) ?? [];
    bucket.push(row);
    groupRows.set(group, bucket);
  }
  const summary = [
    `# ${phase}/${environmentId} 汇总`,
    "",
    `已注册场景：${selectedIds.length}。`,
    "",
    "| 场景 | 分组 | 结论 | 运行时审查 | 技能加载 | 依赖 | 警告 |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...rows,
    "",
  ].join("\n");
  mkdirSync(runPath, { recursive: true });
  for (const name of readdirSync(runPath)) {
    if (/^summary-.*\.md$/.test(name)) rmSync(join(runPath, name), { force: true });
  }
  writeFileSync(join(runPath, REPORT_LAYOUT.summary), summary);
  for (const [group, groupLines] of groupRows) {
    mkdirSync(runPath, { recursive: true });
    writeFileSync(
      join(runPath, `summary-${group}.md`),
      [
        `# ${GROUP_LABELS[group] ?? group} ${phase}/${environmentId} 汇总`,
        "",
        "| 场景 | 分组 | 结论 | 运行时审查 | 技能加载 | 依赖 | 警告 |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        ...groupLines,
        "",
      ].join("\n"),
    );
  }

  writeRuntimeReviews(current, phase, environmentId, runId);

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
    for (const status of [...RUNTIME_REVIEW_STATUSES, "unreviewed"]) {
      runtimeCounts[status] ??= 0;
    }
    const orderedRuntimeEntries = sortRuntimeEntries(runtimeEntries);
    const blockingRuntime = runtimeEntries.filter(
      ({ finding }) =>
        BLOCKING_RUNTIME_SEVERITIES.includes(finding.severity) &&
        BLOCKING_RUNTIME_DECISIONS.includes(finding.decision),
    ).length;
    const noteCounts = emptyRuntimeReviewNoteCounts();
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
      join(REPORT_DIRECTORY, REPORT_LAYOUT.approvals, APPROVAL_FILES.adaptedBase),
      [
        "# adapted/base 审批",
        "",
        `运行时门禁：${gateLabel(runtimeGate)}。`,
        `运行时审查：${runtimeCountText(runtimeCounts)}。`,
        `运行点评：${noteCountText(noteCounts)}。`,
        `语义审查：验证通过=${current.length - failed.length}，未验证=${failed.length}。已注册=${registered}，已记录=${current.length}，未运行=${unrun}。`,
        ...(unrun > 0
          ? ["", `> 这是部分运行：还有 ${unrun} 个已注册场景没有记录，不能当作完整审批。`]
          : []),
        "",
        "## 运行时问题",
        "| 技能 | 场景 | 发现类型 | 严重度 | 处置 | 建议 |",
        "| --- | --- | --- | --- | --- | --- |",
        ...orderedRuntimeEntries.map(
          ({ record, finding }) =>
            `| ${escape(loadScenario(record.scenarioId).skill)} | ${record.scenarioId} | ${FINDING_KIND_LABELS[finding.kind] ?? finding.kind} | ${SEVERITY_LABELS[finding.severity] ?? finding.severity} | ${DECISION_LABELS[finding.decision] ?? finding.decision} | ${escape(finding.action)} |`,
        ),
        "",
        "## 语义失败",
        "| 场景 | 结论 | 原因 |",
        "| --- | --- | --- |",
        ...failed.map(
          (record) =>
            `| ${record.scenarioId} | ${verdictLabel(record)} | ${escape(
              "reason" in record.verdict ? (record.verdict.reason ?? "") : "",
            )} |`,
        ),
        "",
      ].join("\n"),
    );
  }
  if (phase === "adapted" && environmentId !== "base") {
    const official = latest.filter(
      (record) =>
        record.phase === "adapted" && isOfficialPluginScenario(loadScenario(record.scenarioId)),
    );
    const registeredOfficial = listScenarioIds().filter((id) =>
      isOfficialPluginScenario(loadScenario(id)),
    ).length;
    const recordedScenarios = new Set(official.map((record) => record.scenarioId)).size;
    const officialRuntimeEntries = official.flatMap((record) =>
      runtimeOf(record).findings.map((finding) => ({ record, finding })),
    );
    const officialNoteCounts = emptyRuntimeReviewNoteCounts();
    for (const note of Object.values(readRuntimeReviewNotes(phase, environmentId).notes)) {
      officialNoteCounts[note.decision] += 1;
    }
    const orderedOfficialRuntimeEntries = sortRuntimeEntries(officialRuntimeEntries);
    const officialRuntimeGate =
      official.some((record) => {
        const status = runtimeOf(record).status;
        return status === "needs-review" || status === "blocked" || status === "unreviewed";
      }) ||
      officialRuntimeEntries.some(({ finding }) =>
        BLOCKING_RUNTIME_SEVERITIES.includes(finding.severity),
      ) ||
      officialNoteCounts.pending + officialNoteCounts.reject + officialNoteCounts["needs-human"] >
        0;
    writeFileSync(
      join(REPORT_DIRECTORY, REPORT_LAYOUT.approvals, APPROVAL_FILES.officialPlugins),
      [
        "# 适配后环境审批",
        "",
        `运行时门禁：${officialRuntimeGate ? "未通过" : "通过"}。`,
        `运行点评：${noteCountText(officialNoteCounts)}。`,
        `已注册适配后环境场景：${registeredOfficial}。已记录：${official.length}。已记录场景：${recordedScenarios}。`,
        ...(official.length === 0 ? ["", "> 尚无适配后环境运行记录，这不是审批。"] : []),
        "",
        "## 运行时问题",
        "| 技能 | 场景 | 环境 | 发现类型 | 严重度 | 处置 | 建议 |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        ...orderedOfficialRuntimeEntries.map(
          ({ record, finding }) =>
            `| ${escape(loadScenario(record.scenarioId).skill)} | ${record.scenarioId} | ${record.environment.matrix.id} | ${FINDING_KIND_LABELS[finding.kind] ?? finding.kind} | ${SEVERITY_LABELS[finding.severity] ?? finding.severity} | ${DECISION_LABELS[finding.decision] ?? finding.decision} | ${escape(finding.action)} |`,
        ),
        "",
        "## 运行记录",
        "| 场景 | 环境 | 结论 | 运行时审查 |",
        "| --- | --- | --- | --- |",
        ...official.map(
          (record) =>
            `| ${record.scenarioId} | ${record.environment.matrix.id} | ${verdictLabel(record)} | ${escape(runtimeOf(record).summary)} |`,
        ),
        "",
      ].join("\n"),
    );
  }
  writeReportManifest(runPath, {
    runId,
    phase,
    environment: environmentId,
    generatedAt: new Date().toISOString(),
    scenarioIds: current.map((record) => record.scenarioId),
  });
  writeFileSync(
    join(REPORT_DIRECTORY, "index.md"),
    [
      "# Playground 报告",
      "",
      `- \`runs/${phase}-${environmentId}/\`：最新汇总和运行时审查，先看这里。`,
      ...(phase === "adapted" ? ["- `approvals/`：最终审批。"] : []),
      "- `scenarios/`：当前 phase 的 case 证据与对比。",
      "",
    ].join("\n"),
  );
}

function main(): void {
  const phase = argValue("--phase") as Phase | undefined;
  if (!isPhase(phase)) throw new Error("collect requires --phase raw|adapted --environment ID");
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
