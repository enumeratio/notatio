// Graph statistics against FindStat's rows, object by object (see `crosscheck-sweep.ts`), apart from the
// distributions so a second worker runs them alongside.
import { expect, test } from "vite-plus/test";
import { findstat } from "../src/findstat-data.ts";
import { DEEP, OBJECT_WISE, expectPinned, sweep, updateGolden } from "./crosscheck-sweep.ts";

const graphHeads = [...new Set(findstat.filter((m) => OBJECT_WISE[m.on]).map((m) => m.head))];

function check(heads: readonly string[]): void {
  const report = sweep(
    heads.flatMap((h) => findstat.filter((m) => m.head === h && OBJECT_WISE[m.on]).map((m) => `${h}@${m.on}`)),
  );
  expect(report.compared.length).toBeGreaterThan(0);
  expect(report.skipped).toEqual([]);
  console.info(
    `findstat graphs (${heads.length > 1 ? "the rest" : heads[0]}): ${report.compared.length} compared, ${Object.keys(report.disagreements).length} disagree, ${report.objects} objects read`,
  );
  if (DEEP && process.env.UPDATE_FINDSTAT_DISTRIBUTIONS === "1") return updateGolden(report);
  expectPinned(report, heads);
}

test("graph statistics agree with FindStat's rows object by object, as far as the snapshot reaches", () =>
  check(graphHeads));
