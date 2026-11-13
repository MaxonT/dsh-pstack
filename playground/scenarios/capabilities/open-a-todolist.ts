import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-open-a-todolist",
  capability: "open-a-todolist",
  turns: [
    {
      prompt:
        "把这个仓库整理成三份文档：docs/intro.md、docs/usage.md 和 docs/faq.md，每份写一段话。开工前列出你打算怎么做，并在推进过程中更新每一步的状态。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# 待整理\n\n需要补三份文档。\n",
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "artifact-dir-nonempty", path: "docs" }],
  rubric: {
    prompt:
      "用户能看到开工前出现一份步骤清单，并在推进过程中更新状态（例如某步进行中、已完成），最终三份文档存在。没有任何清单、或清单从头到尾不更新，记为缺口；不要求某一种具体清单样式。",
  },
  uiObservations: [
    {
      id: "todo-visible",
      description: "浏览器中能看到一份带状态的步骤清单，而不是纯文字描述计划。",
    },
  ],
};

export default scenario;
