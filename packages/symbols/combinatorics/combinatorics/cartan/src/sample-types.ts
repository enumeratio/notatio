// The finite Cartan types as the contents of a `CartanType` value, `Tuple("A", 3)`: those of rank 1 to `maxRank`
// and any `extra` ones.

import { CARTAN_LETTERS } from "./carrier-data.ts";

/** The letters that have a type of each rank (C_2 is B_2, so it is left out). */
const hasType = (letter: string, rank: number): boolean =>
  ({
    A: rank >= 1,
    B: rank >= 2,
    C: rank >= 3,
    D: rank >= 4,
    E: rank >= 6 && rank <= 8,
    F: rank === 4,
    G: rank === 2,
  })[letter as (typeof CARTAN_LETTERS)[number]] ?? false;

export function cartanTypesUpTo(maxRank: number, extra: readonly (readonly [string, number])[] = []): unknown[] {
  const types: (readonly [string, number])[] = [];
  for (let rank = 1; rank <= maxRank; rank++)
    for (const letter of CARTAN_LETTERS) if (hasType(letter, rank)) types.push([letter, rank]);
  return [...types, ...extra].map(([letter, rank]) => ["Tuple", `'${letter}'`, rank]);
}
