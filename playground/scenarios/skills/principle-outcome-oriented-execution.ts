import type { BehaviorScenario } from "../../types.ts";

export const principleOutcomeOrientedExecution: BehaviorScenario = {
  type: "behavior",
  id: "principle-outcome-oriented-execution-apply",
  skill: "principle-outcome-oriented-execution",
  turns: [
    {
      prompt:
        "data.ts 现在是 callback 风格，我们要整体迁移到 async/await。我打算分几个阶段做，为了每个阶段都能随时回滚，每个阶段先保留一层 callback 兼容包装，最后一步再统一删掉。你帮我评估并推进这个迁移计划。",
    },
  ],
  workspace: {
    files: {
      "data.ts": [
        "export function getUser(",
        "  id: string,",
        "  cb: (err: Error | null, user?: { id: string }) => void,",
        "): void {",
        "  setTimeout(() => cb(null, { id }), 0);",
        "}",
        "",
        "export function saveUser(",
        "  user: { id: string },",
        "  cb: (err: Error | null) => void,",
        "): void {",
        "  setTimeout(() => cb(null), 0);",
        "}",
        "",
      ].join("\n"),
      "profile.ts": [
        'import { getUser } from "./data.ts";',
        "",
        "export function loadProfile(id: string, done: (id: string) => void): void {",
        "  getUser(id, (err, user) => {",
        '    if (err || !user) throw err ?? new Error("missing user");',
        "    done(user.id);",
        "  });",
        "}",
        "",
      ].join("\n"),
      "data.test.ts": [
        'import test from "node:test";',
        'import assert from "node:assert/strict";',
        'import { getUser } from "./data.ts";',
        "",
        'test("getUser returns the id", (_t, done) => {',
        '  getUser("u1", (err, user) => {',
        "    assert.equal(err, null);",
        '    assert.equal(user?.id, "u1");',
        "    done();",
        "  });",
        "});",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "no-tool-error" }],
  rubric: {
    prompt:
      "回复应真正应用该原则推理：指出每个阶段都保留一层 callback 兼容包装会沉淀成一次性兼容债，主张向目标架构（纯 async/await）收敛，而不是为了中间态平滑长期维护两套接口；中间破损只在计划好、范围清楚、可回滚的地方接受，并在明确的阶段边界对实际改动的部分保留高信号检查、在计划完成时做完整的静态与运行时验证。gap：照单接受每个阶段都加兼容包装；只喊口号或只复述原则名字；主张无限期保留双接口。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，回复给出针对迁移计划的评估。" },
    {
      id: "response-visible",
      description: "浏览器中能看到完整回复，回复主张向纯 async/await 收敛并说明阶段边界与验证。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-outcome-oriented-execution/SKILL.md",
    regression: "该原则在 DSH 会话中仍被应用：拒绝逐阶段兼容包装，向目标架构收敛并在边界验证",
  },
};
