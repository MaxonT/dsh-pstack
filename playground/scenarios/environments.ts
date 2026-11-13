import type { EnvironmentMatrix } from "../types.ts";

/**
 * Environment matrix for capability probes. `prepare` adds the port package to every
 * adapted profile; this list only holds additional packages layered on top of the base bundle.
 *
 * `versionExemptions` force-loads packages whose peer range does not match the pinned
 * runtime. It is configuration for the probe environment, not a capability declaration.
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
