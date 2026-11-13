import { describe, expect, it } from "vite-plus/test";

import type { RunRecord } from "../playground/types.ts";
import { residualKinds, sanitizeRecord } from "../playground/scripts/lib/redaction.ts";

function record(): RunRecord {
  return {
    scenarioId: "redaction-test",
    phase: "raw",
    environment: {
      worker: 0,
      dshVersion: "test",
      adaptedVersion: null,
      matrix: { id: "base", enabledPluginPackages: [] },
      upstreamRevision: "upstream",
      configHash: "config",
    },
    target: null,
    session: {
      sessionId: "session-1",
      sessionFile: "/home/leihaohao/.dsh/sessions/x/session.v4.jsonl.zstd",
      workspacePath: "/tmp/dsh-pstack-playground/raw/base/w0/workspace/x",
      agentPreset: "standard",
      skillLoads: [],
      toolCalls: [
        {
          name: "bash",
          status: "ok",
          argsSummary:
            "bash command=cat /home/leihaohao/.dsh/credentials.yaml api_key=sk-abcdefgh12345678",
        },
      ],
      turnEndReason: "completed",
      assistantText: "token sk-abcdefgh12345678 at /home/leihaohao/private",
      userText: "read /tmp/other",
      userTexts: ["read /tmp/other"],
      autoAnswers: [],
    },
    artifacts: {
      recordFile: "/home/leihaohao/worker/record.json",
      screenshotFile: "/home/leihaohao/worker/shot.png",
      observed: ["path /tmp/other"],
    },
    semanticReview: { status: "pending", reason: "pending" },
    mechanicalFailures: [],
    verdict: { phase: "raw", status: "unobserved", reason: "test" },
    capturedAt: "2026-11-13T00:00:00.000Z",
  };
}

describe("record redaction", () => {
  it("removes secrets and host paths before a worker record is written", () => {
    const safe = sanitizeRecord(record());
    const text = JSON.stringify(safe);
    expect(residualKinds(text)).toEqual([]);
    expect(safe.session?.sessionFile).toBe("session.jsonl.zstd");
    expect(safe.session?.workspacePath).toBe("<WORKSPACE>");
    expect(safe.artifacts.recordFile).toBe("record.json");
  });
});
