#!/usr/bin/env node
// Generate one pstack tree from the pinned upstream pstack tree and its adapter.
// --target port writes the shipped root pstack/ from port/dsh.md.
// --target raw writes playground/raw/pstack/ from playground/raw/dsh.md.

import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "upstream/cursor-plugins/pstack");
const targetIndex = process.argv.indexOf("--target");
const TARGET = targetIndex >= 0 ? process.argv[targetIndex + 1] : "port";
if (TARGET !== "port" && TARGET !== "raw") {
  throw new Error("usage: generate-pstack.mjs --target port|raw [--check]");
}
const isRaw = TARGET === "raw";
const ADAPTER_SOURCE = isRaw ? "playground/raw/dsh.md" : "port/dsh.md";
const ADAPTER_TREE = "docs/harness/dsh.md";
const OUT = isRaw ? join(ROOT, "playground/raw/pstack") : join(ROOT, "pstack");
const RAW_ROOT = join(ROOT, "playground/raw");
const COMMAND = `vpx scripts/generate-pstack.mjs --target ${TARGET}`;
const INJECTION = isRaw
  ? `In DSH, read [the DSH adapter](../../${ADAPTER_TREE}) once per session before you follow this skill. It maps the Cursor names in pstack skills to DSH.`
  : `In DeepSeek Harness, read [the DSH adapter](../../${ADAPTER_TREE}) once per session before you follow this skill. It maps the Cursor names in pstack skills to DeepSeek Harness.`;
const GITHUB = "https://github.com/cursor/plugins";
const LINK = /\]\(([^)\s]+)\)/g;
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const TERMS = [
  { key: "`Task`", re: /`Task`|\bTask (tool|subagent|call)/ },
  { key: "`AskQuestion`", re: /AskQuestion/ },
  { key: "todolist", re: /\btodo ?list\b/i },
  { key: "generalPurpose", re: /generalPurpose/ },
  { key: "poteto-agent", re: /poteto-agent/ },
  { key: "comment-sicko", re: /comment-sicko/ },
  { key: "`readonly: true`", re: /readonly: (true|false)|readonly\/Ask/ },
  { key: '`environment: "cloud"`', re: /environment: "(cloud|local)"/ },
  { key: "cloud_base_branch", re: /cloud_base_branch/ },
  { key: "`run_in_background: true`", re: /run_in_background/ },
  { key: "`resume`", re: /`resume`/ },
  { key: "`file_attachments`", re: /file_attachments/ },
  { key: "claude-", re: /\bclaude-[a-z]+-\d/ },
  { key: "grok-", re: /\bgrok-\d/ },
  { key: "gpt-", re: /\bgpt-\d/ },
  { key: "inherit-parent", re: /inherit-parent/ },
  { key: "pstack-models.mdc", re: /pstack-models\.mdc/ },
  { key: ".cursor/skills/", re: /\.cursor\/skills/ },
  { key: "~/.cursor/plugins/", re: /\.cursor\/plugins|\.cursor-plugin/ },
  { key: ".cursor/rules/", re: /\.cursor\/rules|always-applied rule/ },
  { key: "agent-transcripts", re: /agent-transcripts|\.cursor\/projects/ },
  { key: "Custom Mode", re: /Custom Modes?/i },
  {
    key: "Cursor-only features",
    re: /Bugbot|Cursor [Aa]utomation|cursor\.(sh|com)\/automations|[Cc]loud [Aa]gent|built-in PR tool/,
  },
];
const ROUTE_KEY = "Run another pstack skill";
const ACTIVE_TERMS = isRaw ? TERMS.filter((term) => term.key !== "Custom Mode") : TERMS;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (name === ".DS_Store" || name === "node_modules") return [];
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function file(path) {
  return { bytes: readFileSync(path), executable: (statSync(path).mode & 0o111) !== 0 };
}

const skills = readdirSync(join(SOURCE, "skills")).filter((name) =>
  existsSync(join(SOURCE, "skills", name, "SKILL.md")),
);

function classify(skill) {
  const dir = join(SOURCE, "skills", skill);
  const others = skills.filter((name) => name !== skill).join("|");
  const route = new RegExp(
    `the \\*\\*(?<bold>${others})\\*\\* skill|\`/(?<command>${others})\``,
    "g",
  );
  const linksToSkill = (line, name) => line.includes(`(../${name}/`);
  const namesBareSkill = (line) =>
    [...line.matchAll(route)].some(
      ({ groups }) => !linksToSkill(line, groups.bold ?? groups.command),
    );
  const terms = new Set();
  for (const path of walk(dir).filter((path) => path.endsWith(".md"))) {
    const text = readFileSync(path, "utf8");
    for (const term of ACTIVE_TERMS) if (term.re.test(text)) terms.add(term.key);
    if (text.split("\n").some(namesBareSkill)) terms.add(ROUTE_KEY);
  }
  const text = readFileSync(join(dir, "SKILL.md"), "utf8");
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const name = frontmatter
    .match(/^name:(.*)$/m)?.[1]
    .trim()
    .replace(/^(["'])(.*)\1$/, "$2");
  return { terms, wrap: terms.size > 0 && /^# /m.test(text), name };
}

const classes = new Map(skills.map((skill) => [skill, classify(skill)]));
const problems = [];
const users = new Map();
for (const [skill, { terms, wrap, name }] of classes) {
  if (terms.size > 0 && !wrap)
    problems.push(`skills/${skill}/SKILL.md uses Cursor names but has no H1`);
  if (name !== skill)
    problems.push(
      `skills/${skill}/SKILL.md has name ${JSON.stringify(name ?? "")}, not its folder name ${skill}`,
    );
  if (!SKILL_NAME.test(skill) || skill.length > 64)
    problems.push(`skills/${skill} is not a valid kebab-case folder name`);
  for (const key of terms) users.set(key, [...(users.get(key) ?? []), skill]);
}
const adapterText = readFileSync(join(ROOT, ADAPTER_SOURCE), "utf8");
const optionalSection = adapterText.split("## Optional plugins")[1]?.split("\n## ")[0];
if (!isRaw && optionalSection !== undefined) {
  const rows = optionalSection.split("\n").filter((line) => line.startsWith("|"));
  const header = rows[0]?.split("|").map((cell) => cell.trim());
  if (header?.[1] !== "Plugin packages") {
    problems.push("port/dsh.md optional plugin table must use the Plugin packages column");
  }
  for (const row of rows.slice(2)) {
    const first = row.split("|")[1]?.trim() ?? "";
    if (!first.startsWith("`@deepseek-ai/")) {
      problems.push("port/dsh.md optional plugin table must use package names as row keys");
      break;
    }
  }
}
for (const [key, using] of users) {
  if (!adapterText.includes(key))
    problems.push(`${ADAPTER_SOURCE} has no row for ${key}, used by ${using.join(", ")}`);
}
for (const problem of problems) console.log(`FAIL ${problem}`);
if (problems.length > 0) process.exit(1);

function targetPath(from, href) {
  const target = href.replace(/[#?].*/, "");
  if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) return undefined;
  const path = posix.join(posix.dirname(from), target).replace(/\/$/, "");
  return existsSync(join(SOURCE, path)) ? path : undefined;
}

function has(files, path) {
  return files.has(path) || [...files.keys()].some((key) => key.startsWith(`${path}/`));
}

function render() {
  const copies = [
    ...walk(join(SOURCE, "skills")).map((path) => relative(SOURCE, path)),
    ...walk(join(SOURCE, "agents")).map((path) => relative(SOURCE, path)),
    ...walk(join(SOURCE, "docs/guide")).map((path) => relative(SOURCE, path)),
    "README.md",
    "plugin.json",
  ];
  const files = new Map(copies.map((path) => [path, file(join(SOURCE, path))]));
  files.set(ADAPTER_TREE, { bytes: Buffer.from(adapterText), executable: false });
  const line = INJECTION;
  for (const [skill, { wrap }] of classes) {
    const path = `skills/${skill}/SKILL.md`;
    const text = files.get(path).bytes.toString("utf8");
    if (wrap) files.get(path).bytes = Buffer.from(text.replace(/^(# .*)\n+/m, `$1\n\n${line}\n\n`));
  }
  files.set("LICENSE", file(join(SOURCE, "LICENSE")));
  for (const [path, entry] of files) {
    if (!path.endsWith(".md")) continue;
    const text = entry.bytes.toString("utf8").replace(LINK, (link, href) => {
      const target = targetPath(path, href);
      if (!target || target.split("/")[0] === ".." || has(files, target)) return link;
      const kind = statSync(join(SOURCE, target)).isDirectory() ? "tree" : "blob";
      return `](${GITHUB}/${kind}/main/pstack/${target}${href.slice(href.search(/[#?]|$/))})`;
    });
    entry.bytes = Buffer.from(text);
  }
  return files;
}

const rendered = render();
const dangling = [];
for (const [path, entry] of rendered) {
  if (!path.endsWith(".md")) continue;
  for (const [, href] of entry.bytes.toString("utf8").matchAll(LINK)) {
    const target = targetPath(path, href);
    if (target && !has(rendered, target))
      dangling.push(`pstack/${path} links to ${href}, which is not in the tree`);
  }
}
for (const link of dangling) console.log(`FAIL ${link}`);
if (dangling.length > 0) process.exit(1);

function digestTree(root) {
  const hash = createHash("sha256");
  for (const path of walk(root).sort()) {
    hash.update(relative(root, path));
    hash.update("\0");
    hash.update(readFileSync(path));
    hash.update("\0");
  }
  return hash.digest("hex");
}

if (process.argv.includes("--check")) {
  const onDisk = new Map(
    existsSync(OUT) ? walk(OUT).map((path) => [relative(OUT, path), file(path)]) : [],
  );
  const drifted = [...new Set([...rendered.keys(), ...onDisk.keys()])]
    .sort((left, right) => left.localeCompare(right))
    .filter((path) => {
      const [want, have] = [rendered.get(path), onDisk.get(path)];
      return (
        !want || !have || !want.bytes.equals(have.bytes) || want.executable !== have.executable
      );
    });
  for (const path of drifted.slice(0, 20)) console.log(`pstack/${path}`);
  if (drifted.length > 0) {
    console.log(`pstack is out of date. Run \`${COMMAND}\` and commit the result.`);
    process.exit(1);
  }
  console.log("pstack is up to date.");
} else {
  rmSync(OUT, { recursive: true, force: true });
  for (const [path, { bytes, executable }] of rendered) {
    mkdirSync(dirname(join(OUT, path)), { recursive: true });
    writeFileSync(join(OUT, path), bytes);
    chmodSync(join(OUT, path), executable ? 0o755 : 0o644);
  }
  if (isRaw) {
    const upstreamOut = join(RAW_ROOT, "upstream");
    rmSync(upstreamOut, { recursive: true, force: true });
    cpSync(SOURCE, upstreamOut, {
      recursive: true,
      filter: (source) => !/\/(automations|\.git|node_modules)(\/|$)/.test(source),
    });
    const scriptsOut = join(RAW_ROOT, "scripts");
    rmSync(scriptsOut, { recursive: true, force: true });
    mkdirSync(scriptsOut, { recursive: true });
    cpSync(
      join(ROOT, "upstream/cursor-plugins/scripts/generate-pstack-harness-trees.mjs"),
      join(scriptsOut, "generate-pstack-harness-trees.mjs"),
    );
    writeFileSync(
      join(RAW_ROOT, "manifest.json"),
      `${JSON.stringify(
        {
          target: "raw",
          source: "upstream/cursor-plugins/pstack",
          tree: "pstack",
          digest: digestTree(OUT),
        },
        null,
        2,
      )}\n`,
    );
  }
  const wrapped = [...classes.values()].filter(({ wrap }) => wrap).length;
  console.log(
    `${TARGET}: ${skills.length} skills, ${wrapped} SKILL.md files with the adapter line`,
  );
}
