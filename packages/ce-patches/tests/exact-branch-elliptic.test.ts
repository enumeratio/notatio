import { ComputeEngine } from "@cortex-js/compute-engine";
import { afterEach, expect, test } from "vite-plus/test";
import { applyPatch, ellipticOverflow } from "../src/index.ts";

// F(φ|m) and E(φ|m) where an operand sits below the double's range. The branch tests read the exact value:
// an m of 1e-400 is not 0, and the native handler reads a φ of 1e-400 as 0 and answers 0 where
// F(φ|m) = E(φ|m) = φ(1 + O(mφ²)) is 1e-400. Values: mpmath 1.3.0, ellipf(mpf('1e-400'), mpf('0.5')) and
// ellipe(mpf('1e-400'), mpf('0.5')) at 100 digits, both 1.000…e-400 to over 700 digits; ellipf(0.5, mpf('1e-400'))
// and ellipe(0.5, mpf('1e-400')) are 0.5 to over 300 digits.

const ce = new ComputeEngine();
applyPatch(ce, ellipticOverflow);
afterEach(() => {
  ce.precision = "machine";
});

const tiny = { num: "1e-400" };

test("a φ of 1e-400 is its own value, not 0", () => {
  for (const head of ["EllipticF", "EllipticE"]) {
    for (const digits of [30, 50]) {
      ce.precision = digits;
      const answer = ce.box([head, tiny, ["Rational", 1, 2]] as never).N();
      expect(answer.toString(), `${head} at ${digits} digits`).toBe("1e-400");
    }
  }
});

test("an m of 1e-400 is read as itself: the value is φ to its digits, and declines past them", () => {
  for (const head of ["EllipticF", "EllipticE"]) {
    ce.precision = 30;
    expect(
      ce
        .box([head, 0.5, tiny] as never)
        .N()
        .toString(),
      `${head} at 30 digits`,
    ).toBe("0.5");
    ce.precision = 400;
    const answer = ce.box([head, 0.5, tiny] as never).N();
    expect(answer.operator, `${head} at 400 digits stays unevaluated`).toBe(head);
  }
});

test("an exact m = 0 is φ at any digits", () => {
  ce.precision = 400;
  expect(
    ce
      .box(["EllipticF", 0.5, 0] as never)
      .N()
      .toString(),
  ).toBe("0.5");
});
