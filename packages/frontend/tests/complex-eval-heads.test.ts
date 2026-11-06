import { ComputeEngine } from "@cortex-js/compute-engine";
import { emitComplexWGSL } from "@enumeratio/ce-patches/wgsl-complex";
import { parseExpression } from "@enumeratio/formats/expression";
import { expect, test } from "vite-plus/test";
import { type Complex, complexFunction } from "../src/complex-eval.ts";

// The heads the complex emitter lowers to WGSL, held to the CPU evaluator on the same expression:
// both routes answer, and the CPU one agrees with mpmath 1.3.0 (30 digits) at three points, one in
// each quadrant that matters (right half plane, upper-left, lower-right), cuts and branches included.

const ce = new ComputeEngine();
const POINTS: readonly Complex[] = [
  [0.7, 0.3],
  [-2.3, 1.1],
  [3.1, -2.2],
];

const CASES: Record<string, readonly Complex[]> = {
  "Log(z)": [
    [-0.118286003218531, 0.175842268551562],
    [0.406456678321428, 1.1706351755893],
    [0.579933923546283, -0.268042815624169],
  ],
  "Log(z, 2)": [
    [-0.392937597323576, 0.584135372170164],
    [1.35021985907055, 3.8887658786535],
    [1.92649879380666, -0.890418959854639],
  ],
  "Tan(z)": [
    [0.72703718624352, 0.469705165967558],
    [0.223012895633924, 1.00030283719142],
    [-0.00199120910732376, -0.975823987387837],
  ],
  "Tanh(z)": [
    [0.63983593026318, 0.189717091519087],
    [-1.01176698094136, 0.0164466653844912],
    [1.00124072690569, 0.00386722894156672],
  ],
  "Sinc(z)": [
    [0.933225658897575, -0.0672253290809222],
    [0.28966338286274, 0.525452001467745],
    [-0.637255871929994, 0.984286298742324],
  ],
  "Arg(z)": [
    [0.404891786285083, 0],
    [2.69548710464639, 0],
    [-0.617191391540362, 0],
  ],
  "LogGamma(z)": [
    [0.14115534600036, -0.339646935665205],
    [-2.39637337098966, -7.63276506640285],
    [-0.0490890121620439, -2.32982253615189],
  ],
  "GammaLn(z)": [
    [0.14115534600036, -0.339646935665205],
    [-2.39637337098966, -1.34957975922327],
    [-0.0490890121620439, -2.32982253615189],
  ],
  "Digamma(z)": [
    [-0.971791484812059, 0.751313314974531],
    [1.1106956711939, 2.76836858395281],
    [1.22614697010848, -0.698734217590669],
  ],
  "Trigamma(z)": [
    [1.94399489920551, -1.42149940781751],
    [-0.295822323109869, -0.0815360523829711],
    [0.225155372413774, 0.187822868231446],
  ],
  "PolyGamma(0, z)": [
    [-0.971791484812059, 0.751313314974531],
    [1.1106956711939, 2.76836858395281],
    [1.22614697010848, -0.698734217590669],
  ],
  "DirichletEta(z)": [
    [0.645244953253211, 0.0539310511830983],
    [-0.161761041988508, 0.22499005934173],
    [0.979000007800925, -0.0968829611948103],
  ],
  "DirichletBeta(z)": [
    [0.72839446126376, 0.0726052816176447],
    [-1.35238158624095, 0.335297953952597],
    [1.01955020509485, -0.0232086556594621],
  ],
  "Pochhammer(2.5, z)": [
    [1.71343713762375, 0.5304923790276],
    [0.033140352330899, -0.326469058791345],
    [-25.517394447307, 14.2874764299557],
  ],
  "Binomial(5, z)": [
    [3.33203019783355, 1.43266794418151],
    [0.0365477596302345, 0.0477972188160165],
    [32.0869303451946, 30.5465848008208],
  ],
};

const json = (src: string) => {
  const { json, errors } = parseExpression(src);
  expect(errors, src).toEqual([]);
  return ce.box(json).json;
};

for (const [src, want] of Object.entries(CASES)) {
  test(`${src}: lowered to WGSL, and the CPU evaluator agrees with mpmath`, () => {
    expect(emitComplexWGSL(json(src) as never, "z"), `${src} has a WGSL lowering`).toBeDefined();
    const f = complexFunction(json(src), "z");
    expect(f, `${src} has a CPU lowering`).toBeDefined();
    POINTS.forEach((p, i) => {
      const got = f!(p);
      const w = want[i]!;
      expect(
        Math.hypot(got[0] - w[0], got[1] - w[1]) / Math.max(Math.hypot(w[0], w[1]), 1e-3),
        `${src} at ${p.join(", ")}`,
      ).toBeLessThan(1e-7);
    });
  });
}

test("Log is base 10 on both routes, with its cut on the negative real axis (upper side on the axis)", () => {
  const f = complexFunction(json("Log(z)"), "z")!;
  const ln10 = Math.LN10;
  expect(f([-2, 0])[0]).toBeCloseTo(Math.log(2) / ln10, 12);
  expect(f([-2, 0])[1]).toBeCloseTo(Math.PI / ln10, 12);
  expect(f([-2, -1e-9])[1]).toBeCloseTo(-Math.PI / ln10, 8);
});
