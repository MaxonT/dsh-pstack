import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "conflict-agent-team-interrupt-agent-contract",
  capability: "agent-team.interrupt-agent-contract",
  phases: ["adapted"],
  turns: [
    {
      prompt:
        "用 pstack_subagent 派一个执行者，让它分几轮遍历整个仓库，每轮之间等几秒，最多跑 6 轮就自己停。趁它还在跑的时候把它停掉，并告诉我你用的是哪种标识、是否真的停掉了。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# conflict-agent-team-interrupt-agent-contract\n\n能力探测。\n",
      "data/part-00.txt": `${Array.from({ length: 10 }, (_, index) => `line ${index}: 占位内容。`).join("\n")}\n`,
      "data/part-01.txt": `${Array.from({ length: 10 }, (_, index) => `line ${index}: 占位内容。`).join("\n")}\n`,
    },
  },
  assertions: [
    {
      kind: "turn-completed",
    },
  ],
  rubric: {
    prompt:
      "用户能看到那个 pstack 子代理被中断，并得到停点与所用标识。若停不掉、报找不到目标，或只能停 teammate，记为缺口。",
  },
  uiObservations: [
    {
      id: "interrupt-diff",
      description: "浏览器中能看到 interrupt_agent 中断 pstack 子代理的结果与停点。",
    },
  ],
};

export default scenario;
