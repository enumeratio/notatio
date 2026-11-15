// GCD through the engine on every route, either side of the Euclid/Lehmer threshold (128 bits):
// evaluate(), .N() and the compiled function agree with plain Euclid.
import type { Json } from "@notatio/engine";
import { compileExpression } from "@notatio/engine/compiled";
import { createEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareNumerals } from "@notatio/numerals";
import { declareResidues } from "@notatio/residues";
import { declareNumberTheory } from "../src/declare.ts";

const ce = createEngine(declareResidues, declareNumerals, declareNumberTheory);

const euclid = (a: bigint, b: bigint): bigint => {
  let [x, y] = [a < 0n ? -a : a, b < 0n ? -b : b];
  while (y > 0n) [x, y] = [y, x % y];
  return x;
};
const lit = (n: bigint): Json => (n >= -(2n ** 53n) && n <= 2n ** 53n ? Number(n) : { num: n.toString() });

let seed = 1340;
const random = (bits: number): bigint => {
  let n = 1n;
  while (n.toString(2).length <= bits) {
    seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
    n = (n << 31n) | BigInt(seed);
  }
  return n >> BigInt(n.toString(2).length - bits);
};

test("GCD agrees with Euclid under evaluate() and .N(), either side of the threshold", () => {
  for (const bits of [100, 127, 128, 129, 400]) {
    for (const common of [1n, random(Math.floor(bits / 2))]) {
      for (const [sa, sb] of [
        [1n, 1n],
        [-1n, 1n],
        [1n, -1n],
      ] as const) {
        const a = sa * common * random(bits);
        const b = sb * common * random(bits);
        const want = lit(euclid(a, b));
        const call = ["GCD", lit(a), lit(b)] as Json;
        expect(ce.box(call).evaluate().json).toEqual(want);
        expect(ce.box(call).N().json).toEqual(want);
      }
    }
  }
  const p200 = 2n ** 200n;
  expect(ce.box(["GCD", 0, lit(p200)] as Json).evaluate().json).toEqual(lit(p200));
  expect(ce.box(["GCD", lit(-p200), 0] as Json).evaluate().json).toEqual(lit(p200));
});

test("GCD has no compiled lowering, here or in compute-engine, so there is no compiled route to keep in step", () => {
  expect(compileExpression(ce.box(["GCD", "a", "b"] as Json))).toBeUndefined();
});
