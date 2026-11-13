import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-grep-glob",
  capability: "grep-glob",
  turns: [
    {
      prompt: "在这个工作区里找出所有出现函数名 buildReport 的位置，把文件和行号列出来。",
    },
  ],
  workspace: {
    files: {
      "src/a.ts": "export function buildReport() {\n  return 1;\n}\n",
      "src/b.ts": "import { buildReport } from './a';\n// 这里引用了 buildReport\n",
      "docs/notes.md": "这里只是提到 buildReport 这个词，与实现无关。\n",
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "assistant-contains", text: "src/a.ts" }],
  rubric: {
    prompt:
      "用户能看到结果准确列出包含 buildReport 的文件与位置（至少包含 src/a.ts）。漏掉真实出现位置、或凭空编造行号，记为缺口。",
  },
  uiObservations: [
    {
      id: "reply-visible",
      description: "浏览器中能看到按文件与行号组织的搜索结果。",
    },
  ],
};

export default scenario;
