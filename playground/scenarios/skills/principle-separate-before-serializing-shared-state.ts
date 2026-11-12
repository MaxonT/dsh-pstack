import type { BehaviorScenario } from "../../types.ts";

export const principleSeparateBeforeSerializingSharedState: BehaviorScenario = {
  type: "behavior",
  id: "principle-separate-before-serializing-shared-state-apply",
  skill: "principle-separate-before-serializing-shared-state",
  turns: [
    {
      prompt:
        "两个 worker 进程都调用 worker.ts 的 updateProgress，各自往同一个 state.json 写自己的 lastIndex，偶尔会互相覆盖丢进度。我准备加个文件锁解决。你帮我看看该怎么弄。",
    },
  ],
  workspace: {
    files: {
      "worker.ts": [
        'import { readFileSync, writeFileSync } from "node:fs";',
        "",
        "export function updateProgress(workerId: number, lastIndex: number): void {",
        '  const state = JSON.parse(readFileSync("state.json", "utf8"));',
        "  if (workerId === 1) state.lastIndex1 = lastIndex;",
        "  else state.lastIndex2 = lastIndex;",
        '  writeFileSync("state.json", JSON.stringify(state));',
        "}",
        "",
      ].join("\n"),
      "state.json": '{"lastIndex1":0,"lastIndex2":0}\n',
      "run.log": [
        "$ node worker.js 1 500 &",
        "$ node worker.js 2 800 &",
        "worker 1 read {lastIndex1:0,lastIndex2:0}",
        "worker 2 read {lastIndex1:0,lastIndex2:0}",
        "worker 1 wrote {lastIndex1:500,lastIndex2:0}",
        "worker 2 wrote {lastIndex1:0,lastIndex2:800}",
        "$ cat state.json",
        '{"lastIndex1":0,"lastIndex2":800}',
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "no-tool-error" }],
  rubric: {
    prompt:
      "回复应真正应用该原则推理：先问两个 worker 是否真的需要同一个可变对象，默认做法是消除共享写目标——让每个 worker 写自己拥有的状态文件（例如 worker1-state.json、worker2-state.json，或各自独立的 key），只在读/报告边界合并，而不是一上来就加锁。运行日志里 worker 1 的 500 被 worker 2 的整对象覆盖，正说明问题出在共享整对象写，不是缺锁。只有在单一共享写目标确实是真实不变量时才用锁/顺序阶段结构化串行；把“加锁”当默认答案记 gap。只复述原则名字记 gap。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，回复给出针对共享状态写入的判断。" },
    {
      id: "response-visible",
      description:
        "浏览器中能看到完整回复，回复主张拆分各 worker 自有状态并在读取边界合并，而不是默认加锁。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-separate-before-serializing-shared-state/SKILL.md",
    regression: "该原则在 DSH 会话中仍被应用：先消除共享写目标，只有共享是真实不变量时才结构化串行",
  },
};
