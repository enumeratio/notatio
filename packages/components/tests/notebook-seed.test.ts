// @vitest-environment happy-dom
// A notebook opens from its seed, transient or not, and a seed set late fills only an untouched one.

import { beforeAll, expect, test } from "vite-plus/test";

type Notebook = HTMLElement & { seed: string; updateComplete: Promise<boolean>; _cells: { value: string }[] };

beforeAll(async () => {
  await import("../src/notatio-notebook.ts");
}, 60_000);

const mount = (attributes: Record<string, string> = {}): Notebook => {
  const nb = document.createElement("notatio-notebook") as Notebook;
  for (const [name, value] of Object.entries(attributes)) nb.setAttribute(name, value);
  document.body.append(nb);
  return nb;
};
const sources = (nb: Notebook): string[] => nb._cells.map((c) => c.value);

test("a transient notebook opens the seed's cells and a trailing blank", async () => {
  const nb = mount({ transient: "", seed: '["1+1","2+2"]' });
  await nb.updateComplete;
  expect(sources(nb)).toEqual(["1+1", "2+2", ""]);
  nb.remove();
});

test("a seed set late seeds a notebook nothing has been typed in", async () => {
  const nb = mount({ transient: "" });
  await nb.updateComplete;
  expect(sources(nb)).toEqual([""]);
  nb.seed = '["x"]';
  await nb.updateComplete;
  expect(sources(nb)).toEqual(["x", ""]);
  nb.remove();
});

test("a seed set late never replaces typed cells", async () => {
  const nb = mount({ transient: "" });
  await nb.updateComplete;
  nb._cells = [{ id: 1, value: "typed" } as never, { id: 2, value: "" } as never];
  await nb.updateComplete;
  nb.seed = '["x"]';
  await nb.updateComplete;
  expect(sources(nb)).toEqual(["typed", ""]);
  nb.remove();
});
