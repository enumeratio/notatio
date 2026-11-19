// Poset statistics against FindStat's rows, object by object (see `crosscheck-sweep.ts`): FindStat lists posets up to
// isomorphism, so each object is read as a naturally labeled poset, the statistic evaluated on it, and the value held to the
// object's row. The snapshot holds every Posets row to 5 elements and every Lattices row to 7; a deep run with the crawl
// (`FINDSTAT_CRAWL`) reads to 7.
import { expect, test } from "vite-plus/test";
import { LATTICE_STATISTICS } from "../../posets/src/statistics.lattices.ts";
import { findstat } from "../src/findstat-data.ts";
import { sweep } from "./crosscheck-sweep.ts";

const latticeHeads = new Set(LATTICE_STATISTICS.map((d) => d.head));
const matches = findstat.filter((m) => m.on === "Poset" && !latticeHeads.has(m.head));
const lattices = findstat.filter((m) => m.on === "Poset" && latticeHeads.has(m.head));

test("poset statistics agree with FindStat's rows object by object, as far as the snapshot reaches", () => {
  expect(matches.length).toBeGreaterThan(0);
  const report = sweep(matches.map((m) => `${m.head}@${m.on}`));
  expect(report.skipped).toEqual([]);
  expect(report.disagreements).toEqual({});
  for (const { head } of matches) {
    const labels = report.compared.filter((label) => label.startsWith(`${head}@Poset `));
    expect(labels.length, head).toBeGreaterThan(0);
    expect(
      labels.some((label) => label.includes(" n=5 ")),
      `${head} reaches 5 elements`,
    ).toBe(true);
  }
  console.info(`findstat posets: ${report.compared.length} compared, ${report.objects} objects read`);
});

test("lattice statistics agree with FindStat's rows object by object, to 7 elements", () => {
  expect(lattices.length).toBe(LATTICE_STATISTICS.length - 1);
  const report = sweep(lattices.map((m) => `${m.head}@${m.on}`));
  expect(report.skipped).toEqual([]);
  expect(report.disagreements).toEqual({});
  for (const { head } of lattices) {
    const labels = report.compared.filter((label) => label.startsWith(`${head}@Poset `));
    expect(labels.length, head).toBeGreaterThan(0);
    expect(
      labels.some((label) => label.includes(" n=7 ")),
      `${head} reaches 7 elements`,
    ).toBe(true);
  }
  // The domain is where FindStat has rows: no row is declined.
  expect(Object.entries(report.declined).filter(([, count]) => count > 0)).toEqual([]);
  console.info(`findstat lattices: ${report.compared.length} compared, ${report.objects} objects read`);
});
