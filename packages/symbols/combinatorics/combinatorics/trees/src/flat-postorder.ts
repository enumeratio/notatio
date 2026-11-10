// Compiled bodies for the maps that read a binary tree in postorder (Mp00008, Mp00014, Mp00017), over the tree's
// in-order parent array `_raw` (flat.ts). Subtree intervals come from depths: the subtree of v is the stretch of
// in-order labels around v whose nodes are all deeper than v, so lo(v) - 1 is the last earlier node at most as deep
// and hi(v) + 1 the first later one. The nested bodies (binary-tree-conversion-maps.ts) stay the meaning.

import {
  add,
  and,
  at,
  equal,
  fold,
  iff,
  less,
  lets,
  map,
  mul,
  sub,
  upTo,
} from "../../collections/src/families/tables.ts";

type MathJSON = unknown;

const n: MathJSON = ["Length", "_raw"];
const nodes = upTo(1, n);
const notEqual = (a: MathJSON, b: MathJSON): MathJSON => ["NotEqual", a, b];
const greater = (a: MathJSON, b: MathJSON): MathJSON => ["Greater", a, b];
const lessEqual = (a: MathJSON, b: MathJSON): MathJSON => ["LessEqual", a, b];

/** The parent of the ancestor `cur` of a node, or 0 past the root. */
const parentOf = (cur: MathJSON): MathJSON => iff(equal(cur, 0), 0, at("_raw", cur));

/** Over the ancestors of node `v`, the accumulator [current ancestor, depth, ancestors below v]; folded n times,
 *  which passes the root. */
const ancestorCounts = (v: MathJSON, tag: string): MathJSON =>
  fold(
    lets(
      [[`${tag}n`, parentOf(at(`${tag}a`, 1))]],
      [
        "List",
        `${tag}n`,
        add(at(`${tag}a`, 2), iff(notEqual(`${tag}n`, 0), 1, 0)),
        add(at(`${tag}a`, 3), iff(and(notEqual(`${tag}n`, 0), less(`${tag}n`, v)), 1, 0)),
      ],
    ),
    `${tag}a`,
    `${tag}t`,
    ["List", v, 0, 0],
    nodes,
    "list<integer>",
  );

/** Over the depths `D`, the last position before `k` with a depth at most `D[k]`, or 0. */
const lastAtMost = (k: MathJSON, tag: string): MathJSON =>
  fold(
    iff(and(less(`${tag}j`, k), lessEqual(at("pf_depth", `${tag}j`), at("pf_depth", k))), `${tag}j`, `${tag}a`),
    `${tag}a`,
    `${tag}j`,
    0,
    nodes,
  );

/** Over the depths `D`, the first position after `k` with a depth at most `D[k]`, or 0. */
const nextAtMost = (k: MathJSON, tag: string): MathJSON =>
  fold(
    iff(
      and(equal(`${tag}a`, 0), greater(`${tag}j`, k), lessEqual(at("pf_depth", `${tag}j`), at("pf_depth", k))),
      `${tag}j`,
      `${tag}a`,
    ),
    `${tag}a`,
    `${tag}j`,
    0,
    nodes,
  );

/** `body` with, for each node, its depth `pf_depth`, the lowest and highest labels `pf_low` and `pf_high` of its
 *  subtree, and the number `pf_before` of its ancestors with a smaller label. */
const withSubtrees = (body: MathJSON): MathJSON =>
  lets(
    [
      ["pf_depth", map(at(ancestorCounts("pv", "pd"), 2), "pv", nodes), "list<integer>"],
      ["pf_before", map(at(ancestorCounts("pv", "pe"), 3), "pv", nodes), "list<integer>"],
      ["pf_low", map(add(lastAtMost("pk", "pl"), 1), "pk", nodes), "list<integer>"],
      [
        "pf_high",
        map(lets([["pf_next", nextAtMost("pk", "ph")]], iff(equal("pf_next", 0), n, sub("pf_next", 1))), "pk", nodes),
        "list<integer>",
      ],
    ],
    body,
  );

/** The permutation whose entry k is the node of postorder rank k, given the ranks of the nodes. */
const nodesByRank = (ranks: MathJSON): MathJSON =>
  lets([["pf_rank", ranks, "list<integer>"]], map(["IndexOf", "pf_rank", "pk"], "pk", nodes));

/** Mp00017: postorder, left subtree first: a node comes after its subtree and the earlier (smaller-labeled) nodes
 *  that are not its ancestors, so its rank is its subtree's last label less its ancestors with a smaller label. */
export const avoiding312Flat: MathJSON = iff(
  equal(n, 0),
  ["List"],
  withSubtrees(nodesByRank(map(sub(at("pf_high", "pk"), at("pf_before", "pk")), "pk", nodes))),
);

/** Mp00014: postorder, right subtree first: rank n + 1 - low(v) less the ancestors with a larger label. */
export const avoiding132Flat: MathJSON = iff(
  equal(n, 0),
  ["List"],
  withSubtrees(
    nodesByRank(
      map(sub(sub(add(n, 1), at("pf_low", "pk")), sub(at("pf_depth", "pk"), at("pf_before", "pk"))), "pk", nodes),
    ),
  ),
);

/** Mp00008: the complete tree's Dyck word has an up where a vertex of the complete tree is entered. The vertex v of
 *  the tree is the pre(v)-th vertex in preorder, pre(v) its depth plus the complete left subtrees (2 (a - low(a)) + 1
 *  vertices each) of the ancestors it sits right of, and its up is the (2 pre(v) - depth(v))-th step. A missing left
 *  child of v is the next vertex in preorder, a missing right child comes after v's whole left subtree. */
export const completeTreeFlat: MathJSON = iff(
  equal(n, 0),
  ["List"],
  withSubtrees(
    lets(
      [
        [
          "pf_preorder",
          map(
            add(
              at("pf_depth", "pv"),
              at(
                fold(
                  lets(
                    [["pc_n", parentOf(at("pc_a", 1))]],
                    [
                      "List",
                      "pc_n",
                      add(
                        at("pc_a", 2),
                        iff(
                          equal("pc_n", 0),
                          0,
                          iff(less("pc_n", "pv"), add(mul(2, sub("pc_n", at("pf_low", "pc_n"))), 1), 0),
                        ),
                      ),
                    ],
                  ),
                  "pc_a",
                  "pc_t",
                  ["List", "pv", 0],
                  nodes,
                  "list<integer>",
                ),
                2,
              ),
            ),
            "pv",
            nodes,
          ),
          "list<integer>",
        ],
        // 2 pre(a) - depth(a): the up that enters node a.
        ["pf_entry", map(sub(mul(2, at("pf_preorder", "pk")), at("pf_depth", "pk")), "pk", nodes), "list<integer>"],
        [
          "pf_ups",
          [
            "Join",
            "pf_entry",
            map(iff(equal(at("pf_low", "pk"), "pk"), add(at("pf_entry", "pk"), 1), 0), "pk", nodes),
            map(
              iff(
                equal(at("pf_high", "pk"), "pk"),
                add(at("pf_entry", "pk"), mul(4, sub("pk", at("pf_low", "pk"))), 3),
                0,
              ),
              "pk",
              nodes,
            ),
          ],
          "list<integer>",
        ],
      ],
      map(["Count", ["Filter", "pf_ups", ["Function", equal("pe", "pt"), "pe"]]], "pt", upTo(1, mul(4, n))),
    ),
  ),
);
