# DSH 中的 pstack

pstack 技能使用 Cursor 名称。在 DSH 中，每个会话读一次本文件，然后用下面的表格映射技能中的每个 Cursor 名称。`<pstack>` 指包含 `skills/` 和 `docs/` 的文件夹。每个 DSH 单元格都说明会改变技能写法的行为差异，而不只是替换名称。如果某个 Cursor 字段没有对应行，就丢弃它并说明。永远不要传入工具 schema 拒绝的字段或值。

## 工具

| Cursor | DSH |
| --- | --- |
| `Task` | `subagent`。它启动一个独立管理的子代理，并立即返回其 id；运行时会在子代理完成时通知你。其 schema 接受 `description`、`prompt` 和可选的 `cwd`，在会话启用模型选择时还接受 `provider`/`model`/`reasoning_effort`。没有 `subagent_type`、`readonly`、`run_in_background`、`environment`、`cloud_base_branch` 或 `file_attachments` 字段；替换方式见“子代理字段”表。`subagent_fork` 改为启动一个继承当前对话的子代理。 |
| `AskQuestion` | `ask_user_question`。它接受 `questions` 数组，每个问题一项；每项包含 `id`、`question`，可选 `header`/`options`/`multi_select`。答案返回选中的标签和可选的 `custom`；`selected` 为空且没有 `custom` 表示用户明确跳过该问题，这是可以继续的有效回答。超时返回 `pending`，不是跳过，问题仍可回答。当会话不提供该工具时，用纯文本提问。 |
| Open a todolist | `todo_write`。每次调用替换整个列表，因此在每个阶段都要重发所有条目及其状态。状态只有 `pending`、`in_progress` 和 `completed`；没有 `skipped` 状态。pstack 中标记为 `skip: <reason>` 的步骤要作为 `pending` 条目保留，内容写 `skip: <reason>`；绝不要发送 `status: "skipped"`，也不要省略该条目。列表只有一个所有者，不支持局部更新，没有读回工具，重复内容会被拒绝。 |
| Run another pstack skill (`/name` or "the **name** skill") | `skill` 加上技能的 `name`，会在会话技能目录列出该技能时加载其完整说明。在 frontmatter 中设置 `disable-model-invocation: true` 的技能不会进入模型目录；用 `read` 读取 `<pstack>/skills/<name>/SKILL.md` 并遵循它。当你让用户输入该技能时，写 `/<name>`；DSH 会在其斜杠菜单中列出用户可调用的技能，不带插件命名空间。 |
| `Grep`, `Glob` | `grep` 和 `glob` 是原生工具，直接调用它们。`grep` 接受必填的 ripgrep 正则、可选路径和一个 include glob；不支持否定。`glob` 接受必填的 pattern 和可选路径，包含隐藏与忽略文件，并按修改时间顺序返回路径。只有会话两者都没有时，才用 `bash` 运行 `rg`。 |

## 子代理字段

| Cursor | DSH |
| --- | --- |
| `subagent_type: generalPurpose` | 没有这个字段。省略它；每个 `subagent` 子代理都是通用型的，并从 `prompt` 取得自己的角色。 |
| `poteto-agent`, `comment-sicko` | 没有原生等价物。当 `<pstack>/agents/<name>.md` 存在时，用 `read` 读取它，并把它的说明作为子代理的 `prompt` 传入；否则你自己把角色写进 `prompt`。 |
| `readonly: true` | 没有这个字段；`subagent` 的 schema 没有沙箱参数。对文件的影响遵循会话的权限模式（`read-only`、`workspace-write` 或 `danger-full-access`），子代理无法从内部放宽该模式。还要在 `prompt` 中写明“不要编辑文件”，并在之后检查 `git status`。 |
| `readonly: false` | 省略。在会话的权限模式下，可写是默认值。 |
| `environment: "cloud"` | DSH 不运行云代理。本地等价物是独立的 worktree。需要启用 `@deepseek-ai/dsh-experimental-tool-worktree`（它也随 `@deepseek-ai/dsh-experimental-forge-bundle` 一起提供），其 `create_worktree` 工具会创建分支和 checkout；把该 checkout 作为子代理的 `cwd` 传入。没有该 bundle 时，按那一行说明跳过。 |
| `environment: "local"` | 省略。子代理默认在本地机器上运行。 |
| `cloud_base_branch: <b>` | 没有这个字段。启用 `create_worktree` 时，把 `<b>` 作为它的 `from` 传入；否则在 `prompt` 中告诉执行者先检出 `<b>`。 |
| `run_in_background: true` | 省略。`subagent` 总是立即返回，运行时会在子代理完成时通知你。 |
| `resume` | 向子代理的 `agent_id` 发送 `send_message` 可以继续它。工作中的子代理会在下一步收到消息；空闲的子代理会用该消息开启新一轮。只有永久停止的执行才无法继续；此时启动一个新的 `subagent`，并把先前的结果粘贴到它的 `prompt` 中。 |
| `file_attachments` | 没有这个字段。在 `prompt` 中列出路径；子代理会用 `read` 读取它们。 |

## 模型

| Cursor | DSH |
| --- | --- |
| `claude-<family>-<version>-<effort>[-fast]`, such as `claude-opus-5-5-xhigh` | 委派调用中的一个路由。`provider` 和 `model` 选择系列与版本，`reasoning_effort` 接收推理强度。有效的 id 来自 `list_subagent_models`。不带参数时，它列出各 provider；带 `provider` 时列出其模型；带 `provider` + `model` 时列出该模型的推理强度。`provider` 和 `model` 要一起提供。没有 `-fast` 区分；去掉它。 |
| A `grok-*`, `gpt-*`, or other non-Claude slug | 路由不区分 provider。选择 `list_subagent_models` 公布的最接近的 `provider`/`model` 组合。没有匹配项时，省略 `provider` 和 `model`，让子代理回退到兼容的父路由，并说明这一点。 |
| `auto` or `inherit-parent` | 省略 `provider` 和 `model`。省略的值使用子代理默认值，并回退到兼容的父级值；路由改变时，省略的 `reasoning_effort` 使用模型默认值。 |
| The `pstack-models.mdc` rule, `~/.cursor/rules/pstack-models.mdc` | DSH 没有 `.mdc` 规则，也没有 `rules/` 目录。每个会话加载的是与 `AGENTS.md` 兼容的指令链，下面的 `setup-pstack` 说明了角色行所在的位置。当它们还不在上下文中时，用 `read` 读取那个文件。当文件或角色行缺失时，使用技能默认 slug，并按上面的行进行映射。 |
| A role value `<model> <effort>`, such as `opus high` | 角色值是 `<provider>/<model> <effort>` 路由。把 `<provider>` 作为 `provider` 传入，`<model>` 作为 `model` 传入，`<effort>` 作为 `reasoning_effort` 传入。 |

## setup-pstack

DSH 没有 rules 目录，也从不读取 `.mdc` 文件。每个会话改为加载与 `AGENTS.md` 兼容的指令链。项目链是 `AGENTS.md` 或 `AGENTS.local.md`（也接受 `CLAUDE.md` 和 `CLAUDE.local.md`），用户全局文件是 `$DSH_HOME/AGENTS.md`，其中 `$DSH_HOME` 是 `DSH_HOME` 环境变量，默认 `~/.dsh`。因此 `setup-pstack` 把它的角色行写在那里。按它的步骤执行，并做以下改动：

- 检测。检测到的模型是 `list_subagent_models` 公布的路由。每条路由都是一个 `provider`/`model` 组合，并带有该模型接受的 `reasoning_effort` id。把真实路由写成 `<provider>/<model> <effort>`。effort 是最后一个 token，因此预算步骤可以按原样执行。
- 默认值。用上面的行映射每个默认 slug。如果某个 slug 的系列有公布的路由，就变成那个 `<provider>/<model> <effort>`；此部署不提供的 slug 变成 `inherit-parent`。
- 写入。更新用户全局的 `$DSH_HOME/AGENTS.md`，不写 frontmatter，然后写注释行、`# budget` 行，以及第 5 步中每个角色一行。只替换先前的角色行块，并保留用户自己的指导；没有专门的规则文件需要覆盖。永远不要把角色行放进项目的 `AGENTS.md`，它属于代码仓库。

## 路径

| Cursor | DSH |
| --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | 项目技能位于 `.dsh/skills/` 或 `.agents/skills/`。用户技能位于 `$DSH_HOME/skills/` 或 `$DSH_AGENTS_HOME/skills/`，其中 `$DSH_AGENTS_HOME` 默认为 `~/.agents`。 |
| `~/.cursor/plugins/`, `.cursor-plugin/plugin.json` | 一个 profile 是 `$DSH_HOME/profiles/<name>/`，其中包含带有序 bundle 列表的 `package.json` 和 `cordis.patch.yml` 用户补丁层；已安装的插件包位于该 profile 的 `node_modules/` 中。插件的 manifest 是其 `package.json` 的 `dsh` 段；没有与 `.cursor-plugin/plugin.json` 等价的文件。`plugin_manager` 工具列出、启用、禁用、安装和移除插件与 bundle。 |
| `.cursor/rules/*.mdc`, always-applied rules | 与 `AGENTS.md` 兼容的指令链。DSH 从不读取 `.mdc` 文件。每个会话加载项目的 `AGENTS.md`/`AGENTS.local.md`，以及用户全局的 `$DSH_HOME/AGENTS.md`。模型角色行使用同一条链。参见“模型”和 setup-pstack。 |
| `https://github.com/cursor/plugins/blob/main/pstack/<path>` | 当该文件存在时，使用 `<pstack>/<path>`。插件自带技能、`docs/guide/` 和 `README.md`。读取本地副本，永远不要抓取它。用户需要链接时，把 URL 给他们。 |
| Transcripts in `~/.cursor/projects/<slug>/agent-transcripts/` | `$DSH_HOME/sessions/`，每个会话一个只追加的 `.jsonl` 文件，位于工作区路径对应的文件夹下，路径分隔符会折叠为 `-`。只读取本工作区的文件夹，使用 `read` 和 `grep`。要让 `session_search`、`session_trace` 和 `session_event_*` 工具在同一批转录上工作，需要启用 `@deepseek-ai/dsh-experimental-session-search`；否则 DSH 没有面向模型的转录搜索。 |

## Cursor 独有的功能

DSH 没有 Cursor Automations、Bugbot、Cursor 云代理或内置 PR 工具。当某个步骤需要其中之一时，在回复中写一行 `Skipped in DSH: <step>. <reason>.`，然后继续下一步。不要停下、询问或重试。当后续步骤需要被跳过步骤产出的东西时，例如 URL 或 key，留下占位符，并在那一行里说明它。

| Cursor | DSH |
| --- | --- |
| Cursor Automations: routines, `update_state` routine calls, `api2.cursor.sh/automations` webhooks, routine wakes, and `SendToUser` secret requests | 按那一行说明跳过。 |
| Bugbot | GitHub PR 上的 Bugbot 评论是普通审查线程，因此通过 `bash` 运行该步骤给出的 `gh` 命令。启用 `@deepseek-ai/dsh-experimental-forge-bundle` 会在会话旁增加变更请求跟踪，并驱动 `gh` CLI；只在某个步骤需要该跟踪时启用它。当 PR 没有 Bugbot 检查或评论时，跳过启动、等待或配置 Bugbot 的步骤。 |
| Cursor cloud agents | `environment: "cloud"` 映射到本地 worktree，如“子代理字段”所述。跳过需要云代理本身的步骤，例如其仪表板状态或其自己的机器。 |
| A built-in PR tool | 通过 `bash` 使用该步骤给出的 `gh` 命令，例如 `gh pr create`。这不算跳过，因此不要写那一行。 |
