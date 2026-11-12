import type { BehaviorScenario } from "../../types.ts";

export const fixRootCausesApply: BehaviorScenario = {
  type: "behavior",
  id: "principle-fix-root-causes-apply",
  skill: "principle-fix-root-causes",
  turns: [
    {
      prompt:
        "报表偶尔会少几行。上次有人在报表生成那里加了 try/catch 把异常吞掉，结果不报错了但行还是少。现在又出现了，帮我查清楚到底哪里出的问题，别再加一层防护。",
    },
  ],
  workspace: {
    files: {
      "src/input.ts": [
        "export interface RawRow { orderId: string; date: string; amount: string; }",
        "",
        "// 缺失日期时这里直接给了空串，没有当成错误",
        "export function normalize(row: RawRow) {",
        '  return { orderId: row.orderId, date: row.date ?? "", amount: Number(row.amount) };',
        "}",
        "",
      ].join("\n"),
      "src/report.ts": [
        'import { normalize } from "./input.ts";',
        "",
        "export function buildRows(raw) {",
        "  const out = [];",
        "  for (const row of raw) {",
        "    try {",
        "      out.push(formatRow(normalize(row)));",
        "    } catch {",
        "      // 上次加的防护：吞掉异常，跳过这一行",
        "      continue;",
        "    }",
        "  }",
        "  return out;",
        "}",
        "",
        "function formatRow(row) {",
        '  if (!row.date) throw new Error("missing date");',
        "  return `${row.orderId},${row.date},${row.amount}`;",
        "}",
        "",
      ].join("\n"),
      "data/rows.json":
        '[{"orderId":"A1","date":"2026-01-02","amount":"10"},{"orderId":"A2","date":null,"amount":"5"},{"orderId":"A3","date":"2026-01-03","amount":"7"}]\n',
      "run.log": [
        "$ node dist/report.js",
        "built 2 rows from 3 input rows",
        "skipped: missing date",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "no-tool-error" }],
  rubric: {
    prompt:
      "回答应把症状（少行）追到第一个出错的地方：`src/input.ts` 的 `normalize` 把缺失日期变成空串并在下游才抛错，而 `src/report.ts` 的 try/catch 把异常吞掉、跳过整行，这只是掩盖。正确方向是在输入边界处理这个状态——要么把缺失日期当作错误明确拒绝并报出是哪条数据（A2），要么在这里给出合法默认值——而不是在报表层再加防护。回答应说明为何现有 try/catch 不是修复，并给出可验证的定位方式。gap：再加一层 try/catch 或重试；只在报表层找原因而不追到输入；把 A2 静默丢弃当作正常。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "response-visible", description: "浏览器中能看到根因定位（A2 日期为空）与修复方向。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-fix-root-causes/SKILL.md",
    regression: "该原则在 DSH 会话中仍被应用：追到第一个出错处而不是在症状处加防护",
  },
};
