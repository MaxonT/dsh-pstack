# DSH 适配判定依据

本文件只记录 `playground/raw/dsh.md` 每个替换项背后的 DSH 事实和可复查位置。不记录 port 实现、插件建议、角色设计或任何推测结论。

## Tools

| dsh.md 行 | DSH 证据 |
| --- | --- |
| `Task` | `@deepseek-ai/dsh-tool-subagent` 的 `subagent`/`subagent_fork` 参数与描述；`@deepseek-ai/dsh-tool-subagent-control` 的 `send_message`/`interrupt_agent` 描述 |
| `AskQuestion` | `@deepseek-ai/dsh-tool-ask-user` 的 `questions` schema 和 `answers` 输出 |
| Open a todolist | `@deepseek-ai/dsh-tool-todo` 的 `STATUSES`、`toTodoList`、`parameters` 和 README；DSH 不支持 `skipped` 状态 |
| Run another pstack skill | `@deepseek-ai/dsh-tool-skill` 的 `skill` 注册；`dsh-skill-filesystem` 的 modelInvocable/userInvocable 与 `disable-model-invocation` 解析 |
| `Grep`, `Glob` | `@deepseek-ai/dsh-tool-fs-search` 的 `glob`/`grep` 注册；`standard.patch.yml` 的 fs-search 组 |

## Subagent 字段

| dsh.md 行 | DSH 证据 |
| --- | --- |
| `subagent_type: generalPurpose` | `@deepseek-ai/dsh-tool-subagent` 参数表没有 `subagent_type` |
| `poteto-agent`, `comment-sicko` | `@deepseek-ai/dsh-tool-subagent` 参数表没有这两个原生类型 |
| `readonly: true` | `@deepseek-ai/dsh-tool-subagent` 无 sandbox 参数；权限由 `dsh-sandbox-policy`/`dsh-permission-presets` 决定 |
| `readonly: false` | `@deepseek-ai/dsh-tool-subagent` 无 writable 字段；默认受会话权限模式约束 |
| `environment: "cloud"` | `@deepseek-ai/dsh-tool-subagent` 无 cloud 环境字段；可选 `dsh-experimental-tool-worktree` 的 `create_worktree` 提供本地 worktree |
| `environment: "local"` | `@deepseek-ai/dsh-tool-subagent` 默认本地执行 |
| `cloud_base_branch: <b>` | `@deepseek-ai/dsh-tool-subagent` 无该字段；`dsh-experimental-tool-worktree` 的 `create_worktree.from` 可指定本地基线 |
| `run_in_background: true` | `@deepseek-ai/dsh-tool-subagent` 无后台字段；`subagent` 立即返回并在完成时通知 |
| `resume` | `@deepseek-ai/dsh-tool-subagent-control` 的 `send_message`/`interrupt_agent` 描述 |
| `file_attachments` | `@deepseek-ai/dsh-tool-subagent` 无附件字段；路径通过 `prompt` 或 `read` 传递 |

## Models

| dsh.md 行 | DSH 证据 |
| --- | --- |
| `claude-<family>-<version>-<effort>[-fast]` | `@deepseek-ai/dsh-tool-subagent` 的 `list_subagent_models`、`provider`、`model`、`reasoning_effort` 参数；`modelDiscovery` 配置 |
| `grok-*`, `gpt-*` 等非 Claude slug | 同上；DSH 只接受实际公布的 provider/model/effort 路由 |
| `auto` / `inherit-parent` | 同上；省略 `provider`/`model` 表示继承，`reasoning_effort` 省略时使用模型默认值 |
| `pstack-models.mdc` / `~/.cursor/rules/pstack-models.mdc` | `dsh-agent-instructions` 的 AGENTS 兼容链；base DSH 没有 `.mdc` rules 目录 |
| 角色值 `<model> <effort>` | `@deepseek-ai/dsh-tool-subagent` 的 `provider`、`model`、`reasoning_effort` 参数 |


## Paths

| dsh.md 行 | DSH 证据 |
| --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | `dsh-skill-filesystem` 的 join 声明；`dsh-home-paths` 的 `DSH_HOME`/`DSH_AGENTS_HOME` |
| `~/.cursor/plugins/`, `.cursor-plugin/plugin.json` | `dsh-app-boot` 的 `PROFILES_DIR`/`PROFILE_PATCH_FILENAME`；`dsh-package-manifest` |
| `.cursor/rules/*.mdc`, always-applied rules | `dsh-agent-instructions` 的 AGENTS 兼容链；`dsh-home-paths` |
| `https://github.com/cursor/plugins/blob/main/pstack/<path>` | 生成器的本地复制目标；不涉及运行时下载 |
| `~/.cursor/projects/<slug>/agent-transcripts/` | `dsh-session-persistence-jsonl` 的 `projectKey`/`encodeSegment`；`dsh-official-bundles` |

## Cursor-only features

| dsh.md 行 | DSH 证据 |
| --- | --- |
| Cursor Automations: routines, `update_state`, webhooks, routine wakes, `SendToUser` secrets | `dsh-official-bundles` 没有对应运行时能力 |
| Bugbot | 没有 Bugbot 服务；GitHub PR 只是普通 review thread，可用宿主 `gh` 操作 |
| Cursor cloud agents | `dsh-tool-subagent` 无云代理；可选 `dsh-experimental-tool-worktree` 提供本地 worktree |
| 内置 PR 工具 | 没有内置 PR 工具；由宿主 `gh` 通过 `bash` 执行 |


