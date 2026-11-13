// A closed interval `[a, b]` is also a list, so its boxes carry a `TagBox` named `Interval`
// and the writers that drop the tag spell it as compute-engine's LaTeX serializer does: `[a, b]`
// where a set is expected (the operand of a set operator), else a call `Interval(a, b)`.

import { type Box, type BoxNode, isNode } from "../box.ts";

type Tagged = Extract<BoxNode, readonly ["TagBox", ...unknown[]]>;

/** Operators whose operands are sets in compute-engine's serializer (`serializeSetOperator`,
 *  `latex-syntax/dictionary/definitions-sets.ts`): either side of these, ... */
const SETS_BOTH_SIDES = new Set(["∪", "∩", "∖", "△", "⊂", "⊆", "⊃", "⊇"]);
/** ... and only the right side of these (the left is an element). */
const SET_ON_THE_RIGHT = new Set(["∈", "∉"]);

export const isClosedInterval = (box: Box): box is Tagged =>
  isNode(box) && box[0] === "TagBox" && box[2] === "Interval";

/** Whether the closed interval at `items[i]` sits where a set is expected. */
export function inSetPosition(items: readonly Box[], i: number): boolean {
  const before = items[i - 1];
  const after = items[i + 1];
  return (
    (typeof before === "string" && (SETS_BOTH_SIDES.has(before) || SET_ON_THE_RIGHT.has(before))) ||
    (typeof after === "string" && SETS_BOTH_SIDES.has(after))
  );
}

export const isRange = (box: Box): boolean =>
  isNode(box) && box[0] === "RowBox" && box[1].length >= 3 && box[1][0] === "⟦" && box[1].at(-1) === "⟧";

/** Whether `a..b` at `items[i]` is set off by a relation or a set operator, where it reads as written. */
export function besideRelation(items: readonly Box[], i: number): boolean {
  const around = [items[i - 1], items[i + 1]];
  return around.some(
    (t) => typeof t === "string" && (SETS_BOTH_SIDES.has(t) || SET_ON_THE_RIGHT.has(t) || t === "=" || t === "≠"),
  );
}

/** The pieces between a bracket pair, split at its commas: the ends of an interval or range. */
export function endsOf(items: readonly Box[]): Box[][] {
  const [only] = items;
  const body = items.length === 1 && isNode(only) && only[0] === "RowBox" ? only[1] : items;
  const ends: Box[][] = [[]];
  for (const b of body)
    if (b === ",") ends.push([]);
    else ends.at(-1)!.push(b);
  return ends;
}

/** A bracketed row's contents, when it is `open … close`. */
export const insideOf = (items: readonly Box[], open: string, close: string): readonly Box[] | undefined =>
  items.length >= 3 && items[0] === open && items.at(-1) === close ? items.slice(1, -1) : undefined;

/** A tagged `[a, b]`'s ends. */
export const intervalEnds = (tagged: Tagged): Box[][] => {
  const inner = tagged[1];
  return endsOf(insideOf(isNode(inner) && inner[0] === "RowBox" ? inner[1] : [inner], "[", "]") ?? []);
};
