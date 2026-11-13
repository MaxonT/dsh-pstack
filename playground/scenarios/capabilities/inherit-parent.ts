import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-inherit-parent",
  capability: "auto-or-inherit-parent",
  phases: ["adapted"],
  turns: [
    {
      prompt:
        "当一个角色没有单独配置模型时，派一个执行者做一件小事，并说明它最终用的是哪条模型路由。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# 继承路由探测\n\n验证未配置角色沿用父级或默认路由。\n",
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "用户能看到未配置角色被派发时沿用了父级或默认模型路由，并被明确说明。声称使用了不存在或未确认的路由，记为缺口。",
  },
  uiObservations: [
    {
      id: "reply-visible",
      description: "浏览器中能看到对实际沿用路由的说明。",
    },
  ],
};

export default scenario;
