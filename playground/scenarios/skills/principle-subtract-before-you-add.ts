import type { BehaviorScenario } from "../../types.ts";

export const principleSubtractBeforeYouAdd: BehaviorScenario = {
  type: "behavior",
  id: "principle-subtract-before-you-add-apply",
  skill: "principle-subtract-before-you-add",
  turns: [
    {
      prompt:
        "report.ts 里我想加真正的 CSV 导出。文件里还留着一些没人用的旧 helper 和一个 TODO 空实现。我打算直接往 exportReport 里填代码。你帮我看看这个改动该怎么推进。",
    },
  ],
  workspace: {
    files: {
      "report.ts": [
        "export function oldFormat(n: number): string {",
        "  return String(n);",
        "}",
        "",
        "export function legacySort(rows: number[]): number[] {",
        "  return [...rows].sort((a, b) => a - b);",
        "}",
        "",
        "export function exportReport(): string {",
        "  // TODO: implement CSV export",
        '  return "";',
        "}",
        "",
      ].join("\n"),
      "README.md": [
        "# reports",
        "",
        "报表模块。oldFormat 与 legacySort 是早期遗留、现在没有任何调用方。",
        "exportReport 目前只是空壳，CSV 导出尚未实现。",
        "",
      ].join("\n"),
      "index.ts": [
        'import { exportReport } from "./report.ts";',
        "",
        "console.log(exportReport());",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "no-tool-error" }],
  rubric: {
    prompt:
      "回复应真正应用该原则推理：先做减法——删除 oldFormat、legacySort 这些没有调用方的死代码，以及 exportReport 的空壳 stub（或把它替换成真实实现而不是留壳再填），让基座更简单，再在其上构建 CSV 导出，而不是先往旧文件里堆新代码、保留一堆没人用的 helper。gap：直接开始加功能、完全不清理死代码与 stub；只喊口号或只复述原则名字。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，回复给出针对加功能前先清理的判断。" },
    {
      id: "response-visible",
      description: "浏览器中能看到完整回复，回复先删除死代码与空壳，再给出 CSV 导出实现。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-subtract-before-you-add/SKILL.md",
    regression: "该原则在 DSH 会话中仍被应用：加功能前先删除死代码与 stub，在更简单的基座上构建",
  },
};
