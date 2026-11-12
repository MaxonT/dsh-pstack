# DSH 中的 pstack

pstack 技能使用 Cursor 名称。在 DSH 中，每个会话读一次本文件，然后用下面的表格映射技能中的每个 Cursor 名称。`<pstack>` 指包含 `skills/` 和 `docs/` 的文件夹。每个 DSH 单元格都给出替代名、缺字段时的动作和会改变技能写法的回退。如果某个 Cursor 字段没有对应行，就丢弃它并说明。永远不要传入工具 schema 拒绝的字段或值。

## 工具

| Cursor | DSH |
| --- | --- |
| `Task` | `subagent` 立即返回 id，并在完成时通知；`subagent_fork` 继承当前对话。把角色写进 `prompt`，把目录写进 `cwd`；缺失的 Cursor 字段见“子代理字段”表。 |
| `AskQuestion` | `ask_user_question` 接受一批问题。`selected` 为空且没有 `custom` 表示用户跳过；超时是 `pending`，不是跳过。工具不存在时用纯文本提问。 |
| Open a todolist | `todo_write` 替换整个列表；状态为 `pending`、`in_progress` 和 `completed`。跳过的步骤保留为 `pending`，内容写 `skip: <reason>`；没有 `skipped` 状态。 |
| Run another pstack skill (`/name` or "the **name** skill") | `skill` 按名称加载目录中的技能。`disable-model-invocation: true` 时，用 `read` 读取 `<pstack>/skills/<name>/SKILL.md`。用户 `/name` 手势会直接注入技能；不要再调用 `skill`。 |
| `Grep`, `Glob` | `grep` 和 `glob` 是原生工具，直接调用。只有会话两者都没有时，才用 `bash` 运行 `rg`。 |

## 子代理字段

| Cursor | DSH |
| --- | --- |
| `subagent_type: generalPurpose` | 没有这个字段；省略它。角色来自 `prompt`，命名角色时来自 `<pstack>/agents/<name>.md`。 |
| `poteto-agent`, `comment-sicko` | 没有原生等价物。读取 `<pstack>/agents/<name>.md` 并作为 `prompt` 传入，或自己写角色说明。 |
| `readonly: true` | 没有沙箱字段。在 `prompt` 写“不要编辑文件”，依赖会话权限模式，并检查 `git status`。 |
| `readonly: false` | 省略。在会话权限模式下默认可写。 |
| `environment: "cloud"` | 没有云代理。有 `create_worktree` 时使用它，并把 checkout 作为 `cwd`；否则写跳过行。 |
| `environment: "local"` | 省略。默认就是本地。 |
| `cloud_base_branch: <b>` | 没有这个字段。把 `<b>` 传给 `create_worktree.from`；否则告诉子代理先 checkout `<b>`。 |
| `run_in_background: true` | 省略。`subagent` 总是立即返回，并在完成时通知。 |
| `resume` | 向子代理的 `agent_id` 发送 `send_message` 可以继续；只有执行永久停止时才新建 `subagent`。 |
| `file_attachments` | 没有这个字段。把路径列在 `prompt` 里；子代理会读取它们。 |

## 模型

| Cursor | DSH |
| --- | --- |
| `claude-<family>-<version>-<effort>[-fast]`, such as `claude-opus-5-5-xhigh` | 用 `provider`、`model` 和 `reasoning_effort` 组成路由；去掉 `-fast`。有效 id 来自 `list_subagent_models`。 |
| A `grok-*`, `gpt-*`, or other non-Claude slug | 选择最接近的已公布路由。没有匹配时省略 `provider` 和 `model`，让子代理回退，并说明这一点。 |
| `auto` or `inherit-parent` | 省略 `provider` 和 `model`；省略时使用子代理或父级默认值。 |
| The `pstack-models.mdc` rule, `~/.cursor/rules/pstack-models.mdc` | DSH 不读 `.mdc`；角色行在 `$DSH_HOME/AGENTS.md`。文件不在上下文时读取它。 |
| A role value `<model> <effort>`, such as `opus high` | 写成 `<provider>/<model> <effort>`；拆成 `provider`、`model` 和 `reasoning_effort`。 |

## setup-pstack

DSH 没有 rules 目录，也从不读取 `.mdc` 文件。每个会话加载 `AGENTS.md` 兼容链；用户全局文件是 `$DSH_HOME/AGENTS.md`。按它的步骤做这些替换：

- 检测。使用 `list_subagent_models`；把每条可用路由写成 `<provider>/<model> <effort>`。
- 默认值。可用的 slug 映射到路由；不可用的 slug 写成 `inherit-parent`。
- 写入。更新 `$DSH_HOME/AGENTS.md`，不是项目 `AGENTS.md`，并且只替换之前的角色行块。

## 路径

| Cursor | DSH |
| --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | 项目技能放在 `.dsh/skills/` 或 `.agents/skills/`。用户技能放在 `$DSH_HOME/skills/` 或 `$DSH_AGENTS_HOME/skills/`；后者默认 `~/.agents`。 |
| `~/.cursor/plugins/`, `.cursor-plugin/plugin.json` | profile 是 `$DSH_HOME/profiles/<name>/`，包含 `package.json` 和 `cordis.patch.yml`；插件 manifest 是 `package.json` 的 `dsh` 段。 |
| `.cursor/rules/*.mdc`, always-applied rules | `AGENTS.md` 兼容链；DSH 从不读取 `.mdc`。项目 `AGENTS.md`/`AGENTS.local.md` 加用户全局 `$DSH_HOME/AGENTS.md`。 |
| `https://github.com/cursor/plugins/blob/main/pstack/<path>` | 文件存在时用 `<pstack>/<path>`。读本地副本，不要抓取；需要时把 URL 给用户。 |
| Transcripts in `~/.cursor/projects/<slug>/agent-transcripts/` | `$DSH_HOME/sessions/<workspace-key>/<session>.jsonl`，每个会话一个 append-only 日志。可选 session-search 增加模型可见的搜索工具。 |

## Cursor-only features

DSH 没有 Cursor Automations、Bugbot、Cursor 云代理或内置 PR 工具。步骤需要它们时，在回复里写一行 `Skipped in DSH: <step>. <reason>.`，然后继续下一步。不要停止、提问或重试。后续步骤需要被跳过步骤的产物时，例如 URL 或 key，留占位符并在这行里点名。

| Cursor | DSH |
| --- | --- |
| Cursor Automations: routines, `update_state` routine calls, `api2.cursor.sh/automations` webhooks, routine wakes, and `SendToUser` secret requests | 用跳过行。 |
| Bugbot | 把 PR 评论当作普通 review thread，使用步骤给的 `gh` 命令；没有 check 或评论时跳过启动或等待 Bugbot。 |
| Cursor cloud agents | 把 `environment: "cloud"` 映射到本地 worktree；跳过需要云机器本身的步骤。 |
| A built-in PR tool | 通过 `bash` 使用步骤给的 `gh` 命令；这不是跳过，不要写跳过行。 |
