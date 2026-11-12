import type { BehaviorScenario } from "../../types.ts";

export const blastRadius: BehaviorScenario = {
  type: "behavior",
  id: "blast-radius-cache-sweep",
  skill: "blast-radius",
  turns: [
    {
      prompt:
        "同事提交了一个看着很小的改动，见 diff.patch，往缓存模块里加了个清理函数。我担心它会不会把别处弄坏。帮我评估这个改动的影响范围，判断能不能安全合入。别只给我一段分析——最好真的跑点东西验证关键假设，并告诉我哪条你证明了、哪条没证明。",
    },
  ],
  workspace: {
    files: {
      "package.json": '{ "type": "module" }',
      "diff.patch": [
        "--- a/src/cache.js",
        "+++ b/src/cache.js",
        "@@ -12,3 +12,9 @@ export function get(key) {",
        "   return entry.value;",
        " }",
        " ",
        "+export function sweep(now) {",
        "+  for (const [key, entry] of store) {",
        "+    if (entry.expiresAt <= now) store.delete(key);",
        "+  }",
        "+}",
        "",
      ].join("\n"),
      "src/cache.js": [
        "const store = new Map();",
        "",
        "export function set(key, value, ttlMs) {",
        "  store.set(key, { value, expiresAt: Date.now() + ttlMs });",
        "}",
        "",
        "export function get(key) {",
        "  const entry = store.get(key);",
        "  if (!entry) return undefined;",
        "  if (entry.expiresAt <= Date.now()) return undefined;",
        "  return entry.value;",
        "}",
        "",
        "// 本 diff 新增的清理函数：删除 expiresAt 已经过去的条目。",
        "export function sweep(now) {",
        "  for (const [key, entry] of store) {",
        "    if (entry.expiresAt <= now) store.delete(key);",
        "  }",
        "}",
        "",
      ].join("\n"),
      "src/report.js": [
        'import { get, set } from "./cache.js";',
        "",
        "export function buildReport(userId) {",
        '  const cached = get("report:" + userId);',
        "  if (cached) return cached;",
        "  const report = { userId, generatedAt: Date.now() };",
        '  set("report:" + userId, report, 60000);',
        "  return report;",
        "}",
        "",
      ].join("\n"),
      "src/maintenance.js": [
        'import { sweep } from "./cache.js";',
        "",
        "// 定时清理过期缓存，参数传入当前真实时间。",
        "export function startMaintenance() {",
        "  return setInterval(() => sweep(Date.now()), 60000);",
        "}",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "目标是对一个超出 diff 的小改动做影响面分析，并用真实运行证明那条安全所依赖的关键事实。合格的回复要说明改动实际做了什么（新增的清理函数遍历共享 store，删除 expiresAt 已经过去的条目）；然后指出它安全所依赖的那一个事实——清理只删那些 get() 已经视为过期、本来就会返回 undefined 的条目，两者用的是同一个 `<=` 判定，所以清理掉的值本来就读不到，get 的可观察结果不变；并给出真实运行（脚本或测试，调用同一份模块代码）后的证据，或用真实的 file:line 一步一步说明坏情况为何到不了。还要把 diff 之外的关注点逐条评估并说明清或未清，例如其他调用 get/set 的模块（如 report.js）、在遍历 Map 边遍历边删除是否安全、清理函数的 now 参数与真实时钟的关系（现有调用方传入 Date.now()）。最后明确写出这条事实是被证明还是未证明。gap：只复述 diff 或只罗列调用方；给一段「看起来没问题」的静态推测却没有运行证据也没标注未证明；声称安全却没有给出所依赖的事实或证据。若运行环境缺能力无法执行，应如实说明并标注未证明，不算缺口。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，没有自动点击停止。" },
    {
      id: "response-visible",
      description:
        "浏览器里能看到改动说明、安全所依赖的那条事实，以及实际运行的验证输出或明确标注的未证明。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/blast-radius/SKILL.md",
    regression:
      "适配后仍必须给出「安全所依赖的那一个事实」，并用真实运行把它证明或明确标注未证明；退化为纯静态清单即为回归。",
  },
};
