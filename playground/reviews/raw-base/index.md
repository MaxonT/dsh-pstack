# raw/base 证据分析

> 本文件由 raw 分析会话依据 `reviews/raw-base/` 快照、`playground/raw/dsh.md`、场景文件与本地 raw session 写成。只审查 raw 基准，不读取 port 实现。

## 1. 本轮范围

- 模式：`full`，批次 `raw-base-20261113184827`。
- 环境：`base`，DSH `0.2.2-rc.1`，上游 revision `ae5650febf4320793844c12c4adaa937f417f8da`，配置 hash `3aa7db10df9015190040d91bf76064369bc294f09f37408e26a33a7804a5fbcb`。
- 覆盖场景（16）：`capability-askquestion`、`capability-environment-local`、`capability-file-attachments`、`capability-grep-glob`、`capability-open-a-todolist`、`capability-readonly-false`、`capability-readonly-true`、`capability-render-generated-image`、`capability-render-mermaid-diagram`、`capability-render-screenshot`、`capability-render-svg-chart`、`capability-render-video`、`capability-resume`、`capability-run-in-background`、`capability-subagent-general`、`capability-task`。
- 未覆盖：`skill-loading`、`model-route`、`non-claude-route`、`inherit-parent`、`role-file`、`role-value`、`environment-cloud`、`cloud-base-branch`、`poteto-agent` 共 9 个场景声明 `phases: ["adapted"]`，按规则不在 raw 运行。

各场景观察结论（语义判定，对照 rubric 与 session 事件）：

| 场景 | 结论 | 关键观察 |
| --- | --- | --- |
| askquestion | 观察到 | 回复内出现结构化问题卡片（标题「脚本用途」+可选项），autoAnswer 选择「代码质量/CI 检查」后继续并产出脚本 |
| environment-local | 观察到 | 主会话在当前工作区写 `local.txt` 并 `bash cat` 回读确认 |
| file-attachments | 观察到 | 主会话 `read data/spec.md` 后原样报出 `7.3.1` |
| grep-glob | 观察到 | 直接调用原生 `grep`，列出 4 处含 `src/a.ts` |
| open-a-todolist | 观察到 | 三次 `todo_write` 更新状态，最终三份文档存在，底部任务面板显示 5 项完成 |
| readonly-false | 观察到 | 子代理写入 `ready=yes`，第二轮回传并 `read` 复核（Q3 修复后截图含完成结果） |
| readonly-true | 观察到 | 只读子代理报告第一行 `mode=strict`，`config.txt` 未改动 |
| render-screenshot | 观察到 | 起本地服务后用 Chrome/CDP 抓整页，回复内联出真实页面图像并产出 `shot.png` |
| render-generated-image | 观察到 | 生成白板手绘风 PNG 并在回复内联显示 |
| render-mermaid-diagram | 观察到 | 用 mermaid-cli 渲染成 PNG 并在回复内联显示 |
| render-svg-chart | 观察到 | 用 mermaid-cli 渲染出 `artifacts/flow.svg` 与 PNG，回复内联显示状态图 |
| render-video | 观察到（符合预期的降级） | 产出 `changelog-summary.mp4`（603 KB）；base 无内联播放器，属原生边界（见 Q1） |
| resume | 观察到 | 用 `send_message` 续同一 `agent_id` 复核，两次都是 3 个 `.md` 文件（见 Q4） |
| run-in-background | 观察到 | 第一轮立即回报「已派出」，第二轮子代理完成消息到达后回传报告（Q3 修复后重采） |
| subagent-general | 观察到 | 通用子代理写出 `out/summary.txt`，主会话 `cat` 复核内容 `done` |
| task | 观察到 | 子代理读取 README 并返回结论，主会话转述 |

## 2. 问题问答

### Q1 对比后确认 base 不内联播放、不原生渲染 Mermaid 符合预期，故不写适配说明

- 类型：不适用（对比后确认符合预期）
- 影响场景：`capability-render-video`，同理适用于 `capability-render-mermaid-diagram`
- 证据：
  - [record](scenarios/capability-render-video/raw-base/record.json)
  - [截图](scenarios/capability-render-video/raw-base/screenshot.png)
  - session 只在本地 worker，按 `record.session.sessionId` = `session-e8f09fa2-5bc6-4f...` 读取
- 现象：base 能产出 `changelog-summary.mp4`（H.264 / yuv420p / 30fps / 13.0s / 603 KB）与图片文件，图像可内联显示；但没有内联视频播放器，Mermaid 需要外部工具先渲成图片。
- 判断：对比 base 与 render 后确认，base 的表现本就符合预期。图片能内联显示，视频和图表能以文件交付，pstack 技能要的是可检查的产物，文件即可满足。内联播放和 Mermaid 原生渲染属于可选渲染插件的能力，base 有没有对应的适配说明，对技能实际结果几乎没影响，因为写不写都不会让 base 凭空获得播放器和图表渲染器。反过来，写进 dsh.md 会增加风险。一是把第三方插件的可选能力塞进只描述 DSH 能力的文件，超出边界；二是写死后插件版本或能力变化时说明容易漂移，反而误导后续技能。所以结论是不写，按符合预期的原生降级记录。
- 与当前阶段 dsh.md 的关系：不改 `raw/dsh.md`。
- 建议动作：无 dsh.md 修改，按符合预期的原生降级记录。
- 你的决定：已确认不改（2026-11-13）

### Q2 file-attachments、environment-local 探针未覆盖对应子代理字段

- 类型：plugin
- 影响场景：`capability-file-attachments`、`capability-environment-local`
- 证据：
  - [file-attachments record](scenarios/capability-file-attachments/raw-base/record.json)
  - [environment-local record](scenarios/capability-environment-local/raw-base/record.json)
- 现象：两个 probe 的 rubric 都通过（读到 `7.3.1`、写入 `local.txt`），但 record 只有主会话的 `read` / `write`，没有出现 `subagent`。
- 根因：场景 prompt 只要求「读文件」或「在当前工作区改文件」，由主会话直接完成，没有委派给执行者；因此没有验证 `dsh.md` 的 `file_attachments` 与 `environment: "local"` 子代理字段映射。
- 与当前阶段 dsh.md 的关系：`raw/dsh.md` 对应行（第 24、28 行）未被本次证据覆盖；这类子代理字段差异改由插件内提供的工具弥补。
- 建议动作：不修改探针；由插件内提供的工具弥补该差异，不作为 dsh.md 缺口。
- 你的决定：已确认，由插件内工具弥补（2026-11-13）

### Q3 异步完成曾落在自动第二轮，已修复采集时机并重采

- 类型：plugin（采集工具修复）
- 影响场景：`capability-run-in-background`、`capability-readonly-false`
- 证据：
  - [run-in-background record](scenarios/capability-run-in-background/raw-base/record.json) 与 [截图](scenarios/capability-run-in-background/raw-base/screenshot.png)
  - [readonly-false record](scenarios/capability-readonly-false/raw-base/record.json) 与 [截图](scenarios/capability-readonly-false/raw-base/screenshot.png)
  - session 日志（本地 worker）：两个会话都在子代理完成消息到达后开启第二轮并回传结果。
- 现象：修复前 record 的 assistantText 只到「已派出」，截图停在第一轮。修复后 record 已包含第二轮完成结果，`run-in-background` 含子代理报告摘要，`readonly-false` 含 `ready=yes` 复核；两张截图均有效（216753 字节、82447 字节）。
- 根因：`run-case` 原先在会话第一次空闲就截图。现改为 `waitForSubagentsSettled`，从 session 事件收集所有 `subagent/catalog` 子代理，等每个都出现 finished 或 was stopped 且会话安静后再采集。
- 与当前阶段 dsh.md 的关系：不涉及 dsh.md，属采集工具修复。
- 建议动作：已修复 `run-case.ts` 与 `runtime.ts`，并重跑这两个场景。
- 你的决定：已按「所有子代理完成后再采集」修复并重采（2026-11-13）

### Q4 resume 过程中模型把子代理 id 当后台 job 轮询

- 类型：plugin
- 影响场景：`capability-resume`
- 证据：
  - [record](scenarios/capability-resume/raw-base/record.json)
  - session 日志：一次多余 `subagent_fork`（placeholder，随即 `interrupt_agent`），三次 `job_output` 报 `unknown job`。
- 现象：能力最终通过，`send_message` 到同一 `agent_id` 复核，两次都是 3 个 `.md` 文件；但过程有 1 次误起子代理和 3 次工具报错。
- 根因：模型把子代理 id 当后台 job id 去 `job_output` 轮询，且误把 `subagent_fork` 当续用手段。
- 与当前阶段 dsh.md 的关系：不改 `raw/dsh.md`。插件内将提供用于派发子代理的工具，子代理的用法说明由该插件工具承担。
- 建议动作：由插件内提供的子代理派发工具覆盖该用法；插件工具的子代理说明由用户另行编写。
- 占位：TODO(用户另行补写「插件内子代理派发工具」说明，本节暂留占位)
- 你的决定：已确认，插件内提供派发工具，说明用户单独写，此处占位（2026-11-13）

## 3. dsh.md 适配说明审查

只审查 `playground/raw/dsh.md`。

| 章节/行 | 当前说明 | 相关证据 | 结论 | 建议 |
| --- | --- | --- | --- | --- |
| Tools / `Task`（第 9 行） | `subagent` 立即返回 id，完成时通知；`subagent_fork` 继承对话 | task、subagent-general、run-in-background、resume | 够用 | 无 |
| Tools / `AskQuestion`（第 10 行） | `ask_user_question` 批量提问；空 selected 且无 custom 为跳过 | askquestion（结构化问题卡片可见并收到选择） | 够用 | 无 |
| Tools / Open a todolist（第 11 行） | `todo_write` 替换整表；三态；skip 保持 pending | open-a-todolist（三次 todo_write，任务面板 5 项完成） | 够用（skip 语义未验证） | 无 |
| Tools / Run another pstack skill（第 12 行） | `skill` 按名加载；`disable-model-invocation` 用 read | 无（skill-loading 为 adapted-only） | 不适用 | 留给 adapted |
| Tools / `Grep`,`Glob`（第 13 行） | 原生工具直接调用 | grep-glob（直接 grep 得到 4 处） | 够用 | 无 |
| Subagent fields / `generalPurpose`（第 19 行） | 无该字段，角色来自 prompt 或 agents 文件 | task、subagent-general | 够用 | 无 |
| Subagent fields / `poteto-agent`,`comment-sicko`（第 20 行） | 无原生等价物，读 agents 文件或自写 prompt | 无（poteto-agent adapted-only） | 不适用 | 留给 adapted |
| Subagent fields / `readonly: true`（第 21 行） | 无沙箱字段，prompt 写勿改，依赖权限模式 | readonly-true（子代理只读，config.txt 未改） | 够用 | 无 |
| Subagent fields / `readonly: false`（第 22 行） | 省略，默认可写 | readonly-false（子代理写入 ready=yes） | 够用 | 无 |
| Subagent fields / `environment: "cloud"`（第 23 行） | 无云代理，用 create_worktree 或写跳过行 | 无（environment-cloud adapted-only） | 不适用 | 留给 adapted |
| Subagent fields / `environment: "local"`（第 24 行） | 省略，默认本地 | environment-local（当前工作区写 local.txt，但未用子代理） | 够用（子代理默认未验证） | 见 Q2 |
| Subagent fields / `cloud_base_branch`（第 25 行） | 无该字段，传 create_worktree.from | 无（adapted-only） | 不适用 | 留给 adapted |
| Subagent fields / `run_in_background`（第 26 行） | 省略，subagent 立即返回并完成时通知 | run-in-background（首轮已派出，次轮回传结果） | 够用 | 见 Q4 补一句勿用 job_* 轮询 |
| Subagent fields / `resume`（第 27 行） | `send_message` 到 agent_id 继续 | resume（同一 agent 复核，数字一致） | 够用 | 见 Q4 |
| Subagent fields / `file_attachments`（第 28 行） | 无该字段，路径列进 prompt | file-attachments（主会话 read，未委派） | 待你判断（未验证） | 见 Q2 |
| Models（第 34-38 行） | provider/model/reasoning_effort 路由 | 无（model-route 等 adapted-only） | 不适用 | 留给 adapted |
| setup-pstack（第 42-46 行） | 角色文件与 detect/defaults/write 步骤 | 无（adapted-only） | 不适用 | 留给 adapted |
| Paths（第 50-56 行） | 目录布局 | 无（不属能力提取范围） | 不适用 | 无 |
| Cursor-only features（第 60-67 行） | 跳过规则 | 无（不是会话能力） | 不适用 | 无 |
| 非文本产物渲染/播放 | 当前无此节 | render-screenshot、render-generated-image、render-mermaid-diagram、render-svg-chart、render-video | 不适用（对比后确认符合预期） | 不写入，写了超出边界且易漂移 |

## 4. 待用户判断

1. 已确认，`capability-render-video` 的「无法内联播放」按符合预期的原生降级处理，不写 dsh.md（2026-11-13）。
2. 已确认，`capability-file-attachments`、`capability-environment-local` 不改探针，由插件内提供的工具弥补字段差异（2026-11-13）。
3. 已修复 `run-case` 采集时机，等所有子代理完成后再采集，并重跑对应场景（2026-11-13）。
4. 已确认，Q4 由插件内提供的子代理派发工具覆盖，插件工具说明用户另行编写，此处留占位（2026-11-13）。

## 5. 后续动作

- `dsh-md`：无（对比后确认 base 符合预期，写适配说明收益很小、风险更高，Q1）。
- `plugin`：Q2 由插件内提供的工具弥补子代理字段差异（不改探针）；Q3 已修复 `run-case` 采集时机（等所有子代理完成后采集）；Q4 由插件内提供的子代理派发工具覆盖，工具说明用户另行编写，留占位。
- `upstream`：无。
- `ignore-environment`：若团队把「无内联视频播放器」算环境/UI 限制，`render-video` 改记此项。
- 其余 15 个场景能力均观察到，无需改 dsh.md。
