import type { BehaviorScenario } from "../../types.ts";

export const playbookScenario: BehaviorScenario = {
  type: "behavior",
  id: "playbook-trace-forensics",
  skill: "poteto-mode",
  playbook: "trace-forensics",
  turns: [
    {
      prompt:
        "/poteto-mode 我抓了一份性能剖析文件，帮我看看时间主要耗在哪条调用路径上，给一个能对上源码的结论。",
    },
  ],
  workspace: {
    files: {
      "README.md": [
        "# report-service",
        "",
        "报表服务。`sample.cpuprofile` 是一次运行采到的性能剖析文件，`src/report.js` 是当时的源码。",
        "",
      ].join("\n"),
      "package.json":
        '{\n  "name": "report-service",\n  "version": "0.1.0",\n  "type": "module"\n}\n',
      "src/report.js": [
        "// 把订单数据规整成文本表格。",
        "const SEP = /\\s+/g;",
        "",
        "function normalizeText(value) {",
        '  return String(value).replace(SEP, " ").trim();',
        "}",
        "function formatRows(rows) {",
        '  return rows.map((row) => row.map(normalizeText).join(" | "));',
        "}",
        "",
        "export function renderReport(rows) {",
        "  const lines = formatRows(rows);",
        '  return lines.join("\\n");',
        "}",
        "",
      ].join("\n"),
      "sample.cpuprofile": `{
  "nodes": [
    {
      "id": 1,
      "callFrame": {
        "functionName": "(root)",
        "scriptId": "0",
        "url": "",
        "lineNumber": -1,
        "columnNumber": -1
      },
      "hitCount": 0,
      "children": [
        2
      ]
    },
    {
      "id": 2,
      "callFrame": {
        "functionName": "(program)",
        "scriptId": "0",
        "url": "",
        "lineNumber": -1,
        "columnNumber": -1
      },
      "hitCount": 0,
      "children": [
        3,
        7
      ]
    },
    {
      "id": 3,
      "callFrame": {
        "functionName": "renderReport",
        "scriptId": "5",
        "url": "file:///app/src/report.js",
        "lineNumber": 10,
        "columnNumber": 0
      },
      "hitCount": 2,
      "children": [
        4
      ]
    },
    {
      "id": 4,
      "callFrame": {
        "functionName": "formatRows",
        "scriptId": "5",
        "url": "file:///app/src/report.js",
        "lineNumber": 6,
        "columnNumber": 0
      },
      "hitCount": 4,
      "children": [
        5
      ]
    },
    {
      "id": 5,
      "callFrame": {
        "functionName": "normalizeText",
        "scriptId": "5",
        "url": "file:///app/src/report.js",
        "lineNumber": 3,
        "columnNumber": 0
      },
      "hitCount": 40,
      "children": []
    },
    {
      "id": 7,
      "callFrame": {
        "functionName": "(idle)",
        "scriptId": "0",
        "url": "",
        "lineNumber": -1,
        "columnNumber": -1
      },
      "hitCount": 14,
      "children": []
    }
  ],
  "startTime": 1000000,
  "endTime": 1590000,
  "samples": [
    5, 7, 3, 7, 5, 5, 5, 5, 4, 5, 7, 7, 5, 5, 5, 5, 5, 5, 3, 4,
    5, 5, 5, 5, 5, 7, 7, 7, 5, 5, 5, 7, 5, 4, 5, 5, 5, 7, 5, 5,
    7, 5, 5, 5, 7, 5, 5, 7, 7, 5, 5, 5, 5, 5, 5, 4, 5, 7, 5, 5
  ],
  "timeDeltas": [
    0, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000,
    10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000,
    10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000,
    10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000,
    10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000,
    10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000
  ]
}
`,
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "skill-loaded", skill: "poteto-mode" }],
  rubric: {
    prompt:
      "这是 playbook trace-forensics 的 DSH 运行观察。合格效果：poteto-mode 加载后把任务匹配到 Trace forensics（拿到的是已经采好的剖析制品，只解析不重跑），并按其步骤推进：先用合适的工具解析这份 cpuprofile（或直接解析其 JSON），把样本按帧聚合成可查询的形状，收敛出占用时间最多的热路径——`renderReport → formatRows → normalizeText`，其中 `normalizeText` 的样本数最多——再把热点帧按制品自带的符号映射回 `src/report.js` 的文件、函数和行。单次采集无法对比，应把结论标成制品支持的最强假设而不是已确认根因。gap：不解析这份剖析文件、只凭读源码猜结论；解析了却给不出热路径或映射不到源码；把单次采集的结论说成已确证；声称做了剖析却拿不出基于该制品的发现。工具不可用时用手写解析等等价方式也算合格。poteto-mode 加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    {
      id: "response-visible",
      description: "浏览器中能看到剖析来源、热路径、映射到的源码位置与置信度的完整说明。",
    },
    {
      id: "diagnosis-cited",
      description: "人工确认结论是否真的落在 sample.cpuprofile 的帧与 src/report.js 的对应行上。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression:
      "playbook Trace forensics：解析已有剖析制品定位热路径并映射回源码，单次采集标为假设",
  },
};
