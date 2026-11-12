import type { BehaviorScenario } from "../../types.ts";

const preferencesWorkspace = {
  files: {
    "preferences/response-style.md": [
      "# 回复风格（来自多次反馈）",
      "",
      "- 短句，先给结论再给理由。",
      "- 不确定的地方要明确标注是猜测，不要混在确定结论里。",
      "- 不要用长破折号。",
      "- 比较选项时用表格，不要写成流水账。",
      "",
    ].join("\n"),
    "preferences/verification.md": [
      "# 验证习惯（多次强调）",
      "",
      "- 改动后要真正跑一遍验证，不要只说『编译通过』。",
      "- 优先用可复跑的脚本取证，而不是手点一遍。",
      "- 报告结果时把证据（命令、退出码、产物路径）一起给出。",
      "",
    ].join("\n"),
    "preferences/process.md": [
      "# 协作习惯（多轮出现）",
      "",
      "- 独立子任务尽量并行处理。",
      "- 提交前先自查改动。",
      "- 改动大时先列计划再动手。",
      "",
    ].join("\n"),
  },
};

export const automateMeCapturePreferences: BehaviorScenario = {
  type: "behavior",
  id: "automate-me-capture-preferences",
  skill: "automate-me",
  turns: [
    {
      prompt:
        "/automate-me 我是李明（handle 用 liming）。根据项目里 preferences/ 下的这些偏好样例，帮我起草一个属于我自己的模式技能，让我以后能按我的习惯工作。请直接起草，不用反复问我。技能文件请写到项目根的 modes/liming-mode/SKILL.md。",
    },
  ],
  workspace: preferencesWorkspace,
  assertions: [
    { kind: "turn-completed" },
    { kind: "artifact-contains", path: "modes/liming-mode/SKILL.md", text: "liming" },
    { kind: "assistant-contains", text: "liming" },
  ],
  rubric: {
    prompt:
      "目标是把项目里重复出现的偏好归纳成一个可复用的个人模式技能草案。合格效果：产出的技能文件（写到用户指定路径）以用户 handle 作为触发的一部分（名字、/liming-mode、按李明风格工作），把偏好按真正有非默认规则的板块组织（例如回应风格、验证姿态、协作流程），语言简洁可操作；对其他技能的依赖用路径引用而不是把内容整段抄进来；只收多轮出现、稳定的偏好，单次偶发的不硬编；没有非默认规则的板块不强行凑齐。若环境无法读取历史会话，可基于提供的偏好样例起草，不据此判 gap。gap：只罗列偏好而没有产出技能文件；触发条件缺 handle；把别的技能内容整段内联；把单次偶发偏好当成稳定规则。环境中若无法开 PR，跳过推送或开 PR 不算 gap，但技能草案本身仍应落盘。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    { id: "response-visible", description: "浏览器中能看到起草的模式技能说明的完整回复。" },
    {
      id: "mode-skill-visible",
      description:
        "工作区里能看到 modes/liming-mode/SKILL.md，人工确认读起来像李明本人的习惯、且引用而非内联其他技能。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/automate-me/SKILL.md",
    regression: "把重复偏好归纳成可复用模式技能草案，引用而非内联其他技能",
  },
};
