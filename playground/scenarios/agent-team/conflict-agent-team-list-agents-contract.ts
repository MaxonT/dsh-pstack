import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "conflict-agent-team-list-agents-contract",
  capability: "agent-team.list-agents-contract",
  phases: ["adapted"],
  turns: [
    {
      prompt:
        "用 pstack_subagent 起一个子代理读一下 src 目录。然后查看你派出的这个 pstack 子代理，把它的 id 和当前状态报给我，并说明你用的是哪个工具。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# conflict-agent-team-list-agents-contract\n\n能力探测。\n",
      "src/a.ts": "export const a = 1;\n",
      "src/b.ts": "export const b = 2;\n",
    },
  },
  assertions: [
    {
      kind: "turn-completed",
    },
  ],
  rubric: {
    prompt:
      "用户能看到那个 pstack 子代理的 id 和当前状态，并知道模型用了哪个工具。若查不到、只看得到 teammate、或模型回避这一步，记为缺口。",
  },
  uiObservations: [
    {
      id: "list-agents-diff",
      description: "浏览器中能看到 list_agents 的返回内容与 pstack 子代理是否在列。",
    },
  ],
};

export default scenario;
