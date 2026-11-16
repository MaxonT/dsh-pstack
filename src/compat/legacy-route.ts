/**
 * The legacy `provider/model [effort]` string grammar.
 *
 * Only the migration code reads these strings. The current role file stores
 * structured routes, so nothing outside `compat/` parses or renders them.
 */

import { INHERIT_ALIASES, type InheritAlias } from "../roles/role-manifest.ts";
import { validateRouteParts, type ParsedRoute, type Route } from "../roles/route.ts";

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
