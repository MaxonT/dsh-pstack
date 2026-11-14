# DSH 适配文档编写规则

适用于 `playground/raw/dsh.md`、`playground/raw/dsh.zh.md`、`port/dsh.md` 和 `port/dsh.zh.md`。本文件定义模板、块职责和写法约束。

## 模板

```markdown
# pstack in DSH

pstack skills use Cursor names. In DSH, read this file once per session, then map each Cursor name from the skill with the tables below. `<pstack>` means the folder that holds `skills/` and `docs/`.

Use only tools visible in the current session. If a mapped tool or optional capability is unavailable, follow the fallback in that row. Do not assume optional plugins are enabled because a name appears here.

## Tools

## Subagent fields

## Models

## setup-pstack

## Paths

## Cursor-only features
```

`port/dsh.md` 在核心块之后追加：

```markdown
## Plugin tools

## Local replacements
```

`raw/dsh.md` 不写 `Plugin tools`、`Local replacements` 或 `Optional plugins`。`port/dsh.md` 也不写 `Optional plugins`；具体可选项和安装方式放在根 `README.md`。

## 模板块规则

### 开头说明

- 说明本文件是运行时适配卡，不是 schema 手册或插件目录。
- 只写一句通用可用性规则：使用当前 session 实际可见的工具；缺失时按对应行 fallback；不假设可选插件已启用。
- 不写具体插件包名、开关名称、安装步骤或“当前一定有什么工具”。
- 不列官方插件能力清单。

### Tools

- 每个 Cursor 工具或操作一个单元格。
- 先写 DSH 替代名称，再写缺字段、工具不存在或不可用时的动作。
- 不展开完整 schema、参数清单、状态枚举或实现细节；这些放在证据或插件工具说明中。
- 默认三句以内；工具名变化不应要求改写本块之外的规则。

### Subagent fields

- 一个 Cursor 字段一个单元格。
- 写清：字段不存在时是否省略、由 prompt 承载还是由 agent 文件承载。
- 写清运行条件缺失时的默认值或 fallback。
- 不重复 Tools 块已经写过的完整工具说明。

### Models

- 写清 provider、model、reasoning effort 的映射。
- 模型发现能力不可用时，写默认或继承规则。
- 不写具体模型清单；模型列表应由当前运行时提供。

### setup-pstack

- 说明 DSH 的配置文件位置、持久化和覆盖规则。
- 说明检测失败或模型不可用时的 fallback。
- 不复制上游完整步骤，只写与 DSH 不同的部分。

### Paths

- 一个路径差异一个单元格。
- 说明 DSH 路径、读取限制和生成物边界。
- 不写安装路径或包布局细节。

### Cursor-only features

- 每个 Cursor 专属能力一行。
- 写清实际处理：跳过、替代、阻止或报告。
- 不使用“应该”“可以尝试”等不确定语气；明确默认动作。

### Plugin tools（仅 port）

- 只写本插件实际提供的工具名称、用途和边界。
- 一个工具一行；不写完整参数 schema。
- 没有该工具时不写占位行，也不假设插件未安装。

### Local replacements（仅 port）

- 只写 Cursor 内置技能或外部技能在 port 中的替代方式。
- 一个依赖技能一行；写清替代技能或 fallback。
- 具体包名、安装方法和可选插件清单不写在这里。

## 证据和检查

- raw 的逐行证据放在 `playground/raw/dsh-evidence.md`；每条核心表格行必须有对应证据。
- 修改任一 `dsh.md` 后同步对应的 `dsh.zh.md`，保持 section 数、行数、Cursor 单元格和代码标识符一致。
- `scripts/generate-pstack.mjs --target port|raw` 负责生成树；修改后人工检查结构并运行 `vp run generate:check`。
- 结构只允许模板中的核心块；`port` 只追加 `Plugin tools` 和 `Local replacements`。
