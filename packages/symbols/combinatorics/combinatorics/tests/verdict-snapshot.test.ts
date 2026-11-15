// The committed snapshot of the compile steps' interpreter cross-checks (verdicts.tsv, written by
// scripts/collect-verdicts.ts): its format, how the build reads it, and that it is fresh.

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vite-plus/test";
import { checkers } from "../scripts/verdicts.ts";
import { type Row, readSnapshot, Snapshot, writeSnapshot } from "../scripts/verdict-snapshot.ts";

const dir = mkdtempSync(join(tmpdir(), "verdict-snapshot-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const collect = fileURLToPath(new URL("../scripts/collect-verdicts.ts", import.meta.url));
/** The end of what a run printed, where its summary and the rows it names are. */
const tail = (run: { stdout: string; stderr: string }): string => `${run.stdout}${run.stderr}`.slice(-4000);
const COMMAND = "pnpm --filter @notatio/combinatorics run collect-verdicts";

describe("the snapshot file", () => {
  const rows: Row[] = [
    { step: "b", signature: "Zed@x", key: "0123", verdict: "agrees" },
    { step: "a", signature: "Odd\tname", key: "4567", verdict: "disagrees: rank,unrank" },
    { step: "a", signature: '"quoted', key: "89ab", verdict: "disagrees" },
    { step: "a", signature: "Alpha@x", key: "cdef", verdict: "agrees" },
  ];

  it("round-trips, sorted by step then signature whatever the order written", () => {
    const file = join(dir, "round-trip.tsv");
    writeSnapshot(rows, file);
    const first = readFileSync(file, "utf8");
    expect(readSnapshot(file).map((r) => `${r.step}/${r.signature}`)).toEqual([
      'a/"quoted',
      "a/Alpha@x",
      "a/Odd\tname",
      "b/Zed@x",
    ]);
    expect(readSnapshot(file)).toEqual(expect.arrayContaining(rows));
    writeSnapshot(rows.toReversed(), file);
    expect(readFileSync(file, "utf8")).toBe(first);
  });

  it("is empty when there is no file", () => {
    expect(readSnapshot(join(dir, "none.tsv"))).toEqual([]);
  });
});

describe("the build's reading", () => {
  const file = join(dir, "build.tsv");
  const parts = { definition: "x", subjects: [1, 2] };
  const never = (): boolean => {
    throw new Error("the interpreter ran");
  };
  const neverOps = (): string[] => {
    throw new Error("the interpreter ran");
  };
  const key = (): string => {
    const probe = new Snapshot("step", checkers.maps, "verify", join(dir, "absent.tsv"));
    probe.remember(parts, () => true, "probe", false);
    return probe.share().rows[0]!.key;
  };

  it("emits on a fresh agrees row, leaves a fresh disagrees row or a stale one interpreted, and never checks", () => {
    writeSnapshot(
      [
        { step: "step", signature: "fine", key: key(), verdict: "agrees" },
        { step: "step", signature: "wrong", key: key(), verdict: "disagrees" },
        { step: "step", signature: "ops", key: key(), verdict: "disagrees: rank" },
        { step: "step", signature: "stale", key: "0".repeat(24), verdict: "agrees" },
      ],
      file,
    );
    const snapshot = new Snapshot("step", checkers.maps, "build", file);
    expect(snapshot.remember(parts, never, "fine", false)).toBe(true);
    expect(snapshot.remember(parts, never, "wrong", false)).toBe(false);
    expect(snapshot.remember(parts, never, "stale", false)).toBe(false);
    expect(snapshot.remember(parts, never, "missing", false)).toBe(false);
    expect(snapshot.remember(parts, neverOps, "ops", ["rank", "unrank"])).toEqual(["rank"]);
    expect(snapshot.remember(parts, neverOps, "fine", ["rank", "unrank"])).toEqual([]);
    expect(snapshot.remember(parts, neverOps, "absent", ["rank", "unrank"])).toEqual(["rank", "unrank"]);
    expect(snapshot.share().unfresh).toEqual(["stale (stale)", "missing (missing)", "absent (missing)"]);
  });

  it("is stale when the definition, the code or the subjects it checked change", () => {
    const base = key();
    const keyOf = (p: unknown): string => {
      const probe = new Snapshot("step", checkers.maps, "verify", join(dir, "absent.tsv"));
      probe.remember(p, () => true, "probe", false);
      return probe.share().rows[0]!.key;
    };
    expect(keyOf(parts)).toBe(base);
    expect(keyOf({ ...parts, definition: "y" })).not.toBe(base);
    expect(keyOf({ ...parts, subjects: [1, 2, 3] })).not.toBe(base);
  });
});

// Keys only: each step compiles its definitions and reads their rows, and the interpreter never runs.
describe("the committed snapshot", () => {
  it("has a fresh row for every item", { timeout: 15 * 60_000 }, () => {
    const run = spawnSync(process.execPath, [collect, "--check"], {
      encoding: "utf8",
      env: {
        ...process.env,
        COMPILE_SHARDS: process.env.COMPILE_SHARDS ?? "3",
        FAMILY_SHARDS: process.env.FAMILY_SHARDS ?? "3",
      },
    });
    expect(run.status, `a verdict row is missing or stale: run \`${COMMAND}\`\n${tail(run)}`).toBe(0);
  });
});

// Every row on the current engine: a compute-engine bump keeps the snapshot's rows, and this is what
// notices one whose verdict it changed. About as long as the build's cross-checks used to be.
describe.skipIf(!process.env.DEEP_TESTS)("the committed snapshot, deep", () => {
  it("holds on the current engine", { timeout: 115 * 60_000 }, () => {
    const run = spawnSync(process.execPath, [collect, "--all", "--check"], {
      encoding: "utf8",
      maxBuffer: 1 << 28,
      env: {
        ...process.env,
        COMPILE_SHARDS: process.env.COMPILE_SHARDS ?? "3",
        FAMILY_SHARDS: process.env.FAMILY_SHARDS ?? "3",
      },
    });
    expect(
      run.status,
      `a verdict differs on this engine: run \`${COMMAND} --all\` and review what changed\n${tail(run)}`,
    ).toBe(0);
  });
});
