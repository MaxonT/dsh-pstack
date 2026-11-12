import { chmodSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

import { PLAYGROUND_DIRECTORY } from "./run-metadata.ts";

const SENSITIVE_DIRECTORIES = [
  "scenarios/skills",
  "scenarios/playbooks",
  "scenarios/official-plugins",
  "scenarios/runtime-tools",
  "reviews",
  "reports",
] as const;

export function hideSensitiveDirectories(): () => void {
  const saved: Array<{ path: string; mode: number }> = [];
  for (const name of SENSITIVE_DIRECTORIES) {
    const path = join(PLAYGROUND_DIRECTORY, name);
    if (!existsSync(path) || !statSync(path).isDirectory()) continue;
    saved.push({ path, mode: statSync(path).mode & 0o777 });
    chmodSync(path, 0o000);
  }
  return () => {
    for (const entry of saved) {
      try {
        chmodSync(entry.path, entry.mode);
      } catch {
        // The directory may have been removed by another process.
      }
    }
  };
}
