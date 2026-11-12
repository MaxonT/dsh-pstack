import type { BehaviorScenario } from "../../types.ts";

const orderFlowWorkspace = {
  files: {
    "flow.ts": [
      "// 订单状态流转。业务规则：只有“已付款”的订单才能进入“已发货”。",
      'export type OrderState = "空闲" | "待付款" | "已付款" | "已发货" | "已退款";',
      'export type OrderEvent = "提交订单" | "付款" | "发货" | "直接发货" | "退款";',
      "",
      "export interface Transition {",
      "  from: OrderState;",
      "  event: OrderEvent;",
      "  to: OrderState;",
      "}",
      "",
      "export const transitions: Transition[] = [",
      '  { from: "空闲", event: "提交订单", to: "待付款" },',
      '  { from: "待付款", event: "付款", to: "已付款" },',
      '  { from: "已付款", event: "发货", to: "已发货" },',
      '  { from: "待付款", event: "直接发货", to: "已发货" }, // 违规：还没付款就能发货',
      '  { from: "已付款", event: "退款", to: "已退款" },',
      '  { from: "已发货", event: "退款", to: "已退款" },',
      "];",
      "",
    ].join("\n"),
    "README.md": [
      "# Order flow",
      "",
      "`flow.ts` is the order state machine used by the checkout service.",
      "",
      "Business rule: an order may ship only after it is paid.",
      "",
    ].join("\n"),
  },
};

export const statechartOrderShipRule: BehaviorScenario = {
  type: "behavior",
  id: "statechart-order-ship-rule",
  skill: "statechart",
  turns: [
    {
      prompt:
        "这是我们的订单状态流转，业务规则是『只有已付款的订单才能发货』。请把这个流转当成状态模型来检查，把任何违反这条规则的最短路径用状态的说法讲清楚，并把状态图和报告一起整理给我。",
    },
  ],
  workspace: orderFlowWorkspace,
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "回复应把订单流转当作状态模型检查，指出违反『只有已付款才能发货』的最短路径，并用状态的说法讲清它：从“空闲”经“待付款”在未付款的情况下直接进入“已发货”，即“待付款 —直接发货→ 已发货”这条边让规则被破坏。状态图应以任一可读形态呈现，例如 Mermaid 状态图代码块或可读的 SVG/PNG 图片，放在回复或产物里都算。若没有找到这条违规路径、或只给文字描述而没有任何可读的状态图，记缺口；若把规则悄悄改弱（例如把发货改成仅提示）让它通过，也记缺口。状态图渲染或模型检查工具在环境中不可用时，技能可以说明限制并给出等价的文字或 Mermaid 表达，这不算技能缺口。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    { id: "response-visible", description: "浏览器中能看到违规路径说明与可读状态图的完整回复。" },
    {
      id: "chart-readable",
      description: "状态图需人工确认可读，Mermaid 代码块或图片都接受。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/statechart/SKILL.md",
    regression: "默认/格式中立分支：不限定状态图格式，接受 Mermaid 或可读图片",
  },
};

export const statechartOrderShipRuleMermaid: BehaviorScenario = {
  type: "behavior",
  id: "statechart-order-ship-rule-mermaid",
  skill: "statechart",
  turns: [
    {
      prompt:
        "这是我们的订单状态流转，业务规则是『只有已付款的订单才能发货』。请把这个流转当成状态模型来检查，把违反这条规则的最短路径用状态的说法讲清楚，并用 Mermaid 的状态图语法把状态图发给我，报告一起给我。",
    },
  ],
  workspace: orderFlowWorkspace,
  assertions: [
    { kind: "turn-completed" },
    { kind: "assistant-contains", text: "stateDiagram" },
  ],
  rubric: {
    prompt:
      "用户明确要求 Mermaid 状态图，回复应给出 Mermaid 状态图代码（stateDiagram），并指出违反『只有已付款才能发货』的最短路径：待付款 —直接发货→ 已发货。缺 Mermaid 状态图、或没有指出这条违规路径、或把规则改弱让它通过，都记缺口。Mermaid 之外的图片不算满足本格式专用场景。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    { id: "response-visible", description: "浏览器中能看到 Mermaid 状态图代码块与违规路径说明。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/statechart/SKILL.md",
    regression: "显式替代格式分支：用户明确要求 Mermaid",
  },
};

export const statechartOrderShipRuleImage: BehaviorScenario = {
  type: "behavior",
  id: "statechart-order-ship-rule-image",
  skill: "statechart",
  turns: [
    {
      prompt:
        "这是我们的订单状态流转，业务规则是『只有已付款的订单才能发货』。请把这个流转当成状态模型来检查，把违反这条规则的最短路径用状态的说法讲清楚，并把状态图渲染成一张图片放到 out/ 目录下，PNG 或 SVG 都行，报告也一起给我。",
    },
  ],
  workspace: orderFlowWorkspace,
  assertions: [
    { kind: "turn-completed" },
    { kind: "artifact-dir-nonempty", path: "out" },
  ],
  rubric: {
    prompt:
      "用户明确要求图片。回复应在 out/ 下产出至少一张可读的状态图图片（PNG 或 SVG），并指出违反『只有已付款才能发货』的最短路径：待付款 —直接发货→ 已发货。若环境缺少图片渲染能力，技能应明确说明限制并给出等价的 Mermaid 文本或文字状态路径，不假装产出了图片；只在文字里声称生成图片却拿不出图片文件的，记缺口。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    { id: "artifact-visible", description: "浏览器或文件列表中能看到 out/ 下的状态图图片。" },
    {
      id: "image-readable",
      description: "图片需人工确认可读，且能看出待付款直接发货到已发货的违规边。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/statechart/SKILL.md",
    regression: "能力可用性/输出介质分支：用户明确要求图片产物",
  },
};
