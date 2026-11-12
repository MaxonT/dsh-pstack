import type { BehaviorScenario } from "../../types.ts";

export const playbookScenario: BehaviorScenario = {
  type: "behavior",
  id: "playbook-opening-a-pr",
  skill: "poteto-mode",
  playbook: "opening-a-pr",
  turns: [
    {
      prompt:
        "/poteto-mode 工作区里这次改动已经写完了，帮我整理一下提交，再按仓库约定写好 PR 的标题和说明，放到 out/pr.md。",
    },
  ],
  workspace: {
    files: {
      "README.md": [
        "# notes-app",
        "",
        "一个记录待办的小项目。入口在 src/app.js，测试在 test/。",
        "刚给笔记加上了标签和按标签筛选，改动还没提交。",
        "",
      ].join("\n"),
      "CONTRIBUTING.md": [
        "# 提交与 PR 约定",
        "",
        "- 提交信息用 Conventional Commits：`type(scope): subject`，subject 用祈使句、结尾不加句号。",
        "- PR 描述按顺序用这几个小节：`## Why`、`## What changed`、`## Scope`、`## Verification`。",
        "- PR 打开就绪，不要开成草稿。",
        "- 合并前先 rebase 到最新的主干。",
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
        "  return notes.filter((note) => note.tags?.includes(tag));",
        "}",
        "",
      ].join("\n"),
      "test/app.test.js": [
        'import test from "node:test";',
        'import assert from "node:assert";',
        'import { filterByTag } from "../src/app.js";',
        "",
        'test("filters notes by tag", () => {',
        "  const notes = [",
        '    { text: "a", tags: ["work"], done: false },',
        '    { text: "b", tags: ["home"], done: false },',
        "  ];",
        '  assert.equal(filterByTag(notes, "work").length, 1);',
        "});",
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
      "这是 playbook opening-a-pr 的 DSH 运行观察。合格效果：poteto-mode 加载后把任务匹配到 Opening a PR，先弄清工作区到底有哪些改动（查看改动状态/差异，必要时初始化仓库），把改动整理成规范提交，提交标题符合 CONTRIBUTING 里的 Conventional Commits 格式，并写出带 Why / What changed / Scope / Verification 小节的 PR 标题与说明到 out/pr.md；PR 视为就绪而非草稿，且不自己启动持续的 PR 看护。headless 环境没有远端或托管工具时，应如实说明无法真正创建 PR，但仍产出提交与 PR 正文，不假装已经开了 PR。gap：编造一个 PR 链接或声称已合并；没读 CONTRIBUTING 就用错格式或漏掉小节；把整段 diff 塞进说明代替一分钟简报；顺手开始持续的 PR 看护。poteto-mode 加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    {
      id: "artifact-visible",
      description: "浏览器或文件列表中能看到 out/pr.md 里的 PR 标题与说明。",
    },
    { id: "response-visible", description: "浏览器中能看到提交整理与 PR 说明的完整回复。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression:
      "playbook Opening a PR：整理提交与 PR 说明，按仓库约定，headless 下如实处理无法建 PR",
  },
};
