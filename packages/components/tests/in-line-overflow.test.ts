import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";

// A reference page must not scroll sideways at phone width because one In line is wider than the
// column (BL-638). The layout itself needs a browser; this holds the rules that make it hold.
const read = (path: string): string => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");

const rule = (css: string, selector: string): string => {
  const at = css.indexOf(`${selector} {`);
  expect(at, selector).toBeGreaterThanOrEqual(0);
  return css.slice(at, css.indexOf("}", at));
};

test("a typeset In line scrolls in its own box and may shrink below its content", () => {
  const body = rule(read("../src/styles.ts"), "notatio-in .notatio-static");
  expect(body).toContain("overflow-x: auto");
  expect(body).toContain("min-width: 0");
  expect(rule(read("../src/styles.ts"), "notatio-in")).toContain("min-width: 0");
});

test("the reference page's prerendered In and Out share a column that can shrink", () => {
  const page = read("../../../web/.vitepress/theme/components/ReferencePage.vue");
  expect(rule(page, ".ref-prerendered")).toContain("minmax(0, 1fr)");
  const cell = rule(page, ".ref-prerendered > span:not(.ref-io-label)");
  expect(cell).toContain("overflow-x: auto");
  expect(cell).toContain("min-width: 0");
});
