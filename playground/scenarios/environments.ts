import type { EnvironmentMatrix } from "../types.ts";

/**
 * The official-plugin environments the port is verified against. `prepare` adds
 * `dsh-pstack` to every adapted profile automatically, so `enabledPluginPackages` holds
 * only the extra official packages layered on top of the base bundle.
 *
 * Two environments force-load packages the pinned dsh runtime would otherwise disable.
 * `session-search`'s experimental plugin pins its session-query packages to an older runtime
 * line the pinned dsh rejects, and `agent-team` ships experimental Agent Teams plugins
 * whose peer range omits the runtime. The loader disables those rows unless the exact package is
 * exempted, so `versionExemptions` lists the packages to force-load through
 * `dsh plugin allow-version`.
 *
 * `agent-team` is a neutral plugin scenario. It does not assume a conflict with the pstack
 * root preset; the probe records whatever the session and UI show.
 */
export const environments: readonly EnvironmentMatrix[] = [
  { id: "base", enabledPluginPackages: [] },
  {
    id: "session-search",
    enabledPluginPackages: ["@deepseek-ai/dsh-experimental-session-search"],
    versionExemptions: [
      "@deepseek-ai/dsh-session-query-sqlite",
      "@deepseek-ai/dsh-tool-session-query",
    ],
  },
  { id: "browser-use", enabledPluginPackages: ["@deepseek-ai/dsh-browser-use"] },
  {
    id: "terminal",
    enabledPluginPackages: ["@deepseek-ai/dsh-experimental-terminal-bundle"],
  },
  {
    id: "forge",
    enabledPluginPackages: ["@deepseek-ai/dsh-experimental-forge-bundle"],
  },
  {
    id: "agent-team",
    enabledPluginPackages: ["@deepseek-ai/dsh-experimental-agent-team-profile"],
    versionExemptions: [
      "@deepseek-ai/dsh-experimental-agent-team",
      "@deepseek-ai/dsh-experimental-tool-agent-team",
    ],
  },
];
