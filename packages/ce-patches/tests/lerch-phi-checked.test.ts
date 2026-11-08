import { expect, test } from "vite-plus/test";
import {
  cx,
  type Cx,
  hurwitzZetaWithError,
  lerchPhi,
  lerchPhiChecked,
  lerchPhiReal,
  lerchPhiWithError,
  MAX_RELATIVE_ERROR,
} from "../src/index.ts";

const relative = (got: Cx, want: Cx): number =>
  Math.hypot(got.re - want.re, got.im - want.im) / Math.hypot(want.re, want.im);

// [z, s, a, mpmath.lerchphi at dps 60]. The direct series and the Euler transform lose their digits to
// terms that grow like n^(−Re s) or to a phase that swings e^(π|Im s|) (the first two points were
// 1e77 too large and 3.6e-3 off), and the series about z = 1 stopped at its first two small terms,
// before the peak of ζ(s − k, a)·Lᵏ/k! at k ≈ |s|·|L|/(2π − |L|).
const CASES: [Cx, Cx, Cx, Cx][] = [
  [cx(-1, 0), cx(-60, 4), cx(0.5, 0.5), cx(6.594191507296778e54, 5.922202899511086e54)],
  [cx(0.99, 0), cx(3, 24), cx(0.5, -6), cx(-7.68903184682916e-19, 1.2351029916570662e-18)],
  [cx(-1, 0), cx(-60.028572267894106, 0), cx(0.3586343164829757, 0), cx(7.544576076748818e51, 0)],
  [
    cx(-0.9, 0),
    cx(-59.904005997194496, 4),
    cx(-0.34840511538188057, 6.267630725083793),
    cx(-1.1987345065023518e62, 3.838684974856111e62),
  ],
  [
    cx(-0.5, 0),
    cx(-60.172022052516226, 0),
    cx(2.399902420798953, 7.687890420894902),
    cx(1.155509295863034e62, -2.2001651211776006e62),
  ],
  [
    cx(0.9, 0),
    cx(-59.842956177612955, 4),
    cx(2.8805202651730095, -7.634871826795502),
    cx(7.1484597758212035e140, -1.3257765649970824e141),
  ],
  [
    cx(0.99, 0),
    cx(-60.08448966320714, 0),
    cx(-1.3709289456989506, 2.9606214433998446),
    cx(1.2599249822996906e204, 3.7500437991595476e202),
  ],
  [
    cx(-0.7, 0.3),
    cx(-59.70412868133412, 4),
    cx(-1.4009448357252847, 0.553223020188959),
    cx(3.905592277005748e57, -3.369007088493553e57),
  ],
  [
    cx(0.3, -0.9),
    cx(-59.83988315843951, 0),
    cx(1.9266477536255486, 0),
    cx(-5.2556722093258805e75, -2.9403631622728135e75),
  ],
  [cx(-0.99, 0), cx(-60.076977572044065, 0), cx(-0.2807513716569061, 0), cx(-7.103889709188545e51, 1.7e-34)],
];

// The series about z = 1 sums ζ(s − k, a) out to k of a few hundred: each of these takes 0.1–0.4 s here.
const SLOW = [0, 3, 4, 7];
const STANDARD = CASES.filter((_, i) => !SLOW.includes(i));
const WHICH = process.env.DEEP_TESTS ? CASES : STANDARD;

test("the checked Lerch transcendent answers right or not at all where the double routes lose their digits", () => {
  for (const [z, s, a, want] of WHICH) {
    const got = lerchPhiChecked(z, s, a);
    const label = `Φ(${z.re}+${z.im}i, ${s.re}+${s.im}i, ${a.re}+${a.im}i)`;
    if (got) expect(relative(got, want), label).toBeLessThan(MAX_RELATIVE_ERROR);
    // The error reported covers the actual error, so a caller summing Φ's can rely on it.
    const reported = lerchPhiWithError(z, s, a);
    expect(Math.hypot(reported.value.re - want.re, reported.value.im - want.im), label).toBeLessThanOrEqual(
      reported.error,
    );
  }
});

test("the points whose error passes the digits asked for decline", () => {
  for (const [z, s, a] of process.env.DEEP_TESTS ? CASES.slice(0, 2) : [CASES[1]]) {
    expect(lerchPhiChecked(z, s, a), `Φ at s = ${s.re}+${s.im}i`).toBeUndefined();
  }
});

test("the checked Lerch transcendent keeps its digits where the routes hold them", () => {
  const holds: [Cx, Cx, Cx, Cx][] = [
    [cx(-0.99, 0), cx(-60.076977572044065, 0), cx(-0.2807513716569061, 0), cx(-7.103889709188545e51, 0)],
    [cx(-0.5, 0), cx(-2.5, 0), cx(1.5, 0), cx(0.6627429331690433, 0)],
    [cx(0.5, 0.5), cx(-3.5, 6), cx(0.7, 0.2), cx(984.9161722603329, 299.1839819425041)],
  ];
  for (const [z, s, a, want] of holds) {
    const got = lerchPhiChecked(z, s, a)!;
    expect(got, `Φ(${z.re}, ${s.re}, ${a.re})`).toBeDefined();
    expect(relative(got, want)).toBeLessThan(1e-10);
  }
});

// mpmath.lerchphi at dps 50.
test("the compiled real kernel agrees with the checked one and lerchPhi stays best effort", () => {
  expect(Math.abs(lerchPhiReal(0.99, 3, 0.5) / 8.40732223414121 - 1)).toBeLessThan(1e-10);
  expect(Math.abs(lerchPhiReal(-1, -60.5, 0.4) / 1.56786772084341e52 - 1)).toBeLessThan(1e-10);
  expect(lerchPhiChecked(cx(0.99), cx(3, 24), cx(0.5, -6))).toBeUndefined();
  expect(Number.isFinite(lerchPhi(cx(0.99), cx(3, 24), cx(0.5, -6)).re)).toBe(true);
});

// mpmath.zeta(−60.076977572044065 − k, 0.7192486283430939) at dps 60: the functional equation's exp
// reaches 3e2 here, so the sum is good to that many ulps, not one.
test("the Hurwitz error covers the reflected zeta's exp at very negative Re s", () => {
  const cases: [number, Cx][] = [
    [-60.076977572044065, cx(-3.856362483730883e33, 0)],
    [-160.07697757204406, cx(-3.5815889882397e156, 0)],
  ];
  for (const [s, want] of cases) {
    const got = hurwitzZetaWithError(cx(s, 0), cx(0.7192486283430939, 0));
    expect(Math.hypot(got.value.re - want.re, got.value.im - want.im), `s = ${s}`).toBeLessThanOrEqual(got.error);
  }
});
