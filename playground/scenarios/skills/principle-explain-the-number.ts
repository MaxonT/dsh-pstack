import type { BehaviorScenario } from "../../types.ts";

export const explainTheNumberApply: BehaviorScenario = {
  type: "behavior",
  id: "principle-explain-the-number-apply",
  skill: "principle-explain-the-number",
  turns: [
    {
      prompt:
        "我把导出逻辑改了一下，测出来快了 40%，从 3.2 秒到 1.9 秒。这个数能直接写进 PR 说明吗？bench/ 下有脚本和我跑的结果。",
    },
  ],
  workspace: {
    files: {
      "bench/bench.mjs": [
        'import { exportRows } from "../src/export.mjs";',
        "",
        "const rows = [];",
        'for (let i = 0; i < 100000; i += 1) rows.push({ id: i, name: "row-" + i });',
        "",
        "const t0 = performance.now();",
        "const out = await exportRows(rows);",
        "const t1 = performance.now();",
        "console.log(JSON.stringify({ ms: Math.round(t1 - t0), bytes: out.length, rows: rows.length }));",
        "",
      ].join("\n"),
      "bench/before.txt": '{"ms":3200,"bytes":1280,"rows":0}\n',
      "bench/after.txt": '{"ms":1900,"bytes":1280,"rows":0}\n',
      "src/export.mjs": [
        "export async function exportRows(rows) {",
        "  // 只序列化前 1 行当作样例，真正的写盘在别处",
        "  return JSON.stringify(rows.slice(0, 1));",
        "}",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "回答不应直接认可这个 40%。应指出证据里的问题：两次结果里 `rows` 都是 0、`bytes` 只有 1280，说明被测的代码只序列化了 1 行样例、真正的工作没在计时区间发生；而且每个版本只跑了一次，没有重复与波动范围，也没确认两侧是否同配置。结论应是“这个数不可信、需要重测”，并给出可执行的测量方式（对齐真实工作量、重复多次取中位数与范围、说明限制因素）。gap：把 40% 当成结论写进 PR；只泛泛说“多测几次”而没有发现 rows=0/未做实际工作；复述原则名字而无具体判断。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "response-visible", description: "浏览器中能看到对 40% 这个数的质疑与重测建议。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-explain-the-number/SKILL.md",
    regression: "该原则在 DSH 会话中仍被应用：先解释数字来源与限制，再决定是否采信",
  },
};
