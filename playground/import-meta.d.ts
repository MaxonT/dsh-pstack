interface ImportMeta {
  glob<T = Record<string, unknown>>(
    pattern: string | string[],
    options?: { eager?: boolean },
  ): Record<string, T>;
}
