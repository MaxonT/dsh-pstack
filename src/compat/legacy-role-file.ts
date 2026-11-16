/**
 * Legacy role-file compatibility: `.mdc` line format and `version: 1` string routes.
 *
 * Every legacy shape is detected, upgraded to the current version, and written
 * once before the normal reader runs. Deleting this directory drops all legacy
 * support in one place.
 */

import { existsSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";

import { writeFileAtomically } from "../lib/atomic-write.ts";
import {
  LEGACY_PSTACK_MODELS_FILENAME,
  findRole,
  INHERIT_ALIASES,
  type InheritAlias,
} from "../roles/role-manifest.ts";
import {
  parseRouteEntry,
  validateRoleRouteShape,
  validateRouteParts,
  type ParsedRoute,
  type Route,
} from "../roles/route.ts";

/** One file-level problem found while parsing the legacy line format. */
export interface LegacyRoleFileIssue {
  readonly message: string;
}

/** The semantic view of a legacy role file: budget value plus parsed routes. */
export interface LegacyRoleFile {
  readonly budget?: string;
  readonly roles: ReadonlyMap<string, readonly Route[]>;
  readonly issues: readonly LegacyRoleFileIssue[];
}

/** The single matcher for a `# budget:` line. Captures the value after the colon. */
export const BUDGET_LINE = /^[ \t]*#[ \t]*budget[ \t]*:[ \t]*(.*)$/i;

/** Return the value after `# budget:`, or `undefined` when the line is not a budget line. */
export function budgetLineValue(line: string): string | undefined {
  const match = BUDGET_LINE.exec(line);
  return match === null ? undefined : (match[1] ?? "").trim();
}

/** Parse one legacy `<provider>/<model> [effort]` token. */
export function parseLegacyRoute(raw: string): ParsedRoute {
  const value = raw.trim();
  if (value === "") return { issue: "the value is empty" };
  const alias = value.toLowerCase();
  if ((INHERIT_ALIASES as readonly string[]).includes(alias)) {
    return { route: { kind: "inherit", alias: alias as InheritAlias }, issue: "" };
  }
  const slash = value.indexOf("/");
  if (slash <= 0 || slash === value.length - 1) {
    return {
      issue: `${JSON.stringify(value)} is not a route; use \`inherit-parent\`, \`auto\`, or \`<provider>/<model> [effort]\``,
    };
  }
  const provider = value.slice(0, slash).trim();
  let rest = value.slice(slash + 1).trim();
  let effort: string | undefined;
  const bracket = /\s*\[([^[\]]*)\]\s*$/.exec(rest);
  if (bracket !== null) {
    effort = bracket[1]!.trim();
    rest = rest.slice(0, bracket.index).trim();
  }
  const model = rest;
  const problem = validateRouteParts(provider, model, effort);
  if (problem !== undefined) return { issue: `${JSON.stringify(value)} ${problem}` };
  return {
    route: { kind: "route", provider, model, ...(effort === undefined ? {} : { effort }) },
    issue: "",
  };
}

/** Parse one legacy role value: a single route or a comma-separated list. */
export function parseLegacyRouteValue(raw: string): {
  readonly routes: readonly Route[];
  readonly issues: readonly string[];
} {
  const routes: Route[] = [];
  const issues: string[] = [];
  const segments = raw.split(",");
  segments.forEach((segment, index) => {
    const value = segment.trim();
    if (value === "") {
      if (index !== segments.length - 1) issues.push(`entry ${index + 1} of the list is empty`);
      return;
    }
    const parsed = parseLegacyRoute(value);
    if (parsed.route === undefined) issues.push(parsed.issue);
    else routes.push(parsed.route);
  });
  if (routes.length === 0 && issues.length === 0) {
    issues.push(
      "the value is empty; use `inherit-parent`, `auto`, or `<provider>/<model> [effort]`",
    );
  }
  return { routes, issues };
}

/** Parse the legacy line grammar. Pure: no filesystem access. */
export function parseLegacyRoleFileText(text: string): LegacyRoleFile {
  const roles = new Map<string, readonly Route[]>();
  const issues: LegacyRoleFileIssue[] = [];
  let budget: string | undefined;

  if (text !== "") {
    for (const rawLine of text.split(/\r?\n/)) {
      const trimmed = rawLine.trim();
      if (trimmed === "") continue;
      if (trimmed.startsWith("#")) {
        const value = budgetLineValue(rawLine);
        if (value !== undefined && value !== "") budget = value;
        continue;
      }

      const colon = rawLine.indexOf(":");
      if (colon === -1) {
        issues.push({ message: `expected \`<role>: <value>\`, found ${JSON.stringify(trimmed)}` });
        continue;
      }
      const rawKey = rawLine.slice(0, colon).trim();
      if (rawKey === "") {
        issues.push({ message: "the role key is empty" });
        continue;
      }
      const spec = findRole(rawKey);
      if (spec === undefined) {
        issues.push({ message: `unknown pstack role ${JSON.stringify(rawKey)}` });
        continue;
      }

      const parsed = parseLegacyRouteValue(rawLine.slice(colon + 1));
      const entryIssues = [...parsed.issues];
      const shapeIssue = validateRoleRouteShape(spec, parsed.routes);
      if (shapeIssue !== undefined) entryIssues.push(shapeIssue);
      for (const issue of entryIssues) issues.push({ message: `${rawKey}: ${issue}` });
      if (parsed.routes.length === 0) continue;
      roles.set(spec.key, parsed.routes);
    }
  }

  return { ...(budget === undefined ? {} : { budget }), roles, issues };
}

/** The document shape the current serializer accepts. */
export interface RoleFileDocumentLike {
  readonly version: number;
  readonly budget?: string;
  readonly roles: Record<string, readonly Route[]>;
}

/** Options for {@link upgradeRoleFile}. */
export interface UpgradeRoleFileOptions {
  readonly currentVersion: number;
  readonly serialize: (document: RoleFileDocumentLike) => string;
}

/** Result of checking and upgrading one role file in place. */
export type RoleFileUpgrade =
  | { readonly status: "current" }
  | { readonly status: "migrated" }
  | { readonly status: "missing" }
  | { readonly status: "unreadable"; readonly reason: string };

/**
 * Detect the on-disk role file and upgrade it to the current version before the
 * normal reader runs: a legacy `.mdc` becomes the JSON file and is removed, and a
 * `version: 1` JSON document is rewritten with structured routes. The JSON path
 * always ends up holding the current version, or the result reports why not.
 */
export function upgradeRoleFile(
  jsonPath: string,
  options: UpgradeRoleFileOptions,
): RoleFileUpgrade {
  if (!existsSync(jsonPath)) {
    const mdcPath = join(dirname(jsonPath), LEGACY_PSTACK_MODELS_FILENAME);
    if (!existsSync(mdcPath)) return { status: "missing" };
    try {
      const parsed = parseLegacyRoleFileText(readFileSync(mdcPath, "utf8"));
      if (parsed.issues.length > 0) {
        return { status: "unreadable", reason: parsed.issues[0]!.message };
      }
      const roles: Record<string, readonly Route[]> = {};
      for (const [key, routes] of parsed.roles) roles[key] = [...routes];
      writeFileAtomically(
        jsonPath,
        options.serialize({
          version: options.currentVersion,
          ...(parsed.budget === undefined ? {} : { budget: parsed.budget }),
          roles,
        }),
      );
      rmSync(mdcPath, { force: true });
      return { status: "migrated" };
    } catch (error) {
      return { status: "unreadable", reason: describeError(error) };
    }
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(jsonPath, "utf8"));
  } catch (error) {
    return { status: "unreadable", reason: describeError(error) };
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { status: "unreadable", reason: "the role file must be a JSON object" };
  }
  const record = raw as Record<string, unknown>;
  const version = record["version"];
  if (version === options.currentVersion) return { status: "current" };
  if (version !== 1) {
    return {
      status: "unreadable",
      reason: `unsupported role file version ${JSON.stringify(version)}`,
    };
  }
  try {
    const roles = upgradeVersionOneRoles(record["roles"]);
    const budget = record["budget"];
    if (budget !== undefined && typeof budget !== "string") {
      return { status: "unreadable", reason: "the role file budget must be a string" };
    }
    writeFileAtomically(
      jsonPath,
      options.serialize({
        version: options.currentVersion,
        ...(budget === undefined ? {} : { budget }),
        roles,
      }),
    );
    return { status: "migrated" };
  } catch (error) {
    return { status: "unreadable", reason: describeError(error) };
  }
}

/** Convert a `version: 1` roles map with string routes into structured routes. */
function upgradeVersionOneRoles(raw: unknown): Record<string, readonly Route[]> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("the role file roles must be an object");
  }
  const roles: Record<string, readonly Route[]> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(value)) {
      throw new Error(`role ${JSON.stringify(key)} routes must be an array`);
    }
    roles[key] = value.map((entry) => {
      const parsed = typeof entry === "string" ? parseLegacyRoute(entry) : parseRouteEntry(entry);
      if (parsed.route === undefined)
        throw new Error(`role ${JSON.stringify(key)}: ${parsed.issue}`);
      return parsed.route;
    });
  }
  return roles;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
