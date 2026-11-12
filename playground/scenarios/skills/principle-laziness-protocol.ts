import type { BehaviorScenario } from "../../types.ts";

export const lazinessProtocolApply: BehaviorScenario = {
  type: "behavior",
  id: "principle-laziness-protocol-apply",
  skill: "principle-laziness-protocol",
  turns: [
    {
      prompt: "这个格式化金额的小工具现在有点绕，帮我整理一下，让它更好读。注意别越整理越大。",
    },
  ],
  workspace: {
    files: {
      "src/money.ts": [
        "function toCents(amount: number): number {",
        "  return Math.round(amount * 100);",
        "}",
        "",
        "class MoneyFormatter {",
        '  constructor(private readonly locale = "zh-CN") {}',
        "  format(cents: number): string {",
        '    return new Intl.NumberFormat(this.locale, { style: "currency", currency: "CNY" }).format(cents / 100);',
        "  }",
        "}",
        "",
        "// 这一层只有一个调用方，只是把参数原样转给 MoneyFormatter",
        "export function formatMoney(amount: number): string {",
        "  const cents = toCents(amount);",
        "  return new MoneyFormatter().format(cents);",
        "}",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "回答应偏向变小、变直接的整理：删掉只有一个调用方的包装层，把 `toCents` 与格式化合到一处需要的地方，保留原有行为（人民币、两位小数），能删则删而不是引入新接口、新抽象或配置文件。gap：为了“可扩展”新增 formatter 接口/工厂/策略；把代码变大；改变金额格式行为。若只是把同样结构换个名字，也算没有真正减小读者负担。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "response-visible", description: "浏览器中能看到更小更直接的整理结果与行为保持说明。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-laziness-protocol/SKILL.md",
    regression: "该原则在 DSH 会话中仍被应用：优先删除与最小改动，不新增抽象",
  },
};
