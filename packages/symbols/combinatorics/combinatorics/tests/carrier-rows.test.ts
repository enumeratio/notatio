// A head takes a carrier the table answers for (`Descents(Word(...))`, `Shape(StandardTableau(...))`) through
// a typed row of its own, and the row, the table and FindStat's own samples all agree.

import { readFileSync } from "node:fs";
import { bareEngine } from "@notatio/engine/testing";
import { declareStructures } from "@notatio/structures";
import { expect, test } from "vite-plus/test";
import { CARRIERS, declareCombinatorics, declareMaps } from "../src/index.ts";
import { HEAD_ROWS } from "../src/maps.ts";
import { SHARED_ROWS } from "../src/statistics/share.ts";
import { findstat } from "../findstat/src/findstat-data.ts";
import { readObject } from "../findstat/src/objects.ts";

const ce = bareEngine();
declareStructures(ce);
declareCombinatorics(ce);
declareMaps(ce, Object.fromEntries(CARRIERS.map((c) => [c.type, c.name])));
const value = (json: unknown) => ce.box(json as never).evaluate().json;
const approximate = (json: unknown) => ce.box(json as never).N().json;
const DEEP = process.env.DEEP_TESTS === "1";

const L = (...items: unknown[]) => ["List", ...items];
/** Contents of one object per carrier the shared statistics reach. */
const CONTENTS: Readonly<Record<string, unknown[]>> = {
  Arrangement: [L(2, 5, 1), L(1, 3)],
  BinaryWord: [L(0, 1, 1, 0, 1)],
  Endofunction: [L(1, 1, 3, 2)],
  ParkingFunction: [L(1, 1, 2, 4)],
  PerfectMatching: [L(L(1, 4), L(2, 3), L(5, 6)), L(L(1, 3), L(2, 5), L(4, 6))],
  PermutationInversion: [L(0, 1, 1, 0)],
  SetComposition: [L(L(2, 3), L(1), L(4))],
  SignedPermutation: [L(-2, 1, 3, -4)],
  SubexcedantSeq: [L(0, 1, 1, 3)],
  Surjection: [L(2, 1, 3, 1)],
  WeakComposition: [L(3, 0, 1)],
  Word: [L(1, 3, 3, 2, 1)],
};

// The standard run takes one statistic per carrier and its first sample, evaluated: each statistic's first call is
// slow. The deep run takes every row and sample, and approximates too.
const ROWS = DEEP
  ? SHARED_ROWS
  : SHARED_ROWS.filter((row, i) => SHARED_ROWS.findIndex((other) => other.carrier === row.carrier) === i);

test("a shared statistic's bare head answers as its table does", () => {
  for (const { head, carrier } of ROWS) {
    const samples = CONTENTS[carrier];
    expect(samples, `a sample for ${carrier}`).toBeDefined();
    for (const contents of DEEP ? samples! : samples!.slice(0, 1)) {
      const subject = [carrier, contents];
      const table = value(["CombinatorialStat", subject, `'${head}'`]);
      expect(typeof table, `${head} on ${carrier} is answered by its table`).toBe("number");
      expect(value([head, subject]), `${head}(${carrier})`).toEqual(table);
      if (DEEP) expect(approximate([head, subject]), `${head}(${carrier}).N()`).toEqual(table);
    }
  }
});

interface Snapshot {
  readonly items: Readonly<Record<string, { sample: readonly [string, number][] }>>;
}
const statistics = JSON.parse(
  readFileSync(new URL("../findstat/data/statistics.json", import.meta.url), "utf8"),
) as Snapshot;
const maps = JSON.parse(readFileSync(new URL("../findstat/data/maps.json", import.meta.url), "utf8")) as {
  items: Record<string, { sample: readonly [string, string][] }>;
};

test("a shared statistic's bare head gives FindStat's value on each sample object", () => {
  const rows = new Set(ROWS.map(({ head, carrier }) => `${head}@${carrier}`));
  let checked = 0;
  for (const match of findstat.filter((m) => rows.has(`${m.head}@${m.on}`)))
    for (const id of match.findstat)
      for (const [text, expected] of statistics.items[id]?.sample ?? []) {
        const subject = readObject(match.on, text);
        if (subject === undefined) continue;
        expect(value([match.head, subject]), `${match.head} on ${match.on} ${text} (${id})`).toEqual(expected);
        checked++;
      }
  expect(checked).toBeGreaterThan(DEEP ? 50 : 3);
});

// FindStat's map ids behind each head row, by (head, carrier): the shape of a tableau, of a semistandard tableau and
// of a set partition, and the conjugate tableau.
const MAP_IDS: Readonly<Record<string, string>> = {
  "Shape@StandardTableau": "Mp00083",
  "Shape@SemistandardTableau": "Mp00077",
  "Shape@SetPartition": "Mp00079",
  "Transpose@StandardTableau": "Mp00084",
};
const TARGET: Readonly<Record<string, string>> = {
  integer_partition: "IntegerPartition",
  standard_tableau: "StandardTableau",
};

test("a head row answers as its map does, and as FindStat's samples", () => {
  expect(HEAD_ROWS.map(({ head, carrier }) => `${head}@${carrier}`).toSorted()).toEqual(
    Object.keys(MAP_IDS).toSorted(),
  );
  for (const row of HEAD_ROWS) {
    const id = MAP_IDS[`${row.head}@${row.carrier}`]!;
    const samples = maps.items[id]?.sample ?? [];
    expect(samples.length, id).toBeGreaterThan(3);
    for (const [from, to] of samples) {
      const subject = readObject(row.carrier, from);
      const expected = readObject(TARGET[row.returns]!, to);
      if (subject === undefined || expected === undefined) continue;
      const answer = value([row.head, subject]);
      expect(answer, `${row.head} on ${row.carrier} ${from} (${id})`).toEqual(value(expected));
      expect(answer).toEqual(value(["CombinatorialMap", subject, `'${row.name}'`]));
    }
  }
});

test("a head still answers what it did before the rows", () => {
  expect(value(["Reverse", L(1, 2, 3)])).toEqual(["Reverse", L(1, 2, 3)]);
  expect(value(["Descents", L(1, 3, 2)])).toEqual(1);
  expect(value(["Sum", L(1, 3, 2)])).toEqual(6);
});
