import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "conflict-agent-team-send-message-contract",
  capability: "agent-team.send-message-contract",
  phases: ["adapted"],
  turns: [
    {
      prompt:
        "用 pstack_subagent 起一个子代理，先让它数 src 里的文件数。然后让它接着数注释行数，确认是同一个执行者续跑，不是新起一个。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# conflict-agent-team-send-message-contract\n\n能力探测。\n",
      "src/a.ts": "export const a = 1; // one\n",
      "src/b.ts": "export const b = 2; // two\n",
    },
  },
  assertions: [
    {
      kind: "turn-completed",
    },
  ],
  rubric: {
    prompt:
      "用户能看到同一个 pstack 子代理被续跑，并给出文件数和注释行数两步结果。若续跑失败、报找不到目标，或另起了一个新执行者，记为缺口。",
  },
  uiObservations: [
    {
      id: "send-message-diff",
      description: "浏览器中能看到 send_message 是否续上原 pstack 子代理并给出两步结果。",
    },
  ],
};

export default scenario;
