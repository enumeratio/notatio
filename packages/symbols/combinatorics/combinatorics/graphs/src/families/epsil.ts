// Graph-area families defined in Epsil. The edges of K_n are numbered 1..C(n, 2) in lex order of
// their pairs (u < v); a graph or orientation is then a number read off that index space. Their TS
// kernels (tests/readings) are the independent reading the agreement tests check these against;
// LabeledGraphsByEdges (core.ts) still has its as a `fast` path.
import type { EpsilFamily } from "../../../collections/src/families/epsil.ts";
import { lexUnrank } from "../../../permutations/src/families/core.ts";
import {
  add,
  all,
  and,
  at,
  cell,
  choose,
  colexDigits,
  equal,
  fold,
  iff,
  len,
  less,
  lets,
  map,
  mul,
  pascalTable,
  quotient,
  sub,
  upTo,
} from "../../../collections/src/families/tables.ts";

type MathJSON = unknown;

const list = (...xs: MathJSON[]): MathJSON => ["List", ...xs];
const pow = (a: MathJSON, b: MathJSON): MathJSON => ["Power", a, b];

/** C(n, 2): the edges of K_n. */
const edges: MathJSON = choose("_n", 2);

/** The index of the first edge whose smaller vertex is u: the edges of the rows before it. */
const rowStart = (u: MathJSON): MathJSON => sub(edges, choose(add(sub("_n", u), 1), 2));

/** The index of the edge {a, b}, a < b. */
const edgeIndex = (a: MathJSON, b: MathJSON): MathJSON => add(rowStart(a), sub(b, a));

/** Entry j of `_x` as a pair [a, b], read as the edge {min, max}. */
const pairA = (j: MathJSON): MathJSON => at(at("_x", j), 1);
const pairB = (j: MathJSON): MathJSON => at(at("_x", j), 2);
const indexOfPair = (j: MathJSON): MathJSON => edgeIndex(["Min", pairA(j), pairB(j)], ["Max", pairA(j), pairB(j)]);

/** The smaller vertex of each edge in index order, as a list: row u of K_n repeats u, n − u times.
 *  Edge k is then [u, u + (k − rowStart(u))]. */
const firstVertices: MathJSON = fold(
  ["Join", "et", map("eu", "ez", upTo(1, sub("_n", "eu")))],
  "et",
  "eu",
  list(),
  upTo(1, sub("_n", 1)),
);

/** The pair of edge `k` (any expression), reversed when `flip` holds. */
const pairAt = (tag: string, k: MathJSON, flip: MathJSON = "False"): MathJSON => {
  const [edge, u, v] = [`${tag}_k`, `${tag}_u`, `${tag}_v`];
  return lets(
    [
      [edge, k, "integer"],
      [u, at("_tables", edge), "integer"],
      [v, add(sub(edge, rowStart(u)), u), "integer"],
    ],
    iff(flip, list(v, u), list(u, v)),
  );
};

/** Whether `_x` lists pairs of distinct vertices of 1..n, no edge twice (in any order), `size` of them when given. */
const edgeList = (...size: MathJSON[]): MathJSON =>
  iff(
    and(
      ...size.map((count) => equal(len, count)),
      all((j) => equal(["Length", at("_x", j)], 2), upTo(1, len), "wp"),
    ),
    and(
      all(
        (j) =>
          and(
            ["LessEqual", 1, pairA(j)],
            ["LessEqual", pairA(j), "_n"],
            ["LessEqual", 1, pairB(j)],
            ["LessEqual", pairB(j), "_n"],
            ["NotEqual", pairA(j), pairB(j)],
          ),
        upTo(1, len),
        "wb",
      ),
      all(
        (j) => all((i) => ["NotEqual", indexOfPair(i), indexOfPair(j)], upTo(1, sub(j, 1)), "wi"),
        upTo(1, len),
        "wj",
      ),
    ),
    "False",
  );

// ─── Tournaments(n): an orientation of each edge, the edges' bits read as a binary number with
// edge 1 most significant; a 1 reverses the edge to [larger, smaller]. ─────────────────────────────
export const tournaments: EpsilFamily = {
  head: "Tournaments",
  carrier: "Tournament",
  carrierParams: 1,
  paramCount: 1,
  kind: "blocks",
  params: ["_n"],
  epsil: {
    tables: firstVertices,
    count: pow(2, edges),
    unrank: map(
      pairAt("tu", "tk", equal(["Mod", quotient("_r", pow(2, sub(edges, "tk"))), 2], 1)),
      "tk",
      upTo(1, edges),
    ),
    rank: fold(
      add("ra", iff(less(pairB("rj"), pairA("rj")), pow(2, sub(edges, indexOfPair("rj"))), 0)),
      "ra",
      "rj",
      0,
      upTo(1, len),
    ),
    valid: edgeList(edges),
  },
};

// ─── LabeledGraphs(n): the edges present, ascending; edge k is present iff bit k − 1 of the rank is set. ─
export const labeledGraphs: EpsilFamily = {
  head: "LabeledGraphs",
  carrier: "LabeledGraph",
  carrierParams: 1,
  paramCount: 1,
  kind: "blocks",
  params: ["_n"],
  epsil: {
    tables: firstVertices,
    count: pow(2, edges),
    unrank: map(pairAt("gu", "gk"), "gk", [
      "Filter",
      upTo(1, edges),
      ["Function", equal(["Mod", quotient("_r", pow(2, sub("gb", 1))), 2], 1), "gb"],
    ]),
    rank: fold(add("ga", pow(2, sub(indexOfPair("gj"), 1))), "ga", "gj", 0, upTo(1, len)),
    valid: edgeList(),
  },
};

// ─── LabeledGraphsByEdges(n, m): the m present edges, ascending, in colex order of their indices
// (the combinatorial number system: rank = Σ C(index_i − 1, i)). The binomials are one table of
// Pascal's triangle after the edge map, since C(c, i) runs past 2^53 for m near C(n, 2) while the
// count stays small. ───────────────────────────────────────────────────────────────────────────────
const pascalWidth = add(["Max", 0, ["Min", "_m", edges]], 1);
const pascal = cell("_tables", pascalWidth, edges);

export const labeledGraphsByEdges: EpsilFamily = {
  head: "LabeledGraphsByEdges",
  carrier: "LabeledGraph",
  carrierParams: 1,
  paramCount: 2,
  kind: "blocks",
  params: ["_n", "_m"],
  epsil: {
    tables: ["Join", firstVertices, pascalTable("bp", ["Max", edges, 1], pascalWidth)],
    count: choose(edges, "_m"),
    unrank: lets(
      [["bd", colexDigits("bd", "_m", edges, pascal), "list<integer>"]],
      map(pairAt("bu", add(at("bd", add("bi", 1)), 1)), "bi", upTo(1, "_m")),
    ),
    rank: lets(
      [["bx", ["Sort", map(indexOfPair("bj"), "bj", upTo(1, len))], "list<integer>"]],
      fold(add("br", pascal(sub(at("bx", "bi"), 1), "bi")), "br", "bi", 0, upTo(1, len)),
    ),
    valid: edgeList("_m"),
  },
};

// ─── UnlabeledGraphs(n): one graph per isomorphism class, the one of least rank in LabeledGraphs(n). The
// members are the ranks below 2^C(n, 2) whose graph equals its own canonical form, ascending. ──────────
//
// These read the vertex count as an expression `n`, so the same pieces serve a family over `_n` and
// CanonicalGraph's body over a graph's own count.

/** The index of the edge {a, b}, a < b, among the C(n, 2) edges of K_n. */
const indexOn = (n: MathJSON, a: MathJSON, b: MathJSON): MathJSON =>
  add(sub(choose(n, 2), choose(add(sub(n, a), 1), 2)), sub(b, a));

/** The smaller vertex of each edge of K_n in index order, as a list. */
const firstVerticesOn = (n: MathJSON): MathJSON =>
  fold(["Join", "et", map("eu", "ez", upTo(1, sub(n, "eu")))], "et", "eu", list(), upTo(1, sub(n, 1)));

/** The least rank of any relabeling of a graph on n vertices: over every permutation `s` of 1..n, the sum of
 *  2^(index of the relabeled pair − 1) over the graph's edges `k` in `over`. `ends(k)` is the pair of
 *  edge `k` and `weight(k)` 1 where the edge is present. This is CanonicalGraph's definition. */
const leastRelabeled = (
  n: MathJSON,
  over: MathJSON,
  ends: (k: MathJSON) => [MathJSON, MathJSON],
  weight: (k: MathJSON) => MathJSON,
): MathJSON => {
  const [best, rank, s, k, total, x, y] = ["cg_b", "cg_p", "cg_s", "cg_k", "cg_a", "cg_x", "cg_y"];
  const [a, b] = ends(k);
  const term = lets(
    [
      [x, at(s, a), "integer"],
      [y, at(s, b), "integer"],
    ],
    mul(weight(k), pow(2, sub(indexOn(n, ["Min", x, y], ["Max", x, y]), 1))),
  );
  // Permutations(n) in lex order, as plain lists: the one of each rank 0 .. n! − 1 (compiled code can't run
  // Permutations(n) itself, which holds permutation values).
  return fold(
    ["Min", best, lets([[s, lexUnrank(n, n, rank), "list<integer>"]], fold(add(total, term), total, k, 0, over))],
    best,
    rank,
    pow(2, choose(n, 2)),
    upTo(0, sub(["Factorial", n], 1)),
  );
};

/** Edge `k` of K_n as the pair [u, v], u < v, reading the smaller vertices from the list `firsts`. */
const pairOn = (n: MathJSON, firsts: MathJSON, k: MathJSON): MathJSON => {
  const u = at(firsts, k);
  return list(u, add(sub(k, sub(choose(n, 2), choose(add(sub(n, u), 1), 2))), u));
};

/** The edges, ascending, of the graph with rank `rank` (a variable) in LabeledGraphs(n). */
const edgesOfRank = (n: MathJSON, firsts: MathJSON, rank: string): MathJSON =>
  map(pairOn(n, firsts, "ue_k"), "ue_k", [
    "Filter",
    upTo(1, choose(n, 2)),
    ["Function", equal(["Mod", quotient(rank, pow(2, sub("ue_b", 1))), 2], 1), "ue_b"],
  ]);

/** The canonical rank of the graph with rank `rank` (a variable): edge k is present iff bit k − 1 is set. */
const canonicalOfRank = (rank: string): MathJSON =>
  leastRelabeled(
    "_n",
    upTo(1, edges),
    (k) => {
      const u = at("_tables", k);
      return [u, add(sub(k, rowStart(u)), u)];
    },
    (k) => iff(equal(["Mod", quotient(rank, pow(2, sub(k, 1))), 2], 1), 1, 0),
  );

/** The rank of the edge list `_x` in LabeledGraphs(n). */
const rankOfElement: MathJSON = fold(add("ur_a", pow(2, sub(indexOfPair("ur_j"), 1))), "ur_a", "ur_j", 0, upTo(1, len));

/** The canonical rank of the edge list `_x`. */
const canonicalOfElement: MathJSON = leastRelabeled(
  "_n",
  upTo(1, len),
  (j) => [pairA(j), pairB(j)],
  () => 1,
);

/** 1 where the rank `rank` (a variable) is its own canonical rank, else 0. */
const isOwnCanonical = (rank: string): MathJSON => iff(equal(canonicalOfRank(rank), rank), 1, 0);

/** Every rank of LabeledGraphs(n), up to the rank `last` (an expression). */
const ranksTo = (last: MathJSON): MathJSON => upTo(0, last);

export const unlabeledGraphs: EpsilFamily = {
  head: "UnlabeledGraphs",
  carrier: "LabeledGraph",
  carrierParams: 1,
  paramCount: 1,
  kind: "blocks",
  params: ["_n"],
  epsil: {
    tables: firstVertices,
    count: fold(add("uc_a", isOwnCanonical("uc_r")), "uc_a", "uc_r", 0, ranksTo(sub(pow(2, edges), 1))),
    unrank: lets(
      [
        [
          "uu_c",
          at(
            ["Filter", ranksTo(sub(pow(2, edges), 1)), ["Function", equal(canonicalOfRank("uu_f"), "uu_f"), "uu_f"]],
            add("_r", 1),
          ),
          "integer",
        ],
      ],
      edgesOfRank("_n", "_tables", "uu_c"),
    ),
    rank: lets(
      [["ur_x", rankOfElement, "integer"]],
      fold(add("ur_p", isOwnCanonical("ur_q")), "ur_p", "ur_q", 0, ranksTo(sub("ur_x", 1))),
    ),
    valid: iff(edgeList(), equal(canonicalOfElement, rankOfElement), "False"),
  },
};

/** CanonicalGraph's body over `_raw` = Tuple(n, edges): the same vertex count, with the edges of the relabeling of
 *  least rank. */
export const canonicalGraphBody: MathJSON = lets(
  [
    ["cm_n", at("_raw", 1), "integer"],
    ["cm_e", at("_raw", 2), "list<list<integer>>"],
    ["cm_t", firstVerticesOn("cm_n"), "list<integer>"],
    [
      "cm_r",
      leastRelabeled(
        "cm_n",
        upTo(1, ["Length", "cm_e"]),
        (j) => [at(at("cm_e", j), 1), at(at("cm_e", j), 2)],
        () => 1,
      ),
      "integer",
    ],
  ],
  ["Tuple", "cm_n", edgesOfRank("cm_n", "cm_t", "cm_r")],
);
