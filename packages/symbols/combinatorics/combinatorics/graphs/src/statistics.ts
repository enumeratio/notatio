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
];
