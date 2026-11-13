import { pathToFileURL } from "node:url";

import { isPhase } from "../types.ts";
import type { Phase } from "../types.ts";
import { environmentMatrix } from "./lib/run-metadata.ts";
import { collectReviewSnapshot, REVIEWS_DIRECTORY } from "./lib/review-snapshot.ts";

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function main(): void {
  const phase = argValue("--phase") as Phase | undefined;
  if (!isPhase(phase)) throw new Error("collect requires --phase raw|adapted --environment ID");
  const matrix = environmentMatrix(argValue("--environment"));
  collectReviewSnapshot(phase, matrix.id);
  console.log(`[collect] reviews=${REVIEWS_DIRECTORY}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(`[collect] ERROR: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
