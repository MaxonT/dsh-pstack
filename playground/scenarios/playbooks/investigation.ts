import type { BehaviorScenario } from "../../types.ts";

export const playbookScenario: BehaviorScenario = {
  type: "behavior",
  id: "playbook-investigation",
  skill: "poteto-mode",
  playbook: "investigation",
  turns: [
    {
      prompt:
        "/poteto-mode 这个服务启动后先读配置、再渲染待办列表，我想弄清楚它现在到底怎么跑起来的：入口在哪，数据怎么一步步流动，哪一步失败会被悄悄吞掉。只读调查，别改代码，给我带文件位置的说明。",
    },
  ],
  workspace: {
    files: {
      "README.md": [
        "# config-render",
        "",
        "一个很小的服务：启动后读配置，再渲染待办列表。",
        "入口在 src/main.js，配置按当前工作目录下的 ./config/app.json 读取。",
        "",
      ].join("\n"),
      "package.json": [
        "{",
        '  "name": "config-render",',
        '  "version": "0.1.0",',
        '  "type": "module"',
        "}",
        "",
      ].join("\n"),
      "src/main.js": [
        'import { renderItems } from "./render.js";',
        "",
        "const items = [",
        '  { text: "写周报", done: false },',
        '  { text: "跑测试", done: true },',
        "];",
        "",
        'console.log("rendered:", renderItems(items));',
        "",
      ].join("\n"),
      "src/render.js": [
        'import { loadConfig } from "./config.js";',
        "",
        "export function renderItems(items) {",
        "  const { showDone, pageSize } = loadConfig();",
        "  const visible = showDone ? items : items.filter((item) => !item.done);",
        "  return visible.slice(0, pageSize);",
        "}",
        "",
      ].join("\n"),
      "src/config.js": [
        'import { readFileSync } from "node:fs";',
        "",
        "export function loadConfig() {",
        "  try {",
        '    return JSON.parse(readFileSync("./config/app.json", "utf8"));',
        "  } catch {",
        "    // 读不到或解析失败就当作默认配置，不抛错也不提示",
        "    return { showDone: false, pageSize: 20 };",
        "  }",
        "}",
        "",
      ].join("\n"),
      "config/app.json": ["{", '  "showDone": true,', '  "pageSize": 20,', "}", ""].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "skill-loaded", skill: "poteto-mode" }],
  rubric: {
    prompt:
      "这是 playbook investigation 的 DSH 运行观察。合格效果：poteto-mode 加载后把任务匹配到 Investigation，按只读调查推进，先读工作区真实文件，产出带文件位置引用的说明（概览、关键概念、工作方式、各部分在哪、坑），可提供如何/为什么的走查，且不修改代码、不开 PR。工作区证据应能推出这条链路：入口 src/main.js 调 src/render.js 的 renderItems，再由 src/config.js 的 loadConfig 读取 ./config/app.json；该文件带尾逗号使 JSON.parse 抛错，catch 静默返回默认值 {showDone:false,pageSize:20}，于是已完成项被无声过滤掉，这就是被吞掉的失败点。gap：直接改代码或声称开了 PR；说明没有引用真实文件而是泛泛而谈；漏掉 loadConfig 静默兜底这个失败被吞的环节；凭空编造行为。若 how/why 等技能或运行工具不可用，如实说明并给出等价文字说明即可，不因此判 gap。poteto-mode 加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    { id: "response-visible", description: "浏览器中能看到带文件位置引用的只读调查说明。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression: "playbook Investigation：只读调查，how 形态的带引用说明，不产生代码改动",
  },
};
