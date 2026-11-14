import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-stop-subagent",
  capability: "stop-subagent",
  turns: [
    {
      prompt:
        "让一个执行者去做一件会跑很久的事（遍历整个仓库并逐行总结）。一旦你发现它开始漫无目的地跑，就把这次执行叫停，然后告诉我停在哪里、接下来怎么走。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# stop-subagent\n\n能力探测。\n",
    },
  },
  assertions: [
    {
      kind: "turn-completed",
    },
  ],
  rubric: {
    prompt:
      "用户能看到中途叫停某个执行者，并得到停点说明与后续计划。明明失控却一直干等、或没有叫停动作，记为缺口。",
  },
  uiObservations: [
    {
      id: "stop-report",
      description: "浏览器中能看到叫停说明与后续计划。",
    },
  ],
};

export default scenario;
