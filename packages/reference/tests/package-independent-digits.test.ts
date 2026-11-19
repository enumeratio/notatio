import { declareAnalytic } from "@notatio/analytic";
import type { Engine } from "@notatio/engine";
import { createEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declaredEngine } from "../scripts/engines.ts";

// A numeric answer does not depend on which packages are declared, and prints only digits it can
// vouch for. `analytic` alone and the full engine (whose `hypercomplex` and `numerals` rows widen
// `Add` and `Multiply`) answer the same, and for the cases below every printed digit is
// mpmath's (60 digits, arguments exact), correctly rounded: at the default 21 digits and at 30.

const cases: readonly { name: string; expr: unknown; at21: string; at30: string }[] = [
  {
    name: "PolyGamma(3, 5)",
    expr: ["PolyGamma", 3, 5],
    at21: "0.0214278281927550750219",
    at30: "0.0214278281927550750219481051729",
  },
  {
    name: "PolyGamma(1, 2)",
    expr: ["PolyGamma", 1, 2],
    at21: "0.644934066848226436472",
    at30: "0.644934066848226436472415166646",
  },
  {
    name: "PolyGamma(3, 1)",
    expr: ["PolyGamma", 3, 1],
    at21: "6.4939394022668291491",
    at30: "6.49393940226682914909602217925",
  },
  {
    name: "PolyGamma(3, 2)",
    expr: ["PolyGamma", 3, 2],
    at21: "0.493939402266829149096",
    at30: "0.493939402266829149096022179247",
  },
  {
    name: "PolyGamma(5, 1)",
    expr: ["PolyGamma", 5, 1],
    at21: "122.081167438133896766",
    at30: "122.081167438133896765742151575",
  },
  {
    name: "PolyGamma(5, 2)",
    expr: ["PolyGamma", 5, 2],
    at21: "2.08116743813389676574",
    at30: "2.08116743813389676574215157491",
  },
  {
    name: "Gamma(3, 1, 7)",
    expr: ["Gamma", 3, 1, 7],
    at21: "1.78012487809616805446",
    at30: "1.78012487809616805445741500532",
  },
  {
    name: "GammaRegularized(3, 1, 7)",
    expr: ["GammaRegularized", 3, 1, 7],
    at21: "0.890062439048084027229",
    at30: "0.89006243904808402722870750266",
  },
  {
    name: "HarmonicNumber(1/2, 2)",
    expr: ["HarmonicNumber", ["Rational", 1, 2], 2],
    at21: "0.710131866303547127055",
    at30: "0.710131866303547127055169666708",
  },
];

// Answers that agree across engines but whose digits are not all right: a double-only kernel's
// value (`N(DedekindEta(i))` is a double at the default precision) carried through bignum
// arithmetic prints more digits than the double held.
const agreeing: readonly (readonly [string, unknown])[] = [
  [
    "(2π)^12 η(i)^24",
    ["Multiply", ["Power", ["Multiply", 2, "Pi"], 12], ["Power", ["DedekindEta", ["Complex", 0, 1]], 24]],
  ],
  ["ExpIntegralE(5/3, -2.2)", ["ExpIntegralE", ["Rational", 5, 3], -2.2]],
  [
    "H0F1R(1/2) sum",
    [
      "Add",
      [
        "Multiply",
        ["Rational", -1, 2],
        ["Power", ["Hypergeometric0F1Regularized", ["Rational", 3, 2], ["Rational", 1, 2]], 2],
      ],
      ["Power", ["Hypergeometric0F1Regularized", ["Rational", 1, 2], ["Rational", 1, 2]], 2],
    ],
  ],
  [
    "H0F1R(2) sum",
    [
      "Add",
      ["Multiply", -2, ["Power", ["Hypergeometric0F1Regularized", ["Rational", 3, 2], 2], 2]],
      ["Power", ["Hypergeometric0F1Regularized", ["Rational", 1, 2], 2], 2],
    ],
  ],
  [
    "MatrixFunction(CubeRoot)",
    [
      "MatrixFunction",
      "CubeRoot",
      ["List", ["List", ["Rational", 1, 2], -1], ["List", ["Rational", -5, 3], ["Rational", 1, 2]]],
    ],
  ],
];

const alone = createEngine(declareAnalytic);
const full = declaredEngine();
const engines: readonly [string, Engine][] = [
  ["analytic alone", alone],
  ["the full engine", full],
];

/** A decimal's digits with no trailing zeros, so `6.4939394022668291491` and `…910` are the same. */
const canonical = (text: string): string => (text.includes(".") ? text.replace(/0+$/, "").replace(/\.$/, "") : text);

const numOf = (engine: Engine, expr: unknown): string => {
  const json = engine.box(expr as never).evaluate().json as { num?: string };
  if (json.num === undefined) throw new Error(`not a decimal: ${JSON.stringify(json)}`);
  return canonical(json.num);
};

test.each(engines)("%s prints mpmath's digits at 21 and at 30", (_label, engine) => {
  // the first call in a process can leave a lazily loaded kernel's call unevaluated
  engine.box(["N", ["PolyGamma", 3, 1]] as never).evaluate();
  for (const { name, expr, at21, at30 } of cases) {
    expect(numOf(engine, ["N", expr]), `${name}, default precision`).toBe(canonical(at21));
    expect(numOf(engine, ["N", expr, 30]), `${name}, 30 digits`).toBe(canonical(at30));
  }
});

test("the engines answer alike where a kernel's digits are not all right", () => {
  for (const [name, expr] of agreeing) {
    const [a, f] = [alone, full].map((engine) => JSON.stringify(engine.box(["N", expr] as never).evaluate().json));
    expect(f, name).toBe(a);
  }
});
