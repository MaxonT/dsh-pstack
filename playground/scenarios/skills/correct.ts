import type { BehaviorScenario } from "../../types.ts";

const correctWorkspace = {
  files: {
    "AGENTS.md": [
      "# Agent instructions",
      "",
      "## Rules",
      "",
      "| Rule | Enforced by |",
      "| ---- | ----------- |",
      "| (none yet) | |",
      "",
    ].join("\n"),
    "history.md": [
      "# Correction history",
      "",
      "- 2026-10-02: Operator corrected an agent for using console.log in shipped code and told it to use the shared logger.",
      "- 2026-10-19: Operator corrected another agent for the same console.log mistake in a different file, again asking for the logger. The instruction existed once but nothing enforced it.",
      "- A no-console lint rule was discussed but never added.",
      "",
    ].join("\n"),
    "src/format.ts": [
      "export function formatAmount(cents) {",
      '  console.log("formatting amount", cents);',
      "  return (cents / 100).toFixed(2);",
      "}",
      "",
    ].join("\n"),
    "src/report.ts": [
      'import { formatAmount } from "./format.js";',
      "",
      "export function reportLine(cents) {",
      '  console.log("building report line");',
      '  return "total: " + formatAmount(cents);',
      "}",
      "",
    ].join("\n"),
  },
};

export const correct: BehaviorScenario = {
  type: "behavior",
  id: "correct-console-log-repeat",
  skill: "correct",
  turns: [
    {
      prompt:
        "/correct 这个仓库里的 agent 老是重复同一个错误，每次都改完下次又犯，历史记录在 history.md 里。帮我从根上解决，让以后不会再犯，并说清你用什么机制挡住它、为什么这个办法可靠。",
    },
  ],
  workspace: correctWorkspace,
  assertions: [
    { kind: "turn-completed" },
    { kind: "artifact-contains", path: "AGENTS.md", text: "logger" },
  ],
  rubric: {
    prompt:
      "目标是把反复出现的同类纠错变成让下一个 agent 犯不了的机制。合格结果：从 history.md 归纳出错误类（在发布代码里直接向控制台输出、应改用仓库的共享日志器，已重复两次），并在最高可行层级修复：先考虑用架构或类型让坏写法无法成立，行不通则加一条错误信息点名替代写法（改用共享日志器）的 lint 或 CI 检查，最次才是只写文档规则；把『规则 + 由什么执行』配对写进 AGENTS.md 的规则表，并说明所选层级以及为什么更高层级不可行。同时应处理仓库里已存在的同类实例。若环境没有可执行的检查器，应说明并给出可复现命令，不据此判 gap。只加载技能、或只在回复里再叮嘱一遍『不要用 console.log』而没有可观察的执行机制或规则配对，不算效果成立。gap：AGENTS.md 没有规则与执行机制的配对；只写文档规则而无任何更高层尝试；或没有覆盖到仓库里已存在的同类实例。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    { id: "response-visible", description: "浏览器中能看到错误类、所选层级与执行机制的完整回复。" },
    {
      id: "rule-table-visible",
      description: "工作区能看到 AGENTS.md 规则表新增了『用共享日志器、由某个检查执行』这类配对。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/correct/SKILL.md",
    regression: "重复纠错升为规则加执行机制的配对并说明层级；只重复叮嘱而无执行机制即回归",
  },
};
