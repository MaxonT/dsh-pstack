import type { BehaviorScenario } from "../../types.ts";

export const broPlainRestate: BehaviorScenario = {
  type: "behavior",
  id: "bro-plain-restate",
  skill: "bro",
  turns: [
    {
      prompt:
        "我们准备把订单服务里的同步 RPC 调用改成事件驱动，通过 outbox 表做最终一致，读路径走物化视图，写路径走命令总线，同时用幂等键去重。你怎么看这套改造？",
    },
    {
      prompt: "/bro 用大白话把你刚才那段再讲一遍，别用行话。",
    },
  ],
  workspace: {
    files: { "README.md": "# order-service\n\n订单服务，当前用同步 RPC 调其他服务。\n" },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "bro 的效果成立的标志：把上一条回复用平实的人话重讲一遍，去掉 outbox、最终一致、物化视图、命令总线、幂等键这类行话或当场解释成人话，句子短，像一个人跟另一个人说话；意思与原回复一致，不新增结论、不丢关键意思。gap：仍堆砌术语；只做同义词替换没有真正讲清；改变或新增了原回复没有的判断。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "两轮对话都自然结束，没有自动点击停止。" },
    { id: "response-visible", description: "浏览器中能看到平实重述的完整回复。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/bro/SKILL.md",
    regression: "主路径：把上一条技术回复改写成无行话的人话",
  },
};
