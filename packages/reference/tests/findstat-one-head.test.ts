// A FindStat id is carried by exactly one head per carrier, and that head is the one the crawl
// verdicts (`findstat-data.ts`, `findstat-maps-data.ts`) check the id against.

import { describe, expect, it } from "vite-plus/test";
import { referenceData } from "../src/node.ts";
import { wanted } from "../scripts/findstat-catalog.ts";

/** Ids still on a head the verdicts don't check, awaiting a ruling: `"<id> on <carrier>"` to its
 *  heads. A golden that only shrinks; never add a row. */
const UNDECIDED: Readonly<Record<string, readonly string[]>> = {
  // The verdicts check each head against the id, so these are aliases or equal-valued heads, not leftovers.
  "St000011 on DyckPath": ["Returns", "TouchPointCount"],
  "St000159 on IntegerPartition": ["ConjugateDistinctParts", "Corners", "DistinctParts"],
  "St000485 on Permutation": ["LargestCycleLength", "LongestCycleLength"],
};

const key = (id: string, on: string) => `${id} on ${on}`;

const carriers = new Map<string, Set<string>>();
for (const e of referenceData().entries)
  for (const c of e.catalog ?? [])
    if (c.system === "findstat" && c.on !== undefined) {
      const k = key(c.identity, c.on);
      carriers.set(k, (carriers.get(k) ?? new Set()).add(e.name));
    }

describe("a FindStat id has one head per carrier", () => {
  it("no id and carrier sits on two records, outside the pinned list", () => {
    const found = Object.fromEntries(
      [...carriers]
        .map(([k, heads]) => [k, [...heads].toSorted()] as const)
        .filter(([k, heads]) => heads.length > 1 && heads.join() !== UNDECIDED[k]?.join()),
    );
    expect(found).toEqual({});
  });

  it("the carrying head is the one the verdicts check", () => {
    const checked = new Map<string, Set<string>>();
    for (const r of wanted()) checked.set(key(r.id, r.on), (checked.get(key(r.id, r.on)) ?? new Set()).add(r.head));
    const off = Object.fromEntries(
      [...checked]
        .map(([k, v]) => [k, [...(carriers.get(k) ?? [])].filter((h) => !v.has(h)).toSorted()] as const)
        .filter(([k, extra]) => extra.length > 0 && UNDECIDED[k] === undefined),
    );
    expect(off).toEqual({});
  });

  it("the pinned list only holds live rows", () => {
    const stale = Object.keys(UNDECIDED).filter((k) => (carriers.get(k)?.size ?? 0) < 2);
    expect(stale).toEqual([]);
  });
});
