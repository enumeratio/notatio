import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";

// The first numeric call of a process answers as every later one does: nothing a call loads or
// reads lazily may change the working precision under it. Each case runs as the first call of a
// fresh node process. Values are mpmath's.

const CHILD = fileURLToPath(new URL("./support/first-call.ts", import.meta.url));

const firstCall = (expr: unknown, digits: number): string =>
  execFileSync(process.execPath, [CHILD, JSON.stringify(expr), String(digits)], { encoding: "utf8" }).trim();

const reciprocal = ["Divide", 1, ["BesselI", 1, 1]];

test("the first N(1/BesselI(1, 1), 30) of a process answers", () => {
  expect(firstCall(reciprocal, 30)).toMatch(/^1\.7694132376805825857129111381/);
});

const DEEP: [string, unknown, number, RegExp][] = [
  ["1/BesselI(1, 1) at the engine's precision", reciprocal, 0, /^1\.76941323768058258571/],
  ["1/BesselJ(0, 1) at 30 digits", ["Divide", 1, ["BesselJ", 0, 1]], 30, /^1\.3068518339335652263/],
  ["BesselK(1, 2) at 30 digits", ["BesselK", 1, 2], 30, /^0\.13986588181652242728/],
  ["Zeta(3) at 30 digits", ["Zeta", 3], 30, /^1\.2020569031595942853997381615/],
  ["Gamma(1/3) at 30 digits", ["Gamma", ["Rational", 1, 3]], 30, /^2\.6789385347077476336556929409/],
  ["BesselJ(0, 1) at the engine's precision", ["BesselJ", 0, 1], 0, /^0\.7651976865579665514/],
];

test.skipIf(process.env["DEEP_TESTS"] !== "1").each(DEEP)(
  "the first call answers: %s",
  (_name, expr, digits, pattern) => {
    expect(firstCall(expr, digits)).toMatch(pattern);
  },
);
