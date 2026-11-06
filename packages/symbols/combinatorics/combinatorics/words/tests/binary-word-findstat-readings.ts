// Independent readings of the binary-word statistics adopted from FindStat, written against
// FindStat's definitions rather than against the expressions: the word as a string, its runs by
// pattern, the prefixes by slicing.

const text = (w: readonly number[]): string => w.join("");
const sum = (a: readonly number[]): number => a.reduce((x, y) => x + y, 0);
const indices = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

/** The maximal runs of ones, as their lengths. */
const oneRuns = (w: readonly number[]): number[] => (text(w).match(/1+/g) ?? []).map((run) => run.length);
const zeros = (letters: string): number => letters.replaceAll("1", "").length;
const ones = (letters: string): number => letters.replaceAll("0", "").length;
/** Every prefix of the word, the empty one first. */
const prefixes = (w: readonly number[]): string[] => indices(w.length + 1).map((n) => text(w).slice(0, n));

/** The word cut where two neighboring letters agree, so every piece alternates. */
const alternatingPieces = (w: readonly number[]): string[] =>
  text(w)
    .replace(/(.)(?=\1)/g, "$1|")
    .split("|");

/** The distinct nonempty factors of the word. */
const factorsOf = (letters: string): Set<string> => {
  const found = new Set<string>();
  for (let from = 0; from < letters.length; from++)
    for (let to = from + 1; to <= letters.length; to++) found.add(letters.slice(from, to));
  return found;
};
const reversed = (letters: string): string => letters.split("").toReversed().join("");
const isPalindromic = (letters: string): boolean => letters === reversed(letters);
const longest = (items: Iterable<string>): number => Math.max(0, ...[...items].map((item) => item.length));
/** The longest proper prefix that is also a suffix (the empty word for none). */
const borderLength = (letters: string): number => {
  for (let size = letters.length - 1; size > 0; size--)
    if (letters.slice(0, size) === letters.slice(-size)) return size;
  return 0;
};
/** The pairs a < b of positions (0-based) with `related(w_a, w_b)`, summed by b - a. */
const weightedPairs = (w: readonly number[], related: (a: number, b: number) => boolean): number =>
  sum(
    indices(w.length).flatMap((a) =>
      indices(w.length)
        .filter((b) => b > a && related(w[a]!, w[b]!))
        .map((b) => b - a),
    ),
  );
/** The subsequences of the word, as strings, the empty one included. */
const subsequences = (letters: string): Set<string> => {
  const found = new Set<string>();
  for (let mask = 0; mask < 2 ** letters.length; mask++)
    found.add(
      letters
        .split("")
        .filter((_, i) => (mask >> i) & 1)
        .join(""),
    );
  return found;
};
/** The ways to cut the word into palindromes, as piece counts. */
const palindromicCuts = (letters: string): number[] =>
  letters === ""
    ? [0]
    : indices(letters.length)
        .map((i) => letters.slice(0, i + 1))
        .filter(isPalindromic)
        .flatMap((piece) => palindromicCuts(letters.slice(piece.length)).map((rest) => rest + 1));

/** Sage's `first_passage_decomposition`: pieces (D 0) cut where the height first reaches a new low, then the rest. */
const firstPassage = (w: readonly number[]): [number[][], number[]] => {
  const pieces: number[][] = [];
  let start = 0;
  let height = 0;
  let low = -1;
  w.forEach((letter, j) => {
    height += letter === 1 ? 1 : -1;
    if (height === low) {
      pieces.push(w.slice(start, j));
      start = j + 1;
      low--;
    }
  });
  return [pieces, w.slice(start)];
};
const complementReversed = (w: readonly number[]): number[] => w.map((letter) => 1 - letter).toReversed();
/** Sage's `catalan_factorization` of FindStat's St000875, St000876 and St000885: the Dyck words before, in and after the middle. */
const catalanFactorization = (w: readonly number[]): [number[][], number[], number[][]] => {
  const [down, rest] = firstPassage(w);
  const [up, middle] = firstPassage(complementReversed(rest));
  return [down, complementReversed(middle), up.toReversed().map(complementReversed)];
};
/** The Lyndon factors, by Duval's algorithm. */
const lyndonFactors = (letters: string): string[] => {
  const factors: string[] = [];
  let i = 0;
  while (i < letters.length) {
    let j = i + 1;
    let k = i;
    while (j < letters.length && letters[k]! <= letters[j]!) {
      k = letters[k]! < letters[j]! ? i : k + 1;
      j++;
    }
    while (i <= k) {
      factors.push(letters.slice(i, i + j - k));
      i += j - k;
    }
  }
  return factors;
};
/** The distinct nonempty `u` with `copies` copies of `u` side by side somewhere in the word. */
const repeatedFactors = (letters: string, copies: number): number => {
  const found = new Set<string>();
  for (const factor of factorsOf(letters)) if (letters.includes(factor.repeat(copies))) found.add(factor);
  return found.size;
};

export type Reading = (w: readonly number[]) => number;

export const WORD_READINGS: Record<string, Reading> = {
  HammingWeight: (w) => ones(text(w)),
  LeadingOnesCount: (w) => text(w).length - text(w).replace(/^1+/, "").length,
  OnePositionSum: (w) => sum(indices(w.length).map((i) => (w[i] === 1 ? i + 1 : 0))),
  OneRunCount: (w) => oneRuns(w).length,
  OddOneRunCount: (w) => oneRuns(w).filter((run) => run % 2 === 1).length,
  LongestRunOfOnes: (w) => Math.max(0, ...oneRuns(w)),
  ChangeCount: (w) => indices(Math.max(0, w.length - 1)).filter((i) => w[i] !== w[i + 1]).length,
  PathDepth: (w) => Math.max(...prefixes(w).map((p) => zeros(p) - ones(p))),
  OnesMinusZeros: (w) => ones(text(w)) - zeros(text(w)),
  BalancedPrefixCount: (w) => prefixes(w).filter((p) => p !== "" && zeros(p) === ones(p)).length,
  SymmetryDegree: (w) => indices(Math.floor(w.length / 2)).filter((i) => w[i] === w[w.length - 1 - i]).length,
  Ascents: (w) => (text(w).match(/01/g) ?? []).length,
  // Each 1 is an inversion with every 0 after it.
  Inversions: (w) => sum(indices(w.length).map((i) => (w[i] === 1 ? zeros(text(w).slice(i + 1)) : 0))),
  // The descents are the "10" factors; a factor starting at index i is at position i + 1.
  MajorIndex: (w) => sum(indices(w.length).map((i) => (text(w).slice(i, i + 2) === "10" ? i + 1 : 0))),
  LongestConstantRun: (w) => Math.max(0, ...(text(w).match(/0+|1+/g) ?? []).map((run) => run.length)),
  LongestAlternatingFactor: (w) => Math.max(...alternatingPieces(w).map((piece) => piece.length)),
  FirstOnePositionAfterAppendedOne: (w) => `${text(w)}1`.indexOf("1") + 1,
  DecimalRepresentation: (w) => (w.length === 0 ? 0 : Number.parseInt(text(w), 2)),
  DecimalRepresentationWithLeadingOne: (w) => Number.parseInt(`1${text(w)}`, 2),
  DistinctFactorCount: (w) => factorsOf(text(w)).size + 1,
  BorderLength: (w) => borderLength(text(w)),
  SymmetricBorderLength: (w) => {
    const letters = text(w);
    return Math.max(
      0,
      ...indices(letters.length + 1).filter(
        (size) => letters.slice(0, size) === reversed(letters.slice(letters.length - size)),
      ),
    );
  },
  InversionSum: (w) => weightedPairs(w, (a, b) => a === 1 && b === 0),
  NonInversionSum: (w) => weightedPairs(w, (a, b) => a < b),
  // The strictly increasing runs are the factors 0, 1 and 01, cut greedily from the left.
  StrictlyIncreasingRuns: (w) => text(w).replace(/01/g, "x").length,
  DistinctSubsequenceCount: (w) => subsequences(text(w)).size,
  MinimalPeriod: (w) =>
    w.length === 0
      ? 0
      : [...indices(w.length)].map((p) => p + 1).find((p) => indices(w.length - p).every((i) => w[i] === w[i + p]))!,
  RepetitionExponent: (w) =>
    Math.max(
      0,
      ...indices(w.length)
        .map((i) => i + 1)
        .filter(
          (e) =>
            w.length % e === 0 &&
            text(w)
              .slice(0, w.length / e)
              .repeat(e) === text(w),
        ),
    ),
  Balance: (w) =>
    Math.max(
      0,
      ...indices(w.length).map((i) => {
        const counts = indices(w.length - i).map((from) => ones(text(w).slice(from, from + i + 1)));
        return Math.max(...counts) - Math.min(...counts);
      }),
    ),
  ShortestPalindromicDecompositionLength: (w) => Math.min(...palindromicCuts(text(w))),
  PalindromicDecompositionCount: (w) => palindromicCuts(text(w)).length,
  LongestCatalanFactorSemilength: (w) => {
    const [down, middle, up] = catalanFactorization(w);
    return Math.max(...[...down, middle, ...up].map((factor) => factor.length / 2));
  },
  CatalanFactorCount: (w) => {
    const [down, middle, up] = catalanFactorization(w);
    return down.length + (middle.length === 0 ? 0 : 1) + up.length;
  },
  CriticalStepCount: (w) => {
    const [down, , up] = catalanFactorization(w);
    return down.length + up.length;
  },
  InternalInversions: (w) => {
    const sorted = w.toSorted((a, b) => a - b);
    return sum(
      indices(w.length).map(
        (i) => indices(w.length).filter((j) => j > i && w[i]! > w[j]! && sorted[i] === sorted[j]).length,
      ),
    );
  },
  UniqueFactorLength: (w) =>
    w.length === 0
      ? 0
      : [...indices(w.length)]
          .map((size) => size + 1)
          .find((size) => {
            const pieces = indices(w.length - size + 1).map((from) => text(w).slice(from, from + size));
            return new Set(pieces).size === pieces.length;
          })!,
  LyndonFactorizationLength: (w) => lyndonFactors(text(w)).length,
  LongestYamanouchiPrefix: (w) => {
    let height = 0;
    for (const [i, letter] of w.entries()) {
      height += letter === 1 ? -1 : 1;
      if (height < 0) return i;
    }
    return w.length;
  },
  LongestPalindromicPrefix: (w) => longest(prefixes(w).filter(isPalindromic)),
  LongestPalindromicFactor: (w) => longest([...factorsOf(text(w))].filter(isPalindromic)),
  LongestPalindromicSubsequence: (w) => longest([...subsequences(text(w))].filter(isPalindromic)),
  DistinctCubeCount: (w) => repeatedFactors(text(w), 3),
  DistinctSquareCount: (w) => repeatedFactors(text(w), 2),
  CyclicShiftIndex: (w) => {
    const shifts = [...new Set(indices(w.length).map((i) => text(w).slice(i) + text(w).slice(0, i)))].toSorted();
    return Math.max(0, shifts.indexOf(text(w)));
  },
  BorderCount: (w) =>
    indices(w.length).filter((size) => text(w).slice(0, size) === text(w).slice(w.length - size)).length,
  WeakMajorIndex: (w) => sum(indices(w.length - 1).map((i) => (w[i]! >= w[i + 1]! ? i + 1 : 0))),
};

/** FindStat's St000291 for `Descents`, which is not a binary-word definition of its own: the occurrences of the factor 10. */
export const descentsOfWord = (w: readonly number[]): number =>
  w.filter((letter, i) => letter === 1 && w[i + 1] === 0).length;
