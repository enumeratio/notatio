import { ComputeEngine } from "@enumeratio/engine/unstable";
import { expect, test } from "vite-plus/test";
import { declareAnalytic } from "../src/declare.ts";

const ce = new ComputeEngine();
declareAnalytic(ce);

// mpmath.zeta(1.5+12i, -47.85-7i) at dps 60: the terms of the double sum are ~1e14 times it.
const want = { re: -2.611574719192654e-18, im: -1.210324925299614e-18 };

test("HurwitzZeta far down-left at large Im s keeps its digits through N, evaluate and the parse route", () => {
  const boxed = ce.box(["HurwitzZeta", ["Complex", 1.5, 12], ["Complex", -47.85, -7]]);
  const parsed = ce.parse("\\operatorname{HurwitzZeta}(1.5+12i,-47.85-7i)");
  for (const value of [boxed.N(), boxed.evaluate(), parsed.N()]) {
    expect(Math.abs(value.re - want.re) / Math.abs(want.re)).toBeLessThan(1e-12);
    expect(Math.abs(value.im - want.im) / Math.abs(want.im)).toBeLessThan(1e-12);
  }
});
