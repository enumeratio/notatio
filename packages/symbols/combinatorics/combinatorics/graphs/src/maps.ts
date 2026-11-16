// Combinatorial maps whose `from` carrier is `labeled_graph` (conventions as in `permutations/src/maps.ts`). The graph is
// `_raw` = Tuple(n, edges): the vertices 1 .. n, and the edges as pairs [u, v] with u < v.

import { fold as typedFold } from "../../collections/src/families/tables.ts";
import { blockEdgePartitionBody } from "./block-edges.ts";
import { adjacencyOf, canonicalBlocks, edgesOfBlocks, SEARCH_VERTEX_LIMIT } from "./canonical.ts";
import { canonicalGraphBody } from "./families/epsil.ts";
import { at, bind, forEach, lets, type CombinatorialMap, type MathJSON } from "../../src/map-helpers.ts";

export const upTo = (k: MathJSON): MathJSON => ["Range", 1, k, 1];
export const vertices: MathJSON = upTo("gm_n");
export const one = (test: MathJSON): MathJSON => ["If", test, 1, 0];
export const total = (over: MathJSON, body: MathJSON, variable: string): MathJSON => [
  "Max",
  ["Sum", forEach(over, body, variable)],
  0,
];
export const cell = (matrix: string, row: MathJSON, column: MathJSON): MathJSON => at(column, at(row, matrix));
export const lower = (edge: MathJSON): MathJSON => at(1, edge);
export const upper = (edge: MathJSON): MathJSON => at(2, edge);

/** `body` with `gm_n` the vertex count, `gm_edges` the edge list and `gm_adjacent` the adjacency matrix; the graph with
 *  no vertices has no components and no cliques, so `whenEmpty` (the empty list) answers it. */
export const withGraph = (body: MathJSON, whenEmpty: MathJSON = ["List"]): MathJSON => [
  "If",
  ["Equal", at(1), 0],
  whenEmpty,
  lets(
    [
      ["gm_n", at(1), "integer"],
      ["gm_edges", at(2), "list<list<integer>>"],
      [
        "gm_adjacent",
        forEach(
          vertices,
          forEach(
            vertices,
            total(
              "gm_edges",
              [
                "Add",
                ["Multiply", one(["Equal", lower("e"), "i"]), one(["Equal", upper("e"), "j"])],
                ["Multiply", one(["Equal", lower("e"), "j"]), one(["Equal", upper("e"), "i"])],
              ],
              "e",
            ),
            "j",
          ),
          "i",
        ),
        "list<list<integer>>",
      ],
    ],
    body,
  ),
];

/** The partition whose parts are the positive entries of the list called `values`, largest first: part i is the number of
 *  levels k at which at least i entries reach k, so no sorting is needed. */
const partOf = (values: string): MathJSON => [
  "If",
  ["Equal", ["Max", values], 0],
  ["List"],
  forEach(
    upTo(total(values, one(["Greater", "v", 0]), "v")),
    total(upTo(["Max", values]), one(["GreaterEqual", total(values, one(["GreaterEqual", "v", "k"]), "v"), "i"]), "k"),
  ),
];

/** The vertices reachable from each vertex, row by row: the transitive closure, by Warshall's algorithm, of the
 *  matrix that is 1 on the diagonal and where `joined(i, j)` holds. */
export const closureOf = (joined: (i: MathJSON, j: MathJSON) => MathJSON): MathJSON =>
  typedFold(
    forEach(
      vertices,
      forEach(vertices, ["Max", cell("a", "i", "j"), ["Min", cell("a", "i", "k"), cell("a", "k", "j")]], "j"),
      "i",
    ),
    "a",
    "k",
    forEach(vertices, forEach(vertices, one(["Or", ["Equal", "i", "j"], joined("i", "j")]), "j"), "i"),
    vertices,
  ) as MathJSON;

/** The vertices reachable from each vertex of the graph, with the diagonal. */
export const reach: MathJSON = closureOf((i, j) => ["Equal", cell("gm_adjacent", i, j), 1]);

/** The partition of `value(v)` over the vertices v that are the least of their component, the others counting 0. */
const perComponent = (value: (leader: MathJSON) => MathJSON): MathJSON =>
  withGraph(
    bind(
      "gm_reach",
      reach,
      bind(
        "gm_values",
        forEach(
          vertices,
          [
            "Multiply",
            one(["Equal", total(upTo(["Subtract", "v", 1]), cell("gm_reach", "v", "u"), "u"), 0]),
            value("v"),
          ],
          "v",
        ),
        partOf("gm_values"),
        "list<integer>",
      ),
      "list<list<integer>>",
    ),
  );

/** CanonicalGraph over the plain contents [n, edges]: the search of ./canonical.ts. It declines (undefined) a value
 *  that is no graph, and one the search gives up on. */
export function canonicalGraphKernel(raw: unknown): [number, number[][]] | undefined {
  if (!Array.isArray(raw) || raw.length !== 2) return undefined;
  const [n, edges] = raw as [unknown, unknown];
  if (!Number.isInteger(n) || (n as number) < 0 || (n as number) > SEARCH_VERTEX_LIMIT || !Array.isArray(edges))
    return undefined;
  const size = n as number;
  const seen = new Set<number>();
  for (const edge of edges as unknown[]) {
    if (!Array.isArray(edge) || edge.length !== 2) return undefined;
    const [u, v] = edge as number[];
    if (!Number.isInteger(u) || !Number.isInteger(v) || u < 1 || v <= u || v > size || seen.has(u * 64 + v))
      return undefined;
    seen.add(u * 64 + v);
  }
  const levels = canonicalBlocks(adjacencyOf(size, edges as number[][]));
  return levels === undefined ? undefined : [size, edgesOfBlocks(levels)];
}

export const GRAPHS_MAPS: readonly CombinatorialMap[] = [
  {
    name: "CanonicalGraph",
    from: "labeled_graph",
    to: "labeled_graph",
    body: canonicalGraphBody,
    kernel: canonicalGraphKernel as (raw: never) => unknown,
    // The image is Tuple(n, edges), both plain: no part is a carrier.
    imageParts: ["", ""],
    summary: "The graph relabeled so that its rank in LabeledGraphs(n) is least.",
    note: "Two graphs are isomorphic exactly when their canonical graphs are equal, and the members of UnlabeledGraphs are the graphs equal to their own. The definition is the least rank over every relabeling, so it reaches few vertices: compiled, a tenth of a second at 8 vertices, interpreted a second and a half at 4; a kernel in plain numbers chooses the vertex of label n, then n - 1, and so on, keeping the candidates whose block of pairs is least and taking one of each set of twins, and answers up to 30 vertices, declining a graph whose search passes two million branches (a path or cycle past about 17 vertices, a grid past 4 x 4). Wolfram's CanonicalGraph labels by its own rule, so the two agree only up to isomorphism: the oracle compares IsomorphicGraphQ of the two answers, never their values.",
  },
  {
    name: "ComponentSizePartition",
    from: "labeled_graph",
    to: "integer_partition",
    body: perComponent((leader) => total(vertices, cell("gm_reach", leader, "u"), "u")),
    summary: "The sizes of the connected components, largest first.",
    note: "FindStat's Mp00037. Lossy: only the sizes are kept.",
  },
  {
    name: "ComponentEdgePartition",
    from: "labeled_graph",
    to: "integer_partition",
    body: perComponent((leader) => total("gm_edges", cell("gm_reach", leader, lower("e")), "e")),
    summary: "The numbers of edges of the connected components, largest first, a component with no edge left out.",
    note: "FindStat's Mp00275.",
  },
  {
    name: "BlockEdgePartition",
    from: "labeled_graph",
    to: "integer_partition",
    body: blockEdgePartitionBody,
    summary: "The number of edges in each block (biconnected component) of the graph, largest first.",
    note: "FindStat's Mp00276. An isolated vertex is a block with no edges and contributes no part.",
  },
];
