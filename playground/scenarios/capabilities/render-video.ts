import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-render-video",
  capability: "render-video",
  turns: [
    {
      prompt: "把这次的改动做一段带字幕的短视频总结，几秒钟、横屏，我要能直接在回复里播放。",
    },
  ],
  workspace: {
    files: {
      "CHANGELOG.md": "# 变更\n\n- 修复了列表在空数据时的报错\n- 调整了空状态的文案\n",
    },
  },
  assertions: [{ kind: "turn-completed" }],
  rubric: {
    prompt:
      "用户能拿到一个真实可播放的视频（如 mp4），并在回复里播放或打开检查。只给文字脚本、旁白文字或链接而没有实际视频文件，记为缺口；视频渲染能力不可用时按环境限制记录，不判通过。",
  },
  uiObservations: [
    {
      id: "video-visible",
      description: "浏览器中能看到并播放一段短视频，而不是只有文字或链接。",
    },
  ],
};

export default scenario;
