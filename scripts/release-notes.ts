#!/usr/bin/env node
// Generate release notes from artifact diffs plus hand-written changes/ notes.
//
// Artifact diffs compare the previous tag to the working tree:
//   port/dsh.md      - row-level table diff, keyed by `##` section and first cell
//   port/surface.json - tool parameter add/remove/change
//   port/baseline.json - compatibilityKey / DSH range / pstackCommit
//
// Empty sections are omitted. Hand-written notes go first so the release reader
// sees user-visible changes before the internal artifact deltas.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { USER_VISIBLE_PATHS } from "./lib/release-paths.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHANGES_DIR = join(ROOT, "changes");

interface DshRow {
  readonly section: string;
  readonly key: string;
  readonly cells: readonly string[];
}

interface TableParse {
  readonly records: readonly DshRow[];
  readonly index: ReadonlyMap<string, number>;
}

interface SurfaceTool {
  readonly name: string;
  readonly parameters: Record<string, unknown>;
}

interface SurfaceFile {
  readonly tools: readonly SurfaceTool[];
}

interface Baseline {
  readonly compatibilityKey?: string;
  readonly dshVersion?: string;
  readonly pstackCommit?: string;
}

function git(args: readonly string[]): string {
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function gitShow(refPath: string): string | undefined {
  try {
    return git(["show", refPath]);
  } catch {
    return undefined;
  }
}

function readWorkspace(relative: string): string | undefined {
  const path = join(ROOT, relative);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
}

function previousTag(): string | undefined {
  const head = git(["rev-parse", "HEAD"]).trim();
  const tags = git(["tag", "--sort=-v:refname"])
    .split("\n")
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "");
  for (const tag of tags) {
    if (git(["rev-parse", `${tag}^{commit}`]).trim() === head) continue;
    try {
      execFileSync("git", ["merge-base", "--is-ancestor", tag, "HEAD"], { cwd: ROOT });
    } catch {
      continue;
    }
    return tag;
  }
  return undefined;
}

function clip(value: string, max = 160): string {
  const flat = value.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

function splitRow(line: string): string[] {
  const body = line.replace(/^\|/, "").replace(/\|$/, "");
  return body.split("|").map((cell) => cell.trim());
}

function parseDshTables(text: string): TableParse {
  const records: DshRow[] = [];
  const index = new Map<string, number>();
  let section = "(intro)";
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("## ")) {
      section = line.slice(3).trim();
      continue;
    }
    if (!line.startsWith("|")) continue;
    if (/^\|[\s:|-]+\|$/.test(line)) continue;
    const cells = splitRow(line);
    if (cells.length === 0) continue;
    if (cells[0] === "Cursor" || cells[0] === "Tool") continue;
    const rowKey = `${section}\u0000${cells[0]}`;
    if (index.has(rowKey)) continue;
    index.set(rowKey, records.length);
    records.push({ section, key: cells[0], cells });
  }
  return { records, index };
}

export function diffDshTables(
  baseText: string | undefined,
  currentText: string,
  verbose = false,
): string[] {
  const current = parseDshTables(currentText);
  const base = parseDshTables(baseText ?? "");
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];
  const details: string[] = [];
  for (const row of current.records) {
    const rowKey = `${row.section}\u0000${row.key}`;
    const oldIndex = base.index.get(rowKey);
    const value = row.cells.slice(1).join(" / ");
    if (oldIndex === undefined) {
      added.push(`[${row.section}] ${row.key}`);
      if (verbose) details.push(`- 新增 [${row.section}] \`${row.key}\`：${clip(value)}`);
      continue;
    }
    const old = base.records[oldIndex];
    if (old.cells.join("\u0000") !== row.cells.join("\u0000")) {
      changed.push(`[${row.section}] ${row.key}`);
      if (verbose)
        details.push(
          `- 改动 [${row.section}] \`${row.key}\`：旧 \`${clip(old.cells.slice(1).join(" / "))}\` → 新 \`${clip(value)}\``,
        );
    }
  }
  for (const row of base.records) {
    const rowKey = `${row.section}\u0000${row.key}`;
    if (!current.index.has(rowKey)) {
      removed.push(`[${row.section}] ${row.key}`);
      if (verbose)
        details.push(
          `- 删除 [${row.section}] \`${row.key}\`：原 \`${clip(row.cells.slice(1).join(" / "))}\``,
        );
    }
  }
  if (verbose) return details;
  const lines: string[] = [];
  for (const [label, rows] of [
    ["新增", added],
    ["删除", removed],
    ["改动", changed],
  ] as const) {
    if (rows.length === 0) continue;
    const shown = rows.slice(0, 20).join("、");
    const suffix = rows.length > 20 ? ` 等 ${rows.length} 项` : "";
    lines.push(`- ${label} ${rows.length} 行：${shown}${suffix}`);
  }
  return lines;
}

function propertiesOf(parameters: Record<string, unknown>): Record<string, unknown> {
  const value = parameters["properties"];
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function requiredOf(parameters: Record<string, unknown>): string[] {
  const value = parameters["required"];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function diffParameters(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string[] {
  const oldProps = propertiesOf(before);
  const newProps = propertiesOf(after);
  const parts: string[] = [];
  const added = Object.keys(newProps).filter((name) => !(name in oldProps));
  const removed = Object.keys(oldProps).filter((name) => !(name in newProps));
  if (added.length > 0) parts.push(`新增参数 ${added.map((name) => `\`${name}\``).join("、")}`);
  if (removed.length > 0) parts.push(`移除参数 ${removed.map((name) => `\`${name}\``).join("、")}`);
  for (const name of Object.keys(newProps)) {
    if (!(name in oldProps)) continue;
    if (JSON.stringify(oldProps[name]) !== JSON.stringify(newProps[name])) {
      parts.push(`参数 \`${name}\` 定义变化`);
    }
  }
  const oldRequired = JSON.stringify(requiredOf(before));
  const newRequired = JSON.stringify(requiredOf(after));
  if (oldRequired !== newRequired) parts.push(`required 从 ${oldRequired} 变为 ${newRequired}`);
  return parts;
}

export function diffSurface(
  baseText: string | undefined,
  currentText: string | undefined,
): string[] {
  if (currentText === undefined) return ["- 工作区缺少 port/surface.json，跳过工具接口对比。"];
  const current = JSON.parse(currentText) as SurfaceFile;
  if (baseText === undefined) {
    return [`- 首次引入 port/surface.json，共 ${current.tools.length} 个工具。`];
  }
  const base = JSON.parse(baseText) as SurfaceFile;
  const before = new Map(base.tools.map((tool) => [tool.name, tool]));
  const after = new Map(current.tools.map((tool) => [tool.name, tool]));
  const lines: string[] = [];
  for (const [name, tool] of after) {
    const old = before.get(name);
    if (old === undefined) {
      lines.push(`- 新增工具 \`${name}\`。`);
      continue;
    }
    const parts = diffParameters(old.parameters, tool.parameters);
    if (parts.length > 0) lines.push(`- 工具 \`${name}\`：${parts.join("；")}。`);
  }
  for (const name of before.keys()) {
    if (!after.has(name)) lines.push(`- 移除工具 \`${name}\`。`);
  }
  return lines;
}

export function diffBaseline(
  baseText: string | undefined,
  currentText: string | undefined,
): string[] {
  if (currentText === undefined) return ["- 工作区缺少 port/baseline.json，跳过兼容基线对比。"];
  const current = JSON.parse(currentText) as Baseline;
  if (baseText === undefined) return ["- 首次引入 port/baseline.json。"];
  const base = JSON.parse(baseText) as Baseline;
  const fields: ReadonlyArray<[keyof Baseline, string]> = [
    ["compatibilityKey", "compatibilityKey"],
    ["dshVersion", "DSH 范围"],
    ["pstackCommit", "pstackCommit"],
  ];
  const lines: string[] = [];
  for (const [field, label] of fields) {
    if (base[field] !== current[field]) {
      lines.push(`- ${label}：\`${base[field] ?? "(无)"}\` → \`${current[field] ?? "(无)"}\``);
    }
  }
  return lines;
}

function readChanges(base: string | undefined): { files: string[]; body: string } {
  if (!existsSync(CHANGES_DIR)) return { files: [], body: "" };
  let files = readdirSync(CHANGES_DIR)
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .sort();
  if (base !== undefined) {
    try {
      const added = new Set(
        git(["diff", "--name-only", "--diff-filter=A", `${base}...HEAD`, "--", "changes"])
          .split("\n")
          .map((path) => path.trim())
          .filter((path) => path.startsWith("changes/") && path.endsWith(".md"))
          .map((path) => path.slice("changes/".length)),
      );
      files = files.filter((name) => added.has(name));
    } catch {
      // A missing base ref falls back to every pending note.
    }
  }
  const body = files
    .map((name) => readFileSync(join(CHANGES_DIR, name), "utf8").trim())
    .filter((text) => text !== "")
    .join("\n\n");
  return { files, body };
}

function changedUserVisible(base: string): string[] {
  let changed: string[];
  try {
    changed = git(["diff", "--name-only", `${base}...HEAD`])
      .split("\n")
      .map((path) => path.trim())
      .filter((path) => path !== "");
  } catch {
    return [];
  }
  return changed.filter((path) => (USER_VISIBLE_PATHS as readonly string[]).includes(path));
}

function userVisibleSection(
  base: string,
  files: readonly string[],
  body: string,
): string | undefined {
  const parts: string[] = [];
  if (body !== "") parts.push(body);
  if (files.length === 0) {
    const visible = changedUserVisible(base);
    if (visible.length > 0) {
      const list = visible.map((path) => `> - \`${path}\``).join("\n");
      parts.push(`> 软提醒：以下用户可见文件有改动，但 changes/ 下没有注记。\n${list}`);
    }
  }
  return parts.length === 0 ? undefined : `## 用户可见变化\n\n${parts.join("\n\n")}`;
}

function buildNotes(base: string, verbose = false): string {
  const changes = readChanges(base);
  const sections: string[] = [];
  const visible = userVisibleSection(base, changes.files, changes.body);
  if (visible !== undefined) sections.push(visible);

  const adapt = diffDshTables(
    gitShow(`${base}:port/dsh.md`),
    readWorkspace("port/dsh.md") ?? "",
    verbose,
  );
  if (adapt.length > 0) {
    sections.push(
      `## 适配行为变化\n\n${adapt.join("\n")}\n\n详见 \`git diff ${base}...HEAD -- port/dsh.md\`。`,
    );
  }

  const tools = diffSurface(
    gitShow(`${base}:port/surface.json`),
    readWorkspace("port/surface.json"),
  );
  if (tools.length > 0) sections.push(`## 工具接口变化\n\n${tools.join("\n")}`);

  const baseline = diffBaseline(
    gitShow(`${base}:port/baseline.json`),
    readWorkspace("port/baseline.json"),
  );
  if (baseline.length > 0) sections.push(`## 兼容基线变化\n\n${baseline.join("\n")}`);

  if (sections.length === 0) {
    return `自 ${base} 以来没有检测到用户可见的适配、工具接口或兼容基线变化。\n`;
  }
  return `${sections.join("\n\n")}\n`;
}

function reportPendingChanges(base: string): void {
  const { files } = readChanges(base);
  if (files.length === 0) {
    console.error("changes/ 下没有待删除的注记。");
    return;
  }
  console.error("发布后请删除以下 changes 注记（脚本不自动删除）：");
  for (const name of files) console.error(`  - changes/${name}`);
}

export function main(argv: readonly string[] = process.argv.slice(2)): number {
  const { values } = parseArgs({
    args: [...argv],
    options: {
      base: { type: "string" },
      output: { type: "string" },
      verbose: { type: "boolean" },
    },
    allowPositionals: false,
  });
  const base = values.base ?? previousTag();
  if (base === undefined) {
    console.error("Cannot determine a previous tag; pass --base <tag>.");
    return 1;
  }
  const notes = buildNotes(base, values.verbose === true);
  if (values.output === undefined) {
    process.stdout.write(notes);
  } else {
    writeFileSync(resolve(values.output), notes);
    console.log(`Wrote release notes for ${base} to ${values.output}.`);
  }
  reportPendingChanges(base);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
