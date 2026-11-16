/**
 * Typed `$DSH_HOME/pstack-models.json` role file: read, parse, serialize, write.
 *
 * Two views of one file live here. The semantic view (`RoleConfiguration`)
 * parses each route into a `Route` and reports issues for the settings page and
 * the delegator. The editable view (`RoleFileDocument`) keeps the raw route
 * strings so a save that touches one role leaves every other role byte-for-byte
 * intact. A legacy `.mdc` beside a missing `.json` is migrated once, then
 * removed; a missing file means every role inherits the parent route, while an
 * unreadable file fails loudly instead of behaving like a fresh install.
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { migrateLegacyRoleFile } from "../compat/legacy-role-file.ts";
import { writeFileAtomically } from "../lib/atomic-write.ts";
import {
  LEGACY_PSTACK_MODELS_FILENAME,
  PSTACK_MODELS_FILENAME,
  findRole,
} from "./role-manifest.ts";
import {
  parseRoute,
  parseRouteEntry,
  validateRoleRouteShape,
  type ParsedRoute,
  type Route,
} from "./route.ts";

export type { Route } from "./route.ts";

/** One configured role as the semantic view sees it. */
export interface RoleEntry {
  readonly key: string;
  readonly routes: readonly Route[];
  readonly issues: readonly string[];
}

/** A file-level issue. JSON has no line numbers, so none are invented. */
export interface RoleFileIssue {
  readonly message: string;
}

/** Parsed role-file state. */
export type RoleConfiguration =
  | { readonly status: "missing"; readonly path: string }
  | { readonly status: "unreadable"; readonly path: string; readonly reason: string }
  | {
      readonly status: "loaded";
      readonly path: string;
      readonly budget?: string;
      readonly roles: ReadonlyMap<string, RoleEntry>;
      readonly issues: readonly RoleFileIssue[];
    };

/** The current role-file schema version. Version 1 stored provider/model strings. */
export const ROLE_FILE_VERSION = 2;

/** The editable JSON shape: version, optional budget, structured routes per role. */
export interface RoleFileDocument {
  readonly version: 1 | 2;
  readonly budget?: string;
  readonly roles: Record<string, readonly Route[]>;
}

/** Absolute role-file path for one DSH home. */
export function modelsFilePath(dshHome: string): string {
  return join(dshHome, PSTACK_MODELS_FILENAME);
}

/** The legacy line-format path beside a JSON role file. */
export function legacyModelsFilePath(jsonPath: string): string {
  return join(dirname(jsonPath), LEGACY_PSTACK_MODELS_FILENAME);
}

/** Resolve `$DSH_HOME`: environment first, then `~/.dsh`. */
export function resolveDshHome(
  env: Readonly<Record<string, string | undefined>> = process.env,
  home: string = homedir(),
): string {
  const raw = env["DSH_HOME"]?.trim();
  const path = raw === undefined || raw === "" ? join(home, ".dsh") : raw;
  const expanded =
    path === "~"
      ? home
      : path.startsWith("~/") || path.startsWith("~\\")
        ? join(home, path.slice(2))
        : path;
  return resolve(expanded);
}

/** An empty document for the first save on a missing home. */
export function emptyRoleDocument(): RoleFileDocument {
  return { version: ROLE_FILE_VERSION, roles: {} };
}

/** Read the version, budget, and roles map shared by both parsers. */
function readRoleDocumentShape(text: string): {
  version: 1 | 2;
  budget?: string;
  rawRoles: Record<string, unknown>;
} {
  const raw = parseJsonObject(text);
  const version = raw["version"];
  if (version !== 1 && version !== 2) {
    throw new Error(`unsupported role file version ${JSON.stringify(raw["version"])}`);
  }
  const budget = raw["budget"];
  if (budget !== undefined && typeof budget !== "string") {
    throw new Error("the role file budget must be a string when present");
  }
  const rawRoles = raw["roles"] ?? {};
  if (typeof rawRoles !== "object" || rawRoles === null || Array.isArray(rawRoles)) {
    throw new Error("the role file roles must be an object");
  }
  return {
    version,
    ...(budget === undefined ? {} : { budget }),
    rawRoles: rawRoles as Record<string, unknown>,
  };
}

/** Parse the JSON document shape used for editing. Throws on an invalid shape. */
export function parseRoleDocument(text: string): RoleFileDocument {
  const { version, budget, rawRoles } = readRoleDocumentShape(text);
  const roles: Record<string, readonly Route[]> = {};
  for (const [key, value] of Object.entries(rawRoles)) {
    if (!Array.isArray(value)) {
      throw new Error(`role ${JSON.stringify(key)} routes must be an array of route entries`);
    }
    roles[key] = value.map((entry) => {
      if (version === 2 && typeof entry === "string") {
        throw new Error(`role ${JSON.stringify(key)}: version 2 routes must be route objects`);
      }
      const parsed = routeFromEntry(entry);
      if (parsed.route === undefined) {
        throw new Error(`role ${JSON.stringify(key)}: ${parsed.issue}`);
      }
      return parsed.route;
    });
  }
  return { version: ROLE_FILE_VERSION, ...(budget === undefined ? {} : { budget }), roles };
}

/** Render an editable role document as stable, pretty-printed JSON. */
export function serializeRoleDocument(document: RoleFileDocument): string {
  const roles: Record<string, readonly Route[]> = {};
  for (const [key, routes] of Object.entries(document.roles)) roles[key] = [...routes];
  return `${JSON.stringify(
    {
      version: ROLE_FILE_VERSION,
      ...(document.budget === undefined ? {} : { budget: document.budget }),
      roles,
    },
    null,
    2,
  )}\n`;
}

/** Parse a JSON role file into its semantic view. Throws only on an invalid top-level shape. */
export function parseRoleConfiguration(text: string, path: string): RoleConfiguration {
  const { version, budget, rawRoles } = readRoleDocumentShape(text);

  const roles = new Map<string, RoleEntry>();
  const issues: RoleFileIssue[] = [];
  for (const [rawKey, rawValue] of Object.entries(rawRoles)) {
    const spec = findRole(rawKey);
    if (spec === undefined) {
      issues.push({ message: `unknown pstack role ${JSON.stringify(rawKey)}` });
      continue;
    }
    if (!Array.isArray(rawValue)) {
      issues.push({ message: `${spec.key}: routes must be an array of route entries` });
      continue;
    }
    if (rawValue.length === 0) {
      issues.push({ message: `${spec.key}: routes are empty` });
      continue;
    }
    const routes: Route[] = [];
    const entryIssues: string[] = [];
    rawValue.forEach((entry, index) => {
      if (version === 2 && typeof entry === "string") {
        entryIssues.push(`entry ${index + 1} must be a route object in version 2`);
        return;
      }
      const parsed = routeFromEntry(entry);
      if (parsed.route === undefined) entryIssues.push(`entry ${index + 1} ${parsed.issue}`);
      else routes.push(parsed.route);
    });
    const shapeIssue = validateRoleRouteShape(spec, routes);
    if (shapeIssue !== undefined) entryIssues.push(shapeIssue);
    for (const issue of entryIssues) issues.push({ message: `${spec.key}: ${issue}` });
    if (roles.has(spec.key)) {
      issues.push({
        message: `role ${JSON.stringify(spec.key)} is configured twice; the later entry wins`,
      });
    }
    roles.set(spec.key, { key: spec.key, routes, issues: entryIssues });
  }

  return {
    status: "loaded",
    path,
    ...(budget === undefined ? {} : { budget: budget as string }),
    roles,
    issues,
  };
}

/** Read the role file without throwing. A legacy `.mdc` is migrated on first read. */
export function readRoleConfiguration(path: string): RoleConfiguration {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    if (!isMissingFile(error)) {
      return { status: "unreadable", path, reason: describeError(error) };
    }
    const legacy = legacyModelsFilePath(path);
    if (!existsSync(legacy)) return { status: "missing", path };
    try {
      migrateLegacyRoleFile(legacy, path, serializeRoleDocument);
      return parseRoleConfiguration(readFileSync(path, "utf8"), path);
    } catch (migrationError) {
      return { status: "unreadable", path, reason: describeError(migrationError) };
    }
  }
  try {
    return parseRoleConfiguration(text, path);
  } catch (error) {
    return { status: "unreadable", path, reason: describeError(error) };
  }
}

/** One route entry: a structured object, or a legacy string token. */
function routeFromEntry(entry: unknown): ParsedRoute {
  return typeof entry === "string" ? parseRoute(entry) : parseRouteEntry(entry);
}

/** Atomically write an editable role document. */
export function writeRoleDocument(path: string, document: RoleFileDocument): void {
  writeFileAtomically(path, serializeRoleDocument(document));
}

function parseJsonObject(text: string): Record<string, unknown> {
  const raw = JSON.parse(text) as unknown;
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("the role file must be a JSON object");
  }
  return raw as Record<string, unknown>;
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && (error as { code?: unknown }).code === "ENOENT"
  );
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
