import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-render-svg-chart",
  capability: "render-svg-chart",
  turns: [
    {
      prompt:
        "把这份状态机导出成一份可以打开的 SVG 图片文件给我，我要能直接打开查看，不要只留下源码文件。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# SVG 状态图探测\n",
      "state.mmd": "stateDiagram-v2\n  [*] --> Idle\n  Idle --> Running\n  Running --> [*]\n",
    },
  },
  assertions: [
    {
      kind: "turn-completed",
    },
  ],
  rubric: {
    prompt: "用户能看到一份真实可打开的 SVG 图像文件。只有 .mmd 源码、没有可查看的 SVG，记为缺口。",
  },
  uiObservations: [
    {
      id: "svg-rendered",
      description: "浏览器中或产物里实际显示打开后的 SVG 图像。",
    },
  ],
};

export default scenario;
