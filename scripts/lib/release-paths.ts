/**
 * Paths whose change is user-visible and should carry a `changes/` note.
 *
 * Shared by `scripts/changes.ts` and `scripts/release-notes.ts` so the soft
 * reminder and the release-time gap warning name the same set. An entry ending
 * in `/` matches every file under that directory; any other entry matches one
 * exact file.
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
  "src/client/",
  "src/presets/",
] as const;

/** Whether one changed path is user-visible. */
export function isUserVisiblePath(path: string): boolean {
  return USER_VISIBLE_PATHS.some((entry) =>
    entry.endsWith("/") ? path.startsWith(entry) : path === entry,
  );
}
