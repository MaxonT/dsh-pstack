/** Format a thrown value as the message shown to callers and the settings page. */

export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
