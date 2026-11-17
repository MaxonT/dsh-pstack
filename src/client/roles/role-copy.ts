/** Locale keys for the display name and scenario of every pstack role. */

import type { RolesKey, Translate } from "../locales/index.ts";

export interface RoleCopy {
  readonly nameKey: RolesKey;
  readonly descriptionKey: RolesKey;
}

/**
 * Optional per-role display copy, keyed by the raw role key. A role with no entry
 * falls back to its raw key and an empty description, so adding or retiring a
 * manifest role never forces an edit here.
 */
export const ROLE_COPY: Partial<Record<string, RoleCopy>> = {
  "feature, refactoring": {
    nameKey: "roleFeatureName",
    descriptionKey: "roleFeatureDescription",
  },
  "bug-fix": { nameKey: "roleBugFixName", descriptionKey: "roleBugFixDescription" },
  "perf-issue": { nameKey: "rolePerfName", descriptionKey: "rolePerfDescription" },
  hillclimb: { nameKey: "roleHillclimbName", descriptionKey: "roleHillclimbDescription" },
  "judgment and prose": {
    nameKey: "roleJudgmentName",
    descriptionKey: "roleJudgmentDescription",
  },
  "arena runners": {
    nameKey: "roleArenaRunnersName",
    descriptionKey: "roleArenaRunnersDescription",
  },
  "arena cross-judge pool": {
    nameKey: "roleArenaJudgesName",
    descriptionKey: "roleArenaJudgesDescription",
  },
  "swarm workers": { nameKey: "roleSwarmName", descriptionKey: "roleSwarmDescription" },
  "interrogate reviewers": {
    nameKey: "roleInterrogateName",
    descriptionKey: "roleInterrogateDescription",
  },
};

/** User-facing role name, falling back to the raw key when no copy exists. */
export function roleLabel(key: string, t: Translate<RolesKey>): string {
  const copy = ROLE_COPY[key];
  return copy === undefined ? key : t(copy.nameKey);
}

/** User-facing role description, empty when no copy exists. */
export function roleDescription(key: string, t: Translate<RolesKey>): string {
  const copy = ROLE_COPY[key];
  return copy === undefined ? "" : t(copy.descriptionKey);
}
