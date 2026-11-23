/** Root host entry for dsh-pstack. */
/**
 * The package root must be an active Loader entry so the client module registry
 * can discover the `dsh.client` bundle. All host services live in their own
 * subpath entries.
 */
import type { Context } from "@deepseek-ai/cordis";

import { migratePstackHome } from "./compat/migrate-pstack-home.ts";

export const name = "pstack";

export function apply(_ctx: Context): void {
  // The root bundle entry owns the one startup migration pass. Delete this call
  // together with `src/compat/migrate-pstack-home.ts` when the migration window closes.
  migratePstackHome();
}
