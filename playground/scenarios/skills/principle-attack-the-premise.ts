import type { BehaviorScenario } from "../../types.ts";

export const attackThePremiseApply: BehaviorScenario = {
  type: "behavior",
  id: "principle-attack-the-premise-apply",
  skill: "principle-attack-the-premise",
  turns: [
    {
      prompt:
        "feature flag 改了好几版都不生效。第一个修复以为是解析顺序问题，调整了解析顺序，还是没生效；第二个修复以为是缓存，清了缓存，还是没生效。现在准备上第三个修复：再加一次定时 reload。先别直接写第三个修复，你觉得接下来该怎么推进？",
    },
  ],
  workspace: {
    files: {
      "src/config.ts": [
        'import { readFileSync } from "node:fs";',
        "",
        "export function loadConfig(): Record<string, unknown> {",
        "  try {",
        '    const raw = readFileSync("./config/app.json", "utf8");',
        "    return JSON.parse(raw);",
        "  } catch {",
        "    // 读不到或解析失败就当作空配置，不抛错",
        "    return {};",
        "  }",
        "}",
        "",
        "export const config = loadConfig();",
        "export const featureX = Boolean(config.featureX);",
        "",
      ].join("\n"),
      "src/server.ts": [
        'import { config, featureX } from "./config.ts";',
        "",
        "export function start() {",
        '  console.log("starting server, config =", JSON.stringify(config));',
        '  console.log("featureX enabled:", featureX);',
        "}",
        "",
        "if (import.meta.main) start();",
        "",
      ].join("\n"),
      "config/app.json": '{\n  "featureX": true\n}\n',
      "run.log": [
        "$ node dist/server.js",
        "starting server, config = {}",
        "featureX enabled: false",
        "$ ls dist/config 2>&1",
        "ls: cannot access 'dist/config': No such file or directory",
        "",
      ].join("\n"),
      "package.json": '{\n  "name": "flags-app",\n  "version": "0.1.0",\n  "type": "module"\n}\n',
      "fixes.md": [
        "# 已尝试的修复",
        "- fix 1：调整配置解析顺序（无效）",
        "- fix 2：清理配置缓存（无效）",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "no-tool-error" }],
  rubric: {
    prompt:
      "回复应先写出两次失败修复共享的前提——『应用在启动时已经成功加载了配置文件』——然后用工作区证据直接检验这个前提，而不是直接给第三个修复。工作区证据显示这个前提是假的：`loadConfig` 在 `readFileSync` 失败时静默返回 `{}`，而运行日志里 `config = {}` 且 `dist/config` 目录不存在，说明配置文件根本没被读到；定时 reload、解析顺序、缓存都不是根因。正确的下一步是修复加载本身（路径/工作目录）或让被吞掉的加载错误暴露出来，并说明前两个修复为何无效。gap：直接提第三个修复却没有检验前提；只复述原则名字而没有针对本工作区的验证；声称前提成立却没有给出可观察证据。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    {
      id: "response-visible",
      description: "浏览器中能看到完整回复，回复写出共享前提并给出针对工作区的验证。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-attack-the-premise/SKILL.md",
    regression:
      "该原则在 DSH 会话中仍被应用：从工作区证据归纳并检验共享前提，而不是接受提示里的结论",
  },
};
