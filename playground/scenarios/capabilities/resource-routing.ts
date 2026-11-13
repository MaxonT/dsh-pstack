import type { BehaviorScenario } from "../../types.ts";

export const capabilityResourceRouting: BehaviorScenario = {
  type: "behavior",
  id: "capability-resource-routing",
  skill: "poteto-mode",
  turns: [
    {
      prompt:
        "把这项调查交给一个独立执行者完成。先说明当前有哪些可用模型、角色和执行方式，再选择一种方式派发，并告诉我子任务实际用什么模型和推理强度。若当前环境没有对应能力，请直接说明缺什么以及你实际能做什么。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# capability probe\n\n临时调查工作区。\n",
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "这是能力探测，不是具体技能效果验收。观察会话是否暴露了模型发现、角色清单、角色路由、子代理派发和模型/effort 选择能力；记录实际工具、参数、错误和输出。不得因为没有某个工具名或某个具体实现而直接判通过；能力缺失、部分支持、环境限制和未知都要如实记录，结论用于下一阶段整理 dsh.md 和插件工具。",
  },
  uiObservations: [
    {
      id: "response-visible",
      description: "浏览器中能看到对可用模型、角色、派发方式和实际路由的说明。",
    },
    {
      id: "result-visible",
      description: "若有子代理，浏览器中能看到其完成结果或明确的不可用说明。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression: "能力探针：模型发现、角色清单/路由、子代理派发和模型 effort 观察",
  },
};
