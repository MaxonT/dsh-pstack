import type { BehaviorScenario } from "../../types.ts";

export const inYourOwnWordsGoalRestate: BehaviorScenario = {
  type: "behavior",
  id: "in-your-own-words-goal-restate",
  skill: "in-your-own-words",
  turns: [
    {
      prompt:
        "登录页在手机上老是错位，表单被键盘挡住，提交后偶尔白屏。我试了几个 CSS 改法都没解决，你帮我把这个弄好，别再让我改了。",
    },
    { prompt: "/in-your-own-words 先说清楚你认为我想达到什么、在解决什么问题。" },
  ],
  workspace: {
    files: {
      "README.md": "# web-app\n\n移动端登录页在 src/login.css，提交逻辑在 src/login.js。\n",
      "src/login.css": ".login-form {\n  position: absolute;\n  top: 40%;\n}\n",
      "src/login.js":
        'export function submit(form) {\n  return fetch("/api/login", { method: "POST", body: new FormData(form) });\n}\n',
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "效果成立的标志：用自己的话复述用户的目标（移动端登录页可正常使用、能稳定提交）和问题（软键盘遮挡表单、提交后偶发白屏、之前的 CSS 改法没解决），而不是直接给方案或开始改代码。允许说明不确定之处并请用户确认范围。gap：直接跳进 CSS/代码修改；只复述原话而不提炼目标与问题；漏掉白屏或键盘遮挡这类关键症状。技能加载只是过程证据，不等于效果成立。",
  },
  uiObservations: [
    { id: "completed-turn", description: "两轮对话都自然结束，没有自动点击停止。" },
    { id: "response-visible", description: "浏览器中能看到对目标与问题的复述，而非代码改动。" },
  ],
  source: {
    upstreamSkill: "pstack/skills/in-your-own-words/SKILL.md",
    regression: "主路径：先复述目标与问题，不直接实现",
  },
};
