import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-render-svg-chart-render",
  capability: "render-svg-chart",
  phases: ["raw"],
  turns: [
    {
      prompt:
        "工作区里有一个状态图定义 flow.mmd。请把它渲染成一张 SVG 图片文件放进 artifacts/ 目录，然后把这张图给我看。",
    },
  ],
  workspace: {
    files: {
      "flow.mmd":
        "stateDiagram-v2\n    [*] --> 待支付\n    待支付 --> 已支付: 付款\n    待支付 --> 已取消: 取消\n    已支付 --> [*]\n    已取消 --> [*]\n",
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "artifact-dir-nonempty", path: "artifacts" }],
  rubric: {
    prompt:
      "用户能拿到一个真实的 SVG 图片文件并被实际呈现或打开检查，内容对应 flow.mmd 的状态流转。只保留 .mmd 源码、或只给渲染命令说明而没有产出 SVG 图像，记为缺口；渲染能力不可用时按环境限制记录，不判通过。",
  },
  uiObservations: [
    {
      id: "svg-visible",
      description: "浏览器中能看到渲染出的状态图（SVG 图像），而不是只有 .mmd 源码。",
    },
  ],
};

export default scenario;
