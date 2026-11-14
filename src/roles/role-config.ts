/**
 * Route selection over the role manifest and one configured role entry.
 *
 * The selector never touches the filesystem. It turns a role plus an optional
 * exact route string into the routes one `pstack_subagent` call starts.
 */

import { ROLE_MANIFEST, findRole, type RoleSpec } from "./role-manifest.ts";
import type { RoleEntry } from "./role-store.ts";
import { parseRoute, renderRouteValue, routeId, type Route } from "./route.ts";

export type { Route } from "./route.ts";
export type { RoleEntry } from "./role-store.ts";

/** How one role expands into children. */
export type RouteSelectionMode = "single" | "panel" | "selected";

export interface RouteSelection {
  readonly role: RoleSpec;
  readonly mode: RouteSelectionMode;
  readonly configured: boolean;
  readonly routes: readonly Route[];
  readonly total: number;
  /** The exact route string chosen for a list role selected by `roleRoute`. */
  readonly roleRoute?: string;
}

/** Resolve one role into the routes this call starts. */
export function selectRoutes(
  spec: RoleSpec,
  entry: RoleEntry | undefined,
  roleRoute: string | undefined,
): RouteSelection {
  if (spec.shape === "single" && roleRoute !== undefined) {
    throw new Error(`role "${spec.key}" holds a single route, so \`roleRoute\` does not apply`);
  }
  if (spec.autoPanel && roleRoute !== undefined) {
    throw new Error(
      `role "${spec.key}" is an automatic panel: it starts one child per entry, so \`roleRoute\` does not apply`,
    );
  }
  if (entry === undefined) {
    return {
      role: spec,
      mode: spec.autoPanel ? "panel" : "single",
      configured: false,
      routes: [{ kind: "inherit", alias: "inherit-parent" }],
      total: 1,
    };
  }
  if (entry.issues.length > 0) {
    throw new Error(`role "${spec.key}" has invalid configuration: ${entry.issues.join("; ")}`);
  }
  if (spec.autoPanel) {
    return {
      role: spec,
      mode: "panel",
      configured: true,
      routes: entry.routes,
      total: entry.routes.length,
    };
  }
  if (spec.shape === "list") {
    const canonical = entry.routes.map((route) => renderRouteValue([route]));
    const ids = entry.routes.map((route) => routeId(route));
    let index = 0;
    if (roleRoute !== undefined) {
      const byId = ids.indexOf(roleRoute);
      const requested = canonicalRoute(roleRoute);
      const byCanonical = requested === undefined ? -1 : canonical.indexOf(requested);
      const found = byId >= 0 ? byId : byCanonical;
      if (found === -1) {
        throw new Error(
          `role "${spec.key}" has no configured route ${JSON.stringify(roleRoute)}; available routes: ${ids.map((id, routeIndex) => `${id} (${canonical[routeIndex]})`).join(", ")}`,
        );
      }
      index = found;
    } else if (entry.routes.length > 1) {
      throw new Error(
        `role "${spec.key}" has ${entry.routes.length} routes; pass roleRoute as one of: ${ids.map((id, routeIndex) => `${id} (${canonical[routeIndex]})`).join(", ")}`,
      );
    }
    const route = entry.routes[index]!;
    return {
      role: spec,
      mode: "selected",
      configured: true,
      routes: [route],
      total: entry.routes.length,
      roleRoute: canonical[index]!,
    };
  }
  const route = entry.routes[0];
  if (route === undefined) throw new Error(`role "${spec.key}" has no route`);
  return { role: spec, mode: "single", configured: true, routes: [route], total: 1 };
}

/** Canonical `provider/model [effort]` (or inherit alias) for one route token, or undefined. */
function canonicalRoute(raw: string): string | undefined {
  const parsed = parseRoute(raw);
  return parsed.route === undefined ? undefined : renderRouteValue([parsed.route]);
}

/** Resolve an exact role key or throw a diagnostic that lists the manifest. */
export function requireRole(raw: string): RoleSpec {
  const spec = findRole(raw);
  if (spec !== undefined) return spec;
  throw new Error(
    `unknown pstack role ${JSON.stringify(raw)}; role names come from the pstack role manifest, not free text. Known roles: ${ROLE_MANIFEST.map((role) => JSON.stringify(role.key)).join(", ")}`,
  );
}
