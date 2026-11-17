# baseline.json

`port/baseline.json` 是当前移植的发布基线，只记录 pstack 版本。它不是 playground 的测试基线；DSH 兼容范围以 `package.json` 的 `engines.dsh` 为准，兼容表由 `scripts/release-compatibility.ts` 直接维护。

## 字段

- `pstackVersion`：当前移植打包的 pstack 版本。上游 `upstream/cursor-plugins` 子模块固定到该 pstack 版本的发版提交（没有发版的 main 提交不移植），因此不再单独记录 commit。

## README 兼容表规则

- 兼容表按 DSH 范围分组。每个分组是一个 `**DSH \`<range>\`**` 小标题加一张两列表，列出该范围内各 dsh-pstack 发布版本及其打包的 pstack 版本。
- 行身份是 DSH 范围，来自 `package.json` 的 `engines.dsh`；不维护手写兼容键。
- 根 README 只保留最新的三个 DSH 范围分组，更早的分组自动移入 `docs/compatibility-history.md` 与 `docs/compatibility-history.zh.md`。
- 只有 DSH 出现破坏性变更时才新增一个分组，例如 rc.1 → rc.2。非破坏性的 DSH 升级不新增分组，范围 `>=0.2.2-rc.2` 已包含后续 rc.3 等更新。
- pstack 版本变化不新增分组，只在该分组内新增一个发布行并标注 pstack；每个 x.y 只保留最新 z。
- 发布时 `bump.config.ts` 调用 `scripts/release-compatibility.ts` 的 `syncCompatibility`，按当前版本、`engines.dsh` 和 `pstackVersion` 维护兼容表。
- `vp run compatibility:check` 做只读一致性检查。

## 边界

- 本文件只属于 port 的发布边界。
- 发布版本变更、`pstackVersion` 变更和兼容表分组的增删应在同一个发布准备批次中完成。
