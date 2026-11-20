import { appendFileSync, readFileSync } from "node:fs";
import { createEngine } from "@notatio/engine/testing";
import { BigDecimal } from "@notatio/engine";
// unstable: the Expression type, which the nucleus facade doesn't re-export
import type { Expression } from "@notatio/engine/unstable";
import { MAX_RECURRENCE_ORDER, bigCx, orthogonalRecurrence } from "@notatio/ce-patches";
import { expect, test } from "vite-plus/test";
import { declareAnalytic } from "../src/declare.ts";

// The orthogonal polynomials at an exact degree and a concrete x, by the three-term recurrence in bignums (DLMF 18.9.1;
// ce-patches' orthogonal-recurrence.ts), against mpmath at 30 and 50 digits (scripts/collect-orthogonal-recurrence-
// mpmath.py). The error is relative to the result's size, and a call may decline: a decline is allowed, a wrong digit
// is not. The whole grid runs under DEEP_TESTS=1; the standard run keeps fixed cases of each kind.

interface Row {
  head: string;
  n: number;
  a: string;
  x: [string, string];
  kind: string;
  value: [string, string];
}

const { rows } = JSON.parse(readFileSync(new URL("./orthogonal-recurrence.mpmath.json", import.meta.url), "utf8")) as {
  rows: Row[];
};

const ce = createEngine(declareAnalytic);

const json = ([re, im]: [string, string]) => (im === "0" ? { num: re } : ["Complex", { num: re }, { num: im }]);
const part = (big: BigDecimal | undefined, double: number): BigDecimal => big ?? new BigDecimal(String(double));

const callOf = (row: Row) => {
  const x = json(row.x);
  return (
    row.head === "LaguerreL" && row.a !== "0" ? [row.head, row.n, { num: row.a }, x] : [row.head, row.n, x]
  ) as never;
};

/** |answer − value| / |value|, from the parts as BigDecimals; the absolute size of the answer where the value is 0. */
function relativeError(answer: Expression, row: Row): number {
  const [reRef, imRef] = row.value.map((v) => new BigDecimal(v)) as [BigDecimal, BigDecimal];
  const dRe = part(answer.bignumRe, answer.re).sub(reRef);
  const dIm = part(answer.bignumIm, answer.im).sub(imRef);
  const size = reRef.abs().add(imRef.abs());
  const diff = dRe.abs().add(dIm.abs());
  return (size.isZero() ? diff : diff.div(size)).toNumber();
}

const label = (row: Row, digits: number) =>
  `${row.head}(${row.n}${row.head === "LaguerreL" ? `, a = ${row.a}` : ""}, ${row.kind} x = ${row.x.join(" + i·")}), ${digits} digits`;

/** Run `how` on the call at `digits`; each answer is within 10^(2 − digits) of mpmath, or the call is unevaluated. */
function check(row: Row, digits: number): "answered" | "declined" {
  const saved = ce.precision;
  ce.precision = digits;
  try {
    const routes: Expression[] = [
      ce.box(callOf(row)).N(),
      ce.box(callOf(row)).evaluate(),
      ce.box(["N", callOf(row), digits] as never).evaluate(),
    ];
    let answered = 0;
    for (const answer of routes) {
      if (answer.operator === row.head) continue;
      answered++;
      expect(relativeError(answer, row), `${label(row, digits)}: ${answer.toString()}`).toBeLessThan(
        10 ** (2 - digits),
      );
    }
    return answered === 0 ? "declined" : "answered";
  } finally {
    ce.precision = saved;
  }
}

const find = (head: string, n: number, kind: string, a = "0") =>
  rows.find((row) => row.head === head && row.n === n && row.kind === kind && row.a === a)!;

const standard = [
  find("LaguerreL", 20, "1.00000000000000000001"),
  find("LaguerreL", 5, "zero"),
  find("LaguerreL", 20, "3", "2.5"),
  find("ChebyshevT", 100, "zero"),
  find("ChebyshevT", 20, "1.00000000000000000001"),
  find("ChebyshevU", 5, "1e-20"),
  find("ChebyshevU", 20, "complex"),
  find("HermiteH", 20, "zero"),
  find("HermiteH", 5, "100"),
  find("LegendrePolynomial", 20, "zero"),
  find("LegendrePolynomial", 100, "0.5"),
  find("LegendrePolynomial", 5, "complex"),
];

test("the recurrence agrees with mpmath at 30 digits for each head, near a zero and away from one", () => {
  for (const row of standard) expect(check(row, 30), label(row, 30)).toBe("answered");
});

test("L_1(1e-20) and L_1(1 + 1e-20) at 50 digits answer to their digits", () => {
  ce.precision = 50;
  const small = ce.box(["N", ["LaguerreL", 1, { num: "1e-20" }], 50] as never).evaluate();
  expect(small.toString()).toBe("0.99999999999999999999");
  const near = ce.box(["N", ["LaguerreL", 1, { num: "1.00000000000000000001" }], 50] as never).evaluate();
  expect(near.toString()).toBe("-1e-20");
});

test("evaluate(), N(), N(expr, d) and the parsed call give the same value", () => {
  ce.precision = 40;
  const call = ["ChebyshevT", 20, { num: "0.99999999999999999999" }] as never;
  const routes = [
    ce.box(call).N(),
    ce.box(call).evaluate(),
    ce.box(["N", call, 40] as never).evaluate(),
    ce.parse("\\operatorname{ChebyshevT}(20, 0.99999999999999999999)").N(),
  ];
  for (const answer of routes) {
    expect(answer.operator).not.toBe("ChebyshevT");
    expect(answer.toString()).toBe(routes[0]!.toString());
  }
});

test("a degree past the cap and an exact zero of the recurrence decline; an exact x keeps its exact answer", () => {
  expect(
    orthogonalRecurrence("T", MAX_RECURRENCE_ORDER + 1, undefined, bigCx(new BigDecimal("0.3")), 30),
  ).toBeUndefined();
  // U_2(1/2) = 0: a zero of the recurrence has no digits to vouch for, so the kernel leaves it to the exact route.
  expect(orthogonalRecurrence("U", 2, undefined, bigCx(new BigDecimal("0.5")), 30)).toBeUndefined();
  ce.precision = 30;
  expect(
    ce
      .box(["ChebyshevT", 3, ["Rational", 1, 2]] as never)
      .evaluate()
      .toString(),
  ).toBe("-1");
  expect(
    ce
      .box(["LaguerreL", 1, 1] as never)
      .N()
      .toString(),
  ).toBe("0");
});

// The whole grid, one test per head so each stays well inside the test timeout.
for (const head of new Set(rows.map((row) => row.head))) {
  test.runIf(process.env.DEEP_TESTS === "1")(
    `${head}: every degree and x agrees with mpmath at 30 and 50 digits`,
    () => {
      const declined: string[] = [];
      for (const row of rows.filter((r) => r.head === head))
        for (const digits of [30, 50]) if (check(row, digits) === "declined") declined.push(label(row, digits));
      // GRID_REPORT names a file to list the declined points in, for the hand-back.
      const total = rows.filter((r) => r.head === head).length * 2;
      if (process.env.GRID_REPORT)
        appendFileSync(
          process.env.GRID_REPORT,
          `${head}: ${declined.length} declined of ${total}\n${declined.join("\n")}\n`,
        );
    },
  );
}
