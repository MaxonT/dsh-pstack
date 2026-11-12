import type { BehaviorScenario } from "../../types.ts";

export const principleModelTheDomain: BehaviorScenario = {
  type: "behavior",
  id: "principle-model-the-domain-apply",
  skill: "principle-model-the-domain",
  turns: [
    {
      prompt:
        "player.ts 用 isPlaying、isLoading、isPaused、hasError 四个布尔量表示播放器状态，几乎每个函数都在组合它们。产品接下来要再加一个 buffering 状态。帮我看看这段逻辑该怎么组织，才能以后加状态不至于越来越乱。",
    },
  ],
  workspace: {
    files: {
      "player.ts": [
        "let isPlaying = false;",
        "let isLoading = false;",
        "let isPaused = false;",
        "let hasError = false;",
        "",
        "export function play(): void {",
        "  if (hasError) {",
        "    isPlaying = false;",
        "    isPaused = false;",
        "    return;",
        "  }",
        "  if (isLoading) return;",
        "  isPlaying = true;",
        "  isPaused = false;",
        "}",
        "",
        "export function pause(): void {",
        "  if (isPlaying) {",
        "    isPlaying = false;",
        "    isPaused = true;",
        "  }",
        "}",
        "",
        "export function load(): void {",
        "  if (isPlaying || isPaused) return;",
        "  isLoading = true;",
        "}",
        "",
        "export function fail(): void {",
        "  hasError = true;",
        "  isPlaying = false;",
        "  isPaused = false;",
        "  isLoading = false;",
        "}",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "no-tool-error" }],
  rubric: {
    prompt:
      "回复应真正应用该原则推理：指出四个必须互相保持同步的布尔量是散落的隐式状态，组合里存在大量非法状态（例如同时 isLoading 和 isPlaying），应改成一个单一的状态机或判别联合（discriminated union），让非法组合不可表示，并删掉那些两两组合判断的分支；新增 buffering 只是多一个合法状态，而不是再加一个要和其它布尔保持同步的标志位。gap：继续增加布尔量或同步标志；只把变量改名而不改变结构；只复述原则名字。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，回复给出针对布尔状态逻辑的建模判断。" },
    {
      id: "response-visible",
      description:
        "浏览器中能看到完整回复，回复用单一状态结构替代互相同步的布尔量，并说明新增 buffering 的落点。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-model-the-domain/SKILL.md",
    regression:
      "该原则在 DSH 会话中仍被应用：用状态机/判别联合替代需要同步的多个布尔量，使非法状态不可表示",
  },
};
