// unstable: a bare engine to declare the analytic library against
import { ComputeEngine } from "@enumeratio/engine/unstable";
import { expect, test } from "vite-plus/test";
import { declareAnalytic } from "../src/declare.ts";

const ce = new ComputeEngine();
declareAnalytic(ce);

// mpmath.zeta at dps 60. The double Hermite integral cancels to these at large Im s; it used to
// answer with relative errors of 0.12 and 1.2e-7 at the first two; the big-number kernel answers
// them, and the double one declines (packages/ce-patches/tests/hurwitz-quadrature.test.ts).
const cases = [
  { s: [-1, 40], a: [0.4258, -10.7278], want: { re: 4.5419091368042345e-28, im: 5.541994654905972e-28 } },
  { s: [-10, 40], a: [-1.834, -12.915], want: { re: 3.818399662870247e-21, im: 1.44507504760082e-20 } },
];

test("HurwitzZeta at large Im s left of the strip keeps its digits on N, evaluate and the parse route", () => {
  for (const { s, a, want } of cases) {
    const boxed = ce.box(["HurwitzZeta", ["Complex", s[0], s[1]], ["Complex", a[0], a[1]]]);
    const parsed = ce.parse(`\\operatorname{HurwitzZeta}(${s[0]}+${s[1]}i,${a[0]}${a[1]}i)`);
    for (const result of [boxed.N(), boxed.evaluate(), parsed.N()]) {
      expect(Math.abs(result.re - want.re) / Math.abs(want.re)).toBeLessThan(1e-8);
      expect(Math.abs(result.im - want.im) / Math.abs(want.im)).toBeLessThan(1e-8);
    }
  }
});
