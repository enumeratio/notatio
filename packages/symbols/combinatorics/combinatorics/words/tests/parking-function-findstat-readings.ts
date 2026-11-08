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

/** The labeled Dyck path of the preferences: the cars in the order of their rows (by spot, then label) with the area of each row, FindStat's area sequence. */
const dyckRows = (p: readonly number[]): { label: number; area: number }[] =>
  p
    .map((spot, car) => ({ spot, label: car + 1 }))
    .toSorted((a, b) => a.spot - b.spot || a.label - b.label)
    .map(({ spot, label }, row) => ({ label, area: row + 1 - spot }));
const rowPairs = (p: readonly number[]): [{ label: number; area: number }, { label: number; area: number }][] => {
  const rows = dyckRows(p);
  return rows.flatMap((upper, i) => rows.slice(i + 1).map((lower): [typeof upper, typeof upper] => [upper, lower]));
};
const primaryDinversions = (p: readonly number[]): number =>
  rowPairs(p).filter(([a, b]) => a.area === b.area && a.label < b.label).length;
const secondaryDinversions = (p: readonly number[]): number =>
  rowPairs(p).filter(([a, b]) => a.area === b.area + 1 && a.label > b.label).length;
/** FindStat's St001209: scan from the right again and again, marking the next position whose value is at most the count with the number of restarts. */
const pmaj = (p: readonly number[]): number => {
  const rest: (number | undefined)[] = p.toReversed();
  let count = 1;
  let run = 0;
  let total = 0;
  while (rest.some((v) => v !== undefined)) {
    for (let i = 0; i < rest.length; i++)
      if (rest[i] !== undefined && rest[i]! <= count) {
        count++;
        rest[i] = undefined;
        total += run;
      }
    run++;
  }
  return total;
};

export type Reading = (p: readonly number[]) => number;

export const PARKING_FUNCTION_READINGS: Record<string, Reading> = {
  PrimaryDinversionPairCount: primaryDinversions,
  SecondaryDinversionPairCount: secondaryDinversions,
  ParkingFunctionDinv: (p) => primaryDinversions(p) + secondaryDinversions(p),
  ParkingMajorIndex: pmaj,
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
