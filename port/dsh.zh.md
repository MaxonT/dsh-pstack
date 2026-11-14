# pstack in DeepSeek Harness

pstack 技能使用 Cursor 名称。在 DeepSeek Harness 中，每会话读取一次本文件，然后用下面的表格映射技能里的每个 Cursor 名称。`<pstack>` 指已安装的 `dsh-pstack` 包中存放 `skills/` 和 `docs/` 的目录。

只使用当前会话实际可见的工具。映射的工具或可选能力不可用时，按该行的 fallback 处理。不要因为文件提到某个名称就假设可选插件已启用。

## Tools

| Cursor | DeepSeek Harness |
| --- | --- |
| `Task` | `pstack_subagent` 按选中的角色路由各启动一个子智能体，并返回所有子智能体 id 及其解析后的路由。只有 `prompt` 必填；`description`、`agent`、`role`、`roleRoute`、`reasoningEffort`、`cwd` 和 `maxDepth` 都可选。多路由列表角色必须使用 `pstack_roles` 返回的 route id；省略或无效会失败，不会静默使用第一条。 |
| `AskQuestion` | `ask_user_question` 接收一批带选项和自由输入的问题。只有活跃的根智能体有人工回答者；被委派的子智能体把问题保留在结果里。工具不可用时用纯文本提问。 |
| Open a todolist | `todo_write` 替换整个列表，没有 `skipped` 状态。跳过的步骤保持可见，在 `content` 中写 `skip: <reason> - <step>`，状态设为 `completed`。 |
| Run another pstack skill (`/name` 或 "the **name** skill") | `pstack_skill` 按精确 kebab-case `name` 加载 pstack 技能，包括被 `disable-model-invocation` 从原生 `skill` 工具隐藏的技能。用相对 `resource` 读取 `SKILL.md` 旁的参考或 playbook；用户 `/name` 手势直接加载技能。 |
| `Grep`, `Glob` | `grep` 和 `glob` 是原生工具，直接调用。只有会话两者都没有时才用 `bash` 的 `rg`。 |

## Subagent fields

| Cursor | DeepSeek Harness |
| --- | --- |
| `subagent_type: generalPurpose` | `agent: "general"` 加入父 preset 并继承其工具。只有 `prompt` 必填；未用的 `description`、`role`、`roleRoute`、`reasoningEffort` 或 `cwd` 可省略。 |
| `poteto-agent`, `comment-sicko` | `agent: "poteto-agent"` 或 `agent: "comment-sicko"`。它们是 agent preset，不是 `subagent_type` 值。 |
| `readonly: true` | `agent: "readonly"` 给子智能体只读沙箱。需要写入时用 `general`。 |
| `readonly: false` | `agent: "general"`。 |
| `environment: "cloud"` | 没有云代理。可用时用 `create_worktree`，把 checkout 作为 `cwd`；否则按规则跳过。 |
| `environment: "local"` | 省略 `cwd`；子智能体继承会话目录。 |
| `cloud_base_branch: <b>` | 作为 `create_worktree.from` 传入；否则让子智能体先 checkout `<b>`。 |
| `run_in_background: true` | 省略。`pstack_subagent` 由托管执行并通过完成通知返回。 |
| `resume` | 用 `send_message` 发给已有子智能体 id 继续；只有永久停止时才新建 `pstack_subagent`。 |
| `file_attachments` | 在 `prompt` 中列出真实路径，子智能体用 `read` 读取。 |

## Models

| Cursor | DeepSeek Harness |
| --- | --- |
| `claude-<family>-<version>-<effort>[-fast]` | 不要传 Cursor slug。传 `role: "<role key>"`；`pstack_subagent` 读取 `$DSH_HOME/pstack-models.json` 并提供配置的路由。去掉 `-fast`；DSH 没有速度参数。 |
| A `grok-*`、`gpt-*` 或其他非 Claude slug | 选最接近的已公布路由，或省略 `role` 和 `roleRoute` 让子智能体继承父路由，并说明这一点。 |
| `auto` 或 `inherit-parent` | 省略 `role` 和 `roleRoute`；子智能体继承父路由。 |
| pstack 角色文件 | `$DSH_HOME/pstack-models.json`，`$DSH_HOME` 默认 `~/.dsh`。base DSH 不加载它；`pstack_subagent` 每次委派都读取。文件缺失时所有角色继承父路由。 |
| 形如 `<model> <effort>` 的角色值 | 写成 `provider/model [effort]`；一个角色保存这些路由字符串的数组。多路由列表角色必须使用 `pstack_roles` 返回的 `roleRoute` id；自动面板为每条路由启动一个子智能体。 |

## setup-pstack

`setup-pstack` 写 `$DSH_HOME/pstack-models.json`，即适配器每次委派读取的角色文件。先用 `pstack_models` 发现本部署提供的完整 provider、model 和 effort 路由，而不是只有父会话路由。

- Detect：把每条真实路由写成 `provider/model [effort]`。检测不到时请用户粘贴路由。
- Defaults：映射找到的路由；不可用路由用 `inherit-parent` 或 `auto`。把选定预算映射到最接近的可用 effort，并说明选择。
- Write：写 `version: 1`、可选 `budget` 和由路由数组组成的 `roles` 对象。覆盖整个文件，保证重跑幂等；缺失角色继承父路由。

## Paths

| Cursor | DeepSeek Harness |
| --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | 项目技能位于 `.dsh/skills/` 或 `.agents/skills/`；用户技能位于 `$DSH_HOME/skills/` 或 `~/.agents/skills/`。随包 pstack 技能通过 `pstack_skill` 加载。 |
| `~/.cursor/plugins/`, `.cursor-plugin/plugin.json` | 在 `SKILL.md` 旁解析包资源；插件 manifest 是 `package.json` 的 `dsh` 段。 |
| `.cursor/rules/*.mdc`, always-applied rules | `AGENTS.md` 兼容链。base DSH 不读取 `.mdc`；pstack 角色文件只由 `pstack_subagent` 读取。 |
| `https://github.com/cursor/plugins/blob/main/pstack/<path>` | 包内存在该文件时使用 `<pstack>/<path>`。读取本地副本，需要链接时给用户公开 URL。 |
| Transcripts in `~/.cursor/projects/<slug>/agent-transcripts/` | `$DSH_HOME/sessions/<workspace-key>/<session>.jsonl`。可选 session search 增加面向模型的搜索工具。 |

## Cursor-only features

DeepSeek Harness 没有 Cursor Automations、Bugbot、Cursor cloud agents 或内置 PR 工具。步骤需要它们时，在回复中写一行 `Skipped in DeepSeek Harness: <step>. <reason>.`，然后继续。跳过的步骤不算通过。

| Cursor | DeepSeek Harness |
| --- | --- |
| Cursor Automations, routines, webhooks, `SendToUser` secrets | 按行跳过。步骤适合时改用本地调度或后台工作。 |
| Bugbot | 把 PR 评论当普通 review thread，使用步骤给出的 `gh` 命令；没有检查或评论时跳过启动或等待 Bugbot。 |
| Cursor cloud agents | 把 `environment: "cloud"` 映射到本地工作树；需要云机器的步骤跳过。 |
| A built-in PR tool | 用 `bash` 里的步骤 `gh` 命令；这不是跳过，不写跳过行。 |
| Cursor Projects | 按行跳过；没有持久云 Project 协调器。 |

## Plugin tools

本包在原生 DSH 工具之外注册四个面向模型的工具。

| Tool | Purpose |
| --- | --- |
| `pstack_subagent` | 按选中的角色路由启动子智能体，返回所有 id 和解析后的路由；完成时发通知。它接受可选的 description、agent、role、roleRoute、reasoningEffort、cwd 和 maxDepth。 |
| `pstack_skill` | 按精确 kebab-case 名称加载 pstack 技能，包括隐藏技能；`resource` 读取参考或 playbook。 |
| `pstack_models` | 列出本部署实际提供的完整 provider、model 和 reasoning-effort 路由，而不是只有父路由。 |
| `pstack_roles` | 列出 pstack 角色、shape，以及可传给 `roleRoute` 的已配置 route id。 |

## Local replacements

| Cursor | DeepSeek Harness |
| --- | --- |
| `create-skill` | 用 vendored `writing-for-agents` 技能创建或评审技能，再直接写并校验 `SKILL.md`。 |
| `/deslop` | 用 vendored `deslop` 技能处理代码噪声；`unslop` 只处理 prose。 |
| `/loop` | 自动继续用 `create_goal`，定时心跳用 `schedule_create`，可观察事件用后台 `bash` watcher。 |
| `/automate` | 用 `writing-for-agents` 把已验证的工作模式写成个人技能；历史搜索不可用时用可用的会话证据。 |
| Custom Mode | 新建会话时选择随包 `poteto-mode` 或 `poteto-mode-creator` 根 preset。 |
| `/visualize` | 图表返回 Mermaid 文本；DSH 没有内置图表渲染器，不要声称已生成图片。 |
| `statechart` | 图表返回 Mermaid 文本；DSH 没有内置 SVG 渲染器，不要声称已生成图片。 |
| `ketchup-video` | 技能自带渲染器能产出可核对产物时运行它；否则返回文字摘要并说明。 |
| `control-ui`, `control-cli`, `cursor-team-kit` | 使用 vendored 指令技能；浏览器或 PTY 依赖写在其 `SKILL.md`。 |
