// An ordered tree read flat, for compiled code: the Dyck word of the root's children (1 enters a
// child, 0 leaves it; `[]` is `[]`), which is the image of DyckPath@ordered_tree. The nested tree
// (a node is the list of its children) stays the meaning (ordered-tree.ts); the `flat` bodies here
// are its compiled alternative, held to it by the build's `agrees` checks.
//
// Both directions are one iterative pass, so a deep or wide tree costs no stack, and both decline
// (`undefined`) a value that isn't one.
//
// Every body reads the word `_raw` as a valid Dyck word: the codec's `encode` only makes those.
// Depths come from prefix counts of ups, so a body is a pass of folds and filters over positions.

import type { FlatCodec } from "@notatio/structures";
import { add, and, at, equal, fold, iff, less, map, sub, upTo } from "../../collections/src/families/tables.ts";
import { given } from "./flat.ts";

type MathJSON = unknown;
type Plane = readonly Plane[];

/** The Dyck word of a nested ordered tree; `undefined` for a value that isn't one. */
export function dyckWordOf(tree: unknown): number[] | undefined {
  if (!Array.isArray(tree)) return undefined;
  const out: number[] = [];
  // Each open node with the index of its next child to visit.
  const stack: { node: readonly unknown[]; next: number }[] = [{ node: tree, next: 0 }];
  while (stack.length > 0) {
    const top = stack[stack.length - 1]!;
    if (top.next === top.node.length) {
      stack.pop();
      if (stack.length > 0) out.push(0);
      continue;
    }
    const child = top.node[top.next++];
    if (!Array.isArray(child)) return undefined;
    out.push(1);
    stack.push({ node: child, next: 0 });
  }
  return out;
}

/** The nested ordered tree a Dyck word describes; `undefined` for an array that isn't one: an entry
 *  other than 0 and 1, a prefix with more downs than ups, or a final height other than 0. */
export function treeOfDyckWord(word: unknown): Plane | undefined {
  if (!Array.isArray(word)) return undefined;
  const root: unknown[] = [];
  const open: unknown[][] = [root];
  for (const step of word) {
    if (step === 1) {
      const child: unknown[] = [];
      open[open.length - 1]!.push(child);
      open.push(child);
    } else if (step === 0 && open.length > 1) open.pop();
    else return undefined;
  }
  return open.length === 1 ? (root as Plane) : undefined;
}

export const ORDERED_TREE_FLAT: FlatCodec = {
  shape: "list<integer>",
  encode: dyckWordOf,
  decode: treeOfDyckWord,
};

// ── flat bodies ──────────────────────────────────────────────────────────────────────────

const length = (p: MathJSON): MathJSON => ["Length", p];
const greater = (a: MathJSON, b: MathJSON): MathJSON => ["Greater", a, b];
const lessEqual = (a: MathJSON, b: MathJSON): MathJSON => ["LessEqual", a, b];
const count = (items: MathJSON): MathJSON => ["Count", items];
const filter = (over: MathJSON, test: MathJSON, variable: string): MathJSON => [
  "Filter",
  over,
  ["Function", test, variable],
];
/** `body` with `name` bound to a list of integers (an untyped lambda applied to a list maps over it). */
const givenList = (name: string, value: MathJSON, body: MathJSON): MathJSON => [
  "Apply",
  ["Function", body, ["Typed", name, "'list<integer>'"]],
  value,
];

const L = length("_raw");
const pos = upTo(1, L);

/** The height of the word after its first `q` steps: twice the ups, less the steps. */
const heightAt = (q: MathJSON, tag: string): MathJSON =>
  sub(["Multiply", 2, count(filter(upTo(1, q), equal(at("_raw", `${tag}t`), 1), `${tag}t`))], q);

/** The depths of the vertices in preorder: the height after each up step. */
const preorderDepths: MathJSON = map(heightAt("dq", "da"), "dq", filter(pos, equal(at("_raw", "dp"), 1), "dp"));

/** The depths of the vertices in postorder: one more than the height after each down step. */
const postorderDepths: MathJSON = map(
  add(heightAt("eq", "ea"), 1),
  "eq",
  filter(pos, equal(at("_raw", "ep"), 0), "ep"),
);

/** Mp00051: the flat form of an ordered tree is the Dyck word. */
export const dyckPathOfOrderedFlat: MathJSON = "_raw";

/** Mp00048: the word read backwards with ups and downs swapped (the same as ReverseComplement). */
export const mirrorOrderedFlat: MathJSON = map(sub(1, at("_raw", sub(add(L, 1), "i"))), "i", pos);

/** Mp00246: the word is U^k D C_{k-1} D … D C_0; the result is C_{k-1} U … C_0 U D^k. The first
 *  down is at `rp`, and each later down that reaches a new low (below every height since `rp`) turns
 *  into an up; a last up and k downs close the word. */
export const rotationOrderedFlat: MathJSON = given(
  "rp",
  fold(iff(and(equal("ra", 0), equal(at("_raw", "rj"), 0)), "rj", "ra"), "ra", "rj", 0, pos),
  givenList(
    "rg",
    map(heightAt("rh", "rb"), "rh", pos),
    map(
      iff(
        lessEqual("ri", sub(L, "rp")),
        iff(
          less(at("rg", add("rp", "ri")), ["Min", map(at("rg", "rm"), "rm", upTo("rp", sub(add("rp", "ri"), 1)))]),
          1,
          at("_raw", add("rp", "ri")),
        ),
        iff(equal("ri", add(sub(L, "rp"), 1)), 1, 0),
      ),
      "ri",
      pos,
    ),
  ),
);

/** Over the depths `D`, the first position after `k` with a depth at most `D[k]`, or 0. */
const nextAtMost = (D: string, k: MathJSON, tag: string): MathJSON =>
  fold(
    iff(and(equal(`${tag}a`, 0), greater(`${tag}j`, k), lessEqual(at(D, `${tag}j`), at(D, k))), `${tag}j`, `${tag}a`),
    `${tag}a`,
    `${tag}j`,
    0,
    upTo(1, length(D)),
  );

/** Over the depths `D`, the last position before `k` with a depth below `D[k]`, or 0. */
const lastBelow = (D: string, k: MathJSON, tag: string): MathJSON =>
  fold(
    iff(and(less(`${tag}j`, k), less(at(D, `${tag}j`), at(D, k))), `${tag}j`, `${tag}a`),
    `${tag}a`,
    `${tag}j`,
    0,
    upTo(1, length(D)),
  );

/** Over the depths `D`, the last position before `k` with a depth at most `D[k]`, or 0. */
const lastAtMost = (D: string, k: MathJSON, tag: string): MathJSON =>
  fold(
    iff(and(less(`${tag}j`, k), lessEqual(at(D, `${tag}j`), at(D, k))), `${tag}j`, `${tag}a`),
    `${tag}a`,
    `${tag}j`,
    0,
    upTo(1, length(D)),
  );

/** Over the depths `D`, the first position after `k` with a depth below `D[k]`, or 0. */
const nextBelow = (D: string, k: MathJSON, tag: string): MathJSON =>
  fold(
    iff(and(equal(`${tag}a`, 0), greater(`${tag}j`, k), less(at(D, `${tag}j`), at(D, k))), `${tag}j`, `${tag}a`),
    `${tag}a`,
    `${tag}j`,
    0,
    upTo(1, length(D)),
  );

/** Mp00049: the vertices numbered in preorder (the binary tree's in-order); a vertex with a right
 *  brother is that brother's left child, the last child of a vertex its right child. */
export const leftBranchBinaryFlat: MathJSON = givenList(
  "bd",
  preorderDepths,
  map(
    given(
      "bn",
      nextAtMost("bd", "bk", "bx"),
      iff(
        equal("bn", 0),
        lastBelow("bd", "bk", "by"),
        iff(equal(at("bd", "bn"), at("bd", "bk")), "bn", lastBelow("bd", "bk", "bz")),
      ),
    ),
    "bk",
    upTo(1, length("bd")),
  ),
);

/** Mp00050: the vertices numbered in postorder (the binary tree's in-order); a vertex with a left
 *  brother is that brother's right child, the first child of a vertex its left child. */
export const rightBranchBinaryFlat: MathJSON = givenList(
  "cd",
  postorderDepths,
  map(
    given(
      "cp",
      lastAtMost("cd", "ck", "cx"),
      iff(
        equal("cp", 0),
        nextBelow("cd", "ck", "cy"),
        iff(equal(at("cd", "cp"), at("cd", "ck")), "cp", nextBelow("cd", "ck", "cz")),
      ),
    ),
    "ck",
    upTo(1, length("cd")),
  ),
);

/** The depth of node `k` of the parent array `_raw`: one more than the edges on its path to the root
 *  that go one way (`right`: to a child numbered above its parent; else below). The walk takes n steps
 *  on the packed state `edges * (n + 1) + current node`, which stays at the root's parent 0. */
const pathDepth = (k: MathJSON, right: boolean, tag: string): MathJSON => {
  const [s, j, cur, parent] = [`${tag}s`, `${tag}j`, `${tag}c`, `${tag}p`];
  const n = length("_raw");
  const base = add(n, 1);
  const edge = and(greater(parent, 0), right ? greater(cur, parent) : less(cur, parent));
  const step = given(
    cur,
    ["Mod", s, base],
    given(
      parent,
      iff(equal(cur, 0), 0, at("_raw", cur)),
      iff(equal(cur, 0), s, add(["Multiply", add(["Divide", sub(s, cur), base], iff(edge, 1, 0)), base], parent)),
    ),
  );
  const end = fold(step, s, j, k, upTo(1, n));
  return add(1, ["Divide", sub(end, ["Mod", end, base]), base]);
};

/** Mp00010: a binary tree's in-order is the preorder of the ordered tree; a right child is one level
 *  down, a left child the same level as its parent. The k-th up of the word sits at 2k - depth. */
export const leftBranchOrderedFlat: MathJSON = givenList(
  "od",
  map(pathDepth("ok", true, "oa"), "ok", pos),
  map(
    fold(iff(equal(sub(["Multiply", 2, "ok"], at("od", "ok")), "oq"), 1, "oa"), "oa", "ok", 0, pos),
    "oq",
    upTo(1, ["Multiply", 2, L]),
  ),
);

/** Mp00015: the in-order is the postorder; a left child is one level down. The k-th down sits at
 *  2k - 1 + depth. */
export const rightBranchOrderedFlat: MathJSON = givenList(
  "rd",
  map(pathDepth("rk", false, "ra"), "rk", pos),
  map(
    fold(iff(equal(add(["Multiply", 2, "rk"], sub(at("rd", "rk"), 1)), "rq"), 0, "ra"), "ra", "rk", 1, pos),
    "rq",
    upTo(1, ["Multiply", 2, L]),
  ),
);

// ── statistics ───────────────────────────────────────────────────────────────────────────
// Over `_x`, the Dyck word. A vertex is an up step, the root being none: `[]` is the word `[]`.

const W = "_x";
const wordLength = length(W);
const wordPositions = upTo(1, wordLength);

/** The heights after each step of the word, as a list. A step's height is twice the ups so far,
 *  less the steps. */
const wordHeights: MathJSON = map(
  sub(["Multiply", 2, count(filter(upTo(1, "sq"), equal(at(W, "st"), 1), "st"))], "sq"),
  "sq",
  wordPositions,
);

/** `body` with `H` bound to the heights after each step. */
const withHeights = (body: MathJSON): MathJSON => givenList("H", wordHeights, body);

/** The positions of the leaves other than the root: a down step right after an up step. */
const leafSteps: MathJSON = filter(
  upTo(2, wordLength),
  and(equal(at(W, "lp"), 0), equal(at(W, sub("lp", 1)), 1)),
  "lp",
);

/** The edges on the path that always takes the first child (`first`), or the last: the run of ups
 *  from the start, or of downs from the end. */
const edgeRun = (first: boolean, tag: string): MathJSON => {
  const [a, j] = [`${tag}a`, `${tag}j`];
  const step = first ? at(W, j) : at(W, sub(add(wordLength, 1), j));
  return fold(iff(and(equal(a, sub(j, 1)), equal(step, first ? 1 : 0)), j, a), a, j, 0, wordPositions);
};

/** The most edges on a path from the root: the highest the word climbs. */
export const heightOrderedFlat: MathJSON = withHeights(
  fold(iff(greater(at("H", "mj"), "ma"), at("H", "mj"), "ma"), "ma", "mj", 0, wordPositions),
);

/** The most vertices on a path from the root: one more than the height. */
export const longestPathVertexCountOrderedFlat: MathJSON = add(heightOrderedFlat, 1);

/** A leaf is a down step after an up step; the lone vertex has no steps and is one. */
export const leavesOrderedFlat: MathJSON = add(count(leafSteps), iff(equal(wordLength, 0), 1, 0));

/** The non-root vertices are the ups; the non-root leaves are the up-down pairs. */
export const nonRootInternalNodesOrderedFlat: MathJSON = sub(
  count(filter(wordPositions, equal(at(W, "np"), 1), "np")),
  count(leafSteps),
);

/** The sum of the depths of the vertices: the heights after the up steps. */
export const pathLengthOrderedFlat: MathJSON = withHeights(
  fold(add("pa", iff(equal(at(W, "pj"), 1), at("H", "pj"), 0)), "pa", "pj", 0, wordPositions),
);

/** The edges on the leftmost path plus those on the rightmost. */
export const boundaryLengthOrderedFlat: MathJSON = add(edgeRun(true, "bl"), edgeRun(false, "br"));

/** The depth of the nearest leaf: the least height before a leaf's down step; the word's length
 *  stands for none, so the lone vertex gives 0. */
export const protectionNumberOrderedFlat: MathJSON = withHeights(
  fold(
    iff(and(equal(at(W, "qj"), 0), equal(at(W, sub("qj", 1)), 1)), ["Min", "qa", at("H", sub("qj", 1))], "qa"),
    "qa",
    "qj",
    wordLength,
    upTo(2, wordLength),
  ),
);

/** The edges from the root while a vertex has exactly one child: the j such that the word starts
 *  with j ups and no height from step j to step n - j falls below j. */
export const trunkLengthOrderedFlat: MathJSON = withHeights(
  count(
    filter(
      upTo(1, ["Divide", wordLength, 2]),
      equal(["Min", map(at("H", "tm"), "tm", upTo("tj", sub(wordLength, "tj")))], "tj"),
      "tj",
    ),
  ),
);

/** The leftmost and rightmost paths less the trunk they share. */
export const boundaryLengthBeyondTrunkOrderedFlat: MathJSON = sub(boundaryLengthOrderedFlat, trunkLengthOrderedFlat);
