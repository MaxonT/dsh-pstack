import type { BehaviorScenario } from "../../types.ts";

export const playbookScenario: BehaviorScenario = {
  type: "behavior",
  id: "playbook-session-pickup",
  skill: "poteto-mode",
  playbook: "session-pickup",
  turns: [
    {
      prompt: "/poteto-mode 接着上次那个会话继续把没做完的做掉，先看看现场再动手，别从头重做。",
    },
  ],
  workspace: {
    files: {
      "README.md": [
        "# checkout-service",
        "",
        "结账服务。功能改动按会话记录交接，历史记录在 `agent-transcripts/2026-11-10-coupon-discount.md`。",
        "用 `node --test` 跑测试。",
        "",
      ].join("\n"),
      "package.json":
        '{\n  "name": "checkout-service",\n  "version": "0.1.0",\n  "type": "module",\n  "scripts": {\n    "test": "node --test"\n  }\n}\n',
      "agent-transcripts/2026-11-10-coupon-discount.md": [
        "# 会话记录 2026-11-10 优惠券折扣",
        "",
        "目标：给结账流程加优惠券折扣（SAVE10 打九折）。",
        "",
        "已完成：",
        "- 新增 `src/coupon.js`，实现 `applyCoupon(subtotal, code)` 返回折扣金额。",
        "- `test/coupon.test.js` 通过。",
        "",
        "未完成：",
        "- `src/checkout.js` 还没有调用 `applyCoupon`。",
        "- `test/checkout.test.js` 里 “applies SAVE10” 仍在 failing。",
        "",
        "决定：",
        "- 折扣只作用于商品小计，不影响运费和税。",
        "- 无效优惠券直接忽略，不报错。",
        "",
        "恢复点（resume point）：把 `applyCoupon` 接进 `checkout.js`，然后让端到端测试通过。",
        "",
      ].join("\n"),
      "src/coupon.js": [
        "export function applyCoupon(subtotal, code) {",
        '  if (code === "SAVE10") return subtotal * 0.1;',
        "  return 0;",
        "}",
        "",
      ].join("\n"),
      "src/checkout.js": [
        "export function checkout(items) {",
        "  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);",
        "  const tax = subtotal * 0.08;",
        "  return { subtotal, tax, total: subtotal + tax };",
        "}",
        "",
      ].join("\n"),
      "test/coupon.test.js": [
        'import test from "node:test";',
        'import assert from "node:assert";',
        'import { applyCoupon } from "../src/coupon.js";',
        "",
        'test("SAVE10 gives a 10 percent discount", () => {',
        '  assert.equal(applyCoupon(100, "SAVE10"), 10);',
        "});",
        "",
        'test("unknown coupon is ignored", () => {',
        '  assert.equal(applyCoupon(100, "NOPE"), 0);',
        "});",
        "",
      ].join("\n"),
      "test/checkout.test.js": [
        'import test from "node:test";',
        'import assert from "node:assert";',
        'import { checkout } from "../src/checkout.js";',
        "",
        'test("applies SAVE10", () => {',
        '  const r = checkout([{ price: 100, qty: 1 }], "SAVE10");',
        "  assert.equal(r.discount, 10);",
        "  assert.equal(r.total, 91.8);",
        "});",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "skill-loaded", skill: "poteto-mode" }],
  rubric: {
    prompt:
      "这是 playbook session-pickup 的 DSH 运行观察。合格效果：poteto-mode 加载后把任务匹配到 Session pickup，并按其步骤推进：先定位并读这份历史会话记录（agent-transcripts/ 下的交接记录），重建现场（`src/coupon.js` 与 `test/coupon.test.js` 已完成；`src/checkout.js` 还没接 `applyCoupon`；端到端测试仍在 failing；折扣只作用于小计、无效券忽略这两个决定已定），指出恢复点是把 `applyCoupon` 接进 `checkout.js` 并让端到端测试通过，然后从恢复点继续，不重做已完成的部分。可以用真实测试确认继承来的状态，但不能把交接当不可信从头重做。gap：没读交接记录就从头实现；忽略已经完成的 `coupon.js` 重新造一遍；声称读过了却给不出任何现场重建或恢复点；把已定决定重新推翻。若读取交接记录的路径不可用，应如实说明并询问，而不是编造。poteto-mode 加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    {
      id: "response-visible",
      description: "浏览器中能看到读到现场、恢复点与接着做了什么（而不是重做）的完整说明。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression: "playbook Session pickup：先读历史会话重建现场与恢复点，再从恢复点继续而不重做",
  },
};
