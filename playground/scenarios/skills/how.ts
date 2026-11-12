import type { BehaviorScenario } from "../../types.ts";

export const howRequestFlow: BehaviorScenario = {
  type: "behavior",
  id: "how-request-flow",
  skill: "how",
  turns: [
    {
      prompt:
        "这个 URL 短链服务是我从别人手里接过来的，还不太熟。帮我讲清楚从收到一个请求、到读写缓存、再到生成或解析短码这条路径是怎么走的，我想先建立一个能上手改它的整体认识。",
    },
  ],
  workspace: {
    files: {
      "package.json": `{
  "name": "shortlink",
  "version": "0.1.0",
  "type": "module"
}
`,
      "src/server.mjs": `import { CacheStore } from "./store.mjs";
import { encode, decode } from "./shortener.mjs";

const store = new CacheStore();

export function handleRequest({ method, path }) {
  const id = path.slice(1);
  if (method === "GET") {
    const target = store.get(id) ?? decode(id);
    return { status: target ? 302 : 404, location: target };
  }
  if (method === "POST") {
    const newId = encode(path);
    store.set(newId, path);
    return { status: 201, location: newId };
  }
  return { status: 405 };
}
`,
      "src/store.mjs": `export class CacheStore {
  #entries = new Map();

  get(id) {
    return this.#entries.get(id);
  }

  set(id, url) {
    this.#entries.set(id, url);
  }

  has(id) {
    return this.#entries.has(id);
  }
}
`,
      "src/shortener.mjs": `const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

export function encode(url) {
  let hash = 0;
  for (const ch of url) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  let out = "";
  do {
    out = ALPHABET[hash % 36] + out;
    hash = Math.floor(hash / 36);
  } while (hash > 0);
  return out;
}

export function decode(id) {
  return id.startsWith("http") ? id : undefined;
}
`,
    },
  },
  assertions: [
    { kind: "turn-completed" },
    { kind: "skill-loaded", skill: "how" },
    { kind: "assistant-contains", text: "CacheStore" },
    { kind: "assistant-contains", text: "handleRequest" },
  ],
  rubric: {
    prompt:
      "解释应达到资深工程师接手子系统的程度，并按概览（Overview）、关键概念（Key Concepts）、如何运作（How It Works）、文件位置（Where Things Live）、坑（Gotchas）组织，不适用的分节可省略。如何运作部分要按 handleRequest 到 CacheStore / shortener 的顺序逐步走运行时流程并引用具体文件与真实符号，最后点出非显而易见的坑，例如缓存未命中就返回 404、短码解码只对 http 开头的 id 才成立，所以检索实际依赖缓存。gap：只罗列文件或函数清单；没有逐步流程；没有引用真实符号；只有源码没有心智模型；或漏掉明显的坑。若探索所需的子代理在本环境不可用，技能应如实说明并直接自行探索讲解，这不算缺口。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    {
      id: "response-visible",
      description: "浏览器中能看到完整回复，含从入口到缓存再到短码处理的逐步说明，而非文件清单。",
    },
    {
      id: "flow-explained",
      description: "人工确认说明按运行时顺序推进，并引用真实文件与函数。",
    },
    {
      id: "sections-present",
      description: "人工确认解释呈现概览、关键概念、如何运作、文件位置、坑这类分节。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/how/SKILL.md",
    regression:
      "主路径：产出 Overview/Key Concepts/How It Works/Where Things Live/Gotchas 结构的心智模型；子代理不可用时如实降级，不据此判缺口",
  },
};
