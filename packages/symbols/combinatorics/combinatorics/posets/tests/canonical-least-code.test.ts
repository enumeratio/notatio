// The kernel's least code against an independent reading: scripts/least-code.py tried every natural labeling of each
// poset in tests/canonical-least-code.json (posets of 9 and 10 elements) and kept the least code. The fixture is an external
// snapshot, rewritten by `node scripts/collect-canonical-least-code.ts`.
import { readFileSync } from "node:fs";
import { expect, test } from "vite-plus/test";
import { canonicalCode, canonicalPoset, codeOf } from "../src/canonical.ts";

interface Row {
  n: number;
  input: number[][];
  extensions: number;
  code: number;
  canonical: number[][];
}

const { rows } = JSON.parse(readFileSync(new URL("./canonical-least-code.json", import.meta.url), "utf8")) as {
  rows: Row[];
};

test("the fixture holds posets of 9 and 10 elements", () => {
  expect(new Set(rows.map((r) => r.n))).toEqual(new Set([9, 10]));
});

test("the kernel's canonical code is the least over every natural labeling, as the brute force finds it", () => {
  for (const row of rows) expect(canonicalCode(row.input), JSON.stringify(row.input)).toBe(row.code);
});

test("the kernel's canonical form is the poset under that code, and its own code is that code", () => {
  for (const row of rows) {
    expect(canonicalPoset(row.input), JSON.stringify(row.input)).toEqual(row.canonical);
    expect(codeOf(row.canonical)).toBe(row.code);
  }
});
