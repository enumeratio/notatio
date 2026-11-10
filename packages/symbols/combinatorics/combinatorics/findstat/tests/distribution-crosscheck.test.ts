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
// only when the set of disagreements changes. Graphs, compared object by object, are in `graph-crosscheck.test.ts`. Regenerate with UPDATE_FINDSTAT_DISTRIBUTIONS=1.

import { expect, test } from "vite-plus/test";
import { DEEP, REPRESENTATIVE, expectPinned, sweep, updateGolden } from "./crosscheck-sweep.ts";

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

test.skipIf(!DEEP)(
  "every adopted statistic (graphs: see graph-crosscheck.test.ts) against FindStat's distributions, as far as the pairs cover",
  () => {
    // Without FINDSTAT_CRAWL this is the snapshot's sizes (n <= 3); with it, every size up to DEEP_SIZE (6).
    const report = sweep(undefined, false);
    expect(report.compared.length).toBeGreaterThan(0);
    console.info(
      `findstat distributions: ${report.compared.length} compared, ${Object.keys(report.disagreements).length} disagree, ${report.skipped.length} skipped`,
    );
    if (process.env.UPDATE_FINDSTAT_DISTRIBUTIONS === "1") {
      updateGolden(report);
      return;
    }
    expectPinned(report);
  },
);
