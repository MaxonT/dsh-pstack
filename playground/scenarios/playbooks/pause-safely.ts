import type { BehaviorScenario } from "../../types.ts";

export const playbookScenario: BehaviorScenario = {
  type: "behavior",
  id: "playbook-pause-safely",
  skill: "poteto-mode",
  playbook: "pause-safely",
  turns: [
    {
      prompt:
        "/poteto-mode 我得先离开一阵，帮我把现在的工作安全停下来，留一个我回来能直接接着做的断点。断点记录写到 out/ 下。",
    },
  ],
  workspace: {
    files: {
      "README.md": [
        "# notes-app",
        "",
        "一个记录待办的小项目。",
        "正在加“按标签筛选”，代码还没写完，测试也没跑通。",
        "",
      ].join("\n"),
      "package.json": [
        "{",
        '  "name": "notes-app",',
        '  "version": "0.1.0",',
        '  "type": "module",',
        '  "scripts": {',
        '    "test": "node --test"',
        "  }",
        "}",
        "",
      ].join("\n"),
      "src/app.js": [
        "export function addNote(notes, text, tags = []) {",
        "  return [...notes, { text, tags, done: false }];",
        "}",
        "",
        "export function filterByTag(notes, tag) {",
        "  // 还没实现，先原样返回",
        "  return notes;",
        "}",
        "",
      ].join("\n"),
      "test/app.test.js": [
        'import test from "node:test";',
        'import assert from "node:assert";',
        'import { filterByTag } from "../src/app.js";',
        "",
        'test("filters notes by tag", () => {',
        '  const notes = [{ text: "a", tags: ["work"], done: false }];',
        '  assert.equal(filterByTag(notes, "work").length, 1);',
        "});",
        "",
      ].join("\n"),
      "progress.md": [
        "# 进度",
        "",
        "- 已给笔记加上 tags 字段，addNote 已更新。",
        "- filterByTag 还没写，只是占位。",
        "- 测试 filterByTag 还没跑通。",
        "- 下一步：实现 filterByTag，再补 home/work 两个用例。",
        "",
      ].join("\n"),
    },
  },
  assertions: [
    { kind: "turn-completed" },
    { kind: "skill-loaded", skill: "poteto-mode" },
    { kind: "artifact-dir-nonempty", path: "out" },
  ],
  rubric: {
    prompt:
      "这是 playbook pause-safely 的 DSH 运行观察。合格效果：poteto-mode 加载后把任务匹配到 Pause safely，在一个安全边界停下，不再开新工作、不启动新的 PR 或推送这类不可逆动作，先把当前未完成改动落盘（能提交就以一条清楚的 wip 提交保存；版本控制不可用时用别的方式保住文件并说明树是否干净），再把断点记录写到 out/ 下，记录意图、正在做什么、已完成与已验证部分、当前状态、下一步、关键文件和坑。gap：继续往下开发新东西；把未提交的改动弄丢；只留一句空泛的“已暂停”而没有可续做的下一步；声称提交了却没有任何记录。poteto-mode 加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    { id: "artifact-visible", description: "浏览器或文件列表中能看到 out/ 下的断点记录文件。" },
    { id: "response-visible", description: "浏览器中能看到当前进度、落盘情况与恢复第一步的说明。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression: "playbook Pause safely：安全停下、落盘未完成改动、写出可续做的断点记录",
  },
};
