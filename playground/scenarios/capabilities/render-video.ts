import type { BehaviorScenario } from "../../types.ts";

const scenario: BehaviorScenario = {
  id: "capability-render-video",
  capability: "render-video",
  turns: [
    {
      prompt:
        "把这次改动做成一段带字幕的短视频总结给我，要真的能播放，不要只给我文字脚本或一个链接。",
    },
  ],
  workspace: {
    files: {
      "README.md": "# render-video\n\n能力探测。\n",
    },
  },
  assertions: [
    {
      kind: "turn-completed",
    },
  ],
  rubric: {
    prompt: "用户能看到一段真实可播放的视频。只给文字脚本或链接、没有可播放视频，记为缺口。",
  },
  uiObservations: [
    {
      id: "video-playable",
      description: "浏览器中实际显示并可以播放这段视频。",
    },
  ],
};

export default scenario;
