import type { BehaviorScenario } from "../../types.ts";

export const buildTheLeverApply: BehaviorScenario = {
  type: "behavior",
  id: "principle-build-the-lever-apply",
  skill: "principle-build-the-lever",
  turns: [
    {
      prompt:
        "仓库里有不少文件还在用旧的标识符 oldFlag，需要全部改成 newFlag，相关的导入和引用也要一起改。我本来准备一个个文件手动搜索替换，但担心漏改，而且改完也说不清到底有没有改对、以后想重来也麻烦。帮我把这次改名推进完，让我能自己重跑并复核结果。",
    },
  ],
  workspace: {
    files: {
      "README.md": [
        "# flags-app",
        "",
        "一个持续演进的前端项目。最近把开关的标识符从 oldFlag 统一改名为 newFlag。",
        "改动范围：src/ 下所有引用与导入，以及 test/ 里的相关引用。",
        "",
      ].join("\n"),
      "src/flags.ts": [
        "export const oldFlag = true;",
        "",
        'export type FlagName = "oldFlag";',
        "",
      ].join("\n"),
      "src/a.ts": [
        'import { oldFlag } from "./flags.ts";',
        "",
        "export const aEnabled = oldFlag;",
        "",
      ].join("\n"),
      "src/b.ts": [
        'import { oldFlag } from "./flags.ts";',
        "",
        "export function useB(): boolean {",
        "  return oldFlag;",
        "}",
        "",
      ].join("\n"),
      "src/c.ts": [
        'import type { FlagName } from "./flags.ts";',
        "",
        'export const cFlag: FlagName = "oldFlag";',
        "",
      ].join("\n"),
      "test/flags.test.ts": [
        'import { oldFlag } from "../src/flags.ts";',
        'import assert from "node:assert";',
        "",
        "assert.equal(oldFlag, true);",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "no-tool-error" }],
  rubric: {
    prompt:
      "这是重复、可复核的批量改名，回复应构建一个可重跑的工具（脚本或 codemod，语言和路径不限）来完成，并在仓库里留下这个工具，而不是逐个文件手改。合格效果还应说明或体现：先在少量文件上跑通并核对结果，再把同一工具铺到其余文件，工具重跑安全（幂等），并能用一个可观察的检查复核（例如再跑一次无改动，或全仓搜索旧标识符为空）。gap：逐个文件手动改；只在文字里给步骤而没有任何可重跑的工具产物；声称改完却没有运行或复核证据。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    {
      id: "response-visible",
      description: "浏览器中能看到完整回复，回复给出可重跑工具的做法与复核方式。",
    },
    {
      id: "artifact-visible",
      description: "人工确认仓库里留下了可重跑的改名工具，并能看到它的运行或复核结果。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-build-the-lever/SKILL.md",
    regression:
      "该原则在 DSH 会话中仍被应用：重复批量改名时构建可重跑、可复核的工具，而不是手工逐条改",
  },
};
