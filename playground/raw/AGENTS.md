# playground/raw 生成规则

本目录只保存 raw 基准的生成物规则。`dsh.md` 是 agent 按 DSH 运行时逐条填写、并由用户逐条确认的答案文件，不是生成器的输出。`dsh.zh.md` 是它的逐行中文翻译，只供审阅，生成器不读。

## 生成器

`scripts/generate-pstack.mjs --target raw` 只做三件事：

1. 从 `upstream/cursor-plugins/pstack` 复制技能、agents、guide、README、plugin.json 和 LICENSE。
2. 把 `playground/raw/dsh.md` 作为 `docs/harness/dsh.md` 写入生成树，并把每个技能 H1 后的 Claude Code 注入行替换为 DSH 版本。
3. 写出 `playground/raw/pstack/`，并保留 `upstream/`、`scripts/`、`manifest.json` 作为生成输入和审计副本。

生成器不得改写上游技能正文、README、guide、安装段或命令前缀说明。上游文案即使对 DSH 不准确，也保持原样。

`dsh-evidence.md` 是逐行判定表，不是散文。`dsh.md` 的每个表格行在对应章节有且只有一行证据，列出 Cursor 侧语义、DSH 判定、差异与写法、证据来源。DSH 不支持的能力要写替代写法或跳过规则，具体差异写进对应证据行。不能用一段话合并多个工具。

## dsh.md 写法

- `dsh.md` 是运行时适配卡，不是 schema 手册。每行先给替代名，再给缺字段时的动作和工具不存在时的回退。
- 单元格只写会改变技能执行方式的差异。完整字段列表、状态枚举、schema 拒绝行为、包路径和证据放 `dsh-evidence.md`。
- 一个单元格只回答一个工具或字段，默认控制在三句以内。超过时先确认这条细节是否真的影响执行。
- 上游 `claude-code.md` 只参考结构和克制，不照搬具体答案；DSH 的路径、模型和子代理字段按 DSH 事实写。
- `dsh.zh.md` 逐行同步，不增删内容。

## 生成物

- `playground/raw/pstack/`：与上游 `harness/pstack/claude-code` 同构的生成树。唯一差异是 adapter 文件名和技能注入行。
- `playground/raw/upstream/`：上游 pstack 输入副本，排除 `automations/`、`.git/`、`node_modules/`。
- `playground/raw/scripts/`：上游生成器副本。
- `playground/raw/manifest.json`：生成目标、来源和树摘要。
- `playground/raw/dsh.md`、`dsh.zh.md`：手写答案文件，生成器只复制，不修改。
- `playground/raw/dsh-evidence.md`：判定依据，记录 DSH checkout 版本、工具 schema、bundle 清单和路径常量。

空目录不保留。`playground/raw/pstack`、`upstream`、`scripts` 和 `manifest.json` 是生成区，不提交。
