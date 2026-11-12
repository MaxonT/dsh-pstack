import type { BehaviorScenario } from "../../types.ts";

export const playbookScenario: BehaviorScenario = {
  type: "behavior",
  id: "playbook-perf-issue",
  skill: "poteto-mode",
  playbook: "perf-issue",
  turns: [
    {
      prompt:
        "/poteto-mode 这个去重工具在数据量变大后明显变慢，帮我查清楚慢在哪里、把它改快，并拿出让人信服的前后对比。",
    },
  ],
  workspace: {
    files: {
      "README.md": [
        "# dedupe-tool",
        "",
        "一个小工具，用来按 id 去重记录。",
        "去重实现在 src/dedupe.js，基准脚本是 bench.js。",
        "用 npm run bench 看当前耗时，npm test 跑测试。",
        "",
      ].join("\n"),
      "package.json": [
        "{",
        '  "name": "dedupe-tool",',
        '  "version": "0.1.0",',
        '  "type": "module",',
        '  "scripts": {',
        '    "test": "node --test",',
        '    "bench": "node bench.js"',
        "  }",
        "}",
        "",
      ].join("\n"),
      "src/dedupe.js": [
        "export function dedupe(records) {",
        "  const out = [];",
        "  for (const record of records) {",
        "    if (!out.some((existing) => existing.id === record.id)) {",
        "      out.push(record);",
        "    }",
        "  }",
        "  return out;",
        "}",
        "",
      ].join("\n"),
      "bench.js": [
        'import { dedupe } from "./src/dedupe.js";',
        "",
        "const records = [];",
        "for (let i = 0; i < 8000; i += 1) {",
        "  records.push({ id: i % 2000, value: i });",
        "}",
        "",
        "const started = performance.now();",
        "const deduped = dedupe(records);",
        "const elapsed = performance.now() - started;",
        "",
        "console.log(",
        "  `dedupe ${records.length} records -> ${deduped.length} in ${elapsed.toFixed(1)}ms`,",
        ");",
        "",
      ].join("\n"),
      "test/dedupe.test.js": [
        'import test from "node:test";',
        'import assert from "node:assert";',
        'import { dedupe } from "../src/dedupe.js";',
        "",
        'test("removes duplicate ids", () => {',
        "  const result = dedupe([",
        '    { id: 1, value: "a" },',
        '    { id: 1, value: "b" },',
        '    { id: 2, value: "c" },',
        "  ]);",
        "  assert.equal(result.length, 2);",
        "});",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "skill-loaded", skill: "poteto-mode" }],
  rubric: {
    prompt:
      "这是 playbook perf-issue 的 DSH 运行观察。合格效果：poteto-mode 加载后把任务匹配到 Perf issue，先跑基准脚本拿到修复前的真实耗时基线，再据此定位瓶颈并做最小改动，改完重新测量，给出改前改后的数字和产物路径；基线数字要经得起 benchmark-checklist 的核对，不靠读源码臆测上限。环境缺少性能剖析工具时，用脚本自带的计时并如实说明，不因此判 gap。gap：没有测基线就直接改；声称变快却拿不出改前改后数字；测错对象或结论 inconclusive 当成通过；只给源码分析不跑测量。poteto-mode 加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    {
      id: "response-visible",
      description: "浏览器中能看到改前基线、改后数字与 delta 的对比说明。",
    },
    {
      id: "benchmark-run-visible",
      description: "人工确认会话里有实际跑基准脚本的记录，而非只声称测过。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression: "playbook Perf issue：先测基线、按数字做最小改动、复测给出前后对比",
  },
};
