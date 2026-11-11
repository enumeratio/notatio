// Readings for maps batch 19, after the Sage code FindStat states for each. Same contract as
// map-findstat-readings.ts: FindStat's text in, FindStat's text out.

import type { Reading } from "./map-findstat-readings.ts";

const ints = (text: string): number[] => JSON.parse(text) as number[];
const list = (items: readonly number[]): string => `[${items.join(",")}]`;

// --- binary trees, FindStat's text: `.` the empty tree, `[L,R]` a node ---

interface Node {
  left: Node | undefined;
  right: Node | undefined;
}

/** The tree of FindStat's text `[.,[.,.]]`, by one pass with a stack of open nodes. */
const readBinaryTree = (text: string): Node | undefined => {
  const open: { node: Node; side: number }[] = [];
  let root: Node | undefined;
  const attach = (child: Node | undefined): void => {
    const top = open[open.length - 1];
    if (top === undefined) root = child;
    else {
      if (top.side === 0) top.node.left = child;
      else top.node.right = child;
      top.side++;
    }
  };
  for (const c of text.replace(/\s+/g, "")) {
    if (c === "[") {
      const node: Node = { left: undefined, right: undefined };
      attach(node);
      open.push({ node, side: 0 });
    } else if (c === ".") attach(undefined);
    else if (c === "]") open.pop();
  }
  return root;
};

// --- Mp00008: Sage's as_ordered_tree, each empty subtree a leaf vertex ---

const completeTree = (text: string): string => {
  const write = (node: Node | undefined): string =>
    node === undefined ? "[]" : `[${write(node.left)},${write(node.right)}]`;
  return write(readBinaryTree(text));
};

// --- Mp00014 and Mp00017: the in-order numbers of the nodes, read in postorder ---

/** The numbers 1..n in order, then the nodes listed in postorder with the subtrees in the order `rightFirst` says. */
const postorderNumbers = (text: string, rightFirst: boolean): number[] => {
  const root = readBinaryTree(text);
  const number = new Map<Node, number>();
  let next = 0;
  const walk: (Node | undefined)[] = [];
  for (let node = root; node !== undefined || walk.length > 0;) {
    if (node !== undefined) {
      walk.push(node);
      node = node.left;
    } else {
      const done = walk.pop()!;
      number.set(done, ++next);
      node = done.right;
    }
  }
  const result: number[] = [];
  // Each entry is a node still to open, or one whose children are done.
  const todo: { node: Node; done: boolean }[] = root === undefined ? [] : [{ node: root, done: false }];
  while (todo.length > 0) {
    const { node, done } = todo.pop()!;
    if (done) {
      result.push(number.get(node)!);
      continue;
    }
    todo.push({ node, done: true });
    const kids = rightFirst ? [node.right, node.left] : [node.left, node.right];
    // Popped last-pushed first, so push the second subtree first.
    for (const kid of kids.toReversed()) if (kid !== undefined) todo.push({ node: kid, done: false });
  }
  return result;
};

// --- Mp00061: Sage's increasing_tree_shape, splitting at the smallest entry ---

const increasingTreeShape = (text: string): string => {
  const sigma = ints(text);
  const write = (from: number, to: number): string => {
    if (from > to) return ".";
    let at = from;
    for (let k = from; k <= to; k++) if (sigma[k]! < sigma[at]!) at = k;
    return `[${write(from, at - 1)},${write(at + 1, to)}]`;
  };
  return write(0, sigma.length - 1);
};

// --- Mp00233: the parallelogram polyomino of a Dyck path as a skew shape ---

/** Delest-Viennot: the path is 1, then n - 1 pairs (does the lower path go east, the upper path north), then 0. */
const polyominoSkewShape = (text: string): string => {
  const d = ints(text);
  const n = d.length / 2;
  const upper = ["N"];
  const lower = ["E"];
  for (let i = 1; i < n; i++) {
    lower.push(d[2 * i - 1] === 1 ? "E" : "N");
    upper.push(d[2 * i] === 1 ? "N" : "E");
  }
  if (n > 0) {
    upper.push("E");
    lower.push("N");
  }
  // For each north step, the cells to its west inside the row: the east steps before it.
  const starts: number[] = [];
  const ends: number[] = [];
  let east = 0;
  for (const step of upper) {
    if (step === "E") east++;
    else starts.push(east);
  }
  east = 0;
  for (const step of lower) {
    if (step === "E") east++;
    else ends.push(east);
  }
  const outer = ends.toReversed();
  const inner = starts.toReversed().filter((c) => c > 0);
  return `[${list(outer)},${list(inner)}]`;
};

export const BATCH_NINETEEN_READINGS: Readonly<Record<string, Reading>> = {
  "CompleteOrderedTree@BinaryTree": completeTree,
  "Avoiding132Permutation@BinaryTree": (text) => list(postorderNumbers(text, true)),
  "Avoiding312Permutation@BinaryTree": (text) => list(postorderNumbers(text, false)),
  "IncreasingTree@Permutation": increasingTreeShape,
  "SkewPartition@DyckPath": polyominoSkewShape,
};

/** Each reading's FindStat map. */
export const BATCH_NINETEEN_IDS: Readonly<Record<string, string>> = {
  "CompleteOrderedTree@BinaryTree": "Mp00008",
  "Avoiding132Permutation@BinaryTree": "Mp00014",
  "Avoiding312Permutation@BinaryTree": "Mp00017",
  "IncreasingTree@Permutation": "Mp00061",
  "SkewPartition@DyckPath": "Mp00233",
};
