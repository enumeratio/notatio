import { expect, test } from "vite-plus/test";
import { cx, type Cx, hurwitzZetaChecked, hurwitzZetaWithError, MAX_RELATIVE_ERROR } from "../src/index.ts";

const relative = (got: Cx, want: Cx): number =>
  Math.hypot(got.re - want.re, got.im - want.im) / Math.hypot(want.re, want.im);

// mpmath.zeta at dps 60. Left of the strip at large |Im s| a = x − iy with y near Im s / 4 puts the
// branch point of Hermite's integrand on the path's side of the peak, so the integrand sits at 1e-46
// for t up to 10 and then climbs to 1e-11 near t = 12, while ζ itself is 1e-28: the integral is
// cancellation and the kernel used to stop before the climb, answering with a plausible ratio.
const CANCELLED: [Cx, Cx, Cx][] = [
  [cx(-1, 40), cx(0.4258, -10.7278), cx(4.5419091368042345e-28, 5.541994654905972e-28)],
  [cx(-10, 40), cx(-1.834, -12.915), cx(3.818399662870247e-21, 1.44507504760082e-20)],
  [cx(-1, 60), cx(0.29298052975796196, -10.744762227046296), cx(7.309261941887892e-29, -1.209552253911001e-28)],
  [cx(-10, 100), cx(0.9402634234866554, -19.2518052837832), cx(7.616770423884604e-41, 9.806885997331482e-41)],
  [
    cx(-3.166340821984729, 49.25646159273294),
    cx(-0.9697204925032388, -13.668658526861957),
    cx(8.935623480006683e-34, 1.9544503896991545e-34),
  ],
  [cx(-10, 24), cx(-1.8726249451689867, -8.009320125452707), cx(-1.1119216984490448e-12, 2.027972847326024e-11)],
];

test("the checked Hurwitz zeta never answers wrong where Hermite's integral cancels at large Im s", () => {
  for (const [s, a, want] of CANCELLED) {
    const got = hurwitzZetaChecked(s, a);
    // Answered only if right to the digits asked for.
    if (got) expect(relative(got, want), `s = ${s.re}+${s.im}i, a = ${a.re}${a.im}i`).toBeLessThan(MAX_RELATIVE_ERROR);
    const withError = hurwitzZetaWithError(s, a);
    expect(Math.hypot(withError.value.re - want.re, withError.value.im - want.im)).toBeLessThanOrEqual(withError.error);
  }
});

test("the points that used to answer wrong now decline", () => {
  for (const [s, a] of CANCELLED.slice(0, 5)) {
    expect(hurwitzZetaChecked(s, a), `s = ${s.re}+${s.im}i, a = ${a.re}${a.im}i`).toBeUndefined();
  }
});

// mpmath.zeta at dps 60: Hermite's integral without cancellation still answers.
test("Hermite's integral keeps its digits where the integrand does not cancel", () => {
  const cases: [Cx, Cx, Cx][] = [
    [cx(-5, 24), cx(3.2, -4), cx(5.487305394974963e-9, -3.1841571876088156e-8)],
    [cx(-2.5, 12), cx(0.4, 1), cx(-944866.3188761029, 1680580.2208016042)],
  ];
  for (const [s, a, want] of cases) {
    const got = hurwitzZetaChecked(s, a)!;
    expect(got).toBeDefined();
    expect(relative(got, want)).toBeLessThan(1e-12);
  }
});
