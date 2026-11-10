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
/** The paths that visit the subset `b` and end at `e`, as the paths on `b` less `e` that end at a neighbor of `e`. */
const extendPaths: MathJSON = floored(
  sumOver(
    vertices,
    times(
      one(hasBit(subtract("b", bitValue("e")), "w")),
      times(adjacent("w", "e"), at(pathAt(subtract("b", bitValue("e")), "w"), "a")),
    ),
    "w",
  ),
);
/**
 * The paths of the graph that visit exactly the vertices of a subset and end at a vertex, by subset and end: the entry
 * for subset b and end e counts them. With `fromLowest` a path starts at the lowest vertex of its subset, so a cycle on
 * the subset is counted once for each direction; else it starts anywhere.
 */
const pathTable = (fromLowest: boolean): MathJSON => {
  return typedFolding(
    [
      "Join",
      "a",
      forEach(
        vertices,
        [
          "If",
          hasBit("b", "e"),
          [
            "If",
            equals("b", bitValue("e")),
            1,
            fromLowest ? ["If", equals("e", lowest("b")), 0, extendPaths] : extendPaths,
          ],
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
/** The paths that start at `start`, by subset and end as in `pathTable`. */
const pathTableFrom = (start: MathJSON): MathJSON =>
  typedFolding(
    [
      "Join",
      "a",
      forEach(
        vertices,
        ["If", hasBit("b", "e"), ["If", equals("b", bitValue("e")), one(equals("e", start)), extendPaths], 0],
        "e",
      ),
    ],
    "a",
    "b",
    ["List", 0],
    masksFromOne,
  );
/** `body` with the paths from each start vertex, a table by subset and end as in `pathTable`, bound as "paths", by start. */
const withStartPaths = (body: MathJSON): MathJSON =>
  withGraph(
    bindList(
      "totals",
      vertexTotals,
      bindList(
        "adjacency",
        adjacencyMatrix,
        bindList("paths", forEach(vertices, pathTableFrom("s"), "s"), body, "list<list<integer>>"),
        "list<list<integer>>",
      ),
    ),
  );
/** The neighbors of vertex `x` outside the subset `mask`. */
const neighborsOutside = (x: MathJSON, mask: MathJSON): MathJSON =>
  floored(sumOver(vertices, times(adjacent(x, "w"), subtract(1, one(hasBit(mask, "w")))), "w"));
/** The paths from `start` to `end` through exactly the subset `mask`. */
const pathsThrough = (start: MathJSON, mask: MathJSON, end: MathJSON): MathJSON =>
  at(pathAt(mask, end), at(start, "paths"));

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

/** The vertices outside the subset `mask` that have `bad` neighbors inside it. */
const outsiders = (mask: MathJSON, bad: (inside: MathJSON) => MathJSON): MathJSON =>
  floored(sumOver(vertices, times(subtract(1, one(hasBit(mask, "v"))), one(bad(neighborsIn(mask, "v")))), "v"));
/** The subset of all the vertices, as a mask. */
const fullMask: MathJSON = subtract(["Power", 2, "n"], 1);
/** 1 when the vertices u and w are adjacent, read off the neighbors of the subset holding u alone. */
const adjacentIn = (u: MathJSON, w: MathJSON): MathJSON => neighborsIn(bitValue(u), w);
/** The vertices of the closed neighborhood of `vertex` that no other vertex of the subset `mask` (which holds `vertex`) has in its own. */
const privateNeighbors = (mask: MathJSON, vertex: MathJSON): MathJSON =>
  floored(
    sumOver(
      vertices,
      times(
        add(one(equals(vertex, "w")), adjacentIn(vertex, "w")),
        times(
          subtract(1, one(hasBit(subtract(mask, bitValue(vertex)), "w"))),
          one(equals(neighborsIn(subtract(mask, bitValue(vertex)), "w"), 0)),
        ),
      ),
      "w",
    ),
  );
/** Whether the subset has no vertex whose closed neighborhood the others cover, by mask + 1. */
const irredundantTable: MathJSON = forEach(
  masks,
  one(
    equals(floored(sumOver(vertices, ["If", hasBit("m", "v"), one(equals(privateNeighbors("m", "v"), 0)), 0], "v")), 0),
  ),
  "m",
);
const isIrredundant = (mask: MathJSON): MathJSON => at(add(mask, 1), "irredundant");
/** An irredundant subset no vertex can be added to. */
const isMaximalIrredundant = (mask: MathJSON): MathJSON =>
  times(
    isIrredundant(mask),
    one(
      equals(floored(sumOver(vertices, ["If", hasBit(mask, "v"), 0, isIrredundant(add(mask, bitValue("v")))], "v")), 0),
    ),
  );
const withIrredundant = (body: MathJSON): MathJSON => withNeighborsIn(bindList("irredundant", irredundantTable, body));
/** Vertices outside the subset `mask` with no neighbor inside it, or all their neighbors inside it. */
const unrestrained = (mask: MathJSON): MathJSON =>
  floored(
    sumOver(
      vertices,
      times(
        subtract(1, one(hasBit(mask, "v"))),
        subtract(
          1,
          times(one(greater(neighborsIn(mask, "v"), 0)), one(less(neighborsIn(mask, "v"), neighborsIn(fullMask, "v")))),
        ),
      ),
      "v",
    ),
  );

/** The sum over the edges of the vertices nearer one end times those nearer the other; a vertex in another component is nearer neither. */
const szegedSum: MathJSON = floored(
  sumOver(
    "edges",
    times(
      floored(sumOver(vertices, one(less(distance(lower("e"), "w"), distance(upper("e"), "w"))), "w")),
      floored(sumOver(vertices, one(less(distance(upper("e"), "w"), distance(lower("e"), "w"))), "w")),
    ),
    "e",
  ),
);
/** The sum of the distances over the pairs of vertices joined by a path. */
const wienerSum: MathJSON = spread(overPairs(["If", less(distance("u", "w"), "n"), distance("u", "w"), 0]));
/** The edges with both ends nearer vertex `a` than vertex `b`. */
const edgesNearer = (a: MathJSON, b: MathJSON): MathJSON =>
  floored(
    sumOver(
      "edges",
      times(
        one(less(distance(lower("f"), a), distance(lower("f"), b))),
        one(less(distance(upper("f"), a), distance(upper("f"), b))),
      ),
      "f",
    ),
  );
/** The vertices of the subset `mask`, counted straight from its bits. */
const maskSize = (mask: MathJSON): MathJSON => floored(sumOver(vertices, one(hasBit(mask, "v")), "v"));
/** Over the triples of vertices (u, v, w), `body` summed. */
const overTriples = (body: MathJSON): MathJSON =>
  floored(sumOver(vertices, floored(sumOver(vertices, floored(sumOver(vertices, body, "w")), "v")), "u"));
const inMask = (mask: MathJSON, ...among: MathJSON[]): MathJSON =>
  among.map((v) => one(hasBit(mask, v))).reduce((a, b) => times(a, b));
/** Whether vertex v lies on a shortest path from u to w, the two a path apart. */
const betweenIn = (u: MathJSON, v: MathJSON, w: MathJSON): MathJSON =>
  times(one(less(distance(u, w), "n")), one(equals(add(distance(u, v), distance(v, w)), distance(u, w))));
/** The vertices outside the subset `mask` on a shortest path between two vertices of it, counted once for each such pair. */
const geodesicEscapes = (mask: MathJSON): MathJSON =>
  overTriples(times(times(inMask(mask, "u", "w"), subtract(1, one(hasBit(mask, "v")))), betweenIn("u", "v", "w")));
/** The pairs of vertices in the subset `mask` at distance at most 2: closed neighborhoods that meet. */
const closePairs = (mask: MathJSON): MathJSON =>
  overPairs(times(times(one(less("u", "w")), inMask(mask, "u", "w")), one(less(distance("u", "w"), 3))));
/** The vertices outside the subset `mask` with a neighbor in it. */
const boundarySize = (mask: MathJSON): MathJSON =>
  floored(
    sumOver(
      vertices,
      times(
        subtract(1, one(hasBit(mask, "v"))),
        one(greater(floored(sumOver(vertices, times(one(hasBit(mask, "u")), adjacent("u", "v")), "u")), 0)),
      ),
      "v",
    ),
  );
/** The triples of distinct vertices in the subset `mask` with the middle one on a shortest path between the others. */
const collinearTriples = (mask: MathJSON): MathJSON =>
  overTriples(
    times(
      times(inMask(mask, "u", "v", "w"), times(one(less(0, distance("u", "v"))), one(less(0, distance("v", "w"))))),
      times(one(less(0, distance("u", "w"))), betweenIn("u", "v", "w")),
    ),
  );

/** The triangles inside the subset `mask`. */
const trianglesWithin = (mask: MathJSON): MathJSON =>
  overTriples(
    times(
      inMask(mask, "u", "v", "w"),
      times(
        times(one(less("u", "v")), one(less("v", "w"))),
        times(adjacent("u", "v"), times(adjacent("v", "w"), adjacent("u", "w"))),
      ),
    ),
  );
/** The vertices of the subset `b` not in `m`, counted straight from the bits: 0 when `m` lies inside `b`. */
const outsideOf = (m: MathJSON, b: MathJSON): MathJSON =>
  floored(sumOver(vertices, times(one(hasBit(m, "v")), subtract(1, one(hasBit(b, "v")))), "v"));
/**
 * The acyclic orientations of the subgraph each subset induces, by mask + 1: the first of the subset's independent
 * sets, in inclusion-exclusion over the sinks, is taken from it, an odd one added and an even one subtracted.
 */
const acyclicOrientationTable: MathJSON = typedFolding(
  [
    "Join",
    "a",
    [
      "List",
      floored(
        sumOver(
          masksFromOne,
          [
            "If",
            equals(outsideOf("m", "b"), 0),
            [
              "If",
              isIndependent("m"),
              times(["If", equals(["Mod", total("m"), 2], 1), 1, -1], at(add(subtract("b", "m"), 1), "a")),
              0,
            ],
            0,
          ],
          "m",
        ),
      ),
    ],
  ],
  "a",
  "b",
  ["List", 1],
  masksFromOne,
);
/** Which columns the rows of `edgeSubsetRows` carry after the subset's size: a component label for each vertex, a degree for each vertex. */
interface SubsetColumns {
  readonly labels: boolean;
  readonly degrees: boolean;
}
const RANK_COLUMNS: SubsetColumns = { labels: true, degrees: false };
const DEGREE_COLUMNS: SubsetColumns = { labels: false, degrees: true };
const BOTH_COLUMNS: SubsetColumns = { labels: true, degrees: true };
/** The position in a row of vertex v's component label, and of its degree. */
const labelPosition = (vertex: MathJSON): MathJSON => add(vertex, 1);
const degreePosition = (columns: SubsetColumns, vertex: MathJSON): MathJSON =>
  add(vertex, columns.labels ? add("n", 1) : 1);
/** What the doubling steps of `subsetRows` add: step k (a no-op unless `active`) joins `from` to `to`, and the size becomes `size`, over the `row` before. */
interface SubsetSource {
  readonly steps: MathJSON;
  readonly active: MathJSON;
  readonly from: MathJSON;
  readonly to: MathJSON;
  readonly size: MathJSON;
  readonly emptySize: MathJSON;
}
/** The edges of the graph, step 0 a no-op so that a graph with no edges folds over 0 alone (`Range(1, 0)` does not evaluate to the empty list). */
const EDGE_SOURCE: SubsetSource = {
  steps: ["Range", 0, length("edges")],
  active: less(0, "k"),
  from: at(1, at("k", "edges")),
  to: at(2, at("k", "edges")),
  size: add(at(1, "row"), 1),
  emptySize: 0,
};
/** The pairs of vertices a < b, step k the pair at row (k - 1) div n and column (k - 1) mod n; the size is the number of pairs where the subset differs from the graph's edges. */
/** The row of step k, (k - 1) less its remainder mod n, over n. */
const rowOfStep: MathJSON = ["Divide", subtract(subtract("k", 1), ["Mod", subtract("k", 1), "n"]), "n"];
const PAIR_SOURCE: SubsetSource = {
  steps: ["Range", 1, ["Multiply", "n", "n"]],
  active: less(add(rowOfStep, 1), add(["Mod", subtract("k", 1), "n"], 1)),
  from: add(rowOfStep, 1),
  to: add(["Mod", subtract("k", 1), "n"], 1),
  size: add(at(1, "row"), subtract(1, times(2, adjacent("from", "to")))),
  emptySize: length("edges"),
};
/**
 * One row for each subset of the source's steps, the subset of mask j in row j + 1 (bit k - 1 of the mask is step k): the
 * subset's size, then the `columns` that follow it. Step k doubles the table: a copy of every row so far with the step
 * added, joining the classes of its ends by giving one the other's label (a union-find by relabeling) and raising their
 * degrees. A graph with no edges has the one row of the empty subset.
 */
const subsetRows = (columns: SubsetColumns, source: SubsetSource = EDGE_SOURCE): MathJSON => {
  const [labelEnd, width] = [add("n", 1), add(1, add(columns.labels ? "n" : 0, columns.degrees ? "n" : 0))];
  const keep = at("t", "row");
  const label: MathJSON = [
    "If",
    equals(at(labelPosition("from"), "row"), at(labelPosition("to"), "row")),
    keep,
    ["If", equals(keep, at(labelPosition("to"), "row")), at(labelPosition("from"), "row"), keep],
  ];
  const degree: MathJSON = add(
    keep,
    add(one(equals("t", degreePosition(columns, "from"))), one(equals("t", degreePosition(columns, "to")))),
  );
  const entry: MathJSON =
    columns.labels && columns.degrees
      ? ["If", less("t", add(labelEnd, 1)), label, degree]
      : columns.labels
        ? label
        : degree;
  const zeros = (count: boolean): MathJSON[] => (count ? [forEach(vertices, 0, "v")] : []);
  return typedFolding(
    [
      "If",
      source.active,
      [
        "Join",
        "rows",
        forEach(
          "rows",
          bind(
            "from",
            source.from,
            bind(
              "to",
              source.to,
              forEach(["Range", 1, width], ["If", equals("t", 1), source.size, entry], "t"),
              "integer",
            ),
            "integer",
          ),
          "row",
        ),
      ],
      "rows",
    ],
    "rows",
    "k",
    ["List", ["Join", ["List", source.emptySize], ...(columns.labels ? [vertices] : []), ...zeros(columns.degrees)]],
    source.steps,
    "list<list<integer>>",
  );
};
/** The rank of the subgraph of this row: each class keeps one vertex whose label is its own, so the others are the rank. */
const rankOfRow = (row: MathJSON): MathJSON =>
  subtract("n", floored(sumOver(vertices, one(equals(at(labelPosition("v"), row), "v")), "v")));
/** The degree of each vertex in the subgraph of this row, as a list. */
const rowDegrees = (columns: SubsetColumns, row: MathJSON): MathJSON =>
  forEach(vertices, at(degreePosition(columns, "v"), row), "v");
/**
 * `summary` of the list of `body` over each row of `subsetRows(columns, source)`: the body reads its `row`, and the summary
 * the list of the bodies and `last`, the row of every step taken.
 */
const summarizeSubsetRows = (
  columns: SubsetColumns,
  body: (row: MathJSON) => MathJSON,
  summary: (bodies: MathJSON, last: MathJSON) => MathJSON,
  source?: SubsetSource,
): MathJSON =>
  bindList(
    "table",
    subsetRows(columns, source),
    bindList("last", at(length("table"), "table"), summary(forEach("table", body("row"), "row"), "last")),
    "list<list<integer>>",
  );
/** `summarizeSubsetRows` over the subsets of the edges. */
const overEdgeSubsetRows = (
  columns: SubsetColumns,
  body: (row: MathJSON) => MathJSON,
  summary: (bodies: MathJSON, last: MathJSON) => MathJSON,
  otherwise: MathJSON = 0,
): MathJSON => withGraph(summarizeSubsetRows(columns, body, summary), otherwise);
/**
 * The sum over the subsets of the edges of `body` of the subset's size, rank and corank (the rank of the whole graph less
 * its rank): the sum that every Tutte evaluation and coefficient is. `wrap` takes the sum and the rank of the whole graph.
 */
const overEdgeSubsets = (
  body: (size: MathJSON, rank: MathJSON, corank: MathJSON) => MathJSON,
  otherwise: MathJSON = 0,
  wrap: (sum: MathJSON, full: MathJSON) => MathJSON = (sum) => sum,
): MathJSON =>
  overEdgeSubsetRows(
    RANK_COLUMNS,
    (row) => bind("rank", rankOfRow(row), body(at(1, row), "rank", subtract("full", "rank")), "integer"),
    (bodies, last) => bind("full", rankOfRow(last), wrap(["Sum", bodies], "full"), "integer"),
    otherwise,
  );
/** The vertices with an edge in the subgraph of this row. */
const touchedBy = (columns: SubsetColumns, row: MathJSON): MathJSON =>
  floored(sumOver(vertices, one(less(0, at(degreePosition(columns, "v"), row))), "v"));
/** `base` to the power `exponent`, an exponent of at least 0; 0 to the power 0 is 1. */
const power = (base: number, exponent: MathJSON): MathJSON =>
  base === 0 ? one(equals(exponent, 0)) : base === 1 ? 1 : ["Power", base, exponent];
/** The Tutte polynomial at (x, y): the sum over subsets A of (x - 1)^corank(A) (y - 1)^nullity(A). */
const tutteAt = (x: number, y: number, wrap?: (sum: MathJSON, full: MathJSON) => MathJSON): MathJSON =>
  overEdgeSubsets((size, rank, corank) => times(power(x - 1, corank), power(y - 1, subtract(size, rank))), 1, wrap);

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
    withDistances(wienerSum),
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
    withDistances(szegedSum),
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
  stat(
    "ClosedVertexSetCount",
    "The sets of vertices that hold every common neighbor of each two of their members.",
    withNeighborsIn(
      overMasks(
        one(
          equals(
            outsiders("m", (d) => atLeastValue(d, 2)),
            0,
          ),
        ),
      ),
      1,
    ),
    `FindStat's St001706. A vertex outside the set is a common neighbor of two members when two of its neighbors are in the set. The graph with no vertices has the empty set, so 1.`,
  ),
  stat(
    "MaximumDissociationSetCount",
    "The sets of the most vertices in which every vertex has at most one neighbor.",
    withNeighborsIn(
      bind(
        "best",
        ["Max", sizeUnlessAny((d) => greater(d, 1))],
        overMasks(
          times(
            one(
              equals(
                misfits("m", (d) => greater(d, 1)),
                0,
              ),
            ),
            one(equals(total("m"), "best")),
          ),
        ),
        "integer",
      ),
    ),
    `FindStat's St001694. Its title says maximal sets; its code and rows count the sets of greatest size. ${NO_VERTICES}`,
  ),
  stat(
    "HalfDominatingNonblockingSetCount",
    "Half the sets of vertices that are dominating and whose complement is dominating.",
    withDominating(spread(overMasks(times(isDominating("m"), isDominating(subtract(fullMask, "m")))))),
    `FindStat's St001794. A set is non-blocking when its complement is dominating, and the complement of such a set is another. ${NO_VERTICES}`,
  ),
  stat(
    "CommonIndependenceNumber",
    "The most vertices r such that every vertex lies in an independent set of at least r vertices.",
    withMasks([
      "Min",
      forEach(
        vertices,
        ["Max", forEach(masks, times(one(isIndependent("m")), times(one(hasBit("m", "v")), total("m"))), "m")],
        "v",
      ),
    ]),
    `FindStat's St001829: the fewest, over the vertices, of the largest independent set holding the vertex. ${NO_VERTICES}`,
  ),
  stat(
    "RestrainedDominationNumber",
    "The fewest vertices in a set such that every vertex outside it has a neighbor inside it and a neighbor outside it.",
    withNeighborsIn(["Min", forEach(masks, ["If", equals(unrestrained("m"), 0), total("m"), "n"], "m")]),
    `FindStat's St001672. ${NO_VERTICES}`,
  ),
  stat(
    "UpperIrredundanceNumber",
    "The most vertices in a maximal irredundant set.",
    withIrredundant(["Max", forEach(masks, times(isMaximalIrredundant("m"), total("m")), "m")]),
    `FindStat's St001338. A set is irredundant when each of its vertices has a vertex in its closed neighborhood that the closed neighborhoods of the others miss. ${NO_VERTICES}`,
  ),
  stat(
    "IrredundanceNumber",
    "The fewest vertices in a maximal irredundant set.",
    withIrredundant(["Min", forEach(masks, ["If", equals(isMaximalIrredundant("m"), 1), total("m"), "n"], "m")]),
    `FindStat's St001339. A subset of an irredundant set is irredundant, so a set is maximal when no one vertex can be added. ${NO_VERTICES}`,
  ),
  stat(
    "ProperSeparationCount",
    "The pairs of sets covering the vertices, each with a vertex the other lacks, and no edge between those vertices.",
    withNeighborsIn(
      spread(floored(sumOver(masksFromOne, subtract(["Power", 2, outsiders("m", (d) => equals(d, 0))], 1), "m"))),
    ),
    `FindStat's St001799. A separation is a nonempty set of vertices (one side only), a nonempty set of the vertices outside it and its neighbors (the other side only), and the rest in both; each is met from either side, hence the half. ${NO_VERTICES}`,
  ),
  stat(
    "GraphEulerCharacteristic",
    "The vertices less the edges.",
    subtract(at(1), length(at(2))),
    `FindStat's St001828, of the graph as a simplicial complex of dimension at most 1. ${NO_VERTICES}`,
  ),
  stat(
    "ConvexVertexSetCount",
    "The sets of vertices that hold every vertex on a shortest path between two of their members.",
    withDistances(overMasks(one(equals(geodesicEscapes("m"), 0))), 1),
    `FindStat's St001762. Vertices with no path between them have no shortest path. The graph with no vertices has the empty set, so 1.`,
  ),
  stat(
    "NonconvexVertexSetCount",
    "The sets of vertices that miss a vertex on a shortest path between two of their members.",
    withDistances(overMasks(one(greater(geodesicEscapes("m"), 0)))),
    `FindStat's St001764. ${NO_VERTICES}`,
  ),
  stat(
    "SzegedWienerGap",
    "The Szeged index less the Wiener index.",
    withDistances(subtract(szegedSum, wienerSum)),
    `FindStat's St000403, the difference of St000263 and St000265, with their conventions for a disconnected graph. ${NO_VERTICES}`,
  ),
  stat(
    "PadmakarIvanIndex",
    "The sum over the edges of the edges inside the vertices nearer one end, and inside those nearer the other.",
    withDistances(
      floored(sumOver("edges", add(edgesNearer(lower("e"), upper("e")), edgesNearer(upper("e"), lower("e"))), "e")),
    ),
    `FindStat's St001374. An edge lies inside a set of vertices when both its ends do; a vertex in another component is nearer neither end. ${NO_VERTICES}`,
  ),
  stat(
    "TwoPackingDifferential",
    "The most, over the sets of vertices with disjoint closed neighborhoods, of the vertices outside the set with a neighbor in it less the vertices in it.",
    withDistances([
      "Max",
      forEach(masks, ["If", equals(closePairs("m"), 0), subtract(boundarySize("m"), maskSize("m")), 0], "m"),
    ]),
    `FindStat's St001724. Closed neighborhoods of two vertices meet when they are at most 2 apart. The empty set gives 0. ${NO_VERTICES}`,
  ),
  stat(
    "GeneralPositionNumber",
    "The most vertices in a set with no three on one shortest path.",
    withDistances(["Max", forEach(masks, times(one(equals(collinearTriples("m"), 0)), maskSize("m")), "m")]),
    `FindStat's St001655. ${NO_VERTICES}`,
  ),
  stat(
    "HamiltonianCycleCount",
    "The cycles through every vertex.",
    withPaths(true, spread(cyclesTwice(fullMask))),
    `FindStat's St000379, each cycle counted once however it is started or turned. A graph on fewer than 3 vertices has none. ${NO_VERTICES}`,
  ),
  stat(
    "MaximumSimplePathCount",
    "The most simple paths between two different vertices.",
    withStartPaths([
      "Max",
      forEach(
        vertices,
        [
          "Max",
          forEach(
            vertices,
            ["If", equals("s", "t"), 0, floored(sumOver(masksFromOne, pathsThrough("s", "b", "t"), "b"))],
            "t",
          ),
        ],
        "s",
      ),
    ]),
    `FindStat's St001592. A graph with fewer than 2 vertices gives 0. ${NO_VERTICES}`,
  ),
  stat(
    "ShortestMaximalPathLength",
    "The edges of the shortest path that no vertex can be added to at either end.",
    withStartPaths([
      "Min",
      forEach(
        vertices,
        [
          "Min",
          forEach(
            masksFromOne,
            [
              "Min",
              forEach(
                vertices,
                [
                  "If",
                  equals(
                    times(
                      one(greater(pathsThrough("s", "b", "e"), 0)),
                      times(one(equals(neighborsOutside("s", "b"), 0)), one(equals(neighborsOutside("e", "b"), 0))),
                    ),
                    1,
                  ),
                  subtract(total("b"), 1),
                  "n",
                ],
                "e",
              ),
            ],
            "b",
          ),
        ],
        "s",
      ),
    ]),
    `FindStat's St001119; a vertex alone is a path of length 0, maximal when it has no neighbor. ${NO_VERTICES}`,
  ),
  stat(
    "LargestInducedPathSize",
    "The most vertices that induce a path.",
    withNeighborsIn(
      bindList("connected", connectedMasks, [
        "Max",
        forEach(
          masks,
          times(
            times(at(add("m", 1), "connected"), total("m")),
            times(
              one(equals(inside("m"), subtract(total("m"), 1))),
              one(
                equals(
                  misfits("m", (d) => greater(d, 2)),
                  0,
                ),
              ),
            ),
          ),
          "m",
        ),
      ]),
    ),
    `FindStat's St001093, the detour number: a connected set with one fewer edges than vertices is a tree, and a tree with no vertex of degree 3 is a path. ${NO_VERTICES}`,
  ),
  stat(
    "LargestComponentPreservingForestSize",
    "The most vertices that induce a forest with as many components as the graph.",
    withAdjacency(
      withNeighborsIn(
        bindList(
          "forests",
          forestMasks,
          bind(
            "components",
            componentCount,
            [
              "Max",
              forEach(
                masks,
                times(
                  at(add("m", 1), "forests"),
                  times(one(equals(subtract(total("m"), inside("m")), "components")), total("m")),
                ),
                "m",
              ),
            ],
            "integer",
          ),
        ),
      ),
    ),
    `FindStat's St001318. A forest has as many components as its vertices less its edges. ${NO_VERTICES}`,
  ),
  stat(
    "TriangleFreeVertexDeletionNumber",
    "The fewest vertices whose deletion leaves a graph with no triangle.",
    withAdjacency(
      subtract("n", ["Max", forEach(masks, ["If", equals(trianglesWithin("m"), 0), maskSize("m"), 0], "m")]),
    ),
    `FindStat's St001336: the vertices less the largest set that holds no triangle. ${NO_VERTICES}`,
  ),
  stat(
    "AcyclicOrientationCount",
    "The ways to direct every edge so that no directed cycle results.",
    withMasks(lastEntry(acyclicOrientationTable), 1),
    `FindStat's St000269. The sinks of an acyclic orientation form a nonempty independent set, and what is left is acyclic; inclusion-exclusion over the sinks gives the count. The graph with no vertices has one orientation, the empty one, so 1.`,
  ),
  stat(
    "ComponentPreservingSpanningSubgraphCount",
    "The sets of edges that leave the graph with the same connected components.",
    tutteAt(1, 2),
    `FindStat's St000266, the Tutte polynomial at x = 1, y = 2. The graph with no vertices has one, the empty graph, so 1.`,
  ),
  stat(
    "ContainedForestCount",
    "The sets of edges, the empty set included, that contain no cycle.",
    tutteAt(2, 1),
    `FindStat's St000270, the Tutte polynomial at x = 2, y = 1. The graph with no vertices has one, so 1.`,
  ),
  stat(
    "TutteXYCoefficient",
    "The coefficient of x y in the Tutte polynomial.",
    overEdgeSubsets((size, rank, corank) =>
      times(
        times(corank, ["Power", -1, add(corank, 1)]),
        times(subtract(size, rank), ["Power", -1, add(subtract(size, rank), 1)]),
      ),
    ),
    `FindStat's St001069: the sum over the sets of edges A of the coefficient of x in (x - 1)^corank(A) times that of y in (y - 1)^nullity(A). ${NO_VERTICES}`,
  ),
  stat(
    "ChromaticPolynomialDerivativeAtOne",
    "The absolute value of the derivative of the chromatic polynomial at 1.",
    overEdgeSubsets(
      (size, rank) => times(["Power", -1, size], subtract("n", rank)),
      0,
      (sum) => ["Abs", sum],
    ),
    `FindStat's St001070: the chromatic polynomial is the sum over sets of edges A of (-1)^|A| k^components(A), and the components of A are n less its rank. ${NO_VERTICES}`,
  ),
  stat(
    "BetaInvariant",
    "Crapo's beta invariant: the absolute value of the sum over sets of edges of (-1)^size times their rank.",
    overEdgeSubsets(
      (size, rank) => times(["Power", -1, size], rank),
      0,
      (sum) => ["Abs", sum],
    ),
    `FindStat's St001071, (-1)^rank times that sum, which is never negative. ${NO_VERTICES}`,
  ),
  stat(
    "TutteEvaluationAtThreeAndThree",
    "The Tutte polynomial at x = 3, y = 3.",
    tutteAt(3, 3),
    `FindStat's St001072. The graph with no vertices gives 1.`,
  ),
  stat(
    "NowhereZeroThreeFlowCount",
    "The nowhere-zero flows with values in the integers modulo 3: the absolute value of the Tutte polynomial at x = 0, y = -2.",
    tutteAt(0, -2, (sum) => ["Abs", sum]),
    `FindStat's St001073. The graph with no vertices has one flow, the empty one, so 1.`,
  ),
  stat(
    "TutteEvaluationAtTwoAndMinusOne",
    "The Tutte polynomial at x = 2, y = -1.",
    tutteAt(2, -1),
    `FindStat's St001474. The graph with no vertices gives 1.`,
  ),
  stat(
    "TutteEvaluationAtOneAndZero",
    "The Tutte polynomial at x = 1, y = 0.",
    tutteAt(1, 0),
    `FindStat's St001475. The graph with no vertices gives 1.`,
  ),
  stat(
    "TutteEvaluationAtOneAndMinusOne",
    "The Tutte polynomial at x = 1, y = -1.",
    tutteAt(1, -1),
    `FindStat's St001476. The graph with no vertices gives 1.`,
  ),
  stat(
    "NowhereZeroFiveFlowCount",
    "The nowhere-zero flows with values in the integers modulo 5: the absolute value of the Tutte polynomial at x = 0, y = -4.",
    tutteAt(0, -4, (sum) => ["Abs", sum]),
    `FindStat's St001477, the flow polynomial at 5: (-1)^nullity times that evaluation, which is never negative. The graph with no vertices has one flow, the empty one, so 1.`,
  ),
  stat(
    "NowhereZeroFourFlowCount",
    "The nowhere-zero flows with values in the integers modulo 4: the absolute value of the Tutte polynomial at x = 0, y = -3.",
    tutteAt(0, -3, (sum) => ["Abs", sum]),
    `FindStat's St001478, the flow polynomial at 4: (-1)^nullity times that evaluation, which is never negative. The graph with no vertices has one flow, the empty one, so 1.`,
  ),
  stat(
    "TwoComponentSpanningForestCount",
    "The sets of edges that form a forest with two trees on all the vertices.",
    overEdgeSubsets((size, rank) => times(one(equals(size, rank)), one(equals(subtract("n", rank), 2)))),
    `FindStat's St001827: the sets of edges with no cycle (size = rank) and two components. ${NO_VERTICES}`,
  ),
  stat(
    "OverfullSubgraphCount",
    "The sets of edges with more edges than the greatest degree times half the vertices they meet, rounded down.",
    overEdgeSubsetRows(
      DEGREE_COLUMNS,
      (row) => {
        const touched = touchedBy(DEGREE_COLUMNS, row);
        return one(greater(at(1, row), times("top", ["Divide", subtract(touched, ["Mod", touched, 2]), 2])));
      },
      (bodies, last) => bind("top", ["Max", rowDegrees(DEGREE_COLUMNS, last)], floored(["Sum", bodies]), "integer"),
    ),
    `FindStat's St001797: the empty set of edges is never overfull. ${NO_VERTICES}`,
  ),
  stat(
    "LargestRegularSpanningSubgraphDegree",
    "The greatest k such that some set of edges gives every vertex degree k.",
    overEdgeSubsetRows(
      DEGREE_COLUMNS,
      (row) => {
        const degrees = rowDegrees(DEGREE_COLUMNS, row);
        return ["If", equals(["Min", degrees], ["Max", degrees]), ["Max", degrees], 0];
      },
      (bodies) => ["Max", bodies],
    ),
    `FindStat's St001357, the largest k with a k-factor; the empty set of edges is the 0-factor. ${NO_VERTICES}`,
  ),
  stat(
    "LargestRegularSubgraphDegree",
    "The greatest k such that some set of edges gives every vertex it meets degree k.",
    overEdgeSubsetRows(
      DEGREE_COLUMNS,
      (row) => {
        const degrees = rowDegrees(DEGREE_COLUMNS, row);
        return [
          "If",
          equals(floored(["Sum", degrees]), times(["Max", degrees], touchedBy(DEGREE_COLUMNS, row))),
          ["Max", degrees],
          0,
        ];
      },
      (bodies) => ["Max", bodies],
    ),
    `FindStat's St001358: the degrees add up to k times the vertices met exactly when the met ones all have degree k. ${NO_VERTICES}`,
  ),
  stat(
    "LongestTrailLength",
    "The most edges in a trail: a set of edges that is connected and has at most two vertices of odd degree.",
    overEdgeSubsetRows(
      BOTH_COLUMNS,
      (row) =>
        times(
          at(1, row),
          times(
            one(equals(subtract(touchedBy(BOTH_COLUMNS, row), rankOfRow(row)), 1)),
            one(less(floored(sumOver(vertices, ["Mod", at(degreePosition(BOTH_COLUMNS, "v"), row), 2], "v")), 3)),
          ),
        ),
      (bodies) => ["Max", bodies],
    ),
    `FindStat's St001649: a connected set of edges has an Euler trail when at most two vertices have odd degree. ${NO_VERTICES}`,
  ),
  stat(
    "TriangleFreeEdgeDeletionNumber",
    "The fewest edges whose deletion leaves a graph with no triangle.",
    withGraph([
      "If",
      equals(length("edges"), 0),
      0,
      bindList(
        "index",
        forEach(
          vertices,
          forEach(
            vertices,
            floored(
              sumOver(
                ["Range", 1, length("edges")],
                times("k", times(one(equals(lower(at("k", "edges")), "a")), one(equals(upper(at("k", "edges")), "b")))),
                "k",
              ),
            ),
            "b",
          ),
          "a",
        ),
        [
          "Min",
          forEach(
            ["Range", 0, subtract(["Power", 2, length("edges")], 1)],
            [
              "If",
              equals(
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
                              one(hasBit("m", entry("index", "a", "b"))),
                              times(
                                one(hasBit("m", entry("index", "a", "c"))),
                                one(hasBit("m", entry("index", "b", "c"))),
                              ),
                            ),
                            "c",
                          ),
                        ),
                        "b",
                      ),
                    ),
                    "a",
                  ),
                ),
                0,
              ),
              subtract(length("edges"), floored(sumOver(["Range", 1, length("edges")], one(hasBit("m", "k")), "k"))),
              length("edges"),
            ],
            "m",
          ),
        ],
        "list<list<integer>>",
      ),
    ]),
    `FindStat's St001573: the edges less the most edges of a set with no triangle. A triangle is three vertices a < b < c whose three edges are all in the set. ${NO_VERTICES}`,
  ),
  stat(
    "RegularEdgeEditNumber",
    "The fewest edges to add or delete to make a graph regular.",
    withAdjacency(
      summarizeSubsetRows(
        DEGREE_COLUMNS,
        (row) => {
          const degrees = rowDegrees(DEGREE_COLUMNS, row);
          return ["If", equals(["Min", degrees], ["Max", degrees]), at(1, row), length("edges")];
        },
        (bodies) => ["Min", bodies],
        PAIR_SOURCE,
      ),
    ),
    `FindStat's St001574: the fewest differences between the edges and those of a regular graph on the same vertices; the graph with no edges is regular. ${NO_VERTICES}`,
  ),
];
