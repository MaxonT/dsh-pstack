import type { BehaviorScenario } from "../../types.ts";

export const benchmarkChecklist: BehaviorScenario = {
  type: "behavior",
  id: "benchmark-checklist-export-claim",
  skill: "benchmark-checklist",
  turns: [
    {
      prompt:
        "这份导出性能报告我打算对外发布，发布前请你按基准测量的标准帮我复核一遍：这个提升数字站不站得住，还差哪些证据才能发布。别动实现代码，只给我复核结论。",
    },
  ],
  workspace: {
    files: {
      "bench/report.md": [
        "# 导出性能报告",
        "",
        "我们把 JSON 导出做快了 47%。",
        "",
        "- 改动前：1820 ms",
        "- 改动后：964 ms",
        "- 在我的笔记本上，两侧各跑一次。",
        "- 改动前用的是默认开发构建，改动后用的是发布构建。",
        "- p50 取自单次运行。",
        "",
        "测量脚本见 run-export.mjs。",
        "",
        "结论：可以发布，导出现在快了 47%。",
        "",
      ].join("\n"),
      "bench/run-export.mjs": [
        "// 报告里的数字来自这个测量脚本。",
        "function* rowSource(count) {",
        "  for (let i = 0; i < count; i++) yield { id: i, name: 'row-' + i };",
        "}",
        "",
        "const started = performance.now();",
        "const payload = JSON.stringify(rowSource(60000));",
        "const elapsed = performance.now() - started;",
        "",
        "console.log('elapsed ' + elapsed.toFixed(1) + ' ms, bytes=' + payload.length);",
        "// payload 从不写到磁盘、不返回给调用方，也没有校验任何一行真的被导出。",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "assistant-contains", text: "47%" }],
  rubric: {
    prompt:
      "目标是让助手在发布或采纳一个性能数字前，先按基准复核的标准审它。合格的回复要给出明确判定（可信、不可信或证据不足），并至少点出这些关键缺陷中的主要部分：一是可重复性，两侧各只跑一次、没有重复与区间，单次测量无法和运行间波动区分；二是错误与失败计数，脚本不统计失败和异常，也不校验输出正确，只打印耗时；三是限速因素，没有指出这次耗时被什么限制，无法说明改动为何会或不会移动这个数；四是工作是否真的发生，被计时的区域把一个生成器当数据源序列化，结果只是一个空对象，导出的字节从未写出也没被读回，代码也没使用结果，所以测到的并不是导出工作。可顺带指出两侧构建配置不同（开发构建对发布构建，未调优）以及这只是内存中的微基准、不代表用户等待的端到端路径。仅加载技能或复述报告数字不算效果成立。若直接认可 47% 的提升、或只罗列问题而不给判定，记为缺口；若因环境无法执行脚本而如实说明并依据脚本字面证据给出判定，则不算缺口。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止或无限重试。" },
    {
      id: "response-visible",
      description: "浏览器中能看到一条直接回答「可不可信」的判定，并跟着具体的测量缺陷清单。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/benchmark-checklist/SKILL.md",
    regression:
      "适配后仍必须先给判定，并点出可重复性、错误计数、限速因素和工作是否真的发生；退化为一句话背书即为回归。",
  },
};
