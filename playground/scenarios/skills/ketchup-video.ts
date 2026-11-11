import type { BehaviorScenario } from "../../types.ts";

export const ketchupVideoRecapSlides: BehaviorScenario = {
  type: "behavior",
  id: "ketchup-video-recap-slides",
  skill: "ketchup-video",
  turns: [
    {
      prompt: "先读一下当前工作区，把这个项目大概做什么、有哪些主要文件，用几句话讲清楚。",
    },
    {
      prompt:
        "现在把从我上一条消息之后发生的事情做成一个很短的视频回顾，用带字幕的画面说清楚；需要我决定的事情用文字列在视频下面。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# notes-app\n\n一个记录待办的小项目。入口在 src/app.js，测试在 test/。\n",
      "package.json": '{\n  "name": "notes-app",\n  "version": "0.1.0",\n  "type": "module"\n}\n',
      "src/app.js":
        "export function addNote(notes, text) {\n  return [...notes, { text, done: false }];\n}\n",
      "test/app.test.js":
        'import test from "node:test";\nimport assert from "node:assert";\nimport { addNote } from "../src/app.js";\n\ntest("adds a note", () => {\n  assert.equal(addNote([], "hi").length, 1);\n});\n',
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "assistant-contains", text: "视频" }],
  rubric: {
    prompt:
      "这是回顾视频类技能（ketchup-video），对话有前置内容。效果成立的标志：回复给出很短的视频回顾，或明确说明当前环境无法产出视频并给出同等的文字或图示摘要与待决事项；画面与字幕只讲用户能感知的变化，视频下方用文字列出需要用户决定的每一项和你的建议；若没有需要用户决定的事就明确说没有。关键判定：如果声称生成了视频或幻灯片却没有任何可核对的产物，记为 gap；视频渲染能力是否缺失由运行证据记录，缺失本身记为环境或能力缺口，不因为写了降级说明就判通过。视频或替代呈现需人工确认是否真的产出、内容是否与事实一致。技能加载是过程证据，不等于效果成立。",
  },
  uiObservations: [
    {
      id: "video-manual-check",
      description:
        "视频或替代呈现需人工确认；若无法产出视频，回复要明确说明原因并给出同等摘要，不假装产出视频。",
    },
    {
      id: "completed-turns",
      description: "两轮对话都自然结束，没有自动点击停止。",
    },
    {
      id: "response-visible",
      description: "浏览器中能看到第二轮针对视频回顾请求的完整回复及其待决事项。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/ketchup-video/SKILL.md",
    regression: "同一 scenario id 用于 raw 与 adapted 证据",
  },
  dependencies: ["ketchup"],
};
