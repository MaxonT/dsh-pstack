import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-skill-loading",
  capability: "skill-loading",
  phases: ["adapted"],
  turns: [
    {
      prompt: "用 pstack 的帮助技能告诉我，这个环境里能做哪些事情。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# 帮助探测\n\n向帮助技能询问当前环境能力。\n",
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "skill-loaded", skill: "poteto-help" }],
  rubric: {
    prompt:
      "用户能看到帮助技能被实际加载，并据此给出能力说明。技能没有被加载、或只输出一段泛泛的文本，记为缺口。",
  },
  uiObservations: [
    {
      id: "reply-visible",
      description: "浏览器中能看到基于帮助技能内容的能力说明。",
    },
  ],
};

export default scenario;
