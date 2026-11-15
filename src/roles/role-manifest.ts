/**
 * The pstack role manifest.
 *
 * Role keys are matched exactly after whitespace and comma normalization. Commas
 * belong to some keys (`feature, refactoring`), so the key is never split on a
 * comma. Role behavior comes from `pstack/skills/setup-pstack/SKILL.md`.
 */

/** Whether a role holds one route or a comma-separated list of routes. */
export const ROLE_SHAPES = ["single", "list"] as const;
export type RoleShape = (typeof ROLE_SHAPES)[number];

/** One role in the pstack role manifest, keyed and shaped for the role file and `pstack_roles`. */
export interface RoleSpec {
  /** Exact key as written in the role file. Commas belong to the key. */
  readonly key: string;
  readonly shape: RoleShape;
}

/** Role file name under `$DSH_HOME`. The plugin reads and edits it; DSH never loads it. */
export const PSTACK_MODELS_FILENAME = "pstack-models.json";

/** Legacy line-format role file that `pstack-models.json` migrated from. */
export const LEGACY_PSTACK_MODELS_FILENAME = "pstack-models.mdc";

/** Values that resolve to "send no route override and inherit the parent route". */
export const INHERIT_ALIASES = ["inherit-parent", "auto"] as const;
export type InheritAlias = (typeof INHERIT_ALIASES)[number];

/** The 17 roles, in the order `setup-pstack` documents them. */
export const ROLE_MANIFEST = [
  { key: "feature, refactoring", shape: "single" },
  { key: "bug-fix", shape: "single" },
  { key: "perf-issue", shape: "single" },
  { key: "hillclimb", shape: "single" },
  { key: "judgment and prose", shape: "single" },
  { key: "hardest tasks", shape: "single" },
  { key: "how explorer", shape: "single" },
  { key: "how explainer", shape: "single" },
  { key: "why investigators", shape: "single" },
  { key: "why synthesizer", shape: "single" },
  { key: "reflect tooling", shape: "single" },
  { key: "reflect judgment, divergent, synthesizer", shape: "single" },
  { key: "arena runners", shape: "list" },
  { key: "arena cross-judge pool", shape: "list" },
  { key: "swarm workers", shape: "list" },
  { key: "architect runners", shape: "list" },
  { key: "interrogate reviewers", shape: "list" },
] as const satisfies readonly RoleSpec[];

export type RoleKey = (typeof ROLE_MANIFEST)[number]["key"];

/** Normalize spacing and comma formatting without splitting the key. */
export function normalizeRoleName(raw: string): string {
  return raw
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/:+$/, "")
    .trim();
}

/** Look up one role by its exact normalized key. */
export function findRole(raw: string): RoleSpec | undefined {
  const key = normalizeRoleName(raw);
  return ROLE_MANIFEST.find((role) => role.key === key);
}

/** Whether a string is one of the manifest keys. */
export function isRoleKey(raw: string): raw is RoleKey {
  return findRole(raw) !== undefined;
}
