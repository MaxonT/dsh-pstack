角色配置文件从 `$DSH_HOME/pstack-models.mdc` 改为 `$DSH_HOME/pstack-models.json`。

上游把 `rules/` 下的 `.mdc` 全当规则文件，直接照搬时 DSH 不加载 `.mdc`，还要额外解释且难解析；改成插件独占读写的 JSON 更直接。

首次读取时旧 `.mdc` 自动迁移并删除；两份都在时以 JSON 为准。
