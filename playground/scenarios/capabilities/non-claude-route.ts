import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-non-claude-route",
  capability: "a-grok-gpt-or-other-non-claude-slug",
  phases: ["adapted"],
  turns: [
    {
      prompt:
        "用一个非 Claude 系的模型路由派一个执行者做一件小事，并告诉我它最终用的是哪个提供方、模型和档位。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# 非 Claude 路由探测\n\n验证非 Claude 系的模型选择与回退。\n",
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "用户能看到会话选择了一个已公布的非 Claude 系路由，或说明就近回退到某条可用路由，并回报实际使用的提供方、模型和档位。编造一条不存在的路由，记为缺口。",
  },
  uiObservations: [
    {
      id: "reply-visible",
      description: "浏览器中能看到所选非 Claude 系路由及实际所用档位。",
    },
  ],
};

export default scenario;
