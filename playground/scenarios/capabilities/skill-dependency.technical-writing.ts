import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-skill-dependency-technical-writing",
  capability: "skill-dependency.technical-writing",
  turns: [
    {
      prompt:
        "给这个仓库写一个 README 的『快速开始』小节，要有清晰的分层和可执行的步骤。按技术写作的标准来写。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# skill-dependency.technical-writing\n\n能力探测。\n",
    },
  },
  assertions: [
    {
      kind: "turn-completed",
    },
  ],
  rubric: {
    prompt: "用户能看到一份结构清晰、步骤可执行的文档小节。没有结构、泛泛而谈，记为缺口。",
  },
  uiObservations: [
    {
      id: "dependency-visible",
      description: "浏览器中能看到写好的文档小节。",
    },
  ],
};

export default scenario;
