import type { BehaviorScenario } from "../../types.ts";

export const playbookScenario: BehaviorScenario = {
  type: "behavior",
  id: "playbook-runtime-forensics",
  skill: "poteto-mode",
  playbook: "runtime-forensics",
  turns: [
    {
      prompt:
        "/poteto-mode 这个服务在几乎没有请求进来的时候 CPU 也一直 40% 以上，帮我查清楚到底是什么在占用 CPU，给一个有据可查的诊断。",
    },
  ],
  workspace: {
    files: {
      "README.md": [
        "# pricing-service",
        "",
        "一个报价服务。启动方式见 package.json 的 start 脚本，配置在 config.json。",
        "最近它在空闲时 CPU 也一直很高，但日志里没有报错。",
        "",
      ].join("\n"),
      "package.json":
        '{\n  "name": "pricing-service",\n  "version": "0.1.0",\n  "type": "module",\n  "scripts": {\n    "start": "node src/server.js"\n  }\n}\n',
      "config.json": '{\n  "ttl": 60,\n  "region": "cn-east"\n}\n',
      "src/server.js": [
        'import { readFileSync } from "node:fs";',
        "",
        "function tick() {",
        "  // 每 10 毫秒重新读一次配置并解析",
        '  const raw = readFileSync(new URL("../config.json", import.meta.url), "utf8");',
        "  const config = JSON.parse(raw);",
        '  if (config.ttl < 0) throw new Error("bad ttl");',
        "}",
        "",
        "setInterval(tick, 10);",
        "setInterval(() => {}, 1000);",
        "",
        'console.log("pricing service up");',
        "",
      ].join("\n"),
      "symptom.md": [
        "# 症状记录",
        "",
        "- 服务空闲、几乎没有请求时，进程 CPU 常驻 40%~60%。",
        "- 一启动就这样，重启能降一会又升上去。",
        "- 应用日志没有报错，也没有请求量异常。",
        "- 这是从一个同事的部署环境观察到的，本机没有保留现场。",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "skill-loaded", skill: "poteto-mode" }],
  rubric: {
    prompt:
      "这是 playbook runtime-forensics 的 DSH 运行观察。合格效果：poteto-mode 加载后把任务匹配到 Runtime forensics（现场取证，适合没有现成剖析制品的活进程），并按其步骤推进：先尝试从运行中的进程拿到实时信号（启动进程后采样或抓一次 CPU 剖析），把信号收敛到最热的函数，验证机制，再回到源码定位到具体文件、符号和那行调度代码。若本环境拿不到活进程或采样能力，应如实说明这一限制，给出可执行的采集命令或计划，并把仅凭源码读出的 `setInterval(tick, 10)` 读文件当假设而不是已确认结论。gap：只读源码就断定是那段定时器在烧 CPU 并当成确诊、没有任何运行时证据；声称抓了剖析却拿不出采集结果或路径；给出无证据的结论还宣称已查明。poteto-mode 加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    {
      id: "response-visible",
      description: "浏览器中能看到诊断、采集到什么运行时信号、以及是否能取到活进程的完整说明。",
    },
    {
      id: "diagnosis-cited",
      description: "人工确认诊断是否给出运行时证据或明确标注为假设，而不是把源码猜测当结论。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression:
      "playbook Runtime forensics：从活进程取实时信号，缺少采集能力时如实降级而非拿源码猜测当确诊",
  },
};
