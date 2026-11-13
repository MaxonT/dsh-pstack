import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-model-route",
  capability: "claude-family-version-effort-fast-such-as-claude-opus-5-5-xhigh",
  phases: ["adapted"],
  turns: [
    {
      prompt:
        "先查一下当前有哪些可用的模型和推理档位，再用其中一个可用模型派一个执行者做一件小事，并告诉我它实际用的模型和档位。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# 模型路由探测\n\n先列可用模型，再据此派发执行者。\n",
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "用户能看到会话先列出可用模型与档位，再据此派出子执行者，并回报实际使用的 provider、模型与档位。无法列出模型、或凭空编造一个档位，记为缺口。",
  },
  uiObservations: [
    {
      id: "reply-visible",
      description: "浏览器中能看到可用模型列表和对实际所用路由的说明。",
    },
  ],
};

export default scenario;
