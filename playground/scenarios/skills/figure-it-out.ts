import type { BehaviorScenario } from "../../types.ts";

export const figureItOutVarMigration: BehaviorScenario = {
  type: "behavior",
  id: "figure-it-out-var-migration-playbook",
  skill: "figure-it-out",
  turns: [
    {
      prompt:
        "这个老项目里到处是 var，我想全部迁到 let/const 同时保证行为不变，范围不小。先别直接动手改，帮我设计一份能让人事后审查的推进方案，放到 docs/migration-playbook.md，把怎么组织这次迁移讲清楚。",
    },
  ],
  workspace: {
    files: {
      "package.json": `{
  "name": "legacy-counter",
  "version": "1.0.0",
  "scripts": {
    "test": "node test/smoke.js",
    "build": "node scripts/build.js"
  }
}
`,
      "src/app.js": `var state = { count: 0 };

function increment() {
  var next = state.count + 1;
  state.count = next;
  return next;
}

module.exports = { increment };
`,
      "src/util.js": `var MAX = 100;

function clamp(value) {
  var bounded = value;
  if (bounded > MAX) {
    bounded = MAX;
  }
  return bounded;
}

module.exports = { clamp };
`,
      "src/render.js": `var { increment } = require("./app.js");

function render() {
  var value = increment();
  return "count=" + value;
}

module.exports = { render };
`,
      "test/smoke.js": `var assert = require("node:assert");
var { increment } = require("../src/app.js");
var { clamp } = require("../src/util.js");
var { render } = require("../src/render.js");

assert.strictEqual(increment(), 1);
assert.strictEqual(clamp(150), 100);
assert.strictEqual(render(), "count=2");
console.log("smoke ok");
`,
      "scripts/build.js": `var fs = require("node:fs");
var path = require("node:path");
var files = ["src/app.js", "src/util.js", "src/render.js"];
for (var i = 0; i < files.length; i++) {
  var source = fs.readFileSync(path.join(__dirname, "..", files[i]), "utf8");
  if (source.length === 0) throw new Error("empty file: " + files[i]);
}
console.log("build ok");
`,
    },
  },
  assertions: [
    { kind: "turn-completed" },
    { kind: "artifact-contains", path: "docs/migration-playbook.md", text: "var" },
  ],
  rubric: {
    prompt:
      "这是在 DSH 会话里观察 figure-it-out 是否真的产出了一份可审计的迁移方案，而不是直接改代码。合格效果：先把完成标准写成可证伪的判据（例如不再有 var、测试与构建通过、行为不变），量化范围（涉及哪些文件与大致工量），说明采用的严格度及理由，把工作拆成可独立落地、按风险排序的小步，并在动手前设计好验证手段、记录改动前的测试与构建基线，同时指明决策与进度的记录位置。gap：只给一串待办而没有可证伪的完成判据；没有验证设计或没有基线；跳过方案直接改源码；没有范围估计或严格度说明。方案以文档或回复形态给出都算，不限定某种格式。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    {
      id: "response-visible",
      description: "浏览器中能看到完整的迁移方案说明，含完成判据、范围、步骤与验证设计。",
    },
    {
      id: "artifact-visible",
      description: "工作区能看到 docs/migration-playbook.md 已生成并可打开。",
    },
    {
      id: "phases-ordered",
      description: "人工确认方案是阶段性、按风险排序的步骤，而不是随手列出要改的文件。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/figure-it-out/SKILL.md",
    regression:
      "覆盖 figure-it-out 主路径：产出带完成判据、量化范围、按风险排序的原子步骤、含基线捕获的验证设计与决策留痕的可审计方案，而不是直接写代码。",
  },
};
