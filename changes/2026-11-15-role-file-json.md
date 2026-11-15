角色配置文件的路径从 `$DSH_HOME/pstack-models.mdc` 改为 `$DSH_HOME/pstack-models.json`。

上游把 `rules/` 下的 `.mdc` 全部当作规则文件；直接照搬这套格式时，DSH 不加载 `.mdc`，还要在适配说明里额外解释，格式本身也不好解析。改为 JSON 后这份配置由插件独占读写，结构和解析都更直接。

首次读取时如果只有旧的 `.mdc`，插件会自动迁移成 JSON 并删除旧文件，无需手工转换；两份文件都在时以 JSON 为准，旧文件保留。
