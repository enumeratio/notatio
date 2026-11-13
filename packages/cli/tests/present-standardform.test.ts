import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PIPE, TTY } from "@notatio/frontend";
import { afterAll, expect, it } from "vite-plus/test";
import { stripAnsi } from "../src/ansi.ts";
import { present } from "../src/present.ts";

// What show mode prints is a drawing, so a golden. Regenerate with `UPDATE_PRESENT=1 vp test`.
const GOLDEN = fileURLToPath(new URL("./present-standardform.golden.json", import.meta.url));
const updating = process.env.UPDATE_PRESENT === "1";
const golden: Record<string, string> = updating ? {} : JSON.parse(readFileSync(GOLDEN, "utf8"));
const fresh: Record<string, string> = {};

const screen = { write: () => {}, mouse: false, cursorRow: () => 1, columns: () => 80, height: () => 18 };
const show = (input: string, env = TTY) => present(input, env, screen).out;

for (const input of ["1/(x+1)", "x^2"]) {
  it(`a tty shows ${input} in StandardForm, styled`, () => {
    const out = show(input);
    fresh[input] = stripAnsi(out);
    if (!updating) expect(stripAnsi(out)).toBe(golden[input]);
    expect(out).toContain("\x1b[");
  });

  it(`a pipe keeps the one-line form of ${input}`, () => {
    const out = show(input, PIPE);
    expect(out).not.toContain("\x1b");
    expect(out.split("\n")).toHaveLength(1);
  });
}

it("a tty fraction is stacked over more than one line", () => {
  expect(stripAnsi(show("1/(x+1)")).split("\n").length).toBeGreaterThan(2);
});

afterAll(() => {
  if (updating) writeFileSync(GOLDEN, `${JSON.stringify(fresh, null, 2)}\n`);
});
