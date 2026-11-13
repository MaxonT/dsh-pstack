import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-cloud-base-branch",
  capability: "cloud-base-branch-b",
  phases: ["adapted"],
  turns: [
    {
      prompt:
        "这次隔离执行需要以 main 分支为基线来做：请在隔离检出里基于 main 开始，做不到就说明原因。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# 基线分支探测\n\n验证隔离执行是否以指定分支为基线。\n",
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "用户能看到会话说明了如何以 main 为基线（例如创建隔离检出时指定该分支），或明确说明当前环境做不到并给出原因。完全忽略分支要求、当作没提过，记为缺口。",
  },
  uiObservations: [
    {
      id: "reply-visible",
      description: "浏览器中能看到对以 main 为基线的处理说明。",
    },
  ],
};

export default scenario;
