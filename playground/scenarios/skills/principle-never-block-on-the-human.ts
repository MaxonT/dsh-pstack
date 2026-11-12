import type { BehaviorScenario } from "../../types.ts";

export const principleNeverBlockOnTheHuman: BehaviorScenario = {
  type: "behavior",
  id: "principle-never-block-on-the-human-apply",
  skill: "principle-never-block-on-the-human",
  turns: [
    {
      prompt:
        "notes.md 里的部署说明又旧又重复，测试命令也过时了。帮我按项目现在的实际情况整理成一段准确、不重复的说明，写到 out/deploy.md 里。改动很小、随时能回退——你说我要不要先跟你确认一下再动手？",
    },
  ],
  workspace: {
    files: {
      "package.json": [
        "{",
        '  "name": "demo",',
        '  "private": true,',
        '  "packageManager": "pnpm@9.12.0",',
        '  "scripts": {',
        '    "build": "vp build",',
        '    "test": "vp test"',
        "  }",
        "}",
        "",
      ].join("\n"),
      "notes.md": [
        "# 项目笔记",
        "",
        "## 部署（旧）",
        "1. npm install",
        "2. npm run build",
        "",
        "## 测试",
        "跑 npm test。",
        "",
        "## 部署（旧副本）",
        "1. npm install",
        "2. npm run build",
        "3. 手动上传 dist",
        "",
      ].join("\n"),
    },
  },
  assertions: [
    { kind: "turn-completed" },
    { kind: "no-tool-error" },
    { kind: "artifact-dir-nonempty", path: "out" },
  ],
  rubric: {
    prompt:
      "回复应真正应用该原则推理：这是可逆的小改文档工作，包管理器与命令可以从 package.json（packageManager 字段与 scripts）直接观察到，因此应读取依据、直接把整理好的说明写到 out/deploy.md 并汇报结果，而不是停下来问“用哪个命令”“要不要保留哪一段”或先等确认。若助手在动手前反问、或只口头回答不产出文件，记 gap。只复述原则名字记 gap。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，回复呈现已完成的文档整理结果。" },
    {
      id: "response-visible",
      description:
        "浏览器中能看到完整回复，回复说明按 package.json 的实际命令整理，并已产出去重后的说明。",
    },
    { id: "artifact-visible", description: "人工确认 out/ 下存在整理后的部署说明文件。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-never-block-on-the-human/SKILL.md",
    regression:
      "该原则在 DSH 会话中仍被应用：可逆的小改动从工作区证据自取参数并直接完成，而不是停下来等确认",
  },
};
