// Compiled code runs synchronously and cannot be interrupted, and a statistic's `where` is what keeps it
// from a subject it would never return from (IndependenceNumber's is exponential). So for every compiled
// statistic with a `where`, a subject off its domain never reaches the compiled code, on every route that
// evaluates a statistic, and the call stays unevaluated.

import { bareEngine } from "@notatio/engine/testing";
import { operandsOf } from "@notatio/engine";
import { afterAll, beforeAll, expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../src/index.ts";
import { ALL_STATISTICS } from "../src/statistics/all.ts";
import { COMPILED } from "../src/statistics/compiled.ts";
import { inDomain } from "../src/statistics/declare.ts";
import { type Definition, signatureOf } from "../src/statistics/types.ts";

const DEEP = process.env.DEEP_TESTS === "1";
/** The standard run takes every Nth statistic; the deep run takes them all. */
const STRIDE = DEEP ? 1 : 3;

/** Statistics whose domain has no cheap subject just past it: the reason each is skipped. */
const SKIPPED: Readonly<Record<string, string>> = {};

const ce = bareEngine();
declareCombinatorics(ce);

const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i + 1);
const graph = (n: number, edges: [number, number][]): unknown => [
  "LabeledGraph",
  ["Tuple", n, ["List", ...edges.map((e) => ["List", ...e])]],
];
const edgeless = (n: number): unknown => graph(n, []);
const path = (n: number): unknown =>
  graph(
    n,
    range(n - 1).map((u) => [u, u + 1]),
  );
const antichain = (n: number): unknown => ["Poset", ["List", ...range(n).map(() => ["List"])]];

/** Cheap subjects, smallest first: past a vertex bound, past an edge bound, past a size bound or off the lattices. */
const CANDIDATES: Readonly<Record<string, readonly unknown[]>> = {
  LabeledGraph: [...range(21).map(edgeless), path(23), ...range(60).slice(21).map(edgeless)],
  Poset: range(30).map(antichain),
};

const inside = (definition: Definition, subject: unknown): boolean => {
  const boxed = ce.box(subject as never);
  return inDomain(ce, definition, operandsOf(boxed)[0] ?? boxed);
};

const compiled = ALL_STATISTICS.filter((d) => d.where !== undefined && COMPILED[signatureOf(d)] !== undefined);

/** Count the calls into each statistic's compiled code. The entry is read when the statistic is first
 *  evaluated, so the spies go in before anything is. */
const calls = new Map<string, number>();
const original = new Map<string, (typeof COMPILED)[string]>();

beforeAll(() => {
  for (const definition of compiled) {
    const key = signatureOf(definition);
    const entry = COMPILED[key]!;
    original.set(key, entry);
    COMPILED[key] = {
      hash: entry.hash,
      run: (sys, vars) => {
        calls.set(key, (calls.get(key) ?? 0) + 1);
        return entry.run(sys, vars);
      },
    };
  }
});

afterAll(() => {
  for (const [key, entry] of original) COMPILED[key] = entry;
});

const routes = (head: string, subject: unknown): Record<string, () => { json: unknown }> => ({
  evaluate: () => ce.box([head, subject] as never).evaluate(),
  N: () => ce.box([head, subject] as never).N(),
  CombinatorialStat: () => ce.box(["CombinatorialStat", subject, `'${head}'`] as never).evaluate(),
});

test("every carrier with a compiled, bounded statistic has candidate subjects", () => {
  expect(compiled.length).toBeGreaterThan(0);
  for (const carrier of new Set(compiled.map((d) => d.on))) expect(CANDIDATES[carrier], carrier).toBeDefined();
});

test("a compiled statistic with a where is never run on a subject off its domain, on any route", () => {
  const checked: string[] = [];
  const started = performance.now();
  for (const [i, definition] of compiled.entries()) {
    const key = signatureOf(definition);
    if (i % STRIDE !== 0 && SKIPPED[key] === undefined) continue;
    const subject = CANDIDATES[definition.on]!.find((candidate) => !inside(definition, candidate));
    if (subject === undefined) {
      expect(SKIPPED[key], `${key} has no subject off its domain among the candidates`).toBeDefined();
      continue;
    }
    if (SKIPPED[key] !== undefined) continue;
    for (const [route, run] of Object.entries(routes(definition.head, subject))) {
      const before = calls.get(key) ?? 0;
      const result = run();
      expect(calls.get(key) ?? 0, `${key} ${route}: compiled code ran off the domain`).toBe(before);
      expect(JSON.stringify(result.json), `${key} ${route}: stays unevaluated`).toContain(
        route === "CombinatorialStat" ? "CombinatorialStat" : definition.head,
      );
    }
    checked.push(key);
  }
  expect(checked.length).toBeGreaterThan(0);
  expect(performance.now() - started).toBeLessThan(30_000);
});

test("the spy sees the compiled code run on a subject in the domain", () => {
  // Without this the test above passes vacuously whenever the spy is not the code that runs.
  const small: Record<string, unknown> = { LabeledGraph: edgeless(3), Poset: antichain(3) };
  const lattice: Record<string, unknown> = { Poset: ["Poset", ["List", ["List"], ["List", 1], ["List", 2]]] };
  let seen = 0;
  for (const definition of compiled.filter((_, i) => i % STRIDE === 0)) {
    const key = signatureOf(definition);
    const subject = [small[definition.on], lattice[definition.on]].find(
      (candidate) => candidate !== undefined && inside(definition, candidate),
    );
    if (subject === undefined) continue;
    const before = calls.get(key) ?? 0;
    ce.box([definition.head, subject] as never).evaluate();
    if ((calls.get(key) ?? 0) > before) seen++;
  }
  expect(seen).toBeGreaterThan(0);
});
