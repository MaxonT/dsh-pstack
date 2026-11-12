import type { BehaviorScenario } from "../../types.ts";

export const swarmBoundaryScan: BehaviorScenario = {
  type: "behavior",
  id: "swarm-boundary-scan",
  skill: "swarm",
  turns: [
    {
      prompt:
        "src 下这几个工具函数我想统一过一遍健壮性。请分头并行地把 safeDivide、parseConfig、clamp、slugify 都查一下有没有没处理的边界或会直接抛异常的情况，最后合并成一张表，列出每个文件的问题和是否确认。",
    },
  ],
  workspace: {
    files: {
      "package.json": `{
  "name": "toolbox",
  "version": "0.1.0",
  "type": "module"
}
`,
      "src/safeDivide.mjs": `export function safeDivide(numerator, denominator) {
  return numerator / denominator;
}
`,
      "src/parseConfig.mjs": `export function parseConfig(text) {
  return JSON.parse(text);
}
`,
      "src/clamp.mjs": `export function clamp(value, min, max) {
  if (min > max) throw new RangeError("min must be <= max");
  return Math.min(Math.max(value, min), max);
}
`,
      "src/slugify.mjs": `export function slugify(input) {
  if (typeof input !== "string") throw new TypeError("input must be a string");
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
`,
    },
  },
  assertions: [
    { kind: "turn-completed" },
    { kind: "skill-loaded", skill: "swarm" },
    { kind: "assistant-contains", text: "safeDivide" },
    { kind: "assistant-contains", text: "parseConfig" },
    { kind: "assistant-contains", text: "clamp" },
    { kind: "assistant-contains", text: "slugify" },
  ],
  rubric: {
    prompt:
      "最终应是一份合并后的报告：一张覆盖全部四个切片的表，每行给出文件、PASS 或 ISSUES 与证据；safeDivide（分母为 0 未设防，返回 Infinity）与 parseConfig（未包裹 JSON.parse，非法输入直接抛异常）应被标为确认问题并附一句说明，clamp 与 slugify 应判为通过；同时说明是否有切片缺口或工人掉线。gap：漏查部分文件；只贴各工人原始输出而未合并；问题没有证据；或把已防护的文件误报为问题。若并行子代理在本环境不可用，技能应如实说明并降级为顺序切片完成，不据此判缺口。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    {
      id: "response-visible",
      description: "浏览器中能看到完整回复，含合并后的结果表而非多段原始输出。",
    },
    {
      id: "consolidated-table",
      description: "人工确认回复出现一张覆盖四个文件的合并表，而不是粘贴多段工人原文。",
    },
    {
      id: "pass-issues-marks",
      description: "人工确认每个切片带 PASS/ISSUES 结论与简短依据，问题项可读。",
    },
    {
      id: "gaps-noted",
      description: "人工确认若有切片缺口或工人掉线，报告中有明确说明。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/swarm/SKILL.md",
    regression:
      "主路径：并行切片后合并成一份带 PASS/ISSUES 的报告；子代理不可用时如实降级为顺序切片，不据此判缺口",
  },
};
