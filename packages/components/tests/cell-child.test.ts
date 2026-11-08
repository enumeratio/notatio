// @vitest-environment happy-dom
// A `Cell` written as markup holds its expression as a child, as every head's arguments are; the
// cell reads it as its input, so it agrees with `<notatio-cell value="…">`.

import { expect, test } from "vite-plus/test";

test("a cell with an expression child takes it as its value", async () => {
  const { defineGeneric } = await import("../src/generic.ts");
  await import("../src/notatio-cell.ts");
  defineGeneric("Sin");
  const cell = document.createElement("notatio-cell") as HTMLElement & { value: string };
  cell.innerHTML = "<notatio-sin>x</notatio-sin>";
  document.body.append(cell);
  await expect.poll(() => cell.value).toBe("sin(x)");
  expect(cell.querySelector("notatio-sin")).toBeNull();
  cell.remove();
});

test("a cell with its own value keeps it", async () => {
  await import("../src/notatio-cell.ts");
  const cell = document.createElement("notatio-cell") as HTMLElement & { value: string };
  cell.setAttribute("value", "1 + 1");
  document.body.append(cell);
  expect(cell.value).toBe("1 + 1");
  cell.remove();
});
