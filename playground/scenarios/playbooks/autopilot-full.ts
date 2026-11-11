import type { BehaviorScenario } from "../../types.ts";

export const playbookScenario: BehaviorScenario = {
  type: "behavior",
  id: "playbook-autopilot-full",
  skill: "poteto-mode",
  playbook: "autopilot-full",
  turns: [
    {
      prompt:
        "/poteto-mode 这几张 PR 你全自动推进到合并，先自己建 PR、跑 CI、处理 review，再逐个验证后落地。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# notes-app\n\n一个记录待办的小项目。入口在 src/app.js，测试在 test/。\n",
      "package.json": '{\n  "name": "notes-app",\n  "version": "0.1.0",\n  "type": "module"\n}\n',
      "src/app.js":
        "export function addNote(notes, text) {\n  return [...notes, { text, done: false }];\n}\n",
      "test/app.test.js":
        'import test from "node:test";\nimport assert from "node:assert";\nimport { addNote } from "../src/app.js";\n\ntest("adds a note", () => {\n  assert.equal(addNote([], "hi").length, 1);\n});\n',
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "这是 playbook autopilot-full 的 DSH 运行观察。只记录 poteto-mode 是否加载、实际读取了哪个 playbooks/*.md、它引用的技能或工具是否可用、加载或降级、最终是否有可观察答复或产物。不要预设 DSH 能力或缺口；缺失、失败或降级都按会话证据记录，不因此直接判通过。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    { id: "response-visible", description: "浏览器中能看到针对该任务的可观察答复或产物说明。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression: "playbook routing and dependency observation",
  },
  dependencies: ["deslop", "no-comments", "control-ui", "control-cli"],
};
