// FindStat lists posets and lattices up to isomorphism, one object each. Every object, read as a naturally labeled poset,
// canonicalizes to a member of `Posets(n)`: the snapshot holds every object to 5 elements, and a deep run with the crawl
// (`FINDSTAT_CRAWL`, the crawl's `StatisticsDatabase` directory) reads every one through 7.
import { existsSync, readFileSync } from "node:fs";
import { expect, test } from "vite-plus/test";
import { canonicalPoset, codeOf, isPosetMember, posetCodes, type Poset } from "../../posets/src/canonical.ts";
import { COLLECTION_CARRIER, objectSize, readObject } from "../src/objects.ts";

const DEEP = process.env.DEEP_TESTS === "1";
const CRAWL = process.env.FINDSTAT_CRAWL;
/** The largest object read: the standard run takes what the snapshot holds, a deep run with the crawl goes to 7. */
const LARGEST = DEEP && CRAWL ? 7 : 5;

interface Snapshot {
  readonly items: Readonly<Record<string, { collection: string; sample: readonly [string, number][] }>>;
}
const snapshot = JSON.parse(readFileSync(new URL("../data/statistics.json", import.meta.url), "utf8")) as Snapshot;

/** The objects of one statistic: the whole crawl when there is one in a deep run, else the snapshot's sample. */
function objectsOf(id: string): readonly string[] {
  if (DEEP && CRAWL && existsSync(`${CRAWL}/${id}.json`)) {
    const data = JSON.parse(readFileSync(`${CRAWL}/${id}.json`, "utf8")) as { StatisticData: Record<string, number> };
    return Object.keys(data.StatisticData);
  }
  return snapshot.items[id]?.sample.map(([text]) => text) ?? [];
}

/** The lower covers a read `Poset` holds. */
const coversOf = (json: unknown): Poset => {
  const [, rows] = json as [string, [string, ...[string, ...number[]][]]];
  return rows.slice(1).map((row) => (row as unknown as unknown[]).slice(1) as number[]);
};

const ids = Object.entries(snapshot.items)
  .filter(([, item]) => COLLECTION_CARRIER[item.collection] === "Poset")
  .map(([id]) => id);

test("the snapshot has FindStat's poset and lattice statistics", () => {
  expect(ids.length).toBeGreaterThan(0);
  expect(new Set(ids.map((id) => snapshot.items[id]!.collection))).toEqual(new Set(["Posets", "Lattices"]));
});

test("every FindStat poset and lattice canonicalizes to a member of Posets(n)", () => {
  const seen = new Set<string>();
  let read = 0;
  for (const id of ids)
    for (const text of objectsOf(id)) {
      const size = objectSize("Poset", text);
      if (size === undefined || size > LARGEST || seen.has(text)) continue;
      seen.add(text);
      const value = coversOf(readObject("Poset", text));
      const canonical = canonicalPoset(value);
      expect([text, isPosetMember(canonical, size)]).toEqual([text, true]);
      // Canonicalizing keeps the isomorphism class: the canonical form has the least code of the natural labelings.
      expect([text, codeOf(canonical) <= codeOf(value)]).toEqual([text, true]);
      expect(posetCodes(size)).toContain(codeOf(canonical));
      read++;
    }
  expect(read).toBeGreaterThan(0);
  console.info(`findstat posets: ${read} objects canonicalized, to ${LARGEST} elements`);
});
