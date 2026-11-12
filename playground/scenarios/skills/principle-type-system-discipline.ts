import type { BehaviorScenario } from "../../types.ts";

export const principleTypeSystemDiscipline: BehaviorScenario = {
  type: "behavior",
  id: "principle-type-system-discipline-apply",
  skill: "principle-type-system-discipline",
  turns: [
    {
      prompt:
        "refund.ts 里 createRefund(orderId, userId, status) 这几个参数都是 string，Refund 上的字段又都是可选的，代码里到处判空。帮我审视一下这些类型该怎么设计更稳。",
    },
  ],
  workspace: {
    files: {
      "refund.ts": [
        "export interface Refund {",
        "  orderId?: string;",
        "  userId?: string;",
        "  status?: string;",
        "  amount?: number;",
        "}",
        "",
        "export function createRefund(",
        "  orderId: string,",
        "  userId: string,",
        "  status: string,",
        "): Refund {",
        '  if (!orderId || !userId) throw new Error("missing id");',
        '  if (status !== "pending" && status !== "paid") throw new Error("bad status");',
        "  return { orderId, userId, status };",
        "}",
        "",
        "export function approveRefund(refund: Refund): Refund {",
        '  if (!refund.orderId) throw new Error("no order");',
        '  if (refund.status !== "pending") throw new Error("not pending");',
        '  refund.status = "approved";',
        "  return refund;",
        "}",
        "",
      ].join("\n"),
      "README.md": [
        "# refunds",
        "",
        "退款模块。status 实际会经历 pending、paid、approved、rejected 几种取值。",
        "createRefund 的入参来自 HTTP 请求体，是未解析的原始字段。",
        "",
      ].join("\n"),
    },
  },
  assertions: [{ kind: "turn-completed" }, { kind: "no-tool-error" }],
  rubric: {
    prompt:
      "回复应真正应用该原则推理：把 orderId 与 userId 这两个底层同为 string 但语义不同的原语用品牌类型（branded type）或等价手段区分，使二者不可互换；把 status 从裸 string 收紧成字面量联合类型（覆盖 pending/paid/approved/rejected 等真实取值），让非法取值在类型层就被拒绝；把逻辑上必填的字段从可选改成必填，让非法状态不可表示，并去掉据此产生的运行时判空；来自 HTTP 的原始入参在边界处解析一次成类型化模型，下游信任类型。gap：只把 string 改成枚举却仍不区分两个 ID；继续保留一堆可选字段和判空；只喊口号或只复述原则名字。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "会话自然结束，回复给出针对函数签名的类型收紧判断。" },
    {
      id: "response-visible",
      description:
        "浏览器中能看到完整回复，回复用品牌类型区分 ID、用字面量联合收紧 status，并把必填字段改为必填。",
    },
  ],
  source: {
    upstreamSkill: "pstack/skills/principle-type-system-discipline/SKILL.md",
    regression:
      "该原则在 DSH 会话中仍被应用：用品牌类型与字面量联合让非法状态不可表示，并在边界解析外部数据",
  },
};
