// Graphs to graphs (and to a composition), over `_raw` = Tuple(n, edges): the vertices 1 .. n and the edges [u, v] with
// u < v. An image is Tuple(n', edges') with its edges ascending, built by `graphWhere`; FindStat lists graphs up to
// isomorphism, so these are held to it through CanonicalGraph, and each labeling here is part of the definition.

import { fold as typedFold } from "../../collections/src/families/tables.ts";
import { at, bind, forEach, graphWhere, lets, type CombinatorialMap, type MathJSON } from "../../src/map-helpers.ts";
import { blockBindings, sameBlock } from "./block-edges.ts";
import { cliqueBindings, member, n as cliqueN, upTo as cliqueUpTo } from "./clique-maps.ts";
import { cell, closureOf, one, reach, total, upTo, vertices, withGraph } from "./maps.ts";

const fold = (...args: Parameters<typeof typedFold>): MathJSON => typedFold(...args) as MathJSON;
const LIST = "list<integer>";
const MATRIX = "list<list<integer>>";
const emptyGraph: MathJSON = ["Tuple", 0, ["List"]];
const adjacent = (u: MathJSON, v: MathJSON): MathJSON => cell("gm_adjacent", u, v);
const isEdge = (u: MathJSON, v: MathJSON): MathJSON => ["Equal", adjacent(u, v), 1];
/** The entries of `list` that pass `test`, which reads the variable `v`. */
const where = (list: MathJSON, test: MathJSON, v: string): MathJSON => ["Filter", list, ["Function", test, v]];
const count = (list: MathJSON, test: MathJSON, v: string): MathJSON => ["Length", where(list, test, v)];
/** The graph of `gm_n` vertices, with `body` over `gm_n`, `gm_edges` and `gm_adjacent`; the empty graph answers itself. */
const onGraph = (body: MathJSON): MathJSON => withGraph(body, emptyGraph);

/** Mp00157: whether the complement of the component of `u` (the pairs of that component not joined) is connected,
 *  from the second closure `gm_back` of those pairs. */
const complementConnected = (u: MathJSON): MathJSON => [
  "Equal",
  total(vertices, ["Multiply", cell("gm_reach", u, "x"), ["Subtract", 1, cell("gm_back", u, "x")]], "x"),
  0,
];

/** Mp00117: one round adds every pair of one component whose degrees sum to at least the component's order. */
const degreeIn = (matrix: string, u: MathJSON): MathJSON => total(vertices, cell(matrix, u, "d"), "d");
const oreRound: MathJSON = forEach(
  vertices,
  forEach(
    vertices,
    [
      "If",
      [
        "Or",
        ["Equal", cell("gm_ore", "i", "j"), 1],
        [
          "And",
          ["Equal", cell("gm_reach", "i", "j"), 1],
          ["NotEqual", "i", "j"],
          [
            "GreaterEqual",
            ["Add", degreeIn("gm_ore", "i"), degreeIn("gm_ore", "j")],
            total(vertices, cell("gm_reach", "i", "c"), "c"),
          ],
        ],
      ],
      1,
      0,
    ],
    "j",
  ),
  "i",
);

/** Mp00247: the least vertex whose adjacency row equals the row of `v`. */
const representative = (v: MathJSON): MathJSON => [
  "Min",
  where(vertices, ["Equal", total(vertices, ["Abs", ["Subtract", adjacent("w", "x"), adjacent(v, "x")]], "x"), 0], "w"),
];

/** Mp00264: 0/1 flags of the vertices left after n rounds of dropping those with fewer than two live neighbors. */
const liveAfterRounds: MathJSON = fold(
  forEach(
    vertices,
    [
      "If",
      [
        "And",
        ["Equal", at("v", "gm_live"), 1],
        ["GreaterEqual", total(vertices, ["Multiply", at("u", "gm_live"), adjacent("v", "u")], "u"), 2],
      ],
      1,
      0,
    ],
    "v",
  ),
  "gm_live",
  "gm_round",
  forEach(vertices, 1, "v"),
  vertices,
  LIST,
);

/** The number of vertices of `over` that are the least of their component in the closure `closure`. */
const componentCount = (over: MathJSON, closure: string): MathJSON =>
  count(over, ["Equal", total(upTo(["Subtract", "c", 1]), cell(closure, "c", "u"), "u"), 0], "c");

/** Whether edge number `f` has the vertex `v` as an end. */
const touches = (f: MathJSON, v: MathJSON): MathJSON => [
  "Or",
  ["Equal", at(f, "bl_a"), v],
  ["Equal", at(f, "bl_b"), v],
];

/** Mp00274: whether vertex `v` lies in the block whose least edge is `b`, through one of the block's edges. */
const inBlock = (b: MathJSON, v: MathJSON): MathJSON => [
  "Greater",
  total(upTo("bl_m"), one(["And", ["Equal", at("bt_f", "bt_lead"), b], touches("bt_f", v)]), "bt_f"),
  0,
];

/** The least edge number of the block of edge `e`. */
const blockLeader = (e: MathJSON): MathJSON => ["Min", where(upTo("bl_m"), sameBlock(e, "bl_f"), "bl_f")];

/** Mp00324: the bindings of Mp00251 over the complement graph, so `cq_clique` flags the independent subsets. */
const independentBindings: readonly (readonly [string, MathJSON, string?])[] = cliqueBindings
  .filter(([name]) => name !== "cq_sizes")
  .map((binding) =>
    binding[0] === "cq_edges"
      ? [
          "cq_edges",
          at(
            2,
            graphWhere(cliqueN, (u, v) => [
              "Equal",
              count(at(2), ["And", ["Equal", at(1, "cq_e"), u], ["Equal", at(2, "cq_e"), v]], "cq_e"),
              0,
            ]),
          ),
          MATRIX,
        ]
      : binding,
  );

/** The flags of the subsets that are a union of m + 1 independent sets, from those of m: the last row of `cd_cols`. */
const nextColorable: MathJSON = forEach(
  cliqueUpTo("cd_full"),
  [
    "If",
    [
      "Or",
      ["Equal", cell("cd_cols", ["Length", "cd_cols"], "cd_s"), 1],
      [
        "Greater",
        total(
          at("cd_s", "cd_subs"),
          [
            "If",
            ["Equal", ["Subtract", "cd_s", "cd_b"], 0],
            1,
            cell("cd_cols", ["Length", "cd_cols"], ["Subtract", "cd_s", "cd_b"]),
          ],
          "cd_b",
        ),
        0,
      ],
    ],
    1,
    0,
  ],
  "cd_s",
);

export const GRAPH_IMAGE_MAPS: readonly CombinatorialMap[] = [
  {
    name: "GraphComplement",
    findstat: ["Mp00111"],
    from: "labeled_graph",
    to: "labeled_graph",
    body: onGraph(graphWhere("gm_n", (u, v) => ["Equal", adjacent(u, v), 0])),
    imageParts: ["", ""],
    summary: "The graph on the same vertices whose edges are the pairs the graph does not join.",
    note: "FindStat's Mp00111. The vertices keep their numbers.",
  },
  {
    name: "GraphSquare",
    findstat: ["Mp00147"],
    from: "labeled_graph",
    to: "labeled_graph",
    body: onGraph(
      graphWhere("gm_n", (u, v) => [
        "Or",
        isEdge(u, v),
        ["Greater", total(vertices, ["Multiply", adjacent(u, "w"), adjacent("w", v)], "w"), 0],
      ]),
    ),
    imageParts: ["", ""],
    summary: "The graph that joins two vertices at distance 1 or 2: adjacent, or with a common neighbor.",
    note: "FindStat's Mp00147. The vertices keep their numbers.",
  },
  {
    name: "GraphCone",
    findstat: ["Mp00203"],
    from: "labeled_graph",
    to: "labeled_graph",
    body: withGraph(
      graphWhere(["Add", "gm_n", 1], (u, v) => ["If", ["Greater", v, "gm_n"], "True", isEdge(u, v)]),
      ["Tuple", 1, ["List"]],
    ),
    imageParts: ["", ""],
    summary: "The graph with one more vertex, number n + 1, joined to every vertex.",
    note: "FindStat's Mp00203. The edges are listed again in order, since [1, n + 1] sorts before an old [2, 3].",
  },
  {
    name: "IsolatedVertexAddition",
    findstat: ["Mp00259"],
    from: "labeled_graph",
    to: "labeled_graph",
    body: withGraph(["Tuple", ["Add", "gm_n", 1], "gm_edges"], ["Tuple", 1, ["List"]]),
    imageParts: ["", ""],
    summary: "The graph with one more vertex, number n + 1, joined to none.",
    note: "FindStat's Mp00259.",
  },
  {
    name: "LineGraph",
    findstat: ["Mp00156"],
    from: "labeled_graph",
    to: "labeled_graph",
    body: onGraph(
      graphWhere(["Length", "gm_edges"], (i, j) => {
        const end = (edge: MathJSON, k: number): MathJSON => at(k, at(edge, "gm_edges"));
        return ["Or", ...[1, 2].flatMap((a) => [1, 2].map((b): MathJSON => ["Equal", end(i, a), end(j, b)]))];
      }),
    ),
    imageParts: ["", ""],
    summary: "The graph with a vertex for each edge, joined when the two edges share an end.",
    note: "FindStat's Mp00156. Vertex k is the k-th edge of the graph's ascending edge list; a graph with no edge has the empty line graph.",
  },
  {
    name: "ConnectedComplement",
    findstat: ["Mp00157"],
    from: "labeled_graph",
    to: "labeled_graph",
    body: onGraph(
      bind(
        "gm_reach",
        reach,
        bind(
          "gm_back",
          closureOf((i, j) => ["And", ["Equal", cell("gm_reach", i, j), 1], ["Equal", adjacent(i, j), 0]]),
          graphWhere("gm_n", (u, v) => [
            "If",
            ["Equal", cell("gm_reach", u, v), 0],
            "False",
            ["If", complementConnected(u), ["Equal", adjacent(u, v), 0], isEdge(u, v)],
          ]),
          MATRIX,
        ),
        MATRIX,
      ),
    ),
    imageParts: ["", ""],
    summary:
      "Each connected component replaced by its complement when that complement is connected, else left as it is.",
    note: "FindStat's Mp00157. A single vertex is its own complement. The vertices keep their numbers, and no edge joins two components.",
  },
  {
    name: "OreClosure",
    findstat: ["Mp00117"],
    from: "labeled_graph",
    to: "labeled_graph",
    body: onGraph(
      bind(
        "gm_reach",
        reach,
        bind(
          "gm_final",
          fold(
            oreRound,
            "gm_ore",
            "gm_round",
            "gm_adjacent",
            upTo(["Max", 1, ["Divide", ["Multiply", "gm_n", ["Subtract", "gm_n", 1]], 2]]),
            MATRIX,
          ),
          graphWhere("gm_n", (u, v) => ["Equal", cell("gm_final", u, v), 1]),
          MATRIX,
        ),
        MATRIX,
      ),
    ),
    imageParts: ["", ""],
    summary:
      "Each component of order s with an edge added between every two non-adjacent vertices whose degrees sum to at least s, until none is left.",
    note: "FindStat's Mp00117. The threshold is the order of the component, not of the graph. Every eligible pair is added in a round, and C(n, 2) rounds reach the fixed point.",
  },
  {
    name: "DeduplicatedGraph",
    findstat: ["Mp00247"],
    from: "labeled_graph",
    to: "labeled_graph",
    body: onGraph(
      bind(
        "gm_reps",
        where(vertices, ["Equal", representative("v"), "v"], "v"),
        graphWhere(["Length", "gm_reps"], (i, j) => ["Equal", adjacent(at(i, "gm_reps"), at(j, "gm_reps")), 1]),
        LIST,
      ),
    ),
    imageParts: ["", ""],
    summary: "The graph on the distinct open neighborhoods, two joined when their members are.",
    note: "FindStat's Mp00247. A vertex stands for the least vertex with the same neighbors; those representatives, in order, become 1, 2, 3, and so on. Adjacent twins have different neighborhoods and stay apart.",
  },
  {
    name: "CliqueGraph",
    findstat: ["Mp00250"],
    from: "labeled_graph",
    to: "labeled_graph",
    body: [
      "If",
      ["Equal", at(1), 0],
      emptyGraph,
      lets(cliqueBindings, [
        "Apply",
        [
          "Function",
          graphWhere(["Length", "cg_masks"], (i, j) => [
            "Greater",
            total(
              cliqueUpTo(cliqueN),
              one(["And", member(at(i, "cg_masks"), "cg_x"), member(at(j, "cg_masks"), "cg_x")]),
              "cg_x",
            ),
            0,
          ]),
          ["Typed", "cg_masks", "'list<integer>'"],
        ],
        where(cliqueUpTo(["Subtract", ["Power", 2, cliqueN], 1]), ["Greater", at("cg_s", "cq_sizes"), 0], "cg_s"),
      ]),
    ],
    imageParts: ["", ""],
    summary: "The graph on the maximal cliques, two joined when they share a vertex.",
    note: "FindStat's Mp00250. The cliques are numbered by increasing bitmask, vertex v being bit v - 1; an isolated vertex is a clique of its own.",
  },
  {
    name: "EndpointDeletion",
    findstat: ["Mp00264"],
    from: "labeled_graph",
    to: "labeled_graph",
    body: onGraph(
      bind(
        "gm_reach",
        reach,
        bind(
          "gm_live",
          liveAfterRounds,
          bind(
            "gm_core",
            where(vertices, ["Equal", at("v", "gm_live"), 1], "v"),
            bind(
              "gm_back",
              closureOf((i, j) => [
                "And",
                isEdge(i, j),
                ["Equal", at(i, "gm_live"), 1],
                ["Equal", at(j, "gm_live"), 1],
              ]),
              graphWhere(
                [
                  "Add",
                  ["Length", "gm_core"],
                  ["Subtract", componentCount(vertices, "gm_reach"), componentCount("gm_core", "gm_back")],
                ],
                (i, j) => [
                  "If",
                  ["Greater", j, ["Length", "gm_core"]],
                  "False",
                  isEdge(at(i, "gm_core"), at(j, "gm_core")),
                ],
              ),
              MATRIX,
            ),
            LIST,
          ),
          LIST,
        ),
        MATRIX,
      ),
    ),
    imageParts: ["", ""],
    summary:
      "The graph left after deleting vertices of degree below 2 until none remain, with an isolated vertex for each component that vanished.",
    note: "FindStat's Mp00264. The survivors keep their order and are renumbered from 1, and the isolated vertices come after them.",
  },
  {
    name: "BlockCutTree",
    findstat: ["Mp00274"],
    from: "labeled_graph",
    to: "labeled_graph",
    body: [
      "If",
      ["Equal", at(1), 0],
      emptyGraph,
      lets(
        [
          ...blockBindings,
          ["bt_lead", forEach(upTo("bl_m"), blockLeader("bt_e"), "bt_e"), LIST],
          ["bt_blocks", where(upTo("bl_m"), ["Equal", at("bt_e", "bt_lead"), "bt_e"], "bt_e"), LIST],
          [
            "bt_cuts",
            where(upTo("bl_n"), ["GreaterEqual", count("bt_blocks", inBlock("bt_b", "bt_v"), "bt_b"), 2], "bt_v"),
            LIST,
          ],
          [
            "bt_alone",
            where(upTo("bl_n"), ["Equal", total(upTo("bl_m"), one(touches("bt_f", "bt_v")), "bt_f"), 0], "bt_v"),
            LIST,
          ],
        ],
        graphWhere(["Add", ["Length", "bt_cuts"], ["Length", "bt_blocks"], ["Length", "bt_alone"]], (u, v) => [
          "If",
          ["Greater", u, ["Length", "bt_cuts"]],
          "False",
          [
            "If",
            ["LessEqual", v, ["Length", "bt_cuts"]],
            "False",
            [
              "If",
              ["Greater", v, ["Add", ["Length", "bt_cuts"], ["Length", "bt_blocks"]]],
              "False",
              inBlock(at(["Subtract", v, ["Length", "bt_cuts"]], "bt_blocks"), at(u, "bt_cuts")),
            ],
          ],
        ]),
      ),
    ],
    imageParts: ["", ""],
    summary:
      "The tree with a vertex for each cut vertex and each block, a cut vertex joined to the blocks that contain it.",
    note: "FindStat's Mp00274. A bridge and an isolated vertex are blocks. The vertices are the cut vertices in order, then the blocks by their least edge, then the isolated vertices in order.",
  },
  {
    name: "ChromaticDifferenceSequence",
    findstat: ["Mp00324"],
    from: "labeled_graph",
    to: "composition",
    body: [
      "If",
      ["Equal", at(1), 0],
      ["List"],
      lets(
        [
          ...independentBindings,
          ["cd_full", ["Subtract", ["Power", 2, cliqueN], 1], "integer"],
          [
            "cd_pop",
            forEach(cliqueUpTo("cd_full"), count(cliqueUpTo(cliqueN), member("cd_s", "cd_x"), "cd_x"), "cd_s"),
            LIST,
          ],
          [
            "cd_subs",
            forEach(
              cliqueUpTo("cd_full"),
              where(
                cliqueUpTo("cd_s"),
                [
                  "And",
                  ["Equal", at("cd_b", "cq_clique"), 1],
                  [
                    "Equal",
                    total(
                      cliqueUpTo(cliqueN),
                      ["Multiply", one(member("cd_b", "cd_x")), ["Subtract", 1, one(member("cd_s", "cd_x"))]],
                      "cd_x",
                    ),
                    0,
                  ],
                ],
                "cd_b",
              ),
              "cd_s",
            ),
            MATRIX,
          ],
          [
            "cd_cols",
            fold(
              ["Join", "cd_cols", ["List", nextColorable]],
              "cd_cols",
              "cd_m",
              ["List", "cq_clique"],
              cliqueUpTo(["Subtract", cliqueN, 1]),
              MATRIX,
            ),
            MATRIX,
          ],
          [
            "cd_alpha",
            forEach(
              cliqueUpTo(["Length", "cd_cols"]),
              [
                "Max",
                forEach(
                  cliqueUpTo("cd_full"),
                  ["Multiply", cell("cd_cols", "cd_m", "cd_s"), at("cd_s", "cd_pop")],
                  "cd_s",
                ),
              ],
              "cd_m",
            ),
            LIST,
          ],
        ],
        forEach(
          cliqueUpTo(["Add", count("cd_alpha", ["Less", "cd_a", cliqueN], "cd_a"), 1]),
          [
            "Subtract",
            at("cd_m", "cd_alpha"),
            ["If", ["Equal", "cd_m", 1], 0, at(["Subtract", "cd_m", 1], "cd_alpha")],
          ],
          "cd_m",
        ),
      ),
    ],
    summary:
      "The differences alpha(m) - alpha(m - 1), where alpha(m) is the most vertices of an m-colorable induced subgraph, up to the first m at which alpha(m) is every vertex.",
    note: "FindStat's Mp00324. The parts sum to the number of vertices and their count is the chromatic number.",
  },
];
