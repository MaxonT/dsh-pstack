import type { BehaviorScenario } from "../../types.ts";

export const guardTheContextWindowApply: BehaviorScenario = {
  type: "behavior",
  id: "principle-guard-the-context-window-apply",
  skill: "principle-guard-the-context-window",
  turns: [
    {
      prompt:
        "logs/ 下是上周整周的访问日志，量很大。帮我统计每个接口的请求数和 p95 延迟，最后给我一张汇总表就行。",
    },
  ],
  workspace: {
    files: {
      "logs/mon.log":
        "2026-01-05T00:00:01Z GET /api/orders 200 34\n2026-01-05T00:00:02Z GET /api/orders 200 41\n2026-01-05T00:00:03Z POST /api/login 200 120\n2026-01-05T00:00:04Z GET /api/orders 500 900\n",
      "logs/tue.log":
        "2026-01-06T08:00:01Z GET /api/users 200 22\n2026-01-06T08:00:02Z GET /api/users 200 25\n2026-01-06T08:00:03Z GET /api/orders 200 30\n",
      "logs/wed.log":
        "2026-01-07T09:00:01Z POST /api/orders 201 88\n2026-01-07T09:00:02Z GET /api/users 404 12\n",
      "README.md":
        "# logs\n\n按天切分的访问日志，每行：时间 方法 路径 状态码 耗时ms。真实环境里一周可能几十到几百 MB。\n",
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "回答应避免把整份日志灌进上下文：先用脚本/命令行聚合（按接口统计请求数与分位耗时），或把大文件分片交给子代理解析、主线只拿汇总，再把结果整理成一张覆盖各接口的汇总表。gap：把大量原始日志贴进回复或反复整份读取；不给汇总表；声称统计了却没有可执行的方法或结果。日志量在真实环境可能很大，本条只看是否用聚合/分片并把主线保持在汇总层面。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "response-visible", description: "浏览器中能看到按接口汇总的请求数与 p95 表。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-guard-the-context-window/SKILL.md",
    regression: "该原则在 DSH 会话中仍被应用：大批量数据走聚合/子代理，主线只留汇总",
  },
};
