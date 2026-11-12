import type { BehaviorScenario } from "../../types.ts";

export const principleRedesignFromFirstPrinciples: BehaviorScenario = {
  type: "behavior",
  id: "principle-redesign-from-first-principles-apply",
  skill: "principle-redesign-from-first-principles",
  turns: [
    {
      prompt:
        "config.ts 现在只支持生产环境，我们测试环境要能连 staging 的数据库。我在想直接在原来的加载函数里加个 if 判断环境变量就够了。你帮我看看这个改动该怎么做才好。",
    },
  ],
  workspace: {
    files: {
      "config.ts": [
        "export function loadConfig() {",
        "  return {",
        '    env: "production",',
        '    dbUrl: process.env.DB_URL ?? "postgres://localhost/app",',
        "  };",
        "}",
        "",
      ].join("\n"),
      "server.ts": [
        'import { loadConfig } from "./config.ts";',
        "",
        "export function start() {",
        "  const config = loadConfig();",
        '  console.log("starting in", config.env, "against", config.dbUrl);',
        "}",
        "",
      ].join("\n"),
      "README.md": [
        "# service",
        "",
        "服务目前只有生产配置，入口 config.ts 的 loadConfig 返回单一配置对象。",
        "server.ts 直接消费 config.env 与 config.dbUrl。",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "no-tool-error" }],
  rubric: {
    prompt:
      "回复应真正应用该原则推理：不是往 loadConfig 里塞一个 if 就完事，而是先读相关文件，设想“如果一开始就要求多环境，这个配置会怎么设计”，按环境把配置建模（例如按 env 区分的类型化配置或判别联合），并把改动传播到类型、调用方、示例和文档；整体先想清楚，再增量交付。gap：照旧在加载函数里加一个 if 就交差；只喊口号或只复述原则名字；没有考虑调用方与文档要一起改。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，回复给出针对配置新增环境要求的判断。" },
    {
      id: "response-visible",
      description: "浏览器中能看到完整回复，回复按环境建模并说明要一起改动的类型、调用方与文档。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-redesign-from-first-principles/SKILL.md",
    regression: "该原则在 DSH 会话中仍被应用：把多环境当既有前提重新设计，而不是在旧函数上打补丁",
  },
};
