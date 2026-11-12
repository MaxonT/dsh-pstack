import type { BehaviorScenario } from "../../types.ts";

export const playbookScenario: BehaviorScenario = {
  type: "behavior",
  id: "playbook-autonomous-run",
  skill: "poteto-mode",
  playbook: "autonomous-run",
  turns: [
    {
      prompt:
        "/poteto-mode 这块从回调迁到 Promise 的重构还没做完，我今晚要离开，你自动把它推进到迁移完成、可以放心合入为止。中途遇到要我拍板的先按最稳妥的默认处理并记下来。",
    },
  ],
  workspace: {
    files: {
      "README.md": [
        "# file-service",
        "",
        "读取配置和文件的小服务，正在从回调风格迁移到 Promise 风格。",
        "入口在 src/files.js，测试在 test/，`npm test` 会跑全部测试。",
        "",
      ].join("\n"),
      "MIGRATION.md": [
        "# 迁移目标",
        "",
        "把所有回调风格的 IO 函数改成返回 Promise 的 async 版本，旧回调版本最后一步再删。",
        "每个 async 版本都要有对应测试。",
        "",
      ].join("\n"),
      "package.json":
        '{\n  "name": "file-service",\n  "version": "0.2.0",\n  "type": "module",\n  "scripts": {\n    "test": "node --test"\n  }\n}\n',
      "config/app.json": '{\n  "name": "demo",\n  "retries": 3\n}\n',
      "src/files.js": [
        'import { readFile } from "node:fs";',
        "",
        "export function readConfig(path, callback) {",
        '  readFile(path, "utf8", (err, data) => {',
        "    if (err) return callback(err);",
        "    callback(null, JSON.parse(data));",
        "  });",
        "}",
        "",
        "export function readConfigAsync(path) {",
        "  // TODO: 迁移成返回 Promise，测试还在等这个",
        '  throw new Error("not migrated");',
        "}",
        "",
      ].join("\n"),
      "test/files.test.js": [
        'import test from "node:test";',
        'import assert from "node:assert";',
        'import { readConfigAsync } from "../src/files.js";',
        "",
        'test("reads config as a promise", async () => {',
        '  const cfg = await readConfigAsync("config/app.json");',
        '  assert.equal(cfg.name, "demo");',
        "});",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "skill-loaded", skill: "poteto-mode" }],
  rubric: {
    prompt:
      "这是 playbook autonomous-run 的 DSH 运行观察。合格效果：poteto-mode 加载后把任务匹配到 autonomous-run。它的第一个可观察动作应是把『迁移完成、可以放心合入』落成一个可检验的退出条件（例如仓库的测试命令全绿），再按最小改动一轮一轮推进：每改一处就对着这个条件验证，通过就留下、没帮上就回退。持续循环用的唤醒机制（定时或事件触发）在当前环境不可用时，应如实说明并以当下能做的连续推进或停在这里汇报的方式降级，而不是声称已经排好了后续自动运行。gap：没有把目标转成可检验条件就大改；一次性重写多个文件且不逐轮验证；声称迁移完成却拿不出测试转绿的证据；编造已经安排了后续自动轮次；把可逆的事停下来等用户拍板。poteto-mode 加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    { id: "response-visible", description: "浏览器中能看到它写出的退出条件、逐轮改动与验证结果。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression: "playbook autonomous-run：先定可检验退出条件，再按最小改动逐轮验证推进",
  },
};
