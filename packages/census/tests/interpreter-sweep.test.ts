// The interpreter sweep as a nightly: the committed list of (definition, subject) rows (`fixtures/
// interpreter-sweep.tsv`, written by `scripts/collect-interpreter-sweep.ts`) run through both passes
// (`scripts/interpreter-sweep.ts`): the engine with every library declared against a bare one, and the declared
// interpreter against the compiled code. It catches a declaration that changes what a definition evaluates to
// or how long it takes, as `Ordering` (a lazy collection read wrong) and `declareOperatorForms` (the signatures
// of `Map`, `Fold` and `Filter` replaced) once did, on every definition and not only the ones with an example.
//
// The standard run holds the list's shape, its slices and the classes, and runs a handful of its cheapest rows
// in this process. `DEEP_TESTS=1` runs tonight's slice (`NIGHTLY_SLICE`, else the day of the year modulo 7)
// in worker processes, each side of a row under a 10 s cap that is never raised; `SWEEP_SLICES=all` runs all
// seven, and `SWEEP_SHARD=i/n` takes the i-th of n parts of the selection, for a job to share a slice with others.

import { appendFileSync } from "node:fs";
import { sweepTargets } from "@notatio/combinatorics/sweep";
import { expect, test } from "vite-plus/test";
import {
  classifyCompiled,
  classifyDeclared,
  describe as describeFailure,
  hashRow,
  makeExecutor,
  measureRow,
  measureRowIn,
  openSlots,
  overSlots,
  readList,
  type RowResult,
  SLICES,
  sliceOf,
  summarise,
  tonightsSlice,
} from "../scripts/interpreter-sweep.ts";
import { FULL_ENGINE_TIMEOUT } from "./timeouts.ts";

const DEEP = process.env.DEEP_TESTS === "1";
const listed = readList(new URL("./fixtures/interpreter-sweep.tsv", import.meta.url).pathname);

/** The longest either side of a row may take on a runner. The list holds rows that took at most a second on the
 *  box that collected it and CI runs about four times slower, so a cap of 10 s leaves a margin; never raised. */
const SIDE_CAP_MS = 10_000;

/**
 * The most the declared interpreter may take over the bare one, as total time over total time across a slice.
 * Measured on the list when it was collected (after `declareOperatorForms` kept compute-engine's signatures):
 * 1.114 over its 27,832 rows (3,462 s declared against 3,107 s bare), each of the seven slices between 1.107 and
 * 1.123, and 1.120 over every row either side finished within the 30 s of the collection. Before the fix, the first
 * half of slice 0 ran at 1.685 (344 s declared against 204 s bare), and 1.136 after (235 s against 207 s). The
 * threshold sits well above the measured ratio, a margin for a runner's noise on a slice's seconds, and below the
 * ratio the fault gave.
 */
const MAX_RATIO = 1.3;

test("the list is a set of (definition, subject) rows on definitions the sweep knows", () => {
  const known = new Set(sweepTargets().map((target) => target.key));
  const seen = new Set<string>();
  for (const row of listed) {
    expect(known.has(row.key), row.key).toBe(true);
    const id = `${row.key}\0${JSON.stringify(row.subject)}`;
    expect(seen.has(id), id).toBe(false);
    seen.add(id);
    expect(row.declaredMs).toBeGreaterThan(0);
    expect(row.bareMs).toBeGreaterThan(0);
    expect(Math.max(row.declaredMs, row.bareMs)).toBeLessThanOrEqual(1000);
  }
  expect(listed.length).toBeGreaterThan(20_000);
});

test("a slice is a stable hash of the definition and subject", () => {
  expect(hashRow("Descents@Permutation", ["List", 3, 1, 2])).toBe(1015688642);
  expect(sliceOf("Descents@Permutation", ["List", 3, 1, 2])).toBe(3);
  expect(sliceOf("Mirror@binary_tree", ["List", 0])).toBe(3);
  expect(sliceOf("BlockCount@LabeledGraph", ["Tuple", 3, ["List"]])).toBe(1);
});

test("the seven slices hold every row once, each about a seventh", () => {
  const sizes = Array.from({ length: SLICES }, () => 0);
  for (const row of listed) sizes[sliceOf(row.key, row.subject)]!++;
  expect(sizes.reduce((a, b) => a + b, 0)).toBe(listed.length);
  for (const size of sizes) expect(Math.abs(size / (listed.length / SLICES) - 1)).toBeLessThan(0.05);
});

test("tonight's slice is NIGHTLY_SLICE, else the day of the year modulo seven", () => {
  expect(tonightsSlice({ NIGHTLY_SLICE: "4" }, new Date("2026-01-01"))).toBe(4);
  expect(tonightsSlice({}, new Date("2026-01-01T12:00:00Z"))).toBe(1);
  expect(tonightsSlice({ NIGHTLY_SLICE: "" }, new Date("2026-01-08"))).toBe(1);
  expect(tonightsSlice({}, new Date("2026-11-20"))).toBe(324 % SLICES);
  expect(() => tonightsSlice({ NIGHTLY_SLICE: "7" })).toThrow(/not a slice/);
  expect(() => tonightsSlice({ NIGHTLY_SLICE: "x" })).toThrow(/not a slice/);
});

test("a row's two passes are told apart by what each side did", () => {
  const side = (kind: RowResult["declared"]["kind"], text?: string) => ({ kind, ms: 1, ...(text ? { text } : {}) });
  const row = (declared: RowResult["declared"], bare: RowResult["bare"], compiled = side("none")) =>
    ({ key: "A@B", subject: 1, declared, bare, compiled }) satisfies RowResult;
  expect(classifyDeclared(row(side("answer", "1"), side("answer", "1")))).toBe("agree");
  expect(classifyDeclared(row(side("answer", "2"), side("answer", "1")))).toBe("declared-wrong");
  expect(classifyDeclared(row(side("error", "x"), side("answer", "1")))).toBe("declared-error");
  expect(classifyDeclared(row(side("answer", "1"), side("error", "x")))).toBe("bare-error");
  expect(classifyDeclared(row(side("declined"), side("answer", "1")))).toBe("declared-wrong");
  expect(classifyDeclared(row(side("timeout"), side("answer", "1")))).toBe("slow-declared");
  expect(classifyDeclared(row(side("timeout"), side("timeout")))).toBe("slow-both");
  expect(classifyDeclared(row(side("answer", "1"), side("timeout")))).toBe("slow-bare");
  expect(classifyCompiled(row(side("answer", "1"), side("answer", "1"), side("answer", "1")))).toBe("right");
  expect(classifyCompiled(row(side("answer", "1"), side("answer", "1"), side("answer", "2")))).toBe("wrong");
  expect(classifyCompiled(row(side("error", "x"), side("answer", "1"), side("answer", "2")))).toBe("error");
  expect(classifyCompiled(row(side("answer", "1"), side("answer", "1"), side("declined")))).toBe("no-compiled");
  expect(classifyCompiled(row(side("answer", "1"), side("answer", "1"), side("none")))).toBe("no-compiled");
});

// The cheapest rows of a slice, in this process: both engines built once, each row's declared and bare interpreter
// and its compiled code compared, as the nightly does with workers. A handful, as booting the engines is most of it.
test(
  "a few of the cheapest rows agree on both passes",
  () => {
    const executor = makeExecutor();
    const cheap = listed
      .filter((row) => Math.max(row.declaredMs, row.bareMs) < 15)
      .filter((_, i) => i % 40 === 0)
      .slice(0, 12);
    expect(cheap.length).toBeGreaterThan(5);
    const results = cheap.map((row) => measureRowIn(executor, row.key, row.subject));
    expect(summarise(results).failures.map(describeFailure)).toEqual([]);
  },
  FULL_ENGINE_TIMEOUT,
);

// ---- The nightly ---------------------------------------------------------------------------------------

const slices: ReadonlySet<number> =
  process.env.SWEEP_SLICES === "all"
    ? new Set(Array.from({ length: SLICES }, (_, i) => i))
    : new Set([tonightsSlice()]);

const [shard, shards] = (process.env.SWEEP_SHARD ?? "1/1").split("/").map(Number) as [number, number];
const share = listed
  .filter((row) => slices.has(sliceOf(row.key, row.subject)))
  .filter((_, i) => i % shards === shard - 1);

/** How much slower CI is than the box the list's times came from. */
const CI_FACTOR = 4;

test.runIf(DEEP)(
  `the interpreter sweep, slice ${[...slices].join(",")} part ${shard}/${shards}`,
  async () => {
    const workers = Number(process.env.SWEEP_WORKERS ?? "2");
    const { slots, close } = openSlots(workers);
    const results: RowResult[] = [];
    const started = performance.now();
    try {
      await overSlots(slots, share, async (row, slot) => {
        results.push(await measureRow(slot, row.key, row.subject, SIDE_CAP_MS));
      });
    } finally {
      await close();
    }
    const summary = summarise(results);

    const estimate = share.reduce((sum, row) => sum + row.declaredMs + row.bareMs, 0) / 1000;
    const seconds = (performance.now() - started) / 1000;
    const text = [
      `### Interpreter sweep: slice ${[...slices].join(",")}, part ${shard}/${shards}`,
      "",
      `${results.length} rows in ${seconds.toFixed(0)} s (the list's times put them at ${(estimate * CI_FACTOR).toFixed(0)} s of process time on a runner).`,
      `Declared ${(summary.declaredMs / 1000).toFixed(1)} s over bare ${(summary.bareMs / 1000).toFixed(1)} s: ratio **${summary.ratio.toFixed(3)}** (fails past ${MAX_RATIO}).`,
      "",
      "| pass 1 | rows | pass 2 | rows |",
      "| --- | --- | --- | --- |",
      ...Array.from(
        { length: Math.max(Object.keys(summary.pass1).length, Object.keys(summary.pass2).length) },
        (_, i) => {
          const byName = ([a]: [string, number], [b]: [string, number]) => (a < b ? -1 : 1);
          const one = Object.entries(summary.pass1).toSorted(byName)[i];
          const two = Object.entries(summary.pass2).toSorted(byName)[i];
          return `| ${one?.[0] ?? ""} | ${one?.[1] ?? ""} | ${two?.[0] ?? ""} | ${two?.[1] ?? ""} |`;
        },
      ),
      "",
    ].join("\n");
    if (process.env.GITHUB_STEP_SUMMARY !== undefined) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
    else process.stderr.write(`${text}\n`);

    expect(summary.failures.map(describeFailure), "rows where the engines or routes disagree").toEqual([]);
    expect(summary.ratio, "declared time over bare time").toBeLessThan(MAX_RATIO);
  },
  3 * 60 * 60_000,
);
