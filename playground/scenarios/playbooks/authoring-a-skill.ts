import type { BehaviorScenario } from "../../types.ts";

export const playbookScenario: BehaviorScenario = {
  type: "behavior",
  id: "playbook-authoring-a-skill",
  skill: "poteto-mode",
  playbook: "authoring-a-skill",
  turns: [
    {
      prompt:
        "/poteto-mode 我们每次发版前都要口头重复一遍同一套检查流程，太浪费。请把这套流程沉淀成一个可复用的技能放进仓库，写清楚它解决什么问题、什么时候该触发，弄好后确认它是完整可用的。",
    },
  ],
  workspace: {
    files: {
      "README.md": [
        "# ops-tools",
        "",
        "小型的运维脚本仓库。团队的发版前检查流程目前只存在于口头交代和聊天记录里。",
        "",
        "仓库约定：可复用的技能放在 `.agents/skills/` 下。",
        "",
      ].join("\n"),
      "docs/release-runbook.md": [
        "# 发版前检查（团队反复口头交代的那套）",
        "",
        "每次发版前都要按顺序过一遍：",
        "",
        "1. 确认目标分支已同步到最新。",
        "2. 跑完整测试套件，必须全绿。",
        "3. 检查数据库迁移脚本是否已在预发环境验证。",
        "4. 确认回滚方案：上一版镜像标签、回滚命令、负责人。",
        "5. 发布后在监控面板观察 15 分钟，错误率超过基线 2 倍就回滚。",
        "6. 发版记录写进变更日志，注明版本号与负责人。",
        "",
        "每次都要重新讲一遍，最容易漏第 4 步。",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "skill-loaded", skill: "poteto-mode" }],
  rubric: {
    prompt:
      "这是 playbook authoring-a-skill 的 DSH 运行观察。合格效果：poteto-mode 加载后把任务匹配到 authoring-a-skill，而不是自己去执行这套发版检查。它的第一个可观察动作应是从工作区的 runbook 里提炼出一个新技能：在仓库约定的技能目录下写出可被发现、可加载的技能定义，包含它解决什么问题、什么时候触发的描述；然后做结构性检查（名称与描述是否齐全、引用的文件是否存在、跨技能链接能否解析），或说明哪一项检查做不到。用于写作或校验的专用能力在当前环境不可用时，应如实说明并用手边方式做力所能及的检查，而不是声称校验通过。gap：直接替用户跑一遍发版检查；只把流程贴在聊天里没有落成技能文件；写出技能但缺触发说明或结构；声称已校验却拿不出检查依据。poteto-mode 加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    {
      id: "response-visible",
      description: "浏览器中能看到它把发版流程整理成技能的说明与设计取舍。",
    },
    {
      id: "artifact-visible",
      description: "人工确认仓库里出现了一个可发现的技能定义文件，而不仅是聊天里的文字。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/poteto-mode/SKILL.md",
    regression: "playbook authoring-a-skill：从重复流程提炼技能并做结构校验，而不是替用户执行流程",
  },
};
