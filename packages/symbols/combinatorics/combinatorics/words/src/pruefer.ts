// Epsil bodies for the maps that run a parking function through a Prüfer code: the Foata–Riordan code of its
// tree, and the tree a code decodes to, read as a parent array, a breadth-first order or a depth-first contour.
// A tree on the vertices 0..n has vertex v at index v + 1 in every list here; an entry that names a vertex is
// its label, from 0.

import { buildFromDyck } from "../../collections/src/families/nested.ts";
import { fold } from "../../collections/src/families/tables.ts";
import { lets, type MathJSON, positions } from "../../src/map-helpers.ts";
import { standardRanks } from "./standard-ranks.ts";

const LIST = "list<integer>";
const n: MathJSON = ["Length", "_raw"];
const item = (list: MathJSON, index: MathJSON): MathJSON => ["At", list, index];
const plus = (...terms: MathJSON[]): MathJSON => ["Add", ...terms];
const minus = (a: MathJSON, b: MathJSON): MathJSON => ["Subtract", a, b];
const upTo = (m: MathJSON): MathJSON => ["Range", 1, m, 1];
const forEach = (over: MathJSON, body: MathJSON, variable: string): MathJSON => [
  "Map",
  ["Function", body, variable],
  over,
];
/** The n + 1 vertices, by index. */
const vertices: MathJSON = upTo(plus(n, 1));
const label = (index: MathJSON): MathJSON => minus(index, 1);
const zeros = (over: MathJSON): MathJSON => forEach(over, 0, "z");
/** How many of `over` pass `test`, which reads the loop variable `v`. */
const tally = (over: MathJSON, test: MathJSON, v: string, acc: string): MathJSON => [
  "Fold",
  ["Function", ["If", test, ["Add", acc, 1], acc], acc, v],
  0,
  over,
];
/** The sum of `term` over `over`, which reads the loop variable `v`. */
const total = (over: MathJSON, term: MathJSON, v: string, acc: string): MathJSON => [
  "Fold",
  ["Function", ["Add", acc, term], acc, v],
  0,
  over,
];
/** The first of `over` that passes `test`, which reads the loop variable `v`; 0 when none does. */
const firstWhere = (over: MathJSON, test: MathJSON, v: string, acc: string): MathJSON => [
  "Fold",
  ["Function", ["If", ["And", ["Equal", acc, 0], test], v, acc], acc, v],
  0,
  over,
];
const listFold = (body: MathJSON, acc: string, v: string, init: MathJSON, over: MathJSON): MathJSON =>
  fold(body, acc, v, init, over, LIST) as MathJSON;
/** `body` with `name` the integer `value`. */
const given = (name: string, value: MathJSON, body: MathJSON): MathJSON => lets([[name, value, "integer"]], body);

/** The Prüfer code of the tree a parking function p describes (Foata–Riordan): car i hangs under vertex 0 when
 *  p(i) is 1, and else under the car with rank p(i) - 1 in `ranks`, the parking function's standardization, which
 *  is the permutation itself for a permutation. The code drops the smallest leaf n - 1 times, writing the vertex it
 *  hung from; each vertex carries its degree and the sum of its neighbors' labels, which for a leaf is its one
 *  neighbor. State: n + 1 degrees, n + 1 neighbor sums, then the code written so far. */
export const foataRiordanCode = (ranks: MathJSON): MathJSON => {
  const width: MathJSON = plus(n, 1);
  const state = (index: MathJSON): MathJSON => item("fr_st", index);
  const parent = (j: MathJSON): MathJSON => item("fr_par", j);
  const step = given(
    "fr_u",
    firstWhere(vertices, ["Equal", state("y"), 1], "y", "fr_f"),
    given(
      "fr_w",
      state(plus(width, "fr_u")),
      forEach(
        upTo(plus(n, n, n, 1)),
        [
          "If",
          ["LessEqual", "j", width],
          ["If", ["Equal", "j", "fr_u"], 0, ["If", ["Equal", "j", plus("fr_w", 1)], minus(state("j"), 1), state("j")]],
          [
            "If",
            ["LessEqual", "j", plus(width, width)],
            [
              "If",
              ["Equal", minus("j", width), "fr_u"],
              0,
              ["If", ["Equal", minus("j", width), plus("fr_w", 1)], minus(state("j"), label("fr_u")), state("j")],
            ],
            ["If", ["Equal", "j", plus(width, width, "fr_k")], "fr_w", state("j")],
          ],
        ],
        "j",
      ),
    ),
  );
  return lets(
    [
      ["fr_tau", ranks, LIST],
      [
        "fr_par",
        forEach(
          positions,
          ["If", ["Equal", item("_raw", "i"), 1], 0, ["IndexOf", "fr_tau", minus(item("_raw", "i"), 1)]],
          "i",
        ),
        LIST,
      ],
      [
        "fr_deg",
        forEach(
          vertices,
          plus(["If", ["Greater", "x", 1], 1, 0], tally(positions, ["Equal", parent("j"), label("x")], "j", "fr_a")),
          "x",
        ),
        LIST,
      ],
      [
        "fr_sum",
        forEach(
          vertices,
          plus(
            ["If", ["Greater", "x", 1], parent(label("x")), 0],
            total(positions, ["If", ["Equal", parent("j"), label("x")], "j", 0], "j", "fr_b"),
          ),
          "x",
        ),
        LIST,
      ],
      [
        "fr_end",
        listFold(step, "fr_st", "fr_k", ["Join", "fr_deg", "fr_sum", zeros(["Most", positions])], ["Most", positions]),
        LIST,
      ],
    ],
    ["Drop", "fr_end", plus(width, width)],
  );
};

/** The parent array, rooted at vertex 0, of the tree the Prüfer code `code` (n - 1 entries over 0..n) decodes
 *  to: the smallest leaf goes n - 1 times and hangs from the code's next entry, the last two vertices joined. That
 *  roots the tree at its largest vertex n, and the path from 0 up to n is turned around to root it at 0. State: the
 *  n + 1 degrees, then the leaves in the order they went. Entry 1, the root's, is 0. */
export const prueferParents = (code: string): MathJSON => {
  const width: MathJSON = plus(n, 1);
  const state = (index: MathJSON): MathJSON => item("pd_st", index);
  const step = given(
    "pd_u",
    firstWhere(vertices, ["Equal", state("y"), 1], "y", "pd_f"),
    forEach(
      upTo(plus(n, n)),
      [
        "If",
        ["LessEqual", "j", width],
        [
          "If",
          ["Equal", "j", "pd_u"],
          0,
          ["If", ["Equal", "j", plus(item(code, "pd_k"), 1)], minus(state("j"), 1), state("j")],
        ],
        ["If", ["Equal", "j", plus(width, "pd_k")], label("pd_u"), state("j")],
      ],
      "j",
    ),
  );
  const wentAt = (v: MathJSON): MathJSON => ["IndexOf", "pd_gone", v];
  const onPath = (v: MathJSON): MathJSON => ["IndexOf", "pd_walk", v];
  return lets(
    [
      ["pd_deg", forEach(vertices, plus(1, tally(code, ["Equal", "c", label("x")], "c", "pd_a")), "x"), LIST],
      [
        "pd_end",
        listFold(step, "pd_st", "pd_k", ["Join", "pd_deg", zeros(["Most", positions])], ["Most", positions]),
        LIST,
      ],
      ["pd_gone", ["Drop", "pd_end", width], LIST],
      [
        "pd_up",
        forEach(vertices, ["If", ["Greater", wentAt(label("x")), 0], item(code, wentAt(label("x"))), n], "x"),
        LIST,
      ],
      [
        "pd_walk",
        listFold(
          [
            "Join",
            "pd_trail",
            ["List", ["If", ["Equal", item("pd_trail", "t"), n], n, item("pd_up", plus(item("pd_trail", "t"), 1))]],
          ],
          "pd_trail",
          "t",
          ["List", 0],
          ["Most", vertices],
        ),
        LIST,
      ],
    ],
    [
      "Join",
      ["List", 0],
      forEach(
        positions,
        ["If", ["Greater", onPath("v"), 0], item("pd_walk", minus(onPath("v"), 1)), item("pd_up", plus("v", 1))],
        "v",
      ),
    ],
  );
};

/** The depth of every vertex of a tree given as a parent array, by n rounds of one more than the parent's. */
const depths = (parent: string): MathJSON =>
  listFold(
    forEach(vertices, ["If", ["Equal", "x", 1], 0, plus(item("dp_d", plus(item(parent, "x"), 1)), 1)], "x"),
    "dp_d",
    "dp_r",
    zeros(vertices),
    positions,
  );

/** The position (from 0, at the root) of every vertex of a tree in breadth-first order, the children of a vertex
 *  taken by label. Level d goes after the vertices above it, in the order of their parents' positions, then labels. */
const breadthFirstPositions = (parent: string, depth: string): MathJSON => {
  const parentPosition = (v: MathJSON): MathJSON => item("bf_ps", plus(item(parent, v), 1));
  return listFold(
    given(
      "bf_off",
      tally(vertices, ["Less", item(depth, "y"), "bf_d"], "y", "bf_o"),
      forEach(
        vertices,
        [
          "If",
          ["Equal", item(depth, "x"), "bf_d"],
          plus(
            "bf_off",
            tally(
              vertices,
              [
                "And",
                ["Equal", item(depth, "y"), "bf_d"],
                [
                  "Or",
                  ["Less", parentPosition("y"), parentPosition("x")],
                  ["And", ["Equal", parentPosition("y"), parentPosition("x")], ["Less", "y", "x"]],
                ],
              ],
              "y",
              "bf_r",
            ),
          ),
          item("bf_ps", "x"),
        ],
        "x",
      ),
    ),
    "bf_ps",
    "bf_d",
    zeros(vertices),
    positions,
  );
};

/** Mp00300: car v prefers 1 plus the breadth-first position of its parent in the tree of the Prüfer code
 *  (p(i) - p(1)) mod (n + 1), the inverse of OnesToLeading. */
export const leadingToOnesBody: MathJSON = [
  "If",
  ["Equal", n, 0],
  ["List"],
  lets(
    [
      [
        "ll_code",
        forEach(
          ["Drop", positions, 1],
          ["Mod", plus(minus(item("_raw", "i"), item("_raw", 1)), n, 1), plus(n, 1)],
          "i",
        ),
        LIST,
      ],
      ["ll_par", prueferParents("ll_code"), LIST],
      ["ll_depth", depths("ll_par"), LIST],
      ["ll_pos", breadthFirstPositions("ll_par", "ll_depth"), LIST],
    ],
    forEach(positions, plus(1, item("ll_pos", plus(item("ll_par", plus("v", 1)), 1))), "v"),
  ),
];

/** The depth-first contour of the tree of the Prüfer code (p(i + 1) - p(i)) mod (n + 1), read as a Dyck word: the
 *  children of a vertex go by how many children they have, then by label. The i-th vertex in depth-first order,
 *  at depth d, has its up step at position 2i - d. */
export const pollakRiordanWord: MathJSON = [
  "If",
  ["Equal", n, 0],
  ["List"],
  lets(
    [
      [
        "pw_code",
        forEach(
          ["Most", positions],
          ["Mod", plus(minus(item("_raw", plus("i", 1)), item("_raw", "i")), n, 1), plus(n, 1)],
          "i",
        ),
        LIST,
      ],
      ["pw_par", prueferParents("pw_code"), LIST],
      ["pw_depth", depths("pw_par"), LIST],
      [
        "pw_kids",
        forEach(vertices, tally(positions, ["Equal", item("pw_par", plus("j", 1)), label("x")], "j", "pw_a"), "x"),
        LIST,
      ],
      [
        "pw_size",
        listFold(
          forEach(
            vertices,
            plus(
              1,
              total(
                positions,
                ["If", ["Equal", item("pw_par", plus("j", 1)), label("x")], item("pw_sz", plus("j", 1)), 0],
                "j",
                "pw_b",
              ),
            ),
            "x",
          ),
          "pw_sz",
          "pw_r",
          forEach(vertices, 1, "z"),
          positions,
        ),
        LIST,
      ],
      [
        "pw_pre",
        listFold(
          forEach(
            vertices,
            [
              "If",
              ["Equal", "x", 1],
              0,
              plus(
                item("pw_pr", plus(item("pw_par", "x"), 1)),
                1,
                total(
                  positions,
                  [
                    "If",
                    [
                      "And",
                      ["Equal", item("pw_par", plus("j", 1)), item("pw_par", "x")],
                      [
                        "Or",
                        ["Less", item("pw_kids", plus("j", 1)), item("pw_kids", "x")],
                        [
                          "And",
                          ["Equal", item("pw_kids", plus("j", 1)), item("pw_kids", "x")],
                          ["Less", plus("j", 1), "x"],
                        ],
                      ],
                    ],
                    item("pw_size", plus("j", 1)),
                    0,
                  ],
                  "j",
                  "pw_c",
                ),
              ),
            ],
            "x",
          ),
          "pw_pr",
          "pw_s",
          zeros(vertices),
          positions,
        ),
        LIST,
      ],
      [
        "pw_ups",
        forEach(["Drop", vertices, 1], minus(["Multiply", 2, item("pw_pre", "x")], item("pw_depth", "x")), "x"),
        LIST,
      ],
    ],
    forEach(upTo(["Multiply", 2, n]), ["If", ["Greater", ["IndexOf", "pw_ups", "t"], 0], 1, 0], "t"),
  ),
];

/** Mp00297: the ordered tree whose depth-first contour is `pollakRiordanWord`. */
export const pollakRiordanTreeBody: MathJSON = lets(
  [["op", pollakRiordanWord, LIST]],
  buildFromDyck("op", ["Multiply", 2, n]) as MathJSON,
);

/** Mp00299: the Prüfer code of the tree of the parking function, with 0 in front, shifted up (mod n + 1) by the one
 *  amount that makes it a parking function: the first shift with no entry 0 and at least t entries at most t, for
 *  each t. */
export const onesToLeadingBody: MathJSON = (() => {
  const width: MathJSON = plus(n, 1);
  const shifted = (entry: MathJSON, s: MathJSON): MathJSON => ["Mod", plus(entry, s), width];
  const failures = (s: MathJSON): MathJSON =>
    total(
      positions,
      plus(
        ["If", ["Equal", shifted(item("ol_word", "t"), s), 0], 1, 0],
        [
          "If",
          ["Less", tally(positions, ["LessEqual", shifted(item("ol_word", "u"), s), "t"], "u", "ol_c"), "t"],
          1,
          0,
        ],
      ),
      "t",
      "ol_f",
    );
  return [
    "If",
    ["Equal", n, 0],
    ["List"],
    lets(
      [
        ["ol_code", foataRiordanCode(standardRanks), LIST],
        ["ol_word", ["Join", ["List", 0], "ol_code"], LIST],
        ["ol_fails", forEach(["Range", 0, n, 1], failures("s"), "s"), LIST],
      ],
      given(
        "ol_shift",
        minus(["IndexOf", "ol_fails", 0], 1),
        forEach(positions, shifted(item("ol_word", "i"), "ol_shift"), "i"),
      ),
    ),
  ];
})();

/** Mp00325: the same on a permutation, where the shift is the position of n: entry i of the Prüfer code with 0 in
 *  front, less that position, mod n + 1. */
export const onesToLeadingPermutationBody: MathJSON = [
  "If",
  ["Equal", n, 0],
  ["List"],
  lets(
    [
      ["op_code", foataRiordanCode("_raw"), LIST],
      ["op_word", ["Join", ["List", 0], "op_code"], LIST],
    ],
    forEach(positions, ["Mod", plus(item("op_word", "i"), n, 1, ["Negate", ["IndexOf", "_raw", n]]), plus(n, 1)], "i"),
  ),
];

/** Mp00054: the descents composition of the inverse of the diagonal reading word. Row r of the parking function's
 *  Dyck path (the entries ranked by `standardRanks`) holds one car, and its area is r - p. The word reads the cars by
 *  area, largest first, then by row, lowest first; its inverse gives each car its position in that order. */
export const inverseDescentCompositionBody: MathJSON = (() => {
  const area = (j: MathJSON): MathJSON => minus(item("id_rank", j), item("_raw", j));
  const before = (j: MathJSON): MathJSON => [
    "Or",
    ["Greater", area(j), area("i")],
    ["And", ["Equal", area(j), area("i")], ["Greater", item("id_rank", j), item("id_rank", "i")]],
  ];
  return [
    "If",
    ["Equal", n, 0],
    ["List"],
    lets(
      [
        ["id_rank", standardRanks, LIST],
        ["id_inverse", forEach(positions, plus(1, tally(positions, before("j"), "j", "id_a")), "i"), LIST],
        [
          "id_starts",
          listFold(
            [
              "If",
              [
                "Or",
                ["Equal", "p", 1],
                ["Greater", item("id_inverse", ["Max", minus("p", 1), 1]), item("id_inverse", "p")],
              ],
              ["Join", "id_s", ["List", "p"]],
              "id_s",
            ],
            "id_s",
            "p",
            ["List"],
            positions,
          ),
          LIST,
        ],
      ],
      forEach(
        upTo(["Length", "id_starts"]),
        minus(
          ["If", ["Equal", "q", ["Length", "id_starts"]], plus(n, 1), item("id_starts", plus("q", 1))],
          item("id_starts", "q"),
        ),
        "q",
      ),
    ),
  ];
})();

/** Mp00290: the blocks of the labelled Dyck path's runs, which are the cars with each preference in turn, the
 *  preferences no car has leaving no block. */
export const orderedSetPartitionBody: MathJSON = [
  "If",
  ["Equal", n, 0],
  ["List"],
  [
    "Map",
    ["Function", ["Filter", positions, ["Function", ["Equal", item("_raw", "p"), "j"], "p"]], "j"],
    ["Filter", upTo(n), ["Function", ["Greater", ["IndexOf", "_raw", "v"], 0], "v"]],
  ],
];
