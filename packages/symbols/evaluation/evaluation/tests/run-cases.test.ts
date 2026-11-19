// `runCases`: batch evaluation over the isolated evaluator (see ./isolated.test.ts for the
// single-call primitive this builds on). Real `worker_threads` workers throughout except
// where a fake stands in for an uncooperative worker (see the last test) — small deadlines
// and cases keep this fast.
import { expect, test } from "vite-plus/test";
import { createEvaluatorPool, runCases, type EvaluatorPool, type NodeWorkerLike } from "../src/node.ts";

// One of compute-engine's own cooperative loops (https://github.com/enumeratio/notatio/wiki/Computation §5.2): it checks a
// `timeMs` deadline itself and answers `"Aborted"` as an ordinary VALUE well inside the
// worker's cooperative window, long before any hard kill. So this reliably produces
// `{ outcome: "Evaluated", value: "Aborted" }`, not the `"Aborted"` OUTCOME — that one is
// reserved for a case that never got an answer at all (see the hard-kill test below).
const SLOW = ["Sum", ["Mod", "k", 97], ["Tuple", "k", 1, 2_000_000_000]];

test("runCases returns results in the same order as the input, regardless of completion order", async () => {
  // The pool is a stand-in whose answers the test releases itself, last case first, so the
  // completion order is the reverse of the input order without any clock.
  const settle: Array<() => void> = [];
  const pool = {
    evaluateDetailed: (input: unknown) =>
      new Promise((resolve) => {
        settle.push(() => resolve({ outcome: "Evaluated", value: input, ms: 0 }));
      }),
  } as unknown as EvaluatorPool;
  const pending = runCases(
    [
      { id: "first", input: 1 },
      { id: "second", input: 2 },
      { id: "third", input: 3 },
    ],
    { pool },
  );
  expect(settle).toHaveLength(3);
  for (const release of settle.toReversed()) release();
  const results = await pending;
  expect(results.map((r) => r.id)).toEqual(["first", "second", "third"]);
  expect(results.map((r) => r.value)).toEqual([1, 2, 3]);
});

test("materialize expands a lazy collection into its elements; without it the call stays", async () => {
  const cases = [{ id: "range", input: ["Range", 1, 3] }];
  const [lazy] = await runCases(cases);
  const [expanded] = await runCases(cases, { materialize: true });
  expect(lazy?.value).toEqual(["Range", 1, 3]);
  expect(expanded?.value).toEqual(["List", 1, 2, 3]);
});

test("materialize expands only the result: an argument is counted whole, not as its display", async () => {
  const [counted] = await runCases([{ id: "length", input: ["Length", ["Range", 1, 20]] }], {
    materialize: true,
  });
  expect(counted?.value).toBe(20);
});

test("materialize expands a result in full up to the limit, and not past it", async () => {
  const [full, huge] = await runCases(
    [
      { id: "full", input: ["Range", 1, 20] },
      { id: "huge", input: ["Range", 1, 1_000_000] },
    ],
    { materialize: true },
  );
  expect(full?.value).toEqual(["List", ...Array.from({ length: 20 }, (_, i) => i + 1)]);
  expect(JSON.stringify(huge?.value).length).toBeLessThan(1000);
});

test("N(x, d) in one case leaves the working precision alone for the next", async () => {
  // One worker, so both cases share an engine: compute-engine's own `N(x, d)` leaves
  // `ce.precision` at `d`, and `1 - Erf(9.5)` only cancels to 0 at the default precision.
  const [, next] = await runCases(
    [
      { id: "high", input: ["N", ["Sinh", 1], 50] },
      { id: "next", input: ["Subtract", 1, ["Erf", 9.5]] },
    ],
    { concurrency: 1 },
  );
  // A float operand gives a float result: `0.0`, written `{ num: "0.0" }`.
  const value = next?.value as { num?: string } | number | undefined;
  expect(Number(typeof value === "object" ? value?.num : value)).toBe(0);
});

test("a per-case timeout stops only that case cooperatively, not the others in the batch", async () => {
  const results = await runCases(
    [
      { id: "a", input: ["Add", 1, 1] },
      { id: "slow", input: SLOW, timeMs: 50 },
      { id: "b", input: ["Add", 3, 3] },
    ],
    { concurrency: 3 },
  );
  const byId = new Map(results.map((r) => [r.id, r]));
  expect(byId.get("a")).toMatchObject({ outcome: "Evaluated", value: 2 });
  expect(byId.get("slow")).toMatchObject({ outcome: "Evaluated", value: "Aborted" });
  expect(byId.get("b")).toMatchObject({ outcome: "Evaluated", value: 6 });
});

test("a case that outgrows its memory cap crashes its worker and comes back Aborted, without taking the batch down", async () => {
  // A deeply nested unevaluated Plus builds a large expression tree with no arithmetic
  // shortcut to collapse it — cheap to describe, expensive to hold boxed in memory. Unlike
  // the cooperative timeMs case above, this genuinely kills the worker (no answer at all).
  const wide: unknown[] = ["List"];
  for (let i = 0; i < 2_000_000; i++) wide.push(["Hold", i]);

  const results = await runCases(
    [
      { id: "heavy", input: wide, memoryBytes: 8 * 1024 * 1024, timeMs: 10_000 },
      { id: "light", input: ["Add", 1, 1] },
    ],
    { concurrency: 2 },
  );
  const byId = new Map(results.map((r) => [r.id, r]));
  expect(byId.get("heavy")).toMatchObject({ outcome: "Aborted" });
  expect(byId.get("light")).toMatchObject({ outcome: "Evaluated", value: 2 });
});

test("an evaluation error comes back as its own outcome, distinct from Aborted", async () => {
  // compute-engine turns almost anything malformed into an `["Error", …]` MathJSON value
  // rather than throwing, so a genuine `ok: false` needs a head that actually raises --
  // ./fixtures/throws-setup.ts declares one. `runCases` must not collapse this into
  // "Aborted", the way a hard-killed timeout or worker crash does.
  const setup = new URL("./fixtures/throws-setup.ts", import.meta.url).href;
  const results = await runCases([{ id: "bad", input: ["Boom"] }], { setup });
  expect(results[0]!.outcome).toBe("Error");
  expect(results[0]!.reason).toContain("Boom");
});

test("a setup that fails to configure comes back as an Error naming it, not as an abort", async () => {
  const setup = new URL("./fixtures/broken-setup.ts", import.meta.url).href;
  const results = await runCases([{ id: "any", input: ["Add", 1, 1] }], { setup, timeMs: 10_000 });
  expect(results[0]!.outcome).toBe("Error");
  expect(results[0]!.reason).toContain("setup could not declare its heads");
});

test("runCases reuses workers from a pool passed in rather than closing it", async () => {
  const pool = createEvaluatorPool({ size: 2 });
  try {
    const first = await runCases([{ id: "a", input: ["Add", 1, 1] }], { pool });
    expect(first[0]).toMatchObject({ outcome: "Evaluated", value: 2 });

    // The pool must still be usable after runCases returns -- it does not own or close it.
    const second = await runCases([{ id: "b", input: ["Add", 2, 2] }], { pool });
    expect(second[0]).toMatchObject({ outcome: "Evaluated", value: 4 });
  } finally {
    pool.close();
  }
});

/** A fake `worker_threads.Worker` that reports "started" (so the real `timeMs` kill
 * timer arms) but never answers -- stands in for a tight, uncooperative loop the
 * cooperative deadline can't reach, so the host's own hard-kill path is exercised
 * deterministically and fast rather than waiting out the (much larger) spawn-timeout
 * guard (mirrors ./pool.test.ts and ./session.test.ts's own fakes for the same
 * scenario). */
function fakeHangingWorker(): NodeWorkerLike {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  const on = (event: string, listener: (...args: unknown[]) => void): void => {
    let set = listeners.get(event);
    if (set === undefined) listeners.set(event, (set = new Set()));
    set.add(listener);
  };
  return {
    postMessage: (message) => {
      const { id } = message as { id: number };
      for (const l of listeners.get("message") ?? []) l({ id, kind: "started" });
    },
    terminate: () => {},
    unref: () => {},
    ref: () => {},
    on,
    once: on,
    off: (event, listener) => listeners.get(event)?.delete(listener),
  };
}

test("a case's inferred free-symbol types don't reach the next case on the same worker", async () => {
  // One worker, so the second case is sure to run on the engine the first one typed.
  // `m + 1` types `m` a number; a later `Transpose(m)` would then collapse to `m`.
  const results = await runCases(
    [
      { id: "types-m", input: ["Add", "m", 1] },
      { id: "fresh-m", input: ["Transpose", "m"] },
    ],
    { concurrency: 1 },
  );
  expect(results[1]).toMatchObject({ id: "fresh-m", outcome: "Evaluated", value: ["Transpose", "m"] });
});

test("a case's fresh Solve parameter doesn't stay taken for the next case on the same worker", async () => {
  const solve = ["Solve", ["Equal", "x", "x"], "x"];
  const results = await runCases(
    [
      { id: "first", input: solve },
      { id: "second", input: solve },
    ],
    { concurrency: 1 },
  );
  expect(results.map((r) => r.value)).toEqual([
    ["List", "t"],
    ["List", "t"],
  ]);
});

test("a hard-killed case (no cooperative answer) reports outcome Aborted, not a value of Aborted", async () => {
  // Every worker this pool creates hangs (including the replacement after the kill), so
  // only the one case is run here -- ./pool.test.ts already covers a killed worker being
  // replaced by a real, usable one.
  const pool = createEvaluatorPool({ size: 1, createWorker: fakeHangingWorker });
  try {
    const results = await runCases([{ id: "hung", input: ["Add", 1, 1], timeMs: 5 }], { pool });
    // No worker ever answered "hung" -- it never produced any value, cooperative or
    // otherwise, so the OUTCOME itself is "Aborted" (not `value: "Aborted"`).
    expect(results[0]).toMatchObject({ id: "hung", outcome: "Aborted" });
    expect(results[0]!.value).toBeUndefined();
  } finally {
    pool.close();
  }
});

/** A fake worker that reports "started", then answers `2` after `answerAfterMs` (never, if
 * omitted). `cpu()` is its `cpuUsage` clock, in microseconds. */
function fakeCpuWorker(cpu: () => number, answerAfterMs?: number): NodeWorkerLike {
  const listeners = new Set<(message: unknown) => void>();
  return {
    postMessage: (message) => {
      const { id } = message as { id: number };
      for (const l of listeners) l({ id, kind: "started" });
      if (answerAfterMs === undefined) return;
      setTimeout(() => {
        for (const l of listeners) l({ id, kind: "result", ok: true, json: 2 });
      }, answerAfterMs);
    },
    terminate: () => {},
    unref: () => {},
    ref: () => {},
    on: (event, listener) => {
      if (event === "message") listeners.add(listener);
    },
    once: () => {},
    off: (_event, listener) => listeners.delete(listener as (message: unknown) => void),
    cpuUsage: () => ({ user: cpu(), system: 0 }),
  };
}

test("a worker that got little CPU time past the wall-clock budget is not killed", async () => {
  // timeMs 1 gives a 201 ms budget; the starved worker (CPU time frozen) answers at 350 ms.
  const pool = createEvaluatorPool({ size: 1, createWorker: () => fakeCpuWorker(() => 1_000, 350) });
  try {
    expect(await pool.evaluateDetailed(["Add", 1, 1], { timeMs: 1 })).toMatchObject({
      outcome: "Evaluated",
      value: 2,
    });
  } finally {
    pool.close();
  }
});

test("a worker whose CPU time tracks the wall clock is killed at its budget", async () => {
  const pool = createEvaluatorPool({ size: 1, createWorker: () => fakeCpuWorker(() => performance.now() * 1000) });
  try {
    expect((await pool.evaluateDetailed(["Add", 1, 1], { timeMs: 1 })).outcome).toBe("Aborted");
  } finally {
    pool.close();
  }
});

/** A fake worker whose `"started"` and answer come `startAfterMs` after the request (never, if
 * omitted), with `cpu()` as its `cpuUsage` clock in microseconds. */
function fakeSlowStartWorker(cpu: () => number, startAfterMs?: number): NodeWorkerLike {
  const listeners = new Set<(message: unknown) => void>();
  return {
    postMessage: (message) => {
      const { id } = message as { id: number };
      if (startAfterMs === undefined) return;
      setTimeout(() => {
        for (const l of listeners) l({ id, kind: "started" });
        for (const l of listeners) l({ id, kind: "result", ok: true, json: 2 });
      }, startAfterMs);
    },
    terminate: () => {},
    unref: () => {},
    ref: () => {},
    on: (event, listener) => {
      if (event === "message") listeners.add(listener);
    },
    once: () => {},
    off: (_event, listener) => listeners.delete(listener as (message: unknown) => void),
    cpuUsage: () => ({ user: cpu(), system: 0 }),
  };
}

test("a worker slow to start for want of CPU time is not replaced at the spawn budget", async () => {
  // Spawn budget 50 ms; the starved worker (CPU time frozen) starts at 120 ms, inside the 3x wall cap.
  const pool = createEvaluatorPool({
    size: 1,
    spawnTimeoutMs: 50,
    createWorker: () => fakeSlowStartWorker(() => 1_000, 120),
  });
  try {
    expect(await pool.evaluateDetailed(["Add", 1, 1], { timeMs: 10_000 })).toMatchObject({
      outcome: "Evaluated",
      value: 2,
    });
  } finally {
    pool.close();
  }
});

test("a worker that spends its spawn budget in CPU time without starting is replaced", async () => {
  const pool = createEvaluatorPool({
    size: 1,
    spawnTimeoutMs: 50,
    createWorker: () => fakeSlowStartWorker(() => performance.now() * 1000),
  });
  try {
    expect((await pool.evaluateDetailed(["Add", 1, 1], { timeMs: 10_000 })).outcome).toBe("Aborted");
  } finally {
    pool.close();
  }
});

test("a worker that never starts and uses no CPU is replaced at the wall-clock cap", async () => {
  const pool = createEvaluatorPool({
    size: 1,
    spawnTimeoutMs: 20,
    createWorker: () => fakeSlowStartWorker(() => 1_000),
  });
  try {
    expect((await pool.evaluateDetailed(["Add", 1, 1], { timeMs: 10_000 })).outcome).toBe("Aborted");
  } finally {
    pool.close();
  }
});
