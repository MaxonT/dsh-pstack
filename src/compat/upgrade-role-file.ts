/**
 * Detect the on-disk role file and upgrade it to the current version before the
 * normal reader runs. Each legacy shape lives in its own migration module.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { writeFileAtomically } from "../lib/atomic-write.ts";
import { LEGACY_PSTACK_MODELS_FILENAME } from "../roles/role-manifest.ts";
import type { Route } from "../roles/route.ts";
import { migrateMdcToJson } from "./mdc-to-json.ts";
import { upgradeVersionOneRoles } from "./version-1-to-2.ts";

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
 * Detect the role file and upgrade it in place. A `.mdc` beside a missing `.json`
 * is migrated and removed; a `version: 1` JSON document is rewritten with
 * structured routes; an unknown version is unreadable. The JSON path always ends
 * up at the current version, or the result reports why not.
 */
export function upgradeRoleFile(
  jsonPath: string,
  options: UpgradeRoleFileOptions,
): RoleFileUpgrade {
  if (!existsSync(jsonPath)) {
    const mdcPath = join(dirname(jsonPath), LEGACY_PSTACK_MODELS_FILENAME);
    if (!existsSync(mdcPath)) return { status: "missing" };
    try {
      migrateMdcToJson(mdcPath, jsonPath, options);
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

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
