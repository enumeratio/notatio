// unstable: a bare engine to declare the analytic library against
import { ComputeEngine } from "@notatio/engine/unstable";
import { describe, expect, test } from "vite-plus/test";
import { declareAnalytic } from "../src/declare.ts";

// Z(iy) = π^{y/2} √(|Γ(¼ − y/2)| / Γ(¼ + y/2)) (−i)^⌈y/2 − ¼⌉ ζ(½ − y), from ζ and ln Γ at real
// arguments (riemann-siegel-big.ts). It is real for |y| < ½ and between the poles y = ½ + 2k it is
// real or purely imaginary by turns, the other part exactly zero; at and near a pole, and past the
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
  const declined = [0.5, -0.5, 2.5, 4.5, 10.5, 40.5, 0.5 + 1e-5, 2.5 - 1e-5, 4.5 + 1e-6, 101, 1e6];
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

  test("the nearest answered points on either side of a pole", () => {
    for (const y of [0.5 - 2e-4, 0.5 + 2e-4, 2.5 - 2e-4, 2.5 + 2e-4]) expect(isDeclined(n(y, 20))).toBe(false);
  });
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
