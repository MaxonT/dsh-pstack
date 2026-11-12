import type { BehaviorScenario } from "../../types.ts";

export const encodeLessonsInStructureApply: BehaviorScenario = {
  type: "behavior",
  id: "principle-encode-lessons-in-structure-apply",
  skill: "principle-encode-lessons-in-structure",
  turns: [
    {
      prompt:
        "这几周的代码评审里，我至少两次提醒同一件事：不要用 any，提交前要跑静态检查并保持零警告。其实贡献指南里早就写了这两条，可还是反复出现。我打算再写一份更详细的检查清单发到群里。你觉得最能减少这种反复提醒的做法是什么？",
    },
  ],
  workspace: {
    files: {
      "CONTRIBUTING.md": [
        "# 提交规范",
        "",
        "- 提交前请运行静态检查，保持零警告。",
        "- 代码里避免使用 any，用具体类型代替。",
        "",
      ].join("\n"),
      "reviews/pr-101.md": [
        "# PR 101 review",
        "",
        "- src/report.ts 里又出现了 any，请换成具体类型。",
        "- 提交前请跑静态检查，这次有一堆警告。",
        "",
      ].join("\n"),
      "reviews/pr-118.md": [
        "# PR 118 review",
        "",
        "- 还是 any……这块也请改掉。",
        "- 静态检查的警告没清，提交前要清零。",
        "",
      ].join("\n"),
      "src/report.ts": [
        "export function summarize(rows: any[]): string {",
        '  return rows.map((row: any) => String(row)).join(",");',
        "}",
        "",
      ].join("\n"),
      "tsconfig.json": [
        "{",
        '  "compilerOptions": {',
        '    "target": "ES2022",',
        '    "module": "ESNext",',
        '    "strict": false,',
        '    "noImplicitAny": false',
        "  }",
        "}",
        "",
      ].join("\n"),
      "package.json": [
        "{",
        '  "name": "reports-app",',
        '  "version": "0.1.0",',
        '  "type": "module",',
        '  "scripts": {',
        '    "test": "node --test"',
        "  }",
        "}",
        "",
      ].join("\n"),
      ".github/workflows/ci.yml": [
        "name: ci",
        "on: [push, pull_request]",
        "jobs:",
        "  check:",
        "    runs-on: ubuntu-latest",
        "    steps:",
        "      - run: node --test",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "no-tool-error" }],
  rubric: {
    prompt:
      "注意工作区证据：贡献指南里这两条规范早就以文字形式存在，评审记录里同一纠正至少出现了两次（PR 101 与 PR 118），说明再写更多文字不会生效。回复应把这条反复出现的纠正固化成可自动执行的结构，例如开启更严格的类型检查让隐式 any 直接报错、加一条静态检查规则、加 CI 门禁、pre-commit 钩子或可复跑脚本，让违规直接失败，而不是靠人反复提醒；并指出既然文字规范已存在仍复发，继续加固文字不是解法。gap：只是把检查清单写得更长或更醒目、或建议在群里反复提醒；只复述原则名字而没有给出任何可执行的强制机制；给出的方案仍只是文字规范，无法自动拦截。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    {
      id: "response-visible",
      description: "浏览器中能看到完整回复，回复给出把反复纠正固化为自动检查或门禁的具体机制。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-encode-lessons-in-structure/SKILL.md",
    regression:
      "该原则在 DSH 会话中仍被应用：同一条纠正第二次出现时，用结构（类型/检查/门禁/脚本）固化，而不是再写一段文档",
  },
};
