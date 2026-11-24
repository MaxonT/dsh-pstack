/** Resolve the DeepSeek Harness home directory shared by every pstack file. */

import { homedir } from "node:os";
import { join, resolve } from "node:path";

/** Resolve `$DSH_HOME`: environment first, then `~/.dsh`. */
export function resolveDshHome(
  env: Readonly<Record<string, string | undefined>> = process.env,
  home: string = homedir(),
): string {
  const raw = env["DSH_HOME"]?.trim();
  const path = raw === undefined || raw === "" ? join(home, ".dsh") : raw;
  const expanded =
    path === "~"
      ? home
      : path.startsWith("~/") || path.startsWith("~\\")
        ? join(home, path.slice(2))
        : path;
  return resolve(expanded);
}
