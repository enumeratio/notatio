// Independent readings of the permutation statistics adopted from FindStat, written against
// the definitions in FindStat's words (positions counted from 1) rather than against the
// expressions.
const sum = (a: number[]): number => a.reduce((x, y) => x + y, 0);
const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, k) => from + k);
const descents = (p: number[]): number[] => range(1, p.length - 1).filter((i) => p[i - 1]! > p[i]!);
const ascents = (p: number[]): number[] => range(1, p.length - 1).filter((i) => p[i - 1]! < p[i]!);
/** Peaks of a word, interior positions only. */
const peaksOf = (w: number[]): number =>
  range(2, w.length - 1).filter((i) => w[i - 2]! < w[i - 1]! && w[i - 1]! > w[i]!).length;
const cycles = (p: number[]): number[][] => {
  const seen = new Set<number>();
  const out: number[][] = [];
  for (let start = 1; start <= p.length; start++) {
    if (seen.has(start)) continue;
    const cycle: number[] = [];
    for (let j = start; !seen.has(j); j = p[j - 1]!) {
      seen.add(j);
      cycle.push(j);
    }
    out.push(cycle);
  }
  return out;
};
const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));
const inverse = (p: number[]): number[] => {
  const q = new Array<number>(p.length);
  p.forEach((v, i) => (q[v - 1] = i + 1));
  return q;
};
const indices = (p: number[]): number[] => p.map((_, i) => i);
const pairs = (p: number[]): [number, number][] =>
  indices(p).flatMap((i) =>
    indices(p)
      .filter((j) => j > i)
      .map((j): [number, number] => [i, j]),
  );
const inversionPairs = (p: number[]) => pairs(p).filter(([i, j]) => p[i]! > p[j]!);
const triples = (p: number[]): [number, number, number][] =>
  pairs(p).flatMap(([i, j]) =>
    indices(p)
      .filter((k) => k > j)
      .map((k): [number, number, number] => [p[i]!, p[j]!, p[k]!]),
  );
const before = (p: number[], i: number) => p.slice(0, i);
const after = (p: number[], i: number) => p.slice(i + 1);
const isLeftToRightMaximum = (p: number[], i: number) => before(p, i).every((v) => v < p[i]!);
const isLeftToRightMinimum = (p: number[], i: number) => before(p, i).every((v) => v > p[i]!);
const isRightToLeftMaximum = (p: number[], i: number) => after(p, i).every((v) => v < p[i]!);
const isRightToLeftMinimum = (p: number[], i: number) => after(p, i).every((v) => v > p[i]!);

/** Subsequences of p order-isomorphic to `pattern`, found by comparing every pair of positions. */
const patternOccurrences = (p: number[], pattern: number[]): number => {
  const k = pattern.length;
  const choose = (from: number, left: number): number[][] =>
    left === 0
      ? [[]]
      : range(from, p.length - left).flatMap((i) => choose(i + 1, left - 1).map((rest) => [i, ...rest]));
  return choose(0, k).filter((at) =>
    range(0, k - 1).every((a) => range(0, k - 1).every((b) => p[at[a]!]! < p[at[b]!]! === pattern[a]! < pattern[b]!)),
  ).length;
};

/** Whether the entries of p at the 0-based positions `at` are order-isomorphic to `pattern`. */
const matchesAt = (p: number[], at: number[], pattern: number[]): boolean =>
  at.every((x, a) => at.every((y, b) => p[x]! < p[y]! === pattern[a]! < pattern[b]!));
/** The 0-based increasing position tuples of length k that satisfy `allowed`. */
const tuples = (n: number, k: number, allowed: (at: number[]) => boolean): number[][] => {
  const choose = (from: number, left: number): number[][] =>
    left === 0 ? [[]] : range(from, n - left).flatMap((i) => choose(i + 1, left - 1).map((rest) => [i, ...rest]));
  return choose(0, k).filter(allowed);
};
/** Occurrences of `pattern` at position tuples `allowed` admits (adjacency and fixed-start conditions). */
const vincular = (p: number[], pattern: number[], allowed: (at: number[]) => boolean): number =>
  tuples(p.length, pattern.length, allowed).filter((at) => matchesAt(p, at, pattern)).length;
const adjacentStart = (at: number[]) => at[1] === at[0]! + 1;
const fromFirst = (at: number[]) => at[0] === 0;
const anyOf = (p: number[], patterns: number[][]): number => sum(patterns.map((q) => patternOccurrences(p, q)));

/** Maximal runs of consecutive small ascents (steps i with p(i+1) = p(i) + 1), as 0-based step lists. */
const raftsOf = (p: number[]): number[][] => {
  const rafts: number[][] = [[]];
  for (let i = 0; i < p.length - 1; i++) {
    if (p[i + 1] === p[i]! + 1) rafts[rafts.length - 1]!.push(i);
    else rafts.push([]);
  }
  return rafts.filter((r) => r.length > 0);
};
const raftSteps = (p: number[]): Set<number> => new Set(raftsOf(p).flat());
const consecutiveGaps = (p: number[]): number[] => range(0, p.length - 2).map((i) => Math.abs(p[i]! - p[i + 1]!));

const adjacentEnd = (at: number[]) => at[2] === at[1]! + 1;

/** The smallest d >= 1 at which the entry at 0-based position i meets a greater entry, the ends counting as greater. */
const gapToGreater = (p: number[], i: number): number => {
  const n = p.length;
  const q = [n + 1, ...p, n + 1];
  let d = 1;
  while (!(q[i + 1 - d]! > q[i + 1]! || q[i + 1 + d]! > q[i + 1]!)) d++;
  return d;
};
const longestIncreasing = (p: number[]): number => {
  const best: number[] = [];
  p.forEach((v, i) => (best[i] = 1 + Math.max(0, ...best.slice(0, i).filter((_, k) => p[k]! < v))));
  return Math.max(0, ...best);
};
/** The 1-based pairs (i, j), over every ordered pair of positions, for which `holds(i, j, p(i), p(j))`. */
const orderedPairs = (p: number[], holds: (i: number, j: number, a: number, b: number) => boolean): number =>
  sum(range(1, p.length).map((i) => range(1, p.length).filter((j) => holds(i, j, p[i - 1]!, p[j - 1]!)).length));
const cyclicallyOrdered = (a: number, b: number, c: number, d: number): boolean =>
  (a < b && b < c && c < d) || (b < c && c < d && d < a) || (c < d && d < a && a < b) || (d < a && a < b && b < c);
/** How many distinct positions the pattern's letter number `mark` takes over the occurrences of the pattern. */
const letterPositions = (p: number[], pattern: number[], mark: number): number =>
  new Set(tuples(p.length, pattern.length, (at) => matchesAt(p, at, pattern)).map((at) => at[mark])).size;
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
/** Shareshian and Wachs's admissible inversions: i < j, p(i) > p(j), and p(j) < p(j+1) or a smaller entry between. */
const shareshianWachs = (p: number[]): number =>
  sum(
    range(1, p.length).map(
      (i) =>
        range(i + 1, p.length).filter(
          (j) =>
            p[i - 1]! > p[j - 1]! &&
            ((j < p.length && p[j - 1]! < p[j]!) || range(i + 1, j - 1).some((k) => p[k - 1]! < p[j - 1]!)),
        ).length,
    ),
  );
const isPrime = (m: number): boolean => m >= 2 && range(2, m - 1).every((d) => m % d !== 0);
/** Every subsequence of p, by bit mask over the positions. */
const subsequences = (p: number[]): number[][] =>
  range(0, 2 ** p.length - 1).map((mask) => p.filter((_, i) => (mask >> i) & 1));
const isIncreasing = (s: number[]): boolean => s.every((v, i) => i === 0 || s[i - 1]! < v);
const isArithmetic = (s: number[]): boolean => s.every((v, i) => i < 2 || v - s[i - 1]! === s[1]! - s[0]!);
/** The labels of the leaves of the increasing binary tree: split at the least entry and recurse on both sides. */
const leafLabels = (w: number[]): number[] => {
  if (w.length === 0) return [];
  const root = w.indexOf(Math.min(...w));
  const [left, right] = [w.slice(0, root), w.slice(root + 1)];
  return left.length + right.length === 0 ? [w[root]!] : [...leafLabels(left), ...leafLabels(right)];
};
/** The rows of successive differences, down to the first row that is all zero (or a single entry). */
const differenceRows = (p: number[]): number[][] => {
  const rows = [p];
  for (let last = p; last.some((v) => v !== 0) && last.length > 1;) {
    last = last.slice(1).map((v, i) => v - last[i]!);
    rows.push(last);
  }
  return rows;
};

/** The leaf labels of the binary search tree, by inserting the entries one at a time. */
const searchTreeLeaves = (p: number[]): number[] => {
  type Node = { key: number; left?: Node; right?: Node };
  let root: Node | undefined;
  for (const key of p) {
    if (!root) root = { key };
    else {
      let node = root;
      for (;;) {
        const side = key < node.key ? "left" : "right";
        if (!node[side]) {
          node[side] = { key };
          break;
        }
        node = node[side]!;
      }
    }
  }
  const leaves = (node?: Node): number[] =>
    !node ? [] : !node.left && !node.right ? [node.key] : [...leaves(node.left), ...leaves(node.right)];
  return leaves(root);
};
/** Occurrences of a length-3 pattern with no other entry inside the rectangle of its first and last positions and least and greatest values. */
const boxedOccurrences = (p: number[], pattern: number[]): number =>
  pairs(p)
    .flatMap(([i, j]) => range(j + 1, p.length - 1).map((k): [number, number, number] => [i, j, k]))
    .filter(
      (at) =>
        matchesAt(p, at, pattern) &&
        range(at[0] + 1, at[2] - 1).every(
          (m) =>
            at.includes(m) || p[m]! < Math.min(...at.map((a) => p[a]!)) || p[m]! > Math.max(...at.map((a) => p[a]!)),
        ),
    ).length;

/** The permutation of the entries' ranks: the standardization of a word. */
const standardize = (w: number[]): number[] => w.map((v) => w.filter((u) => u < v).length + 1);
const sameShape = (a: number[], b: number[]): boolean => standardize(a).join() === standardize(b).join();
/** The suffix shifts i (1 <= i < n) at which the first n - i entries match the last n - i in relative order. */
const overlapShifts = (p: number[]): number[] =>
  range(1, p.length - 1).filter((i) => sameShape(p.slice(0, p.length - i), p.slice(i)));
/** The values that stand between neighbors one apart, read from the second to the second-to-last position. */
const verticalSeparators = (p: number[]): number[] =>
  range(1, p.length - 2)
    .filter((i) => Math.abs(p[i - 1]! - p[i + 1]!) === 1)
    .map((i) => p[i]!);
/** The restriction of p to the values at most k, in order. */
const restrictedTo = (p: number[], k: number): number[] => p.filter((v) => v <= k);
/** Every permutation reachable by reversing, complementing and inverting. */
const symmetryClass = (p: number[]): number[][] => {
  const seen = new Map<string, number[]>([[p.join(), p]]);
  for (const todo = [p]; todo.length > 0;) {
    const q = todo.pop()!;
    for (const image of [q.toReversed(), q.map((v) => q.length + 1 - v), inverse(q)])
      if (!seen.has(image.join())) {
        seen.set(image.join(), image);
        todo.push(image);
      }
  }
  return [...seen.values()];
};

/** The 0-based rank of p among the permutations of its size in lexicographic order: the first entry picks a block of (n - 1)! words. */
const lexicographicRankFrom0 = (p: number[]): number =>
  p.length === 0
    ? 0
    : (p[0]! - 1) * factorial(p.length - 1) + lexicographicRankFrom0(p.slice(1).map((v) => (v > p[0]! ? v - 1 : v)));
/** The hook factorization p t1 ... tk, cut from the right: each factor runs from the nearest descent top, scanning left over ascents, to the end of what remains. */
const hookFactorization = (w: number[]): { prefix: number[]; hooks: number[][] } => {
  const hooks: number[][] = [];
  let end = w.length;
  for (;;) {
    let i = end - 1;
    while (i > 0 && w[i - 1]! < w[i]!) i--;
    if (i <= 0) break;
    hooks.unshift(w.slice(i - 1, end));
    end = i - 1;
  }
  return { prefix: w.slice(0, end), hooks };
};
/** The height of the tree built by inserting the entries in turn: each pops the larger ones off the branch from the root 0, then joins it. */
const insertionTreeHeight = (p: number[]): number => {
  const branch = [0];
  let height = 0;
  for (const v of p) {
    while (branch.at(-1)! > v) branch.pop();
    branch.push(v);
    height = Math.max(height, branch.length);
  }
  return p.length === 0 ? 0 : height - 1;
};
/** The permanent of the identity matrix plus the permutation matrix of p, expanded along the rows. */
const permanentOfIdentityPlusPermutation = (p: number[]): number => {
  const entry = (r: number, c: number) => (r === c ? 1 : 0) + (p[r] === c + 1 ? 1 : 0);
  const expand = (row: number, used: number[]): number =>
    row === p.length
      ? 1
      : sum(
          indices(p)
            .filter((c) => !used.includes(c))
            .map((c) => entry(row, c) * expand(row + 1, [...used, c])),
        );
  return expand(0, []);
};
/** FindStat's rix (St000461), by its recursion on the word. */
const rix = (w: number[]): number => {
  if (w.length === 0) return 0;
  const k = w.length;
  const i = w.indexOf(Math.max(...w)) + 1;
  if (i === 1 && k > 1) return 0;
  return i === k ? 1 + rix(w.slice(0, -1)) : rix(w.slice(i));
};
/** FindStat's aix (St000873): split at the leftmost minimum into alpha and beta. */
const aix = (w: number[]): number => {
  if (w.length === 0) return 0;
  const j = w.indexOf(Math.min(...w));
  const alpha = w.slice(0, j);
  const beta = w.slice(j + 1);
  if (alpha.length > 0 && beta.length > 0) return aix(alpha);
  return alpha.length === 0 ? 1 + aix(beta) : 0;
};
/** FindStat's St000724: follow the smaller label from the root of the increasing tree down to a leaf. */
const smallerChildLeaf = (w: number[]): number => {
  if (w.length === 1) return w[0]!;
  const a = Math.min(...w);
  const j = w.indexOf(a);
  const b = Math.min(...w.filter((v) => v !== a));
  return w.indexOf(b) < j ? smallerChildLeaf(w.slice(0, j)) : smallerChildLeaf(w.slice(j + 1));
};
const leastCommonMultiple = (n: number): number => range(1, n).reduce((m, k) => (m * k) / gcd(m, k), 1);

/** Every permutation of 1..n, one-line. */
const allPermutations = (n: number): number[][] =>
  n === 0
    ? [[]]
    : allPermutations(n - 1).flatMap((rest) =>
        range(0, rest.length).map((i) => [...rest.slice(0, i), n, ...rest.slice(i)]),
      );
const sameWord = (a: number[], b: number[]): boolean => a.length === b.length && a.every((v, i) => v === b[i]);
/** The permutations of p's size that `related` ties to p, counted one by one. */
const countAmongAll = (p: number[], related: (q: number[]) => boolean): number =>
  allPermutations(p.length).filter(related).length;
/** u is at most v in Bruhat order when, for each k, the sorted first k entries of u are below those of v entry by entry. */
const bruhatAtMost = (u: number[], v: number[]): boolean =>
  range(1, u.length).every((k) => {
    const a = u.slice(0, k).toSorted((x, y) => x - y);
    const b = v.slice(0, k).toSorted((x, y) => x - y);
    return a.every((value, i) => value <= b[i]!);
  });
const transpositionsBelow = (p: number[]): number =>
  pairs(p).filter(([i, j]) => {
    const t = p.map((_, k) => k + 1);
    [t[i], t[j]] = [t[j]!, t[i]!];
    return bruhatAtMost(t, p);
  }).length;
/** Row insertion of the entries up to the 1, returning the row (from 1) of the cell that 1 creates. */
const rowOfInsertingOne = (p: number[]): number => {
  const rows: number[][] = [];
  let created = 0;
  for (const value of p.slice(0, p.indexOf(1) + 1)) {
    let bumped = value;
    let r = 0;
    for (; ; r++) {
      if (r === rows.length) rows.push([]);
      const row = rows[r]!;
      const at = row.findIndex((v) => v > bumped);
      if (at < 0) {
        row.push(bumped);
        break;
      }
      [row[at], bumped] = [bumped, row[at]!];
    }
    created = r + 1;
  }
  return created;
};
/** The order pattern of a window: each entry's rank within it. */
const windowShape = (w: number[]): string => w.map((v) => w.filter((u) => u < v).length).join(",");
/** The alternating cycles of the breakpoint graph: leave a vertex by its black edge, return along the grey one. */
const breakpointCycles = (p: number[]): number => {
  const word = [0, ...p];
  const n = p.length;
  const black = new Map(word.map((v, i) => [v, word[(i + n) % (n + 1)]!] as const));
  const seen = new Set<number>();
  let found = 0;
  for (let start = 0; start <= n; start++) {
    if (seen.has(start)) continue;
    found++;
    for (let v = start; !seen.has(v); v = (black.get(v)! + 1) % (n + 1)) seen.add(v);
  }
  return found;
};
const majorIndexOf = (w: number[]): number => sum(descents(w));
/** The inversion set by values: pairs a < b with b before a. */
const valueInversions = (w: number[]): Set<string> =>
  new Set(
    pairs(w)
      .filter(([i, j]) => w[i]! > w[j]!)
      .map(([i, j]) => `${w[j]},${w[i]}`),
  );
/** Distance from the identity by star transpositions (1 i), found breadth first. */
const starDistances = new Map<number, Map<string, number>>();
const starDistance = (p: number[]): number => {
  const n = p.length;
  if (!starDistances.has(n)) {
    const distance = new Map<string, number>([[range(1, n).join(), 0]]);
    let frontier = [range(1, n)];
    while (frontier.length > 0) {
      const next: number[][] = [];
      for (const w of frontier)
        for (const i of range(1, n - 1)) {
          const v = [...w];
          [v[0], v[i]] = [v[i]!, v[0]!];
          if (!distance.has(v.join())) {
            distance.set(v.join(), distance.get(w.join())! + 1);
            next.push(v);
          }
        }
      frontier = next;
    }
    starDistances.set(n, distance);
  }
  return starDistances.get(n)!.get(p.join())!;
};
/** The cycles written from their least points in order of those points, as one word. */
const cyclesAsWord = (q: number[]): number[] => cycles(q).flat();
/** The image of q under the Simion-Schmidt map onto 321-avoiders: records stay, the rest are the leftover values in increasing order. */
const simionSchmidtOntoAvoiders = (q: number[]): number[] => {
  const records = q.filter((v, i) => q.slice(0, i).every((u) => u < v));
  const rest = range(1, q.length).filter((v) => !records.includes(v));
  return q.map((v) => (records.includes(v) ? v : rest.shift()!));
};
/** Every subset of 1..n, as an ascending list. */
const subsetsOf = (n: number): number[][] =>
  range(0, 2 ** n - 1).map((mask) => range(1, n).filter((v) => (mask >> (v - 1)) % 2 === 1));
/** FindStat's delta: the elements m of the set whose successor `next(m)` is not in it. */
const edgesOf = (set: number[], next: (m: number) => number): number =>
  set.filter((m) => !set.includes(next(m))).length;
/** The largest gain in edges from a subset to its image under p, never below 0. */
const holeynessOf = (p: number[], next: (m: number) => number): number =>
  Math.max(
    0,
    ...subsetsOf(p.length).map(
      (s) =>
        edgesOf(
          s.map((v) => p[v - 1]!),
          next,
        ) - edgesOf(s, next),
    ),
  );
const isAlternatingSet = (s: number[]): boolean => s.every((v, i) => i === 0 || (v + s[i - 1]!) % 2 === 1);
/** The subwords of p, as lists of entries. */
const subwordsOf = (p: number[]): number[][] => subsetsOf(p.length).map((s) => s.map((i) => p[i - 1]!));
/** Each entry's rank within the word. */
const standardized = (w: number[]): string => w.map((v) => w.filter((u) => u < v).length).join(",");
/** Number of monotone runs of w, as FindStat's St000483 counts them: increasing runs of two or more plus decreasing ones. */
const monotoneRuns = (w: number[]): number => {
  const increasingRuns = (u: number[]): number => {
    let found = 0;
    let longest = 1;
    for (let i = 1; i <= u.length; i++)
      if (i < u.length && u[i]! > u[i - 1]!) longest++;
      else {
        if (longest > 1) found++;
        longest = 1;
      }
    return found;
  };
  return increasingRuns(w) + increasingRuns(w.toReversed());
};
/** One pass of the pop-stack operator: a stack that empties onto the output whenever the next entry exceeds its top. */
const popStackSort = (w: number[]): number[] => {
  const out: number[] = [];
  let stack: number[] = [];
  for (const e of w) {
    if (stack.length > 0 && e > stack.at(-1)!) {
      out.push(...stack.toReversed());
      stack = [];
    }
    stack.push(e);
  }
  return [...out, ...stack.toReversed()];
};
/** The map Phi from the arrow patterns: p's cycles are the stretches opening at each left-to-right maximum. */
const stretchCycleImage = (p: number[]): Map<number, number> => {
  const image = new Map<number, number>();
  let stretch: number[] = [];
  const close = () => stretch.forEach((v, i) => image.set(v, stretch[(i + 1) % stretch.length]!));
  for (const v of p) {
    if (stretch.length > 0 && v > Math.max(...stretch)) {
      close();
      stretch = [];
    }
    stretch.push(v);
  }
  close();
  return image;
};
/** The permutations reachable from p by swapping adjacent entries that differ by `gap`, found by search. */
const swapClassOf = (p: number[], gap: number): number => {
  const seen = new Set([p.join(",")]);
  const todo = [p];
  while (todo.length > 0) {
    const w = todo.pop()!;
    for (const i of range(0, w.length - 2)) {
      if (Math.abs(w[i]! - w[i + 1]!) !== gap) continue;
      const swapped = w.with(i, w[i + 1]!).with(i + 1, w[i]!);
      if (seen.has(swapped.join(","))) continue;
      seen.add(swapped.join(","));
      todo.push(swapped);
    }
  }
  return seen.size;
};
/** One pass of West's stack sorting: pop while the next entry is larger. */
const stackSort = (w: number[]): number[] => {
  const out: number[] = [];
  const stack: number[] = [];
  for (const e of w) {
    while (stack.length > 0 && stack.at(-1)! < e) out.push(stack.pop()!);
    stack.push(e);
  }
  return [...out, ...stack.toReversed()];
};
/** The row lengths of the Robinson-Schensted tableau, by row insertion. */
const insertionShapeOf = (p: number[]): number[] => {
  const rows: number[][] = [];
  for (const entry of p) {
    let e = entry;
    for (let r = 0; ; r++) {
      if (r === rows.length) {
        rows.push([e]);
        break;
      }
      const row = rows[r]!;
      const j = row.findIndex((v) => v > e);
      if (j < 0) {
        row.push(e);
        break;
      }
      [row[j], e] = [e, row[j]!];
    }
  }
  return rows.map((row) => row.length);
};
/** The parking functions of n cars, as the spot each car takes and its preference word, found by letting the cars park. */
const parkingFunctionsCache = new Map<number, { spots: number[]; word: number[] }[]>();
const parkingFunctionsOf = (n: number): { spots: number[]; word: number[] }[] => {
  if (parkingFunctionsCache.has(n)) return parkingFunctionsCache.get(n)!;
  const found: { spots: number[]; word: number[] }[] = [];
  const walk = (word: number[], taken: boolean[], spots: number[]): void => {
    if (word.length === n) {
      found.push({ spots, word });
      return;
    }
    for (const want of range(1, n)) {
      const spot = range(want, n).find((s) => !taken[s]);
      if (spot === undefined) continue;
      walk([...word, want], taken.with(spot, true), [...spots, spot]);
    }
  };
  walk([], new Array<boolean>(n + 1).fill(false), []);
  parkingFunctionsCache.set(n, found);
  return found;
};
/** The standardization of a word: positions ranked by value, equal values left to right. */
const standardPermutation = (w: number[]): number[] => {
  const order = range(0, w.length - 1).toSorted((i, j) => w[i]! - w[j]! || i - j);
  const rank = new Array<number>(w.length);
  order.forEach((i, r) => (rank[i] = r + 1));
  return rank;
};
/** The shortest-path counts from the identity in the graph that swaps the first entry with another, by search outward. */
const starFactorizationCache = new Map<number, Map<string, number>>();
const starFactorizationsOf = (n: number): Map<string, number> => {
  if (starFactorizationCache.has(n)) return starFactorizationCache.get(n)!;
  const identity = range(1, n);
  const distance = new Map<string, number>([[identity.join(","), 0]]);
  const paths = new Map<string, number>([[identity.join(","), 1]]);
  let frontier = [identity];
  while (frontier.length > 0) {
    const next = new Map<string, number[]>();
    for (const w of frontier)
      for (const a of range(1, n - 1)) {
        const moved = w.with(0, w[a]!).with(a, w[0]!);
        const key = moved.join(",");
        const known = distance.get(key);
        const level = distance.get(w.join(","))! + 1;
        if (known !== undefined && known < level) continue;
        distance.set(key, level);
        paths.set(key, (known === undefined ? 0 : paths.get(key)!) + paths.get(w.join(","))!);
        next.set(key, moved);
      }
    frontier = [...next.values()];
  }
  starFactorizationCache.set(n, paths);
  return paths;
};
/** The ascending runs of p: maximal stretches of consecutive increases. */
const ascendingRuns = (p: number[]): number[][] => {
  const runs: number[][] = [];
  for (const v of p) {
    if (runs.length > 0 && runs.at(-1)!.at(-1)! < v) runs.at(-1)!.push(v);
    else runs.push([v]);
  }
  return runs;
};
/** Every ordering of the items. */
const orderings = <T>(items: T[]): T[][] =>
  items.length === 0
    ? [[]]
    : items.flatMap((item, i) =>
        orderings([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]),
      );
/** The labels' components when each i is joined to p(i) and chords that cross (ends strictly interleaved) are joined. */
const chordComponents = (p: number[]): number => {
  const parent = range(0, p.length);
  const find = (v: number): number => (parent[v] === v ? v : (parent[v] = find(parent[v]!)));
  const join = (a: number, b: number): void => void (parent[find(a)] = find(b));
  p.forEach((v, i) => join(i + 1, v));
  const chords = p.map((v, i): [number, number] => [Math.min(i + 1, v), Math.max(i + 1, v)]);
  for (const [a, b] of chords) for (const [c, d] of chords) if (a < c && c < b && b < d) join(a, c);
  return new Set(range(1, p.length).map(find)).size;
};
/** The size of the largest pair of disjoint subsequences of equal size that `alike` calls alike. */
const largestTwins = (p: number[], alike: (a: number[], b: number[]) => boolean): number => {
  let best = 0;
  const n = p.length;
  for (let first = 0; first < 2 ** n; first++)
    for (let second = first + 1; second < 2 ** n; second++) {
      if ((first & second) !== 0) continue;
      const a = range(0, n - 1)
        .filter((i) => (first >> i) % 2 === 1)
        .map((i) => p[i]!);
      const b = range(0, n - 1)
        .filter((i) => (second >> i) % 2 === 1)
        .map((i) => p[i]!);
      if (a.length === b.length && a.length > best && alike(a, b)) best = a.length;
    }
  return best;
};
export const FINDSTAT_READINGS: Record<string, (p: number[]) => number> = {
  LeftOuterPeaks: (p) => peaksOf([0, ...p]),
  RightOuterPeaks: (p) => peaksOf([...p, 0]),
  OuterPeaks: (p) => peaksOf([0, ...p, 0]),
  DoubleAscents: (p) => range(0, p.length - 3).filter((i) => p[i]! < p[i + 1]! && p[i + 1]! < p[i + 2]!).length,
  DoubleDescents: (p) => range(0, p.length - 3).filter((i) => p[i]! > p[i + 1]! && p[i + 1]! > p[i + 2]!).length,
  IsolatedDescents: (p) => {
    const d = new Set(descents(p));
    return [...d].filter((i) => !d.has(i - 1) && !d.has(i + 1)).length;
  },
  BigAscents: (p) => range(0, p.length - 2).filter((i) => p[i + 1]! - p[i]! > 1).length,
  BigDescents: (p) => range(0, p.length - 2).filter((i) => p[i]! - p[i + 1]! > 1).length,
  DescentTopSum: (p) => sum(descents(p).map((i) => p[i - 1]!)),
  DescentBottomSum: (p) => sum(descents(p).map((i) => p[i]!)),
  AscentTopSum: (p) => sum(ascents(p).map((i) => p[i]!)),
  AscentBottomSum: (p) => sum(ascents(p).map((i) => p[i - 1]!)),
  ComajorIndex: (p) => sum(descents(p).map((i) => p.length - i)),
  NontrivialCycles: (p) => cycles(p).filter((c) => c.length > 1).length,
  ShortestCycleLength: (p) => (p.length === 0 ? 0 : Math.min(...cycles(p).map((c) => c.length))),
  ConjugacyClassSize: (p) => {
    const multiplicity = new Map<number, number>();
    for (const c of cycles(p)) multiplicity.set(c.length, (multiplicity.get(c.length) ?? 0) + 1);
    let centralizer = 1;
    for (const [size, times] of multiplicity) centralizer *= size ** times * factorial(times);
    return factorial(p.length) / centralizer;
  },
  WeakAntiexcedances: (p) => range(1, p.length).filter((i) => p[i - 1]! <= i).length,
  OccurrencesOf321: (p) => triples(p).filter(([a, b, c]) => a > b && b > c).length,
  OccurrencesOf312: (p) => triples(p).filter(([a, b, c]) => b < c && c < a).length,
  OccurrencesOf231: (p) => triples(p).filter(([a, b, c]) => c < a && a < b).length,
  NonLeftToRightMaxima: (p) => indices(p).filter((i) => !isLeftToRightMaximum(p, i)).length,
  ExclusiveLeftToRightMaxima: (p) =>
    indices(p).filter((i) => isLeftToRightMaximum(p, i) && !isRightToLeftMinimum(p, i)).length,
  ExclusiveRightToLeftMinima: (p) =>
    indices(p).filter((i) => isRightToLeftMinimum(p, i) && !isLeftToRightMaximum(p, i)).length,
  NonRecords: (p) =>
    indices(p).filter(
      (i) =>
        !isLeftToRightMaximum(p, i) &&
        !isLeftToRightMinimum(p, i) &&
        !isRightToLeftMaximum(p, i) &&
        !isRightToLeftMinimum(p, i),
    ).length,
  NonInversions: (p) => pairs(p).filter(([i, j]) => p[i]! < p[j]!).length,
  InversionSum: (p) => sum(inversionPairs(p).map(([i, j]) => j - i)),
  EvenInversions: (p) => inversionPairs(p).filter(([i, j]) => (j - i) % 2 === 0).length,
  OddInversions: (p) => inversionPairs(p).filter(([i, j]) => (j - i) % 2 === 1).length,
  InverseMajorIndex: (p) => sum(descents(inverse(p))),

  // The second batch.
  FirstEntry: (p) => p[0] ?? 0,
  LastEntry: (p) => p[p.length - 1] ?? 0,
  Successions: (p) => indices(p).filter((i) => p[i + 1] === p[i]! + 1).length,
  Adjacencies: (p) => indices(p).filter((i) => p[i + 1] === p[i]! - 1).length,
  TwoRises: (p) => indices(p).filter((i) => p[i + 1] === p[i]! + 2).length,
  MaximalRiseSize: (p) => Math.max(0, ...indices(p).flatMap((i) => (i + 1 < p.length ? [p[i + 1]! - p[i]!] : []))),
  BigAscentsAfterPrependingZero: (p) => {
    const q = [0, ...p];
    return indices(q).filter((i) => i + 1 < q.length && q[i + 1]! - q[i]! > 1).length;
  },
  VeryBigAscents: (p) => indices(p).filter((i) => i + 1 < p.length && p[i + 1]! - p[i]! > 2).length,
  VeryBigDescents: (p) => indices(p).filter((i) => i + 1 < p.length && p[i]! - p[i + 1]! > 2).length,
  SmallExcedances: (p) => range(1, p.length).filter((i) => p[i - 1] === i + 1).length,
  TwoExcedances: (p) => range(1, p.length).filter((i) => p[i - 1] === i + 2).length,
  BigExcedances: (p) => range(1, p.length).filter((i) => p[i - 1]! - i > 1).length,
  DoubleExcedances: (p) => range(1, p.length).filter((i) => i < p[i - 1]! && p[i - 1]! < p[p[i - 1]! - 1]!).length,
  DoubleDeficiencies: (p) => range(1, p.length).filter((i) => i > p[i - 1]! && p[i - 1]! > p[p[i - 1]! - 1]!).length,
  NestedExcedances: (p) => pairs(p).filter(([a, b]) => a + 1 < b + 1 && b + 1 < p[b]! && p[b]! < p[a]!).length,
  PureExcedances: (p) =>
    range(1, p.length).filter((i) => p[i - 1]! > i && !before(p, i).some((v) => i <= v && v < p[i - 1]!)).length,
  GlobalAscents: (p) =>
    range(1, p.length - 1).filter((i) =>
      range(1, i).every((j) => range(i + 1, p.length).every((k) => p[j - 1]! < p[k - 1]!)),
    ).length,
  GlobalDescents: (p) =>
    range(1, p.length - 1).filter((i) =>
      range(1, i).every((j) => range(i + 1, p.length).every((k) => p[j - 1]! > p[k - 1]!)),
    ).length,
  DecompositionNumber: (p) =>
    range(1, p.length).filter((k) =>
      p
        .slice(0, k)
        .toSorted((a, b) => a - b)
        .every((v, i) => v === i + 1),
    ).length,
  CyclesOfLengthAtLeastThree: (p) => cycles(p).filter((c) => c.length >= 3).length,
  InversionsOfDistanceAtMostTwo: (p) => inversionPairs(p).filter(([i, j]) => j - i <= 2).length,
  NonInversionSum: (p) =>
    sum(
      pairs(p)
        .filter(([i, j]) => p[i]! < p[j]!)
        .map(([i, j]) => j - i),
    ),
  TotalDisplacement: (p) => sum(p.map((v, i) => Math.abs(v - (i + 1)))),
  DescentDifferenceSum: (p) => sum(descents(p).map((i) => p[i - 1]! - p[i]!)),
  ShiftedMajorIndex: (p) => sum(range(1, p.length - 1).filter((i) => p[i - 1]! - p[i]! >= 2)),
  Recoils: (p) => {
    const q = inverse(p);
    return descents(q).length;
  },
  DescentsOrRecoils: (p) => new Set([...descents(p), ...descents(inverse(p))]).size,
  LeftToRightMaximaPositionSum: (p) =>
    sum(
      indices(p)
        .filter((i) => isLeftToRightMaximum(p, i))
        .map((i) => i + 1),
    ),
  ArithmeticProgressionsOfLengthTwo: (p) => triples(p).filter(([a, b, c]) => c - b === b - a).length,
  OccurrencesOf1324: (p) => patternOccurrences(p, [1, 3, 2, 4]),
  OccurrencesOf2143: (p) => patternOccurrences(p, [2, 1, 4, 3]),
  OccurrencesOf4231: (p) => patternOccurrences(p, [4, 2, 3, 1]),
  OccurrencesOf2413: (p) => patternOccurrences(p, [2, 4, 1, 3]),
  OccurrencesOf1432: (p) => patternOccurrences(p, [1, 4, 3, 2]),

  // The third batch.
  OccurrencesOf21Dash3: (p) => vincular(p, [2, 1, 3], adjacentStart),
  OccurrencesOf13Dash2: (p) => vincular(p, [1, 3, 2], adjacentStart),
  OccurrencesOf12Dash3: (p) => vincular(p, [1, 2, 3], adjacentStart),
  OccurrencesOf31Dash2: (p) => vincular(p, [3, 1, 2], adjacentStart),
  OccurrencesOf23Dash1: (p) => vincular(p, [2, 3, 1], adjacentStart),
  OccurrencesOf32Dash1: (p) => vincular(p, [3, 2, 1], adjacentStart),
  OccurrencesOfInitial213: (p) => vincular(p, [2, 1, 3], fromFirst),
  OccurrencesOfInitial231: (p) => vincular(p, [2, 3, 1], fromFirst),
  OccurrencesOfInitial312: (p) => vincular(p, [3, 1, 2], fromFirst),
  OccurrencesOfInitial321: (p) => vincular(p, [3, 2, 1], fromFirst),
  OccurrencesOfInitial132: (p) => vincular(p, [1, 3, 2], fromFirst),
  OccurrencesOfInitial123: (p) => vincular(p, [1, 2, 3], fromFirst),
  OccurrencesOfInitial12Dash3: (p) => vincular(p, [1, 2, 3], (at) => at[0] === 0 && at[1] === 1),
  OccurrencesOfInitial2Dash13: (p) => vincular(p, [2, 1, 3], (at) => fromFirst(at) && at[2] === at[1]! + 1),
  OccurrencesOfInitial1Dash23: (p) => vincular(p, [1, 2, 3], (at) => fromFirst(at) && at[2] === at[1]! + 1),
  OccurrencesOfConsecutive132: (p) => vincular(p, [1, 3, 2], (at) => at[1] === at[0]! + 1 && at[2] === at[1]! + 1),
  OccurrencesOf3241: (p) => patternOccurrences(p, [3, 2, 4, 1]),
  OccurrencesOf4213: (p) => patternOccurrences(p, [4, 2, 1, 3]),
  OccurrencesOf123Or132: (p) =>
    anyOf(p, [
      [1, 2, 3],
      [1, 3, 2],
    ]),
  OccurrencesOf213Or321: (p) =>
    anyOf(p, [
      [2, 1, 3],
      [3, 2, 1],
    ]),
  OccurrencesOf132Or321: (p) =>
    anyOf(p, [
      [1, 3, 2],
      [3, 2, 1],
    ]),
  OccurrencesOf132Or213Or321: (p) =>
    anyOf(p, [
      [1, 3, 2],
      [2, 1, 3],
      [3, 2, 1],
    ]),
  OccurrencesOf3241Or4231: (p) =>
    anyOf(p, [
      [3, 2, 4, 1],
      [4, 2, 3, 1],
    ]),
  OccurrencesOf4132Or4231: (p) =>
    anyOf(p, [
      [4, 1, 3, 2],
      [4, 2, 3, 1],
    ]),
  OccurrencesOf3412Or4231: (p) =>
    anyOf(p, [
      [3, 4, 1, 2],
      [4, 2, 3, 1],
    ]),
  OccurrencesOf2143Or4213: (p) =>
    anyOf(p, [
      [2, 1, 4, 3],
      [4, 2, 1, 3],
    ]),
  // FindStat's cyclic successor of i is i mod n + 1.
  SmallWeakExcedances: (p) => range(1, p.length).filter((i) => [i, i + 1].includes(p[i - 1]!)).length,
  NonSmallExcedances: (p) => range(1, p.length).filter((i) => p[i - 1] !== i + 1).length,
  NonSmallWeakExcedances: (p) => range(1, p.length).filter((i) => ![i, i + 1].includes(p[i - 1]!)).length,
  CyclicSmallExcedances: (p) => range(1, p.length).filter((i) => p[i - 1] === (i % p.length) + 1).length,
  CyclicSmallWeakExcedances: (p) =>
    range(1, p.length).filter((i) => [i, (i % p.length) + 1].includes(p[i - 1]!)).length,
  NonCyclicSmallExcedances: (p) => range(1, p.length).filter((i) => p[i - 1] !== (i % p.length) + 1).length,
  NonCyclicSmallWeakExcedances: (p) =>
    range(1, p.length).filter((i) => ![i, (i % p.length) + 1].includes(p[i - 1]!)).length,

  // The fourth batch.
  OccurrencesOf132Or231: (p) =>
    anyOf(p, [
      [1, 3, 2],
      [2, 3, 1],
    ]),
  OccurrencesOf132Or213: (p) =>
    anyOf(p, [
      [1, 3, 2],
      [2, 1, 3],
    ]),
  OccurrencesOf132Or312: (p) =>
    anyOf(p, [
      [1, 3, 2],
      [3, 1, 2],
    ]),
  OccurrencesOf123Or231: (p) =>
    anyOf(p, [
      [1, 2, 3],
      [2, 3, 1],
    ]),
  OccurrencesOf123Or213: (p) =>
    anyOf(p, [
      [1, 2, 3],
      [2, 1, 3],
    ]),
  OccurrencesOf123Or321: (p) =>
    anyOf(p, [
      [1, 2, 3],
      [3, 2, 1],
    ]),
  OccurrencesOf123Or312: (p) =>
    anyOf(p, [
      [1, 2, 3],
      [3, 1, 2],
    ]),
  OccurrencesOf231Or312: (p) =>
    anyOf(p, [
      [2, 3, 1],
      [3, 1, 2],
    ]),
  OccurrencesOf213Or312: (p) =>
    anyOf(p, [
      [2, 1, 3],
      [3, 1, 2],
    ]),
  OccurrencesOf213Or231: (p) =>
    anyOf(p, [
      [2, 1, 3],
      [2, 3, 1],
    ]),
  OccurrencesOf231Or321: (p) =>
    anyOf(p, [
      [2, 3, 1],
      [3, 2, 1],
    ]),
  OccurrencesOf312Or321: (p) =>
    anyOf(p, [
      [3, 1, 2],
      [3, 2, 1],
    ]),
  OccurrencesOf321Or3412: (p) => anyOf(p, [[3, 2, 1]]) + anyOf(p, [[3, 4, 1, 2]]),
  OccurrencesOf52341: (p) => patternOccurrences(p, [5, 2, 3, 4, 1]),
  OccurrencesOf41352Or42351Or51342Or52341: (p) =>
    anyOf(p, [
      [4, 1, 3, 5, 2],
      [4, 2, 3, 5, 1],
      [5, 1, 3, 4, 2],
      [5, 2, 3, 4, 1],
    ]),
  ThreeExcedances: (p) => range(1, p.length).filter((i) => p[i - 1] === i + 3).length,
  ThreeRises: (p) => ascents(p).filter((i) => p[i] === p[i - 1]! + 3).length,
  BigDeficiencies: (p) => range(1, p.length).filter((i) => i - p[i - 1]! > 1).length,
  DescentsOfDistanceTwo: (p) => range(1, p.length - 2).filter((i) => p[i - 1]! > p[i + 1]!).length,
  AscentsOfDistanceTwo: (p) => range(1, p.length - 2).filter((i) => p[i - 1]! < p[i + 1]!).length,
  DoubleSuccessions: (p) =>
    range(1, p.length - 2).filter((i) => p[i] === p[i - 1]! + 1 && p[i + 1] === p[i - 1]! + 2).length,
  DescentsPlusRecoils: (p) => descents(p).length + descents(inverse(p)).length,
  DescentsAndRecoils: (p) => descents(p).filter((i) => descents(inverse(p)).includes(i)).length,
  OddDescents: (p) => descents(p).filter((i) => i % 2 === 1).length,
  EvenDescents: (p) => descents(p).filter((i) => i % 2 === 0).length,
  // FindStat's loop: walk back from the end while the entries rise, with n + 1 prepended.
  FinalRises: (p) => {
    const n = p.length;
    const w = [n + 1, ...p];
    let rise = 0;
    while (w[n - 1 - rise]! < w[n - rise]!) rise++;
    return rise;
  },
  MidPointsOfOccurrencesOf321: (p) =>
    indices(p).filter((j) => before(p, j).some((v) => v > p[j]!) && after(p, j).some((v) => v < p[j]!)).length,
  MidPointsOfOccurrencesOf123: (p) =>
    indices(p).filter((j) => before(p, j).some((v) => v < p[j]!) && after(p, j).some((v) => v > p[j]!)).length,
  LeftToRightMaximaOrRightToLeftMinima: (p) =>
    indices(p).filter((i) => isLeftToRightMaximum(p, i) || isRightToLeftMinimum(p, i)).length,
  MajorIndexMinusInversions: (p) => sum(descents(p)) - inversionPairs(p).length,
  InversionsPlusMajorIndex: (p) => sum(descents(p)) + inversionPairs(p).length,
  MajorIndexMinusExcedances: (p) => sum(descents(p)) - range(1, p.length).filter((i) => p[i - 1]! > i).length,
  MaximalDisplacement: (p) => Math.max(0, ...range(1, p.length).map((i) => Math.abs(p[i - 1]! - i))),

  // The fifth batch, each written the way FindStat's code reads it.
  ValleysIncludingBoundary: (p) => {
    const w = [p.length + 1, ...p, p.length + 1];
    return range(1, p.length).filter((i) => w[i - 1]! > w[i]! && w[i]! < w[i + 1]!).length;
  },
  MaximalExcedance: (p) => Math.max(0, ...p.map((v, i) => v - i - 1)),
  AdjacentCycles: (p) => cycles(p).filter((c) => c.every((v, k) => v === c[0]! + k)).length,
  StrongFixedPoints: (p) =>
    indices(p).filter((i) => before(p, i).every((v) => v < p[i]!) && after(p, i).every((v) => v > p[i]!)).length,
  SortingIndex: (p) => {
    const sort = (q: number[]): number => {
      const n = q.length;
      if (n === 0) return 0;
      const x = q.indexOf(n) + 1;
      if (x === n) return sort(q.slice(0, n - 1));
      const swapped = [...q];
      [swapped[x - 1], swapped[n - 1]] = [swapped[n - 1]!, swapped[x - 1]!];
      return n - x + sort(swapped.slice(0, n - 1));
    };
    return sort(p);
  },
  Load: (p) => sum(descents(inverse(p).toReversed())),
  CycleDescents: (p) => sum(cycles(p).map((c) => range(0, c.length - 2).filter((a) => c[a]! > c[a + 1]!).length)),
  DescentsAfterZeroingFixedPoints: (p) => descents(p.map((v, i) => (v === i + 1 ? 0 : v))).length,
  MajorIndexAfterZeroingFixedPoints: (p) => sum(descents(p.map((v, i) => (v === i + 1 ? 0 : v)))),
  ElizaldePakRank: (p) => {
    let k = 0;
    while (range(1, k).every((i) => p[i - 1]! > k)) k++;
    return k - 1;
  },
  Disorder: (p) => {
    let i = 1;
    let pos = 0;
    let count = 0;
    while (i < p.length) {
      if (p[pos] === i) i++;
      else if (p[pos]! > i) count++;
      pos = (pos + 1) % p.length;
    }
    return count;
  },
  CyclesOfLengthAtMostTwo: (p) => cycles(p).filter((c) => c.length <= 2).length,
  CyclesOfLengthAtMostThree: (p) => cycles(p).filter((c) => c.length <= 3).length,
  InversionsOfDistanceAtMostThree: (p) => inversionPairs(p).filter(([i, j]) => j - i <= 3).length,
  FirstDirectSummandSize: (p) => {
    if (p.length === 0) return 0;
    let k = 1;
    while (
      !p
        .slice(0, k)
        .toSorted((a, b) => a - b)
        .every((v, i) => v === i + 1)
    )
      k++;
    return k;
  },
  LargestDirectSummandSize: (p) => {
    let start = 0;
    let best = 0;
    const seen: number[] = [];
    for (const v of p) {
      seen.push(v);
      if (Math.max(...seen) === seen.length) {
        best = Math.max(best, seen.length - start);
        start = seen.length;
      }
    }
    return best;
  },
  StretchingPairs: (p) => pairs(p).filter(([i, j]) => p[i]! < i + 1 && j + 1 < p[j]! && i < j).length,
  InversionIndex: (p) => sum(inversionPairs(p).map(([i]) => p[i]!)),
  TotalSquaredDisplacement: (p) => sum(p.map((v, i) => (v - i - 1) ** 2)),
  LeftToRightMaximaXorRightToLeftMinima: (p) => {
    const lrmax = new Set(indices(p).filter((i) => isLeftToRightMaximum(p, i)));
    const rlmin = new Set(indices(p).filter((i) => isRightToLeftMinimum(p, i)));
    return [...lrmax].filter((i) => !rlmin.has(i)).length + [...rlmin].filter((i) => !lrmax.has(i)).length;
  },
  MaximalSuccessiveDifference: (p) =>
    p.length < 2 ? 0 : Math.max(...range(0, p.length - 2).map((i) => p[i + 1]! - p[i]!)),
  MajorIndexPlusInverseMajorIndex: (p) => sum(descents(p)) + sum(descents(inverse(p))),
  Tier: (p) => new Set(triples(p).flatMap(([a, b, c]) => (c < a && a < b && a === c + 1 ? [a] : []))).size,
  Rafts: (p) => {
    const rafts: number[][] = [[]];
    for (let i = 0; i < p.length - 1; i++) {
      if (p[i + 1] === p[i]! + 1) rafts[rafts.length - 1]!.push(i);
      else rafts.push([]);
    }
    return rafts.filter((r) => r.length > 0).length;
  },
  WeakExcedanceMidPointsOfOccurrencesOf321: (p) =>
    indices(p).filter(
      (j) => p[j]! >= j + 1 && before(p, j).some((v) => v > p[j]!) && after(p, j).some((v) => v < p[j]!),
    ).length,
  NonWeakExcedanceMidPointsOfOccurrencesOf321: (p) =>
    indices(p).filter((j) => p[j]! < j + 1 && before(p, j).some((v) => v > p[j]!) && after(p, j).some((v) => v < p[j]!))
      .length,
  TwoShiftedMajorIndex: (p) => sum(range(1, p.length - 1).filter((i) => p[i - 1]! - p[i]! > 2)),
  ThreeShiftedMajorIndex: (p) => sum(range(1, p.length - 1).filter((i) => p[i - 1]! - p[i]! > 3)),
  PinnacleSum: (p) =>
    sum(
      range(1, p.length - 2)
        .filter((i) => p[i - 1]! < p[i]! && p[i]! > p[i + 1]!)
        .map((i) => p[i]!),
    ),
  AugmentedDoubleAscents: (p) => {
    const q = [0, ...p];
    return range(0, q.length - 3).filter((i) => q[i]! < q[i + 1]! && q[i + 1]! < q[i + 2]!).length;
  },

  // Batch 5.
  AlternatingRuns: (p) => peaksOf(p) + peaksOf(p.map((v) => p.length + 1 - v)),
  UpDownRuns: (p) => {
    if (p.length === 0) return 0;
    const switches = peaksOf(p) + peaksOf(p.map((v) => p.length + 1 - v));
    return p.length > 1 && p[0]! > p[1]! ? switches + 2 : switches + 1;
  },
  NonInitialLeftToRightMinima: (p) =>
    range(2, p.length).filter((j) => p.slice(0, j - 1).every((v) => v > p[j - 1]!)).length,
  RightFloats: (p) => {
    const r = raftSteps(p);
    return range(0, p.length - 2).filter((i) => p[i + 1]! > p[i]! + 1 && !r.has(i - 1) && !r.has(i + 1)).length;
  },
  RightRopes: (p) => {
    const lasts = raftsOf(p).map((r) => r[r.length - 1]!);
    return lasts.filter((last) => last < p.length - 2 && p[last + 1]! < p[last + 2]!).length;
  },
  RightTethers: (p) => {
    const rafts = raftsOf(p);
    return range(0, rafts.length - 2).filter(
      (i) =>
        rafts[i]![rafts[i]!.length - 1]! + 2 === rafts[i + 1]![0]! &&
        p[rafts[i]![rafts[i]!.length - 1]! + 1]! < p[rafts[i + 1]![0]!]!,
    ).length;
  },
  MinimalJump: (p) => (p.length < 2 ? 0 : Math.min(...consecutiveGaps(p))),
  MaximalJump: (p) => (p.length < 2 ? 0 : Math.max(...consecutiveGaps(p))),
  CyclicMaximalJump: (p) => (p.length === 0 ? 0 : Math.max(...consecutiveGaps([...p, p[0]!]))),
  NeighboringNumber: (p) => (p.length < 2 ? 0 : Math.min(...consecutiveGaps(p), Math.abs(p[0]! - p[p.length - 1]!))),
  DistinctDiagonalSums: (p) =>
    new Set(range(1 - p.length, p.length - 1).map((k) => p.filter((v, i) => v - i - 1 === k).length)).size,
  MaximalDiagonalOccupancy: (p) =>
    p.length === 0
      ? 0
      : Math.max(...range(1 - p.length, p.length - 1).map((k) => p.filter((v, i) => v - i - 1 === k).length)),
  DescentsOfDistanceThree: (p) => range(0, p.length - 4).filter((i) => p[i]! > p[i + 3]!).length,
  RepeatedLehmerCodeEntries: (p) => {
    const code = p.map((v, i) => p.slice(i + 1).filter((w) => w < v).length);
    return p.length - new Set(code).size;
  },
  AdjacenciesWithZeroAppended: (p) => range(0, p.length - 1).filter((i) => p[i]! === (p[i + 1] ?? 0) + 1).length,
  SmallestFixedPoint: (p) => [...p, p.length + 1].findIndex((v, i) => v === i + 1) + 1,
  LargestWeakExcedancePosition: (p) => Math.max(0, ...range(1, p.length).filter((i) => p[i - 1]! >= i)),
  FixedPointsBeforeLargestMovedPoint: (p) => {
    const moved = range(1, p.length).filter((i) => p[i - 1]! !== i);
    return moved.length === 0 ? 0 : range(1, Math.max(...moved)).filter((i) => p[i - 1]! === i).length;
  },
  AscentTopsWithSmallerValuesBefore: (p) =>
    range(0, p.length - 2).filter(
      (i) => p[i]! < p[i + 1]! && range(1, p[i + 1]! - 1).every((v) => p.slice(0, i + 1).includes(v)),
    ).length,
  DescentsOfTypeTwo: (p) =>
    range(0, p.length - 2).filter((i) => p[i]! > p[i + 1]! && p.slice(0, i).every((v) => v < p[i]!)).length,
  LongestSuccessionRun: (p) => {
    let best = 0;
    let run = 0;
    p.forEach((v, i) => {
      run = i > 0 && v === p[i - 1]! + 1 ? run + 1 : 1;
      best = Math.max(best, run);
    });
    return best;
  },
  MaximalModularDisplacement: (p) => {
    const n = p.length;
    const mod = (a: number) => ((a % n) + n) % n;
    return n === 0 ? 0 : Math.max(...p.map((e, i) => Math.min(mod(e - 1 - i), mod(i - e + 1))));
  },
  AdjacentTranspositions: (p) =>
    cycles(p).filter((c) => c.length === 2 && Math.max(...c) - Math.min(...c) === 1).length,
  CyclicallyAdjacentTranspositions: (p) =>
    cycles(p).filter((c) => c.length === 2 && [1, p.length - 1].includes(Math.max(...c) - Math.min(...c))).length,
  Bonds: (p) => range(0, p.length - 2).filter((i) => Math.abs(p[i]! - p[i + 1]!) === 1).length,
  CyclicBonds: (p) => (p.length === 0 ? 0 : p.filter((v, i) => Math.abs(v - p[(i + 1) % p.length]!) === 1).length),
  Crossings: (p) =>
    sum(
      range(1, p.length).map(
        (i) =>
          range(1, p.length).filter((j) => {
            const a = p[i - 1]!;
            const b = p[j - 1]!;
            return (i < j && j <= a && a < b) || (a < b && b < i && i < j);
          }).length,
      ),
    ),
  Nestings: (p) =>
    sum(
      range(1, p.length).map(
        (i) =>
          range(1, p.length).filter((j) => {
            const a = p[i - 1]!;
            const b = p[j - 1]!;
            return (j < i && i < a && a < b) || (b < a && a <= i && i < j);
          }).length,
      ),
    ),
  Alignments: (p) =>
    sum(
      range(1, p.length).map(
        (i) =>
          range(1, p.length).filter((j) => {
            const a = p[i - 1]!;
            const b = p[j - 1]!;
            return (
              (j < i && i < a && a < b) ||
              (b < a && a <= i && i < j) ||
              (j <= b && b < a && a < i) ||
              (a < i && i < j && j <= b)
            );
          }).length,
      ),
    ),
  CyclicValleys: (p) => {
    const n = p.length;
    return n === 0 ? 0 : range(0, n - 1).filter((i) => p[(i + n - 1) % n]! > p[i]! && p[i]! < p[(i + 1) % n]!).length;
  },
  CyclePeaks: (p) => {
    const q = inverse(p);
    return range(1, p.length).filter((i) => q[i - 1]! < i && i > p[i - 1]!).length;
  },
  NonOverlappingDescents: (p) => {
    let i = 0;
    let c = 0;
    while (i < p.length - 1) {
      if (p[i]! > p[i + 1]!) {
        c++;
        i += 2;
      } else i++;
    }
    return c;
  },
  VisibleInversions: (p) => inversionPairs(p).filter(([i, j]) => p[j]! <= Math.min(i + 1, p[i]!)).length,
  InvisibleInversions: (p) => inversionPairs(p).filter(([i, j]) => p[i]! > p[j]! && p[j]! > i + 1).length,
  PrefixSumProduct: (p) => range(1, p.length - 1).reduce((acc, i) => acc * sum(p.slice(0, i)), 1),

  // Batch 6.
  OneBoxPatterns: (p) => p.filter((v, i) => p.some((w, j) => Math.abs(i - j) + Math.abs(v - w) === 2)).length,
  MaximumOfDescentsAndInverseDescents: (p) => Math.max(descents(p).length, descents(inverse(p)).length),
  InvisibleDescents: (p) => descents(p).filter((i) => p[i]! > i).length,
  VisibleDescents: (p) => descents(p).filter((i) => p[i]! <= Math.min(i, p[i - 1]!)).length,
  GreaterNeighborOfMaximum: (p) => {
    if (p.length === 0) return 0;
    const q = [0, ...p, 0];
    const i = q.indexOf(p.length);
    return Math.max(q[i - 1]!, q[i + 1]!);
  },
  InversionsOfThirdEntry: (p) => p.slice(3).filter((v) => v < p[2]!).length,
  InversionsOfSecondEntry: (p) => p.slice(2).filter((v) => v < p[1]!).length,
  SumOfDistancesToGreaterElement: (p) => sum(p.map((_, i) => gapToGreater(p, i))),
  NormalizedSumOfDistancesToGreaterElement: (p) => sum(p.map((_, i) => gapToGreater(p, i) - 1)),
  HalfParityMismatches: (p) => p.filter((v, i) => Math.abs(i + 1 - v) % 2 === 1).length / 2,
  DescentWeightMinusInversions: (p) => sum(descents(p).map((i) => i * (p.length - i))) - inversionPairs(p).length,
  ReducedWordSupport: (p) => {
    // Bubble sort to the identity: the swaps are a reduced word.
    const q = [...p];
    const used = new Set<number>();
    for (let swapped = true; swapped;) {
      swapped = false;
      for (let i = 0; i + 1 < q.length; i++) {
        if (q[i]! > q[i + 1]!) {
          [q[i], q[i + 1]] = [q[i + 1]!, q[i]!];
          used.add(i + 1);
          swapped = true;
        }
      }
    }
    return used.size;
  },
  PermutationCosine: (p) => sum(p.map((v, i) => (i + 1) * v)),
  Mak: (p) =>
    vincular(p, [2, 3, 1], adjacentEnd) +
    vincular(p, [3, 2, 1], adjacentStart) +
    vincular(p, [1, 3, 2], adjacentEnd) +
    vincular(p, [2, 1], adjacentStart),
  Mad: (p) =>
    2 * vincular(p, [2, 3, 1], adjacentEnd) +
    vincular(p, [3, 1, 2], adjacentStart) +
    vincular(p, [2, 1], adjacentStart),
  Makl: (p) =>
    vincular(p, [1, 3, 2], adjacentEnd) +
    vincular(p, [3, 1, 2], adjacentStart) +
    vincular(p, [3, 2, 1], adjacentStart) +
    vincular(p, [2, 1], adjacentStart),
  BabsonSteingrimssonStatistic: (p) =>
    vincular(p, [1, 3, 2], adjacentStart) +
    vincular(p, [2, 1, 3], adjacentStart) +
    vincular(p, [3, 2, 1], adjacentStart) +
    vincular(p, [2, 1], adjacentStart),
  UlamDistance: (p) => p.length - longestIncreasing(inverse(p)),
  EvenWeakDeficienciesAndOddWeakExcedances: (p) =>
    range(1, p.length).filter((i) => (i % 2 === 0 ? p[i - 1]! <= i : p[i - 1]! >= i)).length,
  VerticalSeparators: (p) => range(2, p.length - 1).filter((i) => Math.abs(p[i - 2]! - p[i]!) === 1).length,
  CyclicAlignments: (p) => orderedPairs(p, (i, j, a, b) => cyclicallyOrdered(i, j, b, a)),
  CyclicMisalignments: (p) => orderedPairs(p, (i, j, a, b) => cyclicallyOrdered(i, a, j, b)),
  CyclicCrossings: (p) => orderedPairs(p, (i, j, a, b) => cyclicallyOrdered(i, b, a, j)),
  RestrictedNonInversionsBetweenExcedances: (p) => orderedPairs(p, (i, j, a, b) => i < j && j < a && a < b),
  InversionsBetweenExcedancesWithLinkedGreater: (p) =>
    orderedPairs(p, (i, j, a, b) => i < j && j < b && b < a && inverse(p)[j - 1]! < j),
  RestrictedNonInversionsBetweenExcedancesWithLinkedRightmost: (p) =>
    orderedPairs(p, (i, j, a, b) => i < j && j < a && a < b && inverse(p)[j - 1]! < j),
  InversionsBetweenExcedancesAndFixedPoints: (p) => orderedPairs(p, (i, j, a, b) => i < j && j === b && b < a),
  UpperMiddleEntry: (p) => (p.length === 0 ? 0 : p[Math.floor(p.length / 2)]!),
  LowerMiddleEntry: (p) => (p.length === 0 ? 0 : p[Math.floor((p.length + 1) / 2) - 1]!),
  Convexity: (p) => Math.max(0, ...range(1, p.length - 2).map((i) => 2 * p[i]! - p[i - 1]! - p[i + 1]!)),
  ProperBlocks: (p) => {
    if (p.length <= 2) return 0;
    const windows = pairs(p).filter(([i, j]) => {
      const w = p.slice(i, j + 1);
      return Math.max(...w) - Math.min(...w) === j - i;
    });
    return windows.length - 1;
  },
  HertzsprungOccurrencesOf132: (p) =>
    range(0, p.length - 3).filter((i) => {
      const d = p[i]! - 1;
      return p[i + 1]! - 3 === d && p[i + 2]! - 2 === d;
    }).length,
  PositionsOfLetterOneIn123: (p) => letterPositions(p, [1, 2, 3], 0),
  PositionsOfLetterOneIn132: (p) => letterPositions(p, [1, 3, 2], 0),
  PositionsOfLetterTwoIn213: (p) => letterPositions(p, [2, 1, 3], 0),
  PositionsOfLetterThreeIn132: (p) => letterPositions(p, [1, 3, 2], 1),
  OccurrencesOf14Dash2Dash3Or14Dash3Dash2: (p) =>
    sum(
      range(0, p.length - 2).map((i) => {
        if (p[i]! > p[i + 1]!) return 0;
        const c = p.slice(i + 2).filter((v) => p[i]! < v && v < p[i + 1]!).length;
        return (c * (c - 1)) / 2;
      }),
    ),
  InversionsOfCyclicEmbedding: (p) => {
    const n = p.length;
    const q = new Array<number>(n + 1);
    p.forEach((v, i) => (q[v - 1] = i + 1 < n ? p[i + 1]! : n + 1));
    q[n] = n === 0 ? 1 : p[0]!;
    return inversionPairs(q).length;
  },
  ShareshianWachsAdmissibleInversions: (p) => shareshianWachs(p),
  AdmissibleInversionsPlusDescents: (p) => shareshianWachs(p) + descents(p).length,
  AdmissibleInversions: (p) =>
    range(1, p.length).reduce(
      (total, i) =>
        total +
        range(i + 1, p.length).filter(
          (j) =>
            p[i - 1]! > p[j - 1]! &&
            ((i > 1 && p[i - 2]! < p[i - 1]!) || range(i + 1, j - 1).some((l) => p[i - 1]! < p[l - 1]!)),
        ).length,
      0,
    ),
  LargestGreatestCommonDivisorOfPositionAndValue: (p) => Math.max(0, ...p.map((v, i) => gcd(i + 1, v))),
  MaximalCycleDifference: (p) => Math.max(0, ...cycles(p).map((c) => Math.max(...c) - Math.min(...c))),
  LongestKOneTwoPattern: (p) =>
    Math.max(
      1,
      ...subsequences(p)
        .filter((s) => s.slice(1).every((v) => v < s[0]!) && isIncreasing(s.slice(1)))
        .map((s) => s.length),
    ),
  SmallestLeafLabel: (p) => Math.min(...leafLabels(p), ...(p.length ? [] : [0])),
  LongestIncreasingSubsequenceCount: (p) => {
    const best = longestIncreasing(p);
    return subsequences(p).filter((s) => isIncreasing(s) && s.length === best).length;
  },
  PrimeColumnSums: (p) => p.filter((v, i) => isPrime(i + 1 + v)).length,
  PrimeProductsMinusOne: (p) => p.filter((v, i) => isPrime((i + 1) * v - 1)).length,
  PrimeProductsPlusOne: (p) => p.filter((v, i) => isPrime((i + 1) * v + 1)).length,
  LongestArithmeticProgression: (p) =>
    Math.max(
      Math.min(p.length, 1),
      ...subsequences(p)
        .filter(isArithmetic)
        .map((s) => s.length),
    ),
  DiaconisGrahamDefect: (p) =>
    (sum(p.map((v, i) => Math.abs(v - i - 1))) - inversionPairs(p).length - (p.length - cycles(p).length)) / 2,
  InterpolatingPolynomialDegree: (p) =>
    p.length === 0
      ? 0
      : differenceRows(p).length -
        (p.length > 1 &&
        differenceRows(p)
          .at(-1)!
          .every((v) => v === 0)
          ? 2
          : 1),
  MinimalCycleDifference: (p) =>
    p.length === 0 ? 0 : Math.min(...cycles(p).map((c) => Math.max(...c) - Math.min(...c))),
  NonFixedPoints: (p) => p.filter((v, i) => v !== i + 1).length,
  LargestSearchTreeLeafLabel: (p) => Math.max(0, ...searchTreeLeaves(p)),
  NormalizedLeafLabelSum: (p) => sum(leafLabels(p)) - p.length,
  DescentsMinusOneUnlessFirstEntryOne: (p) => descents(p).length - (p.length > 0 && p[0] !== 1 ? 1 : 0),
  PermutationBreadth: (p) =>
    p.length < 2 ? 0 : Math.min(...pairs(p).map(([i, j]) => Math.abs(i - j) + Math.abs(p[i]! - p[j]!))),
  BoxedOccurrencesOf123: (p) => boxedOccurrences(p, [1, 2, 3]),
  BoxedOccurrencesOf132: (p) => boxedOccurrences(p, [1, 3, 2]),
  BinStatistic: (p) => sum(descents(p).map((i) => (i * (i + 1)) / 2)),
  NonNegativeWalkSteps: (p) => {
    const heights = range(0, p.length - 1).map((k) => sum(range(1, k).map((i) => (p[i - 1]! < p[i]! ? 1 : -1))));
    return range(0, p.length - 2).filter((i) => heights[i]! >= 0 && heights[i + 1]! >= 0).length;
  },
  CycleMinimumExceedancesDeficiencies: (p) =>
    sum(
      cycles(p).map((c) => {
        const rises = c.filter((v, k) => v < c[(k + 1) % c.length]!).length;
        return Math.min(rises, c.length - rises);
      }),
    ),
  Separators: (p) => {
    const q = inverse(p);
    return new Set([...verticalSeparators(p), ...verticalSeparators(q).map((v) => q[v - 1]!)]).size;
  },
  OverlapSetSize: (p) => overlapShifts(p).length,
  ExteriorLength: (p) => (p.length < 2 ? 0 : p.length - Math.min(...overlapShifts(p))),
  SimsunDoubleDescents: (p) =>
    sum(
      range(3, p.length).map(
        (k) =>
          range(0, k - 3).filter((i) => {
            const r = restrictedTo(p, k);
            return r[i]! > r[i + 1]! && r[i + 1]! > r[i + 2]!;
          }).length,
      ),
    ),
  SymmetryClassSize: (p) => symmetryClass(p).length,
  PermutationGenus: (p) => {
    const q = inverse(p);
    const product = q.map((v) => (v % p.length) + 1);
    return p.length === 0 ? 0 : (p.length + 1 - cycles(p).length - cycles(product).length) / 2;
  },
  PermutationBounce: (p) => {
    const n = p.length;
    if (n === 0) return 0;
    const v = inverse(p);
    const bounces = [v[0]!];
    while (bounces[bounces.length - 1]! < n) bounces.push(Math.max(...v.slice(0, bounces[bounces.length - 1]! + 1)));
    return sum(bounces.map((b) => n - b));
  },
  LexicographicRank: (p) => 1 + lexicographicRankFrom0(p),
  NonAttackingNeighbors: (p) => consecutiveGaps(p).filter((gap) => gap > 1).length,
  StaircaseSizeOfCode: (p) => {
    const code = p.map((v, i) => after(p, i).filter((w) => w < v).length);
    return Math.max(
      ...subsequences(code)
        .filter((s) => s.every((c, k) => c >= s.length - k))
        .map((s) => s.length),
    );
  },
  BruhatLowerCovers: (p) =>
    pairs(p).filter(([i, j]) => p[i]! > p[j]! && range(i + 1, j - 1).every((m) => p[m]! > p[i]! || p[m]! < p[j]!))
      .length,
  TailPairsOfOccurrencesOf321: (p) =>
    pairs(p).filter(([j, k]) => p[j]! > p[k]! && range(0, j - 1).some((i) => p[i]! > p[j]!)).length,
  StandardizedBiAlternatingInversionNumber: (p) =>
    (Math.floor(p.length / 2) ** 2 + sum(pairs(p).map(([y, x]) => (-1) ** (x + y) * Math.sign(p[x]! - p[y]!)))) / 2,
  MinimalInversionsEitherDirection: (p) => Math.min(inversionPairs(p).length, inversionPairs(p.toReversed()).length),
  BabsonSteingrimssonStatisticPrime: (p) =>
    descents(p).length +
    sum(
      [
        [1, 3, 2],
        [3, 1, 2],
        [3, 2, 1],
      ].map((q) => vincular(p, q, adjacentStart)),
    ),
  BabsonSteingrimssonStatisticDoublePrime: (p) =>
    descents(p).length +
    sum(
      [
        [1, 3, 2],
        [3, 1, 2],
        [3, 2, 1],
      ].map((q) => vincular(p, q, adjacentEnd)),
    ),
  Hag: (p) => {
    const tops = indices(p).filter((i) => i + 1 < p[i]!);
    const rest = indices(p).filter((i) => i + 1 >= p[i]!);
    const subword = (at: number[]) => at.map((i) => p[i]!);
    const blockers = sum(tops.map((i) => range(0, i - 1).filter((k) => p[k]! <= i + 1).length));
    return (
      sum(tops.map((i) => p[i]! - (i + 1))) +
      inversionPairs(subword(tops)).length -
      inversionPairs(subword(rest)).length +
      blockers
    );
  },
  HalfPermanentOfIdentityPlusPermutation: (p) => (p.length === 0 ? 0 : permanentOfIdentityPlusPermutation(p) / 2),
  HookFactorizationPrefixLength: (p) => hookFactorization(p).prefix.length,
  HookFactorInversions: (p) => sum(hookFactorization(p).hooks.map((hook) => inversionPairs(hook).length)),
  PermutationTreeHeight: insertionTreeHeight,
  FixedPointMajorIndex: (p) => {
    const fixed = indices(p)
      .filter((i) => p[i] === i + 1)
      .map((i) => i + 1);
    const rest = p.filter((v, i) => v !== i + 1);
    const standard = rest.map((v) => rest.filter((w) => w <= v).length);
    return sum(fixed) - (fixed.length * (fixed.length + 1)) / 2 + sum(descents(standard));
  },
  RecursiveEndMaximumCount: rix,
  RecursiveStartMinimumCount: aix,
  SmallerChildPathLeafLabel: (p) => (p.length === 0 ? 0 : smallerChildLeaf(p)),
  // The sum of the fractions, times the least common multiple of 1 .. 2n.
  ScaledReciprocalPositionValueSum: (p) =>
    p.length === 0 ? 0 : Math.round(sum(p.map((v, i) => 1 / (i + 1 + v))) * leastCommonMultiple(2 * p.length)),
  HalfSymmetryClassSize: (p) => Math.floor(symmetryClass(p).length / 2),
  CycleInverseClassSize: (p) => 2 ** cycles(p).filter((c) => c.length >= 3).length,
  BruhatTranspositionCount: transpositionsBelow,
  BruhatNonInversionTranspositionCount: (p) => transpositionsBelow(p) - inversionPairs(p).length,
  InsertionBumpsOfOne: (p) => (p.length === 0 ? 0 : rowOfInsertingOne(p)),
  ShortestDistinctWindowLength: (p) =>
    p.length === 0
      ? 0
      : range(1, p.length).find((k) => {
          const shapes = range(0, p.length - k).map((i) => windowShape(p.slice(i, i + k)));
          return new Set(shapes).size === shapes.length;
        })!,
  BreakpointGraphCycles: (p) => (p.length === 0 ? 1 : breakpointCycles(p)),
  RajchgotIndex: (p) => {
    const above = valueInversions(p);
    return p.length === 0
      ? 0
      : Math.max(
          ...allPermutations(p.length)
            .filter((v) => [...valueInversions(v)].every((e) => above.has(e)))
            .map(majorIndexOf),
        );
  },
  DescentWordFiberSize: (p) => countAmongAll(p, (q) => sameWord(descents(q), descents(p))),
  CycleAsOneLinePreimageSize: (p) => countAmongAll(p, (q) => sameWord(cyclesAsWord(q), p)),
  SimionSchmidtPreimageSize: (p) => countAmongAll(p, (q) => sameWord(simionSchmidtOntoAvoiders(q), p)),
  PrefixExchangeDistance: (p) => (p.length === 0 ? 0 : starDistance(p)),
  ReducedReflectionLength: (p) => 2 * sum(p.map((v, i) => Math.max(0, v - i - 1))) - inversionPairs(p).length,
  InverseFoataArrowAscents: (p) => {
    const image = stretchCycleImage(p);
    return range(1, p.length - 1).filter((i) => p[i - 1]! < p[i]! && image.get(p[i - 1]!) === p[i]!).length;
  },
  InverseFoataArrowPairs: (p) => {
    const image = stretchCycleImage(p);
    return pairs(p).filter(([i, j]) => p[i]! < image.get(p[i]!)! && image.get(p[i]!)! < p[j]!).length;
  },
  SubsetHoleyness: (p) => holeynessOf(p, (m) => m + 1),
  CyclicSubsetHoleyness: (p) => holeynessOf(p, (m) => (m % p.length) + 1),
  AlternatingSubsetBreakCount: (p) =>
    subsetsOf(p.length).filter(
      (s) => isAlternatingSet(s) && !isAlternatingSet(s.map((v) => p[v - 1]!).toSorted((a, b) => a - b)),
    ).length,
  SubsequenceMonotoneRunSum: (p) =>
    sum(
      subwordsOf(p)
        .filter((w) => w.length >= 3)
        .map(monotoneRuns),
    ),
  FixedPointAgreementCount: (p) =>
    allPermutations(p.length).filter(
      (s) => s.filter((v, i) => p[v - 1] === i + 1).length === p.filter((v, i) => v === i + 1).length,
    ).length,
  PopStackSortingPasses: (p) => {
    let w = p;
    let passes = 0;
    while (w.some((v, i) => v !== i + 1) && passes < 2 * p.length) {
      w = popStackSort(w);
      passes++;
    }
    return passes;
  },
  DistinctPatternCount: (p) => new Set(subwordsOf(p).map(standardized)).size,
  StackSortingPasses: (p) => {
    let w = p;
    let passes = 0;
    while (w.some((v, i) => v !== i + 1)) {
      w = stackSort(w);
      passes++;
    }
    return passes;
  },
  ConsecutiveSwapClassSize: (p) => swapClassOf(p, 1),
  DistanceTwoSwapClassSize: (p) => swapClassOf(p, 2),
  LusztigAFunction: (p) => {
    const shape = insertionShapeOf(p);
    return sum(
      range(1, shape[0] ?? 0).map(
        (j) => (shape.filter((l) => l >= j).length * (shape.filter((l) => l >= j).length - 1)) / 2,
      ),
    );
  },
  ParkingPermutationPreimageSize: (p) =>
    parkingFunctionsOf(p.length).filter(({ spots }) => spots.every((s, c) => s === p[c])).length,
  LabellingPermutationPreimageSize: (p) =>
    parkingFunctionsOf(p.length).filter(({ word }) => inverse(standardPermutation(word)).every((v, i) => v === p[i]))
      .length,
  MinimalStarTranspositionFactorizationCount: (p) => starFactorizationsOf(p.length).get(p.join(",")) ?? 0,
  LargestUniversalPatternSize: (p) => {
    const found = new Set(subwordsOf(p).map(standardized));
    let k = 0;
    while (allPermutations(k + 1).every((q) => found.has(standardized(q)))) k++;
    return k;
  },
  ChordDiagramComponentCount: chordComponents,
  RunSetFiberSize: (p) => {
    const runs = ascendingRuns(p);
    const key = (rs: number[][]): string =>
      rs
        .map((r) => r.join(","))
        .toSorted()
        .join("|");
    return orderings(runs).filter((order) => key(ascendingRuns(order.flat())) === key(runs)).length;
  },
  LongestTwinLength: (p) => largestTwins(p, (a, b) => standardized(a) === standardized(b)),
  LongestWeakTwinLength: (p) =>
    largestTwins(p, (a, b) => range(1, a.length - 1).every((i) => a[i - 1]! < a[i]! === b[i - 1]! < b[i]!)),
};
