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
- `reports/`：镜像 `scenarios/` 的生成区。`record.json`、截图、session 日志不提交；`index.md`、`summary-*.md`、`comparison.md`、`approval-*.md` 提交。
- `reviews/`：审核侧车，提交进库。
- 不保留空目录；不恢复 `plugin-ui`、`conflicts`、`run-ui`、`run-conflict` 或 `cases.lock`。

## 场景要求

- 每个场景只观察 DSH 可观察行为：技能是否加载（`skill`、`pstack_skill`、`read` 回退或 `/name` 用户手势）、依赖是否可用和加载、工具调用与重试、turn 是否结束、最终答复或产物是否存在。
- `SessionAnalysis` 必须写入 RunRecord，包含 `skillInvocation`、`dependencies`、`tools`、`userGesture` 和 warnings。
- 截图必须同时有 viewport 和 full-page；审阅以 full-page 为准。
- 每个上游技能和 playbook 必须有场景或明确排除。排除只给上游明确依赖 Cursor 云服务的条目，理由和证据写进 `exclusions.ts`。
- 官方插件场景不预设冲突；`agent-team` 只是普通插件环境，结果由会话文件和界面观察决定。

## 流程与审批

- worker 数：用户没有指定时，`prepare` 用 `capacity.ts` 计算的环境最大值，不写死 `--workers`；`run-batch` 使用已 prepare 的 worker 数。只有明确限流时才传 `--workers N`。
- raw：生成 `playground/raw/pstack`，跑 `raw/base` 的 skills 和 playbooks，collect，`review --apply`。raw 的 gate 是 sidecar 加 `dsh.md` 逐行确认。
- 适配开发：维护 `playground/raw/dsh.md`/`dsh.zh.md` 和 `port/dsh.md`/`dsh.zh.md`，改 `src/` 与 `cordis.patch.yml`，生成两棵树并 build。
- adapted/base：跑 skills 和 playbooks，与 raw/base 对比，生成 `reports/approval-adapted-base.md`。不通过回适配开发。
- official-plugins：每个插件跑 base 与插件环境，生成 `reports/approval-official-plugins.md`。插件限制写 `dsh.md` 和根 README。
- README/兼容表更新后，agent 停在 release-ready；`vp run release` 由用户手动执行。

## dsh.md

- `playground/raw/dsh.md` 是 raw 基准答案，`port/dsh.md` 是最终随包答案，两者不能合并。
- 生成 `dsh.md` 时先复制上游 `claude-code.md` 的结构并清空答案，再由 agent 和用户逐条提案、审批、写入；已有答案作为默认提案但仍逐条确认。
- `dsh.zh.md` 是逐行中文翻译，只供审阅，生成器不读。
- `playground/raw/dsh-evidence.md` 保存判定依据。
- `scripts/generate-pstack.mjs --target port|raw` 是唯一生成器；`--target port` 写根 `pstack/`，`--target raw` 写 `playground/raw/pstack/`。
