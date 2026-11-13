import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import { formatTimestamp } from "./progress.ts";
import { REPOSITORY_ROOT, upstreamRevision } from "./run-metadata.ts";

export type CapabilityStatus = "discovered" | "covered" | "excluded";

export interface CapabilityEntry {
  id: string;
  description: string;
  source: string;
  sources: string[];
  requiredBy: string[];
  probe?: string;
  status: CapabilityStatus;
  exclusionReason?: string;
}

export interface CapabilityInventory {
  generatedAt: string;
  upstreamRevision: string;
  capabilities: CapabilityEntry[];
}

const RAW_DSH = join(REPOSITORY_ROOT, "playground/raw/dsh.md");
const RAW_DSH_ZH = join(REPOSITORY_ROOT, "playground/raw/dsh.zh.md");
const UPSTREAM = join(REPOSITORY_ROOT, "upstream/cursor-plugins/pstack");

function assertUpstreamSource(): void {
  if (!existsSync(UPSTREAM)) {
    throw new Error(`capability source tree is missing: ${UPSTREAM}`);
  }
}
const SCENARIO_ROOT = join(REPOSITORY_ROOT, "playground/scenarios");
const INVENTORY = join(REPOSITORY_ROOT, "playground/scenarios/capability-inventory.json");
const EXCLUSIONS = join(REPOSITORY_ROOT, "playground/scenarios/capability-exclusions.json");

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const IGNORED_SECTIONS = new Set(["Paths", "路径", "Cursor-only features"]);

function readRows(file: string, ignoredSections = IGNORED_SECTIONS): Map<string, string> {
  const rows = new Map<string, string>();
  let section = "";
  let inTable = false;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const heading = line.match(/^##\s+(.+)/)?.[1]?.trim();
    if (heading !== undefined) {
      section = heading;
      inTable = false;
      continue;
    }
    if (ignoredSections.has(section)) continue;
    if (line.startsWith("|")) {
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      if (cells[0] === "Cursor" || cells[0] === "dsh.md 行" || /^---+$/.test(cells[0])) continue;
      if (cells[0] !== "" && !rows.has(cells[0])) rows.set(cells[0], cells.slice(1).join(" "));
      inTable = true;
    } else if (inTable) {
      inTable = false;
    }
  }
  return rows;
}

function dshRows(): Array<{ key: string; description: string }> {
  const english = readRows(RAW_DSH);
  const chinese = readRows(RAW_DSH_ZH);
  return [...english.entries()].map(([key, description]) => ({
    key,
    description: chinese.get(key) ?? description,
  }));
}

interface ExclusionDecision {
  reason: string;
  decidedBy: "user";
}

function readExclusions(): Map<string, string> {
  if (!existsSync(EXCLUSIONS)) return new Map();
  const parsed = JSON.parse(readFileSync(EXCLUSIONS, "utf8")) as Record<string, unknown>;
  const decisions = new Map<string, string>();
  for (const [id, value] of Object.entries(parsed)) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(
        `capability exclusion ${id} must be a user decision object; unapproved candidates belong in capability-exclusions.proposed.json`,
      );
    }
    const decision = value as Partial<ExclusionDecision>;
    if (
      decision.decidedBy !== "user" ||
      typeof decision.reason !== "string" ||
      decision.reason.trim() === ""
    ) {
      throw new Error(`capability exclusion ${id} must include reason and decidedBy: "user"`);
    }
    decisions.set(id, decision.reason);
  }
  return decisions;
}

function upstreamSources(term: string): { sources: string[]; requiredBy: string[] } {
  const needles = [term, term.replace(/`/g, "")].filter(Boolean);
  const sources: string[] = [];
  const requiredBy = new Set<string>();
  for (const file of walk(UPSTREAM).filter((entry) => entry.endsWith(".md"))) {
    const text = readFileSync(file, "utf8");
    if (!needles.some((needle) => text.includes(needle))) continue;
    const rel = relative(REPOSITORY_ROOT, file);
    sources.push(rel);
    const skill = rel.match(/^upstream\/cursor-plugins\/pstack\/skills\/([^/]+)\//)?.[1];
    if (skill !== undefined) requiredBy.add(skill);
  }
  return { sources, requiredBy: [...requiredBy].sort() };
}

function scenarioProbes(): Map<string, string> {
  const probes = new Map<string, string>();
  for (const file of walk(SCENARIO_ROOT).filter((entry) => entry.endsWith(".ts"))) {
    const text = readFileSync(file, "utf8");
    const id = text.match(/\bid:\s*"([^"]+)"/)?.[1];
    const capability = text.match(/\bcapability:\s*"([^"]+)"/)?.[1];
    if (!id || !capability) continue;
    const previous = probes.get(capability);
    if (previous !== undefined) {
      throw new Error(`capability ${capability} has multiple probes: ${previous}, ${id}`);
    }
    probes.set(capability, id);
  }
  return probes;
}

export function buildCapabilityInventory(): CapabilityInventory {
  assertUpstreamSource();
  const probes = scenarioProbes();
  const exclusions = readExclusions();
  const current = dshRows().map((row) => {
    const id = slug(row.key);
    const upstream = upstreamSources(row.key);
    const exclusionReason = exclusions.get(id);
    return {
      id,
      description: row.description,
      source: "playground/raw/dsh.md + upstream/cursor-plugins/pstack",
      sources: ["playground/raw/dsh.md", ...upstream.sources],
      requiredBy: upstream.requiredBy,
      ...(exclusionReason === undefined && probes.has(id) ? { probe: probes.get(id) } : {}),
      status:
        exclusionReason === undefined
          ? probes.has(id)
            ? ("covered" as const)
            : ("discovered" as const)
          : ("excluded" as const),
      ...(exclusionReason === undefined ? {} : { exclusionReason }),
    };
  });
  return {
    generatedAt: formatTimestamp(),
    upstreamRevision: upstreamRevision(),
    capabilities: current,
  };
}

export function checkOrWriteInventory(write: boolean): CapabilityInventory {
  const inventory = buildCapabilityInventory();
  if (write) {
    writeFileSync(INVENTORY, `${JSON.stringify(inventory, null, 2)}\n`);
    return inventory;
  }
  if (!existsSync(INVENTORY)) {
    throw new Error(`capability inventory is missing: ${INVENTORY}; run playground:capabilities`);
  }
  const existing = JSON.parse(readFileSync(INVENTORY, "utf8")) as CapabilityInventory;
  const currentContent = JSON.stringify({
    upstreamRevision: inventory.upstreamRevision,
    capabilities: inventory.capabilities,
  });
  const existingContent = JSON.stringify({
    upstreamRevision: existing.upstreamRevision,
    capabilities: existing.capabilities,
  });
  if (currentContent !== existingContent) {
    throw new Error(`capability inventory is stale: ${INVENTORY}; run playground:capabilities`);
  }
  return inventory;
}

export function inventoryPath(): string {
  return INVENTORY;
}
