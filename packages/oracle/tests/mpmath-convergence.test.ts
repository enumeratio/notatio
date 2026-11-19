import { spawnSync } from "node:child_process";
import { expect, test } from "vite-plus/test";
import { MPMATH_PREAMBLE, pythonBatchCode } from "../src/run.ts";

// A PolyLog or LerchPhi row is ground truth only when a second precision agrees with it: near
// |z| = 1 mpmath's 30-digit Li_(1/2)(1 - 1e-12) differs from its 40-digit value in the 20th digit.

const hasMpmath = spawnSync("python3", ["-I", "-c", "import mpmath"]).status === 0;

function run(sources: readonly string[]): string[] {
  const code = pythonBatchCode(
    sources,
    MPMATH_PREAMBLE,
    (src, ns) => `enumeratio_checked(${src}, ${ns})`,
    "enumeratio_value",
  );
  const done = spawnSync("python3", ["-I", "-"], { input: code, encoding: "utf8" });
  return done.stdout
    .split("\n")
    .filter((line) => /^<<[1-9]\d*>>/.test(line))
    .map((line) => line.replace(/^<<\d+>>/, ""));
}

test.skipIf(!hasMpmath)("a PolyLog row near |z| = 1 is unconverged, one away from it is answered", () => {
  const [near, far, notChecked] = run(["polylog((mpf(1)/2), 1-mpf('1e-12'))", "polylog(2, mpf(9)/10)", "zeta(3)"]);
  expect(near).toMatch(/^!!ArithmeticError: Unconverged/);
  expect(far).toMatch(/^1\.29971472300495/);
  expect(notChecked).toMatch(/^1\.2020569031595/);
});

test.skipIf(!hasMpmath)("an N row of PolyLog answers where its two precisions agree", () => {
  const [few, many] = run([
    "enumeratio_n(lambda: polylog((mpf(1)/2), 1-mpf('1e-12')), 15)",
    "enumeratio_n(lambda: polylog((mpf(1)/2), 1-mpf('1e-12')), 60)",
  ]);
  expect(few).toBe("1772452.39055056");
  expect(many).toMatch(/^1772452.390550564104456514/);
});
