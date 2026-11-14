import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-askquestion",
  capability: "askquestion",
  turns: [
    {
      prompt:
        "开始干活前，先问我一个确认问题：这次只做功能，还是连测试一起做？我选好后你就按我的选择继续。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# askquestion\n\n能力探测。\n",
    },
  },
  assertions: [
    {
      kind: "turn-completed",
    },
  ],
  rubric: {
    prompt:
      "用户能看到一个可选择的确认问题，并且会话在拿到选择后继续。合格：问题以选择卡片呈现且选择被采纳；不合格：不提问就直接猜，或只问却不用答案。",
  },
  uiObservations: [
    {
      id: "question-card",
      description: "浏览器中出现可选择的问题卡片，选择后问题关闭。",
    },
  ],
  answers: [
    {
      match: "测试",
      selected: ["连测试一起做"],
    },
  ],
};

export default scenario;
