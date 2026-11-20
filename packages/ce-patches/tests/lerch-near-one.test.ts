import { readFileSync } from "node:fs";
import { BigDecimal, ComputeEngine, type Expression } from "@cortex-js/compute-engine";
import { expect, test } from "vite-plus/test";
import { applyAllPatches, bigCx, lerchPhiAboutOne } from "../src/index.ts";

// Φ(z, s, a) next to z = 1, from the series about z = 1 (numerics/lerch-phi-about-one.ts; Erdélyi §1.11 (8), and its
// limit at a positive integer s), read from the exact z: a double reads 1 − 1e-20 as the pole. Values are mpmath's
// lerchphi at 120 digits (scripts/collect-lerch-near-one-mpmath.py). The error is relative to the result's size
// (modulus), and a call may decline: a decline is allowed, a wrong digit is not.

interface Row {
  z: [string, string];
  s: [string, string];
  a: [string, string];
  value: [string, string];
}

const { lerch } = JSON.parse(readFileSync(new URL("./lerch-near-one.mpmath.json", import.meta.url), "utf8")) as {
  lerch: Row[];
};

const json = ([re, im]: [string, string]) => (im === "0" ? { num: re } : ["Complex", { num: re }, { num: im }]);
const part = (big: BigDecimal | undefined, double: number): BigDecimal => big ?? new BigDecimal(String(double));

/** |answer − value| / |value|, from the parts as BigDecimals. */
function relativeError(answer: Expression, row: Row): number {
  const [reRef, imRef] = row.value.map((v) => new BigDecimal(v)) as [BigDecimal, BigDecimal];
  const dRe = part(answer.bignumRe, answer.re).sub(reRef);
  const dIm = part(answer.bignumIm, answer.im).sub(imRef);
  const size = reRef.abs().add(imRef.abs());
  return dRe.abs().add(dIm.abs()).div(size).toNumber();
}

const ce = new ComputeEngine();
applyAllPatches(ce);

const label = (row: Row, digits: number) =>
  `z = ${row.z.join(" + i·")}, s = ${row.s.join(" + i·")}, a = ${row.a.join(" + i·")}, ${digits} digits`;

const callOf = (row: Row) => ["LerchPhi", json(row.z), json(row.s), json(row.a)] as never;

/** `evaluate()` and `.N()` at `digits`: each answers within 10^(2 − digits) of mpmath or stays unevaluated. */
function check(row: Row, digits: number): "answered" | "declined" {
  ce.precision = digits;
  let answered = 0;
  for (const answer of [ce.box(callOf(row)).N(), ce.box(callOf(row)).evaluate()]) {
    if (answer.operator === "LerchPhi") continue;
    answered++;
    expect(relativeError(answer, row), `${label(row, digits)}: ${answer.toString()}`).toBeLessThan(10 ** (2 - digits));
  }
  return answered === 0 ? "declined" : "answered";
}

const z = (row: Row) => row.z[0];
/** The grid's z = 1 ± 10^−k as the collector writes it. */
const near = (k: number, sign: 1 | -1): string => `${10n ** BigInt(k) + BigInt(sign)}e-${k}`;
const find = (zText: string, sText: string, aText: string) =>
  lerch.find((row) => z(row) === zText && row.s.join() === sText && row.a[0] === aText)!;

// One point per kind of s, at both sides of 1 and at the nearest and farthest k, in the standard run.
const standard = [
  find(near(9, 1), "0.5,0", "1"),
  find(near(9, -1), "2,0", "0.25"),
  find(near(20, 1), "2,0", "1"),
  find(near(20, -1), "3,0", "3"),
  find(near(12, -1), "1,1", "0.25"),
  find(near(30, 1), "-1.5,0", "1"),
  find("0.999999999999", "1,1", "1"),
  find("0.999999999999", "2,0", "1"),
];

test("the series about z = 1 agrees with mpmath at 30 digits, at both sides of 1, at every kind of s", () => {
  for (const row of standard) expect(check(row, 30), label(row, 30)).toBe("answered");
});

test("evaluate(), N(), N(expr, d) and the parsed call give the same Φ", () => {
  const row = find(near(12, -1), "2,0", "0.25");
  ce.precision = 30;
  const call = callOf(row);
  const routes = [
    ce.box(call).N(),
    ce.box(call).evaluate(),
    ce.box(["N", call, 30] as never).evaluate(),
    ce.parse("\\operatorname{LerchPhi}(0.999999999999, 2, 0.25)").N(),
  ];
  for (const answer of routes) {
    expect(answer.operator).not.toBe("LerchPhi");
    expect(relativeError(answer, row), answer.toString()).toBeLessThan(1e-28);
  }
});

test("Φ at z = 1 − 1e-20 at machine precision answers a double, not the pole", () => {
  const row = find(near(20, -1), "2,0", "1");
  ce.precision = "machine";
  const answer = ce.box(callOf(row)).N();
  if (answer.operator !== "LerchPhi") expect(Math.abs(answer.re / Number(row.value[0]) - 1)).toBeLessThan(1e-14);
});

test("the kernel declines what it can't vouch for: a ≤ 0, z = 1, a z out of reach, a huge s", () => {
  const one = bigCx(1);
  const near = bigCx(new BigDecimal("1.000000000001"));
  expect(lerchPhiAboutOne(near, bigCx(2), bigCx(0), 30)).toBeUndefined();
  expect(lerchPhiAboutOne(near, bigCx(2), bigCx(-0.5), 30)).toBeUndefined();
  expect(lerchPhiAboutOne(one, bigCx(2), one, 30)).toBeUndefined();
  expect(lerchPhiAboutOne(bigCx(1.5), bigCx(2), one, 30)).toBeUndefined();
  expect(lerchPhiAboutOne(near, bigCx(1e6), one, 30)).toBeUndefined();
});

test("s a tiny distance from an integer keeps its digits: Φ(1 + 1e-12, 2 + 1e-20, 1) agrees with the limit", () => {
  const near = bigCx(new BigDecimal("1.000000000001"));
  BigDecimal.precision = 60;
  const at = lerchPhiAboutOne(near, bigCx(new BigDecimal("2.00000000000000000001")), bigCx(1), 30)!;
  const exact = lerchPhiAboutOne(near, bigCx(2), bigCx(1), 30)!;
  // dΦ/ds is of order 1, so a 1e-20 shift moves Φ by about 1e-20 and no more.
  expect(at.re.sub(exact.re).abs().toNumber()).toBeLessThan(1e-19);
});

// The whole grid, one test per z so each stays well inside the test timeout.
const zValues = [...new Set(lerch.map((row) => row.z.join("+i")))];
test.runIf(process.env.DEEP_TESTS === "1")("the grid has every z, s and a", () => {
  expect(lerch.length).toBe(165);
  expect(zValues.length).toBe(11);
});
for (const zText of zValues) {
  test.runIf(process.env.DEEP_TESTS === "1")(
    `z = ${zText}: every s and a agrees with mpmath at 30 and 50 digits`,
    () => {
      const rows = lerch.filter((row) => row.z.join("+i") === zText);
      for (const row of rows)
        for (const digits of [30, 50]) expect(check(row, digits), label(row, digits)).toBe("answered");
    },
  );
}
