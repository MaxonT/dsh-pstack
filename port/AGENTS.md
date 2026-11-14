# port 目录说明

本文件只描述 `port/` 的职责、文件边界和文档指针。具体规则放在对应文档中，不在这里重复。

## 目录职责

`port/` 保存最终适配文档和发布边界：

- `dsh.md`：最终适配文案的唯一手写来源。
- `dsh.zh.md`：`dsh.md` 的逐行中文审阅译文。
- `baseline.json`：发布兼容键、DSH 范围、上游 pstack commit。
- `docs/`：port 自身的详细规则和记录。

`port/` 不保存插件实现、测试、生成树或 playground 的验证资料。实现位于 `src/`，验证位于 `playground/`。

## 文档指针

| 文档 | 职责 |
| --- | --- |
| [docs/baseline.md](./docs/baseline.md) | baseline.json 字段、兼容键和发布同步规则 |
| [docs/extensions.md](./docs/extensions.md) | 非 playground gap 直接产生的本地扩展 |
| [docs/regressions.md](./docs/regressions.md) | 反复出现的移植问题和验证方式 |
| [../docs/dsh-adapter.md](../docs/dsh-adapter.md) | dsh.md 模板、分块规则和 raw/port 差异 |
| [../src/AGENTS.md](../src/AGENTS.md) | src 长期实现规范和边界原则 |

`dsh.md` 的编写规则只链接 `docs/dsh-adapter.md`，不在 port 内复制。可选插件清单以根 `README.md` 为准，不在 port 重复维护。

## 生成与发布

1. 按 `docs/dsh-adapter.md` 维护 `dsh.md` 和 `dsh.zh.md`。
2. 生成后运行 `vp run generate:check` 检查生成树。
3. 用 `vpx scripts/generate-pstack.mjs --target port` 生成根 `pstack/`；加 `--check` 检查漂移。
4. 破坏性适配同时更新 `package.json` 的 DSH 范围、`baseline.json` 的兼容键和各本地化 README 的兼容表。

## 边界

- 根 `pstack/` 只放生成的插件树，不能手工放入文件。
- 上游 `claude-code.md` 明确排除的 Cursor 云服务和平台能力同样舍弃。
- 通用本地能力可以独立适配，但不宣称等价于云服务。
- 非常用能力不默认提供插件补偿；环境不满足时明确报告不可用，不把跳过算作适配成功。
- `port/` 只写最终交付和发布规则；实现细节见 `src/AGENTS.md`，验证流程见 `playground/AGENTS.md`。
- 适配实现变化如果需要新增、删除或改变工具、服务、skill 目录或 preset，还要同步根 `cordis.patch.yml`；装配规则见根 [AGENTS.md](../AGENTS.md#bundle-assembly)。
