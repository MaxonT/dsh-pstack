import type { BehaviorScenario } from "../../types.ts";

export const pluginScenario: BehaviorScenario = {
  type: "behavior",
  id: "plugin-forge",
  skill: "poteto-mode",
  plugin: "@deepseek-ai/dsh-experimental-forge-bundle",
  environments: ["base", "forge"],
  turns: [
    {
      prompt:
        "/poteto-mode 把这个本地仓库的改动整理成一个 PR：建分支、提交、写清标题和说明，然后告诉我 PR 链接，或者说明为什么现在推不了。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# billing\n\n计费模块。\n",
      "src/total.js":
        "export function total(items) {\n  return items.reduce((s, i) => s + i.price, 0);\n}\n",
      "CHANGES.md": "# 待提交改动\n\n- total 增加空数组返回 0 的处理\n",
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "这是官方 forge/PR 能力的集成观察，同一任务在 base 与启用该能力的插件环境各跑一次。合格效果：在提供 PR/forge 工具的环境里，技能应使用该工具建分支、提交并创建 PR，报告真实的 PR 链接；若远端或凭据不可用，应明确说明阻塞原因而不是假装建好。base 环境没有该能力时，应如实说明并给出等价产物（分支名、提交信息、PR 标题与说明文本）。gap：声称创建了 PR 却拿不出链接或工具调用证据；或把 PR 说明写好后不说明为什么没有真正提交/推送。判断以实际工具调用与产物为准，不预设必须用某个具体 forge。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    {
      id: "pr-visible",
      description: "人工确认是否真的产生 PR 链接或明确的阻塞原因，以及分支与提交信息。",
    },
    { id: "response-visible", description: "浏览器中能看到 base 与插件环境差异的说明。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression: "official plugin matrix：PR/forge 能力在 base 与插件环境的可观察差异",
  },
};
