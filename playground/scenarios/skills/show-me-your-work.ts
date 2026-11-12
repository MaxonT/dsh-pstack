import type { BehaviorScenario } from "../../types.ts";

const migrationWorkspace = {
  files: {
    "TASK.md": [
      "# 多阶段任务：把旧版『便签』前端迁移到新组件库",
      "",
      "阶段 1：盘点 components/ 下所有旧组件，列出替换清单。",
      "阶段 2：逐个把旧组件替换为新组件库，保持界面行为不变。",
      "阶段 3：对每个页面做像素对比，确认没有视觉回归。",
      "阶段 4：清理旧组件与不再使用的样式。",
      "",
      "说明：改动较大，负责人会离开一段时间，回来按决策日志复核每一步。",
      "",
    ].join("\n"),
    "components/Button.old.tsx": [
      "export function ButtonOld(props: { label: string }) {",
      '  return <button className="btn-old">{props.label}</button>;',
      "}",
      "",
    ].join("\n"),
    "components/Card.old.tsx": [
      "export function CardOld(props: { title: string; children?: unknown }) {",
      "  return (",
      '    <div className="card-old">',
      "      <h3>{props.title}</h3>",
      "      {props.children}",
      "    </div>",
      "  );",
      "}",
      "",
    ].join("\n"),
    "pages/Home.tsx": [
      'import { ButtonOld } from "../components/Button.old";',
      'import { CardOld } from "../components/Card.old";',
      "",
      "export function Home() {",
      "  return (",
      "    <main>",
      '      <CardOld title="欢迎">',
      '        <ButtonOld label="开始" />',
      "      </CardOld>",
      "    </main>",
      "  );",
      "}",
      "",
    ].join("\n"),
  },
};

export const showMeYourWorkMultiPhaseMigration: BehaviorScenario = {
  type: "behavior",
  id: "show-me-your-work-multi-phase-migration",
  skill: "show-me-your-work",
  turns: [
    {
      prompt:
        "/show-me-your-work 请按 TASK.md 里的多阶段计划推进这项工作。我会离开一段时间，回来后要能凭一份决策日志复核你每一步的取舍。请把日志写到工作目录下的 decisions.tsv，每个决策写清楚：做了什么、为什么、证据指向哪里、结果如何。",
    },
  ],
  workspace: migrationWorkspace,
  assertions: [
    { kind: "turn-completed" },
    { kind: "artifact-contains", path: "decisions.tsv", text: "\t" },
  ],
  rubric: {
    prompt:
      "这项工作应产出一份可复核的决策日志 decisions.tsv，是真正的制表符分隔表（TSV），每行一个决策或带验证结果的检查点。列应覆盖六类信息（沿用日志模板的六列，等价的本地语言列名也算）：时间、阶段、决策、原因、证据、结果。每行要写清做了什么、为什么、可解析的证据指针（提交号、文件:行、产物或脚本路径）和结果状态；证据要能逐行核对、解析到真实存在的东西，而不是叙述性段落或空泛描述。日志应追加式，只记决策点与检查点，不把每句闲聊或显而易见的小动作都堆进来；不要求一轮就完成全部阶段，但已做的取舍与检查点要如实入账。若环境中无法派跨模型评审子代理或无法读取会话转录，可省略这些附加步骤，不据此判 gap。gap：没有生成日志；不是制表符分隔；行里没有可解析的证据指针；或把显而易见的琐事逐条堆砌。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    { id: "response-visible", description: "浏览器中能看到推进过程与决策日志位置的完整回复。" },
    {
      id: "log-visible",
      description: "工作区里能看到 decisions.tsv，人工确认每行都带可解析的证据指针。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/show-me-your-work/SKILL.md",
    regression: "多阶段、离开后复核：产出可逐行核对的 TSV 决策日志",
  },
};
