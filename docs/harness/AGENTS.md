# DSH 适配文档编写规则

适用于 `playground/raw/dsh.md` 与 `port/dsh.md`。

## 结构

- 两个文件都以上游 `upstream/cursor-plugins/pstack/docs/harness/claude-code.md` 的 section 和 Cursor 术语为骨架；每个 Cursor 术语必须有对应行。
- section 顺序、Cursor 单元格和核心行数必须与上游一致。`port/dsh.md` 可以在核心 section 之后追加插件特有的 section，也可以在核心 section 内追加目标 runtime 独有的 Cursor 术语行。
- `dsh.md` 和对应 `dsh.zh.md` 必须逐行同构：section 数、表格行数、Cursor 单元格和代码标识符保持一致。

## 单元格

- `dsh.md` 是运行时适配卡，不是 schema 手册。
- 每个 DSH 单元格先写替代名，再写缺字段时的动作和工具不存在时的回退。
- 只写会改变技能执行方式的差异。完整字段、状态枚举、schema 拒绝行为、包路径和证据放在对应证据文件中。
- 一个单元格只回答一个工具或字段。默认控制在三句以内；超出时先确认该细节是否真的影响执行。
- 上游 `claude-code.md` 只作为结构和克制程度的参考，不照搬具体答案。

## 证据

- raw 的逐行证据放在 `playground/raw/dsh-evidence.md`；每一条 `dsh.md` 表格行必须有一行证据，列出 Cursor 侧语义、DSH 判定、差异与写法、证据来源。
- DSH 不支持的能力必须写替代写法或跳过规则，具体差异写进对应证据行。
- 不能用一段话合并多个工具。

## 生成与检查

- `scripts/generate-pstack.mjs --target port|raw` 负责把对应源文件复制进生成树；目标源路径由 `ADAPTER_SOURCE` 选择。
- 生成器运行前调用 shared adapter checker，结构或行数不一致时失败。
- 修改任一 `dsh.md` 后同步对应的 `dsh.zh.md`，并运行 `vp run generate:dsh-check`。
