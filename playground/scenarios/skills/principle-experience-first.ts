import type { BehaviorScenario } from "../../types.ts";

export const experienceFirstApply: BehaviorScenario = {
  type: "behavior",
  id: "principle-experience-first-apply",
  skill: "principle-experience-first",
  turns: [
    {
      prompt:
        "设置页现在已经堆了二十多个开关。下个版本还要加三四个功能开关。工程上最快是继续往这个列表里加；另一个做法是花时间把设置重新分组、合并同类项。你建议怎么处理，为什么？",
    },
  ],
  workspace: {
    files: {
      "src/settings.ts": [
        "export interface SettingsFlags {",
        "  notifyEmail: boolean;",
        "  notifyPush: boolean;",
        "  notifySms: boolean;",
        "  digestDaily: boolean;",
        "  digestWeekly: boolean;",
        "  themeDark: boolean;",
        "  compactMode: boolean;",
        "  reduceMotion: boolean;",
        "}",
        "",
        "export const defaultFlags: SettingsFlags = {",
        "  notifyEmail: true,",
        "  notifyPush: true,",
        "  notifySms: false,",
        "  digestDaily: false,",
        "  digestWeekly: true,",
        "  themeDark: false,",
        "  compactMode: false,",
        "  reduceMotion: false,",
        "};",
        "",
      ].join("\n"),
      "README.md": "# settings\n\n设置页把上面的布尔开关逐项渲染成一行一个开关，没有分组。\n",
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "回答应把用户能看到的结果放在实现便利之上：指出无节制增加开关会让设置页难用，主张先精简并论证每个开关是否必要、按用户任务重新分组或合并，而不是仅因为工程上最快就继续堆开关。可以从用户视角比较两个做法的收益与代价，并给出可执行的推进方式（例如先删冗余开关、再分组）。gap：只用“实现方便”作为理由继续加开关；不权衡用户体验；或只复述原则名字没有针对这组开关的具体判断。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "response-visible", description: "浏览器中能看到对两种做法的中立权衡与具体建议。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-experience-first/SKILL.md",
    regression: "该原则在 DSH 会话中仍被应用：以用户体验为准做产品取舍，而非只图实现省事",
  },
};
