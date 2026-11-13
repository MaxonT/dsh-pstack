import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-project-agents-md",
  capability: "cursor-rules-mdc-always-applied-rules",
  turns: [
    {
      prompt:
        "按这个工作区里 AGENTS.md 的项目约定执行：把项目名写成 bluebird，并在回复里确认你遵循了项目约定。",
    },
  ],
  workspace: {
    files: {
      "AGENTS.md": "# 项目约定\n\n项目名固定为 bluebird，回复时必须使用这个名字。\n",
      "README.md": "# 项目\n\n一份待命名的项目说明。\n",
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "assistant-contains", text: "bluebird" }],
  rubric: {
    prompt:
      "用户能看到会话读取并遵循了工作区 AGENTS.md 的约定，回复里使用了项目名 bluebird。完全没有读到项目约定、或无视它改用别的名字，记为缺口。",
  },
  uiObservations: [
    {
      id: "reply-visible",
      description: "浏览器中能看到确认遵循项目约定并使用 bluebird 的回复。",
    },
  ],
};

export default scenario;
