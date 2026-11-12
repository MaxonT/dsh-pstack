import type { BehaviorScenario } from "../../types.ts";

export const playbookScenario: BehaviorScenario = {
  type: "behavior",
  id: "playbook-prototype",
  skill: "poteto-mode",
  playbook: "prototype",
  turns: [
    {
      prompt:
        "/poteto-mode 筛选面板我想比较两种做法：放左侧边栏，还是收在顶部下拉里。做个能跑的原型把两种都做出来对比一下，用实际效果决定选哪种，原型和结论放到 out/ 下。",
    },
  ],
  workspace: {
    files: {
      "README.md": [
        "# bookmarks",
        "",
        "一个小书签页，列表按收藏时间倒序。",
        "现在只有一个单列布局，筛选面板还没定，产品想先看到两种做法实际长什么样再决定。",
        "",
      ].join("\n"),
      "app/index.html": [
        "<!doctype html>",
        '<html lang="zh">',
        "  <head>",
        '    <meta charset="utf-8" />',
        "    <title>bookmarks</title>",
        '    <link rel="stylesheet" href="./style.css" />',
        "  </head>",
        "  <body>",
        '    <main id="app"></main>',
        '    <script type="module" src="./main.js"></script>',
        "  </body>",
        "</html>",
        "",
      ].join("\n"),
      "app/main.js": [
        "const items = [",
        '  { title: "设计系统", tags: ["design"] },',
        '  { title: "性能清单", tags: ["perf"] },',
        '  { title: "读书笔记", tags: ["reading"] },',
        "];",
        "",
        'document.querySelector("#app").textContent = items',
        "  .map((item) => item.title)",
        '  .join(" , ");',
        "",
      ].join("\n"),
      "app/style.css": [
        "body {",
        "  font-family: system-ui, sans-serif;",
        "  margin: 24px;",
        "}",
        "",
        "main {",
        "  max-width: 640px;",
        "}",
        "",
      ].join("\n"),
    },
  },
  assertions: [
    { kind: "turn-completed" },
    { kind: "skill-loaded", skill: "poteto-mode" },
    { kind: "artifact-dir-nonempty", path: "out" },
  ],
  rubric: {
    prompt:
      "这是 playbook prototype 的 DSH 运行观察。合格效果：poteto-mode 加载后把任务匹配到 Prototype（为一个设计取舍服务，产物是一次性原型而非可交付代码），把要决定的问题界定为筛选面板的布局取舍，在与生产源码分开的临时目录（out/ 下）搭一个能跑的一次性原型，把两种做法都实现并能在同一处切换对比，用实际运行/渲染效果观察差异，再给出取舍与推荐，并说明原型是一次性的、选定方向再交给 Feature 正式实现。环境缺少浏览器或截图能力时，用另一种可观察方式（渲染出的 HTML、日志等）验证并如实说明，不因此判 gap。gap：直接在 app/ 生产源码里写最终实现；只描述两种方案却不真正做出来跑起来；没有任何实际观察证据就宣布选哪个；把原型当成可上线代码交付。poteto-mode 加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    { id: "artifact-visible", description: "浏览器或文件列表中能看到 out/ 下的一次性原型。" },
    { id: "variants-readable", description: "人工确认原型里两种筛选布局都能看到并能切换对比。" },
    {
      id: "response-visible",
      description: "浏览器中能看到两种方案的对比证据、取舍与推荐的完整回复。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression: "playbook Prototype：为设计取舍搭一次性原型，对比观察后给推荐，不写生产代码",
  },
};
