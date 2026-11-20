// A head compute-engine ships keeps its signature on the declared engine, or the change is
// deliberate: a replaced signature drops compute-engine's overloads and generics (a `Map`
// lambda's parameter stops being typed from its collection; interpreted calls get several
// times slower). Either the native signature is kept whole as one overload, or the head is
// listed here with why, and its widening still takes every call the native one takes.

import { ComputeEngine } from "@cortex-js/compute-engine";
import { expect, test } from "vite-plus/test";
import { bindings, fullEngine } from "../src/engine.ts";

const ARGUMENTS = "an extra optional argument, as Wolfram's head takes";
const DOMAIN = "a wider operand domain (any number, a carrier or a complex value) than the native integer or real";
const COLLECTIONS = "Wolfram's wider collection and result shapes";

/** Heads whose declared signature replaces compute-engine's, and why. */
const DELIBERATE: Readonly<Record<string, string>> = Object.fromEntries([
  ...[
    "BellNumber",
    "BernoulliB",
    "Beta",
    "BetaRegularized",
    "Erf",
    "ErfInv",
    "Gamma",
    "GammaRegularized",
    "PolyGamma",
    "PolyLog",
    "DigitCount",
    "DigitSum",
    "IntegerDigits",
    "IntegerString",
    "FromDigits",
    "Mod",
    "RationalReconstruction",
    "MultiplicativeOrder",
    "NextPrime",
    "CDF",
    "PDF",
    "Covariance",
    "UniformDistribution",
    "Floor",
    "Ceil",
    "Round",
    "Clamp",
    "Chop",
  ].map((head) => [head, ARGUMENTS]),
  ...[
    "CatalanNumber",
    "Factorial2",
    "Subfactorial",
    "Multinomial",
    "ModularInverse",
    "PowerMod",
    "PowerModList",
    "DivisorSigma",
    "Divisors",
    "FactorInteger",
    "IsComposite",
    "IsPrime",
    "IsSquareFree",
    "MoebiusMu",
    "PrimeNu",
    "PrimeOmega",
    "Numerator",
    "Denominator",
    "ExtendedGCD",
    "Conjugate",
    "Rationalize",
    "Dot",
    "MatrixPower",
    "Sign",
    "Tanh",
    "Min",
    "Max",
  ].map((head) => [head, DOMAIN]),
  ...[
    "First",
    "Last",
    "Flatten",
    "Partition",
    "Ordering",
    "Histogram",
    "Unique",
    "Position",
    "Mean",
    "Median",
    "Union",
    "Random",
  ].map((head) => [head, COLLECTIONS]),
]);

interface Parameter {
  readonly type: unknown;
}
interface Shape {
  readonly kind?: string;
  readonly args?: Parameter[];
  readonly optArgs?: Parameter[];
  readonly variadicArg?: Parameter;
  readonly variadicMin?: number;
  readonly typeParams?: unknown[];
}

const bare = new ComputeEngine();
const full = fullEngine();
const signatureOf = (ce: ComputeEngine, head: string): string | undefined =>
  (ce.lookupDefinition(head) as { operator?: { signature?: unknown } } | undefined)?.operator?.signature?.toString();

/** The members of a signature written as an intersection, split at the top level. */
function members(signature: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < signature.length; i++) {
    const c = signature[i];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === "&" && depth === 0) {
      out.push(signature.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(signature.slice(start).trim());
  return out;
}

const names = (): string[] => [...bindings(bare)].filter((n) => /^[A-Z]/.test(n)).toSorted();
const changed = names().filter((n) => {
  const native = signatureOf(bare, n);
  return native !== undefined && native !== signatureOf(full, n);
});

/** Strip one pair of parentheses around an intersection member. */
const unwrap = (member: string): string =>
  member.startsWith("(") && member.endsWith(")") && members(member.slice(1, -1)).length === 1
    ? member.slice(1, -1)
    : member;

/** Whether every overload of the native signature is still an overload of the declared one. */
const keepsNative = (native: string, declared: string): boolean => {
  const kept = new Set(members(declared).map(unwrap));
  return members(native).every((member) => kept.has(unwrap(member)));
};

/** A declared signature takes every call arity the native one takes, each operand in a type the native one takes.
 *  A native signature of several overloads is not compared overload by overload. */
function acceptsNative(native: string, declared: string): boolean {
  // Several overloads, or a zero-argument random form that is an overload of its own.
  if (members(native).length > 1 || native.includes(") random")) return true;
  const overloads = members(declared).map(unwrap);
  return overloads.some((overload) => acceptsShape(native, overload));
}

function acceptsShape(native: string, declared: string): boolean {
  const n = bare.type(native as never).type as Shape;
  const d = full.type(declared as never).type as Shape;
  if (n.kind !== "signature" || d.kind !== "signature") return false;
  const fixed = (s: Shape): Parameter[] => [...(s.args ?? []), ...(s.optArgs ?? [])];
  const declaredAt = (i: number): Parameter | undefined => fixed(d)[i] ?? d.variadicArg;
  if ((d.args?.length ?? 0) > (n.args?.length ?? 0)) return false;
  if (n.variadicArg !== undefined && d.variadicArg === undefined) return false;
  const count = fixed(n).length + (n.variadicArg === undefined ? 0 : 1);
  if (d.variadicArg === undefined && fixed(d).length < fixed(n).length) return false;
  for (let i = 0; i < count; i++) {
    const own = fixed(n)[i] ?? n.variadicArg!;
    const wider = declaredAt(i);
    if (wider === undefined) return false;
    if (n.typeParams?.length) continue;
    if (!bare.type(own.type as never).matches(full.type(wider.type as never))) return false;
  }
  return true;
}

test("a head with a native signature keeps it, or is a deliberate widening that takes every native call", () => {
  const replaced = changed.filter((n) => !keepsNative(signatureOf(bare, n)!, signatureOf(full, n)!));
  expect(
    replaced.filter((n) => DELIBERATE[n] === undefined),
    "replaces the native signature and is not listed as deliberate",
  ).toEqual([]);
  expect(
    replaced.filter((n) => !acceptsNative(signatureOf(bare, n)!, signatureOf(full, n)!)),
    "a widening that no longer takes a call the native signature takes",
  ).toEqual([]);
});

test("the deliberate list names only heads that still replace the native signature", () => {
  const replaced = new Set(changed.filter((n) => !keepsNative(signatureOf(bare, n)!, signatureOf(full, n)!)));
  expect(Object.keys(DELIBERATE).filter((n) => !replaced.has(n))).toEqual([]);
});
