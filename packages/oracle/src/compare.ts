// Deciding whether an external system agrees with us.
//
// Values arrive as strings from four systems with four print conventions, so comparison is
// deliberately forgiving about spelling and strict about value. A numeric answer matches
// within a relative tolerance; anything else has to match after normalising whitespace,
// brackets and the several ways these systems spell a list.

import type { MathJSON } from "./emit.ts";
import { agreementBound } from "./bound.ts";
import { mappingFor } from "./mappings.ts";
import { compareTrees, type Leaf, type Tree } from "./structural.ts";
import type { System } from "./systems.ts";

/** A number if the text denotes one — including Python complex and Wolfram real syntax, and
 * an exact rational as SymPy and Lean (`p/q`) or Julia (`p//q`) print it. */
export function asNumber(text: string): number | undefined {
  const ratio = /^\s*([-+]?\d+)\s*\/\/?\s*(\d+)\s*$/.exec(text);
  if (ratio !== null && Number(ratio[2]) !== 0) return Number(ratio[1]) / Number(ratio[2]);
  const cleaned = text
    .trim()
    .replace(/\*\^/g, "e")
    .replace(/`+[0-9.]*/g, "");
  if (!/^[-+]?[0-9.]+([eE][-+]?\d+)?$/.test(cleaned)) return undefined;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : undefined;
}

/** A real decimal as `mantissa × 10^exponent`, exactly, in any of the systems' spellings. */
function decimal(text: string): { readonly m: bigint; readonly e: number } | undefined {
  const match = /^([-+]?)(\d*)(?:\.(\d*))?(?:[eE]([-+]?\d+)|\*\^([-+]?\d+))?$/.exec(
    text.trim().replace(/`+[0-9.]*/g, ""),
  );
  if (match === null || (match[2] === "" && (match[3] ?? "") === "")) return undefined;
  const frac = match[3] ?? "";
  return { m: BigInt(`${match[1]}${match[2] || "0"}${frac}`), e: Number(match[4] ?? match[5] ?? 0) - frac.length };
}

/** Relative agreement of two decimals in exact arithmetic, or `undefined` if either isn't one. */
function decimalsAgree(a: string, b: string, tolerance: number): boolean | undefined {
  const x = decimal(a);
  const y = decimal(b);
  if (x === undefined || y === undefined) return undefined;
  const e = Math.min(x.e, y.e);
  const xm = x.m * 10n ** BigInt(x.e - e);
  const ym = y.m * 10n ** BigInt(y.e - e);
  const abs = (n: bigint): bigint => (n < 0n ? -n : n);
  const scale = abs(xm) > abs(ym) ? abs(xm) : abs(ym);
  const digits = Math.max(0, Math.round(-Math.log10(tolerance)));
  return abs(xm - ym) * 10n ** BigInt(digits) <= scale;
}

/** Strip the differences that are only notation: brackets, spaces, trailing zeros. */
export const normalise = (text: string): string =>
  text
    .trim()
    .replace(/\s+/g, "")
    .replace(/[{[]/g, "[")
    .replace(/[}\]]/g, "]")
    .replace(/\.0+\b/g, "")
    .toLowerCase();

export type Verdict = "agree" | "disagree" | "inconclusive";

/** Compare an oracle's printed value against ours. */
export function compare(ours: string, theirs: string, tolerance = 1e-9): Verdict {
  // Wolfram's Indeterminate is its own "can't decide" signal -- inconclusive against most
  // answers, same as None/Null/$Failed below, EXCEPT when ours is itself NaN or Indeterminate
  // (both emit as the literal `Indeterminate` for wolfram, see emit.ts's CONSTANTS): then the
  // two sides are making the identical claim, and that's agreement, not a shrug.
  // A Python-family NaN is the same claim as ours being NaN or Indeterminate.
  if (/^nan$/i.test(theirs.trim()) && /^(nan|indeterminate)$/i.test(ours.trim())) return "agree";
  if (/^indeterminate$/i.test(theirs.trim())) {
    return /^indeterminate$/i.test(ours.trim()) ? "agree" : "inconclusive";
  }
  if (theirs === "" || /^(none|null|\$failed)$/i.test(theirs.trim())) {
    return "inconclusive";
  }
  const [a, b] = [asNumber(ours), asNumber(theirs)];
  if (a !== undefined && b !== undefined) {
    return Math.abs(a - b) <= agreementBound(tolerance, Math.abs(a), Math.abs(b)) ? "agree" : "disagree";
  }
  // Past the double range (Gamma(200.5)) both still read as decimals: compare their digits.
  const exact = decimalsAgree(ours, theirs, tolerance);
  if (exact !== undefined) return exact ? "agree" : "disagree";
  // A symbolic answer from SymPy or Sage against our numeric one proves nothing either way.
  if ((a === undefined) !== (b === undefined)) return "inconclusive";
  return normalise(ours) === normalise(theirs) ? "agree" : "disagree";
}

/** A whole number or ratio of them written in MathJSON, as a reduced `[numerator, denominator]`. */
function exactRational(expr: MathJSON): readonly [bigint, bigint] | undefined {
  const whole = (node: MathJSON): bigint | undefined => {
    if (typeof node === "number") return Number.isSafeInteger(node) ? BigInt(node) : undefined;
    const text = (node as { num?: unknown }).num;
    return typeof text === "string" && /^-?\d+$/.test(text) ? BigInt(text) : undefined;
  };
  const integer = whole(expr);
  if (integer !== undefined) return [integer, 1n];
  if (!Array.isArray(expr) || expr[0] !== "Rational" || expr.length !== 3) return undefined;
  const [p, q] = [whole(expr[1] as MathJSON), whole(expr[2] as MathJSON)];
  return p === undefined || q === undefined || q === 0n ? undefined : reduced(p, q);
}

function reduced(p: bigint, q: bigint): readonly [bigint, bigint] {
  let [a, b] = [p < 0n ? -p : p, q < 0n ? -q : q];
  while (b !== 0n) [a, b] = [b, a % b];
  const sign = q < 0n ? -1n : 1n;
  return [(sign * p) / a, (sign * q) / a];
}

/** The elements of a printed `[a, b, [c, d]]`, split at its top level. */
function listElements(text: string): string[] | undefined {
  if (!text.startsWith("[") || !text.endsWith("]")) return undefined;
  const inner = text.slice(1, -1);
  if (inner.trim() === "") return [];
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (c === "[") depth++;
    else if (c === "]") depth--;
    else if (c === "," && depth === 0) {
      parts.push(inner.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(inner.slice(start).trim());
  return parts;
}

/**
 * A machine-precision system's answer (the Rust lane: statrs and the std floats are doubles, `num`
 * is exact): exact where both sides are an integer or a ratio, and otherwise equal to a relative
 * `tolerance` alone — `compare`'s absolute floor of 1 would let a tiny answer agree with any other.
 * `value` reads one of ours as a double. `undefined` when the two cannot be read this way, which
 * leaves the verdict to `compare`.
 */
export function compareMachine(
  expected: MathJSON,
  theirs: string,
  tolerance: number,
  value: (expr: MathJSON) => number | undefined,
): Verdict | undefined {
  const text = theirs.trim();
  if (Array.isArray(expected) && (expected[0] === "List" || expected[0] === "Tuple")) {
    const parts = listElements(text);
    if (parts === undefined || parts.length !== expected.length - 1) return undefined;
    const verdicts = parts.map((part, i) => compareMachine(expected[i + 1] as MathJSON, part, tolerance, value));
    // One definite disagreement settles the list, whatever else in it can't be read.
    if (verdicts.includes("disagree")) return "disagree";
    return verdicts.every((verdict) => verdict === "agree") ? "agree" : undefined;
  }
  const ours = exactRational(expected);
  const ratio = /^(-?\d+)(?:\/(\d+))?$/.exec(text);
  if (ratio !== null && /^0+$/.test(ratio[2] ?? "1")) return undefined;
  if (ours !== undefined && ratio !== null) {
    const them = reduced(BigInt(ratio[1] as string), BigInt(ratio[2] ?? "1"));
    return ours[0] === them[0] && ours[1] === them[1] ? "agree" : "disagree";
  }
  const a = ours === undefined ? value(expected) : Number(ours[0]) / Number(ours[1]);
  const b = ratio !== null ? Number(ratio[1]) / Number(ratio[2] ?? 1) : asNumber(text);
  if (a === undefined || b === undefined || !Number.isFinite(a) || !Number.isFinite(b)) return undefined;
  return a === b || Math.abs(a - b) <= tolerance * Math.max(Math.abs(a), Math.abs(b)) ? "agree" : "disagree";
}

/** A Python literal — nested lists/tuples of numbers, booleans and strings — parsed into a `Tree`
 * (structural.ts), or `undefined` if `text` isn't one. Tuples and lists both become plain
 * arrays: Sage's `[(2, 2), (3, 1)]` (a list of tuples, from `list(factor(n))`) lines up
 * element-wise against our `[["Tuple",2,2],["Tuple",3,1]]` once both are just arrays. */
export function parsePython(text: string): Tree | undefined {
  const s = text.trim();
  let i = 0;
  const FAIL = Symbol("fail");
  const skipSpace = (): void => {
    while (i < s.length && /\s/.test(s[i] as string)) i++;
  };
  const parseValue = (): Tree | typeof FAIL => {
    skipSpace();
    // A Python complex, `(1.5+2j)` or `2j`, as the {re, im} leaf ours reduces to.
    const complex =
      /^\(\s*([-+]?[\d.]+(?:e[-+]?\d+)?)\s*([-+])\s*([\d.]+(?:e[-+]?\d+)?)j\s*\)|^([-+]?[\d.]+(?:e[-+]?\d+)?)j/i.exec(
        s.slice(i),
      );
    if (complex !== null) {
      i += complex[0].length;
      if (complex[4] !== undefined) return { re: 0, im: Number(complex[4]) };
      const im = Number(complex[3]) * (complex[2] === "-" ? -1 : 1);
      return { re: Number(complex[1]), im };
    }
    const open = s[i];
    if (open === "[" || open === "(") {
      const close = open === "[" ? "]" : ")";
      i++;
      const items: Tree[] = [];
      skipSpace();
      if (s[i] === close) {
        i++;
        return items;
      }
      for (;;) {
        const item = parseValue();
        if (item === FAIL) return FAIL;
        items.push(item);
        skipSpace();
        if (s[i] === ",") {
          i++;
          skipSpace();
          if (s[i] === close) {
            i++;
            break;
          }
          continue;
        }
        if (s[i] === close) {
          i++;
          break;
        }
        return FAIL;
      }
      return items;
    }
    // A string, as MathJSON writes one: its text in single quotes.
    const quoted = /^(?:'([^'\\]*)'|"([^"\\]*)")/.exec(s.slice(i));
    if (quoted !== null) {
      i += quoted[0].length;
      return `'${quoted[1] ?? quoted[2]}'`;
    }
    // The non-finite values by the names the printers and `reduce` use.
    const named = /^(?:PositiveInfinity|NegativeInfinity|ComplexInfinity|NaN)\b/.exec(s.slice(i));
    if (named !== null) {
      i += named[0].length;
      return named[0];
    }
    if (s.startsWith("True", i)) {
      i += 4;
      return true;
    }
    if (s.startsWith("False", i)) {
      i += 5;
      return false;
    }
    // An exact rational as SymPy/Sage print it inside a structure, `1/2` or `-5/3` (no
    // spaces around the slash — this is Python division syntax, not our Rational).
    const rational = /^([-+]?\d+)\/(\d+)(?![\d.eE])/.exec(s.slice(i));
    if (rational !== null && Number(rational[2]) !== 0) {
      i += rational[0].length;
      return Number(rational[1]) / Number(rational[2]);
    }
    const match = /^[-+]?\d+(\.\d+)?([eE][-+]?\d+)?/.exec(s.slice(i));
    if (match !== null) {
      i += match[0].length;
      return Number(match[0]);
    }
    return FAIL;
  };
  const result = parseValue();
  skipSpace();
  return result === FAIL || i !== s.length ? undefined : (result as Tree);
}

/**
 * A p-adic number as Sage prints it, `2^2 + O(2^3)` or `1 + O(3)`, as `AdicNumeral(p, residue, precision)`:
 * the integer the stored terms sum to, taken modulo `p^precision`, and the precision `n` of the
 * `O(p^n)` that ends the print (`O(p)` is `n = 1`). Two numbers agree when prime, residue and precision do.
 * `undefined` for text that is not such a sum.
 */
export function parsePadic(text: string): Tree | undefined {
  const parts = text.trim().split(/\s*\+\s*/);
  const tail = /^O\((\d+)(?:\^(\d+))?\)$/.exec(parts.pop() ?? "");
  if (tail === null) return undefined;
  const p = BigInt(tail[1] as string);
  const precision = BigInt(tail[2] ?? 1);
  if (p < 2n || precision > 10_000n) return undefined;
  const modulus = p ** precision;
  let sum = 0n;
  for (const term of parts) {
    // `c*p^k`, `p^k`, `p` or a bare `c`: the coefficient times the power of p.
    const m = /^(?:(\d+)\*)?(?:(\d+)(?:\^(\d+))?)$/.exec(term);
    if (m === null) return undefined;
    const withCoefficient = m[1] !== undefined;
    const coefficient = withCoefficient ? BigInt(m[1] as string) : undefined;
    const base = BigInt(m[2] as string);
    if (coefficient === undefined && m[3] === undefined) {
      sum += base;
    } else if (base === p) {
      sum += (coefficient ?? 1n) * p ** BigInt(m[3] ?? 1);
    } else {
      return undefined;
    }
  }
  const residue = ((sum % modulus) + modulus) % modulus;
  const [pn, rn, nn] = [Number(p), Number(residue), Number(precision)];
  return [pn, rn, nn].every(Number.isSafeInteger) ? ["AdicNumeral", pn, rn, nn] : undefined;
}

/**
 * A number printed as a Python expression (`1/2*I*sqrt(3) + 1/2`) as a real or a complex: literals, `I`,
 * `pi`, `e`, `sqrt`, `exp`, `log`, and `+ - * / ^`. `undefined` for anything else (a free symbol, a call).
 */
export function numericExpression(text: string): Leaf | undefined {
  type C = readonly [number, number];
  const s = text.replace(/\*\*/g, "^").replace(/\s+/g, "");
  let i = 0;
  const fail = Symbol("fail");
  const mul = ([a, b]: C, [c, d]: C): C => [a * c - b * d, a * d + b * c];
  const div = ([a, b]: C, [c, d]: C): C => {
    const n = c * c + d * d;
    return [(a * c + b * d) / n, (b * c - a * d) / n];
  };
  const exp = ([a, b]: C): C => [Math.exp(a) * Math.cos(b), Math.exp(a) * Math.sin(b)];
  const log = ([a, b]: C): C => [Math.log(Math.hypot(a, b)), Math.atan2(b, a)];
  const power = (x: C, y: C): C => {
    if (x[0] === 0 && x[1] === 0) return [0, 0];
    if (y[1] !== 0 || !Number.isInteger(y[0]) || Math.abs(y[0]) > 64) return exp(mul(y, log(x)));
    const whole = Array.from({ length: Math.abs(y[0]) }).reduce<C>((acc) => mul(acc, x), [1, 0]);
    return y[0] >= 0 ? whole : div([1, 0], whole);
  };
  const sum = (): C | typeof fail => {
    let acc = product();
    while (acc !== fail && (s[i] === "+" || s[i] === "-")) {
      const sign = s[i++] === "-" ? -1 : 1;
      const next = product();
      if (next === fail) return fail;
      acc = [acc[0] + sign * next[0], acc[1] + sign * next[1]];
    }
    return acc;
  };
  const product = (): C | typeof fail => {
    let acc = unary();
    while (acc !== fail && (s[i] === "*" || s[i] === "/")) {
      const times = s[i++] === "*";
      const next = unary();
      if (next === fail) return fail;
      acc = times ? mul(acc, next) : div(acc, next);
    }
    return acc;
  };
  const unary = (): C | typeof fail => {
    if (s[i] === "-" || s[i] === "+") {
      const sign = s[i++] === "-" ? -1 : 1;
      const value = unary();
      return value === fail ? fail : [sign * value[0], sign * value[1]];
    }
    const base = atom();
    if (base === fail || s[i] !== "^") return base;
    i++;
    const exponent = unary();
    return exponent === fail ? fail : power(base, exponent);
  };
  const atom = (): C | typeof fail => {
    if (s[i] === "(") {
      i++;
      const inner = sum();
      if (inner === fail || s[i++] !== ")") return fail;
      return inner;
    }
    const number = /^(\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/.exec(s.slice(i));
    if (number !== null) {
      i += number[0].length;
      return [Number(number[0]), 0];
    }
    const name = /^[A-Za-z_]\w*/.exec(s.slice(i));
    if (name === null) return fail;
    i += name[0].length;
    if (name[0] === "I") return [0, 1];
    if (name[0] === "pi") return [Math.PI, 0];
    if (name[0] === "e") return [Math.E, 0];
    if (s[i] !== "(") return fail;
    i++;
    const argument = sum();
    if (argument === fail || s[i++] !== ")") return fail;
    if (name[0] === "sqrt") return power(argument, [0.5, 0]);
    if (name[0] === "exp") return exp(argument);
    if (name[0] === "log") return log(argument);
    return fail;
  };
  const value = sum();
  if (value === fail || i !== s.length || !value.every(Number.isFinite)) return undefined;
  return value[1] === 0 ? value[0] : { re: value[0], im: value[1] };
}

/** The top-level, comma-separated arguments of a printed call's `(...)`. */
function callArguments(inside: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < inside.length; i++) {
    const c = inside[i];
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (c === "," && depth === 0) {
      out.push(inside.slice(start, i));
      start = i + 1;
    }
  }
  out.push(inside.slice(start));
  return out;
}

/**
 * Ours, a call held over numeric operands (`PolyLog(3, 1/2 + (sqrt 3)/2 i)`), against the same call held
 * by the Python-family system and printed in its own spelling of the argument (`polylog(3, 1/2*I*sqrt(3) +
 * 1/2)`). The system's name for the head is the one our mapping for `system` calls (a plain
 * `name($1, …)` template); the operands compare as numbers. `"agree"` when every operand does and
 * `undefined` for anything not read this way, so a disagreement is never decided here.
 * `evaluate` reads one of our operands as a number.
 */
export function compareHeldCall(
  system: System,
  expected: MathJSON,
  theirs: string,
  evaluate: (expr: MathJSON) => Leaf,
  tolerance = 1e-9,
): Verdict | undefined {
  if (!Array.isArray(expected) || typeof expected[0] !== "string" || expected.length < 2) return undefined;
  const call = /^([A-Za-z_]\w*)\((.*)\)$/s.exec(theirs.trim());
  if (call === null) return undefined;
  const operands = expected.slice(1) as MathJSON[];
  const template = mappingFor(expected[0], operands.length, [], system)?.emit[system];
  const placeholders = operands.map((_, k) => `$${k + 1}`).join(", ");
  if (template !== `${call[1]}(${placeholders})`) return undefined;
  const given = callArguments(call[2] as string);
  if (given.length !== operands.length) return undefined;
  for (const [k, operand] of operands.entries()) {
    const mine = evaluate(operand);
    const theirsLeaf = numericExpression(given[k] as string);
    if (typeof mine === "string" || typeof mine === "boolean" || theirsLeaf === undefined) return undefined;
    if (compareTrees(mine, theirsLeaf, tolerance) !== "agree") return undefined;
  }
  return "agree";
}

/** `compare`, but for a Python-family system's answer against our reduced tree, when a
 * shape difference (a tuple where we have a list) is the only thing text comparison would
 * catch as a false disagreement. `undefined` when `theirs` doesn't parse as a literal. */
export function comparePythonStructured(ours: Tree, theirs: string, tolerance = 1e-9): Verdict | undefined {
  const theirsTree = parsePython(theirs) ?? parsePadic(theirs);
  return theirsTree === undefined ? undefined : compareTrees(ours, theirsTree, tolerance);
}

/** A diagram's blocks, `["List", ["List", 1, 2], …]`, as `{{-2,-1},{1,2}}`: each block
 * ascending, blocks in order — the form the Sage helpers print. */
function blocksLabel(label: MathJSON): string | undefined {
  if (!Array.isArray(label) || label[0] !== "List") return undefined;
  const blocks: number[][] = [];
  for (const block of label.slice(1) as MathJSON[]) {
    if (!Array.isArray(block) || block[0] !== "List") return undefined;
    const points = block.slice(1) as MathJSON[];
    if (!points.every((p): p is number => typeof p === "number")) return undefined;
    blocks.push([...points].toSorted((a, b) => a - b));
  }
  blocks.sort((a, b) => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i]! - b[i]!;
    return a.length - b.length;
  });
  return `{${blocks.map((b) => `{${b.join(",")}}`).join(",")}}`;
}

/** A basis label as MathJSON writes it: `'3'`, the evaluated `'"s0"'`, `["String", "s0"]`,
 * or a diagram's list of blocks. */
function basisLabel(label: MathJSON): string | undefined {
  if (Array.isArray(label)) {
    if (label[0] === "String" && typeof label[1] === "string") return label[1] as string;
    return blocksLabel(label);
  }
  if (typeof label !== "string" || !/^'.*'$/s.test(label)) return undefined;
  const inner = label.slice(1, -1);
  return /^".*"$/s.test(inner) ? (JSON.parse(inner) as string) : inner;
}

/** A symbolic scalar factor — `delta`, `["Power", "delta", 2]` — as [symbol, exponent]. */
function symbolPower(e: MathJSON): [string, number] | undefined {
  if (typeof e === "string" && !/^'.*'$/s.test(e)) return [e, 1];
  if (Array.isArray(e) && e[0] === "Power" && typeof e[1] === "string" && typeof e[2] === "number") return [e[1], e[2]];
  return undefined;
}

/** `*delta^2` for a coefficient's symbolic part, empty when it has none. */
function monomialOf(powers: readonly [string, number][]): string {
  const by = new Map<string, number>();
  for (const [symbol, n] of powers) by.set(symbol, (by.get(symbol) ?? 0) + n);
  return [...by]
    .filter(([, n]) => n !== 0)
    .toSorted(([a], [b]) => a.localeCompare(b))
    .map(([symbol, n]) => `*${symbol}^${n}`)
    .join("");
}

/**
 * An algebra element as `Head(label)*symbol^k → coefficient`, from sums, scalar multiples
 * (numbers, and symbols like the loop parameter `delta`) and negations of one-argument
 * basis calls (`["GroupBasis", "'1'"]`, a `Diagram`). `undefined` for anything else — a
 * basis element times a basis element, say.
 */
export function linearCombination(expr: MathJSON): Map<string, number> | undefined {
  const out = new Map<string, number>();
  const add = (e: MathJSON, factor: number, monomial: readonly [string, number][]): boolean => {
    if (!Array.isArray(e) || typeof e[0] !== "string") return false;
    const [head, ...ops] = e as readonly MathJSON[];
    if (head === "Add") return ops.every((op) => add(op, factor, monomial));
    if (head === "Negate" && ops.length === 1) return add(ops[0] as MathJSON, -factor, monomial);
    if (head === "Multiply") {
      const scalars = ops.filter((op): op is number => typeof op === "number");
      const powers = ops.map(symbolPower).filter((p) => p !== undefined);
      const rest = ops.filter((op) => typeof op !== "number" && symbolPower(op) === undefined);
      if (rest.length !== 1) return false;
      const product = scalars.reduce((a, b) => a * b, factor);
      return add(rest[0] as MathJSON, product, [...monomial, ...powers]);
    }
    const label = ops.length === 1 ? basisLabel(ops[0] as MathJSON) : undefined;
    if (label === undefined) return false;
    const key = `${head as string}(${label})${monomialOf(monomial)}`;
    out.set(key, (out.get(key) ?? 0) + factor);
    return true;
  };
  if (!add(expr, 1, [])) return undefined;
  for (const [key, c] of out) if (c === 0) out.delete(key);
  return out;
}

/** Ours against an answer printed as `combination:{"GroupBasis(1)": 2, …}`: equal as maps,
 * whatever order either side wrote its terms in. */
export function compareCombination(ours: MathJSON, theirs: string): Verdict {
  const mine = linearCombination(ours);
  if (mine === undefined) return "inconclusive";
  const parsed = JSON.parse(theirs.slice("combination:".length)) as Record<string, number>;
  const keys = new Set([...mine.keys(), ...Object.keys(parsed)]);
  for (const key of keys) if ((mine.get(key) ?? 0) !== (parsed[key] ?? 0)) return "disagree";
  return "agree";
}

/** Ours, a `List` of elements, against `combinations:[{…}, …]` — compared as a set of
 * elements, since a basis's order is a convention of each system. */
export function compareCombinations(ours: MathJSON, theirs: string): Verdict {
  if (!Array.isArray(ours) || ours[0] !== "List") return "inconclusive";
  const mine = (ours.slice(1) as MathJSON[]).map(linearCombination);
  if (mine.some((m) => m === undefined)) return "inconclusive";
  const canon = (m: Record<string, number>): string =>
    JSON.stringify(
      Object.entries(m)
        .filter(([, c]) => c !== 0)
        .toSorted(([x], [y]) => x.localeCompare(y)),
    );
  const parsed = JSON.parse(theirs.slice("combinations:".length)) as Record<string, number>[];
  const byText = (x: string, y: string): number => x.localeCompare(y);
  const a = mine.map((m) => canon(Object.fromEntries(m!))).toSorted(byText);
  const b = parsed.map(canon).toSorted(byText);
  return JSON.stringify(a) === JSON.stringify(b) ? "agree" : "disagree";
}
