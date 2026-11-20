// A head compute-engine ships keeps its signature on the declared engine: a widening adds an
// overload and keeps the native signature whole. A replaced signature drops compute-engine's
// overloads and generics (a `Map` lambda's parameter stops being typed from its collection,
// `First` of a `list<integer>` stops typing as an integer; interpreted calls get several times
// slower). `NOT_YET_KEPT` lists the heads not yet converted; their widening still takes every
// call the native one takes.

import { ComputeEngine } from "@cortex-js/compute-engine";
import { expect, test } from "vite-plus/test";
import { plainlyWidenedHeads } from "@notatio/engine";
import { bindings, fullEngine } from "../src/engine.ts";

const DOMAIN = "a wider operand domain (any number, a carrier or a complex value) than the native integer or real";
const COLLECTIONS = "Wolfram's wider collection and result shapes";

/** Heads whose widening still replaces the native signature, and why. Only ever shrinks. */
const NOT_YET_KEPT: Readonly<Record<string, string>> = Object.fromEntries([
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
  ].map((head) => [head, DOMAIN]),
  ...["Histogram", "Random"].map((head) => [head, COLLECTIONS]),
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
  readonly result?: unknown;
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

/** A type parameter erased to its bound (`any` when unbound): `T` in a native parameter stands for
 *  every type it can be instantiated with, so the declared parameter must take the bound itself.
 *  Comparing erased forms is sound for the question asked here, whether a native call is still
 *  accepted, and needs no unifying of `T` per call. */
function erase(type: unknown, bounds: ReadonlyMap<string, unknown>): unknown {
  if (Array.isArray(type)) return type.map((t) => erase(t, bounds));
  if (typeof type !== "object" || type === null) return type;
  const node = type as { kind?: string; name?: string };
  if (node.kind === "variable" && node.name !== undefined) return bounds.get(node.name) ?? "any";
  return Object.fromEntries(Object.entries(type).map(([key, value]) => [key, erase(value, bounds)]));
}

/** An overload's shape with its type parameters erased. */
function shapeOf(ce: ComputeEngine, overload: string): Shape {
  const shape = ce.type(overload as never).type as Shape;
  const bounds = new Map(
    ((shape.typeParams ?? []) as { name: string; bound?: string }[]).map((p) => [p.name, p.bound ?? "any"]),
  );
  return erase(shape, bounds) as Shape;
}

/** A declared signature takes every call arity the native one takes, each operand in a type the native one takes:
 *  each native overload (a zero-argument random form is an overload of its own, not compared) needs
 *  some declared overload that accepts it. */
function acceptsNative(native: string, declared: string): boolean {
  const overloads = members(declared).map((member) => shapeOf(full, unwrap(member)));
  return members(native)
    .filter((member) => !member.includes(") random"))
    .map((member) => shapeOf(bare, unwrap(member)))
    .every((own) => overloads.some((overload) => acceptsShape(own, overload)));
}

function acceptsShape(n: Shape, d: Shape): boolean {
  if (n.kind !== "signature" || d.kind !== "signature") return false;
  const fixed = (s: Shape): Parameter[] => [...(s.args ?? []), ...(s.optArgs ?? [])];
  const declaredAt = (i: number): Parameter | undefined => fixed(d)[i] ?? d.variadicArg;
  if ((d.args?.length ?? 0) > (n.args?.length ?? 0)) return false;
  if (n.variadicArg !== undefined && d.variadicArg === undefined) return false;
  // A native result the declared one doesn't cover is a call that now answers another type
  // (`Unique` of a string: native's string, ours a list).
  if (!bare.type(n.result as never).matches(full.type(d.result as never))) return false;
  const count = fixed(n).length + (n.variadicArg === undefined ? 0 : 1);
  if (d.variadicArg === undefined && fixed(d).length < fixed(n).length) return false;
  for (let i = 0; i < count; i++) {
    const own = fixed(n)[i] ?? n.variadicArg!;
    const wider = declaredAt(i);
    if (wider === undefined) return false;
    if (!bare.type(own.type as never).matches(full.type(wider.type as never))) return false;
  }
  return true;
}

test("a head with a native signature keeps it, or is a deliberate widening that takes every native call", () => {
  const replaced = changed.filter((n) => !keepsNative(signatureOf(bare, n)!, signatureOf(full, n)!));
  expect(
    replaced.filter((n) => NOT_YET_KEPT[n] === undefined),
    "replaces the native signature and is not listed as deliberate",
  ).toEqual([]);
  expect(
    replaced.filter((n) => !acceptsNative(signatureOf(bare, n)!, signatureOf(full, n)!)),
    "a widening that no longer takes a call the native signature takes",
  ).toEqual([]);
});

test("the deliberate list names only heads that still replace the native signature", () => {
  const replaced = new Set(changed.filter((n) => !keepsNative(signatureOf(bare, n)!, signatureOf(full, n)!)));
  expect(Object.keys(NOT_YET_KEPT).filter((n) => !replaced.has(n))).toEqual([]);
});

/** Heads widened with plain `widenSignature` that write native's signature into the request. */
const SPELLS_NATIVE = new Set(["Map", "Fold", "Filter", "Join"]);

test("a plain widening of a head with a native signature is a listed NOT_YET_KEPT head", () => {
  // Widen with `widenSignatureKeepingNative` unless a native-typed call must mean something else.
  const native = new Set(names().filter((n) => signatureOf(bare, n) !== undefined));
  expect(
    [...plainlyWidenedHeads()]
      .filter((n) => native.has(n) && NOT_YET_KEPT[n] === undefined && !SPELLS_NATIVE.has(n))
      .toSorted(),
  ).toEqual([]);
});
