import { expect, test } from "vite-plus/test";
import { type Box, DEFAULT_STYLE, layout, makeBoxes, type Metrics } from "../src/index.ts";

const CELLS: Metrics = {
  measure: (s) => ({ advance: Array.from(s).length, ascent: 1, descent: 0 }),
  leaf: () => ({ width: 3, height: 2 }),
  em: 1,
  cell: true,
};

// Text and rules painted on a grid of cells, trailing blanks trimmed.
function draw(json: unknown): { rows: string[]; baseline: number } {
  const list = layout(makeBoxes(json as never) as Box, DEFAULT_STYLE, CELLS);
  const grid = Array.from({ length: list.height }, () => Array.from({ length: list.width }, () => " "));
  for (const item of list.items) {
    if (item.kind === "text") Array.from(item.text).forEach((c, k) => (grid[item.y]![item.x + k] = c));
    if (item.kind === "rule") for (let k = 0; k < item.length; k++) grid[item.y]![item.x + k] = "─";
  }
  return { rows: grid.map((r) => r.join("").trimEnd()), baseline: list.baseline };
}

test("a root of one token has a bar over it", () => {
  expect(draw(["Sqrt", "x"]).rows).toEqual([" ─", "√x"]);
});

test("a longer radicand is under a full-width bar, with no parentheses", () => {
  const { rows, baseline } = draw(["Sqrt", ["Add", "x", 1]]);
  expect(rows).toEqual([" ─────", "√x + 1"]);
  expect(baseline).toBe(2);
});

test("a radical over a fraction gets a tall sign and keeps the fraction's baseline", () => {
  const { rows, baseline } = draw(["Sqrt", ["Divide", 1, ["Add", "x", 1]]]);
  expect(rows).toEqual(["┌───────", "│   1", "│───────", "√ x + 1"]);
  expect(baseline).toBe(3);
});

test("a cube root writes its index small before the sign", () => {
  expect(draw(["Root", "x", 3]).rows).toEqual(["  ─", "³√x"]);
});

test("a radical in a row sits on the row's baseline", () => {
  const { rows } = draw(["Add", 1, ["Sqrt", ["Add", "x", 1]]]);
  expect(rows).toEqual(["     ─────", "1 + √x + 1"]);
});
