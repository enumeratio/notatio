// Independent readings of the parking-function statistics adopted from FindStat, written against
// FindStat's definitions rather than against the expressions: the cars are parked one by one on a
// row of spots, and the rest read the preferences as a plain list.

const sum = (a: readonly number[]): number => a.reduce((x, y) => x + y, 0);
const indices = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

/** Each car in turn takes the first free spot at or after its preference; the spots it drives past, per car, and whether it got its preference. */
const parked = (preferences: readonly number[]): { displacement: number[]; lucky: boolean[] } => {
  const taken = new Set<number>();
  const displacement: number[] = [];
  const lucky: boolean[] = [];
  for (const preference of preferences) {
    let spot = preference;
    while (taken.has(spot)) spot++;
    taken.add(spot);
    displacement.push(spot - preference);
    lucky.push(spot === preference);
  }
  return { displacement, lucky };
};

/** FindStat's St000942: an entry j is critical when exactly j - 1 entries are smaller and n - j larger, and a left to right maximum when no earlier entry is as large. */
const criticalMaxima = (p: readonly number[]): number =>
  p.filter(
    (j, i) =>
      p.slice(0, i).every((earlier) => earlier < j) &&
      p.filter((k) => k < j).length === j - 1 &&
      p.filter((k) => k > j).length === p.length - j,
  ).length;

/** FindStat's St001937: the entries kept while each is at most the number kept so far plus one. */
const center = (p: readonly number[]): number => {
  const kept: number[] = [];
  for (const entry of p) if (entry <= kept.length + 1) kept.push(entry);
  return kept.length;
};

/** FindStat's St001904: the first position at which the entries stop rising. */
const risingStart = (p: readonly number[]): number => {
  if (p.length === 0) return 0;
  let i = 1;
  while (i < p.length && p[i]! > p[i - 1]!) i++;
  return i;
};

export type Reading = (p: readonly number[]) => number;

export const PARKING_FUNCTION_READINGS: Record<string, Reading> = {
  LuckyCars: (p) => parked(p).lucky.filter(Boolean).length,
  TotalParkingDisplacement: (p) => sum(parked(p).displacement),
  MaximalParkingDisplacement: (p) => Math.max(0, ...parked(p).displacement),
  SumLessLength: (p) => sum(p) - p.length,
  CriticalLeftToRightMaxima: criticalMaxima,
  Deficiencies: (p) => p.filter((entry, i) => entry < i + 1).length,
  InitialIncreasingSegmentLength: risingStart,
  Ties: (p) => indices(p.length - 1).filter((i) => p[i] === p[i + 1]).length,
  CenterSize: center,
};

/** The heads a parking function shares with other carriers, read through `CombinatorialStat`. */
export const SHARED_PARKING_FUNCTION_READINGS: Record<string, Reading> = {
  Sum: sum,
  FixedPoints: (p) => p.filter((entry, i) => entry === i + 1).length,
  Ascents: (p) => indices(p.length - 1).filter((i) => p[i]! < p[i + 1]!).length,
  Descents: (p) => indices(p.length - 1).filter((i) => p[i]! > p[i + 1]!).length,
};
