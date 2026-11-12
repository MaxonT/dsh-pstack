import type { BehaviorScenario } from "../../types.ts";

const reflectWorkspace = {
  files: {
    "WORK_LOG.md": [
      "# 已完成工作记录：给 Notes 服务加上搜索",
      "",
      "- 在 src/search.ts 里实现了按标题和正文搜索。",
      "- 搜索输入防抖一开始用了一个 Set 去重方案，导致第二次输入丢失，后来整段撤销重写。",
      "- 为了把空结果提示居中，手动改了两次 CSS，最后发现应该改父容器的对齐方式。",
      "- 自动化测试只覆盖了标题匹配，正文匹配和空状态都没有测。",
      "- 提交：feat: add search to notes (commit 4f2a9c1)。",
      "",
    ].join("\n"),
    "src/search.ts": [
      "export function searchNotes(notes: { title: string; body: string }[], q: string) {",
      "  const needle = q.trim().toLowerCase();",
      "  if (needle.length === 0) return notes;",
      "  return notes.filter(",
      "    (n) => n.title.toLowerCase().includes(needle) || n.body.toLowerCase().includes(needle),",
      "  );",
      "}",
      "",
    ].join("\n"),
  },
};

export const reflectCompletedSearchWork: BehaviorScenario = {
  type: "behavior",
  id: "reflect-completed-search-work",
  skill: "reflect",
  turns: [
    {
      prompt:
        "/reflect 我们刚给 Notes 服务加完搜索，过程都记在 WORK_LOG.md 里。请回顾这段工作，提炼值得沉淀进技能的经验：哪些采纳、哪些拒绝、哪些先放待办，每条落到具体技能文件的修改上。先别直接改文件，等我确认。",
    },
  ],
  workspace: reflectWorkspace,
  assertions: [{ kind: "turn-completed" }, { kind: "assistant-contains", text: "技能" }],
  rubric: {
    prompt:
      "这是会话反思技能的执行观察。合格效果：把这段已完成工作里值得沉淀的经验分到采纳、拒绝、待办三类；每条采纳项指向一个具体技能文件的修改（给出技能名或路径，以及要新增或修改的内容），而不是泛泛而谈；能区分一次性偶发问题（例如某次具体的去重实现 bug）与可复用的经验，单次偶发不应被放进采纳；在用户确认前不实际修改任何技能文件，只给出分类结论和落点。若无法定位到本次会话的记录，或缺少并行评审子代理，技能可以基于 WORK_LOG.md 的记载、用自身分析完成同样的分类与路由，不据此判 gap。gap：只复述做过什么而没有分类结论；采纳项没有落到具体技能文件；把一次性偶发当经验采纳；或未经确认就改动了技能文件。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    {
      id: "response-visible",
      description: "浏览器中能看到采纳/拒绝/待办分类结论与每条落点的完整回复。",
    },
    { id: "awaiting-approval", description: "回复停在等待确认处，没有直接改动技能文件。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/reflect/SKILL.md",
    regression: "把会话里的学习点分类并路由到具体技能编辑，未经批准不落地",
  },
};
