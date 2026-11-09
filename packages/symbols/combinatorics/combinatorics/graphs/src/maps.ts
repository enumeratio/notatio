// Combinatorial maps whose `from` carrier is `labeled_graph` (conventions as in `permutations/src/maps.ts`). The graph is
// `_raw` = Tuple(n, edges): the vertices 1 .. n, and the edges as pairs [u, v] with u < v.

import { fold as typedFold } from "../../collections/src/families/tables.ts";
import { at, bind, forEach, lets, type CombinatorialMap, type MathJSON } from "../../src/map-helpers.ts";

const upTo = (k: MathJSON): MathJSON => ["Range", 1, k, 1];
const vertices: MathJSON = upTo("gm_n");
const one = (test: MathJSON): MathJSON => ["If", test, 1, 0];
const total = (over: MathJSON, body: MathJSON, variable: string): MathJSON => [
  "Max",
  ["Sum", forEach(over, body, variable)],
  0,
];
const cell = (matrix: string, row: MathJSON, column: MathJSON): MathJSON => at(column, at(row, matrix));
const lower = (edge: MathJSON): MathJSON => at(1, edge);
const upper = (edge: MathJSON): MathJSON => at(2, edge);

/** `body` with `gm_n` the vertex count, `gm_edges` the edge list and `gm_adjacent` the adjacency matrix; the graph with
 *  no vertices has no components and no cliques. */
const withGraph = (body: MathJSON): MathJSON => [
  "If",
  ["Equal", at(1), 0],
  ["List"],
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

/** The vertices reachable from each vertex, row by row: the transitive closure of the adjacency matrix with the
 *  diagonal, by Warshall's algorithm. */
const reach: MathJSON = typedFold(
  forEach(
    vertices,
    forEach(vertices, ["Max", cell("a", "i", "j"), ["Min", cell("a", "i", "k"), cell("a", "k", "j")]], "j"),
    "i",
  ),
  "a",
  "k",
  forEach(
    vertices,
    forEach(vertices, one(["Or", ["Equal", "i", "j"], ["Equal", cell("gm_adjacent", "i", "j"), 1]]), "j"),
    "i",
  ),
  vertices,
) as MathJSON;

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

export const GRAPHS_MAPS: readonly CombinatorialMap[] = [
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
];
