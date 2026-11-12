import type { BehaviorScenario } from "../../types.ts";

export const architectDiscountStrategy: BehaviorScenario = {
  type: "behavior",
  id: "architect-discount-strategy-design",
  skill: "architect",
  turns: [
    {
      prompt:
        "我在这个订单定价模块里想支持可插拔的折扣，百分比、满减、买赠以后都可能加进来。先把这套折扣怎么接进现有定价的整体设计讲清楚，我想先看到形状和取舍，再谈实现。策略接口我想叫 DiscountStrategy。整理成一份设计文档放到 docs/discount-design.md，先别写实现。",
    },
  ],
  workspace: {
    files: {
      "package.json": `{
  "name": "order-pricing",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
`,
      "README.md": `# Order pricing

Small module that turns an order's line items into a total.

- \`src/pricing.ts\` holds the \`LineItem\` type, \`subtotal\`, and \`PriceCalculator\`.
- \`src/order.ts\` wires an \`Order\` to the calculator.

Prices are plain numbers in cents.
`,
      "src/pricing.ts": `export interface LineItem {
  sku: string;
  unitPrice: number;
  quantity: number;
}

export function subtotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export class PriceCalculator {
  total(items: LineItem[]): number {
    return subtotal(items);
  }
}
`,
      "src/order.ts": `import { PriceCalculator, type LineItem } from "./pricing.ts";

export interface Order {
  id: string;
  items: LineItem[];
  couponCode?: string;
}

export function orderTotal(order: Order): number {
  return new PriceCalculator().total(order.items);
}
`,
    },
  },
  assertions: [
    { kind: "turn-completed" },
    { kind: "skill-loaded", skill: "architect" },
    { kind: "artifact-contains", path: "docs/discount-design.md", text: "DiscountStrategy" },
    { kind: "assistant-contains", text: "DiscountStrategy" },
  ],
  rubric: {
    prompt:
      "设计文档应先把 DiscountStrategy 的调用方视角写出来：调用方如何注册一个折扣、它如何作用到订单总价，再由这个用法推导出类型草稿、函数签名和模块边界。至少要给出两个结构不同的形状并比较接口深度，记录取舍与至少一个被否决的替代方案，让下一个工程师能照着类型上手。gap：直接进入实现或只给一种形状而无取舍；没有调用方用法；没有模块边界或替代方案；只罗列类型而无理由。若多模型并行设计或子代理在本环境不可用，技能应如实说明并自行降级成多个候选形状的对比，这不算缺口。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    {
      id: "response-visible",
      description: "浏览器中能看到完整回复，先呈现调用方用法，再呈现类型草稿与取舍。",
    },
    {
      id: "usage-before-shape",
      description: "人工确认文档与回复的顺序：调用方用法在类型与模块边界之前。",
    },
    {
      id: "artifact-visible",
      description:
        "人工确认 docs/discount-design.md 已生成，含标题结构与 DiscountStrategy 的类型草稿。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/architect/SKILL.md",
    regression:
      "主路径：先调用方用法与类型草图、记录取舍，再谈实现；多模型或子代理不可用时如实降级，不据此判缺口",
  },
};
