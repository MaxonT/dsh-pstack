# Playground 运转规则

本文件是 playground 的唯一严格规则源。完整阶段、命令和交接条件见 [docs/verification-loop.md](./docs/verification-loop.md)。README 只是入口，不承载流程。

## 边界

- playground 用真实 DSH Web 会话验证移植。Linux 是唯一官方支持的平台；其他系统由 `playground:doctor` 明确报告不支持。
- 上游技能自身的文案、结构、依赖缺口和质量问题不属于本仓回归范围。这里只验证移植后在 DSH 内的运转和结果渲染。
- 禁止在 prompt、assertions、rubric、uiObservations 中预设目标运行时能力或预期缺口。能力缺失由会话证据和 review 发现。
- 真实模型选择由用户确认；每条 RunRecord 记录实际路由、DSH 版本、上游 revision 和配置 hash。

## 目录

- `scenarios/<group>/<scenario>.ts`：一个场景一个文件；group 由目录和注册表决定。playbook 场景的 prompt 以 `/poteto-mode ` 开头。
- `scenarios/registry.ts`：用 `import.meta.glob` 自动发现组目录；CLI 通过 `runnerImport` 加载。禁止维护手工 import 列表。
- `scenarios/AGENTS.md`：用例编写规则；新增或修改场景前必读。
- `reviews/<phase>-<environment>/`：当前完整快照，提交进库。`manifest.json` 是机器清单；`index.md` 是证据分析问答；`scenarios/<group>/<scenario>/<phase>-<environment>/` 保存 `record.json` 和两张截图；`session.jsonl.zstd` 只保留本地，不提交。
- `reviews/.staging/`：批次运行中的临时目录，不提交。`reports/` 不再生成。
- 不保留空目录；不恢复 `plugin-ui`、`conflicts`、`run-ui`、`run-conflict` 或 `cases.lock`。

## 场景要求

- 每个场景只观察 DSH 可观察行为：技能是否加载（`skill`、`pstack_skill`、`read` 回退或 `/name` 用户手势）、依赖是否可用和加载、工具调用与重试、turn 是否结束、最终答复或产物是否存在。
- `SessionAnalysis` 必须写入 RunRecord，包含 `skillInvocation`、`dependencies`、`tools`、`userGesture` 和 warnings。
- 截图必须同时有 viewport 和 full-page；审阅以 full-page 为准。
- 每个上游技能和 playbook 必须有场景或明确排除。排除只给上游明确依赖 Cursor 云服务的条目，理由和证据写进 `exclusions.ts`。
- 带环境矩阵的场景不预设冲突；具体环境只用于运行矩阵，结果由会话文件和界面观察决定。
- 每个 scenario workspace 由 runner 初始化本地 `git init`，不设置 origin；worker 不携带 Git/GitHub 凭证，避免真实远端副作用。

## 证据分析

- `collect` 只写 `reviews/<phase>-<environment>/` 的当前快照，不生成额外的汇总或审批文件。
- 每轮结束后在新会话按 [docs/evidence-analysis.md](./docs/evidence-analysis.md) 分析全部证据，填写 `index.md`；提交前按 [docs/evidence-redaction.md](./docs/evidence-redaction.md) 生成 `record.safe.json` 并运行 `playground:redact --apply`。
- 分析必须按「根因 + 建议动作」去重，同一问题的影响场景和证据合并到一条问答。
- 无法可靠分类的问题一律标为待用户判断，禁止默认忽略、默认归为上游或默认选一个 decision。
- raw 分析只对照 `playground/raw/dsh.md`；adapted 分析只对照 `port/dsh.md`。
- 结论必须由证据和根因支撑，不能把单一观察直接等同于适配说明缺陷。
- 只有当前阶段明确落到 `dsh-md` 或 `plugin` 的结论才进入该阶段的适配修改；`upstream`、`ignore-environment` 和 `needs-human` 按结论分流。

## 流程与交接

- 每个会话只接一个阶段，入口条件、产物和下一步以 `docs/verification-loop.md` 的“阶段交接”表为准；review 后必须落到具体 decision，不能停在“看起来没问题”。
- 进程生命周期：每次 bash 调用都在独立的 PID namespace/cgroup 里。`prepare` 启动的 DSH Web 即使使用 detached，也会在 job shell 退出时被销毁；不要把 `prepare` 和 `bootstrap` 拆成两次调用。
- `prepare → bootstrap → run-batch → collect` 必须在同一个长期存活的 background job 中执行，shell 保持到 collect 结束。不要用 `&`、`nohup` 或 `tee`；`vp run` wrapper 被 SIGTERM 时改用 `vpx playground/scripts/*.ts` 直调。
- prepare 为每个 worker 写入 `$DSH_HOME/AGENTS.md` 的结构化读边界；所有 phase 生效，限制只能读取工作区和系统挂载的只读输入。
- 任务超过 10 分钟时读取该 worker 的真实 session 文件判断是否仍有效推进；确认无效后执行 `playground:stop-task`，保留当前证据并继续后续任务。
- worker 数：用户没有指定时，`prepare` 用 `capacity.ts` 计算的环境最大值，不写死 `--workers`；`run-batch` 使用已 prepare 的 worker 数。只有明确限流时才传 `--workers N`。
- raw：生成 `playground/raw/pstack`，`run-batch --full` 跑 raw 可用组，collect，在新会话按证据分析规则填写 `reviews/raw-base/index.md`。
- 适配开发：根据分析结论维护 `playground/raw/dsh.md`/`dsh.zh.md` 和 `port/dsh.md`/`dsh.zh.md`，改 `src/` 与 `cordis.patch.yml`，生成两棵树并 build。
- adapted/base：`run-batch --full` 跑 adapted 可用组，collect，分析 `reviews/adapted-base/index.md`。不通过回适配开发。
- 适配后环境组：按环境矩阵跑对应 batch，collect，分析 `reviews/adapted-<environment>/index.md`。环境限制按能力类别记录；带显式环境矩阵的元数据可以写包名或 ID。
- README/兼容表更新后，agent 停在 release-ready；`vp run release` 由用户手动执行。

## dsh.md

- `playground/raw/dsh.md` 是 raw 基准答案，`port/dsh.md` 是最终随包答案，两者不能合并。
- dsh.md 只描述 DSH 能力，不写具体插件、包、外部二进制或服务的安装建议；可选能力用泛化能力类别说明。
- 生成 `dsh.md` 时先复制上游 `claude-code.md` 的结构并清空答案，再由 agent 和用户逐条提案、审批、写入；已有答案作为默认提案但仍逐条确认。
- `dsh.zh.md` 是逐行中文翻译，只供审阅，生成器不读。
- `playground/raw/dsh-evidence.md` 保存判定依据。
- `scripts/generate-pstack.mjs --target port|raw` 是唯一生成器；`--target port` 写根 `pstack/`，`--target raw` 写 `playground/raw/pstack/`。
