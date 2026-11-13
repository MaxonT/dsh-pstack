import { spawn } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { isPhase, SCENARIO_GROUP_PHASES, SCENARIO_GROUPS } from "../types.ts";
import type { Phase, RunRecord, ScenarioGroup, Verdict } from "../types.ts";
import { latestRecords } from "./lib/evidence.ts";
import { computeWorkers } from "./lib/capacity.ts";
import {
  environmentMatrix,
  REPOSITORY_ROOT,
  upstreamRevision,
  workersDirectory,
} from "./lib/run-metadata.ts";
import {
  formatTimestamp,
  progressFilePath,
  readProgress,
  updateProgress,
  writeProgress,
  type ProgressState,
} from "./lib/progress.ts";
import { listScenarioIds, listScenariosForSkill, loadScenario } from "./lib/scenarios.ts";
import { writeBatchMetadata } from "./lib/review-snapshot.ts";
import { workerCount } from "./lib/worker.ts";

const VPX = "vpx";
const GROUPS = new Set<string>(SCENARIO_GROUPS);
const GROUP_USAGE = SCENARIO_GROUPS.join(",");

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function parseList(value: string): string[] {
  return [
    ...new Set(
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  ];
}

function readRecords(directory: string): RunRecord[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) return readRecords(file);
    if (!entry.name.endsWith(".json")) return [];
    try {
      const record = JSON.parse(readFileSync(file, "utf8")) as RunRecord;
      return typeof record.scenarioId === "string" && typeof record.phase === "string"
        ? [record]
        : [];
    } catch {
      return [];
    }
  });
}

function allRecords(): RunRecord[] {
  return readRecords(workersDirectory());
}

function selectedScenarios(phase: Phase, environmentId: string): string[] {
  const scenarios = argValue("--scenarios");
  const skills = argValue("--skills");
  const groups = argValue("--groups");
  const failed = process.argv.includes("--only-failed");
  const full = process.argv.includes("--full");
  if (
    [scenarios, skills, groups, failed ? "failed" : undefined, full ? "full" : undefined].filter(
      Boolean,
    ).length > 1
  ) {
    throw new Error(
      "--full, --scenarios, --skills, --groups and --only-failed are mutually exclusive",
    );
  }
  if (full) {
    return listScenarioIds().filter((id) => {
      const group = loadScenario(id).group;
      return group !== undefined && SCENARIO_GROUP_PHASES[group].includes(phase);
    });
  }
  if (scenarios) return parseList(scenarios);
  if (skills)
    return parseList(skills).flatMap((skill) =>
      listScenariosForSkill(skill).map((scenario) => scenario.id),
    );
  if (groups) {
    const selected = new Set(parseList(groups));
    for (const group of selected) {
      if (!GROUPS.has(group)) throw new Error(`unknown scenario group ${JSON.stringify(group)}`);
      if (!SCENARIO_GROUP_PHASES[group as ScenarioGroup].includes(phase)) {
        throw new Error(
          `scenario group ${JSON.stringify(group)} is not available in phase ${phase}`,
        );
      }
    }
    return listScenarioIds().filter((id) => {
      const group = loadScenario(id).group;
      if (group === undefined) throw new Error(`scenario ${id} has no group`);
      if (!selected.has(group)) return false;
      return true;
    });
  }
  if (failed) {
    return latestRecords(allRecords())
      .filter((record) => record.phase === phase && record.environment.matrix.id === environmentId)
      .filter((record) =>
        phase === "raw"
          ? record.verdict.status === "gap"
          : record.verdict.status === "not-verified",
      )
      .map((record) => record.scenarioId);
  }
  throw new Error(
    `run-batch requires --groups <${GROUP_USAGE}>, --scenarios <ids>, --skills <names>, or --only-failed`,
  );
}

function distribute(ids: string[], workers: number): string[][] {
  const queues = Array.from({ length: workers }, () => [] as string[]);
  ids.forEach((id, index) => queues[index % workers]?.push(id));
  return queues;
}

interface ChildResult {
  code: number | null;
  output: string;
}

function runCase(args: string[], env: NodeJS.ProcessEnv): Promise<ChildResult> {
  return new Promise((resolvePromise) => {
    const child = spawn(VPX, args, { cwd: REPOSITORY_ROOT, env });
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.on("error", (error) => resolvePromise({ code: -1, output: error.message }));
    child.on("close", (code) => resolvePromise({ code, output }));
  });
}

function createScenarioBundle(ids: string[]): { directory: string; file: string } {
  const directory = mkdtempSync(join(tmpdir(), "pstack-scenario-bundle-"));
  const file = join(directory, "scenarios.json");
  writeFileSync(file, JSON.stringify(ids.map((id) => loadScenario(id))), { mode: 0o600 });
  return { directory, file };
}

function statuses(): ProgressState["statuses"] {
  return {
    observed: 0,
    gap: 0,
    blocked: 0,
    unobserved: 0,
    verified: 0,
    "not-verified": 0,
    inconclusive: 0,
  };
}

function statusFor(record: RunRecord | undefined, phase: Phase): Verdict["status"] {
  if (record) return record.verdict.status;
  return phase === "raw" ? "unobserved" : "inconclusive";
}

async function main(): Promise<void> {
  const phase = argValue("--phase") as Phase | undefined;
  if (!isPhase(phase)) {
    throw new Error(
      `usage: run-batch.ts --phase raw|adapted [--environment base] [--full|--groups ${GROUP_USAGE}|--scenarios a,b|--skills a,b|--only-failed] [--workers N] [--round N]`,
    );
  }
  if (process.argv.includes("--all")) {
    throw new Error("--all is no longer supported; select --groups, --scenarios, or --skills");
  }
  const matrix = environmentMatrix(argValue("--environment"));
  const ids = selectedScenarios(phase, matrix.id);
  for (const id of ids) {
    const group = loadScenario(id).group;
    if (group === undefined || !SCENARIO_GROUP_PHASES[group].includes(phase)) {
      throw new Error(`scenario ${id} is not available in phase ${phase}`);
    }
  }
  if (ids.length === 0) {
    console.log("[run-batch] no scenarios selected");
    return;
  }
  const requested = argValue("--workers") === undefined ? undefined : Number(argValue("--workers"));
  const prepared = workerCount(matrix.id, phase);
  const workers = Math.min(computeWorkers(requested).workers, prepared || requested || 1);
  const queues = distribute(ids, workers);
  const roundFlag = argValue("--round");
  const file = progressFilePath(matrix.id, phase);
  const round = roundFlag ? Number(roundFlag) : (readProgress(file)?.round ?? 0) + 1;
  if (!Number.isInteger(round) || round < 1) throw new Error("--round must be positive");
  const state: ProgressState = {
    phase,
    environmentId: matrix.id,
    round,
    total: ids.length,
    done: 0,
    statuses: statuses(),
    running: [],
    startedAt: formatTimestamp(),
    updatedAt: formatTimestamp(),
    perWorker: Object.fromEntries(
      queues.map((queue, index) => [`w${index}`, { done: 0, total: queue.length }]),
    ),
    failures: [],
    workers,
  };
  writeProgress(file, state);
  console.log(`[run-batch] progress=${file}`);
  mkdirSync(join(workersDirectory(), phase, matrix.id), { recursive: true });
  const logFile = join(workersDirectory(), phase, matrix.id, "batch.log");
  writeFileSync(logFile, `phase=${phase} environment=${matrix.id} round=${round}\n`);
  const batchId = `${phase}-${matrix.id}-${formatTimestamp().replace(/[-: ]/g, "")}`;
  const mode = process.argv.includes("--full") ? "full" : "incremental";
  writeBatchMetadata({
    batchId,
    phase,
    environment: matrix.id,
    mode,
    scope: ids,
    startedAt: new Date().toISOString(),
    upstreamRevision: upstreamRevision(),
  });
  const bundle = createScenarioBundle(ids);
  const childEnvironment = {
    ...process.env,
    PLAYGROUND_BATCH_ID: batchId,
    PLAYGROUND_SCENARIO_BUNDLE: bundle.file,
  };
  try {
    await Promise.all(
      queues.map(async (queue, worker) => {
        for (const scenarioId of queue) {
          updateProgress(file, (current) => {
            current.running.push({ worker, scenarioId });
          });
          const args = [
            "playground/scripts/run-case.ts",
            "--worker",
            String(worker),
            "--scenario",
            scenarioId,
            "--phase",
            phase,
            "--environment",
            matrix.id,
          ];
          const config = argValue("--config");
          if (config) args.push("--config", config);
          const result = await runCase(args, childEnvironment);
          appendFileSync(
            logFile,
            `\n===== ${scenarioId} ${phase} ${matrix.id} exit=${String(result.code)} =====\n${result.output}\n`,
          );
          const records = latestRecords(
            readRecords(join(workersDirectory(), phase, matrix.id, `w${worker}/evidence`)),
          );
          const record = records.find(
            (entry) => entry.scenarioId === scenarioId && entry.phase === phase,
          );
          const status = statusFor(record, phase);
          updateProgress(file, (current) => {
            current.running = current.running.filter(
              (entry) => !(entry.worker === worker && entry.scenarioId === scenarioId),
            );
            current.done += 1;
            current.statuses[status] += 1;
            const perWorker = current.perWorker[`w${worker}`];
            if (perWorker) perWorker.done += 1;
            if (status !== "verified" && status !== "observed") {
              current.failures.push({
                scenarioId,
                worker,
                reason: record?.verdict.status ?? result.output.slice(-500),
              });
            }
          });
          console.log(`[run-batch] ${scenarioId} ${phase} ${matrix.id} ${status}`);
        }
      }),
    );
  } finally {
    rmSync(bundle.directory, { recursive: true, force: true });
  }
  console.log(`[run-batch] log=${logFile}`);
}

main().catch((error: unknown) => {
  console.error(`[run-batch] ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
