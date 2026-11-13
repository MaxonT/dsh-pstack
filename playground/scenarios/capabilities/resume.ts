import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-resume",
  capability: "resume",
  turns: [
    {
      prompt: "让一个执行者统计工作区里有多少个 .md 文件，并把这个数字记住。",
    },
    {
      prompt: "让刚才那个执行者再核对一次，并确认还是同一个数字。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# 文档一\n",
      "docs/guide.md": "# 文档二\n",
      "notes/MEMO.md": "# 文档三\n",
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "用户能看到第二次请求延续了同一个执行者（而不是重新起一个全新的），并给出前后一致的统计。若每次都另起全新执行者、没有延续上下文，记为缺口。",
  },
  uiObservations: [
    {
      id: "two-turns-visible",
      description: "浏览器中能看到两轮对话，第二轮明显是对第一轮同一执行者的追问。",
    },
  ],
};

export default scenario;
