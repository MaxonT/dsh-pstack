/**
 * Legacy `pstack-models.mdc` parser and migration into `pstack-models.json`.
 *
 * The line format is no longer a production model. It survives only so a
 * `$DSH_HOME` that still holds the old `.mdc` file can be migrated once, then
 * have the `.mdc` removed. Production reads the typed JSON document instead.
 */

import { readFileSync, rmSync } from "node:fs";

import { writeFileAtomically } from "../lib/atomic-write.ts";
import { findRole } from "../roles/role-manifest.ts";
import { INHERIT_ALIASES, type InheritAlias } from "../roles/role-manifest.ts";
import {
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

/** A document shape the typed store's serializer knows how to render. */
export interface LegacyMigrationDocument {
  readonly version: 1;
  readonly budget?: string;
  readonly roles: Record<string, readonly Route[]>;
}

/**
 * Read `mdcPath`, render it as JSON through `serialize`, write `jsonPath`
 * atomically, then delete the legacy file. Any failure throws so the caller can
 * report an unreadable role file instead of silently treating it as missing.
 */
export function migrateLegacyRoleFile(
  mdcPath: string,
  jsonPath: string,
  serialize: (document: LegacyMigrationDocument) => string,
): void {
  const text = readFileSync(mdcPath, "utf8");
  const parsed = parseLegacyRoleFileText(text);
  const roles: Record<string, readonly Route[]> = {};
  for (const [key, routes] of parsed.roles) {
    roles[key] = [...routes];
  }
  writeFileAtomically(
    jsonPath,
    serialize({
      version: 1,
      ...(parsed.budget === undefined ? {} : { budget: parsed.budget }),
      roles,
    }),
  );
  rmSync(mdcPath, { force: true });
}
