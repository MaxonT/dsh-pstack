/** Copy for the session poteto-mode switch. */

const en = {
  label: "Poteto workflow",
  description: "Keep the poteto-mode workflow in the system prompt on every turn.",
  failed: "Could not switch poteto mode: {message}",
  enabledLabel: "Poteto workflow is on",
  defaultLabel: "Default for new sessions",
  defaultDescription: "New sessions start with the Poteto workflow enabled.",
  defaultFailed: "Could not save the default: {message}",
  agentTeamLabel: "Default Agent Teams for new sessions",
  agentTeamDescription: "New sessions start with Agent Teams enabled.",
  shortcutLabel: "Toggle Poteto workflow",
  enabledNotice: "Poteto workflow enabled",
  disabledNotice: "Poteto workflow disabled",
} as const;

const zh = {
  label: "Poteto 工作流",
  description: "每轮把 poteto-mode 工作流保留在系统提示里。",
  failed: "切换 Poteto 模式失败：{message}",
  enabledLabel: "Poteto 工作流已开启",
  defaultLabel: "新会话默认开启",
  defaultDescription: "新建会话默认开启 Poteto 工作流。",
  defaultFailed: "保存默认值失败：{message}",
  agentTeamLabel: "新会话默认开启智能体团队协作",
  agentTeamDescription: "新建会话默认开启智能体团队协作。",
  shortcutLabel: "切换 Poteto 工作流",
  enabledNotice: "Poteto 工作流已开启",
  disabledNotice: "Poteto 工作流已关闭",
} as const satisfies Record<keyof typeof en, string>;

export type PotetoKey = keyof typeof en;

export const poteto = { en, zh } as const;
