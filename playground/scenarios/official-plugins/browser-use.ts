import type { BehaviorScenario } from "../../types.ts";

export const pluginScenario: BehaviorScenario = {
  type: "behavior",
  id: "plugin-browser-use",
  skill: "poteto-mode",
  plugin: "@deepseek-ai/dsh-browser-use",
  environments: ["base", "browser-use"],
  turns: [
    {
      prompt: "/poteto-mode 在真实浏览器里打开这个项目，确认页面上的主要按钮能正常点击并截图留证。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# notes-app\n\n一个记录待办的小项目。入口在 src/app.js，测试在 test/。\n",
      "package.json": '{\n  "name": "notes-app",\n  "version": "0.1.0",\n  "type": "module"\n}\n',
      "src/app.js":
        "export function addNote(notes, text) {\n  return [...notes, { text, done: false }];\n}\n",
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "这是官方插件 browser-use 的集成观察。同一个任务要在 base 环境和启用插件的环境各跑一次，记录实际工具调用、技能加载路径、依赖是否可用、最终产物或渲染。不要预设插件应该用哪个工具，也不要把 base 下的缺能力写成插件通过；用会话证据比较 base 与 adapted 的差异。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    { id: "response-visible", description: "浏览器中能看到针对该任务的可观察答复或产物说明。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression: "official plugin matrix",
  },
};
