# playground/raw 生成规则

本目录只保存 raw 基准的生成物规则。`dsh.md` 是 agent 按 DSH 运行时逐条填写、并由用户逐条确认的答案文件，不是生成器的输出。`dsh.zh.md` 是它的逐行中文翻译，只供审阅，生成器不读。

## 生成器

`scripts/generate-pstack.mjs --target raw` 只做三件事：

1. 从 `upstream/cursor-plugins/pstack` 复制技能、agents、guide、README、plugin.json 和 LICENSE。
2. 把 `playground/raw/dsh.md` 作为 `docs/harness/dsh.md` 写入生成树，并把每个技能 H1 后的 Claude Code 注入行替换为 DSH 版本。
3. 写出 `playground/raw/pstack/`，并保留 `upstream/`、`scripts/`、`manifest.json` 作为生成输入和审计副本。

生成器不得改写上游技能正文、README、guide、安装段或命令前缀说明。上游文案即使对 DSH 不准确，也保持原样。

## 生成物

- `playground/raw/pstack/`：与上游 `harness/pstack/claude-code` 同构的生成树。唯一差异是 adapter 文件名和技能注入行。
- `playground/raw/upstream/`：上游 pstack 输入副本，排除 `automations/`、`.git/`、`node_modules/`。
- `playground/raw/scripts/`：上游生成器副本。
- `playground/raw/manifest.json`：生成目标、来源和树摘要。
- `playground/raw/dsh.md`、`dsh.zh.md`：手写答案文件，生成器只复制，不修改。
- `playground/raw/dsh-evidence.md`：判定依据，记录 DSH checkout 版本、工具 schema、bundle 清单和路径常量。

空目录不保留。`playground/raw/pstack`、`upstream`、`scripts` 和 `manifest.json` 是生成区，不提交。
