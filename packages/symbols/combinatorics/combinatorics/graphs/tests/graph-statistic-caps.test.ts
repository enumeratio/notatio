// The size bounds of the graph statistics. A head that folds over the vertex orders answers through a number of vertices,
// and a head over the table of every subset of the edges through 21 edges (and a number of vertices): at the bound it has
// the value of its definition (the independent reading, where one is cheap enough), one size past it the call stays
// unevaluated on every route, promptly, with the compiled code present and absent.

import { bareEngine } from "@notatio/engine/testing";
import { operandsOf } from "@notatio/engine";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { COMPILED } from "../../src/statistics/compiled.ts";
import { applyDefinition, inDomain } from "../../src/statistics/declare.ts";
import { bySignature, signatureOf, whereSignatureOf } from "../../src/statistics/types.ts";
import { EDGE_TABLE_HEADS, EDGE_TABLE_LIMIT, GRAPH_STATISTICS, VERTEX_LIMITS } from "../src/statistics.ts";
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

const vertexHeads = Object.keys(VERTEX_LIMITS);
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

test("a vertex fold is in its domain at its bound and out of it one vertex past", () => {
  for (const head of vertexHeads) {
    const limit = VERTEX_LIMITS[head]!;
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
  VERTEX_LIMITS[head] !== undefined
    ? [edgeless(VERTEX_LIMITS[head]! + 1), complete(VERTEX_LIMITS[head]! + 1)]
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

// At the bound the head gives its definition's value, which the independent reading shares: the standard run takes the
// bounds' graphs at up to 5 vertices (and a few with 8 for the table heads), the deep run at the bound itself.
const sizeToRead = (head: string): number => (DEEP ? VERTEX_LIMITS[head]! : Math.min(5, VERTEX_LIMITS[head]!));
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
