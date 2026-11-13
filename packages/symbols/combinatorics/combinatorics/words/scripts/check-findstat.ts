// Check binary-word statistics against EVERY FindStat row in a local crawl of its
// StatisticsDatabase (read-only, outside the repo).
//
//   vp node packages/symbols/combinatorics/combinatorics/words/scripts/check-findstat.ts <crawl>/StatisticsDatabase [Head=St000105 ...]
//
// With no pairs, checks every binary-word match in `findstat-data.ts`. Prints rows checked and any disagreement.

import { readFileSync } from "node:fs";
import { bareEngine } from "@notatio/engine/testing";
import { applyDefinition } from "../../src/statistics/declare.ts";
import { bySignature } from "../../src/statistics/types.ts";
import { findstat } from "../../findstat/src/findstat-data.ts";
import { WORD_STATISTICS } from "../src/statistics.ts";

/** Our head -> FindStat ids, from the generated matches (`find-findstat.ts`), so there is one list. */
const MATCHES: Record<string, string[]> = Object.fromEntries(
  findstat.filter((m) => m.on === "BinaryWord").map((m) => [m.head, [...m.findstat]]),
);

const [dir, ...pairs] = process.argv.slice(2);
if (!dir) throw new Error("usage: check-findstat.ts <StatisticsDatabase dir> [Head=StId ...]");
const targets: Record<string, string[]> = pairs.length
  ? Object.fromEntries(pairs.map((p) => p.split("=") as [string, string]).map(([head, id]) => [head, [id]]))
  : MATCHES;

const ce = bareEngine();
const index = bySignature(WORD_STATISTICS);

for (const [head, ids] of Object.entries(targets)) {
  const definition = index.get(`${head}@BinaryWord`);
  if (!definition) throw new Error(`no definition ${head}`);
  for (const id of ids) {
    const data = (JSON.parse(readFileSync(`${dir}/${id}.json`, "utf8")) as { StatisticData: Record<string, number> })
      .StatisticData;
    let rows = 0;
    const bad: string[] = [];
    for (const [key, value] of Object.entries(data)) {
      // FindStat writes a word as its letters: 0110.
      const ours = applyDefinition(ce, definition, ce.box(["List", ...key.split("").map(Number)] as never)).re;
      rows++;
      if (ours !== value) bad.push(`${key}: ours ${ours}, FindStat ${value}`);
    }
    const verdict = bad.length ? `DISAGREE ${bad.length}\n  ${bad.slice(0, 3).join("\n  ")}` : "ok";
    console.log(`${head} ${id} ${rows} rows: ${verdict}`);
  }
}
