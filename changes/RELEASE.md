## 概要

本次发布对齐 DSH 0.2.2-rc.2，内置 pstack 升级到 0.15.43。主要变化是工具面从 7 个收缩到 4 个、角色文件升到 version 2 结构化路由，以及会话级 Poteto 工作流开关取代根预设。升级本插件前，请先把 DSH 升到 >=0.2.2-rc.2。

## 新增能力

- **Poteto 工作流开关**：不用再先选预设，按会话开启，可以和任意预设搭配使用。开启后每轮把 poteto-mode 规则保留在系统提示里。
  - 用法：在模型与推理等级菜单切换当前会话的开关。快捷键在 设置 → 通用设置 → 快捷键 里绑。新会话默认在 Pstack 配置弹窗的「通用」页设置。
- **Agent Teams 开关**：新增会话级「启用智能体团队协作」开关，以及全局默认「新会话默认开启智能体团队协作」。打开后 pstack_subagent 启动团队成员，可以在团队任务板上跟踪共享工作。
  - 用法：在模型与推理等级菜单切换当前会话的开关。新会话默认在 Pstack 配置弹窗的「通用」页设置。委派时给 pstack_subagent 传 name，便于用 list_agents 定位。

## 行为变更

- **兼容表改为按 DSH 范围分组**：之前一张表记录当前 pstack 基线，现在每个 DSH 范围一张小表，根 README 只留最新三个范围，更早的移到 docs/compatibility-history.md 及其中文副本。
  - 原因：单表看不出插件版本和 pstack 的对应，手写兼容键又和现有元数据重复。见 docs/decisions/2026-11-17-compatibility-table-grouping.md。
- **放弃未保存草稿改用统一的风险确认弹窗**：之前用浏览器原生 confirm，现在用 DSH RiskConfirmation，需要显式勾选确认后才能继续。

## 破坏性变更与迁移

- **工具面从 7 个收缩到 4 个**：移除 pstack_skill、pstack_agents、pstack_send，改由原生 list_agents、send_message 和直接读文件完成同样的事，pstack_subagent 与 pstack_interrupt 的参数名也有调整。这些接口由 agent 在真实调用时按新定义自动适配，不需要用户手动迁移。
  - 原因：pstack_skill 被模型忽略，只增加工具面。DSH 0.2.2-rc.2 用原生 list_agents、send_message 统一了 Standard 与 Team，内置预设又禁用了原生 interrupt_agent。
- **移除根预设 poteto-mode 与 poteto-mode-creator**：之前会话创建时选这两个根预设启用 Poteto，现在只能用会话级开关，插件随包只提供子代理预设（poteto-agent、comment-sicko、readonly）。
  - 迁移：不再选择根预设，改为在模型与推理等级菜单打开 Poteto 工作流开关，或在 Pstack 配置弹窗的「通用」页设为新会话默认。
  - 原因：根预设要按各自基础模式的工具集单独拼装，DSH 版本变动时容易对不齐，而这种变动又不影响其他适配工具。参照上游 Cursor 的 Custom Mode 后，改为工作流开关，可与任意预设搭配，包括 PTC 预设。
- **角色文件升到 version 2**：之前角色用 provider/model [effort] 字符串数组，现在改为结构化路由对象并升到 version 2。读取时自动迁移，.mdc 转成 JSON 并删除旧文件，version 1 字符串路由原地重写为 version 2。
  - 迁移：自动完成，无需手动操作。
  - 原因：provider 也可能含 /，按第一个 / 拆分字符串会有歧义。见 docs/decisions/2026-11-16-structured-role-routes.md。
- **角色清单从 17 个减到 9 个，预算从 4 档减到 3 档**：上游 pstack 0.15.43 退役 8 个角色、去掉 unlimited 档并把上限降到 xhigh，角色变为 9 个、预算变为 3 档（large、medium、small）。
  - 迁移：读取角色文件时自动丢弃退役角色，并把 unlimited 迁移为 large。要重新配置可重跑 /setup-pstack。

## 修复

- **推荐插件表**：之前推荐插件页列出 dsh-browser-use 与 dsh-mcp-client，两者在 DSH 0.2.2-rc.2 不可切换、始终显示未安装，现在移除，可选插件表同步更新。

## 兼容基线

- DSH 范围：>=0.2.2-rc.1 → >=0.2.2-rc.2（先升级 DSH，再升级本插件）
- pstack 版本：0.15.36 → 0.15.43

## 其他（内部）

- 发布说明改由 agent 会话生成，并作为发布前置条件（changes/RELEASE.md），旧的产物差异生成器移除。见 docs/decisions/2026-11-16-release-notes-authored-by-agent.md。
- 客户端 UI 改用 DSH primitives，Host 改用官方 DSH 服务类型，依赖按官方 catalog 对齐，兼容表改由脚本维护。
- playground 证据与截图刷新，评审记录 redaction 增强，本仓文档与决策记录做了清理。
