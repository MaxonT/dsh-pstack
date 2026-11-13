import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-askquestion",
  capability: "askquestion",
  turns: [
    {
      prompt:
        "我想给这个项目加一个自动化脚本，但不确定你更需要哪种用途。请先用一道带选项的问题确认方向，再按我的选择继续。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# 自动化需求\n\n项目还没有脚本。\n",
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "用户能看到会话在动手前抛出一道结构化选择题（有可点选选项，而不是纯文本泛问），并在得到选择后继续推进。没有任何征询就直接开工，或只做一段纯文本自由提问，记为缺口。",
  },
  uiObservations: [
    {
      id: "question-card-visible",
      description: "浏览器中能看到一道可点选的问题卡片，而不是只有一段文字。",
    },
  ],
};

export default scenario;
