import { expect, it } from "vite-plus/test";
import { stripAnsi } from "../src/ansi.ts";
import { Repl } from "../src/core.ts";

const out = (input: string, color = false) => {
  const repl = new Repl({ color });
  repl.session.form = "standardform";
  return repl.eval(input).text;
};

it("Out[n]= sits on a fraction's bar, the other rows indented by the label", () => {
  expect(out("1/(x+1)")).toBe(["           1", "Out[1]= ───────", "         x + 1"].join("\n"));
});

it("Out[n]= sits on a sum's middle row, not its top", () => {
  expect(out("Sum(1/k^2, {k, 1, n})")).toBe(["          n", "Out[1]=   ∑  k⁻²", "        k = 1"].join("\n"));
});

it("indents by the label's visible width under color", () => {
  const styled = out("1/(x+1)", true);
  expect(styled).toContain("\x1b[");
  expect(stripAnsi(styled)).toBe(out("1/(x+1)"));
});

it("a one-line result stays on the label's line", () => {
  expect(out("x + 1")).toBe("Out[1]= x + 1");
});
