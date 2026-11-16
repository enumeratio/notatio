import { createEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareAnalytic } from "../src/declare.ts";

// A reciprocal and a quotient of the analytic kernels' values are correct to the digits asked
// for, on `N(expr, d)` and on `.N()` at `ce.precision = d`. Expected values are mpmath's
// (60 digits, arguments exact), `y` being BesselI(0, 1).

const ce = createEngine(declareAnalytic);

const operands: Record<string, unknown> = {
  I1: ["BesselI", 1, 1],
  Zeta3: ["Zeta", 3],
  Gamma13: ["Gamma", ["Rational", 1, 3]],
  K13: ["EllipticK", ["Rational", 1, 3]],
  Pi: "Pi",
  E: "ExponentialE",
};

const expected: Record<string, string> = {
  "1/I1": "1.76941323768058258571291113818691807837089872400377438743419",
  "y/I1": "2.24019372387008974110522064172982977202724686729039365354477",
  "1/Zeta3": "0.83190737258070746868312627882153073441705639773372807927967",
  "y/Zeta3": "1.05324953787476043324507889826729599567874205970449569154532",
  "1/Gamma13": "0.37328217390739522832635031242331966097696715352624923913354",
  "y/Gamma13": "0.47259982315724416284521073457666240920945791408113021886545",
  "1/K13": "0.57672891273057844028529560757527379602988668391133362948433",
  "y/K13": "0.73017679712120120747100248232187537397141298621616560642418",
  "1/Pi": "0.31830988618379067153776752674502872406891929148091289749533",
  "y/Pi": "0.40300128544842280745842168782437544066327556886083232361099",
  "1/E": "0.36787944117144232159552377016146086744581113103176783450783",
  "y/E": "0.46575960759364043650190152956320999873286591182879916803961",
};

const SCALE = 120;
// the value times 10^SCALE, as an integer
const scaled = (s: string): bigint => {
  const m = /^(-?)(\d*)\.?(\d*)$/.exec(s);
  if (!m) throw new Error(`not a plain decimal: ${s}`);
  const v = BigInt(m[2] + m[3]) * 10n ** BigInt(SCALE - m[3].length);
  return m[1] ? -v : v;
};
// the leading digits two decimals share: the reference's length less the difference's
const agreeing = (got: string, ref: string): number => {
  const a = scaled(got);
  const b = scaled(ref);
  const diff = a > b ? a - b : b - a;
  return diff === 0n ? Infinity : b.toString().length - diff.toString().length;
};
const num = (x: { json: unknown }): string => {
  const j = x.json as { num?: string };
  if (j.num === undefined) throw new Error(`not a bignum: ${JSON.stringify(x.json)}`);
  return j.num;
};

const withPrecision = <T>(d: number, fn: () => T): T => {
  const saved = ce.precision;
  ce.precision = d;
  try {
    return fn();
  } finally {
    ce.precision = saved;
  }
};

const expr = (label: string): unknown => {
  const [numerator, name] = label.split("/");
  return ["Divide", numerator === "1" ? 1 : ["BesselI", 0, 1], operands[name]];
};

test.each([30, 50])("1/x and y/x keep %i digits", (d) => {
  // the first call in a process can leave a lazily loaded kernel's call unevaluated
  ce.box(["N", ["BesselI", 1, 1], d] as never).evaluate();
  for (const label of Object.keys(expected)) {
    const viaN = num(withPrecision(d, () => ce.box(["N", expr(label), d] as never).evaluate()));
    const viaDotN = num(withPrecision(d, () => ce.box(expr(label) as never).N()));
    for (const got of [viaN, viaDotN])
      expect(agreeing(got, expected[label]), `${label} at ${d}: ${got}`).toBeGreaterThanOrEqual(d - 1);
  }
});
