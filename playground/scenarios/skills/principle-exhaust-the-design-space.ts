import type { BehaviorScenario } from "../../types.ts";

export const exhaustTheDesignSpaceApply: BehaviorScenario = {
  type: "behavior",
  id: "principle-exhaust-the-design-space-apply",
  skill: "principle-exhaust-the-design-space",
  turns: [
    {
      prompt:
        "我们想给命令面板加一个全新的『拖拽分组』交互：用户可以拖动命令项到不同分组里，也能跨组移动。团队里没人做过，现有代码里也没有类似先例，而且这个交互好不好用很看手感。我准备直接把脑子里那套方案写进生产代码。你觉得该怎么推进？",
    },
  ],
  workspace: {
    files: {
      "docs/design-brief.md": [
        "# 命令面板：拖拽分组",
        "",
        "目标：用户可以把命令项拖进分组、在组间移动，并保持分组顺序。",
        "现状：命令面板目前只是一个扁平列表，没有任何分组或拖拽能力，全仓库无同类交互可参考。",
        "约束：这个交互的体验主要取决于手感与直觉，光靠逻辑很难判断哪种方案更好。",
        "",
      ].join("\n"),
      "src/command-palette.ts": [
        "// 目前的命令面板：一个扁平的命令列表，没有分组，也没有拖拽。",
        "export interface Command {",
        "  id: string;",
        "  label: string;",
        "}",
        "",
        "export function renderList(commands: Command[]): string[] {",
        "  return commands.map((c) => c.label);",
        "}",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "no-tool-error" }],
  rubric: {
    prompt:
      "工作区表明这是一个没有先例、体验取决于手感的新交互。回复应建议先做 2-3 个相互竞争的原型，把它们在真实操作手感上并排比较，选出更好的方案后再落到生产代码，而不是直接按脑中单一方案实现。合格还应说明比较依据（例如操作流畅度、误拖率、分组顺序的可理解性）以及最终如何选定。gap：直接挑一个方案就实现；只给一个方案却没有做多方案对比；只复述原则名字而没有具体的多原型比较计划。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    {
      id: "response-visible",
      description: "浏览器中能看到完整回复，回复主张先做多个相互竞争的原型并排比较，再定方案。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-exhaust-the-design-space/SKILL.md",
    regression: "该原则在 DSH 会话中仍被应用：面对无先例、靠手感的新交互，先做多方案原型对比再落地",
  },
};
