// unstable: a bare engine to declare the analytic library against
import { ComputeEngine } from "@notatio/engine/unstable";
import { describe, expect, test } from "vite-plus/test";
import { declareAnalytic } from "../src/declare.ts";

// Z(iy) = π^{y/2} √(|Γ(¼ − y/2)| / Γ(¼ + y/2)) (−i)^⌈y/2 − ¼⌉ ζ(½ − y), from ζ and ln Γ at real
// arguments (riemann-siegel-big.ts). It is real for |y| < ½ and between the poles y = ½ + 2k it is
// real or purely imaginary by turns, the other part exactly zero; at a pole, near a half-integer by less than the guard, and past the
// range checked against mpmath (|y| ≤ 100), it declines. There is no compile target for it.

const ce = new ComputeEngine();
declareAnalytic(ce);

const call = (y: number) => ["RiemannSiegelZ", ["Complex", 0, y]] as never;
const n = (y: number, digits: number) => ce.box(["N", call(y), digits] as never).evaluate();
const isDeclined = (e: { operator: string }) => e.operator === "RiemannSiegelZ";

/** mpmath's definition at 60 digits (`loggamma` and `zeta`), and `siegelz`, which agrees: [y, re, im]. */
const MPMATH: [number, string, string | undefined][] = [
  [1e-12, "-1.4603545088095868129", undefined],
  [0.3, "-1.804661269728229221", undefined],
  [1, "0", "0.73693748002264514385"],
  [3, "-0.097960768165277449275", undefined],
  [-3, "-0.097960768165277449275", undefined],
  [7.25, "0.060980767932008238254", undefined],
  [100, "-2.8278053276080652511e38", undefined],
];

describe("Z(iy) against mpmath", () => {
  for (const [y, re, im] of MPMATH) {
    test(`y = ${y}, 20 digits`, () => {
      const value = n(y, 20);
      if (im === undefined) {
        expect(value.operator).not.toBe("Complex"); // real: no Complex wrapper, no zero part
        expect(Number(value.re) / Number(re)).toBeCloseTo(1, 14);
        expect(value.json).toEqual({ num: expect.stringMatching(/^-?\d/) });
      } else {
        expect(value.operator).toBe("Complex");
        expect(value.re).toBe(0); // exactly zero, not 1e-17
        expect(Number(value.im) / Number(im)).toBeCloseTo(1, 14);
      }
    });
  }

  test("the 20-digit values are the digits mpmath gives", () => {
    expect(n(0.3, 20).json).toEqual({ num: "-1.804661269728229221" });
    expect(n(1, 20).json).toEqual(["Complex", 0, { num: "0.73693748002264514385" }]);
    expect(n(3, 20).json).toEqual({ num: "-0.097960768165277449275" });
    expect(n(-3, 20).json).toEqual({ num: "-0.097960768165277449275" });
    expect(n(7.25, 20).json).toEqual({ num: "0.060980767932008238254" });
  });

  test("50 digits at y = 0.3", () => {
    expect(n(0.3, 50).json).toEqual({ num: "-1.8046612697282292209719660872070528637565956025072" });
  });
});

describe("the routes agree", () => {
  const ys = [1e-12, 0.3, 0.49, 1, 2.4, 3, 7.25, -3, 20.1];
  for (const y of ys) {
    test(`evaluate, .N(), N(·, d) and the parse route at y = ${y}`, () => {
      const lit = Number.isInteger(y) ? y.toFixed(1) : String(y); // an exact 1 is left to N, as for every head
      const viaN = ce.box(call(y)).N();
      const viaEvaluate = ce.box(["RiemannSiegelZ", ["Complex", 0, { num: lit }]] as never).evaluate();
      const viaDigits = n(y, 25);
      const parsed = ce.parse(`\\operatorname{RiemannSiegelZ}(${lit}i)`).N();
      const expected = [Number(viaDigits.re), Number(viaDigits.im)];
      for (const v of [viaN, viaEvaluate, parsed]) {
        expect(isDeclined(v)).toBe(false);
        for (const [part, want] of [
          [v.re, expected[0]!],
          [v.im, expected[1]!],
        ] as const) {
          if (want === 0) expect(part).toBe(0); // an exactly zero part stays exact on every route
          else expect(part / want).toBeCloseTo(1, 13);
        }
      }
    });
  }
});

describe("it declines where it can't vouch for the value", () => {
  const declined = [0.5, -0.5, 2.5, 4.5, 10.5, 40.5, 98.5, 101, 1e6];
  for (const y of declined) {
    test(`y = ${y}`, () => {
      expect(isDeclined(n(y, 20))).toBe(true);
      expect(isDeclined(n(y, 15))).toBe(true);
      expect(isDeclined(ce.box(call(y)).N())).toBe(true);
      expect(isDeclined(ce.box(call(y)).evaluate())).toBe(true);
    });
  }

  test("a pole is never claimed real", () => {
    for (const y of [0.5, 2.5]) expect(ce.box(call(y)).N().type.matches("real")).toBe(false);
  });

  test("the points on either side of a pole answer", () => {
    for (const y of [0.5 - 2e-4, 0.5 + 2e-4, 2.5 - 2e-4, 2.5 + 2e-4, 0.5 + 1e-5, 2.5 - 1e-5, 4.5 + 1e-6]) {
      expect(isDeclined(n(y, 20))).toBe(false);
      expect(isDeclined(ce.box(call(y)).N())).toBe(false);
    }
  });
});

// The guard (riemann-siegel-big.ts): within 1e-13 of a half-integer from 1.5 up, a y with more digits than
// a double declines, because ζ's kernel plans from s = ½ − y as a double and reads a negative integer.
// Outside it, and next to ½ at any distance, the digits asked for are right. Values: mpmath's definition
// at 120 digits (`loggamma`, `zeta`), which agrees with `siegelz`; the double rows are at the exact double.
const nString = (y: string, digits: number) =>
  ce.box(["N", ["RiemannSiegelZ", ["Complex", 0, { num: y }]], digits] as never).evaluate();

describe("the pole guard", () => {
  // [y, real part, imaginary part] at 20 digits; a part of 0 is exactly zero.
  const outside: [string, string | 0, string | 0][] = [
    ["2.5000000000002", "-8.5557907872494162922e-8", 0],
    ["98.4999999999998", 0, "2.3788698414875517737e31"],
    ["40.5000000000002", 0, "31.061696140059109618"],
    ["10.4999999999998", 0, "6.1545562459062083437e-8"],
    ["0.500000000001", 0, "707106.78118610181329"], // next to ½ no guard is needed
    ["0.499999999999", "-707106.78118699323551", 0],
  ];
  for (const [y, re, im] of outside) {
    test(`y = ${y} answers, 20 and 50 digits agree`, () => {
      const value = nString(y, 20);
      expect(isDeclined(value)).toBe(false);
      for (const [part, want] of [
        [value.re, re],
        [value.im, im],
      ] as const) {
        if (want === 0) expect(part).toBe(0);
        else expect(part / Number(want)).toBeCloseTo(1, 14);
      }
      const fifty = nString(y, 50);
      expect(
        Math.abs(Number(fifty.re) - Number(value.re)) + Math.abs(Number(fifty.im) - Number(value.im)),
      ).toBeLessThanOrEqual(1e-14 * Math.hypot(Number(value.re), Number(value.im)));
    });
  }

  test("a y inside the radius that a double can't hold declines at every digit count", () => {
    for (const y of ["2.5000000000000001", "98.49999999999999999", "40.5000000000000001", "1.5000000000000001"]) {
      for (const digits of [20, 50]) expect(isDeclined(nString(y, digits))).toBe(true);
    }
  });

  test("a double one ulp off a half-integer answers on the double route, to mpmath at that double", () => {
    const value = ce.box(call(2.5000000000000004)).N();
    expect(isDeclined(value)).toBe(false);
    expect(value.im).toBe(0);
    expect(value.re / -4.031626294791195e-9).toBeCloseTo(1, 13);
    const half = ce.box(call(1.5)).N(); // not a pole: Z(1.5i) = 0.37024024484653052058 i
    expect(half.re).toBe(0);
    expect(half.im / 0.3702402448465305).toBeCloseTo(1, 13);
  });

  test("every route at a point just outside the guard", () => {
    const y = "2.5000000000002";
    const viaN = ce.box(call(Number(y))).N();
    const viaEvaluate = ce.box(["RiemannSiegelZ", ["Complex", 0, { num: y }]] as never).evaluate();
    const parsed = ce.parse(`\\operatorname{RiemannSiegelZ}(${y}i)`).N();
    // the double route is held to the definition at the exact double, which is 4e-4 from the decimal's value
    for (const v of [viaN, viaEvaluate, parsed]) {
      expect(isDeclined(v)).toBe(false);
      expect(v.im).toBe(0);
      expect(v.re / -8.552370876769486e-8).toBeCloseTo(1, 13);
    }
  });
});

// Every pole at every distance from 1e-4 to 1e-12 (the hand-back's grid, against mpmath) holds the digits
// across routes: 20 against 50 digits, a part that is zero exactly zero, and the double route within its
// conditioning of the big route (a double y moves Z by about ulp(y)/distance).
describe.runIf(process.env.DEEP_TESTS === "1")("the grid around each pole", () => {
  for (const pole of [0.5, 2.5, 10.5, 40.5, 98.5]) {
    test(`pole ${pole}`, () => {
      for (const sign of [-1, 1]) {
        for (let e = 4; e <= 12; e++) {
          const distance = 10 ** -e;
          const text = (pole + sign * distance).toFixed(12);
          const [a, b] = [nString(text, 20), nString(text, 50)];
          expect(isDeclined(a)).toBe(false);
          const size = Math.hypot(Number(b.re), Number(b.im));
          expect(Math.abs(Number(a.re) - Number(b.re)) + Math.abs(Number(a.im) - Number(b.im))).toBeLessThanOrEqual(
            1e-14 * size,
          );
          expect(a.re === 0 || a.im === 0).toBe(true); // one part is exactly zero
          const dbl = ce.box(call(Number(text))).N();
          expect(isDeclined(dbl)).toBe(false);
          const tolerance = 1e-13 + (4 * Number.EPSILON * pole) / distance;
          expect(Math.abs(Number(dbl.re) - Number(b.re)) + Math.abs(Number(dbl.im) - Number(b.im))).toBeLessThanOrEqual(
            tolerance * size,
          );
        }
      }
    });
  }
});

// Precision independence and evenness across every interval between poles up to 100, a few points
// each by default and the full set under DEEP_TESTS=1 (against mpmath: the hand-back's grid).
const DEEP = process.env.DEEP_TESTS === "1";
const intervals = DEEP ? 51 : 6;
const fractions = DEEP ? [0.001, 0.1, 0.25, 0.5, 0.75, 0.9, 0.999] : [0.1, 0.5, 0.9];

describe("each interval between poles", () => {
  for (let k = 0; k < intervals; k++) {
    const lo = k === 0 ? 0 : 0.5 + 2 * (k - 1);
    const hi = k === 0 ? 0.5 : lo + 2;
    test(`(${lo}, ${hi})`, () => {
      for (const f of fractions) {
        const y = +(lo + f * (hi - lo)).toFixed(6);
        if (y > 100) continue; // the last interval is checked only up to the cap
        const [a, b] = [n(y, 20), n(y, 34)];
        const [ar, ai, br, bi] = [Number(a.re), Number(a.im), Number(b.re), Number(b.im)];
        const size = Math.hypot(br, bi);
        expect(Math.abs(ar - br)).toBeLessThanOrEqual(1e-15 * size);
        expect(Math.abs(ai - bi)).toBeLessThanOrEqual(1e-15 * size);
        // one part is exactly zero: real for an even number of poles below y, imaginary for an odd
        expect(k % 2 === 0 ? ai : ar).toBe(0);
        const even = n(-y, 20);
        expect(even.json).toEqual(a.json);
        if (f < 0.01 || f > 0.99) continue; // near a pole a double y's rounding is amplified by 1/distance
        const dbl = ce.box(call(y)).N();
        expect(Math.abs(Number(dbl.re) - ar) + Math.abs(Number(dbl.im) - ai)).toBeLessThanOrEqual(1e-13 * size);
      }
    });
  }
});
