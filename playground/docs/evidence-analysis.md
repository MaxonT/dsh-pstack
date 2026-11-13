# 证据分析规则

本文件定义每轮 `run-batch` + `collect` 之后的独立分析会话。采集只产生证据；本规则负责把证据变成可执行的问答文件。

## 输入

- `reviews/<phase>-<environment>/manifest.json`：本轮覆盖的场景、最后批次、上游 revision 和 port revision。
- `reviews/<phase>-<environment>/scenarios/**`：每个场景的 `record.json`、`screenshot.png`、`full.png`、`session.jsonl.zstd`。
- `scenarios/**/*.ts`：场景 prompt、assertions、rubric；只作为判据，不把 rubric 当答案抄进结论。
- `playground/raw/dsh.md`：只在 raw 分析时逐条对照。
- `port/dsh.md`：只在 adapted 分析时逐条对照。
- 必要时读 `playground/raw/dsh-evidence.md` 和上游技能原文。

## 输出

只写 `reviews/<phase>-<environment>/index.md`，不生成额外的汇总或审批文件。

`index.md` 固定包含：

1. 本轮范围：mode（full / incremental）、覆盖场景、未覆盖但沿用当前快照的场景、上游 revision、port revision。
2. 问题问答：按「根因 + 建议动作」去重，一个根因只写一条。
3. `dsh.md` 适配说明审查：逐章节/逐行判断 `够用 / 缺失 / 误导 / 不适用`。
4. 待用户判断的问题：所有分类不确定的问题都放这里。
5. 后续动作：只列明确落到 `dsh-md`、`plugin`、`upstream`、`ignore-environment` 的结论。

## 问题条目格式

```markdown
### Q1 标题

- 类型：dsh-md | plugin | upstream | ignore-environment | 待你判断
- 影响场景：`a`、`b`
- 证据：
  - [record](scenarios/skills/a/raw-base/record.json)
  - [截图](scenarios/skills/a/raw-base/full.png)
  - [session](scenarios/skills/a/raw-base/session.jsonl.zstd)
- 现象：
- 根因：
- 与当前阶段 dsh.md 的关系：raw 写 `raw/dsh.md`，adapted 写 `port/dsh.md`
- 建议动作：
- 你的决定：
```

同一根因命中多个场景时只写一条，把所有影响场景和证据列在下面；不要按 scenario 或 finding id 拆成多条。

## dsh.md 审查格式

raw 分析只审查 `playground/raw/dsh.md`，adapted 分析只审查 `port/dsh.md`。不要把两个阶段合成一张表。

```markdown
| 章节/行 | 当前说明 | 相关证据 | 结论 | 建议 |
| --- | --- | --- | --- | --- |
```

`结论` 只能是 `够用`、`缺失`、`误导`、`不适用`。

## 判定顺序

1. 先判问题是否真实：看 record、full-page 截图、session 最后 assistant 消息和工具调用。
2. 再判根因：场景 prompt 是否触发技能；技能是否加载；适配说明是否覆盖；环境是否限制；上游技能自身是否缺陷。
3. raw 分析只判断 `playground/raw/dsh.md` 是否缺失或误导；adapted 分析只判断 `port/dsh.md` 是否缺失或误导。
4. 当前阶段的 `dsh-md` 结论只改当前阶段对应的 dsh.md；raw 阶段不改 `port/dsh.md`。
5. 当前阶段的 `plugin` 结论才进入插件、工具或预设开发。
6. 上游技能自身问题进入 `upstream`，不在本仓修。
7. 环境权限、凭据、网络或无头限制进入 `ignore-environment`。
8. 证据不足或分类会影响方案时，一律标 `待你判断`，不得默认忽略。

## 批次与增量

- `full` 批次覆盖全部适用场景，`collect` 后整份当前快照更新。
- `incremental` 批次只覆盖选中场景，`collect` 只替换这些场景的证据；未覆盖场景保留当前快照。
- 删除场景时 `collect` 删除对应证据目录；分析会话同步删除只指向该场景的问答条目。
- 上游更新先由 diff 映射到受影响技能和场景，再跑对应 `incremental` 批次；不要因为只跑部分技能就把它当全量结论。

## 链接与提交

- `index.md` 使用相对链接直接指向同一快照里的证据文件。
- 当前快照下所有场景证据文件都提交，不只提交被引用到的部分。
- `.staging` 不提交。
