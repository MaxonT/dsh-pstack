import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import { formatTimestamp } from "./progress.ts";
import { REPOSITORY_ROOT, upstreamRevision } from "./run-metadata.ts";

export type CapabilityStatus = "discovered" | "covered" | "excluded" | "retired";

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
const UPSTREAM = join(REPOSITORY_ROOT, "upstream/cursor-plugins/pstack");
const SCENARIO_ROOT = join(REPOSITORY_ROOT, "playground/scenarios/capabilities");
const INVENTORY = join(REPOSITORY_ROOT, "playground/scenarios/inventory.json");
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

function dshRows(): Array<{ key: string; description: string }> {
  const rows: Array<{ key: string; description: string }> = [];
  let inTable = false;
  for (const line of readFileSync(RAW_DSH, "utf8").split("\n")) {
    if (line.startsWith("|")) {
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      if (cells[0] === "Cursor" || cells[0] === "dsh.md 行" || /^---+$/.test(cells[0])) continue;
      if (cells[0] !== "") rows.push({ key: cells[0], description: cells.slice(1).join(" ") });
      inTable = true;
    } else if (inTable) {
      inTable = false;
    }
  }
  return [...new Map(rows.map((row) => [row.key, row])).values()];
}

function readExclusions(): Map<string, string> {
  if (!existsSync(EXCLUSIONS)) return new Map();
  const parsed = JSON.parse(readFileSync(EXCLUSIONS, "utf8")) as Record<string, unknown>;
  return new Map(
    Object.entries(parsed).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
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
    if (id && capability) probes.set(capability, id);
  }
  return probes;
}

export function buildCapabilityInventory(): CapabilityInventory {
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
  const previous: CapabilityEntry[] = existsSync(INVENTORY)
    ? (JSON.parse(readFileSync(INVENTORY, "utf8")) as CapabilityInventory).capabilities
    : [];
  const currentIds = new Set(current.map((entry) => entry.id));
  const retired = previous
    .filter((entry) => !currentIds.has(entry.id) && entry.status !== "retired")
    .map((entry) => ({ ...entry, status: "retired" as const }));
  return {
    generatedAt: formatTimestamp(),
    upstreamRevision: upstreamRevision(),
    capabilities: [...current, ...retired],
  };
}

export function checkOrWriteInventory(write: boolean): CapabilityInventory {
  const inventory = buildCapabilityInventory();
  if (write) writeFileSync(INVENTORY, `${JSON.stringify(inventory, null, 2)}\n`);
  return inventory;
}

export function inventoryPath(): string {
  return INVENTORY;
}
