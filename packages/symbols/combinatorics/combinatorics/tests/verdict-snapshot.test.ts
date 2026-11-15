// The committed snapshot of the compile steps' interpreter cross-checks (verdicts.tsv, written by
// scripts/collect-verdicts.ts): its format, how the build reads it, and that it is fresh.

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vite-plus/test";
import { checkers } from "../scripts/verdicts.ts";
import { partOfRun, partsOf, type Row, readSnapshot, Snapshot, writeSnapshot } from "../scripts/verdict-snapshot.ts";

const dir = mkdtempSync(join(tmpdir(), "verdict-snapshot-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const collect = fileURLToPath(new URL("../scripts/collect-verdicts.ts", import.meta.url));
/** The end of what a run printed, where its summary and the rows it names are. */
const tail = (run: { stdout: string; stderr: string }): string => `${run.stdout}${run.stderr}`.slice(-4000);
const COMMAND = "pnpm --filter @notatio/combinatorics run collect-verdicts";

describe("the snapshot file", () => {
  const rows: Row[] = [
    { step: "b", signature: "Zed@x", key: "0123", source: "s0", verdict: "agrees", seconds: 1.25 },
    { step: "a", signature: "Odd\tname", key: "4567", source: "s1", verdict: "disagrees: rank,unrank" },
    { step: "a", signature: '"quoted', key: "89ab", source: "s2", verdict: "disagrees" },
    { step: "a", signature: "Alpha@x", key: "cdef", source: "s3", verdict: "agrees" },
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
  const source = { definition: "x", subjects: [1, 2] };
  /** The key and source hash a row of `parts` and `source` carries. */
  const hashesOf = (p: unknown, s: unknown = source): { key: string; source: string } => {
    const probe = new Snapshot("step", checkers.maps, "verify", join(dir, "absent.tsv"));
    probe.remember(p, s, () => true, "probe", false);
    const row = probe.share().rows[0]!;
    return { key: row.key, source: row.source };
  };
  const fresh = hashesOf(parts);
  const row = (signature: string, verdict: string, hashes = fresh): Row => ({
    step: "step",
    signature,
    verdict,
    ...hashes,
  });

  it("emits on a fresh agrees row, leaves a fresh disagrees row or a stale one interpreted, and never checks", () => {
    writeSnapshot(
      [
        row("fine", "agrees"),
        row("wrong", "disagrees"),
        row("ops", "disagrees: rank"),
        row("stale", "agrees", { ...fresh, key: "0".repeat(24) }),
      ],
      file,
    );
    const snapshot = new Snapshot("step", checkers.maps, "build", file);
    expect(snapshot.remember(parts, source, never, "fine", false)).toBe(true);
    expect(snapshot.remember(parts, source, never, "wrong", false)).toBe(false);
    expect(snapshot.remember(parts, source, never, "stale", false)).toBe(false);
    expect(snapshot.remember(parts, source, never, "missing", false)).toBe(false);
    expect(snapshot.remember(parts, source, neverOps, "ops", ["rank", "unrank"])).toEqual(["rank"]);
    expect(snapshot.remember(parts, source, neverOps, "fine", ["rank", "unrank"])).toEqual([]);
    expect(snapshot.remember(parts, source, neverOps, "absent", ["rank", "unrank"])).toEqual(["rank", "unrank"]);
    expect(snapshot.share().unfresh).toEqual(["stale (stale)", "missing (missing)", "absent (missing)"]);
  });

  it("is stale when the definition, the code or the subjects it checked change", () => {
    const base = hashesOf(parts);
    expect(hashesOf(parts)).toEqual(base);
    expect(hashesOf({ ...parts, definition: "y" }).key).not.toBe(base.key);
    expect(hashesOf({ ...parts, subjects: [1, 2, 3] }).key).not.toBe(base.key);
  });

  it("keeps the compiled code out of the source hash, and the definition and subjects in it", () => {
    const withCode = (code: string) => hashesOf({ ...parts, code }, source);
    expect(withCode("a").key).not.toBe(withCode("b").key);
    expect(withCode("a").source).toBe(withCode("b").source);
    expect(hashesOf(parts, { ...source, definition: "y" }).source).not.toBe(fresh.source);
    expect(hashesOf(parts, { ...source, subjects: [1] }).source).not.toBe(fresh.source);
  });
});

describe("the source mode", () => {
  const file = join(dir, "source.tsv");
  const source = { definition: "x" };
  const hash = (s: unknown): string => {
    const probe = new Snapshot("step", checkers.maps, "verify", join(dir, "absent.tsv"));
    probe.remember({}, s, () => true, "probe", false);
    return probe.share().rows[0]!.source;
  };
  const at = (signature: string, s: unknown): Row => ({
    step: "step",
    signature,
    key: "k",
    source: hash(s),
    verdict: "agrees",
  });

  it("finds a changed source or a row with no item, and ignores an item with no row", () => {
    writeSnapshot([at("same", source), at("changed", { definition: "old" }), at("gone", source)], file);
    const snapshot = new Snapshot("step", checkers.maps, "source", file);
    expect(snapshot.sourceOnly).toBe(true);
    snapshot.note(source, "same");
    snapshot.note(source, "changed");
    snapshot.note(source, "new");
    const { unfresh, seen } = snapshot.share();
    expect(unfresh).toEqual(["changed (stale)"]);
    expect(seen.toSorted()).toEqual(["changed", "new", "same"]);
    expect(() => snapshot.save()).toThrow(/2 rows stale or without an item/);
  });
});

describe("the deep job's parts", () => {
  const rows: Row[] = Array.from({ length: 60 }, (_, i) => ({
    step: `s${i % 3}`,
    signature: `r${i}`,
    key: "k",
    source: "s",
    verdict: "agrees",
    // A few rows dwarf the rest, as the graphs do.
    seconds: i % 20 === 0 ? 900 : 1 + (i % 7),
  }));

  it("covers every row exactly once, whatever the order", () => {
    const split = partsOf(rows, 5);
    expect(split.size).toBe(rows.length);
    expect(new Set(split.values())).toEqual(new Set([0, 1, 2, 3, 4]));
    expect(partsOf(rows.toReversed(), 5)).toEqual(split);
  });

  it("balances by the recorded seconds", () => {
    const split = partsOf(rows, 5);
    const load = [0, 0, 0, 0, 0];
    for (const r of rows) load[split.get(`${r.step}\0${r.signature}`)!]! += r.seconds!;
    // Three rows of 900 s and the rest in the other parts: no part is more than a dear row over the mean.
    const mean = load.reduce((a, b) => a + b, 0) / load.length;
    expect(Math.max(...load)).toBeLessThanOrEqual(Math.max(900, mean * 1.1));
  });

  it("reads VERDICT_PART as i/n, 1-based", () => {
    expect(partOfRun("2/5")).toEqual({ index: 2, of: 5 });
    expect(partOfRun("")).toBeUndefined();
    expect(() => partOfRun("0/5")).toThrow(/VERDICT_PART/);
    expect(() => partOfRun("6/5")).toThrow(/VERDICT_PART/);
  });
});

describe("the committed snapshot's costs", () => {
  it("records the seconds of every row, so the parts can balance", () => {
    expect(
      readSnapshot()
        .filter((r) => r.seconds === undefined || !(r.seconds >= 0))
        .map((r) => r.signature),
    ).toEqual([]);
  });
});

// Source hashes only: each step reads its items' definitions and subjects and compiles nothing, and the
// interpreter never runs. A compiler change that alters code leaves the item interpreted and shows in the
// build's summary line, and the deep test below re-checks everything.
describe("the committed snapshot", () => {
  it("has a fresh source hash for every row", { timeout: 15 * 60_000 }, () => {
    const run = spawnSync(process.execPath, [collect, "--source"], {
      encoding: "utf8",
      env: { ...process.env, COMPILE_SHARDS: "1", FAMILY_SHARDS: "1" },
    });
    expect(run.status, `a verdict row is stale or has no item: run \`${COMMAND}\`\n${tail(run)}`).toBe(0);
  });
});

// Every row on the current engine: a compute-engine bump keeps the snapshot's rows, and this is what
// notices one whose verdict it changed. The nightly runs it in parts (VERDICT_PART=i/n, nightly.yml's
// deep-crosschecks), each part re-checking its share of the rows; without one it is every row.
describe.skipIf(!process.env.DEEP_TESTS)("the committed snapshot, deep", () => {
  it("holds on the current engine", { timeout: 115 * 60_000 }, () => {
    const part = process.env.VERDICT_PART;
    const run = spawnSync(process.execPath, [collect, "--all", "--check", ...(part ? ["--part", part] : [])], {
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
