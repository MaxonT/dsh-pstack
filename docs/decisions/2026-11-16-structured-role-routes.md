# 决策：角色文件路由改为结构化对象

Status: proposed
Date: 2026-11-16
Scope: src/roles/**, src/models/**, src/compat/legacy-role-file.ts, port/dsh.md, port/dsh.zh.md, docs/architecture.md, tests/**
Implemented-by: -
Review: 2026-11-16

## 背景

角色文件 `$DSH_HOME/pstack-models.json` 里每个角色保存 `provider/model [effort]` 字符串数组。代码在读取时按第一个 `/` 拆分 provider 和 model。原先假设 provider 不含 `/`、只有 model 可能含 `/`，这个假设不成立，provider 也可能含 `/`，于是拆分会产生歧义，`budget` 里的 `splitRoute` 也有同样问题。

## 决策

角色文件的每条路由改为结构化对象：`{ "kind": "route", "provider", "model", "effort"? }`，继承用 `{ "kind": "inherit", "alias": "auto" | "inherit-parent" }`。`role-store` 读写对象，`role-wire`、`role-editor`、客户端共用同一个 `Route`/`RouteView` 形状。`pstack_models` 的 catalogue 去掉 `route: "provider/model"` 字符串，改带 `provider` 字段，`budget` 直接用 `provider` 和 `id`，删除 `splitRoute`。旧的字符串 JSON 路由仍可读，在下次保存时写成结构化对象；旧的 `.mdc` 行格式仍由 `compat/legacy-role-file.ts` 一次性迁移。

## 替代方案

**保留字符串，仅修补拆分。** 被否决。provider 和 model 都可能含 `/`，单个字符串无法无歧义地编码两者，任何拆分规则都是猜测。

**用另一种分隔符编码。** 被否决。仍是把结构化数据压成字符串，分隔符逃逸和校验复杂度都会回来。

## 后果

- 角色文件不再需要 join、split 字符串，provider 含 `/` 也能正确表达。
- `pstack_models`、`pstack_roles`、`pstack_subagent`、角色编辑器在结构化数据上对齐，模型直接拿 `provider`、`model`、`effort`。
- 旧 JSON 字符串路由兼容读取，保存时升级；破坏性 schema 变更随下个主版本发布。
