import type { BehaviorScenario } from "../../types.ts";

export const createFormalVerificationSkillLeaseMutex: BehaviorScenario = {
  type: "behavior",
  id: "create-formal-verification-skill-lease-mutex",
  skill: "create-formal-verification-skill",
  turns: [
    {
      prompt:
        "`src/lease.ts` 里的租约实现必须在任何并发交错下都保证『同一时刻最多只有一个持有者』。单元测试覆盖不到这种时序，我想要更强的保证。请为它做正式验证：把这条性质用代码里的说法讲清楚，做一次真正能失败的检查——如果当前实现满足性质就证明，不满足就给出反例；并做成一个下一个代理能直接复跑的验证技能。如果你判断环境里没有合适的验证工具，请如实说明缺的是哪类能力，并给出一个具体能落地的降级做法，不要假装已经验证通过。",
    },
  ],
  workspace: {
    files: {
      "package.json": [
        "{",
        '  "name": "lease-service",',
        '  "version": "0.1.0",',
        '  "private": true,',
        '  "type": "module"',
        "}",
        "",
      ].join("\n"),
      "src/lease.ts": [
        "// A lease grants temporary exclusive ownership of a resource to one holder.",
        "// Promise: at most one active holder at any instant, even under concurrent access.",
        "// In production the holder and expiry live in shared storage, so two callers",
        "// can interleave between the check and the write below.",
        "",
        "export interface LeaseRecord {",
        "  holder: string | null;",
        "  expiresAt: number;",
        "}",
        "",
        "export class Lease {",
        "  private record: LeaseRecord = { holder: null, expiresAt: 0 };",
        "",
        "  tryAcquire(who: string, now: number, ttlMs: number): boolean {",
        "    const active = this.record.holder !== null && now < this.record.expiresAt;",
        "    if (active) return false;",
        "    // Not atomic with the check above once this runs against shared storage.",
        "    this.record = { holder: who, expiresAt: now + ttlMs };",
        "    return true;",
        "  }",
        "",
        "  release(who: string): void {",
        "    if (this.record.holder === who) {",
        "      this.record = { holder: null, expiresAt: 0 };",
        "    }",
        "  }",
        "",
        "  holder(): string | null {",
        "    return this.record.holder;",
        "  }",
        "}",
        "",
      ].join("\n"),
      "README.md": [
        "# Lease service",
        "",
        "`src/lease.ts` implements a time-bounded lease.",
        "",
        "## Promise",
        "",
        "At most one holder is active at any instant.",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "目标是把『同一时刻最多一个持有者』这条并发互斥性质做成一次能失败的形式化检查。合格效果：一是选对工具，针对并发交错问题选用对协议小模型做模型检查（穷举交错）这类方式，而不是只写几个单元测试或手算几步，并说明为什么选它；二是把性质用代码里的词表达（例如两个持有者同时生效即违反），并做成一个下一代理能复跑的验证，写清性质、覆盖的代码、复跑命令、边界与假设；三是这个检查确实能失败——要么在当前实现上给出反例，按代码用词讲清两个调用者都在各自检查通过之后、真正写入之前通过、最终同时持有，要么在一个故意破坏的变体上演示检查会失败，只做一个永远通过的检查不算；四是如实说明验证范围与假设，例如只在两个调用者、某个时钟与 TTL 假设下穷举。gap：把普通单元测试当形式验证且不说明局限；检查被做成永远通过、没有失败能力；声称验证通过却拿不出模型、反例或可复跑命令；把工具缺失当成验证通过。若环境确实缺少模型检查器或证明工具，技能可以说明缺的是哪类能力并给出具体的等价降级（如自建小模型穷举交错），这不判缺口。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    {
      id: "response-visible",
      description: "浏览器中能看到对性质、所选验证方式、范围与假设、以及反例或证明的完整回复。",
    },
    {
      id: "tool-status-visible",
      description: "若报告工具缺失，需在回复中明确写出缺的是哪类能力与具体降级方案。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/create-formal-verification-skill/SKILL.md",
    regression: "new coverage; same scenario id is used for raw and adapted evidence",
  },
};
