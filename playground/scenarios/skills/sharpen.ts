import type { BehaviorScenario } from "../../types.ts";

export const sharpenDeepenPrompt: BehaviorScenario = {
  type: "behavior",
  id: "sharpen-deepen-prompt",
  skill: "sharpen",
  turns: [
    {
      prompt: "/sharpen 帮我给订单服务加一个缓存层，减少数据库压力。",
    },
  ],
  workspace: {
    files: {
      "README.md":
        "# order-service\n\n订单读多写少，热点集中在近期订单查询。数据库在促销时会顶不住。\n",
      "src/orders.js":
        'export async function getOrder(id) {\n  return db.query("select * from orders where id = ?", [id]);\n}\n',
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "sharpen 的效果成立的标志：不直接实现，而是先说明 top 专业人士会多做哪些事、会从哪些更原始的材料入手、会用哪些具体方法与工具、以及除模型和用户之外什么能证明结果正确，然后把原需求重写成更深入（不是更大）的提示词；属于用户自己的取舍（例如一致性 vs 延迟、缓存介质）应留空让用户决定，而不是替用户拍板。gap：直接开始写缓存代码；只把提示词写得更长而没有更深入；替用户决定了本该用户选的取舍。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    { id: "response-visible", description: "浏览器中能看到深入版提示词与四点说明，且未直接实现。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/sharpen/SKILL.md",
    regression: "主路径：给出更深入的提示词并保留用户取舍",
  },
};
