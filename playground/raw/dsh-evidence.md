# DSH 适配判定依据

本文件保存 `playground/raw/dsh.md` 当前内容的逐行判定证据。它不是运行时文件，生成器不读；DSH 升级后复核 `dsh.md` 时直接引用这里的事实。

## 覆盖检查

| 章节 | dsh.md 行数 | 证据行数 |
| --- | --- | --- |
| Tools | 5 | 5 |
| Subagent fields | 10 | 10 |
| Models | 5 | 5 |
| Paths | 5 | 5 |
| Cursor-only features | 4 | 4 |

## 使用规则

- `dsh.md` 的每个表格行在下面都有且只有一行对应记录。行数必须一致，不能把多个工具合并成一段。
- `Cursor 侧` 写 Cursor 的原始语义；`DSH 判定` 写 `dsh.md` 最终采用的答案；`差异与写法` 写技能改写时必须记住的差异和操作规则；`证据` 写 DSH checkout 中的包、schema、README 或运行时探测点。
- DSH 没有的能力写 `无`，同时给替代写法或跳过规则。不要只写“不支持”而没有后续动作。
- 证据优先级：包内 schema/源码 > 官方 README/配置目录 > 运行时探测。DSH 升级后先重跑这里的检查，再改 `dsh.md`。

## 关键差异

| 主题 | Cursor 侧 | DSH 判定 | 必须记住的差异 |
| --- | --- | --- | --- |
| 待办列表 | `TodoWrite` 状态为 pending/in_progress/completed；pstack 用 `skip: <reason>` 文本表示跳过 | `todo_write` 同样是整表替换，状态只有 pending/in_progress/completed | DSH 没有 `skipped` 状态；跳过项保留为 `pending`，内容写 `skip: <reason>`，绝不发送 `status: "skipped"`，也不能省略该条目 |
| 提问 | `AskQuestion` 单问题、选项 | `ask_user_question` 支持 `questions[]` 批量，`multi_select`，答案 `selected`/`custom` | 空 `selected` 且无 `custom` 是用户明确跳过，不是超时；超时是 `pending`，问题仍可回答 |
| 子代理 | `Task` 有 subagent_type/readonly/run_in_background/environment 等字段 | `subagent`/`subagent_fork` 只接受 cwd/description/prompt 和可选路由；续聊用 `send_message` | 没有沙箱字段、后台字段、云环境字段；readonly 靠会话权限和 prompt，云环境用本地 worktree |
| 技能调用 | `/name` 或 **name** skill | `skill` 工具按 name 加载；用户 `/name` 是独立手势，直接注入 `<skill_content>` | `disable-model-invocation: true` 只影响模型目录，不阻止用户手势；不要为手势再调 `skill` |
| 模型规则 | `~/.cursor/rules/pstack-models.mdc` | `$DSH_HOME/pstack-models.mdc`，由 pstack 适配器读取；base DSH 没有 `.mdc` 和 rules 目录 | 角色行不放进 AGENTS.md 或 CLAUDE.md；格式为 `<provider>/<model> <effort>` |
| 会话转录 | `~/.cursor/projects/<slug>/agent-transcripts/` | `$DSH_HOME/sessions/<workspace-key>/<session>.jsonl` | 搜索转录需要可选 session-search 插件；base 没有模型可见的 session_search 工具 |

## Tools

| dsh.md 行 | Cursor 侧 | DSH 判定 | 差异与写法 | 证据 |
| --- | --- | --- | --- | --- |
| `Task` | 启动子任务；schema 含 `subagent_type`、`readonly`、`run_in_background`、`environment`、`cloud_base_branch`、`resume`、`file_attachments` 等字段 | `subagent` 独立子代理，立即返回 id，完成时通知；`subagent_fork` 继承当前对话。参数为 `description`、`prompt`、可选 `cwd`；启用模型选择时加 `provider`/`model`/`reasoning_effort` | 没有 `subagent_type`；角色写在 `prompt` 或读取 `<pstack>/agents/<name>.md`。没有沙箱字段；`readonly` 行见下。没有后台标志，`subagent` 总是异步返回。续聊用 `send_message`，中止用 `interrupt_agent` | `@deepseek-ai/dsh-tool-subagent/lib/index.js` 的 `parameters` 块（约 372-410 行）与工具描述；`dsh-tool-subagent-control/lib/index.js`；`standard.patch.yml` delegation 组 |
| `AskQuestion` | 单问题提问，选项和自由文本 | `ask_user_question` 接受 `questions[]`，每项 `id`/`question`/可选 `header`/`options`/`multi_select`；返回 `answers[]` 的 `selected`/`custom` | Cursor 单问题，DSH 是一个批次。`selected=[]` 且 `custom` 为空表示用户明确跳过，继续执行；超时返回 `pending`，不能被当作跳过。没有工具时用纯文本提问 | `@deepseek-ai/dsh-tool-ask-user/lib/index.js` 的 `questions` schema 与 `answers` 输出（约 67-176、224-300 行）；`standard.patch.yml` `tool-ask-user` |
| Open a todolist | 打开待办列表；pstack 的跳过项写成 `skip: <reason>` 文本 | `todo_write` 整表替换；状态只有 `pending`、`in_progress`、`completed` | **DSH 不支持 `skipped` 状态**。跳过步骤保留为 `status: "pending"`、`content: "skip: <reason>"`，不能发 `status: "skipped"`，不能省略该条。整表重发；没有局部更新、没有读回工具；重复 `content` 会被拒绝；列表只属于当前 agent session | `@deepseek-ai/dsh-tool-todo/lib/index.js`：`STATUSES`、`toTodoList`、`parameters`、`DESCRIPTION_*`（约 30-160 行）；README 的 “What each call does” 与 “Known Limitations” |
| Run another pstack skill | `/name` 或 “the **name** skill” 调用另一个技能 | `skill` 工具按 `name` 加载完整说明；`disable-model-invocation: true` 的技能不在模型目录，改用 `read <pstack>/skills/<name>/SKILL.md`；用户消息里的 `/name` 是独立手势，DSH 直接把 `<skill_content>` 注入当前 step | 模型可见目录里的技能走 `skill`；不可见技能走 `read`；用户手势既不是模型目录也不是 `skill` 调用，不要重复调用。用户斜杠菜单没有 plugin namespace | `@deepseek-ai/dsh-tool-skill/lib/index.js` 的 `skill` 注册（约 788-800 行）；`dsh-skill-filesystem` README 的 modelInvocable/userInvocable 与 `disable-model-invocation` 解析；`dsh-tool-skill` 用户手势注入代码 |
| `Grep`, `Glob` | 原生 Grep/Glob 工具 | `grep` 必填 ripgrep 正则，可选 path 和一个 include glob；`glob` 必填 pattern，可选 path，包含隐藏/忽略文件并按修改时间排序 | DSH 两个都是原生工具，不需要 `rg` 包装。`grep` 只有一个 include 过滤器，不支持否定；`glob` 会包含隐藏/忽略文件；结果有上限，超过时报告完整结果文件。会话没有这两个工具时才用 `bash` + `rg` | `@deepseek-ai/dsh-tool-fs-search/lib/index.js` 的 `glob`/`grep` 注册（约 793-1117 行）；`standard.patch.yml` `tool-fs-search` |

## Subagent 字段

| dsh.md 行 | Cursor 侧 | DSH 判定 | 差异与写法 | 证据 |
| --- | --- | --- | --- | --- |
| `subagent_type: generalPurpose` | 选择通用子代理类型 | 无此字段；`subagent` 都是通用型，角色从 `prompt` 取得 | 省略字段；需要专门角色时把角色说明写进 `prompt`，或读取 `<pstack>/agents/<name>.md` 后粘贴 | `dsh-tool-subagent/lib/index.js` 参数块没有 `subagent_type` |
| `poteto-agent`, `comment-sicko` | Cursor 命名子代理类型 | 无原生等价物；有 `<pstack>/agents/<name>.md` 时读取并作为子代理 `prompt`，否则自己写角色说明 | 不要把名称当 `subagent_type` 传入；DSH schema 会拒绝未知字段 | `dsh-tool-subagent` 参数块；上游 `pstack/agents` 目录 |
| `readonly: true` | 只读子代理 | 无沙箱字段；文件效果由会话权限模式决定（`read-only`/`workspace-write`/`danger-full-access`），子代理不能从内部放宽 | 在 `prompt` 明确写“不要编辑文件”，结束后检查 `git status`；需要强隔离时用只读会话 | `dsh-tool-subagent/lib/index.js` 无 sandbox 参数；`dsh-sandbox-policy`/`dsh-permission-presets` |
| `readonly: false` | 可写子代理 | 省略；默认可写，受会话权限模式约束 | 不需要传字段；不要假设子代理能绕过会话权限 | 同上 |
| `environment: "cloud"` | Cursor 云代理 | DSH 没有云代理；本地等价是独立 worktree。启用 `@deepseek-ai/dsh-experimental-tool-worktree`（或 forge-bundle）后用 `create_worktree` 建分支和 checkout，把路径作为子代理 `cwd` | 没有插件时写跳过行，不假装有云机器；`create_worktree` 不 fetch，未提交文件留在原 checkout | `dsh-experimental-tool-worktree/lib/index.js` 的 `create_worktree` 参数（约 14-45 行）；`dsh-official-bundles` |
| `environment: "local"` | 本地代理 | 省略；子代理默认在本地运行 | 没有字段可传；不需要额外配置 | `dsh-tool-subagent` |
| `cloud_base_branch: <b>` | 云代理的基线分支 | 无此字段；有 `create_worktree` 时把 `<b>` 传给 `from`，否则在 `prompt` 让子代理先 checkout `<b>` | 不要传 `cloud_base_branch`；worktree 的 `from` 是本地 commit/branch/tag，默认 HEAD 且不 fetch | `dsh-experimental-tool-worktree/lib/index.js` |
| `run_in_background: true` | 后台运行子代理 | 省略；`subagent` 总是立即返回 id，运行时完成时通知 | 不要传该字段；用 `send_message` 继续、`interrupt_agent` 中止 | `dsh-tool-subagent` 描述；`dsh-tool-subagent-control` |
| `resume` | 恢复已有子代理 | 向 `agent_id` 发 `send_message`；工作中的子代理下一步收到，空闲子代理开新 turn；永久停止的执行不能续，只能新建 `subagent` 并粘贴先前结果 | 没有 `resume` 字段；`send_message` 返回的是投递确认，不是子代理答案；停止用 `interrupt_agent` | `dsh-tool-subagent-control/lib/index.js` 的 `send_message`/`interrupt_agent` 描述（约 157-213 行） |
| `file_attachments` | 给子代理附加文件 | 无此字段；把路径列在 `prompt` 里，让子代理用 `read` 读取 | 不要传附件数组；路径必须可被子代理访问，工作区外读取会被审计 | `dsh-tool-subagent` 参数块；`dsh-tool-fs` |

## Models

| dsh.md 行 | Cursor 侧 | DSH 判定 | 差异与写法 | 证据 |
| --- | --- | --- | --- | --- |
| `claude-<family>-<version>-<effort>[-fast]` | Cursor 的 Claude slug，可带 `-fast` | 委派路由：`provider` + `model` + `reasoning_effort`；有效 id 来自 `list_subagent_models` | 没有 `-fast` 区分，去掉后缀；`provider` 和 `model` 必须一起提供；能列出的 id 才可用 | `dsh-tool-subagent/lib/index.js` 的 `list_subagent_models` 与 `provider`/`model`/`reasoning_effort` 参数；`modelDiscovery` 配置 |
| `grok-*`, `gpt-*` 等非 Claude slug | Cursor 模型 slug | 路由与 provider 无关；选 `list_subagent_models` 公布的最接近 `provider`/`model`；无匹配时省略两者，回退父路由并说明 | 不要把 Cursor slug 直接当 `model`；没有匹配就承认回退，不要猜测 | 同上 |
| `auto` / `inherit-parent` | 自动或继承父模型 | 省略 `provider` 和 `model`；省略时用子代理默认值并回退兼容父值；路由变化时省略的 `reasoning_effort` 用模型默认值 | `inherit-parent` 不是可传值，省略才是语义；不要伪造 `auto` 路由 | 同上 |
| `pstack-models.mdc`/`~/.cursor/rules/pstack-models.mdc` | Cursor 规则文件 | pstack 角色文件是 `$DSH_HOME/pstack-models.mdc`；base DSH 没有 `.mdc` 和 `rules/`，pstack 适配器在委派时读取该文件。`AGENTS.md` 兼容链只承载会话指令，不能替代角色文件 | 不要创建 `.cursor/rules`；角色行不能写进 `AGENTS.md` 或 `CLAUDE.md`；文件不在上下文时用 `read` | `src/role-manifest.ts` 的 `PSTACK_MODELS_FILENAME`；`src/role-config.ts`；`dsh-home-paths`；`port/dsh.md` |
| 角色值 `<model> <effort>` | Cursor 角色值 | DSH 角色值是 `<provider>/<model> <effort>`；拆成 `provider`/`model`/`reasoning_effort` | effort 是最后一个 token；角色行写在 `$DSH_HOME/pstack-models.mdc` 的注释、`# budget` 行和角色行块中 | `dsh-tool-subagent` 路由参数；`src/role-config.ts`；`setup-pstack` 步骤 |

## 角色文件为什么是特例

| 方案 | 实际行为 | 结论 |
| --- | --- | --- |
| 写入 `$DSH_HOME/AGENTS.md` | `dsh-agent-instructions` 把它作为持久会话指令加载，会进入每次请求并可能被预算截断或去重；需要解析自由文本，角色变更也不会在每次委派时重新读取 | 不采用 |
| 保留 `$DSH_HOME/pstack-models.mdc` | `pstack` 的 `role-config` 在每次委派时读取；文件缺失时角色继承父路由，不可读或坏行显式报错；设置页可以原子编辑该文件 | 采用 |

## Paths

| dsh.md 行 | Cursor 侧 | DSH 判定 | 差异与写法 | 证据 |
| --- | --- | --- | --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | Cursor 项目/用户技能目录 | 项目 `.dsh/skills/` 或 `.agents/skills/`；用户 `$DSH_HOME/skills/` 或 `$DSH_AGENTS_HOME/skills/`（默认 `~/.agents`） | 不是 `.cursor` 目录；项目技能优先放在工作区内的 `.dsh/skills` 或 `.agents/skills`；用户技能放 DSH_HOME/DSH_AGENTS_HOME | `dsh-skill-filesystem` 的 join 声明；`dsh-home-paths` 的 `DSH_HOME`/`DSH_AGENTS_HOME` |
| `~/.cursor/plugins/`, `.cursor-plugin/plugin.json` | Cursor 插件目录和 manifest | profile 为 `$DSH_HOME/profiles/<name>/`，含 `package.json`（有序 bundle 列表）和 `cordis.patch.yml`；插件 manifest 是 `package.json` 的 `dsh` 段 | 没有 `.cursor-plugin/plugin.json`；插件通过 `plugin_manager` 管理；安装包在 profile 的 `node_modules` | `dsh-app-boot` 的 `PROFILES_DIR`/`PROFILE_PATCH_FILENAME`；`dsh-package-manifest`；`dsh-plugin-manager/tools` |
| `.cursor/rules/*.mdc`, always-applied rules | Cursor 规则文件 | 通用规则用 `AGENTS.md` 兼容链；DSH 不读 `.mdc`；项目 `AGENTS.md`/`AGENTS.local.md`，用户全局 `$DSH_HOME/AGENTS.md`。pstack 角色文件 `$DSH_HOME/pstack-models.mdc` 是例外，由 pstack 适配器读取 | 不要写 `.mdc` 作为通用规则；角色行只写 `pstack-models.mdc`，不能写进 `AGENTS.md` 或项目文件 | `dsh-agent-instructions`；`dsh-home-paths`；`src/role-manifest.ts` |
| `https://github.com/cursor/plugins/blob/main/pstack/<path>` | Cursor 仓库链接 | 本地 `<pstack>/<path>`；插件随包带 `skills/`、`docs/guide/`、`README.md` | 读本地副本，不 fetch；给用户链接时用原 URL | `pstack/docs` 目录；生成器复制规则 |
| `~/.cursor/projects/<slug>/agent-transcripts/` | Cursor 会话转录 | `$DSH_HOME/sessions/`，每个会话一个 append-only `.jsonl`，按 workspace 路径分目录 | 搜索需要 `@deepseek-ai/dsh-experimental-session-search`；base 没有模型可见的 `session_search` 工具；用 `read`/`grep` 读当前 workspace 的目录 | `dsh-session-persistence-jsonl` 的 `projectKey`/`encodeSegment`；`dsh-official-bundles` |

## Cursor-only features

| dsh.md 行 | Cursor 侧 | DSH 判定 | 差异与写法 | 证据 |
| --- | --- | --- | --- | --- |
| Cursor Automations: routines, `update_state`, webhooks, routine wakes, `SendToUser` secrets | Cursor 云 routine | 无对应物；写 `Skipped in DSH: <step>. <reason>.` 后继续 | 不要停、不要问、不要重试；后续需要产物的步骤留 placeholder 并写明 | `dsh-official-bundles` 无 Automations 对应项 |
| Bugbot | Cursor 的 PR 审查机器人 | 没有 Bugbot 服务；PR 评论是普通 GitHub review thread，按步骤给的 `gh` 命令处理；可选 forge-bundle 提供 change-request 跟踪 | 没有 Bugbot check/comment 时跳过启动或等待 Bugbot 的步骤；不要伪造 Bugbot 结果 | `dsh-experimental-forge-bundle`（Change requests & worktrees，依赖宿主 `gh`） |
| Cursor cloud agents | Cursor 云代理 | 无云代理；`environment: "cloud"` 映射到本地 worktree | 需要云机器本身的状态或 dashboard 时跳过；需要隔离时用 `create_worktree` 并传 `cwd` | `dsh-experimental-tool-worktree`；`dsh-official-bundles` |
| 内置 PR 工具 | Cursor 的 PR 工具 | 无内置 PR 工具；用 `bash` 执行步骤给的 `gh` 命令，例如 `gh pr create` | 这是替代，不是 skip，不要写 `Skipped in DSH` 行 | 宿主的 `gh`；`dsh-experimental-forge-bundle` 可选 |

## setup-pstack

| dsh.md 断言 | DSH 事实 | 差异与写法 | 证据 |
| --- | --- | --- | --- |
| 没有 rules 目录，不读 `.mdc` 作为会话规则 | 正确；DSH 加载 AGENTS.md 兼容链，pstack 适配器另行读取角色文件 | Cursor 的 `pstack-models.mdc` 内容要迁到 `$DSH_HOME/pstack-models.mdc`，不是 `AGENTS.md`；项目 `AGENTS.md` 不放角色行 | `dsh-agent-instructions`；`src/role-manifest.ts`；`port/dsh.md` |
| 检测模型用 `list_subagent_models` | 正确；无参数列 provider，带 provider 列模型，带 provider+model 列 effort | 只能使用返回的 id；不能把 Cursor slug 当 DSH 路由 | `dsh-tool-subagent/lib/index.js` 的 `list_subagent_models` |
| 写入 `$DSH_HOME/pstack-models.mdc` | 正确；无 frontmatter；保留用户自己的指导；替换旧角色行块 | 不要写 `.cursor/rules`；不要覆盖项目 `AGENTS.md` 或 `CLAUDE.md` | `src/role-config.ts`；`port/dsh.md`；`setup-pstack` 步骤 |

## 补充工具

这些工具没有单独出现在 `dsh.md` 的 Tools 表，但被上面的行或技能步骤直接引用，判定也要可复查。

| 工具 | DSH 判定 | 差异与限制 | 证据 |
| --- | --- | --- | --- |
| `read` / `read_image` | 原生文件读取；工作区默认根，工作区外路径可读但会进入审计 | 没有 Cursor 的附件字段；用路径读取 | `dsh-tool-fs` |
| `write` / `edit` | 原生写/改；`edit` 是字面替换，`write` 是全量替换 | 标准配置 `applyPatch: false`，没有 `apply_patch`；不要依赖 Cursor 的 patch 工具 | `dsh-tool-fs`；`standard.patch.yml` |
| `bash` | 原生 shell；Linux 用 bash，Windows 用 pwsh；工作目录可切换 | 不是 Cursor 的隐式终端；命令和权限受会话沙箱影响 | `dsh-tool-bash`；`standard.patch.yml` |
| `web_search` / `web_fetch` | 原生搜索和抓取；搜索只返回候选，抓取返回页面正文 | 不能用搜索代替抓取；外部内容按不可信数据处理 | `dsh-tool-web`；`standard.patch.yml` |
| `plugin_manager` | 列出、启用、禁用、安装、移除插件和 bundle | 修改 profile；插件 manifest 是 `package.json` 的 `dsh` 段 | `dsh-plugin-manager/tools`；`dsh-package-manifest` |
| `present` | 交付已存在的文件给用户 | 不是文件写入；文件内容不会被复制 | `dsh-tool-present` |
| `working_directory` | 读取或切换当前工作目录 | 子代理的目录变化独立，不自动继承 | `dsh-tool-fs`/`dsh-tool-bash` |
| `exit_plan_mode` | 退出计划模式并提交计划 | 计划模式下不要用 `todo_write` 跟踪计划阶段 | `dsh-plan-mode`；`standard.patch.yml` |
| `create_worktree` | 从本地 commit/branch/tag 建分支和 worktree，并切换当前会话目录 | 可选包；不 fetch；未提交文件留在原 checkout | `dsh-experimental-tool-worktree` |
| `send_message` / `list_agents` / `interrupt_agent` | 子代理续聊、列举、中止 | `send_message` 返回投递确认，不是答案；永久停止不能续 | `dsh-tool-subagent-control` |
| `list_subagent_models` | 查 provider/model/effort 路由 | 仅在 `modelDiscovery` 开启时注册 | `dsh-tool-subagent`；`standard.patch.yml` |
