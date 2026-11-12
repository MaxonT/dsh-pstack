import type { BehaviorScenario } from "../../types.ts";

export const playbookScenario: BehaviorScenario = {
  type: "behavior",
  id: "playbook-refactoring",
  skill: "poteto-mode",
  playbook: "refactoring",
  turns: [
    {
      prompt:
        "/poteto-mode 这个计费模块把校验、算账、折扣、税费全塞在一个函数里，帮我把它拆成职责更清楚的结构，行为一点都不能变，改完用现在的测试证明结果和以前一样。",
    },
  ],
  workspace: {
    files: {
      "README.md": [
        "# billing",
        "",
        "结账金额计算模块。`src/billing.js` 里的 `processOrder` 目前一个函数包办了校验、小计、折扣、税费和总计。",
        "现有行为以 `test/billing.test.js` 为准，用 `node --test` 跑。",
        "",
      ].join("\n"),
      "package.json":
        '{\n  "name": "billing",\n  "version": "0.1.0",\n  "type": "module",\n  "scripts": {\n    "test": "node --test"\n  }\n}\n',
      "src/billing.js": [
        "function round2(n) {",
        "  return Math.round(n * 100) / 100;",
        "}",
        "",
        "export function processOrder(order) {",
        "  if (!order || !order.items || order.items.length === 0) {",
        '    throw new Error("empty order");',
        "  }",
        "",
        "  let subtotal = 0;",
        "  for (const item of order.items) {",
        '    if (item.qty <= 0) throw new Error("bad qty");',
        "    subtotal += item.price * item.qty;",
        "  }",
        "",
        "  let discount = 0;",
        '  if (order.coupon === "SAVE10") discount = subtotal * 0.1;',
        "  if (order.vip) discount += subtotal * 0.05;",
        "",
        "  const taxable = subtotal - discount;",
        "  const tax = round2(taxable * 0.08);",
        "  const total = round2(taxable + tax);",
        "",
        "  return { subtotal, discount, tax, total };",
        "}",
        "",
      ].join("\n"),
      "test/billing.test.js": [
        'import test from "node:test";',
        'import assert from "node:assert";',
        'import { processOrder } from "../src/billing.js";',
        "",
        'test("plain order", () => {',
        "  const r = processOrder({ items: [{ price: 10, qty: 2 }] });",
        "  assert.equal(r.subtotal, 20);",
        "  assert.equal(r.tax, 1.6);",
        "  assert.equal(r.total, 21.6);",
        "});",
        "",
        'test("coupon and vip stack", () => {',
        '  const r = processOrder({ coupon: "SAVE10", vip: true, items: [{ price: 100, qty: 1 }] });',
        "  assert.equal(r.discount, 15);",
        "  assert.equal(r.total, 91.8);",
        "});",
        "",
        'test("rejects empty order", () => {',
        "  assert.throws(() => processOrder({ items: [] }), /empty order/);",
        "});",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "skill-loaded", skill: "poteto-mode" }],
  rubric: {
    prompt:
      "这是 playbook refactoring 的 DSH 运行观察。合格效果：poteto-mode 加载后把任务匹配到 Refactoring（而不是 Feature 或 Bug fix），并按其实施：先把现有行为钉住，跑一遍 `src/billing.js` 的现有测试作为行为契约，再说明要拆出的结构（校验、小计、折扣、税费各自成函数）以及最小改动的目标形状，然后小步移动，每一步都保持测试通过，最后用真实的测试输出证明重构前后的结果一致。只改结构，不改返回值或业务规则。gap：把任务当成加功能或改行为；没跑现有测试就大改；只给拆分计划不落地也不说明；声称测试通过却拿不出运行结果。环境里跑不了测试时应如实说明并给出可复现的验证方式，不假装验证过。poteto-mode 加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    {
      id: "response-visible",
      description: "浏览器中能看到行为契约、拆分后的结构与测试结果的完整回复。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression: "playbook Refactoring：先钉住现有测试作为行为契约，再小步重构并证明行为不变",
  },
};
