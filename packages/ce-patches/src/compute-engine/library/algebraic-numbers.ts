// Algebraic numbers as Wolfram has them: PolynomialRoot (Wolfram's Root), MinimalPolynomial,
// AlgebraicIntegerQ, AlgebraicNumberNorm and AlgebraicNumberTrace, and the field an algebraic
// number generates: NumberFieldDiscriminant, NumberFieldIntegralBasis, NumberFieldSignature.
// An argument is read as a polynomial in one generator — a radical of a rational, i, the golden
// ratio, or a PolynomialRoot — and anything else is left unevaluated. The reading is checked
// against compute-engine's own numeric value of the argument, so a radical it takes on another
// branch (the real cube root of a negative number) is declined, not read as the principal one.

import { CancellationError, type Expression, type ComputeEngine } from "@cortex-js/compute-engine";
import type { LibraryRecord } from "../../patch.ts";
import {
  degree,
  element,
  type FieldElement,
  gcd,
  hermite,
  isIntegral,
  isIrreducible,
  maximalOrder,
  minimalPolynomial,
  multiply,
  orderDiscriminant,
  type Order,
  type Poly,
  realRootCount,
  type Tick,
} from "../numerics/number-field.ts";
import { type Complex, orderedRoots, refineRoot } from "../numerics/polynomial-roots.ts";

type Json = unknown;

/** A rational, `num / den` with `den > 0`. */
interface Rational {
  readonly num: bigint;
  readonly den: bigint;
}

const rational = (num: bigint, den = 1n): Rational => {
  if (den < 0n) [num, den] = [-num, -den];
  const g = gcd(num, den) || 1n;
  return { num: num / g, den: den / g };
};

const rationalJson = (r: Rational): Json =>
  r.den === 1n ? numberJson(r.num) : ["Rational", numberJson(r.num), numberJson(r.den)];

/** An integer literal, as a string past the doubles' exact range. */
const numberJson = (n: bigint): Json =>
  n <= BigInt(Number.MAX_SAFE_INTEGER) && n >= -BigInt(Number.MAX_SAFE_INTEGER) ? Number(n) : { num: n.toString() };

const head = (j: Json): string | undefined => (Array.isArray(j) && typeof j[0] === "string" ? j[0] : undefined);
const args = (j: Json): Json[] => (Array.isArray(j) ? j.slice(1) : []);

/** A rational literal, as MathJSON writes one. */
function rationalOf(j: Json): Rational | undefined {
  if (typeof j === "number") return Number.isInteger(j) ? rational(BigInt(j)) : undefined;
  if (typeof j === "object" && j !== null && !Array.isArray(j) && "num" in j) {
    const text = String((j as { num: unknown }).num);
    return /^-?\d+$/.test(text) ? rational(BigInt(text)) : undefined;
  }
  const h = head(j);
  if (h === "Rational") {
    const [a, b] = args(j).map(rationalOf);
    return a && b && a.den === 1n && b.den === 1n && b.num !== 0n ? rational(a.num, b.num) : undefined;
  }
  if (h === "Negate") {
    const a = rationalOf(args(j)[0]);
    return a && rational(-a.num, a.den);
  }
  return undefined;
}

// --- the generator --------------------------------------------------------------------------

/** Fields past this degree aren't attempted. */
const MAX_DEGREE = 12;

/** Powers past this, of the generator or of a sum in it, aren't expanded; nested powers multiply. */
const MAX_POWER = 256n;

const POLYNOMIAL_ROOT = "PolynomialRoot";

/**
 * What an argument is written in: one radical bᵐ/ᵏ of a rational, or one PolynomialRoot (the
 * `k`-th root of `polynomial`, a primitive integer polynomial with positive leading coefficient).
 */
type Atom =
  | { readonly kind: "radical"; readonly base: Rational; readonly index: number; readonly power: number }
  | {
      readonly kind: "root";
      readonly key: string;
      readonly source: Json;
      readonly variable: Json;
      readonly polynomial: readonly bigint[];
      readonly k: number;
    };

/** The deadline of the engine's current time limit, checked every so many calls (it throws to stop). */
export function deadlineTick(ce: ComputeEngine): Tick {
  let calls = 0;
  return () => {
    if ((++calls & 63) !== 0) return;
    const frame = ce._deadlineFrame;
    if (frame !== undefined && Date.now() > frame.at) {
      throw new CancellationError({
        message: "timeout",
        cause: "timeout",
        attribution: frame.owner,
        spans: frame.spans,
      });
    }
  };
}

/** The base and exponent of `j` when it is `Sqrt(b)`, `Root(b, k)` or `Power(b, m/k)` with b rational and 0 < m/k, k > 1. */
function radicalParts(j: Json): { base: Rational; exponent: Rational } | undefined {
  const h = head(j);
  const [a, b] = args(j);
  let base: Rational | undefined;
  let exponent: Rational | undefined;
  if (h === "Sqrt") [base, exponent] = [rationalOf(a), rational(1n, 2n)];
  else if (h === "Root") {
    const k = rationalOf(b);
    [base, exponent] = [rationalOf(a), k && k.den === 1n && k.num > 1n ? rational(1n, k.num) : undefined];
  } else if (h === "Power") [base, exponent] = [rationalOf(a), rationalOf(b)];
  if (base === undefined || exponent === undefined || exponent.den === 1n || exponent.num < 0n) return undefined;
  return { base, exponent };
}

/**
 * `j` with i, the golden ratio and `Complex(a, b)` written as square roots, i·√c (c > 0) as √−c,
 * so a Gaussian or Eisenstein number is one radical, and the radical of a negative base with an
 * odd index as compute-engine takes it: (−1)ᵐ times the radical of the positive base (the real root).
 */
function normalize(j: Json): Json {
  if (j === "ImaginaryUnit") return ["Sqrt", -1];
  if (j === "GoldenRatio") return ["Multiply", ["Rational", 1, 2], ["Add", 1, ["Sqrt", 5]]];
  const h = head(j);
  if (h === undefined || h === POLYNOMIAL_ROOT) return j;
  if (h === "Complex") {
    const [re, im] = args(j);
    return normalize(["Add", re, ["Multiply", im, "ImaginaryUnit"]]);
  }
  const ops = args(j).map(normalize);
  const node = [h, ...ops];
  const parts = radicalParts(node);
  if (parts !== undefined && parts.base.num < 0n && parts.exponent.den % 2n === 1n) {
    const positive = ["Power", rationalJson(rational(-parts.base.num, parts.base.den)), rationalJson(parts.exponent)];
    return parts.exponent.num % 2n === 1n ? ["Negate", positive] : positive;
  }
  if (h === "Multiply") {
    // i·√c = √−c for c > 0: then i and √c are one radical, not two. Only i itself, not Power(−1, 3/2).
    const i = ops.findIndex((o) => {
      const r = radicalOf(o);
      return r?.base.num === -1n && r.base.den === 1n && r.index === 2 && r.power === 1;
    });
    const root = ops.findIndex((o, k) => {
      const r = radicalOf(o);
      return k !== i && r !== undefined && r.index === 2 && r.power === 1 && r.base.num > 0n;
    });
    if (i >= 0 && root >= 0) {
      const r = radicalOf(ops[root])!;
      const rest = ops.filter((_, k) => k !== i && k !== root);
      return ["Multiply", ...rest, ["Sqrt", rationalJson(rational(-r.base.num, r.base.den))]];
    }
  }
  return node;
}

/**
 * `j` as bᵐ/ᵏ, b rational, 0 < m < k in lowest terms, on the principal branch. A negative base
 * with an odd index is the real root in compute-engine, which `normalize` rewrites, so it isn't
 * read here; an index past `MAX_DEGREE` can never be one generator's, so it is declined at once.
 */
function radicalOf(j: Json): Extract<Atom, { kind: "radical" }> | undefined {
  const parts = radicalParts(j);
  if (parts === undefined) return undefined;
  const { base, exponent } = parts;
  if (base.num === 0n || exponent.num > MAX_POWER || exponent.den > BigInt(MAX_DEGREE)) return undefined;
  if (base.num < 0n && exponent.den % 2n === 1n) return undefined;
  return { kind: "radical", base, index: Number(exponent.den), power: Number(exponent.num) };
}

/** The atoms of `j` and the radicals and roots in them; `false` for what isn't read. */
function atomsOf(j: Json, ce: ComputeEngine, into: Atom[], scale = 1n): boolean {
  if (rationalOf(j) !== undefined) return true;
  const radical = radicalOf(j);
  if (radical !== undefined) {
    into.push(radical);
    return true;
  }
  const h = head(j);
  if (h === POLYNOMIAL_ROOT) {
    const root = rootAtom(ce, args(j)[0], args(j)[1], args(j)[2]);
    if (root === undefined) return false;
    into.push(root);
    return true;
  }
  if (h === "Add" || h === "Multiply" || h === "Negate" || h === "Subtract")
    return args(j).every((o) => atomsOf(o, ce, into, scale));
  if (h === "Divide") return atomsOf(args(j)[0], ce, into, scale) && rationalOf(args(j)[1]) !== undefined;
  if (h === "Power" || h === "Square") {
    const e = h === "Square" ? rational(2n) : rationalOf(args(j)[1]);
    if (e === undefined || e.den !== 1n || e.num < 0n) return false;
    const next = scale * (e.num < 1n ? 1n : e.num);
    return next <= MAX_POWER && atomsOf(args(j)[0], ce, into, next);
  }
  return false;
}

/** `PolynomialRoot(p, x, k)` as an atom: `p` rational in `x`, `k` an integer from 1 to its degree. */
function rootAtom(ce: ComputeEngine, source: Json, x: Json, kj: Json): Extract<Atom, { kind: "root" }> | undefined {
  const cs = coefficientsOf(ce, source, x);
  const k = rationalOf(kj);
  if (cs === undefined || k === undefined || k.den !== 1n || k.num < 1n || k.num > BigInt(cs.length - 1)) {
    return undefined;
  }
  // Cleared of denominators and content, leading coefficient positive: the same roots, in the same order.
  const den = cs.reduce((l, c) => (l * c.den) / gcd(l, c.den), 1n);
  const cleared = cs.map((c) => (c.num * den) / c.den);
  const g = cleared.reduce((x, c) => gcd(x, c), 0n);
  const sign = cleared[cleared.length - 1]! < 0n ? -1n : 1n;
  const polynomial = cleared.map((c) => (sign * c) / g);
  return { kind: "root", key: `${polynomial.join(",")}#${k.num}`, source, variable: x, polynomial, k: Number(k.num) };
}

/** A polynomial's coefficients in the variable `x`, constant first; `undefined` unless rational and free of other unknowns. */
function coefficientsOf(ce: ComputeEngine, p: Json, x: Json): Rational[] | undefined {
  if (typeof x !== "string" || ce.box(p as never).unknowns.some((u) => u !== x)) return undefined;
  const list = ce.box(["CoefficientList", p, x] as never).evaluate().json;
  if (head(list) !== "List") return undefined;
  // CoefficientList is highest first.
  const cs = args(list).map(rationalOf).toReversed();
  return cs.every((c) => c !== undefined) && cs.length > 1 ? (cs as Rational[]) : undefined;
}

/** The field an argument lives in: θ a root of monic `f`, and the generator the argument is written in. */
export interface GeneratedField {
  readonly f: Poly;
  /** The generator, as an element of ℚ(θ). */
  readonly generator: FieldElement;
  /** The generator as an expression, its power `k` given. */
  readonly power: (k: number) => Json;
  /** The complex number θ stands for: the embedding the argument's numeric value is read in. */
  readonly theta: () => Complex | undefined;
}

const lcm = (a: number, b: number): number => (a * b) / Number(gcd(BigInt(a), BigInt(b)));

/** ⌊n^(1/p)⌋ for n ≥ 0, by Newton's method on bigints. */
function integerRoot(n: bigint, p: number): bigint {
  if (n < 2n) return n;
  const k = BigInt(p);
  let x = 1n << BigInt(Math.ceil(n.toString(2).length / p));
  for (;;) {
    const y = ((k - 1n) * x + n / x ** (k - 1n)) / k;
    if (y >= x) return x;
    x = y;
  }
}

const isPower = (n: bigint, p: number): boolean => {
  if (n < 0n) return p % 2 === 1 && isPower(-n, p);
  return integerRoot(n, p) ** BigInt(p) === n;
};

/** `x^k − c` is irreducible over ℚ iff c is no p-th power for a prime p | k, nor in −4ℚ⁴ when 4 | k (Capelli). */
function binomialIrreducible(k: number, c: bigint): boolean {
  for (let p = 2; p <= k; p++) {
    const prime = [...Array(p).keys()].slice(2).every((d) => p % d !== 0);
    if (prime && k % p === 0 && isPower(c, p)) return false;
  }
  return !(k % 4 === 0 && c < 0n && -c % 4n === 0n && isPower(-c / 4n, 4));
}

/** The field `atoms` generate, when it is one generator's. */
function fieldOf(atoms: readonly Atom[]): GeneratedField | undefined {
  if (atoms.length === 0) {
    return { f: [0n, 1n], generator: element([0n]), power: () => 1, theta: () => ({ re: 0, im: 0 }) };
  }
  const first = atoms[0]!;
  if (first.kind === "root") {
    if (atoms.some((a) => a.kind !== "root" || a.key !== first.key)) return undefined;
    // θ' = aₙ·θ is a root of the monic integer polynomial a₀aₙⁿ⁻¹ + … + x.
    const a = first.polynomial;
    const n = a.length - 1;
    if (n > MAX_DEGREE) return undefined;
    const lead = a[n]!;
    const f = a.map((c, i) => (i === n ? 1n : c * lead ** BigInt(n - 1 - i)));
    if (isIrreducible(f) !== true) return undefined;
    const theta = (): Complex | undefined => {
      const z = orderedRoots(a)?.[first.k - 1];
      return z && { re: z.re * Number(lead), im: z.im * Number(lead) };
    };
    return {
      f,
      generator: element(
        f.slice(0, n).map((_, i) => (i === 1 ? 1n : 0n)),
        lead,
      ),
      power: (k) =>
        k === 1
          ? [POLYNOMIAL_ROOT, first.source, first.variable, first.k]
          : ["Power", [POLYNOMIAL_ROOT, first.source, first.variable, first.k], k],
      theta,
    };
  }
  // Radicals of one base b: the generator is b^(1/L), L the indices' lcm.
  if (atoms.some((a) => a.kind !== "radical" || a.base.num !== first.base.num || a.base.den !== first.base.den)) {
    return undefined;
  }
  const L = atoms.reduce((l, a) => lcm(l, (a as typeof first).index), 1);
  if (L > MAX_DEGREE) return undefined;
  const { num: u, den: v } = first.base;
  // θ' = v·b^(1/L) is a root of x^L − u·v^(L−1).
  const c = u * v ** BigInt(L - 1);
  if (!binomialIrreducible(L, c)) return undefined;
  const f = [-c, ...Array.from({ length: L - 1 }, () => 0n), 1n];
  const b = rationalJson(first.base);
  return {
    f,
    generator: element(
      f.slice(0, L).map((_, i) => (i === 1 ? 1n : 0n)),
      v,
    ),
    power: (k) => (L === 2 && k === 1 ? ["Sqrt", b] : ["Power", b, ["Rational", k, L]]),
    // The principal L-th root of c: a negative c has only even indices here.
    theta: () => {
      const modulus = Math.pow(Math.abs(Number(c)), 1 / L);
      const angle = c < 0n ? Math.PI / L : 0;
      return { re: modulus * Math.cos(angle), im: modulus * Math.sin(angle) };
    },
  };
}

/** An argument read as an element of the field it generates. */
export interface Read {
  readonly field: GeneratedField;
  readonly x: FieldElement;
}

/** `x` at θ, and the sum of its terms' sizes (what a cancellation in it can cost). */
function approximate(x: FieldElement, theta: Complex): { value: Complex; size: number } | undefined {
  let value: Complex = { re: 0, im: 0 };
  let power: Complex = { re: 1, im: 0 };
  let size = 0;
  for (const c of x.num) {
    const t = Number(c) / Number(x.den);
    value = { re: value.re + t * power.re, im: value.im + t * power.im };
    size += Math.abs(t) * Math.hypot(power.re, power.im);
    power = { re: power.re * theta.re - power.im * theta.im, im: power.re * theta.im + power.im * theta.re };
  }
  return Number.isFinite(value.re) && Number.isFinite(value.im) && Number.isFinite(size) ? { value, size } : undefined;
}

/**
 * Whether `x` in `field` is the number compute-engine has for `arg`: the reading assumes one
 * branch for every radical, and a branch it didn't read (a root of a negative number, an index of
 * a PolynomialRoot) shows up here as a different value.
 */
function agreesWith(arg: Expression, field: GeneratedField, x: FieldElement): boolean {
  const theta = field.theta();
  const mine = theta && approximate(x, theta);
  const n = arg.N();
  if (mine === undefined || !Number.isFinite(n.re) || !Number.isFinite(n.im)) return false;
  const gap = Math.hypot(n.re - mine.value.re, n.im - mine.value.im);
  return gap <= 1e-9 * (mine.size + Math.hypot(n.re, n.im));
}

function read(ce: ComputeEngine, arg: Expression, tick: Tick): Read | undefined {
  // Exactly: a PolynomialRoot of degree 2 or less is written as the radicals it evaluates to.
  const exact = arg.evaluate();
  const j = normalize(exact.json);
  const atoms: Atom[] = [];
  if (!atomsOf(j, ce, atoms)) return undefined;
  const field = fieldOf(atoms);
  if (field === undefined) return undefined;
  const x = elementOf(j, field, tick);
  return x !== undefined && agreesWith(exact, field, x) ? { field, x } : undefined;
}

function elementOf(j: Json, field: GeneratedField, tick: Tick): FieldElement | undefined {
  const n = field.f.length - 1;
  const constant = (r: Rational): FieldElement => element([r.num, ...Array.from({ length: n - 1 }, () => 0n)], r.den);
  const one = constant(rational(1n));
  // Square and multiply: a power of a sum costs its exponent's bits, not the exponent.
  const pow = (x: FieldElement, k: number): FieldElement => {
    let out = one;
    let square = x;
    for (let e = k; e > 0; e >>= 1) {
      tick();
      if (e & 1) out = multiply(field.f, out, square);
      if (e > 1) square = multiply(field.f, square, square);
    }
    return out;
  };
  const go = (e: Json): FieldElement | undefined => {
    const r = rationalOf(e);
    if (r !== undefined) return constant(r);
    const radical = radicalOf(e);
    if (radical !== undefined) {
      const L = field.f.length - 1;
      return pow(field.generator, (radical.power * L) / radical.index);
    }
    const h = head(e);
    const ops = args(e);
    if (h === POLYNOMIAL_ROOT) return field.generator;
    if (h === "Add" || h === "Subtract") {
      const xs = ops.map(go);
      if (xs.some((x) => x === undefined)) return undefined;
      return xs.reduce((s, x, i) => {
        const t =
          h === "Subtract" && i > 0
            ? element(
                x!.num.map((c) => -c),
                x!.den,
              )
            : x!;
        return element(
          s!.num.map((c, k) => c * t.den + t.num[k]! * s!.den),
          s!.den * t.den,
        );
      });
    }
    if (h === "Negate") {
      const x = go(ops[0]);
      return (
        x &&
        element(
          x.num.map((c) => -c),
          x.den,
        )
      );
    }
    if (h === "Multiply") {
      const xs = ops.map(go);
      if (xs.some((x) => x === undefined)) return undefined;
      return xs.reduce((p, x) => multiply(field.f, p!, x!), one);
    }
    if (h === "Divide") {
      const [x, d] = [go(ops[0]), rationalOf(ops[1])];
      return x && d && d.num !== 0n
        ? element(
            x.num.map((c) => c * d.den),
            x.den * d.num,
          )
        : undefined;
    }
    if (h === "Power" || h === "Square") {
      const k = h === "Square" ? 2 : Number(rationalOf(ops[1])!.num);
      const x = go(ops[0]);
      return x && pow(x, k);
    }
    return undefined;
  };
  return go(j);
}

// --- what the heads answer ------------------------------------------------------------------

const polynomialIn = (coefficients: readonly bigint[], x: Json): Json => [
  "Add",
  ...coefficients.flatMap((c, i) =>
    c === 0n ? [] : [i === 0 ? numberJson(c) : ["Multiply", numberJson(c), i === 1 ? x : ["Power", x, i]]],
  ),
];

/** `x`'s minimal polynomial over ℚ, primitive, positive leading coefficient, constant first. */
const minimalOf = ({ field, x }: Read): bigint[] => minimalPolynomial(field.f, x);

/**
 * The field ℚ(a) of the argument a read: the monic polynomial of y = lead·a (a's minimal
 * polynomial scaled), and whether that is the whole field it was read in. a may generate a proper
 * subfield of it (θ² for θ = ∜2).
 */
interface Subfield {
  readonly f: Poly;
  readonly lead: bigint;
  readonly whole: boolean;
}

function subfieldOf(r: Read): Subfield {
  const m = minimalOf(r);
  const d = degree(m);
  const lead = m[d]!;
  return {
    f: m.map((c, i) => (i === d ? 1n : c * lead ** BigInt(d - 1 - i))),
    lead,
    whole: d === r.field.f.length - 1,
  };
}

/**
 * O_K's basis as Wolfram writes it: lower triangular on the powers of g, where the order's
 * coordinates are on those of θ' = v·g; the i-th is led by gⁱ/dᵢ, each lower coefficient in
 * [0, 1/dₖ) by the k-th.
 */
function triangular(o: Order, v: bigint): bigint[][] {
  const n = o.rows.length;
  // On g's powers coordinate i scales by vⁱ; the Hermite form on reversed columns is lower
  // triangular, each row reduced by the rows of lower degree.
  const scaled = o.rows.map((r) => r.map((c, i) => c * v ** BigInt(i)));
  return hermite(
    scaled.map((r) => r.toReversed()),
    n,
  )
    .map((r) => r.toReversed())
    .toReversed();
}

/**
 * A ℤ-basis of the ring of integers of ℚ(a), as expressions on the powers of the generator read:
 * triangular on those when a generates the field it was read in, and on a's own powers when it
 * generates a proper subfield. `undefined` when the ring of integers can't be computed.
 */
function integralBasis(r: Read, sub: Subfield, tick: Tick): Json[] | undefined {
  const { field } = r;
  if (sub.f.length === 2) return [1];
  const o = maximalOrder(sub.f, tick);
  if (o === undefined) return undefined;
  if (sub.whole) {
    const v = field.generator.den / field.generator.num[1]!;
    return triangular(o, v).map((row) => expressionOnPowers(field, element(row, o.den)));
  }
  // Σ cᵢ·aⁱ in the field read, a's powers by multiplication.
  const powers: FieldElement[] = [element([1n, ...Array.from({ length: field.f.length - 2 }, () => 0n)])];
  for (let i = 1; i < sub.f.length - 1; i++) powers.push(multiply(field.f, powers[i - 1]!, r.x));
  const common = powers.reduce((l, p) => (l * p.den) / gcd(l, p.den), 1n);
  return triangular(o, sub.lead).map((row) => {
    const num = powers[0]!.num.map((_, k) =>
      row.reduce((s, c, i) => s + c * powers[i]!.num[k]! * (common / powers[i]!.den), 0n),
    );
    return expressionOnPowers(field, element(num, common * o.den));
  });
}

/** Σ (cᵢ/den)·gⁱ for coordinates already on g's powers. */
function expressionOnPowers(field: GeneratedField, x: FieldElement): Json {
  const terms = x.num.flatMap((c, i): Json[] => {
    if (c === 0n) return [];
    const r = rational(c, x.den);
    const q = rationalJson(r);
    return [i === 0 ? q : r.num === 1n && r.den === 1n ? field.power(i) : ["Multiply", q, field.power(i)]];
  });
  return terms.length === 0 ? 0 : terms.length === 1 ? terms[0] : ["Add", ...terms];
}

/** Box an answer. */
const boxed = (ce: ComputeEngine, j: Json): Expression => ce.box(j as never);

/**
 * A declined call: the head over its evaluated operands (numerically under `N`), not `undefined`,
 * so what the caller gets back is the call as the operands left it.
 */
const decline = (ce: ComputeEngine, name: string, ops: readonly Expression[], numericApproximation = false) =>
  ce.function(
    name,
    ops.map((op) => op.evaluate({ numericApproximation })),
  );

/** The operands a head reads as written: its arguments are held, so `N` doesn't turn them into floats. */
const held = (count: number) => () => Array.from({ length: count }, () => ({ kind: "held" }));

interface Options {
  readonly engine: ComputeEngine;
  readonly numericApproximation?: boolean;
  readonly precision?: number;
}

/** An evaluate handler for a head of one number: `answer` gets it read, and `undefined` declines. */
const ofNumber =
  (name: string, answer: (r: Read, tick: Tick) => Json) =>
  (ops: readonly Expression[], { engine: ce, numericApproximation }: Options) => {
    const tick = deadlineTick(ce);
    const r = read(ce, ops[0]!, tick);
    const result = r && answer(r, tick);
    return result === undefined ? decline(ce, name, ops, numericApproximation) : boxed(ce, result);
  };

const fractionJson = (num: bigint, den: bigint): Json => rationalJson(rational(num, den));

/** The `k`-th root of the integer polynomial `a` to `digits` digits, as a number expression. */
function numericRoot(ce: ComputeEngine, a: readonly bigint[], k: number, digits: number): Expression | undefined {
  const z = orderedRoots(a)?.[k - 1];
  const refined = z && refineRoot(a, z, digits);
  if (refined === undefined) return undefined;
  const re = { num: refined.re };
  return z!.im === 0 ? boxed(ce, re) : boxed(ce, ["Complex", re, { num: refined.im }]);
}

export const algebraicNumbersLibrary: LibraryRecord = {
  PolynomialRoot: {
    description:
      "The k-th root of the polynomial p in the variable x (bound, as in Wolfram's Root[Function[x, p], k]): real roots first in increasing order, then complex roots by increasing real part and then imaginary part (Wolfram's Root).",
    signature: "(any, any, integer) -> number",
    operands: () => [{ kind: "held" }, { kind: "clause" }, { kind: "value" }],
    evaluate: (ops: readonly Expression[], { engine: ce, numericApproximation, precision }: Options) => {
      const cs = coefficientsOf(ce, ops[0]!.json, ops[1]!.json);
      const kj = rationalOf(ops[2]!.evaluate().json);
      const d = (cs?.length ?? 1) - 1;
      if (cs === undefined || kj === undefined || kj.den !== 1n || kj.num < 1n || kj.num > BigInt(d)) {
        return decline(ce, "PolynomialRoot", ops, numericApproximation);
      }
      const k = Number(kj.num);
      // Degree 1 and 2 are rationals and radicals; past them the root is its own name, and a number under N.
      if (d === 1) {
        const root = boxed(ce, fractionJson(-cs[0]!.num * cs[1]!.den, cs[0]!.den * cs[1]!.num));
        return numericApproximation ? root.N() : root;
      }
      if (d === 2) {
        // ax² + bx + c: (−b ∓ √(b² − 4ac)) / 2a, the smaller real root (or lower imaginary part) first.
        const [c, b, a] = cs.map(rationalJson);
        const disc = ["Subtract", ["Power", b, 2], ["Multiply", 4, a, c]];
        const aPositive = cs[2]!.num > 0n;
        const sign = (k === 1) === aPositive ? -1 : 1;
        const root = boxed(ce, [
          "Divide",
          ["Add", ["Negate", b], ["Multiply", sign, ["Sqrt", disc]]],
          ["Multiply", 2, a],
        ]).evaluate();
        return numericApproximation ? root.N() : root;
      }
      if (numericApproximation) {
        const atom = rootAtom(ce, ops[0]!.json, ops[1]!.json, k);
        const digits = Math.max(precision ?? (typeof ce.precision === "number" ? ce.precision : 15), 15);
        const n = atom && numericRoot(ce, atom.polynomial, k, digits);
        if (n !== undefined) return n;
      }
      return decline(ce, "PolynomialRoot", ops, numericApproximation);
    },
  },

  MinimalPolynomial: {
    description:
      "The minimal polynomial of the algebraic number a in x: primitive over ℤ, positive leading coefficient.",
    signature: "(number, any) -> expression",
    operands: held(2),
    evaluate: (ops: readonly Expression[], { engine: ce, numericApproximation }: Options) => {
      const r = read(ce, ops[0]!, deadlineTick(ce));
      return r
        ? boxed(ce, polynomialIn(minimalOf(r), ops[1]!.json))
        : decline(ce, "MinimalPolynomial", ops, numericApproximation);
    },
  },

  AlgebraicIntegerQ: {
    description: "Whether a is an algebraic integer: a root of a monic polynomial over ℤ.",
    signature: "(number) -> boolean",
    operands: held(1),
    evaluate: ofNumber("AlgebraicIntegerQ", (r) => (isIntegral(r.field.f, r.x) ? "True" : "False")),
  },

  AlgebraicNumberNorm: {
    description:
      "The norm of a over ℚ in the field ℚ(a): (−1)ᵈ times its minimal polynomial's constant term over its leading one.",
    signature: "(number) -> number",
    operands: held(1),
    evaluate: ofNumber("AlgebraicNumberNorm", (r) => {
      const m = minimalOf(r);
      const d = degree(m);
      return fractionJson(d % 2 === 0 ? m[0]! : -m[0]!, m[d]!);
    }),
  },

  AlgebraicNumberTrace: {
    description:
      "The trace of a over ℚ in the field ℚ(a): minus its minimal polynomial's second coefficient over its leading one.",
    signature: "(number) -> number",
    operands: held(1),
    evaluate: ofNumber("AlgebraicNumberTrace", (r) => {
      const m = minimalOf(r);
      const d = degree(m);
      return fractionJson(-m[d - 1]!, m[d]!);
    }),
  },

  NumberFieldDiscriminant: {
    description: "The discriminant of the field ℚ(a): of its ring of integers.",
    signature: "(number) -> integer",
    operands: held(1),
    evaluate: ofNumber("NumberFieldDiscriminant", (r, tick) => {
      const sub = subfieldOf(r);
      if (sub.f.length === 2) return 1;
      const o = maximalOrder(sub.f, tick);
      return o && numberJson(orderDiscriminant(o));
    }),
  },

  NumberFieldIntegralBasis: {
    description:
      "A ℤ-basis of the ring of integers of ℚ(a), written on the powers of the generator read (the radical or root a is written in), as Wolfram writes it.",
    signature: "(number) -> list",
    operands: held(1),
    evaluate: ofNumber("NumberFieldIntegralBasis", (r, tick) => {
      const basis = integralBasis(r, subfieldOf(r), tick);
      return basis && ["List", ...basis];
    }),
  },

  NumberFieldSignature: {
    description: "The signature (r₁, r₂) of ℚ(a): its real embeddings and its pairs of complex ones.",
    signature: "(number) -> list<integer>",
    operands: held(1),
    evaluate: ofNumber("NumberFieldSignature", (r) => {
      const { f } = subfieldOf(r);
      const n = f.length - 1;
      const r1 = n === 1 ? 1 : realRootCount(f);
      return ["List", r1, (n - r1) / 2];
    }),
  },
};

/**
 * `x` and `generator` read in the field `generator` generates, for the heads built on these
 * (an element and a ring's generator); `undefined` unless x lies in ℚ(generator).
 */
export function readAlgebraic(
  ce: ComputeEngine,
  generator: Expression,
  x: Expression = generator,
): { field: GeneratedField; generator: FieldElement; x: FieldElement } | undefined {
  const tick = deadlineTick(ce);
  const [ge, xe] = [generator.evaluate(), x.evaluate()];
  const [g, j] = [normalize(ge.json), normalize(xe.json)];
  const atoms: Atom[] = [];
  if (!atomsOf(g, ce, atoms) || !atomsOf(j, ce, atoms)) return undefined;
  const field = fieldOf(atoms);
  if (field === undefined) return undefined;
  const [y, z] = [elementOf(g, field, tick), elementOf(j, field, tick)];
  if (y === undefined || z === undefined) return undefined;
  if (!agreesWith(ge, field, y) || !agreesWith(xe, field, z)) return undefined;
  // The generator must generate the whole field, x's atoms included.
  if (degree(minimalPolynomial(field.f, y)) !== field.f.length - 1) return undefined;
  return { field, generator: y, x: z };
}
