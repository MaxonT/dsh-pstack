import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-task",
  capability: "task",
  turns: [
    {
      prompt:
        "把一个独立的小任务交给执行者去做：读取工作区里的 README.md，用一句话概括这个仓库的用途，然后把执行者的结论转述给我。不要自己直接概括。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# 临时工作区\n\n这是一个用来验证任务委派的小仓库，里面只有这一份说明。\n",
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "用户能看到独立执行者实际被启动、完成读取并返回结论，主会话把该结论转述出来。只由主会话自己直接概括、没有真正把任务交给独立执行者时记为缺口；不因缺少某个具体工具名判通过。",
  },
  uiObservations: [
    {
      id: "reply-visible",
      description: "浏览器中能看到对 README 用途的转述，而不是空回复。",
    },
  ],
};

export default scenario;
