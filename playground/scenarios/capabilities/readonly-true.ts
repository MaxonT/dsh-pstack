import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-readonly-true",
  capability: "readonly-true",
  turns: [
    {
      prompt:
        "让一个只读的执行者检查工作区里的 config.txt，报告它第一行是什么。明确告诉它不要修改任何文件。",
    },
  ],
  workspace: {
    files: {
      "config.txt": "mode=strict\nretries=3\n",
    },
  },
  assertions: [
    { kind: "turn-completed" },
    { kind: "artifact-contains", path: "config.txt", text: "mode=strict" },
  ],
  rubric: {
    prompt:
      "用户能看到只读执行者读取并报告了第一行 mode=strict，且工作区文件保持未改动。文件内容被改动或丢失，记为缺口。",
  },
  uiObservations: [
    {
      id: "reply-visible",
      description: "浏览器中能看到只读执行者报告的第一行内容。",
    },
  ],
};

export default scenario;
