// @vitest-environment happy-dom
// An element written in its own attributes is already lowered: `adoptStructure` leaves its
// `in-form="input"` alone rather than reading it as the Wolfram option `InForm -> Input`.

import { expect, test } from "vite-plus/test";
import { adoptStructure } from "../src/structure.ts";

test("a cell written with its own value keeps in-form and expect as written", () => {
  const cell = document.createElement("notatio-cell");
  cell.setAttribute("value", "1 + 1");
  cell.setAttribute("in-form", "input");
  cell.setAttribute("expect", "2");
  document.body.append(cell);
  adoptStructure(cell);
  expect(cell.getAttribute("in-form")).toBe("input");
  expect(cell.getAttribute("expect")).toBe("2");
  cell.remove();
});
