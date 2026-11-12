import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vite-plus/test";

import {
  archivePreviousReport,
  pruneStalePhaseEvidence,
  reportRunId,
  writeReportManifest,
} from "../playground/scripts/lib/report-history.ts";

const temporaryDirectories: string[] = [];

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "pstack-report-history-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("report history", () => {
  it("archives the previous run and removes only stale phase evidence", () => {
    const reports = temporaryDirectory();
    const run = join(reports, "runs", "raw-base");
    const oldCase = join(reports, "scenarios", "skills", "old-case", "raw-base");
    const currentCase = join(reports, "scenarios", "skills", "current-case", "raw-base");
    mkdirSync(run, { recursive: true });
    mkdirSync(oldCase, { recursive: true });
    mkdirSync(currentCase, { recursive: true });
    writeFileSync(join(run, "summary.md"), "old summary\n");
    writeFileSync(join(oldCase, "record.json"), '{"old":true}\n');
    writeFileSync(join(currentCase, "record.json"), '{"current":true}\n');
    writeReportManifest(run, {
      runId: "old-run",
      phase: "raw",
      environment: "base",
      generatedAt: "2026-11-12T00:00:00.000Z",
      scenarioIds: ["old-case"],
    });

    archivePreviousReport(reports, "raw", "base", "old-run");
    pruneStalePhaseEvidence(reports, "raw", "base", new Set(["current-case"]));

    expect(
      readFileSync(join(reports, "history", "old-run", "runs", "raw-base", "summary.md"), "utf8"),
    ).toBe("old summary\n");
    expect(
      existsSync(
        join(
          reports,
          "history",
          "old-run",
          "scenarios",
          "skills",
          "old-case",
          "raw-base",
          "record.json",
        ),
      ),
    ).toBe(true);
    expect(existsSync(join(reports, "scenarios", "skills", "old-case", "raw-base"))).toBe(false);
    expect(existsSync(join(reports, "scenarios", "skills", "current-case", "raw-base"))).toBe(true);
  });

  it("derives a local-time run id from the latest captured record", () => {
    const timestamp = "2026-11-12T02:00:00.000Z";
    const date = new Date(timestamp);
    const pad = (value: number) => String(value).padStart(2, "0");
    const expected = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
    expect(
      reportRunId([
        { capturedAt: "2026-11-12T01:00:00.000Z" } as never,
        { capturedAt: timestamp } as never,
      ]),
    ).toBe(expected);
  });
});
