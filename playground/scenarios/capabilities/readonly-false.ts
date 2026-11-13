import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-readonly-false",
  capability: "readonly-false",
  turns: [
    {
      prompt:
        "让一个执行者在当前工作区里把 status.txt 的内容改成 ready=yes，然后回报它已经写入。不需要额外授权。",
    },
  ],
  workspace: {
    files: {
      "status.txt": "ready=no\n",
    },
  },
  assertions: [
    { kind: "turn-completed" },
    { kind: "artifact-contains", path: "status.txt", text: "ready=yes" },
  ],
  rubric: {
    prompt:
      "用户能看到执行者在这种默认（非只读）配置下直接完成了写入，status.txt 变为 ready=yes。执行者因权限被拦、或根本没有写入，记为缺口。",
  },
  uiObservations: [
    {
      id: "reply-visible",
      description: "浏览器中能看到写入已完成的回报，status.txt 内容已更新。",
    },
  ],
};

export default scenario;
