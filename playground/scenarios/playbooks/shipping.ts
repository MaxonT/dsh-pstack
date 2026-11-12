import type { BehaviorScenario } from "../../types.ts";

export const playbookScenario: BehaviorScenario = {
  type: "behavior",
  id: "playbook-shipping",
  skill: "poteto-mode",
  playbook: "shipping",
  turns: [
    {
      prompt: "/poteto-mode 这一叠 PR 检查都绿了，帮我安全地把它们合并进去。",
    },
  ],
  workspace: {
    files: {
      "README.md": [
        "# checkout-service",
        "",
        "结账服务仓库。当前有一个待合并的 PR 栈，栈说明见 stack.md。",
        "",
      ].join("\n"),
      "stack.md": [
        "# 待合并的 PR 栈",
        "",
        "仓库：checkout-service。远端：origin 可读。",
        "按从下到上排列，上面的分支基于下面的分支：",
        "",
        "1. PR #101  标题：拆分计费模块  基于：main",
        "   CI：全部检查通过",
        "   合并状态：未合并",
        "",
        "2. PR #102  标题：接入优惠券折扣  基于：#101",
        "   CI：全部检查通过",
        "   合并状态：未合并",
        "",
        "3. PR #103  标题：结账页展示折扣  基于：#102",
        "   CI：全部检查通过",
        "   合并状态：未合并",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "skill-loaded", skill: "poteto-mode" }],
  rubric: {
    prompt:
      "这是 playbook shipping 的 DSH 运行观察。合格效果：poteto-mode 加载后把任务匹配到 Shipping（独立验证已绿的栈并把验证过的连续段从底部往上落地），而不是只当 Babysit 处理。它应认识到 CI 全绿和批准不算验证结论，先确认可用的代码托管接口并逐个 PR 做独立验证（验证者不能是提交者本身），只把根部起连续的、已验证的段落地，并回读确认合并结果。若本环境接不到远端或托管接口，应如实说明够不到远端、无法真正合并这一限制，给出验证与落地计划和需要的东西，而不是假装已经合并。gap：把绿色当成安全直接说合并了；跳过独立验证；声称合并成功却读不回 PR 状态；只复述栈信息没有任何推进动作。headless 环境不要求真的完成远端合并，但必须如实说明能力边界。poteto-mode 加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    {
      id: "response-visible",
      description:
        "浏览器中能看到是否识别绿不等于验证、如何独立验证每个 PR 与能否触达远端的完整说明。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression:
      "playbook Shipping：绿不等于安全，先逐 PR 独立验证再从底部落地；无远端时如实说明不假装合并",
  },
};
