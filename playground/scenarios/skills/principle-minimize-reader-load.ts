import type { BehaviorScenario } from "../../types.ts";

export const principleMinimizeReaderLoad: BehaviorScenario = {
  type: "behavior",
  id: "principle-minimize-reader-load-apply",
  skill: "principle-minimize-reader-load",
  turns: [
    {
      prompt:
        "load.ts 这一段读起来挺费劲，新同事接手时常常要花很久才搞清数据从哪来、什么会改变它。帮我整理一下，让这块代码更容易读懂，注意别把它改大。",
    },
  ],
  workspace: {
    files: {
      "load.ts": [
        "let cache: Record<string, string> | null = null;",
        "",
        "function requestRaw(url: string): string {",
        "  return `raw:${url}`;",
        "}",
        "",
        "function fetchBody(url: string): string {",
        "  return requestRaw(url);",
        "}",
        "",
        "function loadData(url: string): string {",
        "  return fetchBody(url);",
        "}",
        "",
        "function getData(url: string): string {",
        "  if (cache && cache[url]) return cache[url];",
        "  const body = loadData(url);",
        "  cache = cache ?? {};",
        "  cache[url] = body;",
        "  return body;",
        "}",
        "",
        "export function readUser(id: string): string {",
        "  return getData(`/users/${id}`);",
        "}",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "no-tool-error" }],
  rubric: {
    prompt:
      "回复应真正应用该原则推理，从两个轴降低读者负担：一是层数，requestRaw/fetchBody/loadData 都是只有一个调用方的纯透传包装，应内联塌缩，让从 readUser 到真正干活处不再需要跳好几层；二是要记住的状态，模块级可变的 cache 应收窄为更小的作用域（例如局部、由纯函数派生），而不是让读者一直惦记模块里藏着的可变状态。行为要保留。gap：新增接口/工厂/策略等抽象把代码变大；只改名而不真正减少层数或状态；只复述原则名字。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，回复给出针对该模块可读性的判断。" },
    {
      id: "response-visible",
      description: "浏览器中能看到完整回复，回复说明塌缩透传层、收窄可变状态且不引入新抽象。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-minimize-reader-load/SKILL.md",
    regression: "该原则在 DSH 会话中仍被应用：塌缩单调用方包装层并收窄可变状态，而不是新增抽象",
  },
};
