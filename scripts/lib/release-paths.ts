/**
 * Paths whose change is user-visible and should carry a `changes/` note.
 *
 * Shared by `scripts/changes.ts` and `scripts/release-notes.ts` so the soft
 * reminder and the release-time gap warning name the same set.
 */
export const USER_VISIBLE_PATHS = [
  "port/dsh.md",
  "port/dsh.zh.md",
  "port/baseline.json",
  "port/surface.json",
  "cordis.patch.yml",
  "src/subagent.ts",
  "src/role-catalog.ts",
  "src/models.ts",
  "src/skill.ts",
] as const;
