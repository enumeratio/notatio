// The FindStat coverage report's totals are held to its two sources: FindStat's own ids, and the
// records that cite them.

import { readFileSync } from "node:fs";
import { expect, it } from "vite-plus/test";
import { referenceData } from "../src/node.ts";
import { findstatCoverage } from "../scripts/findstat-coverage.ts";

const data = (file: string) =>
  JSON.parse(
    readFileSync(new URL(`../../symbols/combinatorics/combinatorics/findstat/data/${file}`, import.meta.url), "utf8"),
  ).items as Record<string, unknown>;

const heads = referenceData().heads.map(({ entry }) => entry);
const { collections } = findstatCoverage(heads);
const all = (pick: "statistics" | "maps") =>
  Object.values(collections).flatMap((c) => [...c[pick].checked, ...c[pick].unchecked, ...c[pick].notImplemented]);

it("the buckets partition FindStat's statistics and maps", () => {
  expect(all("statistics").toSorted()).toEqual(Object.keys(data("statistics.json")).toSorted());
  expect(all("maps").toSorted()).toEqual(Object.keys(data("maps.json")).toSorted());
});

it("bound ids are the ones the records cite", () => {
  const cites = new Set(
    heads.flatMap((h) => (h.catalog ?? []).filter((c) => c.system === "findstat").map((c) => c.identity)),
  );
  for (const pick of ["statistics", "maps"] as const) {
    const bound = Object.values(collections).flatMap((c) => [...c[pick].checked, ...c[pick].unchecked]);
    const universe = new Set(all(pick));
    expect(bound.toSorted()).toEqual([...cites].filter((i) => universe.has(i)).toSorted());
  }
});
