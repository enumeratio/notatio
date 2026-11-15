import { ComputeEngine } from "@cortex-js/compute-engine";
import { expect, test } from "vite-plus/test";
import { numberResult } from "../src/index.ts";

const ce = new ComputeEngine();

test("an imaginary part exactly 0, or within the relative floor of the real part, collapses", () => {
  expect(numberResult(ce, { re: 2.5, im: 0 })?.im).toBe(0);
  const noisy = numberResult(ce, { re: 3, im: 1e-16 });
  expect([noisy?.re, noisy?.im]).toEqual([3, 0]);
  const huge = numberResult(ce, { re: -1e17, im: 278 });
  expect(huge?.im).toBe(0);
});

test("a tiny value keeps an imaginary part that is as large as the value is (mpmath meijerg)", () => {
  // MeijerG({{31, 0.5}, {}}, {{2.2, 4.4}, {}}, -1e-12)
  const r = numberResult(ce, { re: 1.876548966321235e-55, im: 1.3633926299168768e-55 });
  expect([r?.re, r?.im]).toEqual([1.876548966321235e-55, 1.3633926299168768e-55]);
  const small = numberResult(ce, { re: 1e-20, im: 3e-17 });
  expect(small?.im).toBe(3e-17);
});

test("a kernel's own noise scale drops an imaginary part the value cannot carry", () => {
  expect(numberResult(ce, { re: 1e-20, im: 3e-17 }, { noise: 1e-14 })?.im).toBe(0);
  // A genuine imaginary part above the stated noise stays.
  expect(numberResult(ce, { re: 1e-20, im: 3e-12 }, { noise: 1e-14 })?.im).toBe(3e-12);
});

test("a non-finite result declines unless the caller says it is a pole", () => {
  for (const r of [
    { re: Infinity, im: 0 },
    { re: 1, im: -Infinity },
    { re: NaN, im: NaN },
  ]) {
    expect(numberResult(ce, r)).toBeUndefined();
    expect(numberResult(ce, r, { pole: false })).toBeUndefined();
    expect(numberResult(ce, r, { pole: true })?.json).toBe("ComplexInfinity");
  }
});
