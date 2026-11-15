#!/usr/bin/env node
// Soft check: user-visible files changed since a base ref but no changes/ note was added.
//
// This never fails the build. It is a PR / release-time helper, not part of CI,
// so historical commits without notes do not create noise.
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { USER_VISIBLE_PATHS } from "./lib/release-paths.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function git(args: readonly string[]): string {
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function lines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

export function main(argv: readonly string[] = process.argv.slice(2)): number {
  const { values } = parseArgs({
    args: [...argv],
    options: { check: { type: "boolean" }, base: { type: "string" } },
    allowPositionals: false,
  });
  if (values.check !== true) {
    console.log("Nothing to do; pass --check --base <ref>.");
    return 0;
  }
  const base = values.base;
  if (base === undefined) {
    console.error("--base <ref> is required with --check.");
    return 0;
  }
  const range = `${base}...HEAD`;
  let changed: string[];
  try {
    changed = lines(git(["diff", "--name-only", range]));
  } catch {
    console.error(`Cannot diff ${range}.`);
    return 0;
  }
  const visible = changed.filter((path) =>
    (USER_VISIBLE_PATHS as readonly string[]).includes(path),
  );
  if (visible.length === 0) {
    console.log(`No user-visible file changed since ${base}.`);
    return 0;
  }
  let notes: string[] = [];
  try {
    notes = lines(git(["diff", "--name-only", "--diff-filter=A", range, "--", "changes"])).filter(
      (path) => path.endsWith(".md"),
    );
  } catch {
    notes = [];
  }
  if (notes.length > 0) {
    console.log(`User-visible files have ${notes.length} changes/ note(s): ${notes.join(", ")}`);
    return 0;
  }
  console.log("warning: user-visible files changed but no changes/ note was added:");
  for (const path of visible) console.log(`  - ${path}`);
  console.log(
    "Add one note under changes/ (see changes/README.md). This is a soft reminder and does not block release.",
  );
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
