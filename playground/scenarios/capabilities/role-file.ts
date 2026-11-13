import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-role-file",
  capability: "role-file",
  phases: ["adapted"],
  turns: [
    {
      prompt:
        "先确认当前的 pstack 角色模型配置文件是否存在、里面有哪些角色路由，然后按其中一个已配置的角色派一个执行者，说明它用的路由。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# 角色文件探测\n\n读取角色模型配置并据此派发。\n",
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "用户能看到会话读取了 pstack 角色模型配置文件，并据此派发执行者、说明所用路由。读取失败或忽略配置直接编造路由，记为缺口。",
  },
  uiObservations: [
    {
      id: "reply-visible",
      description: "浏览器中能看到角色配置内容和对派发路由的说明。",
    },
  ],
};

export default scenario;
