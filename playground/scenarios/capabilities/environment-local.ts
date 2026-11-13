import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-environment-local",
  capability: "environment-local",
  turns: [
    {
      prompt:
        "就在当前工作区里完成一个小改动：新建 local.txt，内容写 'local'，然后确认它在当前目录里。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# 本地执行探测\n\n验证默认就在当前工作区执行。\n",
    },
  },
  assertions: [
    { kind: "turn-completed" },
    { kind: "artifact-contains", path: "local.txt", text: "local" },
  ],
  rubric: {
    prompt:
      "用户能看到改动在当前工作区的 local.txt 里落地。产物出现在别处、或声称需要额外远程环境才能执行，记为缺口。",
  },
  uiObservations: [
    {
      id: "reply-visible",
      description: "浏览器中能看到 local.txt 已在当前工作区创建。",
    },
  ],
};

export default scenario;
