import type { BehaviorScenario } from "../../types.ts";

export const playbookScenario: BehaviorScenario = {
  type: "behavior",
  id: "playbook-feature",
  skill: "poteto-mode",
  playbook: "feature",
  turns: [
    {
      prompt:
        "/poteto-mode 给这个笔记应用加一个按标签筛选的功能，先讲清数据形状和最小改动，再实现并验证。",
    },
  ],
  workspace: {
    files: {
      "README.md": [
        "# notes-app",
        "",
        "一个记录待办的小项目。入口在 src/app.js，测试在 test/。",
        "笔记目前只有 text 和 done 两个字段。",
        "",
      ].join("\n"),
      "package.json":
        '{\n  "name": "notes-app",\n  "version": "0.1.0",\n  "type": "module",\n  "scripts": {\n    "test": "node --test"\n  }\n}\n',
      "src/app.js": [
        "export function addNote(notes, text) {",
        "  return [...notes, { text, done: false }];",
        "}",
        "",
        "export function filterNotes(notes, query) {",
        "  return notes.filter((note) => note.text.includes(query));",
        "}",
        "",
      ].join("\n"),
      "test/app.test.js": [
        'import test from "node:test";',
        'import assert from "node:assert";',
        'import { addNote, filterNotes } from "../src/app.js";',
        "",
        'test("adds a note", () => {',
        '  assert.equal(addNote([], "hi").length, 1);',
        "});",
        "",
        'test("filters by text", () => {',
        '  const notes = [{ text: "buy milk", done: false }];',
        '  assert.equal(filterNotes(notes, "milk").length, 1);',
        "});",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "skill-loaded", skill: "poteto-mode" }],
  rubric: {
    prompt:
      "这是 playbook feature 的 DSH 运行观察。合格效果：poteto-mode 加载后把任务匹配到 Feature，并按其步骤推进——先用 how/architect 把要改的子系统与设计讲清楚，写出被命名的数据形状（给笔记加标签后的结构、按标签筛选的输入输出）和最小改动，再实现，并在真实测试或等价运行时上验证；子代理或运行工具不可用时如实说明并给出可复现的验证方式，而不是跳过验证直接宣布完成。gap：没匹配到 Feature 就直接写代码；没有命名数据形状就动手；只给计划不落地且无说明；声称验证通过却拿不出测试或运行证据。poteto-mode 加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    {
      id: "response-visible",
      description: "浏览器中能看到数据形状说明、改动与验证结果的完整回复。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression: "playbook Feature：数据形状先行、最小改动、实现后验证",
  },
};
