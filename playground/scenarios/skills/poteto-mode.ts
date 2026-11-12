import type { BehaviorScenario } from "../../types.ts";

const runtimerWorkspace = {
  files: {
    "package.json":
      '{\n  "name": "runtimer",\n  "version": "1.0.0",\n  "type": "module",\n  "bin": { "runtimer": "src/cli.js" },\n  "scripts": { "start": "node src/cli.js", "test": "node --test" }\n}\n',
    "README.md":
      "# runtimer\n\n一个小型命令行工具。运行 `npm start` 会执行一次模拟任务并打印本次耗时（毫秒）。目前它不保存任何历史。\n",
    "src/cli.js": [
      "const start = Date.now();",
      "let total = 0;",
      "for (let i = 0; i < 3_000_000; i += 1) total += i % 7;",
      "const elapsed = Date.now() - start;",
      "console.log(`run took ${elapsed}ms (checksum ${total})`);",
      "",
    ].join("\n"),
    "test/run.test.js": [
      'import test from "node:test";',
      'import assert from "node:assert";',
      "",
      'test("cli source runs to completion", () => {',
      "  assert.ok(true);",
      "});",
      "",
    ].join("\n"),
  },
};

export const potetoModeFeatureRigor: BehaviorScenario = {
  type: "behavior",
  id: "poteto-mode-feature-rigor",
  skill: "poteto-mode",
  turns: [
    {
      prompt:
        "/poteto-mode 我在这个工作区维护一个小型命令行工具。现在想加个功能：每次运行把耗时记到本地历史文件里，之后能打印最近若干次运行的中位数耗时，以及慢于某个阈值的运行次数。先说说你打算怎么改，再动手，改完证明它确实按预期工作。",
    },
  ],
  workspace: runtimerWorkspace,
  assertions: [{ kind: "turn-completed" }, { kind: "skill-loaded", skill: "poteto-mode" }],
  rubric: {
    prompt:
      "这是 poteto-mode 风格下的一次真实功能请求。合格效果：poteto-mode 加载后把任务匹配到对应的 Feature 流程并按其风格推进——先用一句话复述用户目标并点出满足它的最小改动；编码前先说明要处理的核心数据形状（例如一条运行记录有哪些字段、历史文件以什么形式存在、怎么读写）和承载它的组织方式，而不是直接堆条件分支；实现保持最小、克制，不引入多余抽象；完成后对真实产物做验证（实际运行命令或测试）并给出可核对的证据；并在回复里点名塑造了决策的原则及其改变的具体选择。若环境缺少子代理或渲染能力，可如实说明并给出可复现的验证方式，不据此判 gap。gap：没匹配到 Feature 就直接写代码；没有命名数据形状；没有最小改动判断；只给计划不落地且无说明；声称验证通过却拿不出测试或运行证据。poteto-mode 加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    {
      id: "response-visible",
      description: "浏览器中能看到数据形状说明、最小改动、实现与验证证据的完整回复。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression: "把功能请求匹配到 Feature playbook，先命名数据形状与最小改动，再实现并真实验证",
  },
};
