import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vite-plus/test";

import type { RunRecord } from "../playground/types.ts";
import { recordFileName } from "../playground/scripts/lib/evidence.ts";
import { writeReviewSnapshot } from "../playground/scripts/lib/review-snapshot.ts";
import { workerPaths } from "../playground/scripts/lib/worker.ts";

const directories: string[] = [];

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "pstack-review-snapshot-"));
  directories.push(directory);
  return directory;
}

afterEach(() => {
  delete process.env.PLAYGROUND_WORKERS_DIR;
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

function record(capturedAt: string): RunRecord {
  return {
    scenarioId: "playbook-opening-a-pr",
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
    session: null,
    artifacts: {
      recordFile: "",
      observed: [],
    },
    semanticReview: { status: "pending", reason: "pending" },
    mechanicalFailures: [],
    verdict: { phase: "raw", status: "unobserved", reason: "test" },
    batchId: "batch-1",
    capturedAt,
  };
}

describe("review snapshot", () => {
  it("writes the current evidence and removes scenarios absent from the snapshot", () => {
    const reviews = temporaryDirectory();
    const workers = temporaryDirectory();
    process.env.PLAYGROUND_WORKERS_DIR = workers;
    const artifacts = temporaryDirectory();
    const recordFile = join(artifacts, "record.json");
    writeFileSync(recordFile, "{}\n");
    const current = record("2026-11-13T01:00:00.000Z");
    current.artifacts.recordFile = recordFile;
    const sourcePaths = workerPaths(0, "base", "raw");
    mkdirSync(sourcePaths.evidenceDir, { recursive: true });
    const stamp = current.capturedAt.replace(/[:.]/g, "-");
    writeFileSync(
      join(
        sourcePaths.evidenceDir,
        recordFileName(current.scenarioId, current.phase, "base", stamp).replace(
          /\.json$/,
          ".source.json",
        ),
      ),
      `${JSON.stringify({ recordFile, screenshotFile: null, sessionFile: null })}\n`,
    );

    const manifest = writeReviewSnapshot("raw", "base", null, [current], reviews);
    const scenario = join(
      reviews,
      "raw-base",
      "scenarios",
      "playbooks",
      "playbook-opening-a-pr",
      "raw-base",
    );
    expect(existsSync(join(scenario, "record.json"))).toBe(true);
    expect(manifest.lastBatchId).toBeNull();
    expect(
      JSON.parse(readFileSync(join(reviews, "raw-base", "manifest.json"), "utf8")),
    ).toMatchObject({
      phase: "raw",
      environment: "base",
      scenarioIds: ["playbook-opening-a-pr"],
    });

    writeReviewSnapshot("raw", "base", null, [], reviews);
    expect(existsSync(scenario)).toBe(false);
  });
});
