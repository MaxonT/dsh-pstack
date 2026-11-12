import type { BehaviorScenario } from "../../types.ts";

const billingWorkspace = {
  files: {
    "README.md": [
      "# billing-service",
      "",
      "账单服务。当前正在做『按用量分层计价』，基础调用链已经通了，边界与退款逻辑还没处理。",
      "",
    ].join("\n"),
    "NOTES.md": [
      "# 进度笔记",
      "",
      "- 已完成：计价核心函数与单元测试",
      "- 进行中：月度账单汇总",
      "- 未开始：退款、优惠券",
      "- 已知问题：并发写入同一账单时会丢更新",
      "",
    ].join("\n"),
    "src/pricing.js": [
      "export function priceByUsage(units) {",
      "  return units <= 100 ? units * 1 : 100 + (units - 100) * 0.8;",
      "}",
      "",
    ].join("\n"),
  },
};

export const recallDegradedNoHistory: BehaviorScenario = {
  type: "behavior",
  id: "recall-degraded-no-history",
  skill: "recall",
  turns: [
    {
      prompt: "/recall 帮我回顾一下之前关于这个账单项目的工作，我上次做到哪了？接下来该做什么？",
    },
  ],
  workspace: billingWorkspace,
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "这是会话历史回顾类技能在『没有可回顾历史』情形下的观察：当前是全新会话，此前没有可供检索的对话记录（若环境里存在检索能力，检索结果也应为空）。合格效果：助手先如实说明无法访问此前的对话历史（或检索结果为空、检索能力不可用），不编造过去做过什么，也不虚构提交、对话或进展；随后基于当前工作区给出可用的近况简报，说清正在做什么、已完成/进行中/未开始的事项、已知问题，并给出一个具体的下一步建议。gap：声称检索到了过去的对话历史却拿不出依据；把工作区里的进度笔记当成『已检索到的历史对话』并据此编造没发生过的事件；或只说一句无法回顾就结束、不给任何基于工作区的近况与下一步。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    {
      id: "response-visible",
      description: "浏览器中能看到明确说明历史不可用、并基于工作区给出近况简报的完整回复。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/recall/SKILL.md",
    regression: "降级分支：无历史可检索时如实说明查不到，并给出基于工作区的近况简报，不编造历史",
  },
};
