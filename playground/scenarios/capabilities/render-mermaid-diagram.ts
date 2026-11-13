import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-render-mermaid-diagram",
  capability: "render-mermaid-diagram",
  turns: [
    {
      prompt:
        "用一个流程图把“请求进来 → 鉴权 → 读写数据库 → 返回结果”这条链路画出来，我要一眼看懂每一步怎么连接。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# 流程图需求\n\n需要一张能直接看懂的链路流程图。\n",
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "用户能看到实际渲染出来的流程图（各步连成可读的图），而不是只有一段 Mermaid 源码文本或 ASCII 草图。只给源码块而不呈现图形，记为缺口；渲染能力不可用时按环境限制记录，不判通过。",
  },
  uiObservations: [
    {
      id: "diagram-visible",
      description: "浏览器中能看到一张渲染成图形的流程图，而不是 Mermaid 源码文本。",
    },
  ],
};

export default scenario;
