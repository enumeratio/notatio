// FindStat's own data (https://www.findstat.org, each statistic's and map's published JSON),
// as a committed snapshot.
//
//   node packages/reference/scripts/collect-findstat-data.ts [--crawl DIR]
//
// Reads a crawl of those JSON files (the crawl itself is too big to commit; the site asks
// crawlers for a 20 s delay, and we ask its maintainers before crawling again) and writes
// `findstat/data/{statistics,maps}.json` in the combinatorics package: for every id its
// collection, title, description, properties and a few of the smallest (object, value) rows
// (every row up to a size for a collection held object by object, `OBJECT_WISE_THROUGH`).
//
// Each area's generated statistic records (`areaStatisticsEntries`) read the snapshot for the
// FindStat rows they hold as `known` examples.

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: { crawl: { type: "string", default: join(homedir(), "Playground/@enumeratio/findstat-crawl") } },
});

const DATA = new URL("../../symbols/combinatorics/combinatorics/findstat/data/", import.meta.url).pathname;

/** Attribution that travels with the data. */
const SOURCE = {
  source: "https://www.findstat.org",
  note: "FindStat, the combinatorial statistic finder; each entry is its own page there.",
};

const readJson = (file: string): any => JSON.parse(readFileSync(file, "utf8"));

/** The smallest objects first (by text length, then order), so a sample is short and stable. */
function smallest(data: Record<string, unknown>, n: number): [string, unknown][] {
  return Object.entries(data)
    .toSorted((a, b) => a[0].length - b[0].length || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .slice(0, n);
}

/**
 * The collections FindStat lists up to isomorphism and the crosscheck holds to their rows object by object: every row up to
 * a size (the count of elements or vertices, the last number of the object's spelling) is kept, not a few, so a statistic is checked on
 * more than the antichains.
 */
const OBJECT_WISE_THROUGH: Readonly<Record<string, number>> = { Graphs: 5, Posets: 5, Lattices: 6 };

/** The rows of `data` a statistic of `collection` keeps: all rows up to the collection's size where it is held object by object, else the smallest few. */
function sampleOf(collection: string, data: Record<string, unknown>): [string, unknown][] {
  const through = OBJECT_WISE_THROUGH[collection];
  if (through === undefined) return smallest(data, 8);
  return smallest(
    Object.fromEntries(Object.entries(data).filter(([object]) => Number(/,(\d+)\)$/.exec(object)?.[1]) <= through)),
    Infinity,
  );
}

/** The first paragraph, trimmed: a description's gist, with the page for the rest. */
const gist = (text: string, max = 400): string => {
  const first = text
    .replace(/\r/g, "")
    .split(/\n\s*\n/)[0]!
    .trim();
  return first.length > max ? `${first.slice(0, max - 1).trimEnd()}…` : first;
};

mkdirSync(DATA, { recursive: true });
const kinds = [
  ["StatisticsDatabase", "statistics", "Statistic"],
  ["MapsDatabase", "maps", "Map"],
] as const;
for (const [dir, out, prefix] of kinds) {
  const folder = join(values.crawl!, dir);
  const items: Record<string, unknown> = {};
  for (const file of readdirSync(folder)
    .filter((f) => f.endsWith(".json"))
    .toSorted()) {
    const raw = readJson(join(folder, file));
    const id = file.replace(/\.json$/, "");
    const description = gist(String(raw[`${prefix}Description`] ?? ""));
    items[id] =
      prefix === "Statistic"
        ? {
            collection: raw.StatisticCollection,
            title: raw.StatisticTitle,
            description,
            sample: sampleOf(raw.StatisticCollection, raw.StatisticData ?? {}),
          }
        : {
            domain: raw.MapDomain,
            codomain: raw.MapCodomain,
            title: raw.MapTitle,
            properties: String(raw.MapProperties ?? "")
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean),
            description,
            sample: smallest(raw.MapData ?? {}, 4),
          };
  }
  writeFileSync(join(DATA, `${out}.json`), `${JSON.stringify({ ...SOURCE, items })}\n`);
  console.log(`${out}: ${Object.keys(items).length}`);
}
