import type { BehaviorScenario } from "../../types.ts";

export const interrogateCartDiscount: BehaviorScenario = {
  type: "behavior",
  id: "interrogate-cart-discount-break",
  skill: "interrogate",
  turns: [
    {
      prompt:
        "我刚改了 src/cart.mjs 里的折扣和总价计算，麻烦你从对抗的角度审一下这段改动，只报告能被实际运行证实的缺陷，写清复现命令和实际输出，不要改代码。",
    },
  ],
  workspace: {
    files: {
      "package.json": `{
  "name": "cart-checkout",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
`,
      "src/cart.mjs": `export function applyDiscount(subtotal, percent) {
  const discount = subtotal * percent;
  return subtotal - discount;
}

export function cartTotal(items, percent) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return applyDiscount(subtotal, percent);
}
`,
      "test/cart.test.mjs": `import test from "node:test";
import assert from "node:assert/strict";
import { cartTotal } from "../src/cart.mjs";

test("applies a 10 percent discount to a single line item", () => {
  assert.equal(cartTotal([{ price: 100, quantity: 1 }], 10), 90);
});

test("sums multiple line items at zero discount", () => {
  assert.equal(cartTotal([{ price: 50, quantity: 2 }], 0), 100);
});
`,
    },
  },
  assertions: [
    { kind: "turn-completed" },
    { kind: "skill-loaded", skill: "interrogate" },
    { kind: "assistant-contains", text: "applyDiscount" },
    { kind: "assistant-contains", text: "cartTotal" },
  ],
  rubric: {
    prompt:
      "报告应按 intent、findings、dropped 组织：每条存活的缺陷带确切的复现命令、实际打印输出、以及它如何违背意图（此处 applyDiscount 把百分数当倍数用，10% 折扣把应为 90 的结果算成 -900）；只保留被运行证实的问题，并说明各对抗路丢掉了多少未证实项。不得修改代码。gap：只列风格、命名或需要未来改动才成立的风险；声称缺陷却没有命令与输出；直接改代码；或错误地报无缺陷。若多模型对抗在本环境不可用，技能应如实说明并以单路验证降级完成，不据此判缺口。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    {
      id: "response-visible",
      description: "浏览器中能看到完整回复，呈现 intent、findings、dropped 三段结构。",
    },
    {
      id: "intent-findings-dropped",
      description: "人工确认回复有意图重述、findings 列表与 dropped 统计三段。",
    },
    {
      id: "finding-has-run-output",
      description: "人工确认每条缺陷附带命令与实际输出，能看到错误数值。",
    },
    {
      id: "no-code-edits",
      description: "人工确认 src/cart.mjs 与测试文件在审查后未被修改。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/interrogate/SKILL.md",
    regression:
      "主路径：只报被运行证明的发现、带命令与输出、按 intent/findings/dropped 组织且不改代码；多模型不可用时如实降级，不据此判缺口",
  },
};
