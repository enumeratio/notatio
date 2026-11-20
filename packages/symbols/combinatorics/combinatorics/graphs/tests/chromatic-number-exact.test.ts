// `ChromaticNumber` and the heads built on it (`ChromaticCliqueGap`, `MinimumProperColoringCount`) are held to closed
// forms past the size at which the count of colorings stops fitting a double (2^53): the complete graph, cycles, a
// complete bipartite graph, the Petersen graph, and a complete graph with isolated vertices (whose subsets' independent
// sets number (1 + a) 2^b, so a power of them passes 2^53 while the edge count stays small). Random graphs are held to
// the independent backtracking reading. The deep run goes to the bound.

import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { SUBSET_LIMITS } from "../src/statistics.ts";
import { type Graph, GRAPH_READINGS } from "./graph-findstat-readings.ts";

const DEEP = process.env.DEEP_TESTS === "1";
const ce = bareEngine();
declareCombinatorics(ce);

const pairs = (n: number): [number, number][] =>
  Array.from({ length: n }, (_, i) => i + 1).flatMap((u) =>
    Array.from({ length: n - u }, (_, k) => [u, u + k + 1] as [number, number]),
  );
const complete = (n: number): Graph => ({ n, edges: pairs(n) });
const cycle = (n: number): Graph => ({ n, edges: pairs(n).filter(([u, v]) => v === u + 1 || (u === 1 && v === n)) });
const bipartite = (n: number): Graph => {
  const a = Math.floor(n / 2);
  return { n, edges: pairs(n).filter(([u, v]) => u <= a && v > a) };
};
/** The complete graph on `r` vertices and `s` isolated ones. */
const withIsolated = (r: number, s: number): Graph => ({ n: r + s, edges: pairs(r) });
const PETERSEN: Graph = {
  n: 10,
  edges: [
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [1, 5],
    [1, 6],
    [2, 7],
    [3, 8],
    [4, 9],
    [5, 10],
    [6, 8],
    [8, 10],
    [7, 10],
    [7, 9],
    [6, 9],
  ],
};
/** A seeded graph on `n` vertices with `m` edges. */
const randomGraph = (n: number, m: number, seed: number): Graph => {
  let state = seed;
  const next = (): number => (state = (Math.imul(state, 1103515245) + 12345) & 0x7fffffff) / 0x7fffffff;
  const all = pairs(n);
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [all[i], all[j]] = [all[j]!, all[i]!];
  }
  return { n, edges: all.slice(0, m).toSorted((a, b) => a[0] - b[0] || a[1] - b[1]) };
};
const value = (head: string, g: Graph): number =>
  ce
    .box([head, ["LabeledGraph", ["Tuple", g.n, ["List", ...g.edges.map(([u, v]) => ["List", u, v])]]]] as never)
    .evaluate().re;
const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));

const CHROMATIC_BOUND = SUBSET_LIMITS.ChromaticNumber!;

test("the bound is past the 12 vertices the sum of doubles answered, and past 2^53", () => {
  expect(CHROMATIC_BOUND).toBeGreaterThan(12);
  expect(SUBSET_LIMITS.ChromaticCliqueGap).toBe(CHROMATIC_BOUND);
});

test("the complete graph on 13 vertices needs 13 colors", () => {
  expect(value("ChromaticNumber", complete(13))).toBe(13);
});

test("cycles need 2 colors when even and 3 when odd, a complete bipartite graph 2, the Petersen graph 3", () => {
  const sizes = DEEP ? [13, 14, CHROMATIC_BOUND - 1, CHROMATIC_BOUND] : [13];
  for (const n of sizes) {
    expect(value("ChromaticNumber", cycle(n)), `C${n}`).toBe(n % 2 === 0 ? 2 : 3);
    expect(value("ChromaticNumber", bipartite(n)), `K bipartite ${n}`).toBe(2);
  }
  expect(value("ChromaticNumber", PETERSEN)).toBe(3);
});

// K_r and s isolated vertices: r colors, no gap to the clique number, and r! r^s colorings in r colors.
const FAMILY: [number, number][] = DEEP
  ? [3, 4, 5, 6].flatMap((r) => [0, 4, 8, 12 - r, 16 - r].map((s) => [r, s] as [number, number]))
  : [
      [4, 9],
      [5, 8],
    ];
test(
  "a complete graph with isolated vertices has chromatic number r, no clique gap and r! r^s minimum colorings",
  DEEP ? { timeout: 600_000 } : {},
  () => {
    for (const [r, s] of FAMILY) {
      const g = withIsolated(r, s);
      expect(value("ChromaticNumber", g), `K${r}+${s}`).toBe(r);
      expect(value("ChromaticCliqueGap", g), `K${r}+${s} gap`).toBe(0);
      expect(value("MinimumProperColoringCount", g), `K${r}+${s} count`).toBe(factorial(r) * r ** s);
    }
  },
);

test("random graphs on 13 vertices have the independent reading's chromatic number", () => {
  const read = GRAPH_READINGS.ChromaticNumber!;
  for (const [m, seed] of [
    [20, 1],
    [39, 2],
    [58, 3],
  ] as const) {
    const g = randomGraph(13, m, seed);
    expect(value("ChromaticNumber", g), `13 vertices ${m} edges`).toBe(read(g));
  }
});

if (DEEP) {
  test(
    "the complete graph on 14 to the bound needs as many colors as vertices, and one past the bound stays unevaluated",
    { timeout: 600_000 },
    () => {
      for (let n = 14; n <= CHROMATIC_BOUND; n++) {
        expect(value("ChromaticNumber", complete(n)), `K${n}`).toBe(n);
        expect(value("ChromaticCliqueGap", complete(n)), `K${n} gap`).toBe(0);
      }
      expect(value("ChromaticNumber", complete(CHROMATIC_BOUND + 1))).toBeNaN();
    },
  );

  test(
    "a complete graph with isolated vertices at the bound of the minimum coloring count (17 vertices)",
    { timeout: 600_000 },
    () => {
      for (const [r, s] of [
        [3, 14],
        [4, 13],
        [5, 12],
        [6, 11],
        [7, 10],
      ] as const)
        expect(value("MinimumProperColoringCount", withIsolated(r, s)), `K${r}+${s}`).toBe(factorial(r) * r ** s);
    },
  );

  test(
    "random graphs from 13 vertices to the bound have the independent reading's chromatic number",
    { timeout: 600_000 },
    () => {
      const read = GRAPH_READINGS.ChromaticNumber!;
      for (let n = 13; n <= CHROMATIC_BOUND; n++)
        for (const density of [0.2, 0.5, 0.8]) {
          const g = randomGraph(n, Math.round((density * n * (n - 1)) / 2), n * 7 + Math.round(density * 10));
          expect(value("ChromaticNumber", g), `${n} vertices density ${density}`).toBe(read(g));
          expect(value("ChromaticCliqueGap", g), `${n} vertices density ${density} gap`).toBe(
            value("ChromaticNumber", g) - GRAPH_READINGS.CliqueNumber!(g),
          );
        }
    },
  );
}
