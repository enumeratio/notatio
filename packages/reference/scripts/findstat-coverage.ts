// FindStat coverage per FindStat collection, for statistics and maps: how many are bound to a
// head's record (a `catalog:` entry), of those how many are checked against FindStat's own
// values, and how many are not implemented. Shared by `collect-findstat-coverage.ts`, which
// writes the report, and the test that holds its totals to the sources.

import { readFileSync } from "node:fs";
import { COLLECTION_CARRIER } from "../../symbols/combinatorics/combinatorics/findstat/src/objects.ts";
import { findstatMaps } from "../../symbols/combinatorics/combinatorics/findstat/src/findstat-maps-data.ts";

const dataDir = new URL("../../symbols/combinatorics/combinatorics/findstat/data/", import.meta.url);
const items = (file: string): Record<string, Record<string, any>> =>
  JSON.parse(readFileSync(new URL(file, dataDir), "utf8")).items;

/** The slice of a loaded head the report reads. */
export interface HeadFacts {
  readonly catalog?: readonly { system: string; identity: string }[];
  readonly examples: readonly { source?: string; known?: unknown }[];
}

export interface Bucket {
  /** Bound to a record and compared with FindStat's values (statistic: a `known` example sourced
   *  from it; map: a table compared on at least one row). */
  readonly checked: readonly string[];
  readonly unchecked: readonly string[];
  readonly notImplemented: readonly string[];
}

export interface CollectionCoverage {
  readonly carrier: string | null;
  readonly statistics: Bucket;
  readonly maps: Bucket;
}

export interface Coverage {
  readonly collections: Readonly<Record<string, CollectionCoverage>>;
}

const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

const bucket = (ids: readonly string[], bound: ReadonlySet<string>, checked: ReadonlySet<string>): Bucket => ({
  checked: ids.filter((i) => bound.has(i) && checked.has(i)).toSorted(cmp),
  unchecked: ids.filter((i) => bound.has(i) && !checked.has(i)).toSorted(cmp),
  notImplemented: ids.filter((i) => !bound.has(i)).toSorted(cmp),
});

/** `St000037` from "FindStat St000037". */
const cited = (source: string | undefined): string | undefined => source?.match(/^FindStat (St\d+)\b/)?.[1];

export function findstatCoverage(heads: readonly HeadFacts[]): Coverage {
  const stats = items("statistics.json");
  const maps = items("maps.json");

  const bound = new Set<string>();
  const known = new Set<string>();
  for (const { catalog, examples } of heads) {
    for (const c of catalog ?? []) if (c.system === "findstat") bound.add(c.identity);
    for (const e of examples) {
      const id = cited(e.source);
      if (id !== undefined && e.known !== undefined) known.add(id);
    }
  }
  const compared = new Set(findstatMaps.flatMap((m) => m.findstat.filter((a) => a.compared > 0).map((a) => a.id)));

  const names = new Set([
    ...Object.values(stats).map((s) => s.collection as string),
    ...Object.values(maps).map((m) => m.domain as string),
  ]);
  const idsIn = (all: Record<string, Record<string, any>>, key: string, name: string) =>
    Object.keys(all).filter((id) => all[id]![key] === name);

  const collections: Record<string, CollectionCoverage> = {};
  for (const name of [...names].toSorted(cmp))
    collections[name] = {
      carrier: COLLECTION_CARRIER[name] ?? null,
      statistics: bucket(idsIn(stats, "collection", name), bound, known),
      maps: bucket(idsIn(maps, "domain", name), bound, compared),
    };
  return { collections };
}

const total = (b: Bucket): number => b.checked.length + b.unchecked.length + b.notImplemented.length;

/** A markdown table, one row per collection (statistics then maps: checked / unchecked / not implemented). */
export function coverageMarkdown({ collections }: Coverage): string {
  const cell = (b: Bucket) => `${b.checked.length} / ${b.unchecked.length} / ${b.notImplemented.length}`;
  const rows = Object.entries(collections).toSorted(
    ([, a], [, b]) => total(b.statistics) + total(b.maps) - total(a.statistics) - total(a.maps),
  );
  return [
    "# FindStat coverage",
    "",
    "Each cell: bound and checked / bound, unchecked / not implemented.",
    "",
    "| Collection | Carrier | Statistics | Maps |",
    "| --- | --- | --- | --- |",
    ...rows.map(([n, c]) => `| ${n} | ${c.carrier ?? ""} | ${cell(c.statistics)} | ${cell(c.maps)} |`),
    "",
  ].join("\n");
}
