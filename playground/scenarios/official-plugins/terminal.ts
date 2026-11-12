import type { BehaviorScenario } from "../../types.ts";

export const pluginScenario: BehaviorScenario = {
  type: "behavior",
  id: "plugin-terminal",
  skill: "poteto-mode",
  plugin: "@deepseek-ai/dsh-experimental-terminal-bundle",
  environments: ["base", "terminal"],
  turns: [
    {
      prompt:
        "/poteto-mode 开一个持久终端，跑一个需要保持状态的交互式命令，然后再从同一个终端继续下一步。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# scratch\n\n一个临时工作区，用来跑交互式命令。\n",
      "counter.txt": "0\n",
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "这是官方插件 terminal 的集成观察，同一任务要在 base 环境与启用该能力的插件环境各跑一次。合格效果：在提供持久终端能力的环境里，技能应使用一个可保持状态的终端会话跑交互式命令，并能从同一个会话继续（比如进入 REPL 后再执行下一条），而不是每次新开一个无状态进程；base 环境没有该能力时，技能应如实说明限制并给出等价的一次性或脚本化做法，不假装用上了持久终端。gap：声称使用了持久会话却拿不出对应的终端工具调用；或在有能力的插件环境里仍退化为无状态的一次性命令且不说明。判断以会话里的实际工具调用为准，不预设插件必须用某个具体工具名。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    {
      id: "terminal-tool-visible",
      description: "人工确认会话工具调用里是否出现可保持状态的终端会话，以及是否在同一会话继续。",
    },
    { id: "response-visible", description: "浏览器中能看到对 base 与插件环境差异的说明。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression: "official plugin matrix：持久终端能力在 base 与插件环境的可观察差异",
  },
};
