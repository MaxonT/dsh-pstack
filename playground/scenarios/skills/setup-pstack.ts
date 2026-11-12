import type { BehaviorScenario } from "../../types.ts";

export const setupPstackModelConfig: BehaviorScenario = {
  type: "behavior",
  id: "setup-pstack-model-config",
  skill: "setup-pstack",
  turns: [
    {
      prompt:
        "/setup-pstack 帮我按我这边实际可用的模型，把 pstack 每个角色用哪个模型、推理预算多少配置好。请把最终的逐角色配置（预算加每个角色一行）写到 out/pstack-models.md 让我核对；能直接应用就应用，不能就说明原因。以后我再跑一遍，不应出现重复或互相冲突的配置。",
    },
  ],
  workspace: {
    files: {},
  },
  assertions: [{ kind: "turn-completed" }, { kind: "artifact-dir-nonempty", path: "out" }],
  rubric: {
    prompt:
      "这是 pstack 模型配置技能的执行观察。合格效果：产出一份按角色划分的模型配置，含一行推理预算（budget，给出所选档位和对应 effort）以及每个角色一条的模型选择，沿用技能使用的角色标签；并把同样的逐角色配置写到用户要求的 out/pstack-models.md 以便核对。写入方式应整文件覆盖，使重复执行保持幂等，不累积重复行、不产生互相冲突的配置。真实模型 slug 必须来自本会话确实可用的模型；检测不到可用模型时，应如实说明并要求用户提供可用模型，而不是编造 slug。gap：只在回复里贴一段配置而没有产出可核对的配置文件；编造未确认可用的模型名；缺少预算行或缺少逐角色行；或写入方式会随重复执行产生重复或冲突。环境限制（例如无法写入用户级配置目录）不算技能 gap，只要把等价配置写到可访问位置并说明即可。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    { id: "response-visible", description: "浏览器中能看到逐角色模型与预算配置说明的完整回复。" },
    {
      id: "artifact-visible",
      description: "工作区里能看到 out/pstack-models.md，人工确认含预算行与逐角色行。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/setup-pstack/SKILL.md",
    regression: "产出每个角色一条模型/预算配置并整文件覆盖以保持重跑幂等",
  },
  answers: [
    { match: "预算", selected: ["large"] },
    { match: "budget", selected: ["large"] },
  ],
};
