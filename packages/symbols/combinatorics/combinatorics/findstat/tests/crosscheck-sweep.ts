// The sweep behind distribution-crosscheck.test.ts and graph-crosscheck.test.ts; see the first for what is compared.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { bareEngine } from "@enumeratio/engine/testing";
import { declareStructures } from "@enumeratio/structures";
import { expect } from "vite-plus/test";
import { CARRIERS, declareCombinatorics, declareMaps } from "../../src/index.ts";
import { COLLECTION_CARRIER, objectLevel, objectSize, readObject } from "../src/objects.ts";
import { findstat } from "../src/findstat-data.ts";

export const DEEP = process.env.DEEP_TESTS === "1";
export const CRAWL = process.env.FINDSTAT_CRAWL;
const MAX_SIZE = DEEP ? Number(process.env.DEEP_SIZE ?? 6) : 5;
export const GOLDEN = new URL("./distribution-crosscheck.golden.json", import.meta.url);
// A wrong path would otherwise fall back to the snapshot and pass having read no crawl.
if (DEEP && CRAWL && !existsSync(`${CRAWL}/St000001.json`))
  throw new Error(`FINDSTAT_CRAWL=${CRAWL} holds no statistics: it names <crawl>/StatisticsDatabase`);

/** Our collection of each carrier, and its size argument for FindStat's size `n`. */
const COLLECTIONS: Readonly<Record<string, [head: string, argument: (size: number) => number]>> = {
  Permutation: ["Permutations", (n) => n],
  IntegerPartition: ["IntegerPartitions", (n) => n],
  DyckPath: ["DyckPaths", (n) => n],
  SetPartition: ["SetPartitions", (n) => n],
  IntegerComposition: ["IntegerCompositions", (n) => n],
  BinaryWord: ["BinaryWords", (n) => n],
  BinaryTree: ["BinaryTrees", (n) => n],
  OrderedTree: ["OrderedTrees", (n) => n],
  StandardTableau: ["StandardTableaux", (n) => n],
  // FindStat's matching size is its points; ours is its pairs.
  PerfectMatching: ["PerfectMatchings", (n) => n / 2],
  SignedPermutation: ["SignedPermutations", (n) => n],
  AlternatingSignMatrix: ["AlternatingSignMatrices", (n) => n],
  // FindStat's parking functions of size n are the lists of length n.
  ParkingFunction: ["ParkingFunctions", (n) => n],
  // FindStat's plane partition size is its boxes, the sum of the entries, as ours.
  PlanePartition: ["PlanePartitions", (n) => n],
  SkewPartition: ["SkewPartitions", (n) => n],
  CartanType: ["FiniteCartanTypes", (n) => n],
};

/**
 * Carriers FindStat levels by (size, maximal entry exactly), a tableau by its cells and largest entry, a pattern by its rows
 * and the first entry of its top row. Ours is the collection of both, `Coll(size, k)`, whose elements have the maximal entry
 * at most k: the level is `Coll(size, k)` less `Coll(size, k - 1)`, where `least` is the smallest k that has any element.
 */
const EXACT_MAXIMUM: Readonly<Record<string, { collection: string; least: number }>> = {
  SemistandardTableau: { collection: "SemistandardTableaux", least: 1 },
  GelfandTsetlinPattern: { collection: "GelfandTsetlin", least: 0 },
};

/** Whether a statistic on `carrier` is compared by distributions of levels. */
const LEVELLED = (carrier: string): boolean =>
  COLLECTIONS[carrier] !== undefined || EXACT_MAXIMUM[carrier] !== undefined;

/**
 * Carriers whose FindStat collection is not one of ours by size: graphs are listed up to isomorphism, ours by labeling, so a
 * per-size distribution would not match. Each object of the crawl is read, the statistic evaluated on it, and the value held
 * to the object's row, which says more than a distribution. The largest size read, in the standard run and in a deep one;
 * a size the crawl covers only in part is compared as far as it goes.
 */
export const OBJECT_WISE: Readonly<Record<string, { standard: number; deep: number }>> = {
  LabeledGraph: { standard: 5, deep: Number(process.env.DEEP_OBJECT_SIZE ?? 7) },
};
const objectCap = (carrier: string): number => OBJECT_WISE[carrier]![DEEP ? "deep" : "standard"];
/**
 * Statistics read off a greatest common divisor of polynomials. Their compiled code declines where a coefficient passes the
 * doubles (most graphs on 7 vertices, and some on fewer), and the interpreter takes about 10 s a graph, so they are read to 6.
 */
const INTERPRETED_PAST_SIX = new Set([
  "DistinctEigenvalueCount",
  "DistinctLaplacianEigenvalueCount",
  "MaximumEigenvalueMultiplicity",
  "MaximumLaplacianEigenvalueMultiplicity",
  "DistinctDistanceLaplacianEigenvalueCount",
  "MaximumDistanceLaplacianEigenvalueMultiplicity",
]);

type Kind = "unclassified" | "emit" | "convention" | "ours";
interface Disagreement {
  readonly kind: Kind;
  readonly note: string;
  readonly ours: Record<string, number>;
  readonly theirs: Record<string, number>;
}
type Golden = Record<string, Disagreement>;

const ce = bareEngine();
declareStructures(ce);
declareCombinatorics(ce);
declareMaps(ce, Object.fromEntries(CARRIERS.map((c) => [c.type, c.name])));
const value = (json: unknown) => ce.box(json as never).evaluate().json;

interface Snapshot {
  readonly items: Readonly<Record<string, { collection: string; sample: readonly [string, number][] }>>;
}
const snapshot = JSON.parse(readFileSync(new URL("../data/statistics.json", import.meta.url), "utf8")) as Snapshot;

/** FindStat's pairs for `id`: the whole crawl when there is one in a deep run, else the snapshot. */
function pairsOf(id: string): readonly [string, number][] {
  if (DEEP && CRAWL && existsSync(`${CRAWL}/${id}.json`)) {
    const data = JSON.parse(readFileSync(`${CRAWL}/${id}.json`, "utf8")) as { StatisticData: Record<string, number> };
    return Object.entries(data.StatisticData);
  }
  return snapshot.items[id]?.sample ?? [];
}

/** value -> count over the objects of one size, ascending by value, as the object `{value: count}`. */
const tallyOf = (values: readonly number[]): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const v of values.toSorted((a, b) => a - b)) out[v] = (out[v] ?? 0) + 1;
  return out;
};

/** Same `{value: count}`, key by key: negative keys keep insertion order, so stringified tallies can differ. */
const sameTally = (a: Record<string, number>, b: Record<string, number>): boolean =>
  Object.keys(a).length === Object.keys(b).length && Object.entries(a).every(([k, n]) => b[k] === n);

/** The `Tally` of the collection `collection` for the statistic `head`, read as `{value: count}`. */
function tallyOf1(collection: unknown, head: string): Record<string, number> | undefined {
  const answer = value(["Tally", ["CombinatorialStat", collection, `'${head}'`]]) as unknown;
  if (!Array.isArray(answer) || answer[0] !== "Tuple") return undefined;
  const values = (answer[1] as unknown[]).slice(1).map(Number);
  const counts = (answer[2] as unknown[]).slice(1).map(Number);
  if (values.some((v) => !Number.isFinite(v))) return undefined;
  return Object.fromEntries(values.map((v, i) => [v, counts[i]!]));
}

/** The number of objects of FindStat's level of `carrier`: its collection's, less the next smaller level's where the level is exact. */
function levelCount(carrier: string, level: readonly number[]): number {
  const exact = EXACT_MAXIMUM[carrier];
  if (exact === undefined) {
    const [collection, argument] = COLLECTIONS[carrier]!;
    return Number(value(["Count", [collection, argument(level[0]!)]]));
  }
  const [size, k] = level as [number, number];
  const count = (entry: number): number => Number(value(["Count", [exact.collection, size, entry]]));
  return count(k) - (k > exact.least ? count(k - 1) : 0);
}

/** Ours: the call the distribution pane makes, read as `{value: count}`. */
function ourTally(carrier: string, level: readonly number[], head: string): Record<string, number> | undefined {
  const exact = EXACT_MAXIMUM[carrier];
  if (exact === undefined) {
    const [collection, argument] = COLLECTIONS[carrier]!;
    return tallyOf1([collection, argument(level[0]!)], head);
  }
  const [size, k] = level as [number, number];
  const upper = tallyOf1([exact.collection, size, k], head);
  const lower = k > exact.least ? tallyOf1([exact.collection, size, k - 1], head) : {};
  if (upper === undefined || lower === undefined) return undefined;
  const out: Record<string, number> = {};
  for (const [v, n] of Object.entries(upper)) if (n - (lower[v] ?? 0) !== 0) out[v] = n - (lower[v] ?? 0);
  return out;
}

/** Ours on one object of a carrier compared object by object: the statistic's call on the carrier value, as FindStat's `text` reads. */
function ourValue(carrier: string, object: string, head: string): number | string {
  const answer = value(["CombinatorialStat", readObject(carrier, object)!, `'${head}'`]) as unknown;
  return typeof answer === "number" ? answer : String(answer);
}

export interface Report {
  /** One label per statistic and size compared in full: a distribution, or every object of the crawl at that size. */
  readonly compared: string[];
  /** The objects read one by one behind the labels `ending in "objects"`. */
  objects: number;
  readonly skipped: string[];
  readonly disagreements: Golden;
}

export function sweep(only?: readonly string[], objectWise = true): Report {
  const compared: string[] = [];
  const skipped: string[] = [];
  const disagreements: Golden = {};
  const counts = new Map<string, number>();
  let objectsRead = 0;
  for (const match of findstat) {
    if (OBJECT_WISE[match.on] ? !objectWise : !LEVELLED(match.on)) continue;
    if (only && !only.includes(`${match.head}@${match.on}`)) continue;
    for (const id of match.findstat) {
      const bySize = new Map<string, { level: readonly number[]; objects: Map<string, number> }>();
      const entry = snapshot.items[id];
      if (!entry || COLLECTION_CARRIER[entry.collection] !== match.on) continue;
      for (const [object, v] of pairsOf(id)) {
        const size = objectSize(match.on, object);
        const cap = OBJECT_WISE[match.on]
          ? Math.min(objectCap(match.on), INTERPRETED_PAST_SIX.has(match.head) ? 6 : Infinity)
          : MAX_SIZE;
        if (size === undefined || size > cap || typeof v !== "number") continue;
        const level = objectLevel(match.on, object) ?? [size];
        const group = bySize.get(level.join(",")) ?? { level, objects: new Map<string, number>() };
        bySize.set(level.join(","), group);
        group.objects.set(object, v);
      }
      for (const { level, objects } of [...bySize.values()].toSorted(
        (a, b) => a.level[0]! - b.level[0]! || a.level[1]! - b.level[1]!,
      )) {
        const size = level[0]!;
        const label = `${match.head}@${match.on} ${id} n=${size}${level.length > 1 ? `,k=${level[1]}` : ""}`;
        if (OBJECT_WISE[match.on]) {
          const ours: Record<string, number> = {};
          const theirs: Record<string, number> = {};
          const wrong: string[] = [];
          try {
            for (const [object, expected] of objects) {
              const got = ourValue(match.on, object, match.head);
              if (got === expected) continue;
              wrong.push(`${object}: ours ${got}, FindStat ${expected}`);
              ours[String(got)] = (ours[String(got)] ?? 0) + 1;
              theirs[expected] = (theirs[expected] ?? 0) + 1;
            }
          } catch (error) {
            skipped.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
            continue;
          }
          objectsRead += objects.size;
          compared.push(`${label} objects`);
          if (wrong.length > 0)
            disagreements[`${label} objects`] = {
              kind: "unclassified",
              note: wrong.slice(0, 3).join("; "),
              ours,
              theirs,
            };
          continue;
        }
        const key = `${match.on}:${level.join(",")}`;
        let ours: Record<string, number> | undefined;
        try {
          if (!counts.has(key)) counts.set(key, levelCount(match.on, level));
          if (objects.size !== counts.get(key)) {
            skipped.push(`${label}: ${objects.size} of ${counts.get(key)} objects`);
            continue;
          }
          ours = ourTally(match.on, level, match.head);
        } catch (error) {
          skipped.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
          continue;
        }
        if (ours === undefined) {
          skipped.push(`${label}: ours has no numeric tally`);
          continue;
        }
        const theirs = tallyOf([...objects.values()]);
        compared.push(label);
        if (!sameTally(ours, theirs)) disagreements[label] = { kind: "unclassified", note: "", ours, theirs };
      }
    }
  }
  return { compared, objects: objectsRead, skipped, disagreements };
}

export const readGolden = (): Golden =>
  existsSync(GOLDEN) ? (JSON.parse(readFileSync(GOLDEN, "utf8")) as Golden) : {};

/** The pinned disagreements keep their classification; a new one arrives `unclassified`. */
export function merge(golden: Golden, found: Golden): Golden {
  return Object.fromEntries(
    Object.entries(found).map(([label, d]) => [
      label,
      golden[label] ? { ...d, kind: golden[label].kind, note: golden[label].note } : d,
    ]),
  );
}

export const REPRESENTATIVE = ["Valleys@Permutation", "Peaks@DyckPath", "Blocks@SetPartition", "Leaves@BinaryTree"];

/** The pinned disagreements among the compared sizes (and `heads`, when given): a run that sees them must reproduce them. */
const pinned = (golden: Golden, heads: readonly string[] | undefined, compared: readonly string[]): Golden =>
  Object.fromEntries(
    Object.entries(golden).filter(
      ([label]) => compared.includes(label) && (!heads || heads.some((h) => label.startsWith(`${h} `))),
    ),
  );

export function expectPinned(report: Report, heads?: readonly string[]): void {
  const expected = pinned(readGolden(), heads, report.compared);
  expect(Object.keys(report.disagreements).toSorted()).toEqual(Object.keys(expected).toSorted());
  for (const [label, d] of Object.entries(report.disagreements))
    expect({ ours: d.ours, theirs: d.theirs }, label).toEqual({
      ours: expected[label]!.ours,
      theirs: expected[label]!.theirs,
    });
}

/** Rewrites the golden from a report: pins for sizes the run did not compare stay. */
export function updateGolden(report: Report): void {
  const golden = readGolden();
  const kept = Object.entries(golden).filter(([label]) => !report.compared.includes(label));
  const next = Object.fromEntries([...kept, ...Object.entries(merge(golden, report.disagreements))]);
  writeFileSync(GOLDEN, `${JSON.stringify(next, null, 2)}\n`);
}
