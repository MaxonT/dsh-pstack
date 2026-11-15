# adapted/base 证据分析

> 本文件由 adapted 分析会话依据 `reviews/adapted-base/` 快照、`port/dsh.md`、`src/**` 适配实现与本地 adapted worker session 写成。只审查适配实现，不读取 raw 证据结论。

## 1. 本轮范围

- 基线：`full` 批次 `adapted-base-20261114221850`，43 个场景，DSH `0.2.2-rc.1`，adapted `0.3.1`，上游 revision `ae5650febf4320793844c12c4adaa937f417f8da`，config hash `3aa7db10df9015190040d91bf76064369bc294f09f374408e26a33a7804a5fbcb`。
- 决策后增量：用户确认结论后，`incremental` 批次 `adapted-base-20261114231347` 重跑 4 个改过的场景（`skill-dependency-loop`、`stop-subagent`、`environment-browser-screenshot`、`skill-dependency-control-ui`），随后 `adapted-base-20261114232733` 再修 `skill-dependency-loop` 与 `skill-dependency-control-ui`。这三批的 43 个场景合并成当前快照。
- 环境：`adapted` / `base`，加载 `dsh-pstack`（本地 link 构建），agent preset 全部为 `poteto-mode`。
- 覆盖：43 个 `record.json` + 43 张 `screenshot.png` 齐全，43 条均有可用会话。
- 记录 verdict 全为 `inconclusive`（语义判定由本文件给出）。
- 运行例外：`collect` 首次失败于 blocked 记录的 source 文件名时间戳不一致，已修复 `playground/scripts/run-case.ts`（Q9）后重跑成功。
- 覆盖缺口：`output-render` 的 7 个 `render-*` 探针只有 `phases: ["raw"]`，adapted/base 没有直接渲染探针；`skill-dependency-visualize` 与 `skill-dependency-control-ui` 的内联渲染可作旁证。

能力类别分布（按 `capability-inventory.json`）：tool 7、delegation 14、routing 7、environment 6、output-render 0、skill-dependency 9。

## 2. 按能力类别汇总

### tool（7/7 通过）

`askquestion`、`file-read-write`、`grep-glob`、`open-a-todolist`、`skill-loading`、`task`、`tool-absent-fallback` 全部验证。`ask_user_question` 以选择卡片提问并采纳「只做功能」；`todo_write` 三步清单贯穿；`pstack_skill` 可用但需精确名（Q3）。

### delegation（14/14 通过）

`cloud-base-branch`、`comment-sicko`、`environment-cloud`、`environment-local`、`file-attachments`、`multi-phase-collaboration`、`parallel-delegation`、`poteto-agent`、`readonly-false`、`readonly-true`、`resume`、`run-in-background`、`stop-subagent`、`subagent-general` 全部通过。`stop-subagent` 改场景后复跑，第二轮 `interrupt_agent` 成功中断长跑子代理并给出停点说明。`multi-phase-collaboration` 仍有 1 次 `job_output` 误用（Q2）。

### routing（6 验证 + 1 观察）

`inherit-parent`、`model-route`、`model-unavailable-fallback`、`non-claude-route`、`role-file`、`role-value` 通过。`model-discovery` 观察：清单如实列出 advertised 路由，但含两个实际不可用的 `deepseek-account` 路由（Q5，按环境忽略）。

### environment（6 通过，其中 1 个按环境忽略）

`environment-desktop`（无桌面，改用 CDP 操作同源 Web 应用并改主题）、`environment-forge-pr`（无 remote/gh 凭据，给替代）、`environment-session-search`（说明拿不到历史并请用户补充）、`environment-terminal`（bash 非 tty，经宿主 terminal API 起真实 PTY）、`environment-worktree`（建独立 worktree 并给路径）通过。`environment-browser-screenshot` 按环境问题忽略：模型此前只给文件卡片并声称「就在上面那张图里」，提示词已改为要求用 Markdown 图片语法把截图直接嵌进回复正文（Q8）。

### output-render（0 覆盖）

本轮无 adapted 渲染探针；`render-audio`、`render-generated-image`、`render-mermaid-diagram`、`render-screenshot`、`render-svg-chart`、`render-ui`、`render-video` 只在 raw 阶段跑。这是相位覆盖缺口，不判为能力缺失，交用户判断是否补 adapted 渲染探针。

### skill-dependency（9/9 通过）

`control-cli`（PTY 不可用，改用 headless/acp 退出 0）、`control-ui`（8 张交互截图内联渲染，DOM 状态变化可核对）、`create-skill`、`deslop`、`loop`（同轮三次巡检，`counter.txt` 最终为 3）、`no-comments`、`technical-writing`、`unslop`、`visualize`（柱状图内联渲染）全部通过。

### 逐场景结论

| 场景 | 类别 | 结论 | 关键观察 |
| --- | --- | --- | --- |
| askquestion | tool | 验证 | 选择卡片两选项，采纳「只做功能」后继续 |
| file-read-write | tool | 验证 | 读 `docs/notes.md` 写 `outputs/summary.md` |
| grep-glob | tool | 验证 | `grep` 命中 `docs/deploy.md:3` |
| open-a-todolist | tool | 验证 | `todo_write` 三步清单并更新 |
| skill-loading | tool | 验证 | 加载 `poteto-help`/`how`；先试 `help` 失败后改正 |
| task | tool | 验证 | 派子代理并转述；无目录说明时如实说明 |
| tool-absent-fallback | tool | 验证 | 说明拿不到聊天记录并给替代，未编造 |
| cloud-base-branch | delegation | 验证 | 说明支持 `feature-base` 起点并给 worktree/clone |
| comment-sicko | delegation | 验证 | comment-sicko 只报告不改代码 |
| environment-cloud | delegation | 验证 | 嵌套 clone 隔离检出完成小改动 |
| environment-local | delegation | 验证 | 读 `README.md` 报标题 |
| file-attachments | delegation | 验证 | 子代理读两文件写一致性结论 |
| multi-phase-collaboration | delegation | 验证 | 两阶段两交接；一次 `job_output` 误用 |
| parallel-delegation | delegation | 验证 | 3 个 `pstack_subagent` 并行后汇表 |
| poteto-agent | delegation | 验证 | 加载 poteto-mode + principle；playbook 走 `resource` |
| readonly-false | delegation | 验证 | 子代理写 `a = 2` |
| readonly-true | delegation | 验证 | 只读子代理读目录，未改文件 |
| resume | delegation | 验证 | `send_message` 续同一子代理 |
| run-in-background | delegation | 验证 | 两个后台 bash job 并行，汇总结果 |
| stop-subagent | delegation | 验证 | 长跑子代理被 `interrupt_agent` 中断，给出停点与后续 |
| subagent-general | delegation | 验证 | 子代理数出 3 个 Markdown 文件 |
| inherit-parent | routing | 验证 | 不传路由，继承父 `magpie/workbuddy/minimax-m3.1-flash` |
| model-discovery | routing | 观察 | 清单含 `deepseek-account` 两个不可用路由（Q5） |
| model-route | routing | 验证 | 探测四路由，选 minimax `[max]`；一次 `job_output` 误用 |
| model-unavailable-fallback | routing | 验证 | `anthropic/*` 无适配器→回落 minimax `[high]` |
| non-claude-route | routing | 验证 | 用 `magpie/workbuddy/deepseek-v4.1-flash [low]` |
| role-file | routing | 验证 | 读 `pstack-models.json`；model 前缀错两次后成功（Q1） |
| role-value | routing | 验证（局部） | 角色值拆 provider/model/effort 并实际使用；写角色文件被沙箱拒（Q4，按环境忽略） |
| environment-browser-screenshot | environment | 观察（环境，忽略） | 提示词已明确要求 Markdown 内联图片；按环境问题忽略（Q8） |
| environment-desktop | environment | 验证 | 无桌面；用 CDP 操作同源 Web 应用，改主题并核对 |
| environment-forge-pr | environment | 验证 | 无 remote/gh 凭据，说明并给替代 |
| environment-session-search | environment | 验证 | 说明拿不到历史会话并请用户补充 |
| environment-terminal | environment | 验证 | bash 非 tty；经宿主 terminal API 起真实 PTY |
| environment-worktree | environment | 验证 | 独立 worktree 建好并给路径 |
| skill-dependency-control-cli | skill-dependency | 验证 | PTY 不可用；headless/acp 替代退出 0 |
| skill-dependency-control-ui | skill-dependency | 验证 | 8 张交互截图内联显示，DOM 状态变化可核对 |
| skill-dependency-create-skill | skill-dependency | 验证 | 产出 `.agents/skills/pre-commit-check/SKILL.md` |
| skill-dependency-deslop | skill-dependency | 验证 | `deslop` 技能清理 |
| skill-dependency-loop | skill-dependency | 验证 | 同轮三次巡检，`counter.txt` 最终为 3，到 3 停止 |
| skill-dependency-no-comments | skill-dependency | 验证 | comment-sicko 独立审查只报告 |
| skill-dependency-technical-writing | skill-dependency | 验证 | 写快速开始小节 |
| skill-dependency-unslop | skill-dependency | 验证 | 去 AI 腔改写 |
| skill-dependency-visualize | skill-dependency | 验证 | 柱状图内联真实渲染 |

## 3. 问题问答

### Q1 `pstack_subagent` 的 `model` 要带 provider 内完整模型段，`port/dsh.md` 没写拆分规则

- 类型：dsh-md
- 能力类别：routing
- 影响场景：`capability-role-file`、`capability-role-value`、`capability-skill-dependency-loop`
- 证据：
  - [role-file record](scenarios/capability-role-file/adapted-base/record.json)
  - [role-value record](scenarios/capability-role-value/adapted-base/record.json)
- 现象：`pstack_subagent` 报 `route magpie/deepseek-v4.1-flash [low] failed route preflight: pi-ai provider "magpie" has no configured model "deepseek-v4.1-flash"`，模型补上 `workbuddy/` 前缀后成功。
- 根因：角色值形如 `magpie/workbuddy/minimax-m3.1-flash [high]`，必须按第一个 `/` 拆成 `provider=magpie`、`model=workbuddy/minimax-m3.1-flash`。`port/dsh.md` 的 Models 行只写 `provider/model [effort]`，未说明 `model` 段自身可含 `/`。
- 与当前阶段 dsh.md 的关系：`port/dsh.md` 的 Tools / Plugin tools / Models 三处缺这条拆分规则，属`缺失`。
- 建议动作：在 Models 行与 `pstack_subagent` 行补「provider 取路由第一段，其余全部是 model（可能含 `/`），按 `pstack_models` 输出原样传」。
- 你的决定：接受。已改 `port/dsh.md` 与 `port/dsh.zh.md`，并重新生成 `pstack/` 树。

### Q2 子代理完成通知被当成后台 job 轮询

- 类型：dsh-md
- 能力类别：delegation
- 影响场景：`capability-model-route`、`capability-multi-phase-collaboration`、`capability-non-claude-route`
- 证据：
  - [model-route record](scenarios/capability-model-route/adapted-base/record.json)
  - [multi-phase-collaboration record](scenarios/capability-multi-phase-collaboration/adapted-base/record.json)
  - [non-claude-route record](scenarios/capability-non-claude-route/adapted-base/record.json)
- 现象：`job_output -> Error: unknown job <子代理 id>`，共 3 个场景。
- 根因：`port/dsh.md` 的 Plugin tools `pstack_subagent` 行只说「completion arrives as a notice」，没有明确禁止把子代理 id 传给 `job_output`。
- 与当前阶段 dsh.md 的关系：属`缺失`（缺硬规则）。
- 建议动作：补一句「子代理不是后台 job；不要用 `job_output` 轮询子代理 id，改用 `list_agents`/`send_message`」。
- 你的决定：接受。已改 `port/dsh.md` 与 `port/dsh.zh.md`。

### Q3 `pstack_skill` 名称必须精确，模型会先试短名

- 类型：dsh-md
- 能力类别：tool
- 影响场景：`capability-poteto-agent`、`capability-skill-loading`
- 证据：
  - [poteto-agent record](scenarios/capability-poteto-agent/adapted-base/record.json)
  - [skill-loading record](scenarios/capability-skill-loading/adapted-base/record.json)
- 现象：`skill "feature" is unknown or no longer available`、`skill "help" is unknown or no longer available`；改正为 `poteto-mode#playbooks/feature.md`、`poteto-help` 后成功。
- 根因：帮助技能名是 `poteto-help`；读 playbook 要用 `pstack_skill{name:"poteto-mode", resource:"playbooks/x.md"}`。`port/dsh.md` 只写「exact kebab-case `name`」。
- 与当前阶段 dsh.md 的关系：属`缺失`（缺具体示例）。
- 建议动作：Tools 行补示例「帮助用 `poteto-help`；读 playbook 用 `pstack_skill` 的 `name`+`resource`」。
- 你的决定：接受。已改 `port/dsh.md` 与 `port/dsh.zh.md`。

### Q4 `setup-pstack` 在会话内无法写 `$DSH_HOME/pstack-models.json`

- 类型：ignore-environment
- 能力类别：routing
- 影响场景：`capability-role-value`
- 证据：[role-value record](scenarios/capability-role-value/adapted-base/record.json)
- 现象：写角色文件报 `[sandbox: file access denied under workspace-write mode]`，模型改为说明文件在可写沙箱之外。
- 根因：角色文件在会话工作区外，`workspace-write` 沙箱禁止写。
- 与当前阶段 dsh.md 的关系：`port/dsh.md` 的 setup-pstack `Write` 行未写沙箱限制与替代路径。
- 建议动作：按用户决定记为环境限制，不改文档。
- 你的决定：环境问题，忽略。

### Q5 `pstack_models` 会列出注册但实际不可用的 provider

- 类型：ignore-environment
- 能力类别：routing
- 影响场景：`capability-model-discovery`、`capability-model-route`、`capability-skill-dependency-loop`
- 证据：
  - [model-discovery record](scenarios/capability-model-discovery/adapted-base/record.json)
  - [model-route record](scenarios/capability-model-route/adapted-base/record.json)
- 现象：`pstack_models` 列出 `deepseek-account/deepseek-flash` 与 `deepseek-account/deepseek-v4-pro`；model-route 实测两者不可用；loop 子代理曾报 `Insufficient Balance (ACCOUNT_QUOTA, 402)`。
- 根因：`deepseek-account` 是基座自带 provider，凭据无余额；`pstack_models` 只报 advertised 路由，不探活。
- 与当前阶段 dsh.md 的关系：`pstack_models` 行写「routes this deployment serves」偏乐观，实际是 advertised routes。
- 建议动作：按用户决定记为环境限制；只要角色路由没配置这些 provider 就不影响适配。
- 你的决定：环境问题，忽略。

### Q6 `skill-dependency-loop` 任务漂移，未在合理时间收敛

- 类型：plugin（场景）
- 能力类别：skill-dependency
- 影响场景：`capability-skill-dependency-loop`
- 证据：
  - [loop record](scenarios/capability-skill-dependency-loop/adapted-base/record.json)
  - [loop screenshot](scenarios/capability-skill-dependency-loop/adapted-base/screenshot.png)
- 现象：原场景只说「直到达到我说的完成条件」，没有完成条件。模型自造一份能力审计，55 步 18 分钟未停，被外部叫停。
- 根因：场景缺少可判定的完成条件，长任务倾向被放大。
- 与当前阶段 dsh.md 的关系：不是 dsh.md 文案问题，是场景设计问题。
- 建议动作：按用户决定改场景，给出同轮可完成的判据。
- 你的决定：接受，改场景。已改为「同一轮内三次巡检，`counter.txt` 写到 3 就停」，复跑通过。

### Q7 `stop-subagent` 第二轮的叫停没有作用对象

- 类型：plugin（场景）
- 能力类别：delegation
- 影响场景：`capability-stop-subagent`
- 证据：[stop-subagent record](scenarios/capability-stop-subagent/adapted-base/record.json)
- 现象：场景本来就有两轮，但首轮的子代理很快跑完，第二轮用户说「叫停」时已经没有在跑的目标，模型只能回答「已经停了」。
- 根因：首轮委派的任务太短，撑不到第二轮叫停。
- 与当前阶段 dsh.md 的关系：不涉及 dsh.md。
- 建议动作：按用户决定改场景，让首轮子代理持续多轮直到被叫停。
- 你的决定：接受，改场景。已改首轮为「反复多轮不要自己停」，复跑后 `interrupt_agent` 生效并给出停点与后续。

### Q8 非文本产物的实际呈现未进入快照

- 类型：ignore-environment
- 能力类别：environment
- 影响场景：`capability-environment-browser-screenshot`、`capability-skill-dependency-control-ui`；`render-*` 全部缺 adapted 探针
- 证据：
  - [browser-screenshot screenshot](scenarios/capability-environment-browser-screenshot/adapted-base/screenshot.png)
  - [control-ui screenshot](scenarios/capability-skill-dependency-control-ui/adapted-base/screenshot.png)
- 现象：原 prompt 没要求截图直接显示，模型用文件卡片交差。改场景后，`control-ui` 复跑能内联显示 8 张截图并通过；`browser-screenshot` 复跑仍只给文件卡片并声称「就在上面那张图里」，回复里没有图。base 里已有图片内联渲染通过的示例，说明环境支持，问题在提示词没写清显示方式。
- 根因：提示词只说「直接显示」，没说用 Markdown 图片语法嵌入正文，模型于是选了文件卡片。
- 与当前阶段 dsh.md 的关系：不涉及 dsh.md。
- 建议动作：提示词明确要求用 Markdown 图片语法把截图嵌进回复正文；按用户决定把该问题标记为环境问题忽略，不再重跑。
- 你的决定：环境问题，忽略。`environment-browser-screenshot.ts` 的提示词已明确要求 `![整页截图](gui-full.png)` 形式内联显示。

### Q9 playground collect 对 blocked 记录找不到 source（本轮已修）

- 类型：plugin（验证工具）
- 能力类别：delegation
- 影响场景：`capability-skill-dependency-loop`
- 证据：[run-case.ts](../../../scripts/run-case.ts)
- 现象：`collect` 报 `missing evidence source file`；blocked 记录 `capturedAt` 用新时间，与文件名/证据时间戳不一致。
- 根因：`blockedRecord` 里重新取 `new Date()` 作为 `capturedAt`。
- 与当前阶段 dsh.md 的关系：不涉及 dsh.md。
- 建议动作：把 attempt 起始 `capturedAt` 透传给 blocked 记录。
- 你的决定：接受。已改 `playground/scripts/run-case.ts`，`playground:typecheck` 通过。

### Q10 无 PTY、无桌面应用的 worker 限制

- 类型：ignore-environment
- 能力类别：environment
- 影响场景：`capability-environment-terminal`、`capability-skill-dependency-control-cli`、`capability-environment-desktop`
- 证据：
  - [environment-terminal record](scenarios/capability-environment-terminal/adapted-base/record.json)
  - [control-cli record](scenarios/capability-skill-dependency-control-cli/adapted-base/record.json)
- 现象：`/dev/pts` 只读、`ptmxmode=000`，PTY 不可用；无 `DISPLAY`/Wayland/桌面应用。模型分别用宿主 terminal API、headless/acp、同源 Web 应用完成。
- 根因：worker 运行环境无 PTY、无桌面。
- 与当前阶段 dsh.md 的关系：`port/dsh.md` 已要求「说明不可用并给替代」，本次行为符合。
- 建议动作：按用户决定记为环境限制，不改文档。
- 你的决定：环境问题，忽略。

## 4. dsh.md 适配说明审查（port/dsh.md）

| 章节/行 | 当前说明 | 相关证据 | 结论 | 建议 |
| --- | --- | --- | --- | --- |
| Tools / `pstack_subagent` | 一次一个子代理；传 `provider`/`model`/`reasoningEffort` 或省略继承 | role-file、role-value | 已补 | 已加「按第一个 `/` 拆，其余为 model」规则 |
| Tools / `pstack_skill` | 按精确 kebab-case `name` 加载，`resource` 读引用 | poteto-agent、skill-loading | 已补 | 已加 `poteto-help` 与 `resource` 示例 |
| Tools / `ask_user_question` | 批量问题，仅 root 有人答 | askquestion | 够用 | 无 |
| Tools / `todo_write` | 无 skipped 状态，跳过项写进 content | open-a-todolist | 够用 | 无 |
| Tools / `grep`+`glob` | 原生工具，直接调用 | grep-glob | 够用 | 无 |
| Subagent fields / 各字段 | `agent`、`readonly`、`cwd`、`resume`、`file_attachments` 映射 | readonly-false/true、resume、file-attachments、inherit-parent | 够用 | 无 |
| Models / `pstack_models` | 「routes this deployment serves」 | model-discovery、model-route | 环境限制，不改 | 用户决定忽略 |
| Models / 角色文件 | `$DSH_HOME/pstack-models.json`，调用方读它映射角色→路由 | role-file、role-value | 已补 | 已加拆分规则 |
| setup-pstack | Write：写 roles 对象，覆盖整个文件幂等 | role-value | 环境限制，不改 | 用户决定忽略沙箱写入 |
| Plugin tools / `pstack_subagent` | completion arrives as a notice | model-route、multi-phase、non-claude | 已补 | 已加禁止 `job_output` 轮询子代理 id |
| Plugin tools / `pstack_skill`、`pstack_roles` | 按名加载 / 报角色路由 | skill-loading、role-file | 够用 | 无 |
| Paths / transcripts | `$DSH_HOME/sessions/<workspace-key>/<session>.jsonl` | environment-session-search | 够用 | 无 |
| Cursor-only features | 写 `Skipped in DeepSeek Harness:` 行继续 | environment-cloud、cloud-base-branch、environment-forge-pr | 够用 | 无 |
| Local replacements / `control-ui`、`control-cli` | 用 vendored 指令技能 | control-ui、control-cli、environment-terminal | 够用 | 无 |
| 渲染能力（无对应章节） | `port/dsh.md` 未描述 output-render | 本轮无 adapted 渲染探针 | 不适用 | 若要 adapted 验收渲染，需补探针 |

## 5. 待用户判断

1. 是否要给 `output-render` 补 adapted 渲染探针（7 个 `render-*` 目前只在 raw 阶段）。
2. `deepseek-account` 是否要从 worker 配置里屏蔽，还是保持按环境限制处理。

## 6. 后续动作

- `dsh-md`：Q1、Q2、Q3 已改 `port/dsh.md` 与 `port/dsh.zh.md`，并重新生成 `pstack/`。
- `plugin`：Q9 已修 `playground/scripts/run-case.ts`；Q6、Q7 已改场景并复跑。
- `ignore-environment`：Q4 沙箱写角色文件；Q5 `deepseek-account` 无额度；Q8 截图内联为提示词问题，已改提示词并忽略；Q10 无 PTY、无桌面。
- `upstream`：无。
- 待用户判断：`output-render` adapted 探针；`deepseek-account` 屏蔽。
- 通过 43 个场景（42 个验证 + 1 个按环境忽略），能力缺口 0 个。
