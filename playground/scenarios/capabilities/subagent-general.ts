import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-subagent-general",
  capability: "subagent-type-generalpurpose",
  turns: [
    {
      prompt:
        "请让一个通用的辅助执行者在工作区里新建 out/summary.txt，内容写 'done'，然后报告它确实写出了这个文件。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# 子代理写入探测\n\n让通用执行者创建一个产物文件。\n",
    },
  },
  assertions: [
    { kind: "turn-completed" },
    { kind: "artifact-contains", path: "out/summary.txt", text: "done" },
  ],
  rubric: {
    prompt:
      "用户能看到一个通用子执行者被启动，并真的在工作区写出 out/summary.txt。没有启动子执行者、而由主会话直接写文件，记为缺口。",
  },
  uiObservations: [
    {
      id: "reply-visible",
      description: "浏览器中能看到对子执行者完成情况的报告。",
    },
  ],
};

export default scenario;
