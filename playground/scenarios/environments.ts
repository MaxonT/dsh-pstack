import type { EnvironmentMatrix } from "../types.ts";

/** Capability probes run in base unless a probe explicitly requires a special environment. */
export const environments: readonly EnvironmentMatrix[] = [
  {
    id: "preview",
    description:
      "手动预览专用环境，仅供 playground:open 启动 adapted/preview worker，不参与 probe 选择。",
    kind: "capability",
    enabledPluginPackages: [],
  },
  {
    id: "base",
    description: "默认环境，不加载额外插件，用于观察原生 DSH 能力。",
    kind: "base",
    enabledPluginPackages: [],
  },
  {
    id: "render",
    description:
      "用于验证 mermaid、图表、图片、视频和 UI 渲染能力；显式作为 raw/adapted 的对照环境。",
    kind: "capability",
    enabledPluginPackages: ["@changfenhuang/dsh-genui"],
  },
  {
    id: "agent-team",
    description:
      "Team-on 环境：开启 Agent Teams，验证 pstack 委派、任务板、消息与中断在团队模式下可用。",
    kind: "capability",
    enabledPluginPackages: [],
    teamMode: true,
  },
];
