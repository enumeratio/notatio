// The canonical form of a naturally labeled poset, in plain numbers (no engine). A value is its list of lower covers:
// entry i is the ascending list of the elements i + 1 covers, each at most i. Its code is the rank of its comparability
// graph in `LabeledGraphs(n)`: the pairs (a < b) in lex order are numbered 1..C(n, 2), pair k is bit k − 1, and the bit is
// set when a is below b. The code determines the poset, the canonical labeling is the natural labeling with the least
// code, and two posets are isomorphic exactly when their canonical codes are equal. A code fits a double through
// `MAX_CODED`.
//
// Pair (a, b) is bit `offset(a) + b - a - 1`: the pairs with first element a are a block of n − a bits, (a, n) the most
// significant, and a block with larger a is more significant than every block below it. So the least code is found by
// choosing the element for label n, then n − 1, down to 1, each time keeping the candidates whose block (which chosen
// elements lie above it) is least.

import { declineWork } from "../../collections/src/families/work.ts";

/** A poset as its lower covers, elements 1..n. */
export type Poset = readonly (readonly number[])[];

/** The most elements a code is carried for: C(10, 2) = 45 bits, the last size a double holds. */
export const MAX_CODED = 10;

/** The most elements `posetCodes` lists. The first list of 9 takes about five seconds, some fourteen times the list of 8;
 *  10 has 2.5 million classes to find among some hundred million candidates. */
export const MAX_LISTED = 9;

/** The number of bits below the block of label `a`: the blocks of labels 1..a − 1 hold n − 1, n − 2, … bits. */
const blockOffset = (n: number, a: number): number => (a - 1) * n - ((a - 1) * a) / 2;

/** 2^k as a double, exact through the code's 45 bits. */
const power = (k: number): number => 2 ** k;

/** The strict up-sets of a poset, bit j of entry i set when element j + 1 lies above element i + 1; natural labeling
 *  means an element above i + 1 has a larger label. */
export function upSets(value: Poset): number[] {
  const n = value.length;
  const below: number[] = [];
  for (let b = 0; b < n; b++) {
    let set = 0;
    for (const c of value[b]) set |= (1 << (c - 1)) | below[c - 1];
    below.push(set);
  }
  const above = Array.from({ length: n }, () => 0);
  for (let b = 0; b < n; b++) for (let a = 0; a < b; a++) if ((below[b] >> a) & 1) above[a] |= 1 << b;
  return above;
}

/** The code of a value under its own labeling. */
export function codeOf(value: Poset): number {
  const n = value.length;
  if (n > MAX_CODED) return declineWork(`the code of a poset on ${n} elements`);
  return codeOfUpSets(upSets(value), n);
}

function codeOfUpSets(above: readonly number[], n: number): number {
  let code = 0;
  for (let a = 1; a < n; a++) code += (above[a - 1] >> a) * power(blockOffset(n, a));
  return code;
}

/** The value a code stands for, or undefined when the code is no strict order (some a < c < b without a < b). */
export function valueOfCode(n: number, code: number): number[][] | undefined {
  if (n > MAX_CODED) return declineWork(`a poset on ${n} elements`);
  const above = Array.from({ length: n }, () => 0);
  for (let a = 1; a < n; a++) {
    const block = Math.floor(code / power(blockOffset(n, a))) % power(n - a);
    above[a - 1] = block * (1 << a);
  }
  // Transitive: whatever lies above c lies above each a below c.
  for (let a = 0; a < n; a++)
    for (let c = a + 1; c < n; c++) if (((above[a] >> c) & 1) === 1 && (above[c] & ~above[a]) !== 0) return undefined;
  // A cover of b is an element below b with no other element below b above it.
  return Array.from({ length: n }, (_, b) => {
    const lower = Array.from({ length: b }, (_, a) => a).filter((a) => ((above[a] >> b) & 1) === 1);
    return lower.filter((a) => !lower.some((c) => ((above[a] >> c) & 1) === 1)).map((a) => a + 1);
  });
}

/** The search's twin test: two elements with the same up-set and the same down-set are interchangeable. */
const downSets = (above: readonly number[]): number[] => {
  const n = above.length;
  const below = Array.from({ length: n }, () => 0);
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if ((above[a] >> b) & 1) below[b] |= 1 << a;
  return below;
};

/**
 * The least code over the natural labelings of the poset with up-sets `above`, or, given `reference` (the blocks of
 * a labeling, label n first), whether none is smaller: it stops at the first level where one is.
 */
function search(above: readonly number[], reference?: readonly number[]): number[] | boolean {
  const n = above.length;
  const below = downSets(above);
  const best: number[] = [];
  // `order[k]` is the element labeled n − k; `at[e]` its index there, or -1 while unchosen.
  const order: number[] = [];
  const at = Array.from({ length: n }, () => -1);
  const blocks: number[] = [];
  let smaller = false;

  /** Whether the labeling now under way, to `depth` levels, is ahead of `best`, equal to it, or behind. */
  const compare = (depth: number): number => {
    const target = reference ?? best;
    for (let k = 0; k < depth; k++) {
      if (k >= target.length) return -1;
      if (blocks[k] !== target[k]) return blocks[k] < target[k] ? -1 : 1;
    }
    return 0;
  };

  const extend = (depth: number, chosen: number): void => {
    if (smaller) return;
    if (depth === n) {
      if (reference === undefined && (best.length === 0 || compare(n) < 0)) best.splice(0, best.length, ...blocks);
      return;
    }
    // Label a = n − depth; its block holds a bit for each chosen element above it, label b at bit b − a − 1,
    // which is the element's position in `order`: label n − k is bit depth − 1 − k.
    const candidates: number[] = [];
    let least = Number.POSITIVE_INFINITY;
    for (let e = 0; e < n; e++) {
      if (at[e] !== -1 || (above[e] & ~chosen) !== 0) continue;
      let block = 0;
      for (let rest = above[e]; rest !== 0; rest &= rest - 1) {
        const x = 31 - Math.clz32(rest & -rest);
        block |= 1 << (depth - 1 - at[x]);
      }
      if (block < least) {
        least = block;
        candidates.length = 0;
      }
      if (block === least) candidates.push(e);
    }
    blocks[depth] = least;
    const verdict = compare(depth + 1);
    if (verdict > 0) return;
    if (verdict < 0 && reference !== undefined) {
      smaller = true;
      return;
    }
    const kept: number[] = [];
    for (const e of candidates) if (!kept.some((f) => above[f] === above[e] && below[f] === below[e])) kept.push(e);
    for (const e of kept) {
      order[depth] = e;
      at[e] = depth;
      extend(depth + 1, chosen | (1 << e));
      at[e] = -1;
    }
  };
  extend(0, 0);
  if (reference !== undefined) return !smaller;
  return best;
}

/** The canonical code from the blocks `search` returns, label n first. */
function codeOfBlocks(blocks: readonly number[], n: number): number {
  let code = 0;
  for (let depth = 1; depth < n; depth++) code += blocks[depth] * power(blockOffset(n, n - depth));
  return code;
}

/** The blocks of a labeling, label n first (depth 0 is label n's empty block). */
function ownBlocks(above: readonly number[]): number[] {
  const n = above.length;
  const blocks: number[] = [];
  for (let depth = 0; depth < n; depth++) blocks.push(depth === 0 ? 0 : above[n - 1 - depth] >> (n - depth));
  return blocks;
}

/** The least code over the natural labelings of the poset `value`. */
export function canonicalCode(value: Poset): number {
  const n = value.length;
  if (n > MAX_CODED) return declineWork(`the canonical code of a poset on ${n} elements`);
  if (n < 2) return 0;
  return codeOfBlocks(search(upSets(value)) as number[], n);
}

/** The canonical labeling of `value`. */
export function canonicalPoset(value: Poset): number[][] {
  const code = canonicalCode(value);
  return valueOfCode(value.length, code) as number[][];
}

/** Whether the poset with up-sets `above` has no natural labeling with a smaller code than its own. */
const isCanonicalUpSets = (above: readonly number[]): boolean =>
  above.length < 2 || (search(above, ownBlocks(above)) as boolean);

/** Whether `value`'s own labeling is canonical. */
export function isCanonical(value: Poset): boolean {
  if (value.length > MAX_CODED) return declineWork(`the canonical form of a poset on ${value.length} elements`);
  return isCanonicalUpSets(upSets(value));
}

/**
 * Whether `value` is a naturally labeled, transitively reduced poset: entries ascending integers, each element at least
 * 1 and below its own index, no cover implied by another.
 */
export function isReduced(value: unknown): value is Poset {
  if (!Array.isArray(value) || value.length > 30) return false;
  const rows = value as unknown[];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) return false;
    for (let k = 0; k < row.length; k++) {
      const c = row[k];
      if (!Number.isInteger(c) || c < 1 || c > i || (k > 0 && row[k - 1] >= c)) return false;
    }
  }
  const above = upSets(rows as number[][]);
  return (rows as number[][]).every((covers) =>
    covers.every((a) => covers.every((b) => a === b || ((above[a - 1] >> (b - 1)) & 1) === 0)),
  );
}

// ─── the list: every canonical code on n elements, ascending ─────────────────────────────────────────────────────────

const lists = new Map<number, Float64Array>([
  [0, Float64Array.of(0)],
  [1, Float64Array.of(0)],
]);

/** The up-sets of the poset with up-sets `above`: sets that contain everything above each of their members. */
function* upSetMasks(above: readonly number[]): Generator<number> {
  const n = above.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    let closed = true;
    for (let rest = mask; rest !== 0 && closed; rest &= rest - 1) {
      const x = 31 - Math.clz32(rest & -rest);
      if ((above[x] & ~mask) !== 0) closed = false;
    }
    if (closed) yield mask;
  }
}

/**
 * Every canonical code on n elements, ascending, generated from the list for n − 1 and kept for the process. Label 1 is a
 * minimal element and its pairs are the low n − 1 bits, so a canonical code is `q · 2^(n − 1) + U`: q canonical on n − 1
 * elements and U an up-set of it, canonical exactly when no natural labeling has a smaller block at any level.
 */
export function posetCodes(n: number): Float64Array {
  if (!Number.isInteger(n) || n < 0 || n > MAX_LISTED) return declineWork(`the list of posets on ${n} elements`);
  const kept = lists.get(n);
  if (kept !== undefined) return kept;
  const previous = posetCodes(n - 1);
  const found: number[] = [];
  for (const q of previous) {
    const rest = upSets(valueOfCode(n - 1, q) as number[][]);
    for (const mask of upSetMasks(rest)) {
      // The new element is 1 and the old ones shift up by one; its up-set is the mask.
      const above = [mask << 1, ...rest.map((set) => set << 1)];
      if (isCanonicalUpSets(above)) found.push(q * power(n - 1) + mask);
    }
  }
  const list = Float64Array.from(found);
  lists.set(n, list);
  return list;
}

/** The place of `code` in the ascending `list`, or -1. */
export function indexOfCode(list: Float64Array, code: number): number {
  let low = 0;
  let high = list.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (list[mid] === code) return mid;
    if (list[mid] < code) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}

/** The number of posets on n elements up to isomorphism; the list is generated on first use. */
export const posetCount = (n: number): number => posetCodes(n).length;

/** The `r`-th (0-based) poset on n elements in ascending canonical code. */
export const posetAt = (n: number, r: number): number[][] => {
  const list = posetCodes(n);
  if (!(r >= 0 && r < list.length))
    throw new RangeError(`Posets(${n}): rank ${r} is outside the fiber of ${list.length}`);
  return valueOfCode(n, list[r]) as number[][];
};

/** The 0-based place of the canonical poset `value`, or -1 when it is no member. */
export const posetRank = (value: unknown): number => {
  if (!isReduced(value)) return -1;
  const n = value.length;
  if (n > MAX_LISTED) return declineWork(`the list of posets on ${n} elements`);
  if (!isCanonical(value)) return -1;
  return indexOfCode(posetCodes(n), codeOf(value));
};

/** Whether `value` is a member of `Posets(n)`: reduced, `n` elements, canonical. */
export const isPosetMember = (value: unknown, n: number): boolean => {
  if (!isReduced(value) || value.length !== n) return false;
  if (n > MAX_LISTED) return declineWork(`the list of posets on ${n} elements`);
  return isCanonical(value);
};
