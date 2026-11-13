import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-file-attachments",
  capability: "file-attachments",
  turns: [
    {
      prompt:
        "我在工作区放了 data/spec.md，你需要参考它。请阅读该文件，把里面“版本号”那一行的值原样报给我，不要自己猜。",
    },
  ],
  workspace: {
    files: {
      "data/spec.md": "# 规格\n\n版本号: 7.3.1\n负责人: 运维组\n",
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "assistant-contains", text: "7.3.1" }],
  rubric: {
    prompt:
      "用户能看到执行者读取了 data/spec.md 并报出版本号 7.3.1。未读取文件、或编造一个数字，记为缺口。",
  },
  uiObservations: [
    {
      id: "reply-visible",
      description: "浏览器中能看到正确报出的版本号。",
    },
  ],
};

export default scenario;
