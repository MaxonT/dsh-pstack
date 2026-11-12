import type { BehaviorScenario } from "../../types.ts";

export const principleProveItWorks: BehaviorScenario = {
  type: "behavior",
  id: "principle-prove-it-works-apply",
  skill: "principle-prove-it-works",
  turns: [
    {
      prompt:
        "同事说他修好了 sum.ts 里数组求和的边界 bug，还说他跑过测试确认没问题。你核实一下到底是不是真的修好了，把核实方式做成一个能重跑的小脚本放到 out/ 下，顺便告诉我结论。",
    },
  ],
  workspace: {
    files: {
      "sum.ts": [
        "export function sum(nums: number[]): number {",
        "  let total = 0;",
        "  for (let i = 0; i < nums.length - 1; i++) {",
        "    total += nums[i];",
        "  }",
        "  return total;",
        "}",
        "",
      ].join("\n"),
      "sum.test.ts": [
        'import test from "node:test";',
        'import assert from "node:assert/strict";',
        'import { sum } from "./sum.ts";',
        "",
        'test("empty array sums to zero", () => {',
        "  assert.equal(sum([]), 0);",
        "});",
        "",
      ].join("\n"),
      "package.json": [
        "{",
        '  "name": "sum-lib",',
        '  "private": true,',
        '  "type": "module",',
        '  "scripts": {',
        '    "test": "node --test"',
        "  }",
        "}",
        "",
      ].join("\n"),
      "NOTES.md": [
        "# 交接备注",
        "",
        "sum.ts 的边界 bug 已由同事处理，他自述已跑过测试确认没问题。",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "artifact-dir-nonempty", path: "out" }],
  rubric: {
    prompt:
      "回复应真正去验证而不是采信自报：直接读 sum.ts 并对真实函数用具体输入执行，例如 sum([1,2,3]) 实际得到 3 而不是 6，证明它仍然漏掉最后一个元素、bug 没修好；同时指出仓库里已有的测试只覆盖空数组、为正解做了“测试通过”的假象，并不检验非空输入。还应在 out/ 下留下一个可重跑的小脚本，让复核者能自己得到同样结论。gap：只转述“同事说跑过测试”或只重跑那个必然通过的空数组测试；以“能编译/看起来没问题”代替真实执行；声称核实过却拿不出运行证据或 out/ 下的脚本。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，回复给出核实后的真实执行证据与结论。" },
    {
      id: "response-visible",
      description: "浏览器中能看到完整回复，回复给出真实运行的输入输出，说明 bug 仍在。",
    },
    { id: "artifact-visible", description: "人工确认 out/ 下存在可重跑的核实脚本。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-prove-it-works/SKILL.md",
    regression: "该原则在 DSH 会话中仍被应用：直接运行真实函数取证，而不是采信自报或“测试通过”",
  },
};
