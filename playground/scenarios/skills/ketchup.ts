import type { BehaviorScenario } from "../../types.ts";

const recapWorkspace = {
  files: {
    "README.md": "# notes-app\n\n一个记录待办的小项目。入口在 src/app.js，测试在 test/。\n",
    "package.json":
      '{\n  "name": "notes-app",\n  "version": "0.1.0",\n  "type": "module",\n  "scripts": {\n    "test": "node --test"\n  }\n}\n',
    "src/app.js":
      "export function addNote(notes, text) {\n  return [...notes, { text, done: false }];\n}\n",
    "test/app.test.js":
      'import test from "node:test";\nimport assert from "node:assert";\nimport { addNote } from "../src/app.js";\n\ntest("adds a note", () => {\n  assert.equal(addNote([], "hi").length, 1);\n});\n',
  },
};

export const ketchupRecapActionItems: BehaviorScenario = {
  type: "behavior",
  id: "ketchup-recap-action-items",
  skill: "ketchup",
  turns: [
    { prompt: "快速给 src/app.js 加一个 count(notes) 函数，返回笔记数量，并补一个测试。" },
    {
      prompt:
        "/ketchup 我离开了一会儿，帮我看看从我上一条消息之后发生了什么，用简单的话和一张小图说清楚，还有哪些需要我决定的事。",
    },
  ],
  workspace: recapWorkspace,
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "ketchup 的效果成立的标志：开头一句话先说明有没有事情等待用户决定；然后用简单的话总结用户上一条消息之后发生了什么（说清对用户的影响，而不是堆哈希、路径、命令），并配至少一张小可视化（例如说明改动或前后对比的 Mermaid 图或图片；Markdown 表格不算可视化）；最后列出需要用户决定的事项，每项给出你的选择，没有就说没有，不得编造待决事项。gap：把技术细节或命令原样倒出来；该配图时没有可读的视觉；编造不存在的待决事项；把仍在等待用户的事写成已完成。若环境缺少图片生成能力，用 Mermaid 图代替也算成立；说明限制即可，不据此判 gap。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "两轮对话都自然结束，没有自动点击停止。" },
    { id: "response-visible", description: "浏览器中能看到总结、可视化与待决事项的完整回复。" },
    {
      id: "visual-present",
      description: "人工确认回复里确有可读的小可视化（Mermaid 图或图片），且与事实一致。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/ketchup/SKILL.md",
    regression: "主路径：文字总结 + 小可视化 + 待决事项",
  },
};

export const ketchupRecapVisual: BehaviorScenario = {
  type: "behavior",
  id: "ketchup-recap-visual",
  skill: "ketchup",
  turns: [
    { prompt: "快速给 src/app.js 加一个 count(notes) 函数，返回笔记数量，并补一个测试。" },
    {
      prompt:
        "/ketchup 用一张图把从我上一条消息之后发生的变化讲清楚，图下面配简短文字，并把需要我决定的事列出来。",
    },
  ],
  workspace: recapWorkspace,
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "用户明确要一张图。回复必须包含至少一个可读的可视化来呈现变化（Mermaid 图或图片都可，但不能只有 Markdown 表格或纯文字），图下用简短文字总结发生了什么，并列出需要用户决定的事项。gap：没有任何可读可视化；用表格冒充可视化；图与事实不符；编造待决事项。环境缺少图片生成能力时用 Mermaid 图代替算成立，说明限制即可。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "两轮对话都自然结束，没有自动点击停止。" },
    { id: "response-visible", description: "浏览器中能看到图、图下文字与待决事项。" },
    { id: "visual-present", description: "人工确认图可读且如实反映变化。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/ketchup/SKILL.md",
    regression: "显式可视化分支：用户明确要求一张图",
  },
};
