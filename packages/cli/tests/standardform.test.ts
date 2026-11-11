import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterAll, expect, it } from "vite-plus/test";
import { stripAnsi } from "../src/ansi.ts";
import { runCommand } from "../src/command.ts";
import { renderForm, Session } from "../src/engine.ts";

// The drawing, not a head's value, so a golden. Regenerate with `UPDATE_STANDARDFORM=1 vp test`.
const GOLDEN = fileURLToPath(new URL("./standardform.golden.json", import.meta.url));
const updating = process.env.UPDATE_STANDARDFORM === "1";
const golden: Record<string, string> = updating ? {} : JSON.parse(readFileSync(GOLDEN, "utf8"));
const fresh: Record<string, string> = {};

const session = new Session();
const draw = (input: string, color = false) => renderForm(session.parse(input).raw, "standardform", { color });

const CASES: Record<string, string> = {
  powers: "x^2 + y^3",
  fraction: "(a + b)/(c + d)",
  radical: "Sqrt(x + 1)",
  nested: "1/(1 + 1/x)",
  sum: "Sum(1/k^2, {k, 1, n})",
  binomial: "Binomial(n, k) + 1",
  matrix: "Matrix([[1, 2], [3, 4]])",
  functions: "Sin(x)^2 + Exp(-x^2)",
  constants: "Pi/2 + 3.5",
};

for (const [name, input] of Object.entries(CASES)) {
  it(`lays out ${name} on cells`, () => {
    const text = draw(input);
    fresh[name] = text;
    if (!updating) expect(text).toBe(golden[name]);
    expect(text).not.toContain("\x1b");
  });
}

it("styles for a terminal and strips back to the plain text", () => {
  for (const input of Object.values(CASES)) {
    const styled = draw(input, true);
    expect(styled).toContain("\x1b[");
    expect(stripAnsi(styled)).toBe(draw(input));
  }
});

it("the CLI styles only a color host; a pipe gets plain text", () => {
  const args = ["--form=standardform", "(a + b)/c"];
  const piped = runCommand(args, "", {}, { color: false }).stdout;
  const tty = runCommand(args, "", {}, { color: true }).stdout;
  expect(piped).not.toContain("\x1b");
  expect(tty).toContain("\x1b[");
  expect(stripAnsi(tty)).toBe(piped);
});

it("is no longer InputForm", () => {
  expect(draw("x^2 + 1")).not.toBe(renderForm(session.parse("x^2 + 1").raw, "inputform"));
});

afterAll(() => {
  if (updating) writeFileSync(GOLDEN, `${JSON.stringify(fresh, null, 2)}\n`);
});
