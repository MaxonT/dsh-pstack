import type { BehaviorScenario } from "../../types.ts";

export const boundaryDisciplineApply: BehaviorScenario = {
  type: "behavior",
  id: "principle-boundary-discipline-apply",
  skill: "principle-boundary-discipline",
  turns: [
    {
      prompt:
        "我们要接一个第三方 CSV 导入订单的新入口，文件里的字段可能缺失、金额可能不是数字。我本来打算在订单金额计算、折扣计算、金额格式化这几个函数里各加一遍字段校验，保证任何一层都不会出错。你帮我看看校验和错误处理该怎么设计，才能既安全又长期好维护？",
    },
  ],
  workspace: {
    files: {
      "README.md": [
        "# orders-import",
        "",
        "订单系统。订单从两个外部来源进来：JSON 接口和第三方 CSV 文件。",
        "内部所有金额计算与格式化都基于 src/order.ts 的 Order 类型。",
        "",
      ].join("\n"),
      "src/order.ts": [
        "export interface Order {",
        "  id: string;",
        "  amount: number;",
        "  discountRate: number;",
        "}",
        "",
        "export function discountedTotal(order: Order): number {",
        "  return order.amount * (1 - order.discountRate);",
        "}",
        "",
        "export function formatAmount(order: Order): string {",
        "  return discountedTotal(order).toFixed(2);",
        "}",
        "",
      ].join("\n"),
      "src/import-json.ts": [
        "// 已有的 JSON 导入入口：在边界处解析并校验，然后产出 Order。",
        'import type { Order } from "./order.ts";',
        "",
        "export function parseOrderJson(raw: string): Order {",
        "  const data = JSON.parse(raw);",
        '  if (typeof data.id !== "string" || typeof data.amount !== "number") {',
        '    throw new Error("invalid order payload");',
        "  }",
        "  return { id: data.id, amount: data.amount, discountRate: data.discountRate ?? 0 };",
        "}",
        "",
      ].join("\n"),
      "src/import-csv.ts": [
        "// 新的第三方 CSV 导入入口，待实现。",
        "// CSV 为逗号分隔，可能缺列、金额可能是空串或非数字。",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "no-tool-error" }],
  rubric: {
    prompt:
      "回复应把解析、校验和缺失字段的处理集中在 CSV 导入这个系统边界，在那里把原始文本转成带类型的 Order（缺字段、金额非法在这一层就报错或被明确处理），内部的计算与格式化保持纯函数、信任 Order 类型、不再重复校验。已有的 JSON 导入入口就是同一套做法的先例，可以作为参照。gap：把校验分散到金额计算、折扣、格式化等多个业务函数里，或只在业务层做防御性检查；只复述原则名字而没有给出针对这个 CSV 入口的具体设计。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    {
      id: "response-visible",
      description:
        "浏览器中能看到完整回复，回复说明校验集中在 CSV 导入边界、业务函数保持纯函数信任类型。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-boundary-discipline/SKILL.md",
    regression: "该原则在 DSH 会话中仍被应用：从用户提出的分散校验方案里，推出把校验收敛到系统边界",
  },
};
