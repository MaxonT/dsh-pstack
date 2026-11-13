import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-run-in-background",
  capability: "run-in-background",
  turns: [
    {
      prompt:
        "把一个需要一点时间的独立任务交给执行者，交出去之后不要干等，先告诉我已经派出去了，等它完成再把结果补给我。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# 异步派发探测\n\n验证委派不阻塞主会话。\n",
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "用户能看到会话先把任务交出去并立即回报“已派出、继续处理”，随后在看到完成通知后再补上结果。一直阻塞到任务结束才回复、或根本没有真正派出执行者，记为缺口。",
  },
  uiObservations: [
    {
      id: "reply-visible",
      description: "浏览器中能看到“已派出”的即时回报，随后能看到完成结果。",
    },
  ],
};

export default scenario;
