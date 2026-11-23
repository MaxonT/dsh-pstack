/**
 * One idempotent startup pass that converges every global pstack file on
 * `$DSH_HOME/pstack/`. Runtime readers never migrate; they only read the
 * current paths. Running this twice, or after a crash at any point, reaches the
 * same end state because each step reads what is on disk and moves only what is
 * still legacy.
 */

import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";

import { migrateMdcToJson } from "../compat/mdc-to-json.ts";
import { upgradeRoleFile } from "../compat/upgrade-role-file.ts";
import { ROLE_FILE_VERSION, serializeRoleDocument } from "../roles/role-store.ts";
import { resolveDshHome } from "../lib/dsh-home.ts";
import {
  LEGACY_MODELS_FILENAME,
  LEGACY_MODELS_MDC_FILENAME,
  LEGACY_SETTINGS_FILENAME,
  pstackHomePaths,
} from "./home.ts";

/** Move one legacy file into place when the current file does not already exist. */
function moveLegacy(legacyPath: string, currentPath: string): void {
  if (existsSync(currentPath) || !existsSync(legacyPath)) return;
  mkdirSync(dirname(currentPath), { recursive: true });
  try {
    renameSync(legacyPath, currentPath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    // A concurrent startup pass may have won the race: the source is gone
    // (ENOENT) or the destination already exists (EEXIST on Windows).
    if (code === "ENOENT" || (code === "EEXIST" && existsSync(currentPath))) return;
    throw error;
  }
}

/** Converge `$DSH_HOME` on the current pstack layout in one startup pass. */
export function migratePstackHome(dshHome: string = resolveDshHome()): void {
  const paths = pstackHomePaths(dshHome);
  const legacyModels = join(dshHome, LEGACY_MODELS_FILENAME);
  const legacyMdc = join(dshHome, LEGACY_MODELS_MDC_FILENAME);
  const legacySettings = join(dshHome, LEGACY_SETTINGS_FILENAME);

  // A current models.json wins. Otherwise a legacy JSON file moves, or a legacy
  // `.mdc` is parsed into the current JSON and removed. A malformed `.mdc` throws
  // so the failure surfaces instead of silently degrading to a missing role file.
  if (!existsSync(paths.models)) {
    if (existsSync(legacyModels)) {
      moveLegacy(legacyModels, paths.models);
      // The legacy JSON is authoritative; a sibling `.mdc` is obsolete, so a
      // legacy-only home leaves no legacy role file behind.
      if (existsSync(legacyMdc)) rmSync(legacyMdc, { force: true });
    } else if (existsSync(legacyMdc)) {
      migrateMdcToJson(legacyMdc, paths.models, {
        currentVersion: ROLE_FILE_VERSION,
        serialize: serializeRoleDocument,
      });
    }
  }

  // Upgrade version 1 to 2 and drop retired roles or budget labels in place.
  if (existsSync(paths.models)) {
    upgradeRoleFile(paths.models, {
      currentVersion: ROLE_FILE_VERSION,
      serialize: serializeRoleDocument,
    });
  }

  // A current settings.json wins; otherwise the legacy file moves once.
  moveLegacy(legacySettings, paths.settings);

  // Legacy pstack-repair.json is intentionally left untouched and never read.
}
