# adapted/agent-team 证据分析

> 本文件由 adapted 分析会话依据 `reviews/adapted-agent-team/` 快照、`port/dsh.md` 与当前适配实现写成。只审查 pstack 与 Agent Teams 在子代理互动工具上的差异。

## 1. 本轮范围

- 环境：`adapted` / `agent-team`，`kind: "conflict"`，加载 `dsh-pstack` 与 `@deepseek-ai/dsh-experimental-agent-team-profile 0.2.2-rc.1`。
- 版本：DSH `0.2.2-rc.1`，adapted `0.3.1`，上游 revision `ae5650febf4320793844c12c4adaa937f417f8da`。
- 批次：`adapted-agent-team-20261115085807` 全量重跑 4 条，当前快照 4 条记录。
- 覆盖：4 个 `record.json` + 4 张 `screenshot.png` 齐全。
- 本轮改动：新增 pstack 自己的 `pstack_agents`、`pstack_send`、`pstack_interrupt` 三个工具，绕开 Agent Teams 对同名原生工具的覆盖。

## 2. 版本安装纠正

第一次跑时 `*` 解析到 `@deepseek-ai/dsh-experimental-agent-team-profile 0.1.5-alpha.2`。npm 的 `latest` 标签正是 `0.1.5-alpha.2`，与 dsh `0.2.2-rc.1` 对齐的版本在 `next` 标签下。

根因在 `playground/scripts/lib/env.ts` 的 `profileManifest`。非 pstack 包依赖统一写 `"*"`，pnpm 取了 `latest`。旧包调用 `startContinuable`，dsh `0.2.2-rc.1` 只有 `startActivation`，`spawn_teammate` 因此失败。

修复：`@deepseek-ai/*` 的依赖改为 `dshVersion()`，第三方包仍用 `*`。重装日志确认安装 `0.2.2-rc.1`，`spawn_teammate` 恢复。

## 3. 冲突与修复

Agent Teams 在成员 scope 注册的 `list_agents`、`send_message`、`interrupt_agent` 只认 teammate 的 `target`，会覆盖 pstack 需要的同名控制。根因是名字相同，不能改外部包，只能给 pstack 换名字。

修复方案 A 已落地。`src/subagent.ts` 新增三个工具，直接调用 subagent 服务：

- `pstack_agents` 调 `subagents.listDescendants`，列直接子会话的 id、mode、activity。
- `pstack_send` 调 `subagents.sendMessage`，按 pstack child id 续跑。
- `pstack_interrupt` 调 `subagents.interrupt`，以 ancestor 权限按 id 中断。

`port/dsh.md` 与 `dsh.zh.md` 已说明：涉及 pstack 子代理时优先用 `pstack_agents`、`pstack_send`、`pstack_interrupt`，原生同名工具保留作 fallback。

## 4. 按能力类别汇总

| 场景 | 结论 | 关键观察 |
| --- | --- | --- |
| conflict-agent-team-spawn-contract | 通过 | `pstack_subagent` 返回 child id 和完成通知；`spawn_teammate` 返回 teammate `target=helper`；两者都跑通并有说明 |
| conflict-agent-team-list-agents-contract | 通过 | 用 `pstack_agents` 查到 pstack 子代理 `mode=continuable activity=running`；模型明确原生 `list_agents` 只列 teammate |
| conflict-agent-team-send-message-contract | 通过 | 用 `pstack_send` 续跑同一个 pstack 子代理，得到文件数与注释行数两步结果 |
| conflict-agent-team-interrupt-agent-contract | 通过 | 用 `pstack_interrupt` 中断 pstack 子代理，`pstack_agents` 状态从 running 变 inactive，无错误 |

四个场景均无工具报错，模型都按 `port/dsh.md` 的映射选用了 `pstack_*`。

## 5. 问题问答

### Q1 `profileManifest` 用 `*` 装到不兼容的 Agent Teams 版本

- 类型：plugin（已修）
- 能力类别：environment
- 影响场景：全部 agent-team probe
- 证据：[env.ts](../../../scripts/lib/env.ts)
- 现象：安装 `0.1.5-alpha.2`，`spawn_teammate` 报 `this.ctx.subagents.startContinuable is not a function`。
- 根因：npm `latest` 指向老版本，匹配 dsh 的 `0.2.2-rc.1` 在 `next` 标签下。
- 建议动作：`@deepseek-ai/*` 依赖改用 `dshVersion()`。
- 你的决定：接受。已改 `env.ts` 并移除 agent-team 的 `versionExemptions`。

### Q2 Agent Teams 同名工具覆盖 pstack 子代理控制

- 类型：plugin（已修）
- 能力类别：delegation
- 影响场景：`conflict-agent-team-list-agents-contract`、`conflict-agent-team-send-message-contract`、`conflict-agent-team-interrupt-agent-contract`
- 证据：
  - [list-agents record](scenarios/conflict-agent-team-list-agents-contract/adapted-agent-team/record.json)
  - [send-message record](scenarios/conflict-agent-team-send-message-contract/adapted-agent-team/record.json)
  - [interrupt-agent record](scenarios/conflict-agent-team-interrupt-agent-contract/adapted-agent-team/record.json)
- 现象：修复前，对 pstack 子代理 id 调 `list_agents`、`send_message`、`interrupt_agent` 都失败或看不到目标，报 `active teammate "<id>" not found`。
- 根因：Agent Teams 的成员 scope 工具与 pstack 依赖的原生控制同名，且只接受 team `target`。
- 与当前阶段 dsh.md 的关系：`port/dsh.md` 已补 `pstack_agents`、`pstack_send`、`pstack_interrupt` 三项，并把 `resume` 改为优先 `pstack_send`。
- 建议动作：采用方案 A，pstack 侧提供独立命名的控制工具。
- 你的决定：接受。已实现 `src/subagent.ts` 的三个工具，并重跑 4 个 probe 全部通过。

### Q3 两套派发同时可用，标识模型不同

- 类型：无（通过）
- 能力类别：delegation
- 影响场景：`conflict-agent-team-spawn-contract`
- 证据：[spawn-contract record](scenarios/conflict-agent-team-spawn-contract/adapted-agent-team/record.json)
- 现象：`pstack_subagent` 返回一次性 child id；`spawn_teammate` 返回持久 teammate `target=helper`，完成后留在 `list_agents` 成员表里。
- 根因：两条派发通道独立，语义不同。
- 建议动作：保留为说明项，不冲突。
- 你的决定：通过，无需处理。

## 6. dsh.md 适配说明审查

| 章节/行 | 当前说明 | 相关证据 | 结论 | 建议 |
| --- | --- | --- | --- | --- |
| Subagent fields / `resume` | 优先 `pstack_send`，原生 `send_message` 作 fallback | send-message | 够用 | 无 |
| Plugin tools / `pstack_agents` | 列 pstack 子会话 id、mode、activity | list-agents | 够用 | 无 |
| Plugin tools / `pstack_send` | 按 id 续跑 pstack 子代理 | send-message | 够用 | 无 |
| Plugin tools / `pstack_interrupt` | 按 id 中断 pstack 子代理 | interrupt-agent | 够用 | 无 |
| Plugin tools / `pstack_subagent` | 完成时发通知 | spawn-contract | 够用 | 无 |

## 7. 已确认的决定

1. `pstack_agents`、`pstack_send`、`pstack_interrupt` 统一优先于原生同名工具，base 环境也一样；原生工具保留作 fallback。这一条已写入 `port/dsh.md`。
2. `pstack_agents` 先只列直接子会话；需要递归后代时再扩展，不阻塞当前交付。

## 8. 后续动作

- `plugin`：Q1 版本解析已修；Q2 三个 pstack 控制工具已实现，4 个 probe 通过。
- `dsh-md`：已补三个工具和 `resume` 的优先映射。
- `ignore-environment`：无。
- `upstream`：无。
- `待你判断`：无。
