import type { BehaviorScenario } from "../../types.ts";

export const typescriptBestPractices: BehaviorScenario = {
  type: "behavior",
  id: "typescript-best-practices-user-state",
  skill: "typescript-best-practices",
  turns: [
    {
      prompt:
        "src/user.ts 的类型定义太松，运行时总是出问题。帮我按 TypeScript 的类型最佳实践把它收紧，让错误尽量在编译期就暴露，同时保持运行时行为不变。",
    },
  ],
  workspace: {
    files: {
      "tsconfig.json": `{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler"
  },
  "include": ["src"]
}
`,
      "src/user.ts": [
        "type LoadState = {",
        "  loading: boolean;",
        "  data?: { id: string; name: string };",
        "  error?: string;",
        "};",
        "",
        "export function parseUser(input: any): { id: string; name: string } {",
        "  return input as { id: string; name: string };",
        "}",
        "",
        "export function renderUser(state: LoadState): string {",
        '  if (state.loading) return "loading";',
        '  if (state.error) return "error: " + state.error;',
        "  return state.data!.name;",
        "}",
        "",
      ].join("\n"),
    },
  },
  assertions: [
    { kind: "turn-completed" },
    { kind: "artifact-contains", path: "src/user.ts", text: "renderUser" },
  ],
  rubric: {
    prompt:
      "这是观察 typescript-best-practices 是否把松散类型收紧到非法状态无法表示，同时不改变运行时行为。合格效果：把外部输入从 any 改为不可信类型（如 unknown）并在边界校验解析成命名域类型，去掉未校验的 as 与非空断言，用带字面量判别式的可辨识联合替代 loading/data/error 这样的可选字段袋，并在分支或 default 里体现穷尽性；如需区分 id 之类的基本类型，可用品牌类型避免混用。renderUser 的运行时可观察输出保持不变。gap：只加载技能；只把 any 换成 unknown 却仍保留可选字段袋或未校验的 as，非法状态仍可构造；或改动导致运行时行为变化。若采用基于 schema 的解析而不写 unknown 字面量，只要外部输入仍被当作不可信并解析成命名类型，也算合格。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "response-visible", description: "浏览器中能看到类型改造的说明与取舍。" },
    {
      id: "typed-file-visible",
      description:
        "工作区能看到 src/user.ts 出现可辨识联合与边界校验，未校验的 as 与非空断言被移除，assistant 说明了取舍。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/typescript-best-practices/SKILL.md",
    regression:
      "覆盖 typescript-best-practices 主路径：把 any 收成不可信类型并在边界解析成命名类型、把可选字段袋换成带字面量判别式的联合、移除未校验的 as 与非空断言；只要非法状态还能构造即为回归。",
  },
};
