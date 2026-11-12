import type { BehaviorScenario } from "../../types.ts";

export const pluginScenario: BehaviorScenario = {
  type: "behavior",
  id: "plugin-agent-team",
  skill: "poteto-mode",
  plugin: "@deepseek-ai/dsh-experimental-agent-team-profile",
  environments: ["base", "agent-team"],
  turns: [
    {
      prompt:
        "/poteto-mode 这三个互不相关的小任务，帮我并行分给多个工作单元一起推进，最后汇总，注意别让它们改到同一个文件。",
    },
  ],
  workspace: {
    files: {
      "task-a.md": "# 任务 A\n\n把 src/a.js 里的 add 改成支持负数。\n",
      "task-b.md": "# 任务 B\n\n给 src/b.js 的 format 增加千分位。\n",
      "task-c.md": "# 任务 C\n\n在 src/c.js 里补一个 clamp 函数。\n",
      "src/a.js": "export function add(x, y) {\n  return x + y;\n}\n",
      "src/b.js": "export function format(n) {\n  return String(n);\n}\n",
      "src/c.js":
        "export function clamp(n, lo, hi) {\n  return Math.min(Math.max(n, lo), hi);\n}\n",
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "这是官方 agent-team 能力的集成观察，同一任务在 base 与启用该能力的插件环境各跑一次。合格效果：在提供多代理/团队能力的环境里，技能应把三个任务分给各自独立的工作单元并行推进（各自负责自己的文件，互不重叠），最后汇总成一份结果；base 环境没有该能力时，技能应如实说明并给出串行或等价推进方式。gap：声称并行分工却实际串行且不说明；多个工作单元改同一个文件造成冲突；或声称完成却拿不出对应的工作单元/工具调用证据。判断以会话里的实际工具调用与文件改动为准，不预设必须用某个具体工具名。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    {
      id: "agents-visible",
      description:
        "人工确认会话里是否真的出现多个独立工作单元并行推进，以及各自改的文件是否不重叠。",
    },
    { id: "response-visible", description: "浏览器中能看到 base 与插件环境差异的说明与汇总结果。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression: "official plugin matrix：多代理/团队能力在 base 与插件环境的可观察差异",
  },
};
