import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-role-value",
  capability: "role-value",
  phases: ["adapted"],
  turns: [
    {
      prompt:
        "用“模型加档位”这种角色写法指定一个执行者，比如某个已公布的模型配一个档位，然后告诉我最终实际生效的提供方、模型和档位。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# 角色写法探测\n\n验证“模型加档位”写法被解析并生效。\n",
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "用户能看到会话把“模型加档位”的写法解析成提供方、模型和档位并据此派发，回报与实际一致。无法解析、或忽略其中的档位，记为缺口。",
  },
  uiObservations: [
    {
      id: "reply-visible",
      description: "浏览器中能看到解析结果和实际生效的提供方、模型与档位。",
    },
  ],
};

export default scenario;
