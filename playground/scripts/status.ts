import { existsSync, readFileSync } from "node:fs";

import { isPhase } from "../types.ts";
import type { Phase } from "../types.ts";
import { environmentMatrix } from "./lib/run-metadata.ts";
import { progressFilePath, readProgress } from "./lib/progress.ts";
import { currentTaskFile, workerPaths } from "./lib/worker.ts";

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const phase = argValue("--phase") as Phase | undefined;
if (!isPhase(phase)) throw new Error("status requires --phase raw|adapted");
const environment = argValue("--environment");
if (environment === undefined) throw new Error("status requires --environment");
environmentMatrix(environment);
const file = progressFilePath(environment, phase);
const state = readProgress(file);
if (!state) {
  console.log(`[status] no progress at ${file}`);
} else {
  console.log(`[status] ${phase} ${environment} round=${state.round} ${state.done}/${state.total}`);
  console.log(JSON.stringify(state.statuses));
  console.log(
    `[status] running=${state.running.map((entry) => `w${entry.worker}:${entry.scenarioId}`).join(",") || "none"}`,
  );
  for (const entry of state.running) {
    const task = currentTaskFile(workerPaths(entry.worker, environment, phase));
    if (!existsSync(task)) continue;
    try {
      const value = JSON.parse(readFileSync(task, "utf8")) as {
        scenarioId?: string;
        startedAt?: string;
      };
      const elapsed =
        value.startedAt === undefined
          ? "unknown"
          : `${Math.max(0, Math.round((Date.now() - Date.parse(value.startedAt)) / 1000))}s`;
      console.log(
        `[status] current w${entry.worker}: ${value.scenarioId ?? entry.scenarioId} age=${elapsed}`,
      );
    } catch {
      console.log(`[status] current w${entry.worker}: unreadable current-task.json`);
    }
  }
  for (const failure of state.failures) {
    console.log(`[status] ${failure.scenarioId} w${failure.worker}: ${failure.reason}`);
  }
}
