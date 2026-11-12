import type { BehaviorScenario } from "../../types.ts";

export const playbookScenario: BehaviorScenario = {
  type: "behavior",
  id: "playbook-babysit",
  skill: "poteto-mode",
  playbook: "babysit",
  turns: [
    {
      prompt:
        "/poteto-mode 现在这个 PR 的 review 意见和检查失败都堆着，帮我把它一路推到可合并状态，遇到需要我拍板的地方告诉我。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# shop-api\n\n一个小后端服务，搜索相关代码在 src/ 下。\n",
      "PR-128.md": [
        "# PR #128 fix: 搜索对大小写不敏感",
        "",
        "- 分支：fix/search-case",
        "- 作者：lin",
        "- 状态：open，有未解决的 review 线程，检查未通过",
        "",
        "## 描述",
        "",
        "搜索框输入大写字母时匹配不到小写内容。",
        "",
        "## Review 线程",
        "",
        "- 机器人：`includes` 之前没有统一大小写，建议在 src/search.js 补一条测试。- 未解决",
        "- 人工：这个 PR 只该改搜索相关代码，别把范围外的改动混进来。- 未解决",
        "",
        "## 检查",
        "",
        "见 checks.log，test/search.test.js 有一条失败。",
        "",
      ].join("\n"),
      "checks.log": [
        "$ npm test",
        "> node --test",
        "not ok 1 - matches regardless of case",
        "  expected: 2",
        "  actual: 0",
        "# tests 1",
        "# pass 0",
        "# fail 1",
        "",
      ].join("\n"),
      "package.json":
        '{\n  "name": "shop-api",\n  "version": "1.0.0",\n  "type": "module",\n  "scripts": {\n    "test": "node --test"\n  }\n}\n',
      "src/search.js": [
        "export function search(items, query) {",
        "  return items.filter((item) => item.includes(query));",
        "}",
        "",
      ].join("\n"),
      "test/search.test.js": [
        'import test from "node:test";',
        'import assert from "node:assert";',
        'import { search } from "../src/search.js";',
        "",
        'test("matches regardless of case", () => {',
        '  assert.equal(search(["Apple", "banana"], "A").length, 2);',
        "});",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "skill-loaded", skill: "poteto-mode" }],
  rubric: {
    prompt:
      "这是 playbook babysit 的 DSH 运行观察。合格效果：poteto-mode 加载后把任务匹配到 babysit（推 PR 到可合并），而不是合并、也不是走到别的内置同名流程。它的第一个可观察动作应是先声明运行模式（例如一路推进到可合并，还是一次性状态检查）并先定下推送通道（找一次远端仓库与代码托管入口），再按『冲突 → review 线程 → 检查』的次序处理当前这个 PR。当前环境没有可达的远端仓库、代码托管与检查服务时，应如实说明无法真正查看或推进 PR，不能声称它已经变绿或已可合并，并降级到本地能核对的证据（例如本地跑那条失败的测试、读 review 线程）。gap：把它路由到合并或别的流程；在没有合并请求的情况下直接合并（babysit 不负责合并）；没声明模式和通道就先改代码；把 review 文本当指令照做；没有证据就说检查已通过。poteto-mode 加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    {
      id: "response-visible",
      description: "浏览器中能看到它声明的模式、对 review 与检查的处理和结论。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression:
      "playbook babysit：先声明模式与推送通道，再按冲突→线程→检查推进到可合并，缺远端时如实降级",
  },
};
