# Playground 验证闭环

本文件给出 `playground/AGENTS.md` 的完整阶段、命令和审批门。所有命令在仓库根执行，Linux 是唯一官方支持平台。所有 `prepare` 命令都省略 `--workers`；默认由 `capacity.ts` 按当前机器的核数、空闲内存和上限计算最大值，只有明确需要限制并发时才写 `--workers N`。

`prepare → bootstrap → run-batch → collect` 必须作为同一个长期存活的 background job 串行执行，不能拆成独立 bash 调用；shell 要活到 collect 结束。不要用 `&`、`nohup` 或 `tee`。如果 `vp run` wrapper 被 SIGTERM，改用 `vpx playground/scripts/*.ts` 直接调用。

## 进度

`run-batch` 在 `playground/.workers/<phase>/<environment>/progress.json` 写入当前轮次、已完成数、运行中的场景和失败列表，并在终端打印该路径。查看：

```sh
vp run playground:status -- --phase raw --environment base
```

`prepare --reset` 会清空该 phase 的 worker 目录，因此旧进度不会保留；重新 prepare 后从新一轮开始。

## 1. raw 基线

```sh
vp run playground:raw-generate
vp run playground:prepare -- --phase raw --environment base --reset
vp run playground:bootstrap -- --phase raw --environment base --all
vp run playground:run-batch -- --phase raw --environment base --all
vp run playground:collect -- --phase raw --environment base
vp run playground:review
vp run playground:review -- --apply
```

产物：`reports/summary/raw-base.md`、`reports/skills/*/raw-base/`、`reports/playbooks/*/raw-base/`、`reviews/`。

Gate：raw 场景 sidecar 通过；`playground/raw/dsh.md` 与 `dsh.zh.md` 逐行确认。

## 2. 适配开发

维护：

- `playground/raw/dsh.md`、`dsh.zh.md`：raw 基准答案。
- `port/dsh.md`、`dsh.zh.md`：最终随包答案。
- `src/`、`cordis.patch.yml`：插件实现与装配。
- `playground/raw/dsh-evidence.md`：判定依据。

生成并构建：

```sh
vp run playground:raw-generate
vp run generate
vp run generate:check
vp run build
```

Gate：`dsh.md` 逐行审批；`generate:check` 通过。

## 3. adapted/base

```sh
vp run playground:prepare -- --phase adapted --environment base --reset
vp run playground:run-batch -- --phase adapted --environment base --all
vp run playground:collect -- --phase adapted --environment base
vp run playground:review
vp run playground:review -- --apply
```

产物：`reports/summary/adapted-base.md`、`reports/skills/*/comparison.md`、`reports/playbooks/*/comparison.md`、`reports/approval-adapted-base.md`。

Gate：`approval-adapted-base.md` 通过。不通过回第 2 阶段。

## 4. official-plugins

对 `forge`、`session-search`、`browser-use`、`terminal`、`agent-team` 逐个运行：

```sh
vp run playground:prepare -- --phase adapted --environment <plugin> --reset
vp run playground:run-batch -- --phase adapted --environment <plugin> --scenarios <ids>
vp run playground:collect -- --phase adapted --environment <plugin>
```

同一个场景必须同时有 `raw/base`、`adapted/base` 和 `adapted/<plugin>` 记录。产物：`reports/official-plugins/<plugin>/comparison.md`、`reports/summary/adapted-<plugin>.md`、`reports/approval-official-plugins.md`。

Gate：审批通过。插件限制写进 `dsh.md` 与根 README，不另设冲突类型。

## 5. README 与发版

更新根 `README.md`、`README.zh.md`、`port/AGENTS.md`、`docs/architecture.md`，然后：

```sh
vp run compatibility:check
vp run ci
```

agent 停在 release-ready。`vp run release` 由用户手动执行，bumpp 负责更新版本并提交推送。

## 上游 DSH 或 pstack 更新

1. 更新 upstream pin 与 `playground/baseline.json` 的兼容键。
2. 从第 1 阶段重跑 raw。
3. 重新逐行确认 `playground/raw/dsh.md` 和 `port/dsh.md`，同步中文版。
4. 重新生成两棵树并 build。
5. 重跑 adapted/base 与 official-plugins，更新报告和审批。
6. 更新 README/兼容表，准备 release-ready。
