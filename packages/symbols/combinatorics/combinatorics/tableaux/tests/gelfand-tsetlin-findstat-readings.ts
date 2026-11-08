// Independent readings of the Gelfand-Tsetlin-pattern statistics adopted from FindStat, written against the
// triangle as FindStat's Sage code reads it (P[row][column] counted from 0, the longest row first) rather than
// against the expressions. The pattern with no rows has no entries and every reading gives 0.

export type Pattern = readonly (readonly number[])[];

const sum = (a: readonly number[]): number => a.reduce((x, y) => x + y, 0);

/** The entries below the first row that satisfy `test` against the two entries above them (up and left, up and right). */
const belowTheFirstRow = (p: Pattern, test: (entry: number, upLeft: number, upRight: number) => boolean): number =>
  p.slice(1).flatMap((row, i) => row.filter((entry, j) => test(entry, p[i]![j]!, p[i]![j + 1]!))).length;

/** The tiles: the finest partition of the places into sets joined by equal entries at (row + 1, column - 1), (row + 1, column) and their reverses. */
function tiles(p: Pattern): [row: number, column: number][][] {
  const places = p.flatMap((row, i) => row.map((_, j): [number, number] => [i, j]));
  const parent = new Map(places.map((place) => [place.join(","), place.join(",")]));
  const find = (key: string): string => (parent.get(key) === key ? key : find(parent.get(key)!));
  for (const [i, j] of places)
    for (const [k, l] of [
      [i + 1, j - 1],
      [i + 1, j],
    ] as const)
      if (p[k]?.[l] !== undefined && p[i]![j] === p[k]![l]) parent.set(find(`${i},${j}`), find(`${k},${l}`));
  const classes = new Map<string, [number, number][]>();
  for (const place of places) {
    const root = find(place.join(","));
    classes.set(root, [...(classes.get(root) ?? []), place]);
  }
  return [...classes.values()];
}

/** The tiles that meet neither the first row nor the last. */
const freeTiles = (p: Pattern): [number, number][][] =>
  tiles(p).filter((tile) => tile.every(([row]) => row !== 0 && row !== p.length - 1));

export const GELFAND_TSETLIN_READINGS: Record<string, (p: Pattern) => number> = {
  // Circled: equal to the entry up and to the right; boxed: up and to the left.
  CircledEntryCount: (p) => belowTheFirstRow(p, (entry, _left, right) => entry === right),
  BoxedEntryCount: (p) => belowTheFirstRow(p, (entry, left) => entry === left),
  SpecialEntryCount: (p) => belowTheFirstRow(p, (entry, left, right) => left > entry && entry > right),
  BoxedAndCircledEntryCount: (p) => belowTheFirstRow(p, (entry, left, right) => entry === left && entry === right),
  EntrySum: (p) => sum(p.flat()),
  LastRowEntry: (p) => p.at(-1)?.[0] ?? 0,
  TileCount: (p) => tiles(p).length,
  FreeTileCount: (p) => freeTiles(p).length,
  FreeEntryCount: (p) => sum(freeTiles(p).map((tile) => tile.length)),
  FirstRowSum: (p) => sum(p[0] ?? []),
  DistinctEntryCount: (p) => new Set(p.flat()).size,
  NonzeroEntryCount: (p) => p.flat().filter((entry) => entry !== 0).length,
  FirstRowDifference: (p) => (p[0] === undefined ? 0 : p[0][0]! - p[0].at(-1)!),
};
