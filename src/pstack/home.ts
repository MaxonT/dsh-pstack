/**
 * The pstack home layout.
 *
 * Every global pstack file lives under one directory, `$DSH_HOME/pstack/`. This
 * module is the single source of truth for those paths and their names. Legacy
 * files at the `$DSH_HOME` root are named here only so the startup migration can
 * find them once; runtime reads and writes use the current paths.
 */

import { join } from "node:path";

import { resolveDshHome } from "../lib/dsh-home.ts";

/** The directory under `$DSH_HOME` that holds every pstack global file. */
export const PSTACK_DIRNAME = "pstack";

/** Current filenames inside `$DSH_HOME/pstack/`. */
export const MODELS_FILENAME = "models.json";
export const SETTINGS_FILENAME = "settings.json";
export const REPAIR_FILENAME = "repair.json";

/** Legacy filenames at the `$DSH_HOME` root. `pstack-repair.json` is never migrated. */
export const LEGACY_MODELS_FILENAME = "pstack-models.json";
export const LEGACY_MODELS_MDC_FILENAME = "pstack-models.mdc";
export const LEGACY_SETTINGS_FILENAME = "pstack-settings.json";

/** The four absolute paths that make up one pstack home. */
export interface PstackHomePaths {
  readonly root: string;
  readonly models: string;
  readonly settings: string;
  readonly repair: string;
}

/** Resolve the pstack home paths for one DSH home. */
export function pstackHomePaths(dshHome: string = resolveDshHome()): PstackHomePaths {
  const root = join(dshHome, PSTACK_DIRNAME);
  return {
    root,
    models: join(root, MODELS_FILENAME),
    settings: join(root, SETTINGS_FILENAME),
    repair: join(root, REPAIR_FILENAME),
  };
}
