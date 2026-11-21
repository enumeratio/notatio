import { expect, test } from "vite-plus/test";
import { renderSummary } from "../src/typeset.ts";

// Summaries as the records write them.
const PLAIN = "The order of a group element, the least n ≥ 1 with the identity, or Infinity when there is none.";
const ISLANDS = "The value of a continued fraction given its list of terms $[a_0, a_1, \\ldots]$.";
const SET =
  "The subsets of $\\{1, \\dots, n\\}$ containing no two consecutive integers. Count is the Fibonacci number $F(n+2)$.";
const LINKED =
  "The subsets of $\\{1, \\dots, n\\}$ of odd size: the other half of [[Subsets]], $2^{n-1}$ of them for $n \\ge 1$.";

test("a summary with no island is its text", () => {
  expect(renderSummary(PLAIN)).toBe(PLAIN);
});

test("islands are typeset by KaTeX", () => {
  const html = renderSummary(ISLANDS);
  expect(html.startsWith('The value of a continued fraction given its list of terms <span class="katex">')).toBe(true);
  expect(html.endsWith("</span>.")).toBe(true);
  expect(html).not.toContain("katex-error");
});

test("braces and \\dots in an island typeset, and every island on the line is read", () => {
  const html = renderSummary(SET);
  expect(html.match(/class="katex"/g)).toHaveLength(2);
  expect(html).not.toContain("katex-error");
  expect(html).toContain("containing no two consecutive integers.");
});

test("a [[Head]] links when asked and stays text otherwise", () => {
  expect(renderSummary(LINKED)).not.toContain("<a ");
  expect(renderSummary(LINKED, { link: (head) => `/reference/symbol/${head}` })).toContain(
    '<a href="/reference/symbol/Subsets"',
  );
});

test("code spans and emphasis are read", () => {
  expect(renderSummary("Use `Foo` for *bar*.")).toContain("<code>Foo</code>");
  expect(renderSummary("Use `Foo` for *bar*.")).toContain("<em>bar</em>");
});

test("an island KaTeX cannot parse comes out as its source, marked, and nothing throws", () => {
  const html = renderSummary("Before $\\frac{$ after.");
  expect(html).toContain("katex-error");
  expect(html.startsWith("Before ")).toBe(true);
  expect(html.endsWith(" after.")).toBe(true);
  expect(() => renderSummary("$\\badcommand{x}$ and $$ and $x")).not.toThrow();
});

test("text outside the islands is escaped", () => {
  const html = renderSummary("a < b & c > d, <script>x</script> $x<y$");
  expect(html).toContain("a &lt; b &amp; c &gt; d, &lt;script&gt;x&lt;/script&gt;");
  expect(html).not.toContain("<script>");
});
