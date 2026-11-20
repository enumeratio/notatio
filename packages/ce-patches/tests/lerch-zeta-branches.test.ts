import { readFileSync } from "node:fs";
import { BigDecimal, ComputeEngine, type Expression } from "@cortex-js/compute-engine";
import { expect, test } from "vite-plus/test";
import { applyAllPatches, bigCx, evaluateZeta, hurwitzZetaBig } from "../src/index.ts";

// LerchPhi and Zeta branch on an operand's value: Φ(1, s, a) is ζ(s, a), Φ(0, s, a) is a^(−s) with a principal
// branch where s is not an integer, and Zeta(s, 0) is ζ(s). Each test read the double, so a bignum that
// is not its double took the wrong branch:
//   Φ(1 − 1e-20, 1, 1) is 46.05 and was ComplexInfinity (the double z is 1, the pole), and Φ(1 − 1e-20, 2, 1)
//     was ζ(2), where the value differs from it at the 20th digit;
//   Φ(0, 2 + 1e-20, −½) is 4 − 1.26e-19i and was NaN (s = 2 read as the integer, then Power of a negative base);
//   Zeta(2, 1e-400) is about 1e800 (the k = 0 term a^(−s)) and was ζ(2) (a = 1e-400 is the double 0).
// Values are mpmath's lerchphi and zeta at 100 digits (scripts/collect-lerch-zeta-branches-mpmath.py), and the
// answer is held to relative error 10^(1 − digits) in each part, or the call stays unevaluated: a decline is
// allowed, a wrong digit is not. Φ near z = 1 is the series about z = 1 (lerch-near-one.test.ts holds its grid), read from the exact z.

interface Row {
  z?: [string, string];
  s: [string, string];
  a: [string, string];
  value: [string, string];
}

const { lerch, zeta } = JSON.parse(
  readFileSync(new URL("./lerch-zeta-branches.mpmath.json", import.meta.url), "utf8"),
) as { lerch: Row[]; zeta: Row[] };

const json = ([re, im]: [string, string]) => (im === "0" ? { num: re } : ["Complex", { num: re }, { num: im }]);
const part = (big: BigDecimal | undefined, double: number): BigDecimal => big ?? new BigDecimal(String(double));

/** The relative distance of `x` from `reference`; a zero reference needs `scale · 10^−digits` at most. */
function relative(x: BigDecimal, reference: BigDecimal, scale: BigDecimal): number {
  const distance = x.sub(reference).abs();
  return (reference.isZero() ? distance.div(scale) : distance.div(reference.abs())).toNumber();
}

/** Whether `answer` is a number within 10^(1 − digits) of `row.value` in each part; undefined where it declined. */
function distance(answer: Expression, row: Row, head: string): number | undefined {
  if (answer.operator === head) return undefined;
  expect(Number.isFinite(answer.re) || answer.bignumRe !== undefined, `not a number: ${answer.toString()}`).toBe(true);
  const [reRef, imRef] = row.value.map((v) => new BigDecimal(v)) as [BigDecimal, BigDecimal];
  const scale = reRef.abs().add(imRef.abs());
  return Math.max(
    relative(part(answer.bignumRe, answer.re), reRef, scale),
    relative(part(answer.bignumIm, answer.im), imRef, scale),
  );
}

const ce = new ComputeEngine();
applyAllPatches(ce);

const label = (row: Row, digits: number) =>
  `z = ${row.z?.join(" + i·") ?? "—"}, s = ${row.s.join(" + i·")}, a = ${row.a.join(" + i·")}, ${digits} digits`;

function checkLerch(row: Row, digits: number): "answered" | "declined" {
  ce.precision = digits;
  const call = ["LerchPhi", json(row.z!), json(row.s), json(row.a)];
  const results = [ce.box(call as never).N(), ce.box(call as never).evaluate()];
  let answered = 0;
  for (const answer of results) {
    const d = distance(answer, row, "LerchPhi");
    if (d === undefined) continue;
    answered++;
    expect(d, `${label(row, digits)}: ${answer.toString()}`).toBeLessThan(10 ** (1 - digits));
  }
  return answered === 0 ? "declined" : "answered";
}

function checkZeta(row: Row, digits: number): "answered" | "declined" {
  ce.precision = digits;
  const s = ce.box(json(row.s) as never);
  const a = ce.box(json(row.a) as never);
  const answer = evaluateZeta(ce, [s, a], true);
  if (answer === undefined || answer.operator === "Zeta") return "declined";
  expect(distance(answer, row, "Zeta"), `${label(row, digits)}: ${answer.toString()}`).toBeLessThan(10 ** (1 - digits));
  return "answered";
}

test("Φ(1 − 1e-20, 1, 1) is 46.05, not the pole: it declines, and never answers ComplexInfinity", () => {
  ce.precision = 30;
  const call = ["LerchPhi", { num: "0.99999999999999999999" }, 1, 1] as never;
  for (const answer of [ce.box(call).N(), ce.box(call).evaluate()]) {
    // mpmath: lerchphi(mpf('0.99999999999999999999'), 1, 1) = 46.05170185988091368082034611228609328883
    expect(answer.toString()).not.toBe("ComplexInfinity");
    if (answer.operator !== "LerchPhi") expect(Math.abs(answer.re - 46.05170185988091)).toBeLessThan(1e-12);
  }
});

test("Φ(1 − 1e-20, 2, 1) is not ζ(2): it declines or answers ζ(2) − …, to the 20th digit", () => {
  ce.precision = 30;
  const answer = ce.box(["LerchPhi", { num: "0.99999999999999999999" }, 2, 1] as never).N();
  // mpmath: lerchphi(mpf('0.99999999999999999999'), 2, 1) = 1.644934066848226436018347488715698316773, and
  // ζ(2) = 1.644934066848226436472415166646025189219
  if (answer.operator !== "LerchPhi") {
    expect(
      new BigDecimal(String(answer.bignumRe))
        .sub(new BigDecimal("1.644934066848226436018347488715698316773"))
        .abs()
        .toNumber(),
    ).toBeLessThan(1e-29);
  }
});

test("Φ(0, 2 + 1e-20, −½) is mpmath's 4.000000000000000000027725887222 − 1.2566370614359172954e-19 i, not NaN", () => {
  ce.precision = 30;
  for (const a of [["Rational", -1, 2], { num: "-0.5" }]) {
    const call = ["LerchPhi", 0, { num: "2.00000000000000000001" }, a] as never;
    for (const answer of [ce.box(call).N(), ce.box(call).evaluate()]) {
      // mpmath: lerchphi(0, mpf(2) + mpf(10)**-20, mpf(-0.5)) at 100 digits
      expect(answer.operator).not.toBe("LerchPhi");
      const re = answer
        .bignumRe!.sub(new BigDecimal("4.000000000000000000027725887222397812375"))
        .abs()
        .div(4)
        .toNumber();
      const im = answer
        .bignumIm!.sub(new BigDecimal("-1.256637061435917295393767697673015562201e-19"))
        .abs()
        .div(1.2566e-19)
        .toNumber();
      expect(re).toBeLessThan(1e-29);
      expect(im).toBeLessThan(1e-29);
    }
  }
});

test("Zeta(2, 1e-400) is 1e800 carried scaled, not ζ(2); at machine precision, where 1e800 is no double, it declines", () => {
  ce.precision = 30;
  const tiny = ce.box({ num: "1e-400" } as never);
  const answer = evaluateZeta(ce, [ce.box(2), tiny], true);
  // mpmath: zeta(2, mpf('1e-400')) = 1.0e+800 (ζ(2) is the 800th digit)
  expect(answer).toBeDefined();
  expect(answer!.bignumRe!.div(new BigDecimal("1e800")).sub(1).abs().toNumber()).toBeLessThan(1e-29);
  ce.precision = "machine";
  const machine = evaluateZeta(ce, [ce.box(2), tiny], true);
  expect(machine === undefined || machine.operator === "Zeta").toBe(true);
});

test("the kernel reads an a below the double's range, so its other callers do too: ψ₁(1e-400) is 1e800, past a double", () => {
  BigDecimal.precision = 30;
  // mpmath: zeta(2, mpf('1e-400')) = 1.0e800
  const r = hurwitzZetaBig(bigCx(2), bigCx(new BigDecimal("1e-400")), 30);
  expect(r!.re.div(new BigDecimal("1e800")).sub(1).abs().toNumber()).toBeLessThan(1e-29);
  // A negative or complex a that small has no k = 0 split here: declined.
  expect(hurwitzZetaBig(bigCx(2), bigCx(new BigDecimal("-1e-400")), 30)).toBeUndefined();
  // PolyGamma(1, 1e-400) is 1e800 natively; ours answers in doubles, which cannot hold it, so it never reaches Infinity or ψ₁(0).
  ce.precision = 30;
  const answer = ce.box(["PolyGamma", 1, { num: "1e-400" }] as never).N();
  if (answer.operator !== "PolyGamma") {
    expect(answer.bignumRe!.div(new BigDecimal("1e800")).sub(1).abs().toNumber()).toBeLessThan(1e-29);
  }
});

test("Zeta(s, a) with a below the double's range, and an exact zero a, keep ζ(s) for a = 0", () => {
  ce.precision = 30;
  const zero = evaluateZeta(ce, [ce.box(3), ce.box(0)], true);
  expect(zero!.re).toBeCloseTo(1.2020569031595942, 14);
});

// The standard run holds one point per family; the whole grid runs under DEEP_TESTS=1.
const near = (row: Row, k: string) => row.z?.[0].endsWith(`e-${k}`) && row.z[0] !== "0";
const standardLerch = lerch.filter((row) => near(row, "20") || (row.z![0] === "0" && row.s[0].endsWith("e-20")));
const standardZeta = zeta.filter((row) => row.a[0] === "1e-400");

test("Φ near z = 1 and at z = 0 with s 1e-20 off an integer: right or declined at 30 digits", () => {
  expect(standardLerch.length).toBeGreaterThan(30);
  for (const row of standardLerch) checkLerch(row, 30);
});

test("Φ(0, s, a) at s = n ± 1e-20 answers (a on and off the negative axis), 30 digits", () => {
  const rows = standardLerch.filter((row) => row.z![0] === "0");
  const answered = rows.filter((row) => checkLerch(row, 30) === "answered");
  expect(answered.length).toBe(rows.length);
});

test("Zeta(s, 1e-400) at 30 digits answers, right", () => {
  expect(standardZeta.length).toBe(5);
  for (const row of standardZeta) expect(checkZeta(row, 30)).toBe("answered");
});

test.runIf(process.env.DEEP_TESTS === "1")("the whole grid agrees with mpmath at 30 and 50 digits", () => {
  expect(lerch.length).toBeGreaterThan(150);
  for (const row of lerch) for (const digits of [30, 50]) checkLerch(row, digits);
  expect(zeta.length).toBe(15);
  // 1e-300 is a double: the kernel's own plan reads it, and may decline a complex s. Below the range, the k = 0 term answers.
  for (const row of zeta)
    for (const digits of [30, 50]) {
      const result = checkZeta(row, digits);
      if (row.a[0] !== "1e-300") expect(result, label(row, digits)).toBe("answered");
    }
});
