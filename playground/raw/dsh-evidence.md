# DSH 适配判定依据

本文件保存 `playground/raw/dsh.md` 的判定证据。它不是运行时文件，生成器不读；DSH 升级后复核 `dsh.md` 时直接引用这里的事实。

## 版本

DSH checkout：`0.2.2-rc.1`。上游 pstack：`upstream/cursor-plugins/pstack` 固定 revision。

## 证据

- 委派工具：`dsh-base/cordis.patch.yml` 与 `dsh-web-app/presets/standard.patch.yml` 挂载 `dsh-tool-subagent` 两次（`toolName: subagent`/`subagent_fork`，standard preset 启用 `modelSelection`/`modelDiscovery`）。`dsh-tool-subagent/lib/index.js` 的 schema 给出 `cwd`/`description`/`prompt` 与 `provider`/`model`/`reasoning_effort` 参数、立即返回子代理 id、完成时通知；`list_subagent_models` 仅在 `modelDiscovery` 时注册，逐级列出 provider/model/effort。
- 续聊与中止：`dsh-tool-subagent-control` 注册 `send_message`/`list_agents`/`interrupt_agent`；`resume` 行与 `run_in_background` 行按这些工具描述改写。
- 其余 base 工具：`ask_user_question`（dsh-tool-ask-user）、`todo_write`（dsh-tool-todo，整表替换语义来自参数描述）、`skill`（dsh-tool-skill，"Load the full instructions for a skill"）、`grep`/`glob`（dsh-tool-fs-search）、`read`/`write`/`edit`/`read_image`（dsh-tool-fs，`applyPatch: false` 故无 apply_patch）、`bash`（win32 为 `pwsh`）、`web_search`/`web_fetch`（dsh-tool-web）、`plugin_manager`（dsh-plugin-manager/tools）、`present`、`working_directory`、`exit_plan_mode`（dsh-plan-mode）。
- 技能可见性与用户调用：`dsh-skill` README 的 modelInvocable/userInvocable 四象限与 `dsh-skill-filesystem` 对 frontmatter `disable-model-invocation` 的解析支撑 Tools 表第 4 行；`dsh-tool-skill` 把用户消息里的 `/name` 作为用户显式技能调用手势，把完整 skill 内容注入当前 step，不经过 `skill` 工具，也不依赖 agent preset。
- 模型机制：base 无 `.mdc`、无 `rules/` 目录（`dsh-base`、`dsh-web-app` 清单均无此行）。每会话加载的是 `dsh-agent-instructions` 的 AGENTS.md 兼容链：项目 `AGENTS.md`/`AGENTS.local.md`/`CLAUDE.md`/`CLAUDE.local.md`，用户全局文件为 `$DSH_HOME/AGENTS.md`（`USER_GLOBAL_FILE = "AGENTS.md"`）。setup-pstack 三步骤据此改写。
- 路径约定：`dsh-home-paths` 常量（`DSH_HOME` 默认 `~/.dsh`，`DSH_AGENTS_HOME` 默认 `~/.agents`）；技能根 `.dsh/skills`、`.agents/skills`、`$DSH_HOME/skills`、`$DSH_AGENTS_HOME/skills`（dsh-skill-filesystem 的 join 声明）；profile 为 `$DSH_HOME/profiles/<name>`，含 `package.json`（bundle 清单）与 `cordis.patch.yml`（dsh-app-boot 的 `PROFILES_DIR`/`PROFILE_PATCH_FILENAME` 与模块注释）；插件 manifest 是 `package.json` 的 `dsh` 段（dsh-package-manifest）；会话转录在 `$DSH_HOME/sessions/<workspace-key>/<session>.jsonl`（base 清单 `root: dshHomePath('sessions')`，dsh-session-persistence-jsonl 的 `projectKey`/`encodeSegment`）。
- 官方插件目录：`dsh-official-bundles` 的 `OPTIONAL_BUNDLES`/`ON_DEMAND_BUNDLES`/`OFFICIAL_ON_DEMAND_CATALOG`。`create_worktree` 来自 `@deepseek-ai/dsh-experimental-tool-worktree`（参数 `name`/`from`，切换会话工作目录）；`@deepseek-ai/dsh-experimental-forge-bundle`（"Change requests & worktrees"）含该成员并依赖宿主 `gh` CLI；`@deepseek-ai/dsh-experimental-session-search` 挂载 `dsh-tool-session-query`（`session_search`/`session_trace`/`session_event_*` 五工具），base 只挂 `session-query-sqlite` 服务且 `openAt: never`，无模型可见搜索工具；`@deepseek-ai/dsh-experimental-terminal-bundle` 提供 `terminal_*` 六工具。
- Cursor-only 判定：官方目录中无 Automations、Bugbot、云代理对应物；PR 操作走 base `bash` + 宿主 `gh`，可选 forge-bundle 提供 PR 跟踪（Bugbot 行、built-in PR tool 行据此改写）。
- 沙箱语义：base `dsh-sandbox-policy`/`dsh-permission-presets` 声明 `read-only`/`workspace-write`/`danger-full-access` 会话级权限预设；`subagent` schema 无沙箱参数，故 `readonly` 两行写"无此字段 + 会话权限模式 + prompt 约束 + git status 复查"。
