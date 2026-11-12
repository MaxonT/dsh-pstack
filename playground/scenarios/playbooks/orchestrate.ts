import type { BehaviorScenario } from "../../types.ts";

export const playbookScenario: BehaviorScenario = {
  type: "behavior",
  id: "playbook-orchestrate",
  skill: "poteto-mode",
  playbook: "orchestrate",
  turns: [
    {
      prompt:
        "/poteto-mode 这是一个多模块仓库，好几个服务都要做同一类日志改造。交给你统筹推进：分给不同的执行者并行做，你负责拆活和验收，最后按服务汇总成能审查的结果。",
    },
  ],
  workspace: {
    files: {
      "README.md": [
        "# services monorepo",
        "",
        "一个多模块单仓，packages 下每个目录是一个独立服务：api、auth、billing、search、webhook。",
        "每个服务都有自己的测试入口。",
        "我们打算把每个服务里散落的日志调用统一换成 docs/logging.md 约定的日志接口。",
        "",
      ].join("\n"),
      "docs/logging.md": [
        "# 日志接口约定",
        "",
        "每个服务应通过 `createLogger(scope)` 获取日志器，用 `logger.info` / `logger.warn` / `logger.error` 记录，",
        "不再直接调用 `console.*`。改造后每个服务仍需通过自己的测试。",
        "",
      ].join("\n"),
      "packages/api/src/index.js": [
        "export function handleRequest(req) {",
        '  console.log("handling", req.path);',
        "  return { ok: true };",
        "}",
        "",
      ].join("\n"),
      "packages/auth/src/index.js": [
        "export function verify(token) {",
        '  console.log("verifying token", token.length);',
        "  return token.length > 0;",
        "}",
        "",
      ].join("\n"),
      "packages/billing/src/index.js": [
        "export function charge(amount) {",
        '  console.log("charging", amount);',
        "  return { charged: amount };",
        "}",
        "",
      ].join("\n"),
      "packages/search/src/index.js": [
        "export function query(q) {",
        '  console.log("searching", q);',
        "  return [];",
        "}",
        "",
      ].join("\n"),
      "packages/webhook/src/index.js": [
        "export function deliver(event) {",
        '  console.log("delivering", event.type);',
        "  return true;",
        "}",
        "",
      ].join("\n"),
      "packages/api/test/index.test.js": [
        'import test from "node:test";',
        'import assert from "node:assert";',
        'import { handleRequest } from "../src/index.js";',
        "",
        'test("handles request", () => {',
        '  assert.equal(handleRequest({ path: "/x" }).ok, true);',
        "});",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "skill-loaded", skill: "poteto-mode" }],
  rubric: {
    prompt:
      "这是 playbook orchestrate 的 DSH 运行观察。合格效果：poteto-mode 加载后把任务匹配到 Orchestrate（面向多模块、多 PR 的长期项目，而不是单个一次性任务），按协调者角色推进，先界定工作单元、为一个单元写出含明确验收证据的启动简报并先跑通一个再铺开，保持每个单元一个负责人，协调者本人不写业务代码，按产物与证据而非子代理口头汇报验收。headless 环境没有子代理、云机器或远端托管工具时，应如实说明限制并降级（例如先产出拆解、启动简报和项目清单），不假装已经派出执行者或合并了 PR。gap：自己把五个服务的代码全改了；把项目当成单个任务直接做完；编造执行者汇报或声称 PR 已合并。poteto-mode 加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    { id: "response-visible", description: "浏览器中能看到拆解、kickoff 与验收方式的完整回复。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression:
      "playbook Orchestrate：program 级协调，先跑通一个单元再铺开，协调者不写代码，缺能力时降级",
  },
};
