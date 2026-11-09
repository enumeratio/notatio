// Graph statistics, over `_x` = Tuple(n, edges): the labeled graph on the vertices 1 .. n, its edges the pairs
// [u, v] with u < v. Every definition guards the graph with no vertices, whose ranges are empty.

import { fold as typedFold } from "../../collections/src/families/tables.ts";
import type { Definition, MathJSON } from "../../src/statistics/types.ts";
import {
  add,
  at,
  atLeastValue,
  bind,
  bindList,
  equals,
  floored,
  forEach,
  greater,
  length,
  less,
  sumOver,
  subtract,
} from "../../src/statistics/vocabulary.ts";

const on = "LabeledGraph";
const stat = (head: string, summary: string, expr: MathJSON, note?: string): Definition => ({
  head,
  on,
  summary,
  expr,
  ...(note ? { note } : {}),
});

const NO_VERTICES = "The graph with no vertices gives 0.";

const vertices: MathJSON = ["Range", 1, "n"];
const one = (test: MathJSON): MathJSON => ["If", test, 1, 0];
const times = (a: MathJSON, b: MathJSON): MathJSON => ["Multiply", a, b];
/** `body` with `n` the vertex count and `edges` the edge list; the graph with no vertices gives `otherwise`. */
const withGraph = (body: MathJSON, otherwise: MathJSON = 0): MathJSON => [
  "If",
  equals(at(1), 0),
  otherwise,
  bind("n", at(1), bindList("edges", at(2), body, "list<list<integer>>"), "integer"),
];

/** The ends of edge e. */
const lower = (edge: MathJSON): MathJSON => at(1, edge);
const upper = (edge: MathJSON): MathJSON => at(2, edge);

/** The degree of each vertex, in order: the edges that end at it. */
const degreeList: MathJSON = forEach(
  vertices,
  floored(sumOver("edges", add(one(equals(lower("e"), "v")), one(equals(upper("e"), "v"))), "e")),
  "v",
);
const withDegrees = (body: MathJSON, otherwise: MathJSON = 0): MathJSON =>
  withGraph(bindList("degrees", degreeList, body), otherwise);
const degree = (vertex: MathJSON): MathJSON => at(vertex, "degrees");
const overDegrees = (body: MathJSON): MathJSON => floored(sumOver("degrees", body, "d"));

/** `fold`, as this file's `MathJSON`. */
const typedFolding = (...args: Parameters<typeof typedFold>): MathJSON => typedFold(...args) as MathJSON;
const spread = (body: MathJSON): MathJSON => ["Divide", body, 2];

/** The adjacency matrix, row by row: 1 where the two vertices share an edge. */
const adjacencyMatrix: MathJSON = forEach(
  vertices,
  forEach(
    vertices,
    floored(
      sumOver(
        "edges",
        add(
          times(one(equals(lower("e"), "i")), one(equals(upper("e"), "j"))),
          times(one(equals(lower("e"), "j")), one(equals(upper("e"), "i"))),
        ),
        "e",
      ),
    ),
    "j",
  ),
  "i",
);
const withAdjacency = (body: MathJSON, otherwise: MathJSON = 0): MathJSON =>
  withGraph(bindList("adjacency", adjacencyMatrix, body, "list<list<integer>>"), otherwise);
/** Entry (u, w) of the matrix called `name`. */
const entry = (name: MathJSON, u: MathJSON, w: MathJSON): MathJSON => at(w, at(u, name));
const adjacent = (u: MathJSON, w: MathJSON): MathJSON => entry("adjacency", u, w);

/** The row of the n by n identity matrix at vertex `v`. */
const unitRow = (v: MathJSON): MathJSON => forEach(vertices, one(equals("t", v)), "t");
/**
 * The rank of the adjacency matrix with `row` as an extra first row. `MatrixRank` takes a literal
 * matrix, not a lazy `Map`, so the rows are appended one at a time.
 */
const rankWith = (row: MathJSON): MathJSON => [
  "MatrixRank",
  typedFolding(
    ["Join", "rows", ["List", ["If", equals("k", 0), row, at("k", "adjacency")]]],
    "rows",
    "k",
    ["List"],
    ["Range", 0, "n"],
    "list<list<integer>>",
  ),
];
/** 1 when vertices u and v take equal values on every vector of the adjacency matrix's nullspace; reads `rank`, the adjacency matrix's. */
const alikeInNullspace = (u: MathJSON, v: MathJSON): MathJSON =>
  one(equals(rankWith(forEach(vertices, subtract(one(equals("t", u)), one(equals("t", v))), "t")), "rank"));

/**
 * The distances of the graph with adjacency matrix `matrix`, by Floyd-Warshall; a pair with no path is
 * 2n apart, beyond any distance of a graph on n vertices.
 */
const distancesOf = (matrix: MathJSON): MathJSON =>
  bindList(
    "matrix",
    matrix,
    typedFolding(
      forEach(
        vertices,
        forEach(vertices, ["Min", entry("a", "i", "j"), add(entry("a", "i", "k"), entry("a", "k", "j"))], "j"),
        "i",
      ),
      "a",
      "k",
      forEach(
        vertices,
        forEach(
          vertices,
          ["If", equals("i", "j"), 0, ["If", equals(entry("matrix", "i", "j"), 1), 1, times(2, "n")]],
          "j",
        ),
        "i",
      ),
      vertices,
    ),
    "list<list<integer>>",
  );
const withDistances = (body: MathJSON, otherwise: MathJSON = 0): MathJSON =>
  withAdjacency(bindList("distances", distancesOf("adjacency"), body, "list<list<integer>>"), otherwise);
const withDegreesAndDistances = (body: MathJSON, otherwise: MathJSON = 0): MathJSON =>
  withDegrees(
    bindList(
      "adjacency",
      adjacencyMatrix,
      bindList("distances", distancesOf("adjacency"), body, "list<list<integer>>"),
      "list<list<integer>>",
    ),
    otherwise,
  );
const distance = (u: MathJSON, w: MathJSON): MathJSON => entry("distances", u, w);
/** Over the ordered pairs of vertices (u, w), `body` summed. */
const overPairs = (body: MathJSON): MathJSON => floored(sumOver(vertices, floored(sumOver(vertices, body, "w")), "u"));
/** The ordered pairs joined by a path, at distance `k`: a pair with no path is 2n apart, which `k` can reach on a small graph. */
const pairsAtDistance = (k: MathJSON): MathJSON =>
  spread(overPairs(times(one(equals(distance("u", "w"), k)), one(less(distance("u", "w"), "n")))));
/** The vertices that are the first of their component, in the graph with distances `reach`. */
const componentsIn = (reach: MathJSON): MathJSON =>
  floored(
    sumOver(
      vertices,
      one(
        equals(floored(sumOver(vertices, ["If", less("u", "v"), one(less(entry(reach, "u", "v"), "n")), 0], "u")), 0),
      ),
      "v",
    ),
  );
const componentCount: MathJSON = bindList(
  "reach",
  distancesOf("adjacency"),
  componentsIn("reach"),
  "list<list<integer>>",
);

/** The adjacency matrix with the vertices of `cut` (a test on "i" and "j" alike) deleted: rows and columns zeroed. */
const adjacencyWithout = (removed: (u: MathJSON) => MathJSON): MathJSON =>
  forEach(
    vertices,
    forEach(
      vertices,
      times(adjacent("i", "j"), times(one(equals(removed("i"), 0)), one(equals(removed("j"), 0)))),
      "j",
    ),
    "i",
  );
const componentsOfMatrix = (matrix: MathJSON): MathJSON =>
  bindList("reach", distancesOf(matrix), componentsIn("reach"), "list<list<integer>>");

/** The subsets of the vertices as bitmasks: bit v - 1 of the mask is vertex v. */
const masks: MathJSON = ["Range", 0, subtract(["Power", 2, "n"], 1)];
const hasBit = (mask: MathJSON, vertex: MathJSON): MathJSON =>
  atLeastValue(["Mod", mask, ["Power", 2, vertex]], ["Power", 2, subtract(vertex, 1)]);
const bitValue = (vertex: MathJSON): MathJSON => ["Power", 2, subtract(vertex, 1)];
/** The edges inside each subset, and its vertex count, by mask + 1. */
const edgesInside: MathJSON = forEach(
  masks,
  floored(sumOver("edges", times(one(hasBit("m", lower("e"))), one(hasBit("m", upper("e")))), "e")),
  "m",
);
const vertexTotals: MathJSON = forEach(masks, floored(sumOver(vertices, one(hasBit("m", "v")), "v")), "m");
const withMasks = (body: MathJSON, otherwise: MathJSON = 0): MathJSON =>
  withGraph(bindList("inside", edgesInside, bindList("totals", vertexTotals, body)), otherwise);
const inside = (mask: MathJSON): MathJSON => at(add(mask, 1), "inside");
const total = (mask: MathJSON): MathJSON => at(add(mask, 1), "totals");
const isIndependent = (mask: MathJSON): MathJSON => equals(inside(mask), 0);
const isClique = (mask: MathJSON): MathJSON =>
  equals(times(2, inside(mask)), times(total(mask), subtract(total(mask), 1)));
const overMasks = (body: MathJSON): MathJSON => floored(sumOver(masks, body, "m"));
const largestMask = (member: MathJSON): MathJSON => ["Max", forEach(masks, times(one(member), total("m")), "m")];

/** Each subset's connection, by mask + 1: 1 where the vertices induce a connected subgraph. */
const connectedMasks: MathJSON = typedFolding(
  [
    "Join",
    "a",
    [
      "List",
      [
        "If",
        equals(total("b"), 1),
        1,
        [
          "Min",
          1,
          floored(
            sumOver(
              vertices,
              [
                "If",
                hasBit("b", "v"),
                times(
                  at(add(subtract("b", bitValue("v")), 1), "a"),
                  one(greater(subtract(inside("b"), inside(subtract("b", bitValue("v")))), 0)),
                ),
                0,
              ],
              "v",
            ),
          ),
        ],
      ],
    ],
  ],
  "a",
  "b",
  ["List", 0],
  ["Range", 1, subtract(["Power", 2, "n"], 1)],
);
/** The lowest vertex of the subset `mask`. */
const lowest = (mask: MathJSON): MathJSON => [
  "Min",
  forEach(vertices, ["If", hasBit(mask, "v"), "v", add("n", 1)], "v"),
];

/** For each subset, the independent sets inside it, by mask + 1: the indicator summed over the subsets one vertex at a time. */
const independentSetsWithin: MathJSON = typedFolding(
  forEach(
    masks,
    [
      "If",
      hasBit("m", "k"),
      add(at(add("m", 1), "a"), at(add(subtract("m", bitValue("k")), 1), "a")),
      at(add("m", 1), "a"),
    ],
    "m",
  ),
  "a",
  "k",
  forEach(masks, one(isIndependent("m")), "m"),
  vertices,
);
/** The ways to color the vertices in `k` colors, each a cover by `k` independent sets, by inclusion-exclusion over the subsets left uncovered. */
const coloringCount = (k: MathJSON): MathJSON =>
  floored([
    "Sum",
    forEach(
      masks,
      times(["If", equals(["Mod", subtract("n", total("m")), 2], 0), 1, -1], ["Power", at(add("m", 1), "within"), k]),
      "m",
    ),
  ]);
/**
 * A table over the subsets, built up from the smaller ones: entry mask + 1 describes the matchings of the subgraph the
 * mask induces. Its lowest vertex is either left out, or matched to a neighbor in the subset; `combine` takes the entry
 * without the vertex and the list of `term` of the entries without it and each neighbor (0 for a non-neighbor).
 */
const matchingTable = (
  start: number,
  term: (entry: MathJSON) => MathJSON,
  combine: (without: MathJSON, matched: MathJSON) => MathJSON,
): MathJSON =>
  bindList(
    "adjacency",
    adjacencyMatrix,
    typedFolding(
      bind(
        "low",
        lowest("b"),
        [
          "Join",
          "a",
          [
            "List",
            combine(
              at(add(subtract("b", bitValue("low")), 1), "a"),
              forEach(
                vertices,
                [
                  "If",
                  hasBit(subtract("b", bitValue("low")), "w"),
                  times(
                    adjacent("low", "w"),
                    term(at(add(subtract(subtract("b", bitValue("low")), bitValue("w")), 1), "a")),
                  ),
                  0,
                ],
                "w",
              ),
            ),
          ],
        ],
        "integer",
      ),
      "a",
      "b",
      ["List", start],
      ["Range", 1, subtract(["Power", 2, "n"], 1)],
    ),
    "list<list<integer>>",
  );
const lastEntry = (table: MathJSON): MathJSON => at(length(table), table);

/** For each subset (by mask + 1), each vertex's neighbors inside it, around `body`. */
const withNeighborsIn = (body: MathJSON, otherwise: MathJSON = 0): MathJSON =>
  withMasks(
    bindList(
      "toSet",
      forEach(
        masks,
        forEach(
          vertices,
          floored(
            sumOver(
              "edges",
              add(
                times(one(equals(lower("e"), "v")), one(hasBit("m", upper("e")))),
                times(one(equals(upper("e"), "v")), one(hasBit("m", lower("e")))),
              ),
              "e",
            ),
          ),
          "v",
        ),
        "m",
      ),
      body,
      "list<list<integer>>",
    ),
    otherwise,
  );
/** The neighbors of `vertex` among the vertices of the subset `mask`. */
const neighborsIn = (mask: MathJSON, vertex: MathJSON): MathJSON => at(vertex, at(add(mask, 1), "toSet"));
/** The vertices of the subset `mask` whose number of neighbors inside it is `bad`. */
const misfits = (mask: MathJSON, bad: (inside: MathJSON) => MathJSON): MathJSON =>
  floored(sumOver(vertices, times(one(hasBit(mask, "v")), one(bad(neighborsIn(mask, "v")))), "v"));
/** Each subset's size when no vertex of it has `bad` neighbors inside, else 0, by mask + 1. */
const sizeUnlessAny = (bad: (inside: MathJSON) => MathJSON): MathJSON =>
  forEach(masks, times(one(equals(misfits("m", bad), 0)), total("m")), "m");

/** Whether the subset `mask` is dominating, by mask + 1: every vertex is in it or has a neighbor in it. */
const dominatingTable: MathJSON = forEach(
  masks,
  one(
    equals(
      floored(sumOver(vertices, times(subtract(1, one(hasBit("m", "v"))), one(equals(neighborsIn("m", "v"), 0))), "v")),
      0,
    ),
  ),
  "m",
);
const isDominating = (mask: MathJSON): MathJSON => at(add(mask, 1), "dominating");
const withDominating = (body: MathJSON, otherwise: MathJSON = 0): MathJSON =>
  withNeighborsIn(bindList("dominating", dominatingTable, body), otherwise);
/** A dominating subset no vertex of which can be dropped. */
const isMinimalDominating = (mask: MathJSON): MathJSON =>
  times(
    isDominating(mask),
    one(
      equals(
        floored(sumOver(vertices, ["If", hasBit(mask, "v"), isDominating(subtract(mask, bitValue("v"))), 0], "v")),
        0,
      ),
    ),
  );

/** The subsets 1 .. 2^n - 1, the nonempty ones. */
const masksFromOne: MathJSON = ["Range", 1, subtract(["Power", 2, "n"], 1)];
/** Edges with both ends on one side of the cut (`mask`, its complement). */
const uncut = (mask: MathJSON): MathJSON => add(inside(mask), inside(subtract(subtract(["Power", 2, "n"], 1), mask)));

/** The index of the entry for `end` of the subset `mask` in a path table: a leading placeholder, then n entries per subset. */
const pathAt = (mask: MathJSON, end: MathJSON): MathJSON => add(add(times(subtract(mask, 1), "n"), end), 1);
/**
 * The paths of the graph that visit exactly the vertices of a subset and end at a vertex, by subset and end: the entry
 * for subset b and end e counts them. With `fromLowest` a path starts at the lowest vertex of its subset, so a cycle on
 * the subset is counted once for each direction; else it starts anywhere.
 */
const pathTable = (fromLowest: boolean): MathJSON => {
  const extend = floored(
    sumOver(
      vertices,
      times(
        one(hasBit(subtract("b", bitValue("e")), "w")),
        times(adjacent("w", "e"), at(pathAt(subtract("b", bitValue("e")), "w"), "a")),
      ),
      "w",
    ),
  );
  return typedFolding(
    [
      "Join",
      "a",
      forEach(
        vertices,
        [
          "If",
          hasBit("b", "e"),
          ["If", equals("b", bitValue("e")), 1, fromLowest ? ["If", equals("e", lowest("b")), 0, extend] : extend],
          0,
        ],
        "e",
      ),
    ],
    "a",
    "b",
    ["List", 0],
    masksFromOne,
  );
};
const withPaths = (fromLowest: boolean, body: MathJSON): MathJSON =>
  withGraph(
    bindList(
      "totals",
      vertexTotals,
      bindList("adjacency", adjacencyMatrix, bindList("paths", pathTable(fromLowest), body), "list<list<integer>>"),
    ),
  );
/** Twice the cycles through exactly the vertices of the subset `mask`, which holds at least 3: each is closed from the lowest vertex by an edge, in either direction. */
const cyclesTwice = (mask: MathJSON): MathJSON =>
  times(
    one(atLeastValue(total(mask), 3)),
    bind(
      "low",
      lowest(mask),
      floored(sumOver(vertices, times(adjacent("low", "e"), at(pathAt(mask, "e"), "paths")), "e")),
      "integer",
    ),
  );

/** A sum that may be negative, bounded below by the least integer a double holds so the compiler types it real. */
const signedSum = (sum: MathJSON): MathJSON => ["Max", sum, -(2 ** 53)];
/** The determinant of the `size` x `size` leading block of the matrix called `name`, by expansion along rows over the subsets of columns. */
const determinantOf = (name: string, size: MathJSON): MathJSON =>
  lastEntry(
    typedFolding(
      [
        "Join",
        "a",
        [
          "List",
          signedSum(
            sumOver(
              ["Range", 1, size],
              [
                "If",
                hasBit("b", "c"),
                times(
                  [
                    "If",
                    equals(
                      ["Mod", floored(sumOver(vertices, times(one(greater("w", "c")), one(hasBit("b", "w"))), "w")), 2],
                      0,
                    ),
                    1,
                    -1,
                  ],
                  times(entry(name, total("b"), "c"), at(add(subtract("b", bitValue("c")), 1), "a")),
                ),
                0,
              ],
              "c",
            ),
          ),
        ],
      ],
      "a",
      "b",
      ["List", 1],
      ["Range", 1, subtract(["Power", 2, size], 1)],
    ),
  );
const withTotals = (body: MathJSON, otherwise: MathJSON = 0): MathJSON =>
  withGraph(bindList("totals", vertexTotals, body), otherwise);

/** The independent sets of vertices that no vertex can be added to, as 1 or 0 for the subset `mask`. */
const isMaximalIndependent = (mask: MathJSON): MathJSON =>
  times(
    one(isIndependent(mask)),
    one(
      equals(
        floored(
          sumOver(
            vertices,
            [
              "If",
              less(["Mod", mask, ["Power", 2, "v"]], bitValue("v")),
              one(isIndependent(add(mask, bitValue("v")))),
              0,
            ],
            "v",
          ),
        ),
        0,
      ),
    ),
  );
/** The least k with a coloring in k colors, from the independent sets within each subset. */
const chromaticNumber: MathJSON = bindList("within", independentSetsWithin, [
  "Min",
  forEach(vertices, ["If", greater(coloringCount("k"), 0), "k", "n"], "k"),
]);
/** The vertices adjacent to both ends of some edge. */
const triangleVertices: MathJSON = floored(
  sumOver(
    vertices,
    one(greater(floored(sumOver("edges", times(adjacent("v", lower("e")), adjacent("v", upper("e"))), "e")), 0)),
    "v",
  ),
);

const withDegreesAndAdjacency = (body: MathJSON): MathJSON =>
  withDegrees(bindList("adjacency", adjacencyMatrix, body, "list<list<integer>>"));
/** The neighbors of vertex `v` whose degree satisfies `test`. */
const neighborsWhere = (test: (degreeOfNeighbor: MathJSON) => MathJSON): MathJSON =>
  floored(sumOver(vertices, times(adjacent("v", "w"), one(test(degree("w")))), "w"));
/** Whether rows `u` and `v` of the adjacency matrix agree: the two vertices have the same neighbors. */
const sameNeighbors = (u: MathJSON, v: MathJSON): MathJSON =>
  one(equals(floored(sumOver(vertices, ["Abs", subtract(adjacent(u, "x"), adjacent(v, "x"))], "x")), 0));
/** The vertices of the subset `mask` that have more than `limit` members of it at or next to them, counting the vertex itself when `closed`. */
const overfull = (mask: MathJSON, limit: number, closed: boolean): MathJSON =>
  floored(
    sumOver(
      vertices,
      one(greater(closed ? add(neighborsIn(mask, "w"), one(hasBit(mask, "w"))) : neighborsIn(mask, "w"), limit)),
      "w",
    ),
  );
/** The largest subset for which no vertex is overfull. */
const largestWithoutOverfull = (limit: number, closed: boolean): MathJSON =>
  withNeighborsIn(["Max", forEach(masks, times(one(equals(overfull("m", limit, closed), 0)), total("m")), "m")]);

/** Each subset's forest-ness, by mask + 1: 1 when it induces a forest, which has a vertex of at most one neighbor inside whose removal leaves a forest. */
const forestMasks: MathJSON = typedFolding(
  [
    "Join",
    "a",
    [
      "List",
      [
        "Min",
        1,
        floored(
          sumOver(
            vertices,
            [
              "If",
              hasBit("b", "v"),
              times(at(add(subtract("b", bitValue("v")), 1), "a"), one(less(neighborsIn("b", "v"), 2))),
              0,
            ],
            "v",
          ),
        ),
      ],
    ],
  ],
  "a",
  "b",
  ["List", 1],
  ["Range", 1, subtract(["Power", 2, "n"], 1)],
);
const largestForest: MathJSON = ["Max", forEach(masks, times(at(add("m", 1), "forests"), total("m")), "m")];
/** The sets of four vertices with `edgeCount` edges among them and `misfitCount` members whose number of neighbors among them satisfies `misfit`. */
const inducedFourVertexCount = (
  edgeCount: number,
  misfit: (inside: MathJSON) => MathJSON,
  misfitCount: number,
): MathJSON =>
  withNeighborsIn(
    overMasks(
      times(
        one(equals(total("m"), 4)),
        times(one(equals(inside("m"), edgeCount)), one(equals(misfits("m", misfit), misfitCount))),
      ),
    ),
  );

// ─── Spectra of a symmetric integer matrix, read from its characteristic polynomial ───
// The matrix is symmetric, so its eigenvalues are real and Descartes' rule counts them exactly: the positive
// ones are the sign changes in the coefficients, the negative ones those of p(-x), the zero ones the trailing
// zero coefficients. The distinct ones and the multiplicities come from the greatest common divisor of p
// and its derivative, by Euclid's algorithm on integer coefficients. No eigenvalue is ever approximated.

/** 0, unless `bound` passes the integers compiled code holds exactly, when compiling it declines (GCD refuses the argument) and the interpreter answers. A bound on the products a step forms keeps a product that rounds from passing for exact. */
const rangeGuard = (bound: MathJSON): MathJSON => ["Min", ["GCD", bound, 0], 0];
/** The largest absolute entry of the matrix called `name`. */
const largestEntry = (name: string, row: string, column: string): MathJSON => [
  "Max",
  forEach(vertices, ["Max", forEach(vertices, ["Abs", entry(name, row, column)], column)], row),
];
/** The determinant from the constant coefficient of the characteristic polynomial, whose sign is (-1)^n; 0 stays 0, not -0. */
const determinantFromCoefficients = (divisor: number): MathJSON =>
  bind(
    "constant",
    at(add("n", 1), "coefficients"),
    [
      "If",
      equals("constant", 0),
      0,
      ["Divide", ["If", equals(["Mod", "n", 2], 0), "constant", subtract(0, "constant")], divisor],
    ],
    "integer",
  );
/** The `n` x `n` identity, row by row. */
const identityRows: MathJSON = forEach(vertices, forEach(vertices, one(equals("i", "j")), "j"), "i");
/**
 * The coefficients of det(xI - M) for the matrix called `name`, highest power first (n + 1 of them, the first 1),
 * by Faddeev-LeVerrier: with M_1 = I, M_(k+1) = M M_k + c_(n-k) I and c_(n-k) = -trace(M M_k) / k, all in integers.
 * The fold carries M_k as `n` rows and the coefficients found so far as an extra row.
 */
const characteristicCoefficients = (name: string): MathJSON =>
  bindList(
    "steps",
    typedFolding(
      bindList(
        "product",
        forEach(
          vertices,
          forEach(
            vertices,
            signedSum(sumOver(vertices, times(entry(name, "i", "l"), entry("state", "l", "j")), "l")),
            "j",
          ),
          "i",
        ),
        bind(
          "coefficient",
          add(
            ["Divide", subtract(0, signedSum(sumOver(vertices, entry("product", "i", "i"), "i"))), "k"],
            rangeGuard(
              times(times(2, times("n", "n")), times(largestEntry(name, "i", "l"), largestEntry("state", "i", "l"))),
            ),
          ),
          [
            "Join",
            forEach(
              vertices,
              forEach(vertices, add(entry("product", "i", "j"), times(one(equals("i", "j")), "coefficient")), "j"),
              "i",
            ),
            [
              "List",
              forEach(vertices, ["If", equals("j", "k"), "coefficient", at("j", at(add("n", 1), "state"))], "j"),
            ],
          ],
          "integer",
        ),
        "list<list<integer>>",
      ),
      "state",
      "k",
      ["Join", identityRows, ["List", forEach(vertices, 0, "j")]],
      vertices,
      "list<list<integer>>",
    ),
    ["Join", ["List", 1], at(add("n", 1), "steps")],
    "list<list<integer>>",
  );
/** The sign changes of the nonzero entries of `values`, a list of integers. */
const signChanges = (values: MathJSON): MathJSON =>
  at(
    2,
    typedFolding(
      [
        "If",
        equals("b", 0),
        "a",
        [
          "List",
          ["If", greater("b", 0), 1, -1],
          add(at(2, "a"), one(equals(times(at(1, "a"), ["If", greater("b", 0), 1, -1]), -1))),
        ],
      ],
      "a",
      "b",
      ["List", 0, 0],
      values,
      "list<integer>",
    ),
  );
/** The positions of a polynomial of `n` + 1 coefficients. */
const coefficientPositions: MathJSON = ["Range", 1, add("n", 1)];
/** The positive eigenvalues, from the coefficients bound as `coefficients`. */
const positiveEigenvalues: MathJSON = signChanges("coefficients");
/** The negative eigenvalues: the positive roots of p(-x), whose coefficients alternate in sign. */
const negativeEigenvalues: MathJSON = signChanges(
  forEach(coefficientPositions, times(at("j", "coefficients"), ["If", equals(["Mod", "j", 2], 0), 1, -1]), "j"),
);
/** The matrix called `name` has its characteristic coefficients bound as `coefficients` around `body`. */
const withCoefficients = (name: string, body: MathJSON): MathJSON =>
  bindList("coefficients", characteristicCoefficients(name), body);

// Polynomials below are lists of `n` + 1 integers, the lowest power first.
const polynomialLength: MathJSON = add("n", 1);
const polynomialPositions: MathJSON = ["Range", 1, polynomialLength];
/** The largest absolute coefficient. */
const largestCoefficient = (poly: MathJSON): MathJSON => [
  "Max",
  forEach(polynomialPositions, ["Abs", at("j", poly)], "j"),
];
const degreeOf = (poly: MathJSON): MathJSON => [
  "Max",
  forEach(polynomialPositions, times(subtract("j", 1), one(["NotEqual", at("j", poly), 0])), "j"),
];
const isZero = (poly: MathJSON): MathJSON =>
  equals(floored(sumOver(polynomialPositions, ["Abs", at("j", poly)], "j")), 0);
/** The derivative, with the top coefficient zero. */
const derivative = (poly: MathJSON): MathJSON =>
  forEach(polynomialPositions, ["If", less("j", polynomialLength), times("j", at(add("j", 1), poly)), 0], "j");
/**
 * The greatest common divisor of two polynomials, up to a constant factor, by Euclid's algorithm. Each round
 * leaves a zero second polynomial alone, swaps a first of lower degree (or zero) with the second, and
 * otherwise cancels the first's leading term against the second's and divides out the content so the entries stay
 * small. Every round but a swap lowers the degree sum, which starts under 2n, and a swap is followed by a
 * cancellation, so 4n + 2 rounds finish it.
 */
const gcdRound: MathJSON = bindList(
  "front",
  at(1, "pair"),
  bindList(
    "back",
    at(2, "pair"),
    [
      "If",
      isZero("back"),
      "pair",
      bind(
        "frontDegree",
        degreeOf("front"),
        bind(
          "backDegree",
          degreeOf("back"),
          [
            "If",
            isZero("front"),
            ["List", "back", "front"],
            [
              "If",
              less("frontDegree", "backDegree"),
              ["List", "back", "front"],
              bind(
                "common",
                ["GCD", at(add("frontDegree", 1), "front"), at(add("backDegree", 1), "back")],
                bindList(
                  "cancelled",
                  forEach(
                    polynomialPositions,
                    subtract(
                      times(["Divide", at(add("backDegree", 1), "back"), "common"], at("j", "front")),
                      times(
                        ["Divide", at(add("frontDegree", 1), "front"), "common"],
                        [
                          "If",
                          greater("j", subtract("frontDegree", "backDegree")),
                          at(subtract("j", subtract("frontDegree", "backDegree")), "back"),
                          0,
                        ],
                      ),
                    ),
                    "j",
                  ),
                  bind(
                    "content",
                    add(
                      ["Max", ["GCD", forEach(polynomialPositions, ["Abs", at("j", "cancelled")], "j")], 1],
                      rangeGuard(
                        add(
                          times(
                            ["Divide", ["Abs", at(add("backDegree", 1), "back")], "common"],
                            largestCoefficient("front"),
                          ),
                          times(
                            ["Divide", ["Abs", at(add("frontDegree", 1), "front")], "common"],
                            largestCoefficient("back"),
                          ),
                        ),
                      ),
                    ),
                    ["List", forEach(polynomialPositions, ["Divide", at("j", "cancelled"), "content"], "j"), "back"],
                    "integer",
                  ),
                ),
                "integer",
              ),
            ],
          ],
          "integer",
        ),
        "integer",
      ),
    ],
    "list<integer>",
  ),
  "list<integer>",
);
const polynomialGcd = (first: MathJSON, second: MathJSON, rounds: MathJSON = add(times(4, "n"), 2)): MathJSON =>
  at(1, typedFolding(gcdRound, "pair", "round", ["List", first, second], ["Range", 1, rounds], "list<list<integer>>"));
/** The coefficients bound as `coefficients`, lowest power first. */
const ascendingCoefficients: MathJSON = forEach(
  polynomialPositions,
  at(subtract(add("n", 2), "j"), "coefficients"),
  "j",
);
/** The distinct eigenvalues: the degree of p less that of gcd(p, p'), the multiple roots counted once less. */
const distinctEigenvalues: MathJSON = bindList(
  "polynomial",
  ascendingCoefficients,
  subtract("n", degreeOf(polynomialGcd("polynomial", derivative("polynomial")))),
);
/** The greatest multiplicity of an eigenvalue: 1 more than the times gcd(p, p'), gcd of that and its derivative, ... stays nonconstant. */
const maximumMultiplicity: MathJSON = bindList(
  "polynomial",
  ascendingCoefficients,
  at(
    1,
    at(
      2,
      typedFolding(
        bindList(
          "current",
          at(1, "chain"),
          [
            "If",
            equals(degreeOf("current"), 0),
            "chain",
            [
              "List",
              polynomialGcd("current", derivative("current")),
              forEach(polynomialPositions, ["If", equals("j", 1), add(at(1, at(2, "chain")), 1), 0], "j"),
            ],
          ],
          "list<integer>",
        ),
        "chain",
        "turn",
        ["List", "polynomial", forEach(polynomialPositions, 0, "j")],
        ["Range", 1, "n"],
        "list<list<integer>>",
      ),
    ),
  ),
);

/** The Laplacian, degrees on the diagonal and minus the adjacency off it. */
const laplacianRows: MathJSON = forEach(
  vertices,
  forEach(vertices, ["If", equals("i", "j"), degree("i"), subtract(0, adjacent("i", "j"))], "j"),
  "i",
);
/** The signless Laplacian, degrees on the diagonal and the adjacency off it. */
const signlessLaplacianRows: MathJSON = forEach(
  vertices,
  forEach(vertices, ["If", equals("i", "j"), degree("i"), adjacent("i", "j")], "j"),
  "i",
);
const withMatrix = (name: string, rows: MathJSON, body: MathJSON, otherwise: MathJSON = 0): MathJSON =>
  withDegrees(
    bindList(
      "adjacency",
      adjacencyMatrix,
      bindList(name, rows, withCoefficients(name, body), "list<list<integer>>"),
      "list<list<integer>>",
    ),
    otherwise,
  );
const withAdjacencySpectrum = (body: MathJSON): MathJSON => withAdjacency(withCoefficients("adjacency", body));
const withLaplacianSpectrum = (body: MathJSON): MathJSON => withMatrix("laplacian", laplacianRows, body);
const withSignlessSpectrum = (body: MathJSON, otherwise: MathJSON = 0): MathJSON =>
  withMatrix("signless", signlessLaplacianRows, body, otherwise);
const withEigenvalueSigns = (body: MathJSON): MathJSON =>
  withAdjacencySpectrum(
    bind("positive", positiveEigenvalues, bind("negative", negativeEigenvalues, body, "integer"), "integer"),
  );

/** The distance Laplacian, each vertex's distances to the others summed on the diagonal and minus the distance off it. */
const distanceLaplacianRows: MathJSON = forEach(
  vertices,
  forEach(
    vertices,
    ["If", equals("i", "j"), floored(sumOver(vertices, distance("i", "w"), "w")), subtract(0, distance("i", "j"))],
    "j",
  ),
  "i",
);
/** `body` over the matrix called `name`, for a connected graph; any other gives 0. */
const withConnectedSpectrum = (name: string, rows: MathJSON, body: MathJSON): MathJSON =>
  withDistances([
    "If",
    equals(componentsIn("distances"), 1),
    name === "distances"
      ? withCoefficients(name, body)
      : bindList(name, rows, withCoefficients(name, body), "list<list<integer>>"),
    0,
  ]);

export const GRAPH_STATISTICS: readonly Definition[] = [
  stat("GraphEdgeCount", "The edges of the graph.", length(at(2)), `FindStat's St000081. ${NO_VERTICES}`),
  stat(
    "MaximumDegree",
    "The greatest number of edges at one vertex.",
    withDegrees(["Max", "degrees"]),
    `FindStat's St000171. ${NO_VERTICES}`,
  ),
  stat(
    "MinimumDegree",
    "The fewest edges at one vertex.",
    withDegrees(["Min", "degrees"]),
    `FindStat's St000310. ${NO_VERTICES}`,
  ),
  stat(
    "EvenDegreeVertexCount",
    "The vertices with an even number of edges.",
    withDegrees(overDegrees(one(equals(["Mod", "d", 2], 0)))),
    `FindStat's St000309. ${NO_VERTICES}`,
  ),
  stat(
    "OddDegreeVertexCount",
    "The vertices with an odd number of edges.",
    withDegrees(overDegrees(one(equals(["Mod", "d", 2], 1)))),
    `FindStat's St000311. ${NO_VERTICES}`,
  ),
  stat(
    "GraphLeafCount",
    "The vertices with exactly one edge.",
    withDegrees(overDegrees(one(equals("d", 1)))),
    `FindStat's St000312. ${NO_VERTICES}`,
  ),
  stat(
    "DegreeTwoVertexCount",
    "The vertices with exactly two edges.",
    withDegrees(overDegrees(one(equals("d", 2)))),
    `FindStat's St000313. ${NO_VERTICES}`,
  ),
  stat(
    "IsolatedVertexCount",
    "The vertices with no edge.",
    withDegrees(overDegrees(one(equals("d", 0)))),
    `FindStat's St000315. ${NO_VERTICES}`,
  ),
  stat(
    "FirstZagrebIndex",
    "The sum of the squares of the degrees.",
    withDegrees(overDegrees(times("d", "d"))),
    `FindStat's St000465. ${NO_VERTICES}`,
  ),
  stat(
    "SecondZagrebIndex",
    "The sum over the edges of the product of the degrees of its ends.",
    withDegrees(floored(sumOver("edges", times(degree(lower("e")), degree(upper("e"))), "e"))),
    `FindStat's St000361. ${NO_VERTICES}`,
  ),
  stat(
    "ForgottenIndex",
    "The sum of the cubes of the degrees.",
    withDegrees(overDegrees(times("d", times("d", "d")))),
    `FindStat's St000571, the F-index. ${NO_VERTICES}`,
  ),
  stat(
    "OreDegree",
    "The greatest sum of the degrees of the two ends of an edge.",
    withDegrees([
      "If",
      equals(length("edges"), 0),
      0,
      ["Max", forEach("edges", add(degree(lower("e")), degree(upper("e"))), "e")],
    ]),
    `FindStat's St000915. A graph with no edge gives 0.`,
  ),
  stat(
    "TotalIrregularity",
    "The sum over the unordered pairs of vertices of the difference of their degrees.",
    withDegrees(
      spread(floored(sumOver("degrees", floored(sumOver("degrees", ["Abs", subtract("d", "q")], "q")), "d"))),
    ),
    `FindStat's St001522. ${NO_VERTICES}`,
  ),
  stat(
    "AlbertsonIndex",
    "The sum over the edges of the difference of the degrees of its ends.",
    withDegrees(floored(sumOver("edges", ["Abs", subtract(degree(lower("e")), degree(upper("e")))], "e"))),
    `FindStat's St001351, the sum of |d(u) - d(v)| over the edges uv. ${NO_VERTICES}`,
  ),
  stat(
    "MaximumDegreeVertexCount",
    "The vertices whose degree is the greatest.",
    withDegrees(bind("top", ["Max", "degrees"], overDegrees(one(equals("d", "top"))), "integer")),
    `FindStat's St001368. ${NO_VERTICES}`,
  ),
  stat(
    "TriangleCount",
    "The triples of vertices that are pairwise adjacent.",
    withAdjacency(
      floored(
        sumOver(
          "edges",
          floored(
            sumOver(
              vertices,
              times(one(greater("w", upper("e"))), times(adjacent(lower("e"), "w"), adjacent(upper("e"), "w"))),
              "w",
            ),
          ),
          "e",
        ),
      ),
    ),
    `FindStat's St000095. An edge uv and a vertex w above v adjacent to both. ${NO_VERTICES}`,
  ),
  stat(
    "TriangleVertexCount",
    "The vertices on a triangle.",
    withAdjacency(triangleVertices),
    `FindStat's St001995. A vertex lies on a triangle when it is adjacent to both ends of some edge. ${NO_VERTICES}`,
  ),
  stat(
    "InducedPathOnThreeVerticesCount",
    "The sets of three vertices that induce a path: exactly two of the three edges.",
    withAdjacency(
      floored(
        sumOver(
          vertices,
          floored(
            sumOver(
              vertices,
              floored(
                sumOver(
                  vertices,
                  times(
                    one(less("u", "w")),
                    times(
                      one(less("w", "x")),
                      one(equals(add(add(adjacent("u", "w"), adjacent("u", "x")), adjacent("w", "x")), 2)),
                    ),
                  ),
                  "x",
                ),
              ),
              "w",
            ),
          ),
          "u",
        ),
      ),
    ),
    `FindStat's St001308. ${NO_VERTICES}`,
  ),
  stat(
    "FourCliqueCount",
    "The sets of four vertices that are pairwise adjacent.",
    withMasks(overMasks(one(["And", equals(total("m"), 4), isClique("m")]))),
    `FindStat's St001309. ${NO_VERTICES}`,
  ),
  stat(
    "MaximumDistance",
    "The greatest distance between two vertices: the diameter.",
    withDistances(
      bindList("eccentricity", forEach(vertices, ["Max", at("u", "distances")], "u"), [
        "If",
        less(["Max", "eccentricity"], "n"),
        ["Max", "eccentricity"],
        "PositiveInfinity",
      ]),
    ),
    `FindStat's St000259, of a connected graph; a graph with two components has an infinite diameter. ${NO_VERTICES}`,
  ),
  stat(
    "MinimumEccentricity",
    "The least eccentricity of a vertex, the greatest distance from it to another vertex: the radius.",
    withDistances(
      bindList("eccentricity", forEach(vertices, ["Max", at("u", "distances")], "u"), [
        "If",
        less(["Min", "eccentricity"], "n"),
        ["Min", "eccentricity"],
        "PositiveInfinity",
      ]),
    ),
    `FindStat's St000260, of a connected graph; with two components every vertex has an infinite eccentricity. ${NO_VERTICES}`,
  ),
  stat(
    "WienerIndex",
    "The sum of the distances over the pairs of vertices that are joined by a path.",
    withDistances(spread(overPairs(["If", less(distance("u", "w"), "n"), distance("u", "w"), 0]))),
    `FindStat's St000265, the Wiener index; a pair with no path adds nothing. ${NO_VERTICES}`,
  ),
  stat(
    "DistanceTwoPairCount",
    "The pairs of vertices at distance 2.",
    withDistances(pairsAtDistance(2)),
    `FindStat's St000448. ${NO_VERTICES}`,
  ),
  stat(
    "DistanceThreePairCount",
    "The pairs of vertices at distance 3.",
    withDistances(pairsAtDistance(3)),
    `FindStat's St000447. ${NO_VERTICES}`,
  ),
  stat(
    "DistanceFourPairCount",
    "The pairs of vertices at distance 4.",
    withDistances(pairsAtDistance(4)),
    `FindStat's St000449. ${NO_VERTICES}`,
  ),
  stat(
    "GraphComponentCount",
    "The connected components: the vertices that are the first of their component.",
    withAdjacency(componentCount),
    `FindStat's St000287. ${NO_VERTICES}`,
  ),
  stat(
    "ComplementComponentCount",
    "The connected components of the complement graph.",
    withAdjacency(
      componentsOfMatrix(
        forEach(vertices, forEach(vertices, ["If", equals("i", "j"), 0, subtract(1, adjacent("i", "j"))], "j"), "i"),
      ),
    ),
    `FindStat's St000286. ${NO_VERTICES}`,
  ),
  stat(
    "CutVertexCount",
    "The vertices whose deletion leaves more components.",
    withAdjacency(
      bind(
        "components",
        componentCount,
        floored(
          sumOver(
            vertices,
            one(
              greater(componentsOfMatrix(adjacencyWithout((u) => ["If", equals(u, "v"), 1, 0])), add("components", 1)),
            ),
            "v",
          ),
        ),
        "integer",
      ),
    ),
    `FindStat's St000552. The deleted vertex stays as an isolated one, a component of its own. ${NO_VERTICES}`,
  ),
  stat(
    "BridgeCount",
    "The edges whose deletion leaves more components.",
    withAdjacency(
      bind(
        "components",
        componentCount,
        floored(
          sumOver(
            "edges",
            one(
              greater(
                componentsOfMatrix(
                  forEach(
                    vertices,
                    forEach(
                      vertices,
                      subtract(
                        adjacent("i", "j"),
                        add(
                          times(one(equals(lower("e"), "i")), one(equals(upper("e"), "j"))),
                          times(one(equals(lower("e"), "j")), one(equals(upper("e"), "i"))),
                        ),
                      ),
                      "j",
                    ),
                    "i",
                  ),
                ),
                "components",
              ),
            ),
            "e",
          ),
        ),
        "integer",
      ),
    ),
    `FindStat's St001479. ${NO_VERTICES}`,
  ),
  stat(
    "CyclomaticNumber",
    "The edges less the vertices plus the components: the independent cycles.",
    withAdjacency(add(subtract(length("edges"), "n"), componentCount)),
    `FindStat's St001311. ${NO_VERTICES}`,
  ),
  stat(
    "IndependenceNumber",
    "The most vertices that are pairwise non-adjacent.",
    withMasks(largestMask(isIndependent("m"))),
    `FindStat's St000093. ${NO_VERTICES}`,
  ),
  stat(
    "CliqueNumber",
    "The most vertices that are pairwise adjacent.",
    withMasks(largestMask(isClique("m"))),
    `FindStat's St000097. A set of s vertices is a clique when it holds s(s - 1) / 2 edges. ${NO_VERTICES}`,
  ),
  stat(
    "ChromaticNumber",
    "The fewest colors for the vertices so that adjacent vertices differ.",
    withMasks(chromaticNumber),
    `FindStat's St000098. The colorings in k colors are counted as the covers of the vertices by k independent sets, Σ over the subsets S of (-1)^(n - |S|) i(S)^k with i(S) the independent sets inside S, and the number is the least k with one. ${NO_VERTICES}`,
  ),
  stat(
    "IndependentSetCount",
    "The sets of vertices, the empty set included, with no two adjacent.",
    withMasks(overMasks(one(isIndependent("m"))), 1),
    `FindStat's St000300. The graph with no vertices has the empty set, so 1.`,
  ),
  stat(
    "MaximalIndependentSetCount",
    "The independent sets of vertices that no vertex can be added to.",
    withMasks(overMasks(isMaximalIndependent("m")), 1),
    `FindStat's St001304. The graph with no vertices has the empty set, so 1.`,
  ),
  stat(
    "VertexCoverNumber",
    "The fewest vertices that meet every edge: the vertices less the independence number.",
    withMasks(subtract("n", largestMask(isIndependent("m")))),
    `FindStat's St000362. ${NO_VERTICES}`,
  ),
  stat(
    "ConnectedInducedSubgraphCount",
    "The nonempty sets of vertices that induce a connected subgraph.",
    withMasks(floored(["Sum", connectedMasks])),
    `FindStat's St001441. A set is connected when removing one of its vertices that is adjacent to the rest leaves a connected set; every connected graph has such a vertex. ${NO_VERTICES}`,
  ),
  stat(
    "MatchingNumber",
    "The most edges with no two sharing a vertex.",
    withMasks(
      lastEntry(
        matchingTable(
          0,
          (f) => add(f, 1),
          (without, matched) => ["Max", without, ["Max", matched]],
        ),
      ),
    ),
    `FindStat's St000387. ${NO_VERTICES}`,
  ),
  stat(
    "HosoyaIndex",
    "The sets of edges with no two sharing a vertex, the empty set included.",
    withMasks(
      lastEntry(
        matchingTable(
          1,
          (f) => f,
          (without, matched) => add(without, floored(["Sum", matched])),
        ),
      ),
      1,
    ),
    `FindStat's St000468. The graph with no vertices has the empty set, so 1.`,
  ),
  stat(
    "MinimumVertexCoverCount",
    "The vertex covers with the fewest vertices: the independent sets with the most.",
    withMasks(
      bind(
        "top",
        largestMask(isIndependent("m")),
        overMasks(times(one(isIndependent("m")), one(equals(total("m"), "top")))),
        "integer",
      ),
      1,
    ),
    `FindStat's St000363: the covers of the least possible size, which are the complements of the largest independent sets. The graph with no vertices has the empty cover, so 1.`,
  ),
  stat(
    "SpanningTreeCount",
    "The spanning trees: by the matrix-tree theorem, the determinant of the Laplacian with its last row and column deleted.",
    withDegrees(
      bindList(
        "totals",
        vertexTotals,
        bindList(
          "adjacency",
          adjacencyMatrix,
          bindList(
            "laplacian",
            forEach(
              vertices,
              forEach(vertices, ["If", equals("i", "j"), degree("i"), subtract(0, adjacent("i", "j"))], "j"),
              "i",
            ),
            ["If", equals("n", 1), 1, determinantOf("laplacian", subtract("n", 1))],
            "list<list<integer>>",
          ),
          "list<list<integer>>",
        ),
      ),
    ),
    `FindStat's St000096. A graph with two components has none. ${NO_VERTICES}`,
  ),
  stat(
    "AdjacencyDeterminant",
    "The determinant of the adjacency matrix.",
    withTotals(bindList("adjacency", adjacencyMatrix, determinantOf("adjacency", "n"), "list<list<integer>>"), 1),
    `FindStat's St000351. The graph with no vertices has the empty determinant, 1.`,
  ),
  stat(
    "DegreeRange",
    "The greatest degree less the least.",
    withDegrees(subtract(["Max", "degrees"], ["Min", "degrees"])),
    `FindStat's St001742. ${NO_VERTICES}`,
  ),
  stat(
    "MaximumDegreeMultiplicity",
    "The most vertices that share one degree.",
    withDegrees(["Max", forEach("degrees", overDegrees(one(equals("d", "q"))), "q")]),
    `FindStat's St001366. ${NO_VERTICES}`,
  ),
  stat(
    "SmallestMissingDegree",
    "The least number, 0 or more, that is not the degree of any vertex.",
    withDegrees([
      "Min",
      forEach(["Range", 0, "n"], ["If", equals(overDegrees(one(equals("d", "k"))), 0), "k", add("n", 1)], "k"),
    ]),
    `FindStat's St001367. ${NO_VERTICES}`,
  ),
  stat(
    "DistinctNeighborhoodCount",
    "The different sets of neighbors the vertices have.",
    withAdjacency(
      floored(
        sumOver(
          vertices,
          one(
            equals(
              floored(
                sumOver(
                  vertices,
                  times(
                    one(less("u", "v")),
                    one(
                      equals(
                        floored(sumOver(vertices, ["Abs", subtract(adjacent("u", "w"), adjacent("v", "w"))], "w")),
                        0,
                      ),
                    ),
                  ),
                  "u",
                ),
              ),
              0,
            ),
          ),
          "v",
        ),
      ),
    ),
    `FindStat's St000722: the vertices whose row of the adjacency matrix has no equal row above it. Two adjacent vertices never share a neighborhood. ${NO_VERTICES}`,
  ),
  stat(
    "SzegedIndex",
    "The sum over the edges of the vertices nearer one end times those nearer the other.",
    withDistances(
      floored(
        sumOver(
          "edges",
          times(
            floored(sumOver(vertices, one(less(distance(lower("e"), "w"), distance(upper("e"), "w"))), "w")),
            floored(sumOver(vertices, one(less(distance(upper("e"), "w"), distance(lower("e"), "w"))), "w")),
          ),
          "e",
        ),
      ),
    ),
    `FindStat's St000263. A vertex in another component is as far from both ends, so is in neither count. ${NO_VERTICES}`,
  ),
  stat(
    "SchultzIndex",
    "The sum over the pairs of vertices of the sum of their degrees times their distance.",
    withDegreesAndDistances(
      spread(
        overPairs(["If", less(distance("u", "w"), "n"), times(add(degree("u"), degree("w")), distance("u", "w")), 0]),
      ),
    ),
    `FindStat's St000464, of a connected graph; a pair with no path adds nothing. ${NO_VERTICES}`,
  ),
  stat(
    "GutmanIndex",
    "The sum over the pairs of vertices of the product of their degrees times their distance.",
    withDegreesAndDistances(
      spread(
        overPairs(["If", less(distance("u", "w"), "n"), times(times(degree("u"), degree("w")), distance("u", "w")), 0]),
      ),
    ),
    `FindStat's St000466, the modified Schultz index, of a connected graph; a pair with no path adds nothing. ${NO_VERTICES}`,
  ),
  stat(
    "HyperWienerIndex",
    "The sum over the pairs of vertices of their distance plus its square.",
    withDistances(
      spread(
        overPairs([
          "If",
          less(distance("u", "w"), "n"),
          add(distance("u", "w"), times(distance("u", "w"), distance("u", "w"))),
          0,
        ]),
      ),
    ),
    `FindStat's St000467, of a connected graph; a pair with no path adds nothing. ${NO_VERTICES}`,
  ),
  stat(
    "CenterVertexCount",
    "The vertices whose greatest distance to another vertex is the least.",
    withDistances(
      bindList(
        "eccentricity",
        forEach(vertices, ["Max", at("u", "distances")], "u"),
        floored(sumOver("eccentricity", one(equals("c", ["Min", "eccentricity"])), "c")),
      ),
    ),
    `FindStat's St001342. In a disconnected graph every vertex is as far as 2n from another, so all are central. ${NO_VERTICES}`,
  ),
  stat(
    "Girth",
    "The length of the shortest cycle.",
    withPaths(
      true,
      bindList(
        "shortest",
        ["Min", forEach(masksFromOne, ["If", greater(cyclesTwice("s"), 0), total("s"), add("n", 1)], "s")],
        ["If", greater("shortest", "n"), "PositiveInfinity", "shortest"],
        "integer",
      ),
    ),
    `FindStat's St000264, of a graph that is not a tree; a graph without a cycle has an infinite girth. ${NO_VERTICES}`,
  ),
  stat(
    "GraphLongestCycleLength",
    "The length of the longest cycle.",
    withPaths(true, ["Max", forEach(masksFromOne, ["If", greater(cyclesTwice("s"), 0), total("s"), 0], "s")]),
    `FindStat's St000637; a graph without a cycle gives 0. ${NO_VERTICES}`,
  ),
  stat(
    "GraphCycleCount",
    "The cycles, each counted once however it is started or turned.",
    withPaths(true, spread(floored(["Sum", forEach(masksFromOne, cyclesTwice("s"), "s")]))),
    `FindStat's St001736. ${NO_VERTICES}`,
  ),
  stat(
    "LongestPathLength",
    "The edges of the longest path.",
    withPaths(false, [
      "Max",
      forEach(
        masksFromOne,
        ["If", greater(floored(sumOver(vertices, at(pathAt("s", "e"), "paths"), "e")), 0), subtract(total("s"), 1), 0],
        "s",
      ),
    ]),
    `FindStat's St001120. ${NO_VERTICES}`,
  ),
  stat(
    "MaximumCutSize",
    "The most edges between the two sides of a division of the vertices.",
    withMasks(["Max", forEach(masks, subtract(length("edges"), uncut("m")), "m")]),
    `FindStat's St001869. ${NO_VERTICES}`,
  ),
  stat(
    "BipartiteEdgeDeletionNumber",
    "The fewest edges whose deletion leaves a bipartite graph.",
    withMasks(["Min", forEach(masks, uncut("m"), "m")]),
    `FindStat's St001572: the edges that fall inside the sides of the best division. ${NO_VERTICES}`,
  ),
  stat(
    "PerfectMatchingCount",
    "The sets of edges that meet every vertex exactly once.",
    withMasks(
      lastEntry(
        matchingTable(
          1,
          (f) => f,
          (_without, matched) => floored(["Sum", matched]),
        ),
      ),
      1,
    ),
    `FindStat's St000274. The graph with no vertices has the empty set, so 1.`,
  ),
  stat(
    "InducedMatchingNumber",
    "The most edges whose ends induce a subgraph that is just those edges.",
    withNeighborsIn(spread(["Max", sizeUnlessAny((d) => ["NotEqual", d, 1])])),
    `FindStat's St001393: half the vertices of the largest set in which every vertex has exactly one neighbor. ${NO_VERTICES}`,
  ),
  stat(
    "DominationNumber",
    "The fewest vertices such that every vertex is one of them or adjacent to one.",
    withDominating(["Min", forEach(masks, ["If", equals(isDominating("m"), 1), total("m"), "n"], "m")]),
    `FindStat's St000273. ${NO_VERTICES}`,
  ),
  stat(
    "DominatingSetCount",
    "The sets of vertices such that every vertex is in the set or adjacent to one of it.",
    withDominating(overMasks(isDominating("m")), 1),
    `FindStat's St001303. The graph with no vertices has the empty set, so 1.`,
  ),
  stat(
    "MinimalDominatingSetCount",
    "The dominating sets that stop dominating when any vertex is dropped.",
    withDominating(overMasks(isMinimalDominating("m")), 1),
    `FindStat's St001302. The graph with no vertices has the empty set, so 1.`,
  ),
  stat(
    "UpperDominationNumber",
    "The most vertices in a minimal dominating set.",
    withDominating(["Max", forEach(masks, times(isMinimalDominating("m"), total("m")), "m")]),
    `FindStat's St001337. ${NO_VERTICES}`,
  ),
  stat(
    "IndependentDominationNumber",
    "The fewest vertices in a set that is independent and dominating: a maximal independent set.",
    withDominating([
      "Min",
      forEach(masks, ["If", equals(times(isDominating("m"), one(isIndependent("m"))), 1), total("m"), "n"], "m"),
    ]),
    `FindStat's St001322. ${NO_VERTICES}`,
  ),
  stat(
    "GraphDifferential",
    "The most that the vertices next to a set, outside it, exceed the set in number.",
    withNeighborsIn([
      "Max",
      forEach(
        masks,
        subtract(
          floored(
            sumOver(vertices, times(subtract(1, one(hasBit("m", "v"))), one(greater(neighborsIn("m", "v"), 0))), "v"),
          ),
          total("m"),
        ),
        "m",
      ),
    ]),
    `FindStat's St001723; the empty set gives 0. ${NO_VERTICES}`,
  ),
  stat(
    "Degeneracy",
    "The greatest, over the sets of vertices, of the least number of neighbors a vertex has inside the set.",
    withNeighborsIn([
      "Max",
      forEach(
        masks,
        [
          "If",
          equals(total("m"), 0),
          0,
          ["Min", forEach(vertices, ["If", hasBit("m", "v"), neighborsIn("m", "v"), add("n", 1)], "v")],
        ],
        "m",
      ),
    ]),
    `FindStat's St001277. ${NO_VERTICES}`,
  ),
  stat(
    "DissociationNumber",
    "The most vertices in a set in which every vertex has at most one neighbor.",
    withNeighborsIn(["Max", sizeUnlessAny((d) => greater(d, 1))]),
    `FindStat's St001315. ${NO_VERTICES}`,
  ),
  stat(
    "GraphVertexConnectivity",
    "The fewest vertices whose deletion leaves a disconnected graph; the complete graph on n vertices gives n - 1.",
    withMasks(
      bindList("connected", connectedMasks, [
        "Min",
        forEach(
          masks,
          [
            "If",
            equals(
              times(
                one(less("m", subtract(["Power", 2, "n"], 1))),
                subtract(1, at(add(subtract(subtract(["Power", 2, "n"], 1), "m"), 1), "connected")),
              ),
              1,
            ),
            total("m"),
            subtract("n", 1),
          ],
          "m",
        ),
      ]),
    ),
    `FindStat's St000262. A disconnected graph gives 0. ${NO_VERTICES}`,
  ),
  stat(
    "InducedFourCycleCount",
    "The sets of four vertices that induce a cycle: every one has exactly two neighbors among the four.",
    withNeighborsIn(
      overMasks(
        times(
          one(equals(total("m"), 4)),
          one(
            equals(
              misfits("m", (d) => ["NotEqual", d, 2]),
              0,
            ),
          ),
        ),
      ),
    ),
    `FindStat's St001305. ${NO_VERTICES}`,
  ),
  stat(
    "GraphEdgeConnectivity",
    "The fewest edges whose deletion leaves a disconnected graph: the fewest edges between a set of vertices and the rest.",
    withMasks([
      "If",
      less("n", 2),
      0,
      ["Min", forEach(["Range", 1, subtract(["Power", 2, "n"], 2)], subtract(length("edges"), uncut("m")), "m")],
    ]),
    `FindStat's St000261. A disconnected graph gives 0, and so does the graph with one vertex. ${NO_VERTICES}`,
  ),
  stat(
    "SpanningSubgraphCount",
    "The subgraphs on all the vertices: 2 to the power of the number of edges.",
    withGraph(["Power", 2, length("edges")], 1),
    `FindStat's St000343, the Tutte polynomial at x = y = 2. The graph with no vertices has one, so 1.`,
  ),
  stat(
    "DegreeSum",
    "The sum of the degrees: twice the number of edges.",
    times(2, length(at(2))),
    `FindStat's St000350. ${NO_VERTICES}`,
  ),
  stat(
    "EulerFaceCount",
    "The edges less the vertices plus 2: the faces of a connected planar graph.",
    add(subtract(length(at(2)), at(1)), 2),
    `FindStat's St000450. The graph with no vertices gives 2, the formula as written.`,
  ),
  stat(
    "BlockCount",
    "The blocks: the maximal connected subgraphs with no cut vertex; an isolated vertex is a block.",
    withAdjacency(
      bind(
        "components",
        componentCount,
        add(
          "components",
          floored(
            sumOver(
              vertices,
              [
                "If",
                greater(floored(sumOver(vertices, adjacent("v", "w"), "w")), 0),
                subtract(
                  componentsOfMatrix(adjacencyWithout((u) => ["If", equals(u, "v"), 1, 0])),
                  add("components", 1),
                ),
                0,
              ],
              "v",
            ),
          ),
        ),
        "integer",
      ),
    ),
    `FindStat's St000553. The blocks of a component are one, plus for each cut vertex the components it leaves, less one; each vertex with an edge adds the components its deletion leaves in its own component, less one. The deleted vertex stays as an isolated one, a component of its own. ${NO_VERTICES}`,
  ),
  stat(
    "MaximumNeighborhoodMultiplicity",
    "The most vertices that have the same set of neighbors.",
    withAdjacency(["Max", forEach(vertices, floored(sumOver(vertices, sameNeighbors("u", "v"), "u")), "v")]),
    `FindStat's St000723. ${NO_VERTICES}`,
  ),
  stat(
    "GraphPackingNumber",
    "The most vertices, no two within distance 2: the closed neighborhoods of the vertices are disjoint.",
    largestWithoutOverfull(1, true),
    `FindStat's St000916. A set is a packing when every vertex has at most one member among itself and its neighbors. ${NO_VERTICES}`,
  ),
  stat(
    "GraphOpenPackingNumber",
    "The most vertices with pairwise disjoint sets of neighbors.",
    largestWithoutOverfull(1, false),
    `FindStat's St000917. A set is an open packing when every vertex has at most one member among its neighbors. ${NO_VERTICES}`,
  ),
  stat(
    "GraphTwoLimitedPackingNumber",
    "The most vertices in a set that has at most two members among the closed neighborhood of any vertex.",
    largestWithoutOverfull(2, true),
    `FindStat's St000918. ${NO_VERTICES}`,
  ),
  stat(
    "CliqueCocliqueNumber",
    "The clique number times the independence number.",
    withMasks(times(largestMask(isClique("m")), largestMask(isIndependent("m")))),
    `FindStat's St000926. ${NO_VERTICES}`,
  ),
  stat(
    "AnnihilationNumber",
    "The most vertices whose degrees add up to at most the number of edges.",
    withMasks(
      bindList("degrees", degreeList, [
        "Max",
        forEach(
          masks,
          times(
            one(
              less(floored(sumOver(vertices, times(one(hasBit("m", "v")), degree("v")), "v")), add(length("edges"), 1)),
            ),
            total("m"),
          ),
          "m",
        ),
      ]),
    ),
    `FindStat's St001286: the largest k with the k smallest degrees adding up to at most the edges; the best set of k vertices is those. ${NO_VERTICES}`,
  ),
  stat(
    "InducedPathOnFourVerticesCount",
    "The sets of four vertices that induce a path: three edges, and every vertex has one or two neighbors among the four.",
    inducedFourVertexCount(3, (d) => greater(["Abs", subtract(times(2, d), 3)], 1), 0),
    `FindStat's St001306. ${NO_VERTICES}`,
  ),
  stat(
    "InducedStarOnFourVerticesCount",
    "The sets of four vertices that induce a star: three edges, and one vertex has all three others as neighbors.",
    inducedFourVertexCount(3, (d) => equals(d, 3), 1),
    `FindStat's St001307. ${NO_VERTICES}`,
  ),
  stat(
    "InducedDiamondCount",
    "The sets of four vertices that induce a diamond: a cycle on four vertices with one chord, five edges.",
    withMasks(overMasks(times(one(equals(total("m"), 4)), one(equals(inside("m"), 5))))),
    `FindStat's St001310. The only graph on four vertices with five edges is the diamond. ${NO_VERTICES}`,
  ),
  stat(
    "LargestInducedForestSize",
    "The most vertices that induce a graph with no cycle.",
    withNeighborsIn(bindList("forests", forestMasks, largestForest)),
    `FindStat's St001321. ${NO_VERTICES}`,
  ),
  stat(
    "IndependenceGap",
    "The independence number less the fewest vertices of a maximal independent set.",
    withMasks(
      subtract(largestMask(isIndependent("m")), [
        "Min",
        forEach(masks, ["If", equals(isMaximalIndependent("m"), 1), total("m"), "n"], "m"),
      ]),
    ),
    `FindStat's St001323; 0 when every maximal independent set is as large as can be. ${NO_VERTICES}`,
  ),
  stat(
    "FeedbackVertexSetNumber",
    "The fewest vertices whose deletion leaves a graph with no cycle.",
    withNeighborsIn(bindList("forests", forestMasks, subtract("n", largestForest))),
    `FindStat's St001331: the vertices less the largest induced forest. ${NO_VERTICES}`,
  ),
  stat(
    "CenterEdgeCount",
    "The edges with both ends in the center.",
    withDistances(
      bindList(
        "eccentricity",
        forEach(vertices, ["Max", at("u", "distances")], "u"),
        bind(
          "least",
          ["Min", "eccentricity"],
          floored(
            sumOver(
              "edges",
              times(
                one(equals(at(lower("e"), "eccentricity"), "least")),
                one(equals(at(upper("e"), "eccentricity"), "least")),
              ),
              "e",
            ),
          ),
          "integer",
        ),
      ),
    ),
    `FindStat's St001341. In a disconnected graph every vertex is central, as for CenterVertexCount. ${NO_VERTICES}`,
  ),
  stat(
    "SameNeighborhoodPairCount",
    "The pairs of vertices that have the same set of neighbors.",
    withAdjacency(overPairs(times(one(less("u", "w")), sameNeighbors("u", "w")))),
    `FindStat's St001347. ${NO_VERTICES}`,
  ),
  stat(
    "HalfAlbertsonIndex",
    "Half the sum over the edges of the difference of the degrees of its ends.",
    withDegrees(spread(floored(sumOver("edges", ["Abs", subtract(degree(lower("e")), degree(upper("e")))], "e")))),
    `FindStat's St001350. The sum is always even. ${NO_VERTICES}`,
  ),
  stat(
    "HalfTotalIrregularity",
    "Half the sum over the unordered pairs of vertices of the difference of their degrees.",
    withDegrees([
      "Divide",
      floored(sumOver("degrees", floored(sumOver("degrees", ["Abs", subtract("d", "q")], "q")), "d")),
      4,
    ]),
    `FindStat's St001521. Four times it is the sum over the ordered pairs. ${NO_VERTICES}`,
  ),
  stat(
    "LargestInducedStarSize",
    "The most vertices that induce a star: one vertex adjacent to all the others, which are not adjacent to each other. A single vertex is a star.",
    withNeighborsIn([
      "Max",
      forEach(
        masks,
        times(
          total("m"),
          times(
            one(equals(inside("m"), subtract(total("m"), 1))),
            one(
              greater(
                misfits("m", (d) => equals(d, subtract(total("m"), 1))),
                0,
              ),
            ),
          ),
        ),
        "m",
      ),
    ]),
    `FindStat's St001674. A set is a star when it has one fewer edges than vertices and a vertex with all the others as neighbors. ${NO_VERTICES}`,
  ),
  stat(
    "CelebrityCount",
    "The vertices of whom more than half the neighbors have a smaller degree.",
    withDegreesAndAdjacency(
      floored(
        sumOver(
          vertices,
          one(
            greater(
              times(
                2,
                neighborsWhere((d) => less(d, degree("v"))),
              ),
              degree("v"),
            ),
          ),
          "v",
        ),
      ),
    ),
    `FindStat's St001689. ${NO_VERTICES}`,
  ),
  stat(
    "KingCount",
    "The vertices whose neighbors all have a smaller degree; an isolated vertex counts.",
    withDegreesAndAdjacency(
      floored(
        sumOver(
          vertices,
          one(
            equals(
              neighborsWhere((d) => atLeastValue(d, degree("v"))),
              0,
            ),
          ),
          "v",
        ),
      ),
    ),
    `FindStat's St001691. ${NO_VERTICES}`,
  ),
  stat(
    "AboveAverageDegreeVertexCount",
    "The vertices whose degree is greater than the average degree.",
    withDegrees(overDegrees(one(greater(times("d", "n"), times(2, length("edges")))))),
    `FindStat's St001692. ${NO_VERTICES}`,
  ),
  stat(
    "AbsoluteAdjacencyDeterminant",
    "The absolute value of the determinant of the adjacency matrix.",
    withTotals(
      bindList("adjacency", adjacencyMatrix, ["Abs", determinantOf("adjacency", "n")], "list<list<integer>>"),
      1,
    ),
    `FindStat's St001702. The graph with no vertices has the empty determinant, 1.`,
  ),
  stat(
    "DifferentDegreePairCount",
    "The pairs of vertices whose degrees differ.",
    withDegrees(
      spread(floored(sumOver("degrees", floored(sumOver("degrees", one(["NotEqual", "d", "q"]), "q")), "d"))),
    ),
    `FindStat's St001708. ${NO_VERTICES}`,
  ),
  stat(
    "ChromaticCliqueGap",
    "The chromatic number less the clique number.",
    withMasks(subtract(chromaticNumber, largestMask(isClique("m")))),
    `FindStat's St001793, which is 0 on a weakly perfect graph. ${NO_VERTICES}`,
  ),
  stat(
    "TuranEdgeExcess",
    "The edges less those of the complement of the Turán graph with as many parts as the independence number: disjoint cliques as equal in size as possible.",
    withMasks(
      bind(
        "parts",
        largestMask(isIndependent("m")),
        bind(
          "extra",
          ["Mod", "n", "parts"],
          bind(
            "size",
            ["Divide", subtract("n", "extra"), "parts"],
            subtract(
              length("edges"),
              spread(
                add(
                  times("extra", times(add("size", 1), "size")),
                  times(subtract("parts", "extra"), times("size", subtract("size", 1))),
                ),
              ),
            ),
            "integer",
          ),
          "integer",
        ),
        "integer",
      ),
    ),
    `FindStat's St001798, nonnegative by Turán's theorem. The independence number is the number of cliques; n mod it of them have one more vertex than the rest. ${NO_VERTICES}`,
  ),
  stat(
    "MaximumLeafNeighborCount",
    "The most neighbors of degree 1 a vertex has.",
    withDegreesAndAdjacency([
      "Max",
      forEach(
        vertices,
        neighborsWhere((d) => equals(d, 1)),
        "v",
      ),
    ]),
    `FindStat's St001826. ${NO_VERTICES}`,
  ),
  stat(
    "NonTriangleVertexCount",
    "The vertices on no triangle.",
    withAdjacency(subtract("n", triangleVertices)),
    `FindStat's St001996. ${NO_VERTICES}`,
  ),
  stat(
    "AdjacencyPositiveEigenvalueCount",
    "The positive eigenvalues of the adjacency matrix, with multiplicity.",
    withAdjacencySpectrum(positiveEigenvalues),
    `FindStat's St000985. The adjacency matrix is symmetric, so the eigenvalues are real and Descartes' rule counts the positive ones as the sign changes of the characteristic polynomial. ${NO_VERTICES}`,
  ),
  stat(
    "AdjacencyNegativeEigenvalueCount",
    "The negative eigenvalues of the adjacency matrix, with multiplicity.",
    withAdjacencySpectrum(negativeEigenvalues),
    `FindStat's St001971: the sign changes of the characteristic polynomial at -x. ${NO_VERTICES}`,
  ),
  stat(
    "AdjacencyNullity",
    "The multiplicity of the eigenvalue zero of the adjacency matrix: the vertices less the positive and negative eigenvalues.",
    withEigenvalueSigns(subtract("n", add("positive", "negative"))),
    `FindStat's St000986. ${NO_VERTICES}`,
  ),
  stat(
    "AdjacencyRank",
    "The rank of the adjacency matrix: its nonzero eigenvalues, with multiplicity.",
    withEigenvalueSigns(add("positive", "negative")),
    `FindStat's St001458. ${NO_VERTICES}`,
  ),
  stat(
    "NullspaceZeroColumnCount",
    "The vertices whose coordinate is zero in every vector of the adjacency matrix's nullspace.",
    withAdjacency(
      bind(
        "rank",
        rankWith(forEach(vertices, 0, "t")),
        floored(sumOver(vertices, one(equals(rankWith(unitRow("v")), "rank")), "v")),
        "integer",
      ),
    ),
    `FindStat's St001459. The adjacency matrix is symmetric, so a vertex's coordinate vanishes on the nullspace exactly when its unit row lies in the row space: appending it leaves the rank unchanged. ${NO_VERTICES}`,
  ),
  stat(
    "NullspaceDistinctColumnCount",
    "The vertices' distinct coordinate functions on the adjacency matrix's nullspace: vertices are alike when every nullspace vector agrees on them.",
    withAdjacency(
      bind(
        "rank",
        rankWith(forEach(vertices, 0, "t")),
        floored(
          sumOver(
            vertices,
            subtract(1, [
              "Min",
              1,
              floored(sumOver(vertices, times(one(less("u", "v")), alikeInNullspace("u", "v")), "u")),
            ]),
            "v",
          ),
        ),
        "integer",
      ),
    ),
    `FindStat's St001463. Vertices u and v agree on every nullspace vector exactly when the unit row of u less that of v lies in the row space, so a vertex starts a new column when no earlier vertex is alike. ${NO_VERTICES}`,
  ),
  stat(
    "GraphSignature",
    "The positive less the negative eigenvalues of the adjacency matrix.",
    withEigenvalueSigns(subtract("positive", "negative")),
    `FindStat's St001970. ${NO_VERTICES}`,
  ),
  stat(
    "NegativeEigenvaluePairGap",
    "The ways to choose a pair of negative eigenvalues of the adjacency matrix, or one of them twice, less the positive eigenvalues.",
    withEigenvalueSigns(subtract(spread(times("negative", add("negative", 1))), "positive")),
    `FindStat's St001969: C(negative + 1, 2) less positive, conjectured nonnegative. ${NO_VERTICES}`,
  ),
  stat(
    "LaplacianPositiveEigenvalueCount",
    "The positive eigenvalues of the Laplacian, with multiplicity.",
    withLaplacianSpectrum(positiveEigenvalues),
    `FindStat's St000987: the vertices less the components. ${NO_VERTICES}`,
  ),
  stat(
    "DistinctEigenvalueCount",
    "The distinct eigenvalues of the adjacency matrix.",
    withAdjacencySpectrum(distinctEigenvalues),
    `FindStat's St000452. The characteristic polynomial has as many distinct roots as its degree less that of its greatest common divisor with its derivative. ${NO_VERTICES}`,
  ),
  stat(
    "DistinctLaplacianEigenvalueCount",
    "The distinct eigenvalues of the Laplacian.",
    withLaplacianSpectrum(distinctEigenvalues),
    `FindStat's St000453. ${NO_VERTICES}`,
  ),
  stat(
    "MaximumEigenvalueMultiplicity",
    "The greatest multiplicity of an eigenvalue of the adjacency matrix.",
    withAdjacencySpectrum(maximumMultiplicity),
    `FindStat's St000776. A root of multiplicity m is a root of the m - 1 greatest common divisors of the polynomial with its derivatives in turn. ${NO_VERTICES}`,
  ),
  stat(
    "MaximumLaplacianEigenvalueMultiplicity",
    "The greatest multiplicity of an eigenvalue of the Laplacian.",
    withLaplacianSpectrum(maximumMultiplicity),
    `FindStat's St000774. ${NO_VERTICES}`,
  ),
  stat(
    "AltshulerSteinbergDeterminant",
    "The determinant of the signless Laplacian, the incidence matrix times its transpose.",
    withSignlessSpectrum(determinantFromCoefficients(1), 1),
    `FindStat's St000368: the constant coefficient of the characteristic polynomial, up to the sign (-1)^n. The graph with no vertices has the empty determinant, 1.`,
  ),
  stat(
    "AltshulerSteinbergQuarter",
    "The determinant of the signless Laplacian divided by 4.",
    withSignlessSpectrum(determinantFromCoefficients(4)),
    `FindStat's St000303. The determinant is a multiple of 4 when it is not 0. ${NO_VERTICES}`,
  ),
  stat(
    "DistanceMatrixDeterminant",
    "The determinant of the distance matrix.",
    withConnectedSpectrum("distances", "distances", determinantFromCoefficients(1)),
    `FindStat's St000302, of a connected graph; a disconnected graph gives 0. ${NO_VERTICES}`,
  ),
  stat(
    "DistinctDistanceLaplacianEigenvalueCount",
    "The distinct eigenvalues of the distance Laplacian.",
    withConnectedSpectrum("distanceLaplacian", distanceLaplacianRows, distinctEigenvalues),
    `FindStat's St000777, of a connected graph; a disconnected graph gives 0. ${NO_VERTICES}`,
  ),
  stat(
    "MaximumDistanceLaplacianEigenvalueMultiplicity",
    "The greatest multiplicity of an eigenvalue of the distance Laplacian.",
    withConnectedSpectrum("distanceLaplacian", distanceLaplacianRows, maximumMultiplicity),
    `FindStat's St000771, of a connected graph; a disconnected graph gives 0. ${NO_VERTICES}`,
  ),
];
