import type { BehaviorScenario } from "../../types.ts";

export const playbookScenario: BehaviorScenario = {
  type: "behavior",
  id: "playbook-eval",
  skill: "poteto-mode",
  playbook: "eval",
  turns: [
    {
      prompt:
        "/poteto-mode 我这里有两个版本的提示词，想比较它们在同一个编码任务上哪个效果更好。帮我把这个对比做得能复跑，最后给我一个有依据的结论和推荐。",
    },
  ],
  workspace: {
    files: {
      "README.md": [
        "# prompt-compare",
        "",
        "两个版本的提示词放在 prompts/ 下，指向同一个编码任务。",
        "project/ 是那个任务的起始骨架。",
        "",
      ].join("\n"),
      "prompts/v1.md": [
        "给这个 todo 小项目加一个按完成状态筛选的功能，自己看着把测试补上。",
        "",
      ].join("\n"),
      "prompts/v2.md": [
        "在 src/todo.js 里实现 filterByDone(items, done)，返回 done 字段等于传入值的项；在 test/todo.test.js 里加两条断言覆盖 true 和 false。",
        "",
      ].join("\n"),
      "project/README.md": "# todo\n\n一个最小的 todo 库，入口 src/todo.js，测试在 test/。\n",
      "project/package.json":
        '{\n  "name": "todo",\n  "version": "1.0.0",\n  "type": "module",\n  "scripts": {\n    "test": "node --test"\n  }\n}\n',
      "project/src/todo.js": [
        "export function addTodo(items, text) {",
        "  return [...items, { text, done: false }];",
        "}",
        "",
        "export function filterByDone(items, done) {",
        "  // TODO: 待实现",
        "  return items;",
        "}",
        "",
      ].join("\n"),
      "project/test/todo.test.js": [
        'import test from "node:test";',
        'import assert from "node:assert";',
        'import { addTodo } from "../src/todo.js";',
        "",
        'test("adds a todo", () => {',
        '  assert.equal(addTodo([], "x").length, 1);',
        "});",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "skill-loaded", skill: "poteto-mode" }],
  rubric: {
    prompt:
      "这是 playbook eval 的 DSH 运行观察。合格效果：poteto-mode 加载后把任务匹配到 eval，而不是直接给一句『哪个提示词更好』的看法。它的第一个可观察动作应是先把实验框起来：说明被测的是哪个版本、什么算成功（给出 3 到 6 条只给判读者用的标准），并为每个候选准备一份净化过的工作副本——候选看到的提示要像一个自然的用户请求，不能出现对比、测量、评分之类的字样。接着让候选在同一任务上各自产出，再用盲评方式对比。当前环境缺少并行多模型候选或盲评判读者时，应如实说明并降级（例如能跑就跑、串行做，或说明限制），而不是编造候选产出或编出一个评判结论。gap：只看一眼就断言哪个提示词更好；把测量/对比字样泄漏进候选提示；伪造候选结果或评判结论；声称做了对比却没真正跑过。poteto-mode 加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    {
      id: "response-visible",
      description: "浏览器中能看到实验设计、每个候选的说明与最终综合结论。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression:
      "playbook eval：先框定成功率标准并净化候选环境，再跑候选与盲评，缺并行/评委时如实降级",
  },
};
