import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-render-screenshot-render",
  capability: "render-screenshot",
  phases: ["raw"],
  turns: [
    {
      prompt:
        "工作区里有 page/index.html。请把它实际跑起来，截一张完整页面的截图给我看，我要确认页面真正渲染出来的样子。",
    },
  ],
  workspace: {
    files: {
      "page/index.html":
        '<!doctype html>\n<html lang="zh">\n<head><meta charset="utf-8"><title>截图探测</title></head>\n<body><h1>订单已提交</h1><p>编号 A-1024，状态：处理中。</p></body>\n</html>\n',
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "用户能在回复里看到真实渲染出来的页面截图（图像本身），页面内容与 index.html 一致。只给出 HTML 源码、文件路径或文字描述而没有实际截图图像，记为缺口；渲染或截取能力不可用时按环境限制记录，不判通过。",
  },
  uiObservations: [
    {
      id: "screenshot-visible",
      description: "浏览器中能看到一张渲染后的页面截图图像，而不是源码块或路径。",
    },
  ],
};

export default scenario;
