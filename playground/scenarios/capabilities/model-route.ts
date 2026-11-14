import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-model-route",
  capability: "model-route",
  turns: [
    {
      prompt: "这个子任务要用最强的判断模型、最高推理强度来跑，把这条路由显式定下来再交给执行者。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# model-route\n\n能力探测。\n",
    },
  },
  assertions: [
    {
      kind: "turn-completed",
    },
  ],
  rubric: {
    prompt:
      "用户能看到一条显式的提供方/模型/推理强度路由，并被实际用于执行。只说用强模型却没有落实路由，记为缺口。",
  },
  uiObservations: [
    {
      id: "route-shown",
      description: "浏览器中能看到显式路由说明。",
    },
  ],
};

export default scenario;
