// UnlabeledGraphs, CanonicalGraph and IsIsomorphicGraph's canonical route, through the engine: every route that reaches
// them (`evaluate()`, `.N()`) answers alike, the kernel gives the definition's answers where the definition is
// reachable, and a question past the kernel's reach stays unevaluated.

import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { familyHash, kernelOn } from "../../collections/src/families/epsil.ts";
import { COMPILED_FAMILIES } from "../../collections/src/families/compiled-families.generated.js";
import { CARRIERS, declareCombinatorics, declareMaps, evaluateDefinition, MAPS } from "../../src/index.ts";
import { COMPILED_MAPS } from "../../src/compiled-maps.generated.js";
import { fastDefinition, mapKey } from "../../src/compiled.ts";
import { adjacencyOf, canonicalBlocks, edgesOfRank, canonicalRanks } from "../src/canonical.ts";
import { entries } from "../src/families/core.ts";
import { canonicalGraphKernel } from "../src/maps.ts";

const DEEP = process.env.DEEP_TESTS === "1";
const ce = bareEngine();
declareCombinatorics(ce);
declareMaps(ce, Object.fromEntries(CARRIERS.map((c) => [c.type, c.name])));

const graph = (n: number, edges: number[][]): unknown => [
  "LabeledGraph",
  ["Tuple", n, ["List", ...edges.map((edge) => ["List", ...edge])]],
];
const evaluate = (json: unknown): unknown => ce.box(json as never).evaluate().json;
const numeric = (json: unknown): unknown => ce.box(json as never).N().json;

const family = entries.find((f) => f.head === "UnlabeledGraphs")!;
const fast = kernelOn(ce, family);

test("UnlabeledGraphs(n) lists the canonical graphs, ascending, and rank inverts unrank", () => {
  for (let n = 0; n <= 6; n++) {
    const count = Number(fast.count([n]));
    expect(count).toBe(canonicalRanks(n)!.length);
    for (let r = 0; r < count; r++) {
      const element = fast.unrank([n], BigInt(r));
      expect([n, r, element]).toEqual([n, r, edgesOfRank(n, canonicalRanks(n)![r])]);
      expect([n, r, fast.valid(element, [n])]).toEqual([n, r, true]);
      expect([n, r, fast.rank(element, [n])]).toEqual([n, r, BigInt(r)]);
    }
  }
});

test("a labeled graph is a member exactly when it is its own canonical form, edges in either order", () => {
  const n = 4;
  const members = new Set(canonicalRanks(n)!);
  for (let rank = 0; rank < 2 ** 6; rank++) {
    const edges = edgesOfRank(n, rank);
    expect([rank, fast.valid(edges, [n])]).toEqual([rank, members.has(rank)]);
    expect([rank, fast.valid(edges.toReversed(), [n])]).toEqual([rank, members.has(rank)]);
    expect([
      rank,
      fast.valid(
        edges.map(([u, v]) => [v, u]),
        [n],
      ),
    ]).toEqual([rank, members.has(rank)]);
    if (!members.has(rank)) expect(fast.rank(edges, [n])).toBe(-1n);
  }
  // Not a graph on [4] at all: a loop, a repeated edge, a vertex out of range.
  for (const bad of [
    [[1, 1]],
    [
      [1, 2],
      [2, 1],
    ],
    [[1, 5]],
    [[0, 2]],
    [[1, 2, 3]],
  ])
    expect(fast.valid(bad, [n])).toBe(false);
});

test("UnlabeledGraphs through the engine: counts, elements and the decline past 8 vertices", () => {
  for (const [n, count] of [
    [0, 1],
    [1, 1],
    [2, 2],
    [3, 4],
    [4, 11],
    [5, 34],
    [6, 156],
    [7, 1044],
  ] as const) {
    expect(evaluate(["Count", ["UnlabeledGraphs", n]])).toBe(count);
    expect(numeric(["Count", ["UnlabeledGraphs", n]])).toBe(count);
  }
  expect(evaluate(["At", ["UnlabeledGraphs", 4], 4])).toEqual(
    graph(4, [
      [1, 2],
      [1, 3],
      [1, 4],
    ]),
  );
  expect(evaluate(["At", ["UnlabeledGraphs", 4], 11])).toEqual(
    graph(4, [
      [1, 2],
      [1, 3],
      [1, 4],
      [2, 3],
      [2, 4],
      [3, 4],
    ]),
  );
  // Past 8 vertices the collection stays as it is, instead of trying 2^36 graphs.
  expect(evaluate(["Count", ["UnlabeledGraphs", 9]])).toEqual(["Count", ["UnlabeledGraphs", 9]]);
  expect(JSON.stringify(evaluate(["At", ["UnlabeledGraphs", 9], 1]))).not.toContain("LabeledGraph");
  expect(evaluate(["Count", ["UnlabeledGraphs", 30]])).toEqual(["Count", ["UnlabeledGraphs", 30]]);
});

// The definition's compiled code gives the kernel's answers: every member through 4 vertices (5 deep), where compiled
// Epsil takes a third of a second a call at 5 vertices and about a minute and a half at 6.
test("UnlabeledGraphs' compiled definition gives the kernel's answers: every member through 4 vertices, 5 deep", () => {
  const compiled = kernelOn(ce, family, COMPILED_FAMILIES, { fast: false });
  expect(compiled.fast).toBeUndefined();
  for (let n = 0; n <= (DEEP ? 5 : 4); n++) {
    const count = compiled.count([n]);
    expect([n, count]).toEqual([n, fast.count([n])]);
    for (let r = 0n; r < (count as bigint); r++) {
      const element = compiled.unrank([n], r);
      expect([n, r, element]).toEqual([n, r, fast.unrank([n], r)]);
      expect([n, r, compiled.rank(element, [n])]).toEqual([n, r, r]);
      expect([n, r, compiled.valid(element, [n])]).toEqual([n, r, true]);
    }
    // Every labeled graph on n vertices is a member exactly when the kernel says so.
    if (n <= 4)
      for (let rank = 0; rank < 2 ** ((n * (n - 1)) / 2); rank++) {
        const edges = edgesOfRank(n, rank);
        expect([n, rank, compiled.valid(edges, [n])]).toEqual([n, rank, fast.valid(edges, [n])]);
      }
  }
});

// ─── CanonicalGraph ────────────────────────────────────────────────────────────────────────────────────────

const canonicalGraph = MAPS.find((map) => map.name === "CanonicalGraph")!;

// The definition interprets (evaluateDefinition) in a few tenths of a second a graph at 3 vertices: the standard run
// takes every graph through 2 vertices, DEEP_TESTS every graph through 4. Its compiled code is held to the interpreter
// by the build (compile-maps) and tests/compiled-maps.test.ts.
test("CanonicalGraph's kernel gives its definition's answer: every graph through 2 vertices, all through 4 deep", () => {
  expect(canonicalGraph.kernel).toBeDefined();
  for (let n = 0; n <= (DEEP ? 4 : 2); n++) {
    for (let rank = 0; rank < 2 ** ((n * (n - 1)) / 2); rank++) {
      const edges = edgesOfRank(n, rank);
      const contents = ["Tuple", n, ["List", ...edges.map((e) => ["List", ...e])]];
      const [size, canonical] = canonicalGraphKernel([n, edges])!;
      const expected = evaluateDefinition(ce, canonicalGraph, contents);
      expect([n, rank, ["Tuple", size, ["List", ...canonical.map((e) => ["List", ...e])]]]).toEqual([
        n,
        rank,
        expected,
      ]);
    }
  }
});

test("CanonicalGraph's compiled definition gives the kernel's answer, on graphs of 5 to 7 vertices, 8 deep", () => {
  expect(COMPILED_MAPS[mapKey(canonicalGraph)]).toBeDefined();
  const compiled = fastDefinition({
    ce,
    body: canonicalGraph.body,
    guard: canonicalGraph.guard,
    from: "tuple<integer, list<list<integer>>>",
    to: "tuple<integer, list<list<integer>>>",
    interpret: () => {
      throw new Error("the compiled code declined");
    },
    generated: COMPILED_MAPS[mapKey(canonicalGraph)],
    cache: false,
    imageParts: canonicalGraph.imageParts,
  });
  for (const [n, ranks] of [
    [5, [0, 21, 341, 1023]],
    [6, [106, 4095, 12345, 32767]],
    [7, [2323, 123456, 2097151]],
    [8, [9771, 5000000, 268435455]],
  ] as const)
    // Compiled code takes about a tenth of a second at 8 vertices (40,320 relabelings): the standard run stops at 7.
    for (const rank of DEEP || n < 8 ? ranks : []) {
      const edges = edgesOfRank(n, rank);
      const [size, canonical] = canonicalGraphKernel([n, edges])!;
      expect([n, rank, compiled(["Tuple", n, ["List", ...edges.map((e) => ["List", ...e])]] as never)]).toEqual([
        n,
        rank,
        ["Tuple", size, ["List", ...canonical.map((e) => ["List", ...e])]],
      ]);
    }
});

test("CanonicalGraph through the engine: evaluate() and .N() agree, and isomorphic graphs give one answer", () => {
  const cycle5 = graph(5, [
    [1, 2],
    [1, 5],
    [2, 3],
    [3, 4],
    [4, 5],
  ]);
  const pentagram = graph(5, [
    [1, 3],
    [1, 4],
    [2, 4],
    [2, 5],
    [3, 5],
  ]);
  const answer = graph(5, [
    [1, 4],
    [1, 5],
    [2, 3],
    [2, 5],
    [3, 4],
  ]);
  for (const route of [evaluate, numeric]) {
    expect(route(["CanonicalGraph", cycle5])).toEqual(answer);
    expect(route(["CanonicalGraph", pentagram])).toEqual(answer);
  }
  expect(evaluate(["CanonicalGraph", answer])).toEqual(answer);
  // A member of UnlabeledGraphs is its own canonical graph, and every canonical graph of the 5-vertex graphs is a member.
  for (let r = 0; r < 34; r += 3) {
    const member = evaluate(["At", ["UnlabeledGraphs", 5], r + 1]);
    expect(evaluate(["CanonicalGraph", member])).toEqual(member);
  }
});

test("CanonicalGraph's kernel declines what is not a graph, or a graph past its reach", () => {
  expect(canonicalGraphKernel([3, [[1, 1]]])).toBeUndefined();
  expect(canonicalGraphKernel([3, [[2, 1]]])).toBeUndefined();
  expect(
    canonicalGraphKernel([
      3,
      [
        [1, 2],
        [1, 2],
      ],
    ]),
  ).toBeUndefined();
  expect(canonicalGraphKernel([2, [[1, 3]]])).toBeUndefined();
  expect(canonicalGraphKernel([-1, []])).toBeUndefined();
  expect(canonicalGraphKernel([31, []])).toBeUndefined();
  expect(canonicalGraphKernel("graph")).toBeUndefined();
  expect(canonicalGraphKernel([0, []])).toEqual([0, []]);
});

// Past the kernel's reach the definition tries every relabeling (n! of them, 9 to 26 s compiled at 10 vertices): its
// guard leaves a graph of more than 9 vertices unevaluated, so a call the kernel declines returns at once.
test("CanonicalGraph on a graph past the kernel and past the definition's vertices stays unevaluated, promptly", () => {
  const cycle = (n: number): number[][] =>
    Array.from({ length: n }, (_, i) => [i + 1, ((i + 1) % n) + 1].toSorted((a, b) => a! - b!));
  const path = (n: number): number[][] => Array.from({ length: n - 1 }, (_, i) => [i + 1, i + 2]);
  const started = performance.now();
  // 31 vertices is past the kernel's limit; the path and cycle on 25 are past its 2 million branches.
  for (const subject of [graph(31, []), graph(31, path(31)), graph(25, cycle(25)), graph(25, path(25))]) {
    const call = ["CanonicalGraph", subject];
    for (const route of [evaluate, numeric]) expect(route(call)).toEqual(call);
  }
  // The definition itself declines past 9 vertices, and answers through them.
  const edges = (n: number) => ["Tuple", n, ["List", ...path(n).map((edge) => ["List", ...edge])]];
  expect(evaluateDefinition(ce, canonicalGraph, edges(10))).toBeUndefined();
  const [size, canonical] = canonicalGraphKernel([3, path(3)])!;
  expect(evaluateDefinition(ce, canonicalGraph, edges(3))).toEqual([
    "Tuple",
    size,
    ["List", ...canonical.map((edge) => ["List", ...edge])],
  ]);
  expect(performance.now() - started).toBeLessThan(30_000);
});

// ─── IsIsomorphicGraph ─────────────────────────────────────────────────────────────────────────────────────

const edge = (u: number, v: number): unknown => ["UndirectedEdge", u, v];
const undirected = (n: number, edges: number[][]): unknown => [
  "Graph",
  ["List", ...Array.from({ length: n }, (_, i) => i + 1)],
  ["List", ...edges.map(([u, v]) => edge(u, v))],
];
const cycleEdges = (n: number): number[][] => Array.from({ length: n }, (_, i) => [i + 1, ((i + 1) % n) + 1]);

test("IsIsomorphicGraph compares two LabeledGraph values by canonical form", () => {
  const path4 = graph(4, [
    [1, 2],
    [2, 3],
    [3, 4],
  ]);
  const relabeled = graph(4, [
    [1, 3],
    [2, 3],
    [2, 4],
  ]);
  const star = graph(4, [
    [1, 2],
    [1, 3],
    [1, 4],
  ]);
  expect(evaluate(["IsIsomorphicGraph", path4, relabeled])).toBe("True");
  expect(evaluate(["IsIsomorphicGraph", path4, star])).toBe("False");
  // Another vertex count, or edge count, is no brute force: the answer is no.
  expect(
    evaluate([
      "IsIsomorphicGraph",
      path4,
      graph(5, [
        [1, 2],
        [2, 3],
        [3, 4],
      ]),
    ]),
  ).toBe("False");
  // Past the limit the call stays unevaluated, with its message.
  const long = graph(17, []);
  expect(evaluate(["IsIsomorphicGraph", long, long])).toEqual(["IsIsomorphicGraph", long, long]);
  const small = graph(
    12,
    cycleEdges(12).map(([u, v]) => (u < v ? [u, v] : [v, u])),
  );
  expect(evaluate(["IsIsomorphicGraph", small, small])).toBe("True");
});

test("IsIsomorphicGraph on Graph objects: undirected graphs by canonical form, past the 9 vertices of brute force", () => {
  // A 12-cycle against itself relabeled by a step of 5 (gcd(5, 12) = 1), and against two 6-cycles.
  const step = cycleEdges(12).map(([u, v]) => [((u * 5) % 12) + 1, ((v * 5) % 12) + 1]);
  expect(evaluate(["IsIsomorphicGraph", undirected(12, cycleEdges(12)), undirected(12, step)])).toBe("True");
  const twoCycles = [...cycleEdges(6), ...cycleEdges(6).map(([u, v]) => [u + 6, v + 6])];
  expect(evaluate(["IsIsomorphicGraph", undirected(12, cycleEdges(12)), undirected(12, twoCycles)])).toBe("False");
  // The brute-force route for a directed edge keeps its 9-vertex limit.
  const directed = (n: number): unknown => [
    "Graph",
    ["List", ...Array.from({ length: n }, (_, i) => i + 1)],
    ["List", ...cycleEdges(n).map(([u, v]) => ["DirectedEdge", u, v])],
  ];
  expect(evaluate(["IsIsomorphicGraph", directed(5), directed(5)])).toBe("True");
  expect(evaluate(["IsIsomorphicGraph", directed(10), directed(10)])).toEqual([
    "IsIsomorphicGraph",
    directed(10),
    directed(10),
  ]);
  // The undirected limit is 16 vertices.
  expect(evaluate(["IsIsomorphicGraph", undirected(17, cycleEdges(17)), undirected(17, cycleEdges(17))])).toEqual([
    "IsIsomorphicGraph",
    undirected(17, cycleEdges(17)),
    undirected(17, cycleEdges(17)),
  ]);
});

test.skipIf(!DEEP)("IsIsomorphicGraph answers on the 16-vertex path and cycle, the hardest graphs measured", () => {
  const path = Array.from({ length: 15 }, (_, i) => [i + 1, i + 2]);
  expect(evaluate(["IsIsomorphicGraph", undirected(16, path), undirected(16, path.toReversed())])).toBe("True");
  const relabeled = cycleEdges(16).map(([u, v]) => [((u * 3) % 16) + 1, ((v * 3) % 16) + 1]);
  expect(evaluate(["IsIsomorphicGraph", undirected(16, cycleEdges(16)), undirected(16, relabeled)])).toBe("True");
});

test("the kernel's blocks decide isomorphism of the graphs a route compares", () => {
  const a = canonicalBlocks(
    adjacencyOf(4, [
      [1, 2],
      [2, 3],
      [3, 4],
    ]),
  );
  const b = canonicalBlocks(
    adjacencyOf(4, [
      [1, 3],
      [2, 3],
      [2, 4],
    ]),
  );
  expect(a).toEqual(b);
});

// Interpreted, the definition takes a few seconds at 3 vertices and minutes at 4: the standard run asks it at 2.
test("the interpreted definition answers where it reaches: UnlabeledGraphs(2)", () => {
  const everything = ["count", "unrank", "rank", "valid", "tables"] as const;
  const interpreted = { UnlabeledGraphs: { hash: familyHash(family), interpreted: everything } };
  const epsil = kernelOn(ce, family, interpreted, { fast: false });
  expect(epsil.count([2])).toBe(2n);
  expect(epsil.unrank([2], 1n)).toEqual([[1, 2]]);
  expect(epsil.rank([[1, 2]], [2])).toBe(1n);
  expect(epsil.valid([[1, 2]], [2])).toBe(true);
});
