import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-poteto-agent",
  capability: "poteto-agent-comment-sicko",
  phases: ["adapted"],
  turns: [
    {
      prompt:
        "用一个 pstack 的实现型子代理完成一项改动：在工作区新建 notes.md，写一行标题 '# 记录'，然后让它报告完成。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# 实现型子代理探测\n\n让实现型子代理写一个记录文件。\n",
    },
  },
  assertions: [
    { kind: "turn-completed" },
    { kind: "artifact-contains", path: "notes.md", text: "# 记录" },
  ],
  rubric: {
    prompt:
      "用户能看到 pstack 的实现型子代理被实际启动并完成写入 notes.md。没有用到该人格代理、或写入缺失，记为缺口。",
  },
  uiObservations: [
    {
      id: "reply-visible",
      description: "浏览器中能看到实现型子代理完成后的报告。",
    },
  ],
};

export default scenario;
