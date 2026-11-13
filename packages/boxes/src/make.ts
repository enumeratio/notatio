// MakeBoxes -- an expression's traditional notation, as boxes. A pure function of the
// MathJSON tree (no engine, no canonicalization), so the same tree always gives the
// same boxes. Every notational decision is made here and nowhere else: which glyph,
// what goes above what, and where the parentheses go.
//
// Parenthesization is precedence-driven: every node reports how tightly it binds, and
// a parent fences a child only when the child binds looser than the slot it goes into.

import type { MathJsonExpression } from "@cortex-js/compute-engine/epsil";
import {
  type Box,
  error,
  fraction,
  grid,
  overscript,
  radical,
  row,
  sqrt,
  subscript,
  subsuperscript,
  superscript,
  tag,
  text,
  underoverscript,
  underscript,
} from "./box.ts";
import { fromMathJson } from "./json.ts";
import { ENGINE_NOTATION } from "./notation-engine.ts";
import { CONTROL_NOTATION } from "./notation-control.ts";
import { LAYOUT_NOTATION } from "./notation-layout.ts";
import { PROSE_NOTATION } from "./notation-prose.ts";
import type { Notation, Writer } from "./notation.ts";

// Binding strength, loosest to tightest. A node binding at `ATOM` never needs parens.
const OR = 1;
const AND = 2;
const NOT = 3;
const RELATION = 4;
const ADD = 5;
const MULTIPLY = 6;
const ATOM = 7;

interface Made {
  box: Box;
  prec: number;
  /** Prints with a leading minus sign (a `Negate`, or a negative literal). */
  negative?: boolean;
  /** Prints as a bare number, which decides the multiplication sign. */
  numeric?: boolean;
}

export const INVISIBLE_TIMES = "\u2062";
export const APPLY_FUNCTION = "\u2061";
const MINUS = "−";

const atom = (box: Box, extra: Partial<Made> = {}): Made => ({ box, prec: ATOM, ...extra });
const fenced = (open: string, body: readonly Box[], close: string): Box =>
  row([...(open ? [open] : []), ...body, ...(close ? [close] : [])]);
const paren = (m: Made, min: number): Box => (m.prec < min ? fenced("(", [m.box], ")") : m.box);
/** Like `paren`, but a leading minus also gets fenced: `a − (−b)`, not `a − −b`. */
const operand = (m: Made, min: number): Box => (m.negative ? fenced("(", [m.box], ")") : paren(m, min));
const list = (items: readonly Made[], sep = ","): Box[] => items.flatMap((m, i) => (i === 0 ? [m.box] : [sep, m.box]));

export const SYMBOLS: Record<string, string> = {
  Pi: "π",
  ExponentialE: "e",
  ImaginaryUnit: "i",
  EulerGamma: "γ",
  GoldenRatio: "φ",
  CatalanConstant: "G",
  Infinity: "∞",
  PositiveInfinity: "∞",
  ComplexInfinity: "∞̃",
  Degrees: "°",
  True: "⊤",
  False: "⊥",
  Nothing: "",
  EmptySet: "∅",
  RealNumbers: "ℝ",
  Integers: "ℤ",
  RationalNumbers: "ℚ",
  ComplexNumbers: "ℂ",
  NonNegativeIntegers: "ℕ",
  Booleans: "𝔹",
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ϵ",
  varepsilon: "ε",
  zeta: "ζ",
  eta: "η",
  theta: "θ",
  vartheta: "ϑ",
  iota: "ι",
  kappa: "κ",
  lambda: "λ",
  mu: "μ",
  nu: "ν",
  xi: "ξ",
  omicron: "ο",
  pi: "π",
  varpi: "ϖ",
  rho: "ρ",
  varrho: "ϱ",
  sigma: "σ",
  varsigma: "ς",
  tau: "τ",
  upsilon: "υ",
  phi: "ϕ",
  varphi: "φ",
  chi: "χ",
  psi: "ψ",
  omega: "ω",
  Alpha: "Α",
  Beta: "Β",
  Gamma: "Γ",
  Delta: "Δ",
  Epsilon: "Ε",
  Zeta: "Ζ",
  Eta: "Η",
  Theta: "Θ",
  Iota: "Ι",
  Kappa: "Κ",
  Lambda: "Λ",
  Mu: "Μ",
  Nu: "Ν",
  Xi: "Ξ",
  Omicron: "Ο",
  Rho: "Ρ",
  Sigma: "Σ",
  Tau: "Τ",
  Upsilon: "Υ",
  Phi: "Φ",
  Chi: "Χ",
  Psi: "Ψ",
  Omega: "Ω",
};

/** Heads that print as a named function with an upright name (`sin x`, `ln x`). */
export const FUNCTIONS: Record<string, string> = {
  Sin: "sin",
  Cos: "cos",
  Tan: "tan",
  Cot: "cot",
  Sec: "sec",
  Csc: "csc",
  Arcsin: "arcsin",
  Arccos: "arccos",
  Arctan: "arctan",
  Arccot: "arccot",
  Arcsec: "arcsec",
  Arccsc: "arccsc",
  Sinh: "sinh",
  Cosh: "cosh",
  Tanh: "tanh",
  Coth: "coth",
  Sech: "sech",
  Csch: "csch",
  Arsinh: "arsinh",
  Arcosh: "arcosh",
  Artanh: "artanh",
  Ln: "ln",
  Log: "log",
  Lb: "lb",
  Lg: "lg",
  Gamma: "Γ",
  Max: "max",
  Min: "min",
  GCD: "gcd",
  LCM: "lcm",
  Sign: "sgn",
  Re: "Re",
  Im: "Im",
  Arg: "arg",
  Mod: "mod",
};

export const RELATIONS: Record<string, string> = {
  Equal: "=",
  NotEqual: "≠",
  Less: "<",
  LessEqual: "≤",
  Greater: ">",
  GreaterEqual: "≥",
  Approx: "≈",
  Congruent: "≡",
  Element: "∈",
  NotElement: "∉",
  Subset: "⊂",
  SubsetEqual: "⊆",
  Superset: "⊃",
  SupersetEqual: "⊇",
};

/** Two-character delimiter strings (`"()"`, `"[]"`, …); `.` means no fence. */
const DELIMITERS: Record<string, [string, string]> = {
  "()": ["(", ")"],
  "[]": ["[", "]"],
  "{}": ["{", "}"],
  "||": ["|", "|"],
  "‖‖": ["‖", "‖"],
  "<>": ["⟨", "⟩"],
  "..": ["", ""],
};

const headOf = (node: unknown): string | undefined => {
  const fn = Array.isArray(node) ? node : (node as { fn?: unknown[] })?.fn;
  return Array.isArray(fn) && typeof fn[0] === "string" ? fn[0] : undefined;
};

const opsOf = (node: unknown): unknown[] => {
  const fn = Array.isArray(node) ? node : (node as { fn?: unknown[] })?.fn;
  return Array.isArray(fn) ? fn.slice(1) : [];
};

/** A string literal's text: `"'abc'"`, `{str: "abc"}`; a bare symbol is not one. */
const stringOf = (node: unknown): string | undefined => {
  if (typeof node === "string") return /^'.*'$/s.test(node) ? node.slice(1, -1) : undefined;
  const s = (node as { str?: unknown })?.str;
  return typeof s === "string" ? s : undefined;
};

const symbolOf = (node: unknown): string | undefined => {
  if (typeof node === "string") return stringOf(node) === undefined ? node : undefined;
  const s = (node as { sym?: unknown })?.sym;
  return typeof s === "string" ? s : undefined;
};

const numberOf = (node: unknown): string | undefined => {
  if (typeof node === "number") return String(node);
  const n = (node as { num?: unknown })?.num;
  return typeof n === "number" ? String(n) : typeof n === "string" ? n : undefined;
};

/** `-2` as `2`; anything not a negative literal is undefined. */
const negatedLiteral = (node: unknown): string | undefined => {
  const n = numberOf(node);
  return n !== undefined && n.startsWith("-") && n !== "-Infinity" ? n.slice(1) : undefined;
};

/** The term an `Add` operand subtracts (`-2`, `Negate(x)`, `-3 x`), or undefined. */
function subtracted(node: unknown): unknown {
  const literal = negatedLiteral(node);
  if (literal !== undefined) return { num: literal };
  if (headOf(node) === "Negate") return opsOf(node)[0];
  if (headOf(node) === "Multiply") {
    const [first, ...rest] = opsOf(node);
    const literal = negatedLiteral(first);
    if (literal === undefined || rest.length === 0) return undefined;
    if (literal === "1") return rest.length === 1 ? rest[0] : ["Multiply", ...rest];
    return ["Multiply", { num: literal }, ...rest];
  }
  return undefined;
}

/** What a factor `base^-n` (a negative integer power) divides by -- `base`, or `base^n` --
 *  else undefined. */
function denominatorOf(node: unknown): unknown {
  if (headOf(node) !== "Power") return undefined;
  const [base, exponent] = opsOf(node);
  const n = Number(numberOf(exponent));
  if (!Number.isInteger(n) || n >= 0) return undefined;
  return n === -1 ? base : ["Power", base, -n];
}

function makeNumber(digits: string): Made {
  if (digits === "NaN") return atom("NaN");
  if (digits === "Infinity" || digits === "+Infinity") return atom("∞");
  if (digits === "-Infinity") return makeSymbol("NegativeInfinity");
  const negative = negatedLiteral({ num: digits });
  if (negative !== undefined) {
    return { box: row([MINUS, makeNumber(negative).box]), prec: MULTIPLY, negative: true, numeric: true };
  }
  const sci = /^([^eE]+)[eE]([+-]?\d+)$/.exec(digits);
  if (sci) {
    const mantissa = makeNumber(sci[1]);
    const exponent = makeNumber(sci[2].replace(/^\+/, ""));
    return { box: row([mantissa.box, "×", superscript("10", exponent.box)]), prec: MULTIPLY, numeric: true };
  }
  // `1.(3)` -- the parenthesised digits repeat; typeset with an overline.
  const repeating = /^(.*)\((\d+)\)$/.exec(digits);
  if (repeating) return atom(row([repeating[1], overscript(repeating[2], "‾")]), { numeric: true });
  return atom(digits, { numeric: true });
}

function makeSymbol(name: string): Made {
  if (name === "NegativeInfinity") return { box: row([MINUS, "∞"]), prec: MULTIPLY, negative: true };
  if (name === "Half") return { box: fraction("1", "2"), prec: MULTIPLY };
  const mapped = SYMBOLS[name];
  if (mapped !== undefined) return atom(mapped);
  // `x_1` -- an underscore in a symbol name is a subscript.
  const sub = /^([^_]+)_(.+)$/.exec(name);
  if (sub) {
    const script = /^\d+$/.test(sub[2]) ? sub[2] : makeSymbol(sub[2]).box;
    return atom(subscript(makeSymbol(sub[1]).box, script));
  }
  return atom(name);
}

function makeCall(name: string, ops: unknown[]): Made {
  return atom(row([name, APPLY_FUNCTION, fenced("(", list(ops.map(make)), ")")]));
}

/** `Sum`/`Product`/`Integrate` bounds: `Limits(n, 1, 10)`, `Tuple(n, 1, 10)`, or bare `n`. */
function bounds(node: unknown): { variable?: Made; lower?: Made; upper?: Made; next?: Made } {
  const head = headOf(node);
  if (head === "Limits" || head === "Tuple" || head === "Triple" || head === "Pair") {
    const [variable, lower, upper, step] = opsOf(node);
    return {
      variable: variable === undefined ? undefined : make(variable),
      lower: lower === undefined ? undefined : make(lower),
      upper: upper === undefined ? undefined : make(upper),
      // A stepped range is written by its first two terms: `i = 1, 3, …`.
      next: step === undefined || lower === undefined ? undefined : make(sumOf(lower, step)),
    };
  }
  return node === undefined ? {} : { variable: make(node) };
}

/** Canonical trees wrap a summand or integrand in `Function(Block(body), x)`; unwrap it. */
function body(node: unknown): unknown {
  if (headOf(node) !== "Function") return node;
  const inner = opsOf(node)[0];
  return headOf(inner) === "Block" && opsOf(inner).length === 1 ? opsOf(inner)[0] : inner;
}

/** `a + b`, folded when both are literals. */
function sumOf(a: unknown, b: unknown): unknown {
  const [x, y] = [numberOf(a), numberOf(b)];
  return x !== undefined && y !== undefined && Number.isFinite(Number(x) + Number(y))
    ? Number(x) + Number(y)
    : ["Add", a, b];
}

function bigOperator(symbol: string, over: unknown): Box {
  const { variable, lower, upper, next } = bounds(over);
  const range = (v: Made, l: Made) => (next ? [v.box, "=", l.box, ",", next.box, ",", "…"] : [v.box, "=", l.box]);
  const under = variable && lower ? row(range(variable, lower)) : (variable ?? lower)?.box;
  if (under !== undefined && upper) return underoverscript(symbol, under, upper.box);
  if (under !== undefined) return underscript(symbol, under);
  return symbol;
}

/** The notation `makeBoxes` is writing with: compute-engine's heads, then the caller's. */
let notation: Notation = ENGINE_NOTATION;
/** The caller's own notation: it decides which heads keep their name in a `TagBox`. */
const NO_NOTATION: Notation = {};
let extraNotation = NO_NOTATION;
/** Whether notation boxes carry their head (off while the reader learns what they look like). */
let tagging = true;

/** The heads (`Head/arity`) whose notation another head shares, or that any expression of the same
 *  structure writes alike: their boxes keep the head in a `TagBox`. The reader learns it. */
let ambiguous: (extra: Notation) => ReadonlySet<string> = () => new Set();
export function setAmbiguousNotation(decide: typeof ambiguous): void {
  ambiguous = decide;
}

const WRITER: Writer = {
  box: (json) => make(json).box,
  tight: (json) => operand(make(json), ATOM),
  call: (name, args) => row([name, APPLY_FUNCTION, fenced("(", list(args.map(make)), ")")]),
};

function makeFunction(head: string, ops: unknown[]): Made {
  const rule = Object.hasOwn(notation, head) ? notation[head] : undefined;
  const written = rule?.(ops as MathJsonExpression[], WRITER);
  if (written !== undefined) {
    const keeps = tagging && ambiguous(extraNotation).has(`${head}/${ops.length}`);
    return atom(keeps ? tag(written, head) : written);
  }
  switch (head) {
    case "Add": {
      const items: Box[] = [paren(make(ops[0]), ADD)]; // left-associative: no parens on a leading sum
      for (const op of ops.slice(1)) {
        const term = subtracted(op);
        items.push(term === undefined ? "+" : MINUS, operand(make(term === undefined ? op : term), ADD + 1));
      }
      return { box: row(items), prec: ADD };
    }

    case "Subtract": {
      const [a, b] = ops.map(make);
      return { box: row([paren(a, ADD), MINUS, operand(b, ADD + 1)]), prec: ADD };
    }

    case "Negate":
      return { box: row([MINUS, operand(make(ops[0]), MULTIPLY)]), prec: MULTIPLY, negative: true };

    case "InvisibleOperator":
    case "Multiply": {
      // `-1 * x` is how a canonical tree spells a negation.
      if (ops.length > 1 && negatedLiteral(ops[0]) === "1") {
        return makeFunction("Negate", [ops.length === 2 ? ops[1] : ["Multiply", ...ops.slice(1)]]);
      }
      // A factor with a negative integer power goes under the line: `3 (x+1)^-1` is `3/(x+1)`.
      const under = ops.map(denominatorOf);
      if (under.some((d) => d !== undefined)) {
        const above = ops.filter((_, i) => under[i] === undefined);
        const below = under.filter((d) => d !== undefined);
        const fold = (parts: unknown[]) => (parts.length === 1 ? parts[0] : ["Multiply", ...parts]);
        return makeFunction("Divide", [above.length === 0 ? 1 : fold(above), fold(below)]);
      }
      const factors = ops.map(make);
      const items: Box[] = [];
      let previous: Made | undefined;
      for (const f of factors) {
        // A number after a number (or a fraction) needs a visible dot; `2x` does not.
        if (previous) items.push(previous.numeric && f.numeric ? "⋅" : INVISIBLE_TIMES);
        items.push(previous ? operand(f, MULTIPLY) : paren(f, MULTIPLY));
        previous = f;
      }
      return { box: row(items), prec: MULTIPLY, negative: factors[0]?.negative };
    }

    case "Divide":
    case "Rational": {
      const [n, d] = ops.map(make);
      if (d === undefined) return n;
      return { box: fraction(n.box, d.box), prec: MULTIPLY, numeric: n.numeric && d.numeric };
    }

    case "Power": {
      const [base, exponent] = ops.map(make);
      // A power as the base is fenced: `(a^b)^c`, which unfenced reads as a tower.
      const nested = headOf(ops[0]) === "Power" || headOf(ops[0]) === "Square";
      return atom(superscript(nested ? fenced("(", [base.box], ")") : paren(base, ATOM), exponent.box));
    }
    case "Square":
      return makeFunction("Power", [ops[0], 2]);
    case "Exp":
      return makeFunction("Power", ["ExponentialE", ops[0]]);

    case "Sqrt":
      return atom(sqrt(make(ops[0]).box));
    case "Root": {
      const [radicand, index] = ops.map(make);
      return atom(radical(radicand.box, index.box));
    }

    case "Subscript": {
      const [base, sub] = ops.map(make);
      return atom(subscript(paren(base, ATOM), sub.box));
    }
    case "Superscript": {
      const [base, sup] = ops.map(make);
      return atom(superscript(paren(base, ATOM), sup.box));
    }

    case "Abs":
      return atom(fenced("|", [make(ops[0]).box], "|"));
    case "Norm":
      return atom(fenced("‖", [make(ops[0]).box], "‖"));
    // With a step (`Floor(226, 10)`) the brackets would drop it, so it stays a call.
    case "Floor":
      return ops.length === 1 ? atom(fenced("⌊", [make(ops[0]).box], "⌋")) : makeCall(head, ops);
    case "Ceil":
      return ops.length === 1 ? atom(fenced("⌈", [make(ops[0]).box], "⌉")) : makeCall(head, ops);
    case "Factorial":
      return atom(row([paren(make(ops[0]), ATOM), "!"]));
    case "Factorial2":
      return atom(row([paren(make(ops[0]), ATOM), "!!"]));

    // `Log(x, b)` -- the base goes in a subscript, `log_b x`.
    case "Log": {
      if (ops.length < 2) return makeCall("log", ops);
      const [x, base] = ops.map(make);
      return atom(row([subscript("log", base.box), APPLY_FUNCTION, fenced("(", [x.box], ")")]));
    }

    case "Binomial": {
      // Threaded over a list it stays a call, as a head with a notation does (`scalars`).
      if (ops.some((op) => headOf(op) === "List")) return makeCall(head, ops);
      const [n, k] = ops.map(make);
      return atom(fenced("(", [fraction(n.box, k.box, { FractionLine: false })], ")"));
    }

    case "Complex": {
      const [re, im] = ops;
      const zero = (v: unknown) => numberOf(v) === "0";
      const one = (v: unknown) => numberOf(v) === "1";
      if (zero(re) && one(im)) return makeSymbol("ImaginaryUnit");
      if (zero(re)) return makeFunction("Multiply", [im, "ImaginaryUnit"]);
      return makeFunction("Add", [re, one(im) ? "ImaginaryUnit" : ["Multiply", im, "ImaginaryUnit"]]);
    }

    case "List":
      return atom(fenced("[", list(ops.map(make)), "]"));
    case "Set":
      return atom(fenced("{", list(ops.map(make)), "}"));
    case "Tuple":
    case "Pair":
    case "Triple":
      return atom(fenced("(", list(ops.map(make)), ")"));
    case "Sequence":
      return atom(row(list(ops.map(make))));

    // `Delimiter(x)` keeps the parentheses the expression was written with; a second
    // argument names the pair (`"()"`, `"[]"`, …) and a third the separator.
    case "Delimiter": {
      const [open, close] = DELIMITERS[stringOf(ops[1]) ?? "()"] ?? ["(", ")"];
      const sep = stringOf(ops[2]) ?? ",";
      const inner = headOf(ops[0]) === "Sequence" ? list(opsOf(ops[0]).map(make), sep) : [make(ops[0]).box];
      return atom(fenced(open, inner, close));
    }

    // `Interval(a, b)` -- an endpoint wrapped in `Open(x)` gets a round bracket;
    // otherwise it is closed, `[a, b]`.
    case "Interval": {
      const [lo, hi] = ops;
      const openLo = headOf(lo) === "Open";
      const openHi = headOf(hi) === "Open";
      const a = make(openLo ? opsOf(lo)[0] : lo);
      const b = make(openHi ? opsOf(hi)[0] : hi);
      return atom(fenced(openLo ? "(" : "[", [row([a.box, ",", b.box])], openHi ? ")" : "]"));
    }

    // `Which(cond1, val1, cond2, val2, …)` -- CE's spelling of a piecewise function
    // (there is no separate `Piecewise` head). A `True` condition is the "otherwise" case.
    case "Which": {
      const rows: Box[][] = [];
      for (let i = 0; i + 1 < ops.length; i += 2) {
        const condition = symbolOf(ops[i]) === "True" ? text("otherwise") : row([text("if "), make(ops[i]).box]);
        rows.push([make(ops[i + 1]).box, condition]);
      }
      return atom(row(["{", grid(rows)]));
    }

    case "Matrix": {
      const rows = opsOf(ops[0]).map((r) => opsOf(r).map((cell) => make(cell).box));
      const [open, close] = DELIMITERS[stringOf(ops[1]) ?? "()"] ?? ["(", ")"];
      return atom(fenced(open, [grid(rows)], close));
    }

    case "Sum":
    case "Product": {
      // Each further `Limits` is an inner operator, the first outermost.
      const operators = ops.slice(1).map((over) => bigOperator(head === "Sum" ? "∑" : "∏", over));
      return {
        box: row([
          ...(operators.length === 0 ? [head === "Sum" ? "∑" : "∏"] : operators),
          paren(make(body(ops[0])), ADD + 1),
        ]),
        prec: MULTIPLY,
      };
    }

    case "Integrate": {
      const integrand = make(body(ops[0]));
      // Each further `Limits` is an inner integral, the first outermost, its differential last.
      const over = ops.length > 1 ? ops.slice(1).map(bounds) : [{}];
      const operators = over.map(({ lower, upper }) =>
        lower && upper ? subsuperscript("∫", lower.box, upper.box) : lower ? subscript("∫", lower.box) : "∫",
      );
      const differentials = over.flatMap(({ variable }) => (variable ? [row(["d", variable.box])] : [])).toReversed();
      return { box: row([...operators, paren(integrand, ADD + 1), ...differentials]), prec: MULTIPLY };
    }

    case "Limit": {
      const [fn, to, direction] = ops;
      const variable = headOf(fn) === "Function" ? opsOf(fn)[1] : undefined;
      // The side a limit is taken from is a sign on the point: `x → a⁺`.
      const side = { "1": "+", "-1": "−" }[numberOf(direction) ?? ""];
      const point = side === undefined ? make(to).box : superscript(paren(make(to), ATOM), side);
      const approach = variable === undefined ? point : row([make(variable).box, "→", point]);
      return { box: row([underscript("lim", approach), paren(make(body(fn)), ADD + 1)]), prec: MULTIPLY };
    }

    case "D": {
      // `D(f, x)` -- Leibniz notation, `d/dx f`; `D(f, x, x)` is `d²/dx²` and `D(f, x, y)` is `d²/dx dy`.
      const [f, ...x] = ops;
      const order = String(x.length);
      const same = x.length > 1 && x.every((v) => JSON.stringify(v) === JSON.stringify(x[0]));
      const operator =
        x.length < 2
          ? fraction("d", row(["d", ...x.map((v) => make(v).box)]))
          : fraction(
              superscript("d", order),
              same
                ? row(["d", superscript(paren(make(x[0]), ATOM), order)])
                : row(x.map((v) => row(["d", make(v).box]))),
            );
      return { box: row([operator, paren(make(f), ADD + 1)]), prec: MULTIPLY };
    }

    // `Derivative(f, n)` -- the boxed function `f'` / `f''` / `f^(n)`, applied via
    // `Apply` below (`f'(x)` parses to `Apply(Derivative(f, 1), x)`).
    case "Derivative": {
      const [fn, ...orders] = ops;
      const f = make(fn);
      // One order is primes up to three; several (`f^(0,1)`, one per argument) or a symbolic one are parenthesized.
      const n = orders.length === 0 ? "1" : orders.length === 1 ? numberOf(orders[0]) : undefined;
      const primes = n === undefined ? undefined : { "1": "′", "2": "″", "3": "‴" }[n];
      return atom(
        primes !== undefined
          ? row([paren(f, ATOM), primes])
          : superscript(paren(f, ATOM), fenced("(", list(orders.map(make)), ")")),
      );
    }

    // `Apply(fn, x, …)` -- an already-boxed function called on its arguments.
    case "Apply": {
      const [fn, ...args] = ops;
      return atom(row([paren(make(fn), ATOM), APPLY_FUNCTION, fenced("(", list(args.map(make)), ")")]));
    }

    // `Wedge(a, b, …)` -- the outer product from `@enumeratio/geometric`; associative
    // like `Multiply`, so nesting needs no parens, but not commutative.
    case "Wedge":
      return {
        box: row(
          list(
            ops.map((op) => atom(paren(make(op), MULTIPLY))),
            "∧",
          ),
        ),
        prec: MULTIPLY,
      };
    // `Vee(a, b, algebra)` -- the regressive product; the third operand is the ambient
    // algebra, not a factor, so only the first two print.
    case "Vee": {
      const [a, b] = ops.map((op) => paren(make(op), MULTIPLY));
      return { box: row([a, "∨", b]), prec: MULTIPLY };
    }

    case "And":
    case "Or": {
      const level = head === "And" ? AND : OR;
      const parts = ops.map((op) => atom(paren(make(op), level + 1)));
      return { box: row(list(parts, head === "And" ? "∧" : "∨")), prec: level };
    }
    case "Not":
      return { box: row(["¬", paren(make(ops[0]), NOT + 1)]), prec: NOT };
    case "Implies":
    case "Equivalent": {
      const parts = ops.map((op) => atom(paren(make(op), OR + 1)));
      return { box: row(list(parts, head === "Implies" ? "⇒" : "⇔")), prec: OR };
    }

    case "Error":
      return atom(error(row(ops.map((op) => make(op).box))));

    // Boxes given as boxes are drawn as themselves; a malformed argument prints as a call.
    case "DisplayForm":
    case "RawBoxes":
      try {
        return atom(fromMathJson(ops[0] as MathJsonExpression));
      } catch {
        return makeCall(head, ops);
      }

    default: {
      const relation = RELATIONS[head];
      if (relation !== undefined) {
        const parts = ops.map((op) => atom(paren(make(op), RELATION + 1)));
        return { box: row(list(parts, relation)), prec: RELATION };
      }
      return makeCall(FUNCTIONS[head] ?? head, ops);
    }
  }
}

/** What a host draws itself: boxes for a sub-expression (a figure, a readout), or undefined to write it. */
let hostLeaf: ((json: MathJsonExpression) => Box | undefined) | undefined;

function make(node: unknown): Made {
  const drawn = hostLeaf?.(node as MathJsonExpression);
  if (drawn !== undefined) return atom(drawn);
  const head = headOf(node);
  if (head !== undefined) return makeFunction(head, opsOf(node));

  const literal = stringOf(node);
  if (literal !== undefined) return atom(text(literal, { ShowStringCharacters: true }));
  const number = numberOf(node);
  if (number !== undefined) return makeNumber(number);
  const symbol = symbolOf(node);
  if (symbol !== undefined) return makeSymbol(symbol);

  // A dictionary, or something that isn't MathJSON at all.
  return atom(error(text(JSON.stringify(node) ?? String(node))));
}

/** `json`'s traditional notation, as boxes: compute-engine's heads as this package writes them,
 *  every other head as `notation` (its packages', `notationOf(engine)`) says, or as a call. */
export function makeBoxes(json: MathJsonExpression, extra: Notation = NO_NOTATION, options: MakeOptions = {}): Box {
  return write(json, extra, options, true);
}

/** `makeBoxes` with every head written bare: what the reader learns each notation looks like from. */
export const makeBareBoxes = (json: MathJsonExpression, extra: Notation = NO_NOTATION): Box =>
  write(json, extra, {}, false);

function write(json: MathJsonExpression, extra: Notation, options: MakeOptions, tags: boolean): Box {
  const outer = [notation, hostLeaf, extraNotation, tagging] as const;
  notation = { ...ENGINE_NOTATION, ...LAYOUT_NOTATION, ...PROSE_NOTATION, ...CONTROL_NOTATION, ...extra };
  [hostLeaf, extraNotation, tagging] = [options.leaf, extra, tags];
  try {
    return make(json).box;
  } finally {
    [notation, hostLeaf, extraNotation, tagging] = outer;
  }
}

export interface MakeOptions {
  /**
   * Consulted for every sub-expression first: the boxes the host draws it as (a figure's
   * `GraphicsBox`, a hole for a control), or undefined to write it as usual. A layout's
   * entries are where it matters: the formatters write each through it.
   */
  readonly leaf?: (json: MathJsonExpression) => Box | undefined;
}
