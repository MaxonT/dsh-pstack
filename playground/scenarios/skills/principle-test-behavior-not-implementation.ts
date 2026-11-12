import type { BehaviorScenario } from "../../types.ts";

export const principleTestBehaviorNotImplementation: BehaviorScenario = {
  type: "behavior",
  id: "principle-test-behavior-not-implementation-apply",
  skill: "principle-test-behavior-not-implementation",
  turns: [
    {
      prompt:
        "cart.test.ts 里这个测试断言内部 subtotal 被调用的次数，我们内部实现一改它就得跟着改、经常红。帮我把它改稳一点，我关心的是算得对不对。",
    },
  ],
  workspace: {
    files: {
      "cart.ts": [
        "export interface Item {",
        "  price: number;",
        "  qty: number;",
        "}",
        "",
        "let subtotalRuns = 0;",
        "",
        "function subtotal(items: Item[]): number {",
        "  subtotalRuns += 1;",
        "  return items.reduce((sum, item) => sum + item.price * item.qty, 0);",
        "}",
        "",
        "export function totalWithTax(items: Item[], rate: number): number {",
        "  return Math.round(subtotal(items) * (1 + rate));",
        "}",
        "",
        "// 仅用于测试观察内部调用次数",
        "export function subtotalRunCount(): number {",
        "  return subtotalRuns;",
        "}",
        "",
      ].join("\n"),
      "cart.test.ts": [
        'import test from "node:test";',
        'import assert from "node:assert/strict";',
        'import { totalWithTax, subtotalRunCount } from "./cart.ts";',
        "",
        'test("totalWithTax runs subtotal exactly once", () => {',
        "  const total = totalWithTax([{ price: 100, qty: 1 }], 0.1);",
        "  assert.equal(subtotalRunCount(), 1);",
        "  assert.equal(total, 110);",
        "});",
        "",
      ].join("\n"),
      "package.json": [
        "{",
        '  "name": "cart-lib",',
        '  "private": true,',
        '  "type": "module",',
        '  "scripts": {',
        '    "test": "node --test"',
        "  }",
        "}",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "no-tool-error" }],
  rubric: {
    prompt:
      "回复应真正应用该原则推理：指出断言内部私有 subtotal 的调用次数，是把测试钉在实现上——重构即挂、还抓不到真 bug；应改为通过公开接口断言用户可观察的行为，例如从需求推导 totalWithTax([{ price: 100, qty: 1 }], 0.1) === 110，并补一个空购物车为 0 的用例，使测试随行为破坏而失败、随内部重构仍通过；同时去掉只为测试内部调用次数而加的那个观察函数。gap：继续保留内部调用次数断言；只把断言换个写法或改名却仍绑定实现细节；只喊口号或只复述原则名字。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，回复给出针对坏测试改写的判断。" },
    {
      id: "response-visible",
      description:
        "浏览器中能看到完整回复，回复把内部调用断言替换成通过公开接口断言可观察行为的测试。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-test-behavior-not-implementation/SKILL.md",
    regression: "该原则在 DSH 会话中仍被应用：把钉在实现细节的测试改成通过公开接口断言可观察行为",
  },
};
