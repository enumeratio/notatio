// Our statistic distributions against FindStat's. For each statistic we have matched to a FindStat
// id (`findstat-data.ts`), FindStat's (object, value) pairs give a distribution per size; ours is
// `Tally(CombinatorialStat(Coll(n), "Head"))`, the call the distribution pane makes. A size is
// compared only when the pairs cover every object of it: as many distinct objects as our
// collection has. The distribution helper itself (`frontend/src/distribution.ts`) sits above this
// package, so the tally is read here directly.
//
// Pairs come from the committed snapshot (`data/statistics.json`: the smallest eight rows of each
// statistic, so few sizes are covered) or, under DEEP_TESTS=1 with FINDSTAT_CRAWL=<dir of
// <crawl>/StatisticsDatabase>, from the whole crawl, up to size DEEP_SIZE. A disagreement is
// never dropped: it is pinned in `distribution-crosscheck.golden.json` with its classification
// (the oracle's `DIVERGENCE_KINDS`; `unclassified` while it is a judgment call), so the run fails
// only when the set of disagreements changes. Regenerate with UPDATE_FINDSTAT_DISTRIBUTIONS=1.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { bareEngine } from "@enumeratio/engine/testing";
import { declareStructures } from "@enumeratio/structures";
import { expect, test } from "vite-plus/test";
import { CARRIERS, declareCombinatorics, declareMaps } from "../../src/index.ts";
import { COLLECTION_CARRIER, objectSize, readObject } from "../src/objects.ts";
import { findstat } from "../src/findstat-data.ts";

const DEEP = process.env.DEEP_TESTS === "1";
const CRAWL = process.env.FINDSTAT_CRAWL;
const MAX_SIZE = DEEP ? Number(process.env.DEEP_SIZE ?? 6) : 5;
const GOLDEN = new URL("./distribution-crosscheck.golden.json", import.meta.url);
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
 * Carriers whose FindStat collection is not one of ours by size: graphs are listed up to isomorphism, ours by labeling, so a
 * per-size distribution would not match. Each object of the crawl is read, the statistic evaluated on it, and the value held
 * to the object's row, which says more than a distribution. The largest size read, in the standard run and in a deep one;
 * a size the crawl covers only in part is compared as far as it goes.
 */
const OBJECT_WISE: Readonly<Record<string, { standard: number; deep: number }>> = {
  LabeledGraph: { standard: 5, deep: Number(process.env.DEEP_OBJECT_SIZE ?? 7) },
};
const objectCap = (carrier: string): number => OBJECT_WISE[carrier]![DEEP ? "deep" : "standard"];

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

/** Ours: the call the distribution pane makes, read as `{value: count}`. */
function ourTally(carrier: string, size: number, head: string): Record<string, number> | undefined {
  const [collection, argument] = COLLECTIONS[carrier]!;
  const answer = value(["Tally", ["CombinatorialStat", [collection, argument(size)], `'${head}'`]]) as unknown;
  if (!Array.isArray(answer) || answer[0] !== "Tuple") return undefined;
  const values = (answer[1] as unknown[]).slice(1).map(Number);
  const counts = (answer[2] as unknown[]).slice(1).map(Number);
  if (values.some((v) => !Number.isFinite(v))) return undefined;
  return Object.fromEntries(values.map((v, i) => [v, counts[i]!]));
}

/** Ours on one object of a carrier compared object by object: the statistic's call on the carrier value, as FindStat's `text` reads. */
function ourValue(carrier: string, object: string, head: string): number | string {
  const answer = value(["CombinatorialStat", readObject(carrier, object)!, `'${head}'`]) as unknown;
  return typeof answer === "number" ? answer : String(answer);
}

interface Report {
  /** One label per statistic and size compared in full: a distribution, or every object of the crawl at that size. */
  readonly compared: string[];
  /** The objects read one by one behind the labels `ending in "objects"`. */
  objects: number;
  readonly skipped: string[];
  readonly disagreements: Golden;
}

function sweep(only?: readonly string[]): Report {
  const compared: string[] = [];
  const skipped: string[] = [];
  const disagreements: Golden = {};
  const counts = new Map<string, number>();
  let objectsRead = 0;
  for (const match of findstat) {
    if (!COLLECTIONS[match.on] && !OBJECT_WISE[match.on]) continue;
    if (only && !only.includes(`${match.head}@${match.on}`)) continue;
    for (const id of match.findstat) {
      const bySize = new Map<number, Map<string, number>>();
      const entry = snapshot.items[id];
      if (!entry || COLLECTION_CARRIER[entry.collection] !== match.on) continue;
      for (const [object, v] of pairsOf(id)) {
        const size = objectSize(match.on, object);
        const cap = OBJECT_WISE[match.on] ? objectCap(match.on) : MAX_SIZE;
        if (size === undefined || size > cap || typeof v !== "number") continue;
        (bySize.get(size) ?? bySize.set(size, new Map()).get(size)!).set(object, v);
      }
      for (const [size, objects] of [...bySize].toSorted((a, b) => a[0] - b[0])) {
        const label = `${match.head}@${match.on} ${id} n=${size}`;
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
        const key = `${match.on}:${size}`;
        let ours: Record<string, number> | undefined;
        try {
          if (!counts.has(key)) {
            const [collection, argument] = COLLECTIONS[match.on]!;
            counts.set(key, Number(value(["Count", [collection, argument(size)]])));
          }
          if (objects.size !== counts.get(key)) {
            skipped.push(`${label}: ${objects.size} of ${counts.get(key)} objects`);
            continue;
          }
          ours = ourTally(match.on, size, match.head);
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

const readGolden = (): Golden => (existsSync(GOLDEN) ? (JSON.parse(readFileSync(GOLDEN, "utf8")) as Golden) : {});

/** The pinned disagreements keep their classification; a new one arrives `unclassified`. */
function merge(golden: Golden, found: Golden): Golden {
  return Object.fromEntries(
    Object.entries(found).map(([label, d]) => [
      label,
      golden[label] ? { ...d, kind: golden[label].kind, note: golden[label].note } : d,
    ]),
  );
}

const REPRESENTATIVE = ["Valleys@Permutation", "Peaks@DyckPath", "Blocks@SetPartition", "Leaves@BinaryTree"];

/** The pinned disagreements among the compared sizes (and `heads`, when given): a run that sees them must reproduce them. */
const pinned = (golden: Golden, heads: readonly string[] | undefined, compared: readonly string[]): Golden =>
  Object.fromEntries(
    Object.entries(golden).filter(
      ([label]) => compared.includes(label) && (!heads || heads.some((h) => label.startsWith(`${h} `))),
    ),
  );

function expectPinned(report: Report, heads?: readonly string[]): void {
  const expected = pinned(readGolden(), heads, report.compared);
  expect(Object.keys(report.disagreements).toSorted()).toEqual(Object.keys(expected).toSorted());
  for (const [label, d] of Object.entries(report.disagreements))
    expect({ ours: d.ours, theirs: d.theirs }, label).toEqual({
      ours: expected[label]!.ours,
      theirs: expected[label]!.theirs,
    });
}

test("a handful of statistics agree with FindStat's distributions, or are pinned", () => {
  const report = sweep(REPRESENTATIVE);
  // Each is compared on a size past n = 1, where a distribution says something.
  for (const head of REPRESENTATIVE)
    expect(
      report.compared.some((label) => label.startsWith(`${head} `) && !/n=[01]$/.test(label)),
      head,
    ).toBe(true);
  expectPinned(report, REPRESENTATIVE);
});

test.skipIf(!DEEP)("every adopted statistic against FindStat's distributions, as far as the pairs cover", () => {
  // Without FINDSTAT_CRAWL this is the snapshot's sizes (n <= 3); with it, every size up to DEEP_SIZE (6).
  const report = sweep();
  expect(report.compared.length).toBeGreaterThan(0);
  console.info(
    `findstat distributions: ${report.compared.length} compared, ${Object.keys(report.disagreements).length} disagree, ${report.skipped.length} skipped`,
  );
  // Of the compared labels, those ending in "objects" held every crawl object of that size to its own row.
  console.info(
    `findstat objects: ${report.compared.filter((label) => label.endsWith(" objects")).length} of them object by object, ${report.objects} objects read`,
  );
  if (process.env.UPDATE_FINDSTAT_DISTRIBUTIONS === "1") {
    // Without the crawl only the snapshot's sizes are seen, so pins for the others stay.
    const golden = readGolden();
    const kept = Object.entries(golden).filter(([label]) => !report.compared.includes(label));
    const next = Object.fromEntries([...kept, ...Object.entries(merge(golden, report.disagreements))]);
    writeFileSync(GOLDEN, `${JSON.stringify(next, null, 2)}\n`);
    return;
  }
  expectPinned(report);
});

test("graph statistics agree with FindStat's rows object by object, as far as the snapshot reaches", () => {
  const heads = findstat.filter((m) => OBJECT_WISE[m.on]).map((m) => `${m.head}@${m.on}`);
  const report = sweep(heads);
  expect(report.compared.length).toBeGreaterThan(0);
  expect(report.skipped).toEqual([]);
  expectPinned(
    report,
    heads.map((h) => h.split("@")[0]!),
  );
});
