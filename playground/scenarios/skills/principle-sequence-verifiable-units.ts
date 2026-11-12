import type { BehaviorScenario } from "../../types.ts";

export const principleSequenceVerifiableUnits: BehaviorScenario = {
  type: "behavior",
  id: "principle-sequence-verifiable-units-apply",
  skill: "principle-sequence-verifiable-units",
  turns: [
    {
      prompt:
        "仓库里三十来个文件还在用旧的 getUser(id, cb) 回调写法，我要统一改成 await getUser(id)。我想一口气全改完，最后再统一跑一次测试，这样最快。你帮我评估并推进这次改写。",
    },
  ],
  workspace: {
    files: {
      "README.md": [
        "# accounts-service",
        "",
        "内部账号服务。getUser 目前是回调风格，约三十处调用分散在 src/ 下的多个模块。",
        "测试在 test/，用 node --test 运行。",
        "",
      ].join("\n"),
      "src/service.ts": [
        "type Cb<T> = (err: Error | null, value?: T) => void;",
        "",
        "export function getUser(id: string, cb: Cb<{ id: string }>): void {",
        "  setTimeout(() => cb(null, { id }), 0);",
        "}",
        "",
      ].join("\n"),
      "src/profile.ts": [
        'import { getUser } from "./service.ts";',
        "",
        "export function loadProfile(id: string): void {",
        "  getUser(id, (err, user) => {",
        "    if (err) return;",
        '    console.log("profile", user?.id);',
        "  });",
        "}",
        "",
      ].join("\n"),
      "src/invoice.ts": [
        'import { getUser } from "./service.ts";',
        "",
        "export function loadInvoice(id: string): void {",
        "  getUser(id, (err, user) => {",
        "    if (err) return;",
        '    console.log("invoice", user?.id);',
        "  });",
        "}",
        "",
      ].join("\n"),
      "stdout.log": ["$ node src/profile.js", "profile u1", ""].join("\n"),
      "test/profile.test.ts": [
        'import test from "node:test";',
        'import assert from "node:assert/strict";',
        "",
        'test("placeholder profile test", () => {',
        "  assert.equal(1, 1);",
        "});",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "no-tool-error" }],
  rubric: {
    prompt:
      "回复应真正应用该原则推理：指出一次性改三十个文件再最后统一测，会把破损埋进批量改动里、难以定位；应拆成小单元（按模块或文件），每个单元改完立即验证通过再进入下一个，并按能自证的方式排列交付，例如先落一个会失败的测试再逐单元转绿；应在干净基线上开始，让每一步的检查都对着真实基线。gap：认可“一口气全改完最后统一测”；只喊口号或只复述原则名字；没有给出任何分单元验证或交付顺序。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，回复给出针对批量改写的排序判断。" },
    {
      id: "response-visible",
      description: "浏览器中能看到完整回复，回复给出按单元验证、逐单元转绿的推进方式。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-sequence-verifiable-units/SKILL.md",
    regression:
      "该原则在 DSH 会话中仍被应用：把批量改写切成可验证单元并逐单元转绿，而不是一次性大改",
  },
};
