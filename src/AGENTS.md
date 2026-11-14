# src 目录说明

本文件只描述 `src/` 的实现边界、模块职责和开发约定。项目级架构背景见 [../docs/architecture.md](../docs/architecture.md)。

## 职责

`src/` 是本插件的 Host 和 Client 源码目录，不存放生成树、上游技能、port 文档或 playground 证据。

- Host 入口：`index.ts`、`models.ts`、`skill.ts`、`subagent.ts`、`role-*.ts`、`preset*.ts`、`readonly.ts`、`paths.ts`
- Client 入口与组件：`client/index.ts`、`client/*.tsx`、`client/*.ts`
- 共享协议和类型：`route.ts`、`role-wire.ts`、`catalogue.ts`、`wire-error.ts`

具体模块和依赖图以 `docs/architecture.md` 为准，不在本文件重复。

## 修改规则

- 只在 `src/` 内实现 Host/Client 逻辑，不把业务逻辑塞进 `cordis.patch.yml`、生成器或 `port/`。
- 修改模块前先读 `docs/architecture.md`；涉及 dsh 文案时读 [../docs/dsh-adapter.md](../docs/dsh-adapter.md)。
- 生成树和 `port/dsh.md` 不是实现代码；不要手工改生成物。
- 角色文件和路由格式由 `src/role-manifest.ts`、`src/role-config.ts`、`src/role-file.ts`、`src/route.ts` 共同定义；其他模块不要自行硬编码文件名或路由语法。
- Host 与 Client 的跨边界数据必须经过 `role-wire.ts` 和 Remote 描述符；Client 不直接访问文件系统或 Host 服务。
- 新功能先确认是否来自 playground 缺口；普通扩展登记到 [../port/docs/extensions.md](../port/docs/extensions.md)。
- 重复出现的移植陷阱登记到 [../port/docs/regressions.md](../port/docs/regressions.md)，普通缺陷由测试和提交记录承载。

## 验证

```sh
vp check --fix
vp test
vp run typecheck
vp run playground:typecheck
vp run generate:check
```

需要真实 Cordis、profile、浏览器或模型的验证放到 `playground/`，不要在 `src/` 测试里伪造运行时。
