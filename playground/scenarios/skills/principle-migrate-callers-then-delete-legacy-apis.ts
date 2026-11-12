import type { BehaviorScenario } from "../../types.ts";

export const principleMigrateCallersThenDeleteLegacyApis: BehaviorScenario = {
  type: "behavior",
  id: "principle-migrate-callers-then-delete-legacy-apis-apply",
  skill: "principle-migrate-callers-then-delete-legacy-apis",
  turns: [
    {
      prompt:
        "utils.ts 里的 formatDateV1 被 report.ts 和 invoice.ts 用着。我想重写一版更清晰的日期格式化，同时把 formatDateV1 保留成兼容层，这样两个调用方先不用动。你帮我落地这个改动，看看这样安排是否妥当。",
    },
  ],
  workspace: {
    files: {
      "README.md": [
        "# billing",
        "",
        "内部计费模块。utils.ts 只在这个仓库里使用，没有外部包或其它团队依赖它。",
        "",
      ].join("\n"),
      "utils.ts": [
        "export function formatDateV1(d: Date): string {",
        "  return d.toISOString().slice(0, 10);",
        "}",
        "",
      ].join("\n"),
      "report.ts": [
        'import { formatDateV1 } from "./utils.ts";',
        "",
        "export function reportLine(d: Date): string {",
        "  return `report ${formatDateV1(d)}`;",
        "}",
        "",
      ].join("\n"),
      "invoice.ts": [
        'import { formatDateV1 } from "./utils.ts";',
        "",
        "export function invoiceLine(d: Date): string {",
        "  return `invoice ${formatDateV1(d)}`;",
        "}",
        "",
      ].join("\n"),
      "utils.test.ts": [
        'import test from "node:test";',
        'import assert from "node:assert/strict";',
        'import { formatDateV1 } from "./utils.ts";',
        "",
        'test("formatDateV1 slices to yyyy-mm-dd", () => {',
        '  assert.equal(formatDateV1(new Date("2026-01-02T00:00:00Z")), "2026-01-02");',
        "});",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "no-tool-error" }],
  rubric: {
    prompt:
      "回复应真正应用该原则推理：README 表明 formatDateV1 只为内部服务、没有外部依赖，因此不该把旧函数留成兼容层，而应在同一轮把 report.ts 和 invoice.ts 两个调用方迁移到新实现，更新测试到新契约，并删除 formatDateV1 以及只保护它实现的旧测试。gap：保留兼容层、只迁移部分调用方、把旧函数留着不删、或只复述原则名字而没有针对这份代码的具体安排。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，回复给出针对兼容层请求的判断和改动安排。" },
    {
      id: "response-visible",
      description: "浏览器中能看到完整回复，回复说明迁移调用方并删除旧函数，而不是保留兼容层。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-migrate-callers-then-delete-legacy-apis/SKILL.md",
    regression:
      "该原则在 DSH 会话中仍被应用：在无外部依赖时迁移调用方并同轮删除旧 API，而不是保留兼容层",
  },
};
