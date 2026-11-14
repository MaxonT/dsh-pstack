import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-skill-dependency-loop",
  capability: "skill-dependency.loop",
  turns: [
    {
      prompt:
        "这件事要一直盯着直到完成：每过一会儿回来看一次进展，直到达到我说的完成条件再停。用你能用的定时或后台方式实现这个节奏。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# skill-dependency.loop\n\n能力探测。\n",
    },
  },
  assertions: [
    {
      kind: "turn-completed",
    },
  ],
  rubric: {
    prompt:
      "用户能看到一个持续巡检、直到满足完成条件才停止的节奏；依赖不可用时应说明并给替代。完全没有循环或巡检、只做一次就结束，记为缺口。",
  },
  uiObservations: [
    {
      id: "dependency-visible",
      description: "浏览器中能看到巡检节奏与停止条件的说明。",
    },
  ],
};

export default scenario;
