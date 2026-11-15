角色配置文件的路径从 `$DSH_HOME/pstack-models.mdc` 改为 `$DSH_HOME/pstack-models.json`。

旧的行格式只服务于本插件自己读写的配置，DSH 也不把它当作规则加载。新文件是带 `version` 的 JSON，读取和保存都按整份文档原子完成。

首次读取时如果只有旧的 `.mdc`，插件会自动迁移成 JSON 并删除旧文件，直接启动即可，无需手工转换。两份文件同时存在时以 JSON 为准，旧文件保留不删。
