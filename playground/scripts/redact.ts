import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";

import { isPhase } from "../types.ts";
import type { Phase } from "../types.ts";
import { environmentMatrix } from "./lib/run-metadata.ts";
import { reviewSnapshotDirectory } from "./lib/review-snapshot.ts";

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const SECRET_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/sk-[A-Za-z0-9_-]{8,}/g, "api-key"],
  [/gh[pousr]_[A-Za-z0-9_]{8,}/g, "github-token"],
  [/github_pat_[A-Za-z0-9_]{8,}/g, "github-token"],
  [/AKIA[0-9A-Z]{12,}/g, "aws-key"],
  [/Bearer\s+[A-Za-z0-9._-]{8,}/gi, "bearer-token"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/g, "private-key"],
];

const PATH_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\/home\/[^\s"'\\]+/g, "host-path"],
  [/\/tmp\/[^\s"'\\]+/g, "temp-path"],
  [/\/Users\/[^\s"'\\]+/g, "host-path"],
  [/[A-Za-z]:\\\\[^\s"'\\]+/g, "host-path"],
];

export function residualKinds(text: string): string[] {
  const kinds: string[] = [];
  for (const [pattern, kind] of [...SECRET_PATTERNS, ...PATH_PATTERNS]) {
    if (pattern.test(text)) kinds.push(kind);
  }
  return [...new Set(kinds)];
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : entry.name === "record.json" ? [file] : [];
  });
}

function main(): void {
  const phase = argValue("--phase") as Phase | undefined;
  if (!isPhase(phase)) throw new Error("redact requires --phase raw|adapted");
  const environment = environmentMatrix(argValue("--environment")).id;
  const apply = process.argv.includes("--apply");
  const root = reviewSnapshotDirectory(phase, environment);
  const records = walk(root);
  if (records.length === 0) throw new Error(`no review records under ${root}`);

  let errors = 0;
  let checked = 0;
  for (const record of records) {
    const safe = join(dirname(record), "record.safe.json");
    const candidate = apply ? safe : existsSync(safe) ? safe : record;
    if (apply && !existsSync(safe)) {
      console.error(`[redact] MISSING ${relative(root, safe)}; create it in the redaction session`);
      errors += 1;
      continue;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(candidate, "utf8"));
    } catch (error) {
      console.error(`[redact] INVALID ${relative(root, candidate)}: ${String(error)}`);
      errors += 1;
      continue;
    }
    const kinds = residualKinds(JSON.stringify(parsed));
    if (kinds.length > 0) {
      console.error(`[redact] RESIDUAL ${relative(root, candidate)}: ${kinds.join(", ")}`);
      errors += 1;
      continue;
    }
    if (apply) {
      writeFileSync(record, `${JSON.stringify(parsed, null, 2)}\n`);
      rmSync(safe, { force: true });
    }
    checked += 1;
  }
  if (apply) console.log(`[redact] applied=${checked} errors=${errors}`);
  else console.log(`[redact] checked=${checked} errors=${errors}`);
  process.exitCode = errors === 0 ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(`[redact] ERROR: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
