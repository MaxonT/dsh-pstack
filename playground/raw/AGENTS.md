# playground/raw 生成规则

本目录只保存 raw 基准的生成规则。`dsh.md` 是 agent 依据 DSH 实际能力逐条填写、由用户确认的答案文件；`dsh.zh.md` 是它的中文审阅译文。生成器只复制这两个文件，不改写内容。

## 生成器

`scripts/generate-pstack.mjs --target raw` 只做以下事情：

1. 从 `upstream/cursor-plugins/pstack` 复制技能、agents、guide、README、plugin.json 和 LICENSE。
2. 把 `playground/raw/dsh.md` 写入生成树，并在技能 H1 后写入 DSH 适配注入行。
3. 生成 `playground/raw/pstack/`，保留 `upstream/`、`scripts/`、`manifest.json` 作为生成输入和审计副本。

生成器不得改写上游技能正文、README、guide、安装段或命令前缀说明。

## 文件职责

- `playground/raw/pstack/`：与上游 `harness/pstack/claude-code` 同构的生成树。
- `playground/raw/upstream/`：上游 pstack 输入副本。
- `playground/raw/scripts/`：上游生成器副本。
- `playground/raw/manifest.json`：生成目标和来源摘要。
- `playground/raw/dsh.md`、`dsh.zh.md`：手写答案和翻译，生成器只复制。
- `playground/raw/dsh-evidence.md`：只记录 `dsh.md` 每个替换项对应的 DSH 事实证据。

`playground/raw/pstack`、`upstream`、`scripts` 和 `manifest.json` 是生成区，不提交。空目录不保留。
