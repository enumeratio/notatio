// A FindStat id is carried by exactly one head per carrier, and that head is the one the crawl
// verdicts (`findstat-data.ts`, `findstat-maps-data.ts`) check the id against.

import { describe, expect, it } from "vite-plus/test";
import { referenceData } from "../src/node.ts";
import { wanted } from "../scripts/findstat-catalog.ts";

const key = (id: string, on: string) => `${id} on ${on}`;

const carriers = new Map<string, Set<string>>();
for (const e of referenceData().entries)
  for (const c of e.catalog ?? [])
    if (c.system === "findstat" && c.on !== undefined) {
      const k = key(c.identity, c.on);
      carriers.set(k, (carriers.get(k) ?? new Set()).add(e.name));
    }

describe("a FindStat id has one head per carrier", () => {
  it("no id and carrier sits on two records", () => {
    const found = Object.fromEntries(
      [...carriers].map(([k, heads]) => [k, [...heads].toSorted()] as const).filter(([, heads]) => heads.length > 1),
    );
    expect(found).toEqual({});
  });

  it("the carrying head is the one the verdicts check", () => {
    const checked = new Map<string, Set<string>>();
    for (const r of wanted()) checked.set(key(r.id, r.on), (checked.get(key(r.id, r.on)) ?? new Set()).add(r.head));
    const off = Object.fromEntries(
      [...checked]
        .map(([k, v]) => [k, [...(carriers.get(k) ?? [])].filter((h) => !v.has(h)).toSorted()] as const)
        .filter(([, extra]) => extra.length > 0),
    );
    expect(off).toEqual({});
  });
});
