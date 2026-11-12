import type { BehaviorScenario } from "../../types.ts";

export const teachTokenBucket: BehaviorScenario = {
  type: "behavior",
  id: "teach-token-bucket",
  skill: "teach",
  turns: [
    {
      prompt:
        "我接手了这个限流器模块，但还没完全看懂。你能从头给我讲讲它是干嘛的、一个请求进来后它怎么一步步运转、以及为什么用现在这种设计吗？我想真的理解它，而不是背代码。",
    },
  ],
  workspace: {
    files: {
      "package.json": `{
  "name": "rate-limiter",
  "version": "0.1.0",
  "type": "module"
}
`,
      "README.md": `# Rate limiter

A small token-bucket rate limiter.

- src/TokenBucket.mjs holds the TokenBucket class.
- src/middleware.mjs keeps one bucket per caller key.
`,
      "src/TokenBucket.mjs": `export class TokenBucket {
  constructor({ capacity, refillPerSecond, now = Date.now }) {
    this.capacity = capacity;
    this.refillPerSecond = refillPerSecond;
    this.tokens = capacity;
    this.lastRefill = now();
    this.now = now;
  }

  refill() {
    const current = this.now();
    const elapsedSeconds = (current - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSeconds * this.refillPerSecond);
    this.lastRefill = current;
  }

  tryTake(count = 1) {
    this.refill();
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }
}
`,
      "src/middleware.mjs": `import { TokenBucket } from "./TokenBucket.mjs";

export function createRateLimiter({ capacity, refillPerSecond }) {
  const buckets = new Map();
  return function allow(key) {
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = new TokenBucket({ capacity, refillPerSecond });
      buckets.set(key, bucket);
    }
    return bucket.tryTake();
  };
}
`,
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "assistant-contains", text: "TokenBucket" }],
  rubric: {
    prompt:
      "这是在 DSH 会话里观察 teach 是否把这块代码讲清楚了，而不是替用户改代码。合格效果：先用一两句平实的话说明它是什么（一个按 caller 限流的令牌桶），再按用户关心的顺序讲清一个请求进来后如何按经过时间补充令牌、如何扣减或拒绝，最后讲清为什么用这种设计（容量内允许突发，同时约束长期平均速率），并保留 why 的置信措辞；讲三件以上东西时用图示要逐步叠加、每次只加一个部件，而不是一张塞满全部的大图，也可以不用图。整体像对话，结尾可邀请继续深入。gap：只罗列函数与常量或贴大段代码；跳过为什么这么设计；一次画全所有部件的单张大图；出现小测、框架标签或说教式提示。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    {
      id: "response-visible",
      description: "浏览器中能看到一段平实的完整讲解，含定义、运转过程与设计原因。",
    },
    {
      id: "plain-definition-first",
      description: "人工确认回复开头是简短平实的定义，而不是直接罗列函数或堆代码。",
    },
    {
      id: "incremental-diagrams",
      description: "若出现图示，人工确认是逐步展开的，而非一张塞满所有部件的大图。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/teach/SKILL.md",
    regression:
      "覆盖 teach 主路径：平实定义先行、按请求流程讲机制、讲清设计原因并保留置信措辞、图示按部件逐步叠加、对话式收尾。",
  },
};
