import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const UPSTREAM = join(ROOT, "upstream/cursor-plugins/pstack/docs/harness/claude-code.md");
const CORE_HEADINGS = [
  "Tools",
  "Subagent fields",
  "Models",
  "setup-pstack",
  "Paths",
  "Cursor-only features",
];
const PORT_EXTRA_HEADINGS = ["Local replacements", "Optional plugins"];
const TARGETS = [
  {
    name: "raw",
    file: join(ROOT, "playground/raw/dsh.md"),
    zh: join(ROOT, "playground/raw/dsh.zh.md"),
    extras: [],
  },
  {
    name: "port",
    file: join(ROOT, "port/dsh.md"),
    zh: join(ROOT, "port/dsh.zh.md"),
    extras: PORT_EXTRA_HEADINGS,
  },
];

function parseSections(text) {
  const sections = [];
  let current = null;
  for (const line of text.split("\n")) {
    const heading = line.match(/^## (.+)$/);
    if (heading) {
      current = { heading: heading[1], rows: [] };
      sections.push(current);
      continue;
    }
    if (!current || !line.startsWith("|")) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length !== 2) continue;
    if (cells.every((cell) => /^:?-+:?$/.test(cell))) continue;
    if (cells[0] === "Cursor") continue;
    current.rows.push(cells);
  }
  return sections;
}

function fail(message) {
  throw new Error(message);
}

function compareCore(target, upstream) {
  const core = target.sections.filter((section) => CORE_HEADINGS.includes(section.heading));
  const extra = target.sections.filter((section) => !CORE_HEADINGS.includes(section.heading));
  if (core.map((section) => section.heading).join("|") !== CORE_HEADINGS.join("|")) {
    fail(`${target.name}: core section order must be ${CORE_HEADINGS.join(", ")}`);
  }
  if (
    extra.length !== target.extras.length ||
    extra.some((section, index) => section.heading !== target.extras[index])
  ) {
    fail(
      `${target.name}: unexpected extra sections ${extra.map((section) => section.heading).join(", ") || "none"}`,
    );
  }
  for (const [index, upstreamSection] of upstream.entries()) {
    const section = core[index];
    if (target.name === "raw" && section.rows.length !== upstreamSection.rows.length) {
      fail(
        `${target.name}: ${section.heading} has ${section.rows.length} rows, expected ${upstreamSection.rows.length}`,
      );
    }
    if (section.rows.length < upstreamSection.rows.length) {
      fail(
        `${target.name}: ${section.heading} has ${section.rows.length} rows, expected at least ${upstreamSection.rows.length}`,
      );
    }
    for (const [row, upstreamRow] of upstreamSection.rows.entries()) {
      if (section.rows[row]?.[0] !== upstreamRow[0]) {
        fail(`${target.name}: ${section.heading} row ${row + 1} Cursor cell changed`);
      }
    }
  }
}

function compareMirror(target) {
  const englishLines = readFileSync(target.file, "utf8").split("\n").length;
  const chineseLines = readFileSync(target.zh, "utf8").split("\n").length;
  if (englishLines !== chineseLines) {
    fail(`${target.name}: dsh.md has ${englishLines} lines and dsh.zh.md has ${chineseLines}`);
  }
  if (target.sections.length !== target.zhSections.length) {
    fail(`${target.name}: dsh.md and dsh.zh.md section count differs`);
  }
  for (const [index, section] of target.sections.entries()) {
    const mirror = target.zhSections[index];
    if (section.rows.length !== mirror.rows.length) {
      fail(
        `${target.name}: ${section.heading} has ${section.rows.length} rows in dsh.md and ${mirror.rows.length} in dsh.zh.md`,
      );
    }
    for (const [row, cells] of section.rows.entries()) {
      if (cells[0] !== mirror.rows[row]?.[0]) {
        fail(`${target.name}: ${section.heading} row ${row + 1} Cursor cell differs in dsh.zh.md`);
      }
    }
  }
}

export function checkDshAdapters() {
  const upstream = parseSections(readFileSync(UPSTREAM, "utf8"));
  for (const target of TARGETS) {
    target.sections = parseSections(readFileSync(target.file, "utf8"));
    target.zhSections = parseSections(readFileSync(target.zh, "utf8"));
    compareCore(target, upstream);
    compareMirror(target);
    console.log(`OK ${target.name} dsh adapter`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    checkDshAdapters();
  } catch (error) {
    console.error(`[dsh-check] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
