import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "conflict-agent-team-spawn-contract",
  capability: "agent-team.spawn-contract",
  phases: ["adapted"],
  turns: [
    {
      prompt:
        "先分别用两种派发方式各起一个执行者：用 pstack_subagent 起一个子代理统计 README 的字数，再用 spawn_teammate 起一个叫 helper 的 teammate 统计 README 的行数。两边都跑完后，把它们返回的标识和结果差异列给我。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# conflict-agent-team-spawn-contract\n\n能力探测。\n第二行。\n第三行。\n",
      "src/a.ts": "export const a = 1;\n",
    },
  },
  assertions: [
    {
      kind: "turn-completed",
    },
  ],
  rubric: {
    prompt:
      "用户能看到 pstack_subagent 与 spawn_teammate 各自成功，并说明两者返回标识的差异，例如 pstack 子代理 id 和 team target。若其中一套不可用、或模型把两者混为一谈，记为差异或冲突。",
  },
  uiObservations: [
    {
      id: "spawn-diff",
      description: "浏览器中能看到两种派发方式各自的返回标识与结果。",
    },
  ],
};

export default scenario;
