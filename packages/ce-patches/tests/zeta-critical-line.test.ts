import { BigDecimal, ComputeEngine } from "@cortex-js/compute-engine";
import { expect, test } from "vite-plus/test";
import { applyAllPatches, bigCx, evaluateHurwitz, hurwitzZetaBig } from "../src/index.ts";
import { beyondTermCap, exactDouble, plan } from "../src/compute-engine/numerics/hurwitz-zeta-big.ts";

// The bignum ζ kernel on the critical line and past machine precision. Values: mpmath zeta at 60
// digits at the exact value of the operands.

test("exactDouble is the binary value of the double, not its shortest decimal", () => {
  // 1055.0729513168335 prints short, and is 1055.07295131683349609375.
  expect(exactDouble(1055.0729513168335).toString()).toBe("1055.07295131683349609375");
  expect(exactDouble(0.1).toString()).toBe("0.1000000000000000055511151231257827021181583404541015625");
  expect(exactDouble(-2.5).toString()).toBe("-2.5");
  for (const x of [0.3, -1055.0729513168335, 100055.07295131683, 1e-5, 2 ** -40, 123456.789e10]) {
    expect(exactDouble(x).toNumber(), String(x)).toBe(x);
  }
  expect(exactDouble(4).toString()).toBe("4");
});

const machine = new ComputeEngine();
applyAllPatches(machine);
machine.precision = "machine";

test("at machine precision ζ(1/2 + it) is ζ at the exact double, correctly rounded", () => {
  // t is the bench's first sample near 10^3 and near 10^4. Read as its shortest decimal, ζ was 5e-15 and 3e-12 off.
  const near = (t: number, re: number, im: number): void => {
    const value = evaluateHurwitz(machine, [machine.box(["Complex", 0.5, t]), machine.One], true)!;
    expect([value.re, value.im]).toEqual([re, im]);
  };
  near(1055.0729513168335, -0.0490583746895581, 0.06384147851698731);
  near(10055.072951316833, -0.33804107104078024, -0.9384150003322825);
});

test("at 30 digits a complex ζ keeps 30 digits in each part", () => {
  const wide = new ComputeEngine();
  applyAllPatches(wide);
  wide.precision = 30;
  const s = wide.box(["Add", ["Rational", 1, 2], ["Complex", 0, 135]]).N();
  const value = evaluateHurwitz(wide, [s, wide.One], true)!;
  expect(value.json).toEqual([
    "Complex",
    { num: "-0.474946180758882777849970440425" },
    { num: "0.632508600458115522621725529914" },
  ]);
});

test("a sum too long for the kernel is declined, not thrown", () => {
  const s = bigCx(0.5, 10000055.072951317);
  expect(plan({ re: 0.5, im: 10000055.072951317 }, { re: 1, im: 0 }, 25)).toBeUndefined();
  expect(beyondTermCap(s, bigCx(1), 17)).toBe(true);
  expect(hurwitzZetaBig(s, bigCx(1), 17)).toBeUndefined();
  expect(
    evaluateHurwitz(machine, [machine.box(["Complex", 0.5, 10000055.072951317]), machine.One], true),
  ).toBeUndefined();
  // One decade short of it the kernel still answers (ζ(1/2 + 10^6 i), 7 s here, so not in the standard run).
  expect(beyondTermCap(bigCx(0.5, 1000055), bigCx(1), 17)).toBe(false);
});

test("exactDouble leaves integers and non-finite values to BigDecimal", () => {
  expect(exactDouble(135).eq(new BigDecimal(135))).toBe(true);
  expect(exactDouble(Number.POSITIVE_INFINITY).toString()).toBe(new BigDecimal(Number.POSITIVE_INFINITY).toString());
});
