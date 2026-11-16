/**
 * The `version: 1` JSON role file, whose routes were `provider/model` strings.
 *
 * Converts the roles map into structured routes so the file can be rewritten at
 * the current version. Nothing here runs once the file is at the current version.
 */

import { parseRouteEntry, type Route } from "../roles/route.ts";
import { parseLegacyRoute } from "./legacy-route.ts";

/** Convert a `version: 1` roles map with string routes into structured routes. */
export function upgradeVersionOneRoles(raw: unknown): Record<string, readonly Route[]> {
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
      if (parsed.route === undefined) {
        throw new Error(`role ${JSON.stringify(key)}: ${parsed.issue}`);
      }
      return parsed.route;
    });
  }
  return roles;
}
