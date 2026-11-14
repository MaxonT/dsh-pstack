# 证据分析规则

本文件定义每轮 `run-batch` + `collect` 之后的独立分析会话。采集只产生证据；本规则负责把证据变成可执行的问答文件。

## 输入

- `reviews/<phase>-<environment>/manifest.json`：本轮覆盖的场景、最后批次，以及每个场景记录中的环境元数据（含上游 revision 和 port 版本）。
- `reviews/<phase>-<environment>/scenarios/**`：每个场景的 `record.json`、`screenshot.png`；`session.jsonl.zstd` 只保留本地，不提交。
- `scenarios/**/*.ts`：场景 prompt、assertions、rubric；只作为判据，不把 rubric 当答案抄进结论。
- `playground/raw/dsh.md`：只在 raw 分析时逐条对照。
- `port/dsh.md`：只在 adapted 分析时逐条对照。
- 必要时读 `playground/raw/dsh-evidence.md` 和上游技能原文。
- `playground/scenarios/capability-inventory.json`：agent 从上游和 raw/dsh 手工维护的派生能力清单；不要从 DSH 运行时反推 raw 能力需求。

## 阶段隔离

- raw 分析只能读 `reviews/raw-*/`、`playground/raw/dsh.md`、`playground/raw/dsh-evidence.md`、场景文件和相关原始 session。
- raw 分析不得读取 `port/dsh.md`、当前适配实现、当前插件树或 adapted 证据，也不得引用这些内容作为 raw 结论。
- adapted 分析只读 adapted 快照、`port/dsh.md` 和当前适配实现；不得用 raw 的缺失直接替代 adapted 的验证。
- 违反阶段隔离得出的结论视为无效，必须丢弃并重新分析。

## 按能力类别分析

分析不能只写一段总体结论；每个 finding 必须落到对应能力类别，并按类别的观察维度判断。

| 能力类别 | 必看证据 | 判定重点 |
| --- | --- | --- |
| tool | `SessionAnalysis.tools` 的 `firstAttemptStatus`、`attempts`、`failures`、`recovered`、`finalStatus`；实际 tool call 和错误文本 | 一次通过、失败后重试通过、仍然失败要分开写；不要把重试成功写成一次通过 |
| delegation | 子代理是否真正启动、角色和路由、完成通知、父会话是否转述结果 | 是否实际委派，还是主会话自己完成 |
| routing | 实际 `target` 路由、可用模型、effort、继承或回退 | 实际路由是否与声明和可用路由一致，不能凭回复文字猜 |
| environment | 环境配置、插件前提、跳过/blocked 行为 | 区分能力不支持、环境未启用和降级替代 |
| output-render | 完整页面截图、实际图像、渲染后的图表、可播放媒体 | 源码、路径或文件卡片不能当作实际呈现 |
| skill-dependency | 被依赖技能的加载/不可用状态、本地替代、vendored skill、fallback | 依赖缺失时整个任务是否仍按降级完成 |

`tool` 的 `recovered` 为 true 表示失败后最终成功；`firstAttemptStatus === "ok"` 且 `failures === 0` 才是一次通过。

## 非文本输出审查

- 先检查 inventory 是否为上游要求的渲染、截图、图表、Mermaid、UI、视频或音频输出建立了 `render-*` capability 和 probe；缺失本身就是覆盖缺口，不能因为当前快照没有产物就判通过。
- 先识别用户要求的是文本还是非文本产物。
- 非文本产物必须看完整页面截图和实际 UI 呈现，不能只看 assistant 文本、源码块、文件路径、文件卡片或 artifact 断言。
- 源码出现、文件存在或路径可访问，不等于实际渲染、播放或可读。
- 用户明确要求源码或格式时，源码可以作为该格式的结果，但仍需确认内容完整并实际出现在回复或产物中。
- 渲染、播放或查看能力缺失时，记录为环境限制或待用户判断，不得判通过。
- 没有实际呈现证据的非文本产物，按 gap 或待用户判断处理。

## 输出

只写 `reviews/<phase>-<environment>/index.md`。分析完成后按 [evidence-redaction.md](./evidence-redaction.md) 生成 `record.safe.json` 并通过 `playground:redact --apply`。

`index.md` 固定包含：

1. 本轮范围：mode（full / incremental）、覆盖场景、未覆盖但沿用当前快照的场景，以及各场景的环境 revision/port 版本。
2. 问题问答：按「根因 + 建议动作」去重，一个根因只写一条。
3. `dsh.md` 适配说明审查：逐章节/逐行判断 `够用 / 缺失 / 误导 / 不适用`。
4. 待用户判断的问题：所有分类不确定的问题都放这里。
5. 后续动作：只列明确落到 `dsh-md`、`plugin`、`upstream`、`ignore-environment` 的结论。

## 问题条目格式

```markdown
### Q1 标题

- 类型：dsh-md | plugin | upstream | ignore-environment | 待你判断
- 能力类别：tool | delegation | routing | environment | output-render | skill-dependency
- 通过方式（仅 tool）：first-pass | recovered-after-failure | failed
- 影响场景：`a`、`b`
- 证据：
  - [record](scenarios/a/raw-base/record.json)
  - [截图](scenarios/a/raw-base/screenshot.png)
  - session 只在本地 worker，按 `record.session.sessionId` 读取，不在快照中链接
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

1. 先判问题是否真实：看 record 的 assistant 文本和工具调用、完整页面截图；需要完整事件时再按 sessionId 读取本地 worker session。
2. 再判根因：场景 prompt 是否触发技能；技能是否加载；适配说明是否覆盖；环境是否限制；上游技能自身是否缺陷。
3. raw 分析只判断 `playground/raw/dsh.md` 是否缺失或误导；adapted 分析只判断 `port/dsh.md` 是否缺失或误导。
4. 当前阶段的 `dsh-md` 结论只改当前阶段对应的 dsh.md；raw 阶段不改 `port/dsh.md`。
5. 当前阶段的 `plugin` 结论才进入插件、工具或预设开发。
6. 上游技能自身问题进入 `upstream`，不在本仓修。
7. 环境权限、凭据、网络或无头限制进入 `ignore-environment`。
8. 证据不足或分类会影响方案时，一律标 `待你判断`，不得默认忽略。

批次模式和快照范围的完整规则见 [workflow.md](./workflow.md)。分析会话只需处理当前快照；删除场景时，同步删除只指向该场景的问答条目。

## 链接与提交

- `index.md` 使用相对链接直接指向同一快照里的证据文件。
- `record.json` 和截图提交；`session.jsonl.zstd` 只保留本地，不提交，避免泄露宿主路径或凭证。
- `.staging` 不提交。
