import type { BehaviorScenario } from "../../types.ts";

export const playbookScenario: BehaviorScenario = {
  type: "behavior",
  id: "playbook-bug-fix",
  skill: "poteto-mode",
  playbook: "bug-fix",
  turns: [
    {
      prompt:
        "/poteto-mode 客服反馈：会员刚好凑到 100 元的订单没拿到包邮，非会员凑到 200 也一样。帮我复现、定位根因并修好，用真实运行证明修好了。",
    },
  ],
  workspace: {
    files: {
      "README.md": [
        "# pricing",
        "",
        "结算里判断订单是否满足包邮条件的小模块。",
        "会员和非会员的门槛不同，具体数值见 src/promo.js。",
        "",
      ].join("\n"),
      "package.json":
        '{\n  "name": "pricing",\n  "version": "1.0.0",\n  "type": "module",\n  "scripts": {\n    "test": "node --test"\n  }\n}\n',
      "src/promo.js": [
        "export function isMember(order) {",
        '  return order.tier === "gold" || order.tier === "silver";',
        "}",
        "",
        "export function freeShippingThreshold(order) {",
        "  return isMember(order) ? 100 : 200;",
        "}",
        "",
        "export function qualifiesForFreeShipping(order) {",
        "  return order.total > freeShippingThreshold(order);",
        "}",
        "",
      ].join("\n"),
      "repro.mjs": [
        'import { qualifiesForFreeShipping } from "./src/promo.js";',
        "",
        "for (const order of [",
        '  { tier: "gold", total: 100 },',
        '  { tier: "basic", total: 200 },',
        '  { tier: "gold", total: 150 },',
        "]) {",
        "  console.log(",
        "    `${order.tier} total=${order.total} -> free shipping: ${qualifiesForFreeShipping(order)}`,",
        "  );",
        "}",
        "",
      ].join("\n"),
      "test/promo.test.js": [
        'import test from "node:test";',
        'import assert from "node:assert";',
        'import { qualifiesForFreeShipping } from "../src/promo.js";',
        "",
        'test("member at threshold gets free shipping", () => {',
        '  assert.equal(qualifiesForFreeShipping({ tier: "gold", total: 100 }), true);',
        "});",
        "",
        'test("non-member at threshold gets free shipping", () => {',
        '  assert.equal(qualifiesForFreeShipping({ tier: "basic", total: 200 }), true);',
        "});",
        "",
        'test("above threshold still gets free shipping", () => {',
        '  assert.equal(qualifiesForFreeShipping({ tier: "gold", total: 150 }), true);',
        "});",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "skill-loaded", skill: "poteto-mode" }],
  rubric: {
    prompt:
      "这是 playbook bug-fix 的 DSH 运行观察。合格效果：poteto-mode 加载后把任务匹配到 bug-fix。它的第一个可观察动作应是先在真实的运行面上复现：运行 repro 或测试，拿到失败输出，确认恰好等于门槛的两笔订单都被判成不包邮，而不是先动代码。随后用运行证据把根因定位到 qualifiesForFreeShipping 里的边界比较——这里用了严格大于，导致『满门槛』本身被排除，正确做法是让门槛本身也满足（改为包含边界），且两个门槛都由同一个判断统一。修复取最小改动，再重跑 repro 与测试证明现在通过；有便宜的本地测试路径时先让失败测试落地再修。专用的控制面或插桩能力在当前环境不可用时，应如实说明并退化为直接运行该模块。gap：没复现就先改代码；没有运行证据就猜根因；顺手扩大改动或重构无关逻辑；声称修好却没有重跑；测试仍然红。poteto-mode 加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    { id: "response-visible", description: "浏览器中能看到复现输出、根因说明与修复后的验证结果。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression: "playbook bug-fix：先在真实运行面复现，再用运行证据定位根因，最小修复并重跑验证",
  },
};
