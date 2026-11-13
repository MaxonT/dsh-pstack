# Playground 运转规则

本文件是 playground 的入口规则，只保留环境、目录职责、流程摘要和硬约束。完整阶段、命令和交接见 [docs/verification-loop.md](./docs/verification-loop.md)。

## 环境

- 真实 DSH Web 会话，Linux 是唯一官方支持平台；其他平台先运行 `playground:doctor`。
- 每个 worker 使用独立 home、浏览器 profile、证据目录和隔离工作区；worker 不携带 Git/GitHub 凭证。
- 真实模型选择由用户确认；RunRecord 记录实际路由、DSH 版本、上游 revision 和配置 hash。
- `raw/base` 观察原生 DSH；`raw/<capability-environment>` 是对照用的可选环境；`adapted` 阶段验证适配实现。

## 目录

- `scenarios/`：能力 probe 目录；能力提取、场景编写、inventory 和排除规则的唯一来源是 [scenarios/AGENTS.md](./scenarios/AGENTS.md)。
- `scripts/`：prepare、bootstrap、run-batch、run-case、collect、redact 等 CLI 入口。
- `docs/`：

| 文档 | 用途 |
| --- | --- |
| [verification-loop.md](./docs/verification-loop.md) | 阶段、命令、批次和交接条件 |
| [workspace-session.md](./docs/workspace-session.md) | worker 隔离、会话执行、停止和证据目录 |
| [evidence-analysis.md](./docs/evidence-analysis.md) | 每轮证据分析和 `index.md` 格式 |
| [evidence-redaction.md](./docs/evidence-redaction.md) | 证据脱敏和提交门 |
| [baseline.md](./docs/baseline.md) | 发布兼容键字段和更新规则 |

- `reviews/<phase>-<environment>/`：当前完整快照；`manifest.json` 是机器清单，`index.md` 是分析问答，场景证据在 `scenarios/<scenario>/<phase>-<environment>/`。`session.jsonl.zstd` 和 `record.safe.json` 不提交。
- `raw/`：`dsh.md`、`dsh.zh.md` 和 `dsh-evidence.md` 是 raw 基准与证据；`raw/pstack` 是生成物，不作为能力来源。
- `baseline.json`：发布兼容键元数据，不是能力或场景基线；字段和更新规则见 [docs/baseline.md](./docs/baseline.md)。

## 流程

1. 生成 raw 树，准备 `raw` 环境和 worker。
2. 运行 raw 能力 probe，collect，生成 raw 分析。
3. 根据 raw 分析更新 `dsh.md`、适配代码和生成树，build 后运行 adapted。
4. 运行 adapted 能力 probe，collect 并分析。
5. 通过后更新 README/兼容表并停在 release-ready；特殊环境只在用户明确指定时运行。

批次命令、阶段交接和失败处理以 [verification-loop.md](./docs/verification-loop.md) 为准，不在此重复。

## 硬约束

- 阶段隔离按 [scenarios/AGENTS.md](./scenarios/AGENTS.md) 和 [evidence-analysis.md](./docs/evidence-analysis.md) 执行。
- `prepare → bootstrap → run-batch → collect` 必须在同一个长期存活的 background job 中串行执行，shell 保持到 collect 结束。
- dsh.md 的分离、修改和描述边界见 [verification-loop.md](./docs/verification-loop.md#dshmd)。
- `scripts/generate-pstack.mjs --target port|raw` 是唯一生成器。
