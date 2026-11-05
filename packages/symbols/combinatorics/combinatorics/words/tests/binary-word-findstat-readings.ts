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
};

/** FindStat's St000291 for `Descents`, which is not a binary-word definition of its own: the occurrences of the factor 10. */
export const descentsOfWord = (w: readonly number[]): number =>
  w.filter((letter, i) => letter === 1 && w[i + 1] === 0).length;
