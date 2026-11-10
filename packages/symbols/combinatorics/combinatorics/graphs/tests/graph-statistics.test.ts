import { bareEngine } from "@enumeratio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { applyDefinition } from "../../src/statistics/declare.ts";
import { bySignature } from "../../src/statistics/types.ts";
import { GRAPH_STATISTICS } from "../src/statistics.ts";
import { type Graph, GRAPH_READINGS } from "./graph-findstat-readings.ts";

// The whole library, as a page evaluates it.
const ce = bareEngine();
declareCombinatorics(ce);
const index = bySignature(GRAPH_STATISTICS);
const DEEP = process.env.DEEP_TESTS === "1";

// The second batch's heads (bitmask, path and distance folds) take 1 to 9 s a graph to interpret, so the standard run
// reads fewer graphs of them and the deep run reads as many as the first batch's.
const BATCH_TWO = new Set([
  "MinimumVertexCoverCount",
  "SpanningTreeCount",
  "AdjacencyDeterminant",
  "DegreeRange",
  "MaximumDegreeMultiplicity",
  "SmallestMissingDegree",
  "DistinctNeighborhoodCount",
  "SzegedIndex",
  "SchultzIndex",
  "GutmanIndex",
  "HyperWienerIndex",
  "CenterVertexCount",
  "Girth",
  "GraphLongestCycleLength",
  "GraphCycleCount",
  "LongestPathLength",
  "MaximumCutSize",
  "BipartiteEdgeDeletionNumber",
  "PerfectMatchingCount",
  "InducedMatchingNumber",
  "DominationNumber",
  "DominatingSetCount",
  "MinimalDominatingSetCount",
  "UpperDominationNumber",
  "IndependentDominationNumber",
  "GraphDifferential",
  "Degeneracy",
  "DissociationNumber",
  "GraphVertexConnectivity",
  "InducedFourCycleCount",
  "AdjacencyPositiveEigenvalueCount",
  "AdjacencyNegativeEigenvalueCount",
  "AdjacencyNullity",
  "AdjacencyRank",
  "GraphSignature",
  "NegativeEigenvaluePairGap",
  "LaplacianPositiveEigenvalueCount",
  "DistinctEigenvalueCount",
  "DistinctLaplacianEigenvalueCount",
  "MaximumEigenvalueMultiplicity",
  "MaximumLaplacianEigenvalueMultiplicity",
  "AltshulerSteinbergDeterminant",
  "AltshulerSteinbergQuarter",
  "DistanceMatrixDeterminant",
  "DistinctDistanceLaplacianEigenvalueCount",
  "MaximumDistanceLaplacianEigenvalueMultiplicity",
  "NullspaceZeroColumnCount",
  "NullspaceDistinctColumnCount",
  "ClosedVertexSetCount",
  "MaximumDissociationSetCount",
  "HalfDominatingNonblockingSetCount",
  "CommonIndependenceNumber",
  "RestrainedDominationNumber",
  "UpperIrredundanceNumber",
  "IrredundanceNumber",
  "ProperSeparationCount",
  "ConvexVertexSetCount",
  "NonconvexVertexSetCount",
  "SzegedWienerGap",
  "PadmakarIvanIndex",
  "TwoPackingDifferential",
  "GeneralPositionNumber",
]);
const thinned = (head: string): boolean => BATCH_TWO.has(head) && !DEEP;

/** Every labeled graph on n vertices. */
function graphs(n: number): Graph[] {
  const pairs: [number, number][] = [];
  for (let u = 1; u <= n; u++) for (let v = u + 1; v <= n; v++) pairs.push([u, v]);
  return Array.from({ length: 2 ** pairs.length }, (_, mask) => ({
    n,
    edges: pairs.filter((_, k) => (mask >> k) & 1),
  }));
}
/** The graph with its vertex v renamed `relabeling[v - 1]`, the edges in order. */
function relabel(g: Graph, relabeling: readonly number[]): Graph {
  const edges = g.edges
    .map(([u, v]) => [relabeling[u - 1]!, relabeling[v - 1]!].toSorted((a, b) => a - b) as [number, number])
    .toSorted((a, b) => a[0] - b[0] || a[1] - b[1]);
  return { n: g.n, edges };
}
/** A permutation of 1 .. n from a seed, by a linear congruential shuffle. */
function shuffled(n: number, seed: number): number[] {
  const p = Array.from({ length: n }, (_, i) => i + 1);
  let s = seed;
  for (let i = n - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j]!, p[i]!];
  }
  return p;
}
const contents = (g: Graph): unknown => ["Tuple", g.n, ["List", ...g.edges.map(([u, v]) => ["List", u, v])]];
const evaluate = (head: string, g: Graph): number =>
  applyDefinition(ce, index.get(`${head}@LabeledGraph`)!, ce.box(contents(g) as never)).re;

test("the graphs are counted", () => {
  expect([0, 1, 2, 3, 4].map((n) => graphs(n).length)).toEqual([1, 1, 2, 8, 64]);
});

test("every graph definition has an independent reading", () => {
  const heads = GRAPH_STATISTICS.filter((d) => d.on === "LabeledGraph").map((d) => d.head);
  for (const head of heads) expect(GRAPH_READINGS[head], head).toBeDefined();
  expect(heads.toSorted()).toEqual(Object.keys(GRAPH_READINGS).toSorted());
});

for (const [head, expected] of Object.entries(GRAPH_READINGS))
  test(`${head} agrees over every graph on 0..4 vertices`, () => {
    // Thinned: every graph to 3 vertices, every eighth on 4.
    const all = thinned(head)
      ? [0, 1, 2, 3, 4].flatMap((n) => graphs(n).filter((_, i) => n < 4 || i % 8 === 0))
      : [0, 1, 2, 3, 4].flatMap(graphs);
    for (const g of all) expect(evaluate(head, g), JSON.stringify(g)).toBe(expected(g));
  });

// A statistic is a property of the graph, not of its labeling: a few graphs of each size up to 6, each renamed.
for (const [head, expected] of Object.entries(GRAPH_READINGS))
  test(`${head} is the same after relabeling, and agrees, on graphs of 1..6 vertices`, () => {
    for (let n = 1; n <= 6; n++) {
      const all = graphs(n);
      // Thinned: two graphs of each size to 4, one of 5, none of 6.
      for (let k = 0; k < (thinned(head) ? (n <= 4 ? 2 : n === 5 ? 1 : 0) : 4); k++) {
        const g = all[Math.floor(((k * 7 + 3) * all.length) / 29) % all.length]!;
        const renamed = relabel(g, shuffled(n, 31 * n + k));
        expect(evaluate(head, g), JSON.stringify(g)).toBe(expected(g));
        expect(evaluate(head, renamed), JSON.stringify(renamed)).toBe(evaluate(head, g));
      }
    }
  });

for (const [head, expected] of Object.entries(GRAPH_READINGS))
  test(`${head} called on the carrier value gives the reading`, () => {
    for (const g of [0, 1, 2, 3].flatMap((n) => graphs(n).filter((_, i) => !thinned(head) || i % 2 === 0)))
      expect(ce.box([head, ["LabeledGraph", contents(g)]] as never).evaluate().re, `${head} ${JSON.stringify(g)}`).toBe(
        expected(g),
      );
  });

test("CombinatorialStat reads the elements of LabeledGraphs", () => {
  const tally = ce
    .box(["Tally", ["CombinatorialStat", ["LabeledGraphs", 3], "'GraphEdgeCount'"]] as never)
    .evaluate().json;
  expect(tally).toEqual(["Tuple", ["List", 0, 1, 2, 3], ["List", 1, 3, 3, 1]]);
});

// Sizes 5 and 6 in full run nightly (DEEP_TESTS=1).
test.skipIf(!DEEP)(
  "every graph definition agrees over the graphs on 5 vertices and every eighth on 6",
  () => {
    // The second batch's heads: every sixteenth graph on 5 vertices and every 256th on 6.
    for (const [head, expected] of Object.entries(GRAPH_READINGS)) {
      const slow = BATCH_TWO.has(head);
      const all = [
        ...graphs(5).filter((_, i) => !slow || i % 16 === 0),
        ...graphs(6).filter((_, i) => i % (slow ? 256 : 8) === 0),
      ];
      for (const g of all) expect(evaluate(head, g), `${head} ${JSON.stringify(g)}`).toBe(expected(g));
    }
  },
  1_800_000,
);
