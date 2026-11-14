# adapted/base 证据分析

> 本文件由 adapted 分析会话依据 `reviews/adapted-base/` 快照、`port/dsh.md`、`src/**` 实现与本地 adapted session 写成。只审查适配实现，不读取 raw 证据结论。

## 1. 本轮范围

- 模式：`full`，批次 `adapted-base-20261114002555`，25 个场景（16 个 base 能力 + 9 个 adapted-only 能力）。
- 环境：`adapted` / `base`，加载 `dsh-pstack`（本地 link 构建），DSH `0.2.2-rc.1`。
- 覆盖：`capability-askquestion`、`environment-local`、`file-attachments`、`grep-glob`、`open-a-todolist`、`readonly-false`、`readonly-true`、`render-generated-image`、`render-mermaid-diagram`、`render-screenshot`、`render-svg-chart`、`render-video`、`resume`、`run-in-background`、`subagent-general`、`task`，以及 adapted-only 的 `model-route`、`non-claude-route`、`inherit-parent`、`role-file`、`role-value`、`skill-loading`、`environment-cloud`、`cloud-base-branch`、`poteto-agent`。
- 证据完整性：25 个 `record.json`、25 张 `screenshot.png` 齐全，无过小或空白截图。
- 记录 verdict 全为 `inconclusive`，因为语义判定由本文件给出。

逐场景结论：

| 场景 | 结论 | 关键观察 |
| --- | --- | --- |
| askquestion | 验证 | `ask_user_question` 弹卡并继续 |
| environment-local | 验证 | 写 `local.txt` 并回读 |
| file-attachments | 验证 | `read` 报 `7.3.1` |
| grep-glob | 验证 | `grep` 4 处 |
| open-a-todolist | 验证 | `todo_write` + 三份文档 |
| readonly-false | 验证 | `pstack_subagent` 写入 `ready=yes` |
| readonly-true | 验证 | readonly 子代理读 `mode=strict`，未改文件 |
| render-generated-image | 验证 | Pillow 生成 PNG 并显示 |
| render-mermaid-diagram | 验证 | 经 mermaid.ink 生成图并显示 |
| render-screenshot | 验证 | `control-ui` 技能截图，首次空白后重开修正 |
| render-svg-chart | 验证 | mermaid-cli 输出 SVG/PNG |
| render-video | 观察（符合文档的降级） | 产出 mp4 文件，回复内无播放器（未装渲染插件） |
| resume | 验证 | `send_message` 续同一子代理，3 个 `.md` |
| run-in-background | 验证 | 派发后回传完成；角色默认 effort 预检失败后降级成功 |
| subagent-general | 验证 | `pstack_subagent` 写 `out/summary.txt` |
| task | 验证 | 子代理总结 README 并转述 |
| model-route | 验证 | `pstack_models`/`pstack_roles` 生效；子代理先报错后成功 |
| non-claude-route | 验证 | 子代理走 `magpie/workbuddy/deepseek-v4.1-flash` |
| inherit-parent | 验证 | 未配置角色回落父路由；`deepseek-official` 无模型 |
| role-file | 验证 | `setup-pstack` 技能读取角色文件 |
| role-value | 缺口 | 写 `$DSH_HOME/pstack-models.mdc` 被沙箱拒绝，提权被驳回 |
| skill-loading | 验证 | `pstack_skill` 加载 `poteto-help` |
| environment-cloud | 验证 | 无 `create_worktree`，用本地隔离检出替代并注明跳过 |
| cloud-base-branch | 验证（跳过行） | 无 forge bundle，按文档写跳过行并用本地 main 基线 |

## 2. 问题问答

### Q1 `pstack_subagent` 的 `role` 与 `roleIndex` 参数被模型反复用错

- 类型：dsh-md
- 影响场景：`model-route`、`poteto-agent`、`run-in-background`、`subagent-general`、`role-value`
- 证据：
  - [model-route record](scenarios/capability-model-route/adapted-base/record.json)
  - [poteto-agent record](scenarios/capability-poteto-agent/adapted-base/record.json)
  - [run-in-background record](scenarios/capability-run-in-background/adapted-base/record.json)
- 现象：多次出现 `unknown pstack role "feature"`（应为精确键 `feature, refactoring`）、`missing required argument "roleIndex"`、`missing required argument "role"`、`roleIndex does not apply` 这类工具报错；模型随后改正并完成任务。
- 根因：`pstack_subagent` 要求 `role` 是角色清单的精确键，且 `roleIndex`、`role` 必填（可为 `null`）。当前 port/dsh.md 在 Tools 与 Subagent fields 里已写，但都埋在一段长文本里，模型容易漏读。
- 与当前阶段 dsh.md 的关系：`port/dsh.md` 的 `pstack_subagent` 行需更醒目地写「role 用清单精确键」和「role/roleIndex 必填，未用传 null」。
- 建议动作：在 Plugin tools 的 `pstack_subagent` 条目或 Subagent fields 开头加一句硬规则。
- 你的决定：待定

### Q2 未配置角色的默认 effort 高于模型能力，预检失败

- 类型：plugin
- 影响场景：`run-in-background`（`inherit-parent`、`model-route` 同类）
- 证据：[run-in-background record](scenarios/capability-run-in-background/adapted-base/record.json)
- 现象：`role "feature, refactoring" resolves to inherit-parent [xhigh], which failed route preflight: model workbuddy/minimax-m3.1-flash does not support reasoning effort "xhigh"`，模型降到 `high` 后成功。
- 根因：角色未配置时按预算取 `xhigh`，但继承到的父模型只声明 `low/high`。
- 与当前阶段 dsh.md 的关系：涉及插件路由预检策略，不是 dsh.md 文案。
- 建议动作：插件在 `inherit-parent` 或未配置角色时，把 effort 夹到目标模型声明的最高档，而不是直接取预算目标。
- 你的决定：待定

### Q3 会话内写 `$DSH_HOME/pstack-models.mdc` 被沙箱拒绝

- 类型：plugin（并需 dsh-md 辅助说明）
- 影响场景：`role-value`
- 证据：[role-value record](scenarios/capability-role-value/adapted-base/record.json)
- 现象：写角色文件报 `[sandbox: file access denied under workspace-write mode]`，提权到 `danger-full-access` 被用户拒绝，模型改为说明可用 UI 标签页编辑。
- 根因：`$DSH_HOME` 在会话工作区之外，`workspace-write` 沙箱不允许写；`setup-pstack` 的「写入」步骤在会话内无法完成。
- 与当前阶段 dsh.md 的关系：`port/dsh.md` 的 `setup-pstack` 写的是直接写文件，属`缺失`对沙箱限制的说明。
- 建议动作：插件提供受控的角色文件写入工具，或 dsh-md 明确「在会话内改角色走 Web 插件设置页的 pstack 标签，不要直接写文件」。
- 你的决定：待定

### Q4 仍出现把子代理 id 当后台 job 轮询

- 类型：plugin
- 影响场景：`inherit-parent`、`role-value`
- 证据：[inherit-parent record](scenarios/capability-inherit-parent/adapted-base/record.json)
- 现象：`job_output -> Error: unknown job <子代理 id>`，即模型继续用 `job_output` 轮询 `pstack_subagent` 的 id。
- 根因：缺一个明确交代子代理不用 job 轮询的插件派发工具说明（与 raw 阶段 Q4 同一根因）。
- 建议动作：按此前占位，由插件内派发工具说明覆盖，dsh.md 此处留占位。
- 你的决定：待定

### Q5 云端与 worktree 相关能力依赖可选 forge bundle

- 类型：ignore-environment
- 影响场景：`environment-cloud`、`cloud-base-branch`
- 证据：[environment-cloud record](scenarios/capability-environment-cloud/adapted-base/record.json)、[cloud-base-branch record](scenarios/capability-cloud-base-branch/adapted-base/record.json)
- 现象：`create_worktree` 不可用，模型按文档写 `Skipped in DeepSeek Harness` 行并用本地隔离检出替代。
- 根因：未启用 `@deepseek-ai/dsh-experimental-forge-bundle`。属可选能力未开启，符合 port/dsh.md。
- 建议动作：无需改文档；属环境配置。
- 你的决定：待定

### Q6 渲染类仍依赖外部工具与网络

- 类型：ignore-environment
- 影响场景：`render-mermaid-diagram`、`render-svg-chart`、`render-screenshot`、`render-video`
- 证据：[render-mermaid-diagram screenshot](scenarios/capability-render-mermaid-diagram/adapted-base/screenshot.png)、[render-video screenshot](scenarios/capability-render-video/adapted-base/screenshot.png)
- 现象：mermaid 走 mermaid.ink 在线渲染；svg 手工装 mermaid-cli + chrome-headless-shell；截图用 `control-ui`/agent-browser；视频产出 mp4 文件但回复内无播放器（未装渲染插件）。
- 根因：base 无内置图表/视频渲染器，靠外部工具与网络。
- 建议动作：按环境依赖记录；render-video 的「文件交付」符合 port/dsh.md 的 ketchup-video 行。
- 你的决定：待定

## 3. dsh.md 适配说明审查（port/dsh.md）

| 章节/行 | 当前说明 | 相关证据 | 结论 | 建议 |
| --- | --- | --- | --- | --- |
| Tools / `pstack_subagent` | 长段描述参数 | model-route、poteto-agent、subagent-general | 够用但易漏 | 显式强调 role 精确键、role/roleIndex 必填 |
| Plugin tools / `pstack_subagent` | 派发与完成通知 | run-in-background | 够用 | 补「不要用 job_output 轮询子代理 id」（Q4） |
| Tools / `pstack_skill` | 按名加载，含隐藏技能 | skill-loading | 够用 | 无 |
| Models / `pstack_models` | 列真实路由 | model-route、inherit-parent | 够用 | 无 |
| Subagent fields / 各字段 | 逐字段映射 | readonly、resume、file_attachments | 够用 | 无 |
| setup-pstack | 直接写 `$DSH_HOME/pstack-models.mdc` | role-value | 缺失（沙箱限制未写） | 改为会话内走 UI 标签，或由插件工具写 |
| Optional plugins | 已移除 agent-team | 全量批次无冲突 | 够用 | 无 |
| Plugin tools（新增节） | 4 个插件工具清单 | 全量 | 够用 | 无 |

## 4. 待用户判断

1. Q1 是否把 `pstack_subagent` 的 role/roleIndex 硬规则提升为醒目提示。
2. Q2 是否改插件预检，把 inherit-parent 的 effort 夹到模型可支持档位。
3. Q3 是否新增插件受控的角色文件写入工具，还是只在 dsh.md 写「会话内用 UI 标签页改」。
4. Q4 的插件派发工具说明仍按占位处理。

## 5. 后续动作

- `dsh-md`：强化 `pstack_subagent` 的 role/roleIndex 规则；`setup-pstack` 增加沙箱/UI 标签页说明；Q4 留占位。
- `plugin`：Q2 effort 预检夹取；Q3 角色文件写入工具或说明；Q4 派发工具说明。
- `ignore-environment`：Q5 forge bundle 未启、Q6 外部工具与网络。
- `upstream`：无。
- 其余 18 个场景能力已验证。
