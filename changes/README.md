# changes 注记

`changes/` 存放发布前手写的用户可见变更注记。发布说明由 `scripts/release-notes.ts` 聚合本目录内容，放在“用户可见变化”一节最前。

## 格式

- 每条注记一个文件，命名 `<date>-<slug>.md`，例如 `2026-11-15-subagent-route-override.md`。
- `date` 用 `YYYY-MM-DD`，`slug` 用简短英文小写连字符。
- 正文写 1 到 3 条用户可见变化。每条先说是**什么**变了，再说**为什么**变，读者是插件使用者而不是维护者。
- 不写内部文件清单、重构细节或提交信息。内部结构变化由发布脚本从产物差异自动生成。
- 面向读者描述行为，并写清迁移提示：旧行为到新行为，需要时给出该怎么做。

## 生命周期

- 发布时 `scripts/release-notes.ts` 只聚合上一个 tag 之后新增的 `.md`（排除 `README.md`），历史注记不会被重复使用。
- 发布后可运行 `vp run changes:clean -- --base <上一个 tag>` 删除这些已发布注记，再提交删除；脚本不自动删除或提交。
- 缺注记不阻塞发布。`scripts/changes.ts --check` 与 `scripts/release-notes.ts` 会在用户可见文件有改动却没有注记时给出软提醒。
