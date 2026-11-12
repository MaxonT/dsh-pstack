import type { BehaviorScenario } from "../../types.ts";

export const unslop: BehaviorScenario = {
  type: "behavior",
  id: "unslop-readme-prose",
  skill: "unslop",
  turns: [
    {
      prompt:
        "docs/intro.md 这段介绍 AI 味太重了，全是空话套话，读着像机器写的。帮我改得像人写的，去掉那些空泛的形容词和堆砌，但里面的真实数据和意思要完整保留。",
    },
  ],
  workspace: {
    files: {
      "docs/intro.md": `# Our Journey: A Tapestry of Innovation

In today's fast-paced landscape, our team has worked tirelessly to delve into the intricate interplay of performance and reliability. It is not just a caching layer, but a crucial testament to our enduring commitment to excellence. Additionally, we leverage cutting-edge techniques to showcase vibrant and robust results, highlighting our pivotal role in the ecosystem — the outcome speaks for itself. The takeaway is clear: instead of tuning parameters, you fix the design. Experts believe this is a genuine game-changer. In practice, the p99 latency dropped from 120 ms to 80 ms after the change. The future looks bright!
`,
    },
  },
  assertions: [
    { kind: "turn-completed" },
    { kind: "artifact-contains", path: "docs/intro.md", text: "120" },
    { kind: "artifact-contains", path: "docs/intro.md", text: "80" },
  ],
  rubric: {
    prompt:
      "目标是去掉 AI 文风但保留原意与事实。合格效果：删除空话与套话（如 fast-paced landscape、delve、intricate interplay、testament、leverage、showcase、pivotal、Experts believe、The future looks bright），去掉“not just X but Y”结构、把破折号改成句号或逗号、把句中误用的冒号改写为独立句子、去掉标题式大写，改用直白具体的句子，并保留真实数据：p99 从 120 ms 降到 80 ms。只加载技能、或删掉数据、或只换个词不改变堆砌结构，都不算效果成立。gap：120 ms 与 80 ms 这组事实丢失或被改动；仍然保留 AI 套话结构、破折号或冒号误用。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "response-visible", description: "浏览器中能看到改写后的完整短文。" },
    {
      id: "rewritten-prose-visible",
      description: "浏览器或工作区能看到改写后的短文读起来平实具体，并保留 p99 120→80 ms。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/unslop/SKILL.md",
    regression:
      "覆盖 unslop 主路径：保留 p99 120 ms→80 ms 的真实数据并去掉 AI 套话、破折号与冒号误用；数据丢失或仍保留套话结构即为回归。",
  },
};
