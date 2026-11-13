# baseline.json

`playground/baseline.json` 是发布兼容键元数据，不是 playground 的测试基线。`scripts/release-compatibility.ts` 读取它来维护根 README 的兼容表。

## 字段

- `compatibilityKey`：稳定的兼容系列标识，格式必须匹配 `scripts/release-compatibility.ts` 的 `KEY` 正则。
- `dshVersion`：记录该兼容系列对应的 DSH 范围；发布脚本以 `package.json` 的 `engines.dsh` 为准。
- `pstackCommit`：记录当前审核的上游 pstack 提交，仅用于审计追溯。

## 更新规则

- 普通上游升级保持 `compatibilityKey` 不变。
- 破坏性适配同时更新 `package.json` 的 DSH 范围和 `compatibilityKey`，并在各本地化 README 注册新的兼容键、增加对应行；保留旧兼容行。
- 发布时 `bump.config.ts` 调用 `scripts/release-compatibility.ts` 的 `syncCompatibility`，按当前版本、DSH 范围、兼容键和 pstack 版本维护兼容表。
- `vp run compatibility:check` 做只读一致性检查。
- `vp run release` 由用户手动执行；agent 只停在 release-ready。
