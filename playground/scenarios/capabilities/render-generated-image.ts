import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-render-generated-image",
  capability: "render-generated-image",
  turns: [
    {
      prompt:
        "帮我画一张示意图，用白板手绘的感觉，表达“输入 → 处理 → 输出”这三个环节的空间布局，配几个简短标签。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# 示意图需求\n\n需要一个白板手绘风格的示意图。\n",
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "用户能拿到一张真实生成的图片，用图像表达“输入 → 处理 → 输出”的布局。只用文字、表格、Mermaid 源码或代码描述而没有实际生成的图片，记为缺口；图片生成能力不可用时按环境限制记录，不判通过。",
  },
  uiObservations: [
    {
      id: "image-visible",
      description: "浏览器中能看到一张真实生成的示意图图片，而不是文字或源码。",
    },
  ],
};

export default scenario;
