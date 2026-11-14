# scripts 目录说明

本文件只描述仓库根 `scripts/` 下的脚本。脚本参数以脚本自身源码或 `--help` 为准。

## 脚本

| 入口 | 用途 | 解释器 / 外部依赖 | 限制 |
|:--|:--|:--|:--|
| `generate-pstack.mjs` | 从上游 pstack 和对应 dsh.md 生成 `pstack/` 或 `playground/raw/pstack/` | Node；`upstream/cursor-plugins/pstack` | 只负责生成和 `--check` 漂移检查，不做 dsh 格式校验 |
| `release-compatibility.ts` | 按 `port/baseline.json` 同步根 README 兼容表 | Node；文件系统 | 发布前运行，`--check` 只读 |

## 规则

- 脚本不负责 dsh 文档格式校验；该职责由 [../docs/dsh-adapter.md](../docs/dsh-adapter.md) 的编辑规则承担。
- 生成器的 `--check` 只检查生成树漂移，不替代人工文档审查。
- 随上游或插件树提供、不是仓库根脚本的脚本，不登记在本文件。
- 需要真实会话、浏览器或模型的脚本属于 `playground/scripts/`，不放这里。
