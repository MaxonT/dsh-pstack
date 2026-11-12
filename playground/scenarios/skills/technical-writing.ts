import type { BehaviorScenario } from "../../types.ts";

export const technicalWriting: BehaviorScenario = {
  type: "behavior",
  id: "technical-writing-budget-doc",
  skill: "technical-writing",
  turns: [
    {
      prompt:
        "docs/proto-budget.md 这份文档又乱又长，读起来很累。帮我按好的技术文档标准重写它，技术命名和数字都不要改。",
    },
  ],
  workspace: {
    files: {
      "docs/proto-budget.md": `# Proto Import Budget Configuration And Usage Guide

The purpose of this document is to facilitate the configuration of the proto import budget script parameters, which is performed via budget.json. It is important to note that budget.mjs works by counting the files that import protos, and if the count exceeds the budget then CI will fail. In order to lower the budget you should run budget.mjs with the --write flag, which updates the committed budget to reflect the current count: this should only be done when lowering it.

## Getting Started

First we need to understand that the whole thing is basically just a number that lives in budget.json, and the number is 42 by default, and so when the count goes above 42 the build fails, and you can see this in the CI logs that are produced by the pipeline when it runs.

## Reference Options

--write : writes the committed budget.
--check : checks the current count against the budget.
`,
    },
  },
  assertions: [
    { kind: "turn-completed" },
    { kind: "artifact-contains", path: "docs/proto-budget.md", text: "budget.mjs" },
  ],
  rubric: {
    prompt:
      "这是观察 technical-writing 是否把一份模式混乱的文档重写成干净、单一模式的技术文档。合格效果：为这份文档选定一种 Diátaxis 模式（拆分时每份文档只保留一种模式并用链接衔接），句子面向读者、用主动语态、命令式写操作、条件先于指令，删掉“It is important to note that”这类空话和冗长句，标题改成句首大写并承载要点，并保留真实符号与数字（budget.mjs、budget.json、默认 42、CI 在超预算时失败、--write 只用于下调预算）。只加载技能、或只做措辞微调而结构仍混着教程口吻和参考清单，不算效果成立。gap：重写后改动或丢失了真实符号与数字；或仍把多种模式混在一份文档里。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "response-visible", description: "浏览器中能看到重写思路与最终文档结构的说明。" },
    {
      id: "rewritten-doc-visible",
      description: "浏览器或工作区能看到按单一模式组织、标题清晰的重写结果，而不是原文照抄。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/technical-writing/SKILL.md",
    regression:
      "覆盖 technical-writing 主路径：选定单一 Diátaxis 模式、句子干净面向读者，并保留 budget.mjs、budget.json、42 等真实符号与数字；退回成模式混排或丢失符号即为回归。",
  },
};
