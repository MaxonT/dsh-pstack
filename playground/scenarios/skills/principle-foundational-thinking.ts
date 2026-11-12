import type { BehaviorScenario } from "../../types.ts";

export const foundationalThinkingApply: BehaviorScenario = {
  type: "behavior",
  id: "principle-foundational-thinking-apply",
  skill: "principle-foundational-thinking",
  turns: [
    {
      prompt:
        "消息列表现在要给会话加“未读数”和“置顶”，以后还想加“免打扰”和“草稿”。现在代码是一个会话一个对象、外加一堆零散 boolean 和几个数组拼出来的。先别写实现，帮我理一下核心数据结构和状态该怎么组织。",
    },
  ],
  workspace: {
    files: {
      "src/inbox.js": [
        "const state = {",
        "  conversations: [],",
        "  unreadA1: 0,",
        "  isPinnedA1: false,",
        "  unreadB2: 0,",
        "  isPinnedB2: false,",
        "  drafts: [],",
        "  muted: [],",
        "};",
        "",
        "export function bumpUnread(id) {",
        '  if (id === "A1") state.unreadA1 += 1;',
        '  else if (id === "B2") state.unreadB2 += 1;',
        "}",
        "",
        "export function togglePin(id) {",
        '  if (id === "A1") state.isPinnedA1 = !state.isPinnedA1;',
        '  else if (id === "B2") state.isPinnedB2 = !state.isPinnedB2;',
        "}",
        "",
      ].join("\n"),
      "README.md":
        "# inbox\n\n会话列表。当前把每个会话的未读数、置顶状态拆成零散字段，新增会话要同时加多个字段。\n",
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "回答应先定核心资料结构与状态模型，而不是直接写功能：把会话表示成一个有明确字段的记录（含未读数、置顶、免打扰、草稿等状态），用集合/映射按会话持有，消除每个会话一对散落 boolean 的形状；说明主要访问路径（列表渲染、按未读排序、置顶置前）如何落到这个结构上，并指出先落地类型/结构、再逐步加功能的顺序。gap：直接给实现；只列待办步骤而没有数据结构；继续沿用零散字段再加更多 boolean。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    {
      id: "response-visible",
      description: "浏览器中能看到核心数据结构与状态组织方案，而非实现代码。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-foundational-thinking/SKILL.md",
    regression: "该原则在 DSH 会话中仍被应用：先定数据结构与状态模型，再谈实现",
  },
};
