# Playground 运转规则

本文件是 playground 的唯一严格规则源。完整阶段、命令和审批门见 [docs/verification-loop.md](./docs/verification-loop.md)。README 只是入口，不承载流程。

## 边界

- playground 用真实 DSH Web 会话验证移植。Linux 是唯一官方支持的平台；其他系统由 `playground:doctor` 明确报告不支持。
- 上游技能自身的文案、结构、依赖缺口和质量问题不属于本仓回归范围。这里只验证移植后在 DSH 内的运转和结果渲染。
- 禁止在 prompt、assertions、rubric、uiObservations 中预设目标运行时能力或预期缺口。能力缺失由会话证据和 review 发现。
- 真实模型选择由用户确认；每条 RunRecord 记录实际路由、DSH 版本、上游 revision 和配置 hash。

## 目录

- `scenarios/skills/<skill>.ts`：一个上游技能一个文件。
- `scenarios/playbooks/<playbook>.ts`：一个上游 playbook 一个文件，prompt 以 `/poteto-mode ` 开头。
- `scenarios/official-plugins/<plugin>.ts`：一个官方插件一个文件，同一场景在 `raw/base`、`adapted/base`、`adapted/<plugin>` 运行。
- `scenarios/registry.ts`：用 `import.meta.glob` 自动收集三个目录；CLI 通过 `runnerImport` 加载。禁止维护手工 import 列表。
- `scenarios/AGENTS.md`：用例编写规则；新增或修改场景前必读。
- `reports/scenarios/`：镜像 `scenarios/` 的 case 证据组。`reports/runs/`：按 phase/environment 汇总的 `summary.md`、`summary-<group>.md` 和 `runtime-review.md`。`reports/approvals/`：最终审批。`record.json`、截图、session 日志不提交；其余报告文件提交。
- `reviews/scenarios/<group>/<scenario>/<phase>-<environment>.json`：审核侧车，提交进库；`reviews/runtime-review/<phase>-<environment>.json`：运行时点评。
- 不保留空目录；不恢复 `plugin-ui`、`conflicts`、`run-ui`、`run-conflict` 或 `cases.lock`。

## 场景要求

- 每个场景只观察 DSH 可观察行为：技能是否加载（`skill`、`pstack_skill`、`read` 回退或 `/name` 用户手势）、依赖是否可用和加载、工具调用与重试、turn 是否结束、最终答复或产物是否存在。
- `SessionAnalysis` 必须写入 RunRecord，包含 `skillInvocation`、`dependencies`、`tools`、`userGesture` 和 warnings。
- 截图必须同时有 viewport 和 full-page；审阅以 full-page 为准。
- 每个上游技能和 playbook 必须有场景或明确排除。排除只给上游明确依赖 Cursor 云服务的条目，理由和证据写进 `exclusions.ts`。
- 官方插件场景不预设冲突；`agent-team` 只是普通插件环境，结果由会话文件和界面观察决定。

## 运行时适配审查

- `SemanticReview` 只判断技能效果是否成立；运行时差异必须单独记录在 `runtimeReview`，不能把运行时问题藏进 skill 的 `gap` 或 `reason`。
- 每个 finding 必须有 `kind`、`severity`、`decision`、`observation`、`action`、`evidence`。
- `decision` 只能是 `dsh-md`、`plugin`、`skip`、`ignore-environment`、`upstream` 或 `needs-human`。DSH 有等价能力但语义不同时走 `dsh-md`；需要新增工具、预设或可选包时走 `plugin`；只有环境权限、凭据、网络或无头限制时走 `ignore-environment`；技能自身问题走 `upstream`。
- 普通 skills/playbooks 的 finding 不假设用户环境会安装任何可选插件，也不写具体插件名、包名、外部二进制名或服务名；需要描述能力时用能力类别。
- 外部依赖缺失由技能在运行时自行处理。它不是适配 gap，不写进 dsh.md 的安装建议，也不进入“需要补插件/依赖”的 runtime finding。官方插件矩阵按环境矩阵声明的包记录，不把矩阵环境当成所有用户环境。
- 无法可靠分类、或分类会影响后续方案却证据不足时，必须使用 `kind: "unclear"`、`decision: "needs-human"`、`status: "needs-review"`，交给用户亲自审查。禁止默认忽略、默认归为上游或默认选一个 decision 来消除告警。
- `collect` 必须输出 `reports/runs/<phase>-<environment>/runtime-review.md`：只保留 finding，按 `group + skill + kind + severity + decision + observation + action` 去重，相同 finding 合并 `scenarios`。没有 finding 时不生成该文件。summary、comparison 和 approval 仍要区分 semantic 与 runtime；`needs-review` 和未填写的 runtime review 不能被当作 clean。

## 流程与审批

- 每个会话只接一个阶段，入口条件、产物和下一步以 `docs/verification-loop.md` 的“阶段交接”表为准；review 后必须落到具体 decision，不能停在“看起来没问题”。
- 进程生命周期：每次 bash 调用都在独立的 PID namespace/cgroup 里。`prepare` 启动的 DSH Web 即使使用 detached，也会在 job shell 退出时被销毁；不要把 `prepare` 和 `bootstrap` 拆成两次调用。
- `prepare → bootstrap → run-batch → collect` 必须在同一个长期存活的 background job 中执行，shell 保持到 collect 结束。不要用 `&`、`nohup` 或 `tee`；`vp run` wrapper 被 SIGTERM 时改用 `vpx playground/scripts/*.ts` 直调。
- worker 数：用户没有指定时，`prepare` 用 `capacity.ts` 计算的环境最大值，不写死 `--workers`；`run-batch` 使用已 prepare 的 worker 数。只有明确限流时才传 `--workers N`。
- raw：生成 `playground/raw/pstack`，跑 `raw/base` 的 skills 和 playbooks，collect，`review --apply`。raw 的 gate 是 sidecar 加 `dsh.md` 逐行确认。
- 适配开发：维护 `playground/raw/dsh.md`/`dsh.zh.md` 和 `port/dsh.md`/`dsh.zh.md`，改 `src/` 与 `cordis.patch.yml`，生成两棵树并 build。
- adapted/base：跑 skills 和 playbooks，与 raw/base 对比，生成 `reports/approvals/adapted-base.md`。不通过回适配开发。
- official-plugins：每个插件跑 base 与插件环境，生成 `reports/approvals/official-plugins.md`。环境限制按能力类别记录，不写具体包名。
- README/兼容表更新后，agent 停在 release-ready；`vp run release` 由用户手动执行。

## dsh.md

- `playground/raw/dsh.md` 是 raw 基准答案，`port/dsh.md` 是最终随包答案，两者不能合并。
- dsh.md 只描述 DSH 能力，不写具体插件、包、外部二进制或服务的安装建议；可选能力用泛化能力类别说明。
- 生成 `dsh.md` 时先复制上游 `claude-code.md` 的结构并清空答案，再由 agent 和用户逐条提案、审批、写入；已有答案作为默认提案但仍逐条确认。
- `dsh.zh.md` 是逐行中文翻译，只供审阅，生成器不读。
- `playground/raw/dsh-evidence.md` 保存判定依据。
- `scripts/generate-pstack.mjs --target port|raw` 是唯一生成器；`--target port` 写根 `pstack/`，`--target raw` 写 `playground/raw/pstack/`。
