import { readFileSync } from "node:fs";
import { BigDecimal } from "@cortex-js/compute-engine";
import { expect, test } from "vite-plus/test";
import { bigCx, hurwitzZetaBig } from "../src/index.ts";
import { plan } from "../src/compute-engine/numerics/hurwitz-zeta-big.ts";

// ζ(s, a) at an s within about 1e-15 of a negative integer, or of the pole at 1, where s as a double is
// the integer: hurwitzZetaBig planned its Euler–Maclaurin terms from that double, read the Pochhammer
// factor s + n as 0 and dropped every pair that carries it, terms as large as the result
// (ζ(−2 − 1e-16) at 30 digits was 2.78e-18, mpmath's 3.04e-18, at every working precision).
// The values are mpmath's zeta(s, a) at 150 digits (scripts/collect-zeta-near-integer-mpmath.py), held
// to relative error 10^−digits: next to a zero of ζ the value is as small as the distance, so an
// absolute error would pass an answer with no correct digit.

interface Row {
  s: [string, string];
  a: [string, string];
  value: [string, string];
}

const rows = JSON.parse(readFileSync(new URL("./zeta-near-integer.mpmath.json", import.meta.url), "utf8")) as Row[];

const big = ([re, im]: [string, string]) => bigCx(new BigDecimal(re), new BigDecimal(im));

/** The digits of `x` that disagree with `reference`, as a relative error; zero reference needs an exact zero. */
function relative(x: BigDecimal, reference: BigDecimal): number {
  if (reference.isZero()) return x.isZero() ? 0 : Infinity;
  return x.sub(reference).abs().div(reference.abs()).toNumber();
}

/** The kernel's answer at `digits`, which is either right to `digits` in each part or undefined. */
function check(row: Row, digits: number): void {
  BigDecimal.precision = digits;
  const label = `s = ${row.s.join(" + i·")}, a = ${row.a[0]}, ${digits} digits`;
  const r = hurwitzZetaBig(big(row.s), big(row.a), digits);
  if (r === undefined) return; // a decline is allowed; a wrong answer is not
  expect(relative(r.re, new BigDecimal(row.value[0])), `${label}: real part`).toBeLessThan(10 ** -digits);
  expect(relative(r.im, new BigDecimal(row.value[1])), `${label}: imaginary part`).toBeLessThan(10 ** -digits);
}

test("ζ(−2 − 1e-16) at 30 digits is mpmath's 3.04484570583932674920757210999e-18", () => {
  BigDecimal.precision = 30;
  const r = hurwitzZetaBig(bigCx(new BigDecimal("-2.0000000000000001")), bigCx(1), 30);
  expect(r).toBeDefined();
  // mpmath: zeta(mpf(-20000000000000001) / 10**16) at 150 digits
  const expected = new BigDecimal("3.04484570583932674920757210999e-18");
  expect(relative(r!.re, expected)).toBeLessThan(1e-30);
  expect(r!.im.isZero()).toBe(true);
});

test("the plan reads s + n from the exact s: s = −2 − 1e-16 keeps its pairs, not the double's −2", () => {
  const exact = bigCx(new BigDecimal("-2.0000000000000001"));
  const doubles = { re: exact.re.toNumber(), im: 0 };
  expect(doubles.re).toBe(-2);
  const fromDouble = plan(doubles, { re: 1, im: 0 }, 38);
  const fromExact = plan(doubles, { re: 1, im: 0 }, 38, { s: exact, a: bigCx(1) });
  expect(fromExact!.pairs).toBeGreaterThan(fromDouble!.pairs);
  // The exact value of an s that is the double changes nothing.
  const same = plan({ re: -2.5, im: 0 }, { re: 1, im: 0 }, 38, { s: bigCx(-2.5), a: bigCx(1) });
  expect(same).toEqual(plan({ re: -2.5, im: 0 }, { re: 1, im: 0 }, 38));
});

test("an s at an exact integer, or the pole, answers or declines, never a wrong digit", () => {
  BigDecimal.precision = 30;
  expect(hurwitzZetaBig(bigCx(1), bigCx(1), 30)).toBeUndefined();
  // ζ(−2) = 0: the sum is noise at the working precision, not a value with digits.
  const zero = hurwitzZetaBig(bigCx(-2), bigCx(1), 30);
  if (zero !== undefined) expect(zero.re.abs().toNumber()).toBeLessThan(1e-30);
});

// The standard run holds each s that is 1e-16 off an integer (at 30 digits) and the a near −3; the whole grid
// (k = 14 … 30, 30 and 50 digits) runs under DEEP_TESTS=1.
const standard = rows.filter((row) => row.s[0].endsWith("e-16") || row.a[0].endsWith("e-30"));

test("s within 1e-16 of an integer, and a within 1e-30 of −3, agree with mpmath", () => {
  expect(standard.length).toBeGreaterThan(40);
  for (const row of standard) check(row, 30);
});

test.runIf(process.env.DEEP_TESTS === "1")("the whole grid agrees with mpmath at 30 and 50 digits", () => {
  expect(rows.length).toBeGreaterThan(200);
  for (const row of rows) for (const digits of [30, 50]) check(row, digits);
});

test("the standard set answers, none of it declined: the kernel can read every one of its points", () => {
  BigDecimal.precision = 30;
  const answered = standard.filter((row) => hurwitzZetaBig(big(row.s), big(row.a), 30) !== undefined);
  expect(answered.length).toBe(standard.length);
});
