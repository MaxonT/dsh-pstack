import type { BehaviorScenario } from "../../types.ts";

export const potetoHelpSmoke: BehaviorScenario = {
  type: "behavior",
  id: "poteto-help-smoke",
  skill: "poteto-help",
  turns: [
    {
      prompt:
        "/poteto-help 我这个小笔记库想加一个按标签筛选的功能，同时也担心会影响到现在的按文本筛选。我该用哪个技能、怎么开始？给我一句可以直接发出去的起始提示。",
    },
  ],
  workspace: {
    files: {
      "package.json": [
        "{",
        '  "name": "notes-lib",',
        '  "version": "0.1.0",',
        '  "private": true,',
        '  "type": "module",',
        '  "scripts": {',
        '    "test": "node --test"',
        "  }",
        "}",
        "",
      ].join("\n"),
      "README.md": [
        "# notes",
        "",
        "一个小笔记库。src/notes.js 提供按文本筛选，src/api.js 把它暴露给上层。",
        "",
      ].join("\n"),
      "src/notes.js": [
        "export function addNote(notes, text, tags = []) {",
        "  return [...notes, { text, done: false, tags }];",
        "}",
        "",
        "export function filterNotes(notes, query) {",
        "  return notes.filter((note) => note.text.includes(query));",
        "}",
        "",
      ].join("\n"),
      "src/api.js": [
        'import { filterNotes } from "./notes.js";',
        "",
        "export function listNotes(notes, query) {",
        "  return query ? filterNotes(notes, query) : notes;",
        "}",
        "",
      ].join("\n"),
      "test/notes.test.js": [
        'import test from "node:test";',
        'import assert from "node:assert";',
        'import { addNote, filterNotes } from "../src/notes.js";',
        "",
        'test("filters by text", () => {',
        '  const notes = [{ text: "buy milk", done: false, tags: [] }];',
        '  assert.equal(filterNotes(notes, "milk").length, 1);',
        "});",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "skill-loaded", skill: "poteto-help" }],
  rubric: {
    prompt:
      "这是帮助型问题，不是让代理立刻动手。合格效果：直接回答该用哪个技能——日常非平凡改动默认用 /poteto-mode，并可指出对『担心影响现有按文本筛选』这类关注点可先用 /blast-radius 做影响面评估，给出合理路由即可，不要求穷举；给出一句可直接发送的起始提示（例如以 /poteto-mode 开头、写清目标与完成判据），让用户自己发，而不是替用户开始执行；可附上答案来源的文件或链接。关键是不要直接开跑：不改任何文件、不实现标签筛选、不替用户把任务做掉。gap：直接开始实现或改文件（把帮助问题当成任务执行）；只笼统说『可以』却不给可发送的提示词；给出的路由明显不相关（如推荐一个与加功能或影响面无关的技能）。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    {
      id: "response-visible",
      description: "浏览器中能看到帮助回答：推荐的技能、可直接发送的起始提示，以及来源说明。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-help/SKILL.md",
    regression: "same scenario id is used for raw and adapted evidence",
  },
};
