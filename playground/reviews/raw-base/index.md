# raw/base 证据分析

> 本文件是 raw 分析会话的产物，依据 `reviews/raw-base/` 快照、`playground/raw/dsh.md`、`playground/raw/dsh-evidence.md`、场景文件与本地 raw session 写成。只审查 raw 基准，不读取 `port/dsh.md` 或适配实现。

## 1. 本轮范围

- 模式：基线为 `full` 批次 `raw-base-20261114141336`（50 场景全跑）；随后按本轮裁定对调整过 probe 的 `capability-askquestion`、`capability-stop-subagent` 做了增量重跑（manifest 当前 `lastMode=incremental`、`lastScope=["capability-askquestion"]`），快照 `scenarioIds` 仍为 50，无遗漏。注：`capability-render-video`、`capability-render-svg-chart` 的场景 prompt 已按界面可见要求更新，但其 base 记录仍是旧 prompt 采集，待下一次 base full 重采。
- 环境：`base`（默认环境，不加载额外插件），DSH `0.2.2-rc.1`，上游 revision `ae5650febf4320793844c12c4adaa937f417f8da`，配置 hash `3aa7db10df9015190040d91bf76064369bc294f09f37408e26a33a7804a5fbcb`。
- 实际模型路由（全部记录一致）：`magpie / workbuddy/minimax-m3.1-flash / low`；会话 preset 均为 `standard`。
- 全部记录 `verdict=unobserved`、`semanticReview=pending`，这是 `run-case` 的既定行为：语义判定留给本分析。下表的“结论”是本分析会话按 rubric 与截图/会话事实给出的语义判定。
- render 对照环境（`@changfenhuang/dsh-genui`）单独出报告，见 `reviews/raw-render/index.md`；本节只在音频/视频等需要对照的条目引用它。

## 2. 按能力类别汇总

### tool（7）

| 场景 | 结论 | 关键观察 |
| --- | --- | --- |
| askquestion | 通过 | 会话内出现真实选择卡片（截图可见）；probe 调整后 `autoAnswers` 记录到选择「只做功能」并据此继续。模型仍只给了单个选项，“二选一”未达成属模型表现，不判能力缺口。 |
| file-read-write | 通过 | 读 `docs/notes.md` 后写入 `outputs/summary.md`，内容覆盖三条要点。 |
| grep-glob | 通过 | 直接调用原生 `grep`，命中 `docs/deploy.md:3`，并说明 `docs/other.md` 非部署命令。 |
| open-a-todolist | 通过 | 多次 `todo_write` 整表更新，三步完成后任务面板显示 5 项完成。 |
| skill-loading | 通过（机械断言误报，见 Q2） | `skill` 工具只加载了 `setup-pstack`；`poteto-help` 带 `disable-model-invocation: true`，模型按 `dsh.md` 第 14 行改用 `read` 打开其 SKILL.md 并据其作答。机械断言 `poteto-help was not loaded` 与隐藏技能规则冲突。 |
| task | 通过 | 主会话先声明已交给独立下属，随后带回下属完成的 README 摘要。 |
| tool-absent-fallback | 通过 | 说明拿不到未保存的聊天记录并给出替代，未假造内容。 |

### delegation（14）

| 场景 | 结论 | 关键观察 |
| --- | --- | --- |
| cloud-base-branch | 通过 | 空仓库无 `feature-base` 分支，模型说明 `git worktree add <path> <branch>` 可用并给出可复现替代做法。 |
| comment-sicko | 通过 | `subagent` 只读审查，输出删注释报告，未修改代码。 |
| environment-cloud | 通过 | 在临时目录建立独立检出并完成改动，说明隔离位置与提交。 |
| environment-local | 通过 | 直接在当前工作区 `read` README，报出标题「本地执行探测」。 |
| file-attachments | 通过 | 执行者读取 `docs/spec.md` 与 `docs/api.md`，产出两文件一致性结论。 |
| multi-phase-collaboration | 通过 | 两个执行者分两阶段，阶段二以阶段一 TODO 清单为输入，串行交接。 |
| parallel-delegation | 通过 | 三个独立执行者并行读 `src/a.ts`、`b.ts`、`c.ts`，主会话汇总成表。 |
| poteto-agent | 通过（越界读取，见 Q4） | 读了 poteto 风格材料，按“最小改动 + 委派 + 回读验证”产出 `probe.py`/`test_probe.py` 并自跑测试。 |
| readonly-false | 通过 | 执行者把 `src/a.ts` 常量由 1 改为 2，回读确认 `export const a = 2;`。 |
| readonly-true | 通过 | 只读探查 `src`，逐文件说明职责，未修改任何文件。 |
| resume | 通过 | 第一步派执行者统计文件数，随后用 `send_message` 让同一 `agent_id` 继续加注释行数。 |
| run-in-background | 通过 | 同时启动两个后台子代理，先回报“已接手”，子代理完成后汇总两份结果。 |
| stop-subagent | 通过 | probe 调整（80 个占位文件 + 第二轮明确要求叫停）后，模型调用 `interrupt_agent` 叫停执行者，并给出停点说明与后续计划。 |
| subagent-general | 通过 | 通用子代理统计出 3 个 Markdown 文件，主会话转述结果。 |

### routing（7）

| 场景 | 结论 | 关键观察 |
| --- | --- | --- |
| inherit-parent | 通过 | 用 `subagent_fork` 派生，不指定模型，子代理随后回报实际路由 `magpie/workbuddy/minimax-m3.1-flash`。 |
| model-discovery | 通过 | `list_subagent_models` 实际探测：唯一可用 `magpie/workbuddy/minimax-m3.1-flash`，档位 `off/low/high/max`；`deepseek-v4.1-flash` 被拒。 |
| model-route | 通过 | 明确给出路由 `magpie/workbuddy/minimax-m3.1-flash + high` 并实际派发；说明会话内无更强可用路由。 |
| model-unavailable-fallback | 通过 | 指定 `deepseek-v4.1-flash [low]` 被 `not allowed for this Session` 拒绝，回退到唯一同族路由 `minimax-m3.1-flash [max]` 并说明。 |
| non-claude-route | 通过 | 选 `magpie/workbuddy/minimax-m3.1-flash`，明确说明当前无 Claude 路由、未发生静默退回。 |
| role-file | 通过 | 读到 `$DSH_HOME/pstack-models.json`（17 角色 / 22 路由），说明其中 deepseek 11 条在本会话不可用、回退父路由；给出 GUI 授权清单的修复步骤。 |
| role-value | 通过 | 把 `magpie/workbuddy/minimax-m3.1-flash [high]` 拆成 provider/model/reasoning_effort 并两次真实委派，子会话头为 high、父会话 low，拆分生效。 |

> routing 的共性事实：本会话只服务父路由一条，角色文件里的 `deepseek-v4.1-flash` 条目全部因会话策略被拒。这直接支撑 Q1（`dsh.md` 未写“模型选择受会话策略门控”）。

### environment（6）

| 场景 | 结论 | 关键观察 |
| --- | --- | --- |
| environment-browser-screenshot | 通过 | 用 Playwright + headless Chromium 打开自身 Web GUI 并抓整页图，答复内联出真实截图。 |
| environment-desktop | 通过（替代路径） | 说明无 `DISPLAY`、无 Xorg/adb/xdotool，无真实桌面；改用本机 Web 应用（端口 43127）在浏览器读取 `localStorage['feedtime.theme']` 作为替代观察。 |
| environment-forge-pr | 通过 | 说明仓库无 remote、环境禁止 gh/凭据，无法开 PR 并给出替代命令。 |
| environment-session-search | 通过 | 翻查后确认工作区无上次半途会话痕迹，说明拿不到历史并请用户补充。 |
| environment-terminal | 通过（绕行，见 Q4） | 原生 `bash` 为一次性、`/dev/pts` 只读、PTY 分配失败；模型经运行中 DSH Host 的终端控制器 API 驱动了真实交互式 bash（`help`→`exit`，exit 0）。 |
| environment-worktree | 通过 | 验证 `git worktree add` 可用并给出工作树路径；因缺少“这处改动”上下文先向用户确认内容。 |

### output-render（7）

| 场景 | 结论 | 关键观察 |
| --- | --- | --- |
| render-audio | 环境限制（预期降级，不处理） | 产出真实 MP3（219 KB，MPEG 头 `fff3`），base 只给文件卡片与下载链接；render 对照里 genui 播放器实测可播，故 base 属预期降级。 |
| render-generated-image | 通过 | 生成真实 PNG（白板手绘风），答复内联显示。 |
| render-mermaid-diagram | 通过 | 用 mermaid-cli + headless Chrome 渲染成 PNG，答复内联显示真实流程图。 |
| render-screenshot | 通过 | 用 Playwright/Chromium 真实渲染组件并抓整页截图，答复内联显示。 |
| render-svg-chart | 通过 | 生成可直接打开的 `state.svg`，答复内联显示渲染结果（Idle→Running）。 |
| render-ui | 通过 | 构建真实可交互 `index.html`，在 Chrome 与 DSH Document Preview（`sandbox="allow-scripts"` 的 Blob iframe）内经 CDP 点击验证交互生效；render 对照环境用 genui 组件在答复体内直接渲染出可交互输入框与按钮（截图可见），交互能力确认。 |
| render-video | 环境限制（预期降级，不处理） | 产出真实 H.264/AAC MP4（3.1 MB，烧录字幕，ffmpeg 解码无错），base 只给文件卡片；render 重跑后确认 genui 内联播放器可播，故 base 属预期降级。 |

### skill-dependency（9）

| 场景 | 结论 | 关键观察 |
| --- | --- | --- |
| skill-dependency.control-cli | 通过（替代路径） | 安装 `control-cli` skill 并按其 Harness Loop 验证；PTY 不可用时改用仓库原生 e2e（exit 0）、管道 harness、`python3 -i` 真实交互 CLI 三条替代，均 exit 0。 |
| skill-dependency.control-ui | 通过 | 用 agent-browser 真实驱动自身 Web GUI：切插件页、点开关、选工作区、发消息（消息上屏并触发模型工具调用）后停止，`console`/`errors` 为空。 |
| skill-dependency.create-skill | 通过 | 在 `.agents/skills/pre-commit-check/SKILL.md` 创建项目技能，运行时发现并加载。 |
| skill-dependency.deslop | inconclusive（见 Q4） | 环境无 `cursor-team-kit` 的 deslop；模型转向读取真实 dsh-pstack 仓库未提交 diff 并生成补丁，目标偏离本场景 workspace，未给出针对本场景的干净清理结论。 |
| skill-dependency.loop | 通过 | 用 `schedule_create` / `schedule_edit` 建立定时巡检，连续 4 轮结论一致（满足 ≥3）后删除定时任务。 |
| skill-dependency.no-comments | 通过 | 独立子代理只报告不改码；说明环境无专项审查技能，但完成独立审查。 |
| skill-dependency.technical-writing | 通过 | 写出含快速开始步骤的 README 小节。 |
| skill-dependency.unslop | 通过 | 把 AI 腔句子改成直白短句，未原样返回。 |
| skill-dependency.visualize | 通过 | 生成柱状图 PNG（12/9/15 秒）并内联显示。 |

## 3. 问题问答

### Q1 完整模型发现由适配插件提供工具补齐

- 类型：plugin
- 能力类别：routing
- 影响场景：`capability-model-route`、`capability-model-unavailable-fallback`、`capability-non-claude-route`、`capability-role-file`、`capability-role-value`、`capability-model-discovery`
- 证据：
  - [model-route](scenarios/capability-model-route/raw-base/record.json) / [截图](scenarios/capability-model-route/raw-base/screenshot.png)
  - [model-unavailable-fallback](scenarios/capability-model-unavailable-fallback/raw-base/record.json) / [截图](scenarios/capability-model-unavailable-fallback/raw-base/screenshot.png)
  - [role-file](scenarios/capability-role-file/raw-base/record.json) / [截图](scenarios/capability-role-file/raw-base/screenshot.png)
  - session 只在本地 worker，按 `record.session.sessionId` 读取，不在快照中链接
- 现象：`list_subagent_models` 实际可用，但只返回父路由 `magpie/workbuddy/minimax-m3.1-flash`；显式指定 `magpie/workbuddy/deepseek-v4.1-flash` 报 `child LLM route "..." is not allowed for this Session`；`$DSH_HOME/pstack-models.json` 里 11 条 deepseek 路由在本会话全部不可用，只能省略并继承父路由。
- 根因：`@deepseek-ai/dsh-tool-subagent` 的 `assertAllowedModelSelection` 只在会话登记了 `subagent/model-selection-policy` 时放行非父路由；基座会话默认只允许父路由。
- 与当前阶段 dsh.md 的关系：`playground/raw/dsh.md` 继续只描述原生行为即可，原生 `list_subagent_models` 受会话策略限制、只放行父路由是事实；完整模型清单的发现改由适配插件内新增工具提供，不在 raw dsh.md 里承诺。
- 建议动作：在适配插件（port 阶段）提供一个“完整模型发现”工具，返回该部署实际服务的全部 provider/model/effort 路由，不受父会话路由限制；委派时据此选择，若会话策略仍不允许则回退父路由并说明。
- 你的决定：已定。由插件内提供工具，用于发现完整模型列表，而不是只有当前父会话模型。

### Q2 隐藏技能应由适配插件提供工具按名加载

- 类型：plugin
- 能力类别：tool（skill-loading）
- 影响场景：`capability-skill-loading`
- 证据：
  - [record](scenarios/capability-skill-loading/raw-base/record.json) / [截图](scenarios/capability-skill-loading/raw-base/screenshot.png)
- 现象：`mechanicalFailures=["process evidence: poteto-help was not loaded"]`，但 `poteto-help/SKILL.md` 带 `disable-model-invocation: true`，`skill` 工具本就不能按名加载；模型按 `dsh.md` 第 14 行改用 `read` 打开并据其作答，答复质量完整。
- 根因：场景的 `skill-loaded: poteto-help` 断言未考虑 `disable-model-invocation`，把一个合法加载路径判成缺口。
- 与当前阶段 dsh.md 的关系：`dsh.md` Tools 行已正确描述“隐藏技能用 read”这一原生回退，保留即可；要让隐藏技能也能按名加载，需要适配插件提供对应工具。
- 建议动作：在适配插件内提供一个技能加载工具，能加载随包内被 `skill` 工具按 `disable-model-invocation` 视为隐藏的技能；原生 `read` 路径继续作为无插件时的回退。
- 你的决定：已定。由插件内提供工具，用于加载随包内被 skills 工具视为隐藏的技能。

### Q3 base 无内联音频/视频播放器，产出真实媒体但只呈现文件卡片

- 类型：ignore-environment
- 能力类别：output-render
- 影响场景：`capability-render-audio`、`capability-render-video`
- 证据：
  - [render-audio](scenarios/capability-render-audio/raw-base/record.json) / [截图](scenarios/capability-render-audio/raw-base/screenshot.png)
  - [render-video](scenarios/capability-render-video/raw-base/record.json) / [截图](scenarios/capability-render-video/raw-base/screenshot.png)
- 现象：两者都产出了真实可解码媒体（MP3 219 KB；MP4 3.1 MB，ffmpeg 全解码无错），但 base 答复里只有文件卡片/下载链接，没有内联 `<audio>`/`<video>` 播放器；render 对照环境里 genui 提供内联音频播放器与内联视频播放器，重跑后均实测可播放（见 `reviews/raw-render/index.md`）。
- 根因：base 没有媒体渲染插件，内联播放属于可选能力，不是原生 DSH 文本/图像渲染的一部分。
- 与当前阶段 dsh.md 的关系：`dsh.md` 的 Cursor-only / 可选能力行没有声称 base 能内联播放媒体，属于“可选能力用能力类别说明”的预期边界，不算 dsh.md 缺陷。
- 建议动作：音频与视频都已用 render 对照确认，genui 分别提供真实可播的内联音频、视频播放器；base 只给文件卡片/下载属预期降级，不处理。
- 你的决定：音频与视频均按预期降级，不处理。

### Q4 worker 读边界过宽，多个场景读到仓库根、`$DSH_HOME` 会话缓存与运行日志

- 类型：ignore-environment（worker 环境问题，保留）
- 能力类别：environment / delegation
- 影响场景：`capability-skill-dependency-deslop`、`capability-environment-terminal`、`capability-skill-dependency-control-ui`、`capability-poteto-agent`
- 证据：
  - [deslop](scenarios/capability-skill-dependency-deslop/raw-base/record.json)
  - [environment-terminal](scenarios/capability-environment-terminal/raw-base/record.json)
  - [skill-dependency-control-ui](scenarios/capability-skill-dependency-control-ui/raw-base/record.json)
- 现象：deslop 场景读到真实 dsh-pstack 仓库的未提交 diff 并尝试改仓库（被沙箱拒写）；terminal/control-ui 场景从 `playground/.tmp/raw-base-run.log` 取到 worker web token；poteto-agent 读取了 `$DSH_HOME` 下的会话缓存。deslop 因此偏离本场景 workspace，判 inconclusive。
- 根因：`worker.md` 明说“沙箱只限制写、不限制读”，worker 能沿绝对路径读到仓库根与 `$DSH_HOME`；运行日志与 `web-url.txt` 含 token，进一步扩大了可达面。
- 与当前阶段 dsh.md 的关系：这是 playground worker 隔离与 DSH 能力无关，不改 dsh.md。
- 建议动作：属 worker 隔离问题，暂时保留记录、不加急处理；后续加固读边界（仓库根与 `$DSH_HOME` 会话缓存移出可读范围，运行日志不放 token）并重跑受污染场景（至少 deslop）。
- 你的决定：属于 worker 问题，暂时先保留该问题不解决。

### Q5 `askquestion` probe 已调整，卡片与选择已可观测

- 类型：probe（已调整）
- 能力类别：tool（askquestion）
- 影响场景：`capability-askquestion`
- 证据：
  - [record](scenarios/capability-askquestion/raw-base/record.json) / [截图](scenarios/capability-askquestion/raw-base/screenshot.png)
- 现象：原 run 的卡片只给「只做功能（推荐）」一项，且 `autoAnswers` 为空。调整为提示明确要求列出两个选项、并把自动应答 `match` 改为空串让单问题稳定回填后重跑：卡片仍真实渲染，`autoAnswers` 记录为「只做功能」并据此继续。模型仍只给了一个选项，二选一未达成属模型表现，不判能力缺口。
- 根因：原 `match:"测试"` 只匹配问题首行文本，模型把标题改成「范围」后匹配不到，回填缺失；调整后回填稳定。模型倾向只给推荐项。
- 与当前阶段 dsh.md 的关系：`dsh.md` AskQuestion 行描述 `questions` 数组、options 与空选/超时语义准确，能力可用；不改 dsh.md。
- 建议动作：保留已做的 probe 调整；若要强制二选一，可在 fixture 层给固定问题卡，或把断言缩到“选择被采纳”。
- 你的决定：已定，调整 probe（已完成并重跑）。

### Q6 `stop-subagent` probe 已调整，叫停行为可观测

- 类型：probe（已调整）
- 能力类别：delegation
- 影响场景：`capability-stop-subagent`
- 证据：
  - [record](scenarios/capability-stop-subagent/raw-base/record.json) / [截图](scenarios/capability-stop-subagent/raw-base/screenshot.png)
- 现象：原 run 执行者自行跑完、未触发叫停。调整 fixture 为 80 个占位文件、并把提示拆成两轮（第二轮明确要求立刻叫停）后重跑：模型调用 `interrupt_agent` 中断执行者，并给出停点说明与后续计划。
- 根因：原任务量太小，执行者在“发现跑偏”之前就已完成，属触发条件不足；调整后能稳定观测叫停。
- 与当前阶段 dsh.md 的关系：`dsh.md` Subagent 行已说明 `send_message`/`interrupt_agent`，能力可用；不改 dsh.md。
- 建议动作：保留已做的 probe 调整。
- 你的决定：已定，调整 probe（已完成并重跑）。

## 4. `dsh.md` 适配说明审查（仅 `playground/raw/dsh.md`）

| 章节/行 | 当前说明 | 相关证据 | 结论 | 建议 |
| --- | --- | --- | --- | --- |
| Tools · `Task` | `subagent` 立即返回 id，`subagent_fork` 继承上下文 | task、subagent-general、inherit-parent、run-in-background、resume | 够用 | 保持 |
| Tools · `AskQuestion` | `questions` 数组 + options + 空选/超时语义 | askquestion | 够用 | 保持（Q5 是模型/probe 问题） |
| Tools · Open a todolist | `todo_write` 整表替换，无 skipped | open-a-todolist | 够用 | 保持 |
| Tools · Run another pstack skill | 隐藏技能用 `read`，`/name` 直接注入 | skill-loading | 够用 | 保持（Q2 是断言问题） |
| Tools · `Grep`,`Glob` | 原生工具，grep 用 ripgrep | grep-glob | 够用 | 保持 |
| Subagent fields · generalPurpose / poteto-agent / readonly / cloud / local / base-branch / background / resume / attachments | 各字段映射 | cloud-base-branch、readonly-true/false、environment-cloud/local、file-attachments、run-in-background、resume、poteto-agent | 够用 | 保持 |
| Models · `claude-...` 与 `list_subagent_models` | 发现 id 后拆分 provider/model/effort 选择 | model-discovery、model-route、model-unavailable-fallback、non-claude-route、role-file、role-value | 够用 | 原生只放行父路由是事实；完整模型发现由适配插件工具补齐（Q1） |
| Models · 非 Claude slug / auto / inherit-parent | 选最近路由，否则省略继承 | non-claude-route、inherit-parent | 够用 | 保持 |
| Models · `pstack-models.json` | base 不读，adapter 每次委派读 | role-file、role-value | 够用 | 保持（文件写入受沙箱限制属环境） |
| setup-pstack · Detect | 用 `list_subagent_models` 发现路由 | model-discovery、role-file | 够用 | 原生 Detect 只列已放行路由；完整清单由插件工具补齐（Q1） |
| Paths · skills/plugins/rules/transcripts | `$DSH_HOME`、AGENTS 链、session 路径 | create-skill、environment-session-search | 够用 | 保持 |
| Cursor-only features | Automations/Bugbot/cloud agents/内置 PR 工具的跳过与替代 | environment-forge-pr、environment-desktop、environment-cloud | 够用 | 保持 |

## 5. 待用户判断的问题

- 已裁定：Q1、Q2 由适配插件提供工具处理；Q4 属 worker 问题暂时保留；Q5、Q6 调整 probe 并已增量重跑。
- 已答复：Q3 音频/视频在 base 属预期降级、在具备对应能力（render）时属功能正常，均结案；render-ui 以 render 环境真实内联可交互界面（截图）为准，接受该证据。当前无待判项。

## 6. 后续动作

- `plugin`：Q1（适配插件提供“完整模型发现”工具）、Q2（适配插件提供“隐藏技能加载”工具），在 port/适配阶段实现。
- `dsh-md`：无。raw `dsh.md` 继续只描述原生行为，Q1/Q2 由插件补齐，不在 raw 说明里承诺。
- `ignore-environment`：Q3 音频（预期降级，不处理）、Q4（worker 读边界，暂时保留）。
- `probe`：Q5、Q6 已调整并增量重跑通过（askquestion 记录选择；stop-subagent 观测到 `interrupt_agent` 叫停）。
- `upstream`：无。
- 后续：`capability-render-video`、`capability-render-svg-chart` 的 base 记录待下一次 full 重采对齐新 prompt。
