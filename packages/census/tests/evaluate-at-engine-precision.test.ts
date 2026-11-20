// `evaluate()` with a float operand is a numeric call at the engine's precision, so it declines a double
// kernel's answer exactly where `.N()` does: LaguerreL(1, 0.5 + 1e-20) is no machine 0.5, and its
// 1 + 1e-20 is no exact 0. The routes agree, answering rightly or declining.
import { fullEngine } from "@notatio/census";
import { parseExpression } from "@notatio/formats/expression";
import { expect, test } from "vite-plus/test";
import { FULL_ENGINE_TIMEOUT } from "./timeouts.ts";

const cases: readonly string[] = [
  "LaguerreL(1, 0.50000000000000000001)",
  "LaguerreL(1, 1.00000000000000000001)",
  "LaguerreL(1, 1)",
  "LerchPhi(2, 2, 1.5)",
  "PolyLog(2, 0.6 + 0.8i)",
  "AiryBiPrime(0.7)",
];

test(
  "evaluate, N, N(x, d) and the parse route agree at 50 digits and at machine precision",
  () => {
    const ce = fullEngine();
    const at = <T>(digits: number | "machine", run: () => T): T => {
      const precision = ce.precision;
      ce.precision = digits;
      try {
        return run();
      } finally {
        ce.precision = precision;
      }
    };
    const show = (x: { operator: string; re: number; im: number }): string =>
      Number.isFinite(x.re) && Number.isFinite(x.im) ? `${x.re}${x.im ? `+${x.im}i` : ""}` : "unevaluated";
    const table: Record<string, Record<string, string>> = {};
    for (const src of cases) {
      const json = parseExpression(src).json as never;
      const row: Record<string, string> = {};
      for (const digits of [50, "machine"] as const) {
        row[`evaluate@${digits}`] = at(digits, () => show(ce.box(json).evaluate() as never));
        row[`N@${digits}`] = at(digits, () => show(ce.box(json).N() as never));
        row[`N(x,30)@${digits}`] = at(digits, () => show(ce.box(["N", json, 30] as never).evaluate() as never));
      }
      table[src] = row;
    }
    for (const [src, row] of Object.entries(table)) {
      // The same call answers, or declines, whichever way it is asked for.
      expect(row["evaluate@50"], src).toBe(row["N@50"]);
      expect(row["evaluate@machine"], src).toBe(row["N@machine"]);
      // N(x, d) answers what the others do or declines; it never answers differently.
      for (const key of ["N(x,30)@50", "N(x,30)@machine"])
        expect([row["N@machine"], row["N@50"], "unevaluated"], `${src} ${key}`).toContain(row[key]);
    }
    // A float a double doesn't hold is no machine 0.5, and 1 - 1e-20 is no exact 0.
    for (const src of cases.slice(0, 2)) expect(table[src]!["evaluate@50"], src).toBe("unevaluated");
    expect(table["LaguerreL(1, 1)"]!["evaluate@50"]).toBe("0");
    expect(table["LaguerreL(1, 1)"]!["evaluate@machine"]).toBe("0");
    expect(table["LaguerreL(1, 0.50000000000000000001)"]!["evaluate@machine"]).toBe("0.5");
  },
  FULL_ENGINE_TIMEOUT,
);
