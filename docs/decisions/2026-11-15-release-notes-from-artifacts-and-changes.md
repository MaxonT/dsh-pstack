# 决策：发布说明由产物差异与 changes 注记生成

Status: proposed
Date: 2026-11-15
Scope: .github/workflows/release.yml, scripts/**, changes/**, package.json, port/surface.json, docs/decisions/**
Implemented-by: -
Review: 2026-11-15

## 背景

当前 release 由工作流里的 `changelogithub` 按提交历史自动生成正文。大量提交只是架构调整、重构或内部搬迁，提交文案无法体现跨版本真实变化，例如 `port/dsh.md` 的适配行为改动和 `pstack_subagent` 的接口变化。读者看到的是提交列表，不是“这个版本对我有什么影响”。同时，缺少一种机制提醒作者为用户可见变更写一句说明。

## 决策

采用 B+C 混合自动方案。

- B 产物差异：`scripts/release-notes.ts` 对比上一个 git tag 与工作区，自动生成“适配行为变化”“工具接口变化”“兼容基线变化”三节。适配行为来自 `port/dsh.md` 的表格行级 diff，按 `##` 分节、每行第一列的 Cursor 项为 key，输出新增、删除和改动条目。工具接口来自 `port/surface.json` 的参数增删改，缺失时说明首次引入；该文件由 `scripts/release-surface.ts` 用工具工厂导出稳定的公开工具清单。兼容基线来自 `port/baseline.json` 的 compatibilityKey、DSH 范围和 pstackCommit。
- C changes 注记：用户可见变更在 `changes/` 下写一条 `<date>-<slug>.md`，发布时由脚本聚合到“用户可见变化”一节，写清是什么、为什么和迁移提示。格式见 `changes/README.md`。发布说明只取上一个 tag 之后新增的注记，历史注记不重复使用；发布后可运行 `changes:clean --base <prev-tag>` 删除已发布注记并自行提交，脚本不自动删除或提交。
- 发布工作流删除 `changelogithub` 步骤，在 npm publish 之后计算上一个 tag 并运行 `scripts/release-notes.ts`，用 `gh release create` 或 `gh release edit` 创建或更新 GitHub Release。
- 缺注记采用软提醒：`scripts/changes.ts --check` 与 `scripts/release-notes.ts` 会在用户可见文件有改动却没有 `changes/` 注记时打印提示，但不阻塞发布，`changes:check` 也不加入 `ci`。

## 替代方案

**继续只用 `changelogithub`。** 被否决。提交历史反映的是实现过程，无法稳定地提炼跨版本的用户可见变化，也无法区分架构调整与真实行为变化。

**只做产物差异（纯 B）。** 被否决。产物差异能反映适配文档和工具接口，但无法表达“为什么改”和迁移提示，而这类信息只有作者能写。

**只做 changes 注记（纯 C）。** 被否决。依靠人工写全所有变化容易漏掉工具接口和兼容基线的自动可检测差异；产物差异是零成本的确定性检查。

**把缺注记设为阻塞发布。** 被否决。历史提交普遍没有注记，硬性阻塞会制造大量噪音并卡住发布；软提醒保留信号又不引入阻塞。

## 后果

- 发布说明的正文来自脚本，不再来自提交历史；`changelogithub` 依赖被移除。
- `port/surface.json` 成为受版本管理的产物，工具 schema 改动会在发布说明里显式出现，`surface:check` 加入 `ci` 防止漂移。
- `changes/` 注记发布后由维护者用 `changes:clean --base <prev-tag>` 删除并提交，脚本不自动删除；发布说明只聚合上一个 tag 之后新增的注记，历史注记不会重复出现。
- 缺注记只是提示；`changes:check` 是 PR 与发布辅助命令，不进 `ci`，避免历史提交噪音。
