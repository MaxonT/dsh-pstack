import type { BehaviorScenario } from "../../types.ts";

export const makeOperationsIdempotentApply: BehaviorScenario = {
  type: "behavior",
  id: "principle-make-operations-idempotent-apply",
  skill: "principle-make-operations-idempotent",
  turns: [
    {
      prompt:
        "帮我写一个数据库迁移：给 users 表加一列 full_name，把已有的 first_name 和 last_name 拼进去，脚本写到 migrations/002_add_full_name.sql。我们的部署脚本每次上线都会从头把所有迁移文件按顺序跑一遍，中途崩了运维会直接重跑整个脚本。你打算怎么设计这个迁移，保证重跑不会出问题？",
    },
  ],
  workspace: {
    files: {
      "migrations/001_init.sql": [
        "CREATE TABLE users (",
        "  id uuid PRIMARY KEY,",
        "  first_name text,",
        "  last_name text",
        ");",
        "",
      ].join("\n"),
      "scripts/migrate.mjs": [
        "// 部署流程：每次上线都按文件名顺序、从头把 migrations/ 下每个 .sql 执行一遍。",
        "// 某次执行中途崩溃时，运维会直接重跑这个脚本。",
        'import { readdirSync, readFileSync } from "node:fs";',
        "",
        "export async function runMigrations(db) {",
        '  const files = readdirSync("migrations")',
        '    .filter((name) => name.endsWith(".sql"))',
        "    .sort();",
        "  for (const name of files) {",
        '    const sql = readFileSync(`migrations/${name}`, "utf8");',
        "    await db.exec(sql);",
        "  }",
        "}",
        "",
      ].join("\n"),
      "README.md": [
        "# users-db",
        "",
        "数据库迁移由 scripts/migrate.mjs 在每次部署时执行。",
        "migrations/ 下的文件按文件名顺序执行，脚本不做去重，也不记录哪些已执行。",
        "",
      ].join("\n"),
    },
  },
  assertions: [
    { kind: "turn-completed" },
    { kind: "no-tool-error" },
    { kind: "artifact-contains", path: "migrations/002_add_full_name.sql", text: "full_name" },
  ],
  rubric: {
    prompt:
      "回复应把迁移设计成可重复执行：先看当前状态（列是否已存在、哪些行还没回填），只补缺的那部分，因此重复运行或在任意点崩溃后重跑都收敛到同一结果。合理做法例如先用 `ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name text;`，再用 `UPDATE users SET full_name = first_name || ' ' || last_name WHERE full_name IS NULL;` 只回填未回填的行，这样在“加完列、还没回填”时崩溃、重跑也安全。还应说明如何识别上次留下的半成品，例如靠 full_name 为空判断哪些行尚未回填。gap：写一次性 ALTER/UPDATE、假设脚本只跑一次；用无条件的 UPDATE 让重跑重复拼接；只复述原则名字而没有针对这个迁移的具体设计。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    {
      id: "response-visible",
      description: "浏览器中能看到完整回复，回复给出可重复执行、崩溃后能收敛的迁移设计。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-make-operations-idempotent/SKILL.md",
    regression:
      "该原则在 DSH 会话中仍被应用：从工作区的部署方式推出可重跑、崩溃后收敛的迁移，而不是一次性脚本",
  },
};
