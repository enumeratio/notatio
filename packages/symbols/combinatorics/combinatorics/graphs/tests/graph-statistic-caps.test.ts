// The size bounds of the graph statistics. A head that folds over the vertex orders answers through a number of vertices,
// and a head over the table of every subset of the edges through 21 edges (and a number of vertices): at the bound it has
// the value of its definition (the independent reading, where one is cheap enough), one size past it the call stays
// unevaluated on every route, promptly, with the compiled code present and absent.

import { bareEngine } from "@notatio/engine/testing";
import { operandsOf } from "@notatio/engine";
import { definitionHash } from "@notatio/engine/compiled";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { COMPILED, compiledStatistic } from "../../src/statistics/compiled.ts";
import { applyDefinition, inDomain } from "../../src/statistics/declare.ts";
import { bySignature, signatureOf, whereSignatureOf } from "../../src/statistics/types.ts";
import {
  EDGE_TABLE_HEADS,
  EDGE_TABLE_LIMIT,
  GRAPH_STATISTICS,
  SUBSET_LIMITS,
  VERTEX_LIMITS,
} from "../src/statistics.ts";
import { type Graph, GRAPH_READINGS } from "./graph-findstat-readings.ts";

const DEEP = process.env.DEEP_TESTS === "1";
const ce = bareEngine();
declareCombinatorics(ce);
const definitions = bySignature(GRAPH_STATISTICS);
const definitionOf = (head: string) => definitions.get(`${head}@LabeledGraph`)!;
const contents = (g: Graph): unknown => ["Tuple", g.n, ["List", ...g.edges.map(([u, v]) => ["List", u, v])]];
const call = (head: string, g: Graph): unknown => [head, ["LabeledGraph", contents(g)]];
const stat = (head: string, g: Graph): unknown => ["CombinatorialStat", ["LabeledGraph", contents(g)], `'${head}'`];
const inside = (head: string, g: Graph): boolean => {
  const subject = ce.box(["LabeledGraph", contents(g)] as never);
  return inDomain(ce, definitionOf(head), operandsOf(subject)[0] ?? subject);
};

const pairs = (n: number): [number, number][] =>
  Array.from({ length: n }, (_, i) => i + 1).flatMap((u) =>
    Array.from({ length: n - u }, (_, k) => [u, u + k + 1] as [number, number]),
  );
const edgeless = (n: number): Graph => ({ n, edges: [] });
const complete = (n: number): Graph => ({ n, edges: pairs(n) });
const bipartite = (n: number): Graph => {
  const a = Math.floor(n / 2);
  return { n, edges: pairs(n).filter(([u, v]) => u <= a && v > a) };
};
const triangles = (n: number): Graph => ({
  n,
  edges: pairs(n).filter(
    ([u, v]) => Math.floor((u - 1) / 3) === Math.floor((v - 1) / 3) && Math.floor((u - 1) / 3) < Math.floor(n / 3),
  ),
});
const matching = (n: number): Graph => ({ n, edges: pairs(n).filter(([u, v]) => v === u + 1 && u % 2 === 1) });
const cycle = (n: number): Graph => ({ n, edges: pairs(n).filter(([u, v]) => v === u + 1 || (u === 1 && v === n)) });
const path = (n: number): Graph => ({ n, edges: pairs(n).filter(([u, v]) => v === u + 1) });
/** The graphs the bounds are measured on: the edgeless, complete, complete bipartite, triangles, edges, cycle and path graphs. */
const WORST = { edgeless, complete, bipartite, triangles, matching, cycle, path };

/** The vertices each head that folds over the vertex orders or over the subsets, paths and cycles of the vertices answers through. */
const LIMITS: Readonly<Record<string, number>> = { ...VERTEX_LIMITS, ...SUBSET_LIMITS };
const vertexHeads = Object.keys(LIMITS);
const tableHeads = Object.keys(EDGE_TABLE_HEADS);
const capped = [...vertexHeads, ...tableHeads];
const reading = (head: string): ((g: Graph) => number) => GRAPH_READINGS[head]!;

test("each bounded head is a graph statistic with a bound, and every head over the edge-subset table is bounded", () => {
  expect(new Set(capped).size).toBe(capped.length);
  for (const head of capped) expect(definitionOf(head)?.where, head).toBeDefined();
  // The table's fold runs over 0 .. the number of edges.
  const tabulating = GRAPH_STATISTICS.filter((d) => JSON.stringify(d.expr).includes('"Range",0,["Length","edges"]'))
    .map((d) => d.head)
    .toSorted();
  expect(tableHeads.toSorted()).toEqual(tabulating);
});

test("a graph on 7 vertices (21 edges at most) is in every table head's domain", () => {
  for (const head of tableHeads) expect(inside(head, complete(7)), head).toBe(true);
});

// A definition whose source changed has a stale verdict row until it is collected again, and the build then leaves it out of
// the compiled table, so it runs interpreted (seconds a call).
test("the faster definitions and the six spectrum heads are in the compiled table, with the current source", () => {
  const heads = [
    "Girth",
    "MaximumDistance",
    "MinimumEccentricity",
    "TriangleFreeEdgeDeletionNumber",
    "DistinguishingNumber",
    "DistinctEigenvalueCount",
    "MaximumEigenvalueMultiplicity",
    "DistinctLaplacianEigenvalueCount",
    "MaximumLaplacianEigenvalueMultiplicity",
    "DistinctDistanceLaplacianEigenvalueCount",
    "MaximumDistanceLaplacianEigenvalueMultiplicity",
  ];
  for (const head of heads) {
    const definition = definitionOf(head);
    expect(COMPILED[signatureOf(definition)]?.hash, head).toBe(definitionHash(definition.expr));
  }
});

// No timing: the compiled entry itself carries the infinity, so the answer never falls back to the interpreter, which takes
// seconds on these graphs. Each answers a forest or a disconnected graph as `PositiveInfinity` and a graph without that
// case as a number, from the compiled code alone.
test("Girth, MaximumDistance and MinimumEccentricity answer compiled on a forest and on a disconnected graph", () => {
  const forests = [
    edgeless(5),
    path(6),
    matching(6),
    {
      n: 5,
      edges: [
        [1, 2],
        [3, 4],
      ] as [number, number][],
    },
  ];
  const disconnected = [
    edgeless(4),
    matching(6),
    triangles(6),
    {
      n: 5,
      edges: [
        [1, 2],
        [3, 4],
      ] as [number, number][],
    },
  ];
  const cases: [string, Graph[], Graph[]][] = [
    ["Girth", forests, [complete(5), cycle(6), triangles(6)]],
    ["MaximumDistance", disconnected, [path(6), complete(5), cycle(6)]],
    ["MinimumEccentricity", disconnected, [path(6), complete(5), cycle(6)]],
  ];
  for (const [head, infinite, finite] of cases) {
    const definition = definitionOf(head);
    expect(COMPILED[signatureOf(definition)]?.infinite, head).toEqual(["PositiveInfinity"]);
    const compiled = compiledStatistic(ce, definition)!;
    expect(compiled, head).toBeDefined();
    for (const g of infinite) expect(compiled(contents(g)), `${head} ${JSON.stringify(g)}`).toBe("PositiveInfinity");
    for (const g of finite) {
      const answer = compiled(contents(g));
      expect(typeof answer, `${head} ${JSON.stringify(g)}`).toBe("number");
      expect(answer, `${head} ${JSON.stringify(g)}`).toBe(reading(head)(g));
    }
  }
});

test("TriangleFreeEdgeDeletionNumber and DistinguishingNumber answer at their bound by closed forms", () => {
  const value = (head: string, g: Graph) => ce.box(call(head, g) as never).evaluate().re;
  // Turan: a complete graph keeps floor(n^2 / 4) edges.
  for (let n = 3; n <= 7; n++) {
    expect(value("TriangleFreeEdgeDeletionNumber", complete(n)), `K${n}`).toBe(
      (n * (n - 1)) / 2 - Math.floor((n * n) / 4),
    );
    expect(value("TriangleFreeEdgeDeletionNumber", bipartite(n)), `bipartite ${n}`).toBe(0);
  }
  // Every vertex of an edgeless or a complete graph needs a color of its own; a cycle or a path on 6 or more vertices needs 2.
  expect(value("DistinguishingNumber", edgeless(7))).toBe(7);
  expect(value("DistinguishingNumber", complete(7))).toBe(7);
  expect(value("DistinguishingNumber", cycle(7))).toBe(2);
  expect(value("DistinguishingNumber", path(7))).toBe(2);
});

test("a vertex fold is in its domain at its bound and out of it one vertex past", () => {
  for (const head of vertexHeads) {
    const limit = LIMITS[head]!;
    expect(inside(head, complete(limit)), head).toBe(true);
    expect(inside(head, path(limit)), head).toBe(true);
    for (const g of [complete(limit + 1), path(limit + 1), cycle(limit + 1)]) expect(inside(head, g), head).toBe(false);
  }
});

test("a table head is in its domain at 21 edges and its vertex bound, out of it one edge or one vertex past", () => {
  for (const head of tableHeads) {
    const vertices = EDGE_TABLE_HEADS[head]!;
    // 21 edges on `vertices` vertices: a path and chords while the vertices are few, else a path and disjoint edges.
    const edges: [number, number][] = [];
    for (let i = 1; i < Math.min(vertices, 22); i++) edges.push([i, i + 1]);
    for (let i = 1; edges.length < EDGE_TABLE_LIMIT; i++)
      for (let j = i + 2; j <= vertices && edges.length < EDGE_TABLE_LIMIT; j++) edges.push([i, j]);
    expect(edges.length, head).toBe(EDGE_TABLE_LIMIT);
    expect(inside(head, { n: vertices, edges }), head).toBe(true);
    expect(inside(head, { n: vertices, edges: [...edges, [vertices - 1, vertices]] }), head).toBe(false);
    expect(inside(head, { n: vertices + 1, edges: edges.slice(0, 5) }), head).toBe(false);
  }
});

/** One graph past the bound of each kind: more vertices than a vertex fold takes, more edges (or vertices) than a table head. */
const pastBound = (head: string): Graph[] =>
  LIMITS[head] !== undefined
    ? [edgeless(LIMITS[head]! + 1), complete(LIMITS[head]! + 1)]
    : [path(23), { n: EDGE_TABLE_HEADS[head]! + 1, edges: [] }];

for (const compiled of [true, false]) {
  test(`${compiled ? "with" : "without"} compiled code, a call one size past its bound stays unevaluated, promptly, on every route`, () => {
    const held = capped.flatMap((head) =>
      [signatureOf(definitionOf(head)), whereSignatureOf(definitionOf(head))].map(
        (key) => [key, COMPILED[key]] as const,
      ),
    );
    if (!compiled) for (const [key] of held) delete COMPILED[key];
    const started = performance.now();
    for (const head of capped)
      for (const g of pastBound(head)) {
        const plain = ce.box(call(head, g) as never);
        expect(plain.evaluate().json, head).toEqual(plain.json);
        expect(plain.N().json, head).toEqual(plain.json);
        const table = ce.box(stat(head, g) as never);
        expect(JSON.stringify(table.evaluate().json), head).toContain(`CombinatorialStat`);
        expect(JSON.stringify(table.N().json), head).toContain(`CombinatorialStat`);
      }
    const elapsed = performance.now() - started;
    for (const [key, entry] of held) if (entry !== undefined) COMPILED[key] = entry;
    expect(elapsed).toBeLessThan(30_000);
  });
}

/**
 * A head whose bound is past the size the independent reading reaches (`reads`, measured: the reading agrees on the
 * eight worst graphs through it and no further, for its time or for the spread of its subsets into `Math.max`): its
 * value on the complete graph and on a path, which the bound is held to instead. `why` is the reason of each form.
 */
interface ClosedForm {
  reads: number;
  complete: (n: number) => number;
  /** The path on n vertices, n at least 2. */
  path: (n: number) => number;
  why: string;
}
const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));
const alternating = (n: number): number => (n % 2 === 0 ? 1 : -1);
const CLOSED_FORMS: Record<string, ClosedForm> = {
  MatchingNumber: {
    reads: 11,
    complete: (n) => Math.floor(n / 2),
    path: (n) => Math.floor(n / 2),
    why: "pair the vertices in order",
  },
  SpanningTreeCount: {
    reads: 8,
    complete: (n) => n ** (n - 2),
    path: () => 1,
    why: "Cayley's n^(n-2); a tree has one",
  },
  GraphEdgeConnectivity: {
    reads: 8,
    complete: (n) => n - 1,
    path: () => 1,
    why: "a vertex of K_n has n - 1 edges; a path has a bridge",
  },
  AdjacencyDeterminant: {
    reads: 11,
    complete: (n) => alternating(n - 1) * (n - 1),
    path: (n) => (n % 2 === 0 ? alternating(n / 2) : 0),
    why: "the eigenvalues of K_n are n - 1 and -1 (n - 1 times); a path matches, or is singular for odd n",
  },
  AbsoluteAdjacencyDeterminant: {
    reads: 11,
    complete: (n) => n - 1,
    path: (n) => (n % 2 === 0 ? 1 : 0),
    why: "the absolute value of the adjacency determinant's closed form",
  },
  Girth: {
    reads: 9,
    complete: (n) => (n >= 3 ? 3 : Infinity),
    path: () => Infinity,
    why: "K_n has a triangle from 3 vertices; a path is a forest, which has no cycle",
  },
  GraphLongestCycleLength: {
    reads: 9,
    complete: (n) => (n >= 3 ? n : 0),
    path: () => 0,
    why: "K_n has a Hamiltonian cycle; a path has none",
  },
  ShortestMaximalPathLength: {
    reads: 8,
    complete: (n) => n - 1,
    path: (n) => n - 1,
    why: "a maximal path of K_n or of a path visits every vertex",
  },
  AcyclicOrientationCount: {
    reads: 7,
    complete: factorial,
    path: (n) => 2 ** (n - 1),
    why: "the orders of K_n's vertices (Stanley's chromatic polynomial at -1); a tree orients freely",
  },
  DistanceMatrixDeterminant: {
    reads: 11,
    complete: (n) => alternating(n - 1) * (n - 1),
    path: (n) => alternating(n - 1) * (n - 1) * 2 ** (n - 2),
    why: "Graham and Pollak: a tree's is (-1)^(n-1) (n - 1) 2^(n-2), and K_n's is (-1)^(n-1) (n - 1)",
  },
};

test("a closed form is the reading's value on the complete graph and on a path (up to 5 vertices; 7 deep), and the compiled one at 6", () => {
  for (const [head, form] of Object.entries(CLOSED_FORMS)) {
    expect(LIMITS[head], head).toBeGreaterThan(form.reads);
    for (let n = 2; n <= (DEEP ? 7 : 5); n++) {
      expect(form.complete(n), `${head} complete ${n}`).toBe(reading(head)(complete(n)));
      expect(form.path(n), `${head} path ${n}`).toBe(reading(head)(path(n)));
    }
    expect(ce.box(call(head, complete(6)) as never).evaluate().re, head).toBe(form.complete(6));
    expect(ce.box(call(head, path(6)) as never).evaluate().re, head).toBe(form.path(6));
  }
});

if (DEEP)
  test(
    "at its bound a head past its reading's reach has the closed form's value, on the complete graph and on a path",
    { timeout: 1_800_000 },
    () => {
      for (const [head, form] of Object.entries(CLOSED_FORMS)) {
        const n = LIMITS[head]!;
        expect(ce.box(call(head, complete(n)) as never).evaluate().re, `${head} complete ${n}`).toBe(form.complete(n));
        expect(ce.box(call(head, path(n)) as never).evaluate().re, `${head} path ${n}`).toBe(form.path(n));
      }
    },
  );

// A new statistic is bounded, listed as one that grows polynomially (and timed here), or left for the maintainers: a
// head with no bound that is in no list fails, so every graph statistic is classified.
/** The statistics whose cost is polynomial: the slowest, `BridgeCount`, takes 0.25 s on the complete graph on 32 vertices. */
const POLYNOMIAL = [
  "GraphEdgeCount",
  "MaximumDegree",
  "MinimumDegree",
  "EvenDegreeVertexCount",
  "OddDegreeVertexCount",
  "GraphLeafCount",
  "DegreeTwoVertexCount",
  "IsolatedVertexCount",
  "FirstZagrebIndex",
  "SecondZagrebIndex",
  "ForgottenIndex",
  "OreDegree",
  "TotalIrregularity",
  "AlbertsonIndex",
  "MaximumDegreeVertexCount",
  "TriangleCount",
  "TriangleVertexCount",
  "InducedPathOnThreeVerticesCount",
  "WienerIndex",
  "DistanceTwoPairCount",
  "DistanceThreePairCount",
  "DistanceFourPairCount",
  "GraphComponentCount",
  "ComplementComponentCount",
  "CutVertexCount",
  "BridgeCount",
  "CyclomaticNumber",
  "DegreeRange",
  "MaximumDegreeMultiplicity",
  "SmallestMissingDegree",
  "DistinctNeighborhoodCount",
  "SzegedIndex",
  "SchultzIndex",
  "GutmanIndex",
  "HyperWienerIndex",
  "CenterVertexCount",
  "SpanningSubgraphCount",
  "DegreeSum",
  "EulerFaceCount",
  "BlockCount",
  "MaximumNeighborhoodMultiplicity",
  "CenterEdgeCount",
  "SameNeighborhoodPairCount",
  "HalfAlbertsonIndex",
  "HalfTotalIrregularity",
  "CelebrityCount",
  "KingCount",
  "AboveAverageDegreeVertexCount",
  "DifferentDegreePairCount",
  "MaximumLeafNeighborCount",
  "NonTriangleVertexCount",
  "AdjacencyPositiveEigenvalueCount",
  "AdjacencyNegativeEigenvalueCount",
  "AdjacencyNullity",
  "AdjacencyRank",
  "NullspaceZeroColumnCount",
  "NullspaceDistinctColumnCount",
  "GraphSignature",
  "NegativeEigenvaluePairGap",
  "GraphEulerCharacteristic",
  "SzegedWienerGap",
  "PadmakarIvanIndex",
];
/**
 * `MaximumDistance` and `MinimumEccentricity` write `PositiveInfinity` for a graph with two components, and `Girth` for a
 * forest (a bounded head, above). The compiled code answers each in milliseconds: Floyd-Warshall is n^3 with an
 * intermediate of at most 4n (the 2n of a pair with no path, and sums of two), neither walks subsets, and their definitions
 * carry the compiled infinity flag, so they need no bound.
 */
const POLYNOMIAL_WITH_INFINITY = ["MaximumDistance", "MinimumEccentricity"];

test("every graph statistic is bounded or listed as polynomial", () => {
  const heads = GRAPH_STATISTICS.map((d) => d.head);
  const known = new Set([...capped, ...POLYNOMIAL, ...POLYNOMIAL_WITH_INFINITY]);
  expect(heads.filter((head) => !known.has(head))).toEqual([]);
  for (const head of [...POLYNOMIAL, ...POLYNOMIAL_WITH_INFINITY]) {
    expect(heads, head).toContain(head);
    expect(capped, head).not.toContain(head);
  }
});

test(`the polynomial statistics answer on ${DEEP ? "the complete and the edgeless graph on 24" : "the complete graph on 10"} vertices within 5 seconds in all`, () => {
  const graphs = DEEP ? [complete(24), edgeless(24)] : [complete(10)];
  const started = performance.now();
  for (const head of POLYNOMIAL)
    for (const g of graphs) expect(Number.isFinite(ce.box(call(head, g) as never).evaluate().re), head).toBe(true);
  // A graph with two components has an infinite diameter and radius; the call still answers.
  for (const head of POLYNOMIAL_WITH_INFINITY)
    for (const g of graphs) {
      const answer = ce.box(call(head, g) as never).evaluate().re;
      expect(g.edges.length === 0 ? answer === Infinity : Number.isFinite(answer), head).toBe(true);
    }
  expect(performance.now() - started).toBeLessThan(DEEP ? 15_000 : 5_000);
});

// At the bound the head gives its definition's value, which the independent reading shares: the standard run takes the
// bounds' graphs at up to 5 vertices (and a few with 8 for the table heads), the deep run at the bound itself, or at
// the size the reading reaches where the bound is held to a closed form.
const sizeToRead = (head: string): number =>
  DEEP ? (CLOSED_FORMS[head]?.reads ?? LIMITS[head]!) : Math.min(5, LIMITS[head]!);
for (const head of vertexHeads)
  test(
    `${head} gives its reading at ${DEEP ? "its bound" : "5 vertices"}, by every route`,
    DEEP ? { timeout: 3_600_000 } : {},
    () => {
      const n = sizeToRead(head);
      // The deep run reads two of the seven worst graphs, the complete graph alone for a pattern on four positions: the
      // reading takes as long as n! orders (25 s at 8 vertices) a graph.
      const names = (
        DEEP ? (/Outerplanar|ThreeColorable/.test(head) ? ["complete"] : ["complete", "bipartite"]) : Object.keys(WORST)
      ) as (keyof typeof WORST)[];
      let read = 0;
      for (const name of names) {
        const g = WORST[name](n);
        if (!inside(head, g)) continue;
        read++;
        const expected = reading(head)(g);
        expect(ce.box(call(head, g) as never).evaluate().re, `${head} ${name} ${n}`).toBe(expected);
        expect(applyDefinition(ce, definitionOf(head), ce.box(contents(g) as never)).re, `${head} ${name} ${n}`).toBe(
          expected,
        );
        if (!DEEP) {
          expect(ce.box(call(head, g) as never).N().re, `${head} ${name} ${n} N`).toBe(expected);
          expect(ce.box(stat(head, g) as never).evaluate().re, `${head} ${name} ${n} stat`).toBe(expected);
        }
      }
      expect(read).toBeGreaterThan(0);
    },
  );

for (const head of tableHeads)
  test(
    `${head} gives its reading on graphs with 8 vertices or fewer, by every route${DEEP ? ", and its definition's value at 21 edges" : ""}`,
    DEEP ? { timeout: 1_800_000 } : {},
    () => {
      for (const g of [complete(5), cycle(8), path(8), matching(8)]) {
        const expected = reading(head)(g);
        expect(ce.box(call(head, g) as never).evaluate().re, `${head} ${JSON.stringify(g)}`).toBe(expected);
        expect(ce.box(call(head, g) as never).N().re, `${head} N`).toBe(expected);
        expect(ce.box(stat(head, g) as never).evaluate().re, `${head} stat`).toBe(expected);
      }
      // 21 edges: the complete graph on 7 vertices, which every table head answers.
      if (DEEP) {
        const g = complete(7);
        const answered = ce.box(call(head, g) as never).evaluate().re;
        expect(answered, head).toBe(applyDefinition(ce, definitionOf(head), ce.box(contents(g) as never)).re);
        expect(Number.isFinite(answered), head).toBe(true);
      }
    },
  );
