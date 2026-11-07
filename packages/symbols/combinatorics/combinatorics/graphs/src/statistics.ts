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

/** A fold whose accumulator is typed, as `type`. */
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
      "list<list<integer>>",
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
  "list<integer>",
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
  "list<integer>",
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
      "list<integer>",
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
    "list<integer>",
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
      "list<integer>",
    ),
  );
const withTotals = (body: MathJSON, otherwise: MathJSON = 0): MathJSON =>
  withGraph(bindList("totals", vertexTotals, body), otherwise);

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
    withAdjacency(
      floored(
        sumOver(
          vertices,
          one(greater(floored(sumOver("edges", times(adjacent("v", lower("e")), adjacent("v", upper("e"))), "e")), 0)),
          "v",
        ),
      ),
    ),
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
    withMasks(
      bindList("within", independentSetsWithin, [
        "Min",
        forEach(vertices, ["If", greater(coloringCount("k"), 0), "k", "n"], "k"),
      ]),
    ),
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
    withMasks(
      overMasks(
        times(
          one(isIndependent("m")),
          one(
            equals(
              floored(
                sumOver(
                  vertices,
                  [
                    "If",
                    less(["Mod", "m", ["Power", 2, "v"]], bitValue("v")),
                    one(isIndependent(add("m", bitValue("v")))),
                    0,
                  ],
                  "v",
                ),
              ),
              0,
            ),
          ),
        ),
      ),
      1,
    ),
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
];
