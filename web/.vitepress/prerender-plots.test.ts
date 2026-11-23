// A page that writes a `Show` of plots, a plot with an `Epilog` or `Prolog`, or a lone `Graphics` has
// each prerendered, so the build exercises those branches of the plot sampler: this fails if one stops.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, vi } from "vite-plus/test";
import { fillMarkup } from "./data/prerender-markup.ts";
import { type MarkupSpec, prerenderMarkup, specsFile } from "./prerender-markup.ts";
import { HYDRATED_ATTRIBUTE } from "./theme/hydration.ts";

type Rule = (state: { tokens: { type: string; content: string }[]; env: Record<string, unknown> }) => void;

const DOC = resolve(import.meta.dirname, "../../packages/components/docs/controls.md");
const PAGE = "prerender-plots-test.md";

// The values of the elements the page writes whose picture the build drew: marked as the build marks
// them, then filled as it fills them.
const drawn = async (): Promise<string[]> => {
  let rule: Rule | undefined;
  prerenderMarkup({ core: { ruler: { push: (_name: string, fn: Rule) => void (rule = fn) } } } as never);
  const tokens = [{ type: "html_block", content: readFileSync(DOC, "utf8") }];
  rule!({ tokens, env: { relativePath: PAGE } });
  // The page's compiler turns a placeholder component into the span the build fills.
  const placed = tokens[0]!.content.replace(
    /<NotatioPrerendered :at="(\d+)" \/>/g,
    (_, at: string) => `<span class="notatio-prerendered" data-prerender="${at}" ${HYDRATED_ATTRIBUTE}></span>`,
  );
  const html = await fillMarkup(placed, PAGE);
  const specs = JSON.parse(readFileSync(specsFile(PAGE), "utf8")) as MarkupSpec[];
  return specs
    .filter((spec) =>
      html.includes(`data-prerender="${spec.at}" ${HYDRATED_ATTRIBUTE}><span class="graphics-box-plot">`),
    )
    .map((spec) => spec.attributes["value"]!);
};

test("the docs have a Show of plots, a plot with marks, and a lone Graphics, each prerendered", async () => {
  const values = await drawn();
  expect(values.some((v) => /^\s*Show\s*\(\s*Plot\s*\(/.test(v))).toBe(true);
  expect(values.some((v) => /^\s*Plot\s*\(/.test(v) && /\bProlog\b/.test(v) && /\bEpilog\b/.test(v))).toBe(true);
  expect(values.some((v) => /^\s*Graphics\s*\(/.test(v))).toBe(true);
}, 120_000);

// A page that writes the one plot `value`, built as the site builds it: the HTML its element holds.
const built = async (value: string): Promise<string> => {
  let rule: Rule | undefined;
  prerenderMarkup({ core: { ruler: { push: (_name: string, fn: Rule) => void (rule = fn) } } } as never);
  const tokens = [{ type: "html_block", content: `<graphics-box value='${value}' />` }];
  const page = "prerender-plots-declined-test.md";
  rule!({ tokens, env: { relativePath: page } });
  const placed = tokens[0]!.content.replace(
    /<NotatioPrerendered :at="(\d+)" \/>/g,
    (_, at: string) => `<span class="notatio-prerendered" data-prerender="${at}" ${HYDRATED_ATTRIBUTE}></span>`,
  );
  return fillMarkup(placed, page);
};

// 2 / Csch(x) is 2 sinh x; compiled, its reciprocal is dropped, so compiling declines it.
test("a plot item that declines to compile is prerendered, sampled by the engine", async () => {
  const html = await built("Plot(2 / Csch(x), (x, -2, 2), PlotRange -> (-8, 8))");
  expect(html).toContain(`${HYDRATED_ATTRIBUTE}><span class="graphics-box-plot">`);
}, 120_000);

// An item the engine cannot sample either (here an extra argument the engine reads as invalid) leaves
// the plot live, and says why, rather than drawing it blank.
test("a plot item that cannot be sampled either way stays live, and the build logs why", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const html = await built("Plot(Sin(x, 2), (x, -2, 2))");
  expect(html).not.toContain("graphics-box-plot");
  expect(warn).toHaveBeenCalledWith(expect.stringMatching(/left live.*cannot be interpreted/));
  warn.mockRestore();
}, 120_000);
