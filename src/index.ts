/** Root host entry for dsh-pstack. */
/**
 * The package root must be an active Loader entry so the client module registry
 * can discover the `dsh.client` bundle. All host services live in their own
 * subpath entries.
 */
import type { Context } from "@deepseek-ai/cordis";

export const name = "pstack";

export function apply(_ctx: Context): void {}
