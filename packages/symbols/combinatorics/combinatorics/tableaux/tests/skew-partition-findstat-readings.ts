// Independent readings of the skew-partition statistics adopted from FindStat, written against the
// cells of the shape (the sets FindStat's Sage code walks) rather than against the expressions.
// A skew partition is [outer, inner], the part lists of λ and μ.

export type Skew = readonly [outer: readonly number[], inner: readonly number[]];
type Cell = readonly [row: number, column: number];

const sum = (a: readonly number[]): number => a.reduce((x, y) => x + y, 0);
const key = ([row, column]: Cell): string => `${row},${column}`;

/** The cells (row, column), counted from 0, of λ/μ. */
const cellsOf = ([outer, inner]: Skew): Cell[] =>
  outer.flatMap((part, row) =>
    Array.from({ length: part - (inner[row] ?? 0) }, (_, k): Cell => [row, (inner[row] ?? 0) + k]),
  );

/** The cells that can be added to a partition: one per distinct part, and one below the last. */
const addable = (p: readonly number[]): Cell[] =>
  Array.from({ length: p.length + 1 }, (_, row): Cell => [row, p[row] ?? 0]).filter(
    ([row]) => row === 0 || p[row - 1]! > (p[row] ?? 0),
  );
/** The cells that can be removed from a partition. */
const removable = (p: readonly number[]): Cell[] =>
  p.flatMap((part, row): Cell[] => (part > (p[row + 1] ?? 0) ? [[row, part - 1]] : []));

const componentCount = (shape: Skew): number => {
  const todo = new Set(cellsOf(shape).map(key));
  let components = 0;
  while (todo.size > 0) {
    components++;
    const stack = [[...todo][0]!];
    todo.delete(stack[0]!);
    while (stack.length > 0) {
      const [row, column] = stack.pop()!.split(",").map(Number) as [number, number];
      for (const next of [
        `${row + 1},${column}`,
        `${row - 1},${column}`,
        `${row},${column + 1}`,
        `${row},${column - 1}`,
      ])
        if (todo.delete(next)) stack.push(next);
    }
  }
  return components;
};

/** The fewest border strips: a strip is a set of cells, one on each of consecutive diagonals, each next to the last, going up or right. */
const fewestStrips = (shape: Skew): number => {
  const memo = new Map<string, number>();
  const search = (left: ReadonlySet<string>): number => {
    if (left.size === 0) return 0;
    const id = [...left].toSorted().join(" ");
    const known = memo.get(id);
    if (known !== undefined) return known;
    const first = [...left].toSorted((a, b) => (a < b ? -1 : 1))[0]!;
    let best = Infinity;
    const grow = (strip: readonly string[]): void => {
      best = Math.min(best, 1 + search(new Set([...left].filter((c) => !strip.includes(c)))));
      const parse = (c: string): [number, number] => c.split(",").map(Number) as [number, number];
      const ends = strip.toSorted((a, b) => parse(a)[1] - parse(a)[0] - (parse(b)[1] - parse(b)[0]));
      const [lowRow, lowColumn] = parse(ends[0]!);
      const [highRow, highColumn] = parse(ends.at(-1)!);
      for (const next of [
        `${highRow - 1},${highColumn}`,
        `${highRow},${highColumn + 1}`,
        `${lowRow + 1},${lowColumn}`,
        `${lowRow},${lowColumn - 1}`,
      ])
        if (left.has(next) && !strip.includes(next)) grow([...strip, next]);
    };
    grow([first]);
    memo.set(id, best);
    return best;
  };
  return search(new Set(cellsOf(shape).map(key)));
};

/** The fillings counted by removing the cell of the largest entry: a removable cell of λ that is not in μ. */
const standardFillings = ([outer, inner]: Skew): number => {
  const count = (current: readonly number[]): number =>
    sum(current) === sum(inner)
      ? 1
      : sum(
          current.map((part, row) =>
            part > (inner[row] ?? 0) && part > (current[row + 1] ?? 0)
              ? count(current.map((p, r) => (r === row ? p - 1 : p)))
              : 0,
          ),
        );
  return count(outer);
};

/** The numbers of placements of k non-attacking rooks, k = 0 .. : rooks go on cells, never two in a row or column. */
const rookNumbers = (shape: Skew): number[] => {
  const cells = cellsOf(shape);
  const numbers: number[] = [];
  const place = (from: number, rows: ReadonlySet<number>, columns: ReadonlySet<number>): void => {
    numbers[rows.size] = (numbers[rows.size] ?? 0) + 1;
    for (let at = from; at < cells.length; at++) {
      const [row, column] = cells[at]!;
      if (!rows.has(row) && !columns.has(column)) place(at + 1, new Set([...rows, row]), new Set([...columns, column]));
    }
  };
  place(0, new Set(), new Set());
  return numbers;
};

export const SKEW_PARTITION_READINGS: Readonly<Record<string, (shape: Skew) => number>> = {
  FirstRowMissingBoxCount: ([, inner]) => inner[0] ?? 0,
  MissingBoxCount: ([, inner]) => sum(inner),
  InnerCornerCount: ([outer, inner]) => addable(inner).filter(([row]) => row < outer.length).length,
  SkewCornerCount: ([outer, inner]) =>
    new Set([...addable(inner).filter(([row]) => row < outer.length), ...removable(outer)].map(key)).size,
  SkewConnectedComponentCount: componentCount,
  TwoByTwoSquareCount: (shape) => {
    const cells = new Set(cellsOf(shape).map(key));
    return cellsOf(shape).filter(([row, column]) =>
      [key([row, column + 1]), key([row + 1, column]), key([row + 1, column + 1])].every((c) => cells.has(c)),
    ).length;
  },
  FrobeniusRank: fewestStrips,
  StandardTableauCount: standardFillings,
  RookPlacementCount: (shape) => sum(rookNumbers(shape)),
  MaximalRookPlacementCount: (shape) => rookNumbers(shape).at(-1)!,
};
