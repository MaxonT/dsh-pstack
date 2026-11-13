import { mkdirSync, writeFileSync } from "node:fs";

import { isPhase } from "../types.ts";
import type { Phase } from "../types.ts";
import { stopRequestFile, workerPaths } from "./lib/worker.ts";

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const phase = argValue("--phase") as Phase | undefined;
if (!isPhase(phase)) throw new Error("stop-task requires --phase raw|adapted");
const environment = argValue("--environment") ?? "base";
const worker = Number(argValue("--worker") ?? "0");
if (!Number.isInteger(worker) || worker < 0) throw new Error("--worker must be non-negative");
const paths = workerPaths(worker, environment, phase);
mkdirSync(paths.root, { recursive: true });
writeFileSync(
  stopRequestFile(paths),
  `${JSON.stringify({ requestedAt: new Date().toISOString(), worker }, null, 2)}\n`,
);
console.log(`[stop-task] requested ${phase}/${environment}/w${worker}`);
