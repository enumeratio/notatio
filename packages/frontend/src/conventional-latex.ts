// Conventional LaTeX for native compute-engine heads that write or read it differently:
// `Erf` and `Erfc` are written `\operatorname{erf}`, `Arccot` as `arccot`, and `\mathrm{arcsec}`
// reads as the arcsecond. A fraction's sign goes in front of it, and every logarithm but
// the natural one names its base.
// (`Rank` is array depth, not matrix rank, so it keeps its default `\mathrm{Rank}`.)
// A head whose sign would lose an argument or a grouping on the way back (`Union` of three, a
// `Derivative` with its orders or none, `PolyLog` with a third argument, a second integral limit) writes
// what reads back exactly: the editor shows this LaTeX and reads it again.
// GCD, LCM, MatrixRank, Zeta, Determinant, Trace, Sign, Arg, Mod, Max, Min and Sinc were probed and are fine.
// The shared engine carries these via its configureLatex list (engine.ts); engines built
// elsewhere pass `conventionalLatexDictionary()`.

import { LATEX_DICTIONARY, LatexSyntax, type MathJsonExpression } from "@cortex-js/compute-engine";
import type { LatexDictionaryEntry, Parser, Serializer } from "@cortex-js/compute-engine/latex-syntax";
import { commandTeX, escapeTeXText, markLanded, UNICODE_TEX, unicodeTeX } from "@enumeratio/boxes/render";

type Entry = Partial<LatexDictionaryEntry>;

const operands = (expr: MathJsonExpression | null): MathJsonExpression[] =>
  Array.isArray(expr) ? (expr.slice(1) as MathJsonExpression[]) : [];

/** `\operatorname{word}(args...)` — matches under `\operatorname`, `\mathrm`,
 *  `\mathbin`, … (a `symbolTrigger`, not a literal token match) and parses/
 *  serializes it as a call to `name`. */
const operatorname = (name: string, word: string): Entry => ({
  kind: "function",
  name,
  symbolTrigger: word,
  serialize: (serializer, expr) =>
    `\\operatorname{${word}}(${operands(expr)
      .map((e) => serializer.serialize(e))
      .join(", ")})`,
  parse: (parser) => [name, ...(parser.parseArguments() ?? [])],
});

/** The Euler beta, `\mathrm{B}(a, b)` -- a roman capital beta; `\Beta` is not a LaTeX
 *  command. `\Beta` still parses, and so does `\mathrm{B}` applied to arguments. */
const beta: Entry = {
  kind: "function",
  name: "Beta",
  latexTrigger: "\\Beta",
  serialize: (serializer, expr) =>
    `\\mathrm{B}(${operands(expr)
      .map((e) => serializer.serialize(e))
      .join(", ")})`,
  parse: (parser) => {
    const args = parser.parseArguments();
    return args === null ? "Beta" : ["Beta", ...args];
  },
};
const betaRoman: Entry = {
  kind: "function",
  // The literal tokens, not a `symbolTrigger`: that would claim a plain `B(2, 3)` too.
  latexTrigger: ["\\mathrm", "<{>", "B", "<}>"],
  parse: (parser) => {
    const args = parser.parseArguments();
    return args === null ? null : ["Beta", ...args];
  },
};

type Serialize = (serializer: Serializer, expr: MathJsonExpression) => string;
const native = (name: string): Entry & { serialize: Serialize } =>
  LATEX_DICTIONARY.find((e) => (e as { name?: string }).name === name) as Entry & {
    serialize: Serialize;
  };

/** `\log_{b}(x)` for a logarithm whose base the head implies. `\log` alone reads as the
 *  natural log to most people (and to Wolfram); compute-engine's `Log(x)` is base 10. */
const logBase = (name: string, base: number): Entry => ({
  ...native(name),
  name,
  serialize: (serializer, expr) => {
    const [x, b] = operands(expr);
    if (x === undefined) return "\\log";
    return `\\log_{${b === undefined ? base : serializer.serialize(b)}}${serializer.wrapArguments(["Log", x ?? null])}`;
  },
});

/** A leading minus sign: a negative number, a negation, a product led by one. */
const isNegative = (x: MathJsonExpression | undefined): boolean =>
  (typeof x === "number" && x < 0) ||
  (typeof x === "object" && x !== null && "num" in x && String(x.num).startsWith("-")) ||
  (Array.isArray(x) && (x[0] === "Negate" || (x[0] === "Multiply" && isNegative(x[1]))));

/** `x` without its leading minus sign (`isNegative(x)` holds). */
const negated = (x: MathJsonExpression): MathJsonExpression => {
  if (typeof x === "number") return -x;
  if (!Array.isArray(x)) return { num: String((x as { num: string }).num).slice(1) };
  if (x[0] === "Negate") return x[1] as MathJsonExpression;
  const [first, ...rest] = x.slice(1) as MathJsonExpression[];
  const factors = first === -1 ? rest : [negated(first as MathJsonExpression), ...rest];
  return factors.length === 1 ? (factors[0] as MathJsonExpression) : ["Multiply", ...factors];
};

/** `-\frac{1}{2}`, not `\frac{-1}{2}`: the sign of a fraction goes in front of it. */
const signOut = (name: string): Entry => {
  const entry = native(name);
  return {
    ...entry,
    serialize: (serializer, expr) => {
      const [a, b, ...rest] = operands(expr);
      if (a === undefined || b === undefined || rest.length > 0) {
        return entry.serialize(serializer, expr);
      }
      const [na, nb] = [isNegative(a), isNegative(b)];
      if (!na && !nb) return entry.serialize(serializer, expr);
      const positive = [name, na ? negated(a) : a, nb ? negated(b) : b] as MathJsonExpression;
      const written = entry.serialize(serializer, positive);
      return na === nb ? written : `-${written}`;
    },
  };
};

/** `Square(x)` is written as the power it is, so it brackets its base the same way. */
const square: Entry = {
  ...native("Square"),
  name: "Square",
  serialize: (serializer, expr) => serializer.serialize(["Power", operands(expr)[0] ?? null, 2]),
};

/** A pure-imaginary `Complex(0, b)` factor of a product as `b` times the unit, which native
 *  `Multiply` writes bare (`\imaginaryI\pi`, `-\imaginaryI x`) and native `Add` reads the
 *  sign of (`a-\imaginaryI b`), instead of the bracketed `(-\imaginaryI)x`. */
const unitFactors = (expr: MathJsonExpression): MathJsonExpression => {
  if (!Array.isArray(expr) || expr[0] !== "Multiply") return expr;
  const imaginary = (x: MathJsonExpression): x is ["Complex", 0, number] =>
    Array.isArray(x) && x[0] === "Complex" && x[1] === 0 && typeof x[2] === "number";
  const factors = operands(expr);
  if (!factors.some(imaginary)) return expr;
  return [
    "Multiply",
    ...factors.flatMap((x): MathJsonExpression[] =>
      !imaginary(x) ? [x] : x[2] === 1 ? ["ImaginaryUnit"] : [x[2], "ImaginaryUnit"],
    ),
  ];
};

const multiply: Entry = {
  ...native("Multiply"),
  name: "Multiply",
  serialize: (serializer, expr) => native("Multiply").serialize(serializer, unitFactors(expr)),
};

const add: Entry = {
  ...native("Add"),
  name: "Add",
  serialize: (serializer, expr) => native("Add").serialize(serializer, ["Add", ...operands(expr).map(unitFactors)]),
};

/** A string atom as one escaped `\\text{…}`. compute-engine writes a bare string atom unescaped
 *  and without consulting the dictionary (`\\text{#}` is a TeX error), and hands `String`'s
 *  operands over unquoted, like symbols. So a writer that needs portable TeX wraps each string
 *  atom in this private head first (`withStringsWrapped`), which only this entry writes. */
const TEXT_HEAD = "EscapedText";
const escapedText: Entry = {
  kind: "function",
  name: TEXT_HEAD,
  serialize: (_serializer, expr) => `\\text{${escapeTeXText(operands(expr).map(String).join(""))}}`,
};

const isStringAtom = (x: MathJsonExpression): boolean =>
  typeof x === "string" && x.length >= 2 && x.startsWith("'") && x.endsWith("'");

/** `expr` with every string atom wrapped for `escapedText` above. */
export const withStringsWrapped = (expr: MathJsonExpression): MathJsonExpression =>
  isStringAtom(expr)
    ? [TEXT_HEAD, expr]
    : Array.isArray(expr)
      ? (expr.map((x, i) =>
          i === 0 ? x : withStringsWrapped(x as MathJsonExpression),
        ) as unknown as MathJsonExpression)
      : expr;

/** `e^{2x}` for every argument, as Wolfram's TeXForm writes it; native `Exp` writes `e^x` for a
 *  symbol but `\\exp(2x)` for a compound argument. */
const exp: Entry = {
  ...native("Exp"),
  name: "Exp",
  serialize: (serializer, expr) => serializer.serialize(["Power", "ExponentialE", operands(expr)[0] ?? null]),
};

/** Euler's constant as `\\gamma`, which it already parses from, not `\\operatorname{EulerGamma}`. */
const eulerGamma: Entry = {
  ...native("EulerGamma"),
  name: "EulerGamma",
  serialize: () => "\\gamma",
};

/** `\lfloor x\rfloor` for one operand; with a step (`Floor(226, 10)`) the brackets would
 *  drop it, so it is written as the call. */
const bracketed = (name: "Floor" | "Ceil", open: string, close: string): Entry => ({
  ...native(name),
  name,
  serialize: (serializer, expr) => {
    const args = operands(expr);
    const inner = (x: MathJsonExpression) => serializer.serialize(x);
    return args.length === 1
      ? `${open}${/^[A-Za-z]/.test(inner(args[0]!)) ? " " : ""}${inner(args[0]!)}${close}`
      : `\\mathrm{${name}}${serializer.wrapArguments(expr as MathJsonExpression)}`;
  },
});

/** Precedence of `=` in compute-engine's dictionary. */
const EQUAL_PRECEDENCE = 245;

/** `5! = 5`: native `Equal` writes `5!=5`, which reads back as `5 != 5`, a different relation. */
const equal: Entry = {
  ...native("Equal"),
  name: "Equal",
  serialize: (serializer, expr) =>
    operands(expr)
      .map((x) => serializer.wrap(x, EQUAL_PRECEDENCE))
      .reduce((written, next) => (written.endsWith("!") ? `${written} = ${next}` : `${written}=${next}`)),
};

/** `(a \setminus b) \setminus c` for three or more sets: the sign reads `a \setminus b \setminus c` as
 *  `a \setminus (b \setminus c)`, but `SetMinus(a, b, c)` removes `b` and then `c` from `a`. */
const setMinus: Entry = {
  ...native("SetMinus"),
  name: "SetMinus",
  serialize: (serializer, expr) => {
    const [first, second, ...rest] = operands(expr);
    if (first === undefined || second === undefined || rest.length === 0) {
      return native("SetMinus").serialize(serializer, expr);
    }
    const left = rest.reduce<MathJsonExpression>(
      (acc, next) => ["SetMinus", ["Delimiter", acc], next],
      ["SetMinus", first, second],
    );
    return native("SetMinus").serialize(serializer, left);
  },
};

/** `\mathrm{name}(args)`: the call, which reads back as the head with exactly these arguments. */
const asCall = (serializer: Serializer, name: string, args: readonly MathJsonExpression[]): string =>
  `\\mathrm{${name}}${serializer.wrapArguments([name, ...args] as unknown as MathJsonExpression)}`;

/** Precedence of the set operations in compute-engine's dictionary (`Union` and `Intersection`). */
const SET_PRECEDENCE = 350;

type Until = NonNullable<Parameters<Parser["parseExpression"]>[0]>;

/** `a∪b∪c` with any number of operands: the sign reads a chain as one `Union`, not as
 *  `Union(a, Union(b, c))`. A union of no or one operand has no sign to write, so it is the call. */
const setOperation = (name: "Union" | "Intersection"): Entry => {
  const entry = native(name);
  return {
    ...entry,
    name,
    parse: (parser: Parser, lhs: MathJsonExpression | null, until: Until) => {
      if (lhs === null) return null;
      const rhs = parser.parseExpression({ ...until, minPrec: SET_PRECEDENCE + 1 });
      // Only a union this sign just read is extended, never a bracketed one: `(a∪b)∪c` stays two.
      return Array.isArray(lhs) && lhs[0] === name
        ? ([...(lhs as readonly unknown[]), rhs] as unknown as MathJsonExpression)
        : [name, lhs, rhs];
    },
    serialize: (serializer, expr) =>
      operands(expr).length >= 2 ? entry.serialize(serializer, expr) : asCall(serializer, name, operands(expr)),
  } as Entry;
};

/** The heads whose value is a set, so `|…|` around one is its cardinality. compute-engine's canonical
 *  `Abs` of a set-typed operand is `Count`, but the editor reads without canonicalizing, so it has no
 *  types: `|𝒫(s)|` stays `Abs` unless the head is known to be a set. */
const SET_HEADS = new Set(["Set", "PowerSet", "QuotientRing", "Union", "Intersection", "SetMinus"]);

/** The native `|…|` entries (`|` and `\vert`), reading a set-valued body as `Count`. */
const cardinality = (): Entry[] =>
  LATEX_DICTIONARY.filter((e) => {
    const { kind, openTrigger } = e as { kind?: string; openTrigger?: unknown };
    return kind === "matchfix" && ['"|"', '["\\\\vert"]'].includes(JSON.stringify(openTrigger));
  }).map((entry) => {
    const { parse } = entry as unknown as { parse: (p: Parser, body: MathJsonExpression) => MathJsonExpression | null };
    return {
      ...entry,
      parse: (parser: Parser, body: MathJsonExpression) => {
        const read = parse(parser, body);
        return Array.isArray(read) && read[0] === "Abs" && Array.isArray(read[1]) && SET_HEADS.has(read[1][0] as string)
          ? (["Count", read[1]] as unknown as MathJsonExpression)
          : read;
      },
    } as Entry;
  });

/** The integrand of an `Integrate`, which the boxed form carries as `Function(f, x, y)`. */
const integrandOf = (integrand: MathJsonExpression | undefined): MathJsonExpression | undefined =>
  Array.isArray(integrand) && integrand[0] === "Function" ? (integrand[1] as MathJsonExpression) : integrand;

/** `\int_a^b\int_c^d f\, dy\, dx` is one `Integrate(f, (x, a, b), (y, c, d))`: the sign reads a run
 *  of integrals as the one n-ary head. An integral of an integral, `Integrate(Integrate(f, y), x)`,
 *  is bracketed to stay two. */
const integrate: Entry = {
  ...native("Integrate"),
  name: "Integrate",
  parse: (parser: Parser, until?: Until) => {
    const read = (
      native("Integrate") as unknown as { parse: (p: Parser, u?: Until) => MathJsonExpression | null }
    ).parse(parser, until);
    if (!Array.isArray(read) || read[0] !== "Integrate") return read;
    const [, inner, ...limits] = read;
    if (!Array.isArray(inner) || inner[0] !== "Integrate") return read;
    const [, body, ...innerLimits] = inner;
    return ["Integrate", body, ...limits, ...innerLimits] as unknown as MathJsonExpression;
  },
  serialize: (serializer, expr) => {
    const [integrand, ...limits] = operands(expr);
    const body = integrandOf(integrand);
    if (!Array.isArray(body) || body[0] !== "Integrate") return native("Integrate").serialize(serializer, expr);
    const grouped = ["Delimiter", body] as unknown as MathJsonExpression;
    const held =
      Array.isArray(integrand) && integrand[0] === "Function"
        ? ["Function", grouped, ...operands(integrand).slice(1)]
        : grouped;
    return native("Integrate").serialize(serializer, ["Integrate", held, ...limits] as unknown as MathJsonExpression);
  },
};

/** Precedence a postfix sign wraps its operand at, as compute-engine wraps a `^T` operand. */
const POSTFIX_PRECEDENCE = 1000;

/** `a^T` for one operand; `Transpose(a, perm)` has no sign, and `a^T` would drop the permutation. */
const transpose: Entry = {
  ...native("Transpose"),
  name: "Transpose",
  serialize: (serializer, expr) => {
    const args = operands(expr);
    return args.length === 1
      ? `${serializer.wrap(args[0]!, POSTFIX_PRECEDENCE)}^T`
      : asCall(serializer, "Transpose", args);
  },
};

/** `\operatorname{Li}_{s}(z, k)`: native writes `Li_s(z)` and drops a third argument. */
const polyLog: Entry = {
  ...native("PolyLog"),
  name: "PolyLog",
  serialize: (serializer, expr) => {
    const [order, ...rest] = operands(expr);
    return order === undefined || rest.length === 0
      ? asCall(serializer, "PolyLog", operands(expr))
      : `\\operatorname{Li}_{${serializer.serialize(order)}}${serializer.wrapArguments(["PolyLog", ...rest] as unknown as MathJsonExpression)}`;
  },
};

/** A first to third order, which `f^{\prime}`, `f^{\doubleprime}` and `f^{\tripleprime}` write. */
const primeOrder = (x: MathJsonExpression | undefined): boolean => {
  const n = typeof x === "number" ? x : typeof x === "object" && x !== null && "num" in x ? Number(x.num) : NaN;
  return n === 1 || n === 2 || n === 3;
};

/** The primes of a symbol, each way compute-engine reads one: `f'`, `f''`, `f'''`, `f^{\prime}`,
 *  `f^{\prime\prime}`, `f^{\doubleprime}`. It reads `Prime(f, k)`; the sign reads `Derivative(f, k)`,
 *  which is what a first to third derivative of a function is everywhere else. */
const PRIMES: readonly (readonly [trigger: string | string[], order: number, precedence?: number])[] = [
  [["^", "\\prime"], 1],
  ["^{\\prime\\prime}", 2],
  ["^{\\prime\\prime\\prime}", 3],
  [["^", "\\doubleprime"], 2],
  [["^", "\\tripleprime"], 3],
  ["'", 1, 810],
  ["\\prime", 1, 810],
  ["\\doubleprime", 2, 810],
  ["\\tripleprime", 3, 810],
];

/** A prime on a symbol is `Derivative(f, k)`; on anything else (`(f+g)'`, `\sin'`) the native read. */
const primeOf = ([trigger, order, precedence]: (typeof PRIMES)[number]): Entry => {
  const nativePrime = LATEX_DICTIONARY.find(
    (e: { latexTrigger?: unknown; kind?: string }) =>
      JSON.stringify(e.latexTrigger) === JSON.stringify(trigger) && e.kind === "postfix",
  ) as { parse?: (p: Parser, lhs: MathJsonExpression, until?: Until) => MathJsonExpression | null } | undefined;
  return {
    latexTrigger: trigger,
    kind: "postfix",
    ...(precedence === undefined ? {} : { precedence }),
    parse: (parser: Parser, lhs: MathJsonExpression, until?: Until) => {
      // `f''` reads as two primes: the second extends the derivative the first made.
      const more = Array.isArray(lhs) && lhs[0] === "Derivative" && lhs.length === 3 && typeof lhs[1] === "string";
      if (typeof lhs !== "string" && !more) return nativePrime?.parse?.(parser, lhs, until) ?? null;
      const derivative = (more
        ? ["Derivative", lhs[1], Number(lhs[2]) + order]
        : ["Derivative", lhs, order]) as unknown as MathJsonExpression;
      // `f''(x)` applies the derivative, as the native read does.
      const args = parser.parseArguments("enclosure");
      return args === null ? derivative : (["Apply", derivative, ...args] as unknown as MathJsonExpression);
    },
  } as Entry;
};

/** `f^{\prime}`, `f^{\doubleprime}` or `f^{\tripleprime}` for a first to third order, bare or applied;
 *  any other order (`k`, a partial) is the call, since `f^{(k)}` and `f^{(0, 1)}` read as a power. */
const derivative: Entry = {
  ...native("Derivative"),
  name: "Derivative",
  serialize: (serializer, expr) => {
    const args = operands(expr);
    // Only a symbol's prime reads back with its order; the prime after anything else drops it.
    // A bare `Derivative(f)` has no order, and `f^{\prime}` reads as `Derivative(f, 1)`: the call.
    const symbol = typeof args[0] === "string";
    return (args.length === 1 && !symbol) || (args.length === 2 && primeOrder(args[1]) && symbol)
      ? native("Derivative").serialize(serializer, expr)
      : asCall(serializer, "Derivative", args);
  },
};

/** `f^{\prime}(x)` reads back as `Apply(Derivative(f, 1), x)`, so a first to third derivative keeps
 *  its prime; any other order (`k`, a partial) is `\mathrm{Apply}(\mathrm{Derivative}(f, k), x)`. */
const apply: Entry = {
  ...native("Apply"),
  name: "Apply",
  serialize: (serializer, expr) => {
    const [head, ...args] = operands(expr);
    if (!Array.isArray(head) || head[0] !== "Derivative") return native("Apply").serialize(serializer, expr);
    const orders = head.slice(2);
    return orders.length === 1 && primeOrder(orders[0] as MathJsonExpression)
      ? native("Derivative").serialize(serializer, head as MathJsonExpression) +
          serializer.wrapArguments(["Apply", ...args] as unknown as MathJsonExpression)
      : asCall(serializer, "Apply", operands(expr));
  },
};

/** `{k→v, …}` as a dictionary: the entries `Dictionary` writes, every one a `To`. A set of arrows is
 *  not a thing, so the braces read as a `Dictionary` when each element is one. */
const dictionaryOf = (body: MathJsonExpression): MathJsonExpression | null => {
  const inner = Array.isArray(body) && body[0] === "Delimiter" ? (body[1] as MathJsonExpression) : body;
  const items = Array.isArray(inner) && inner[0] === "Sequence" ? operands(inner) : [inner];
  if (!items.every((item) => Array.isArray(item) && item[0] === "To" && item.length === 3)) return null;
  return ["Dictionary", ...items.map((item) => ["KeyValuePair", ...operands(item)])] as unknown as MathJsonExpression;
};

const set: Entry = {
  ...native("Set"),
  name: "Set",
  parse: (parser: Parser, body: MathJsonExpression) =>
    dictionaryOf(body) ??
    (native("Set") as unknown as { parse: (p: Parser, b: MathJsonExpression) => MathJsonExpression | null }).parse(
      parser,
      body,
    ),
} as Entry;

/** A truth value written as the word, as InputForm spells it; ⊤ and ⊥ are TraditionalForm's
 *  and still read. */
const truth = (name: "True" | "False", trigger: string): Entry => ({
  name,
  kind: "symbol",
  standaloneSymbol: true,
  latexTrigger: [trigger],
  serialize: () => `\\mathrm{${name}}`,
});

/** The overrides, one per native head that needed one. */
/** A name in a namespace, `a.b.c`, from its `Field` chain; undefined if a part isn't a name. */
function dotted(json: MathJsonExpression | undefined): string | undefined {
  if (typeof json === "string") return /^'.*'$/s.test(json) ? json.slice(1, -1) : json;
  const { sym, str } = (json ?? {}) as { sym?: unknown; str?: unknown };
  if (typeof sym === "string") return sym;
  if (typeof str === "string") return str;
  if (Array.isArray(json) && json[0] === "Field" && json.length === 3) {
    const [base, member] = [dotted(json[1] as MathJsonExpression), dotted(json[2] as MathJsonExpression)];
    return base === undefined || member === undefined ? undefined : `${base}.${member}`;
  }
  return undefined;
}

/** A call by namespace, `\operatorname{enumeratio.PolygonalNumber}(4, 5)`: compute-engine writes
 *  `\mathrm{MemberCall}(enumeratio, …)`. An upstream ask (print `N.m(x)`). */
const memberCall: Entry = {
  name: "MemberCall",
  serialize: (serializer, expr) => {
    const [receiver, member, ...args] = operands(expr);
    const name = dotted(["Field", receiver!, member!] as MathJsonExpression);
    const written = args.map((e) => serializer.serialize(e)).join(", ");
    return name === undefined
      ? `\\mathrm{MemberCall}(${operands(expr)
          .map((e) => serializer.serialize(e))
          .join(", ")})`
      : `\\operatorname{${name}}(${written})`;
  },
};

export const CONVENTIONAL_LATEX: readonly Entry[] = [
  memberCall,
  truth("True", "\\top"),
  truth("False", "\\bot"),
  operatorname("Erf", "erf"),
  operatorname("Erfc", "erfc"),
  // compute-engine writes the Russian `arcctg`.
  operatorname("Arccot", "arccot"),
  // `\mathrm{arcsec}` is the arcsecond to `Quantity`'s reader.
  operatorname("Arcsec", "arcsec"),
  operatorname("Arccsc", "arccsc"),
  equal,
  setMinus,
  set,
  setOperation("Union"),
  setOperation("Intersection"),
  integrate,
  ...cardinality(),
  transpose,
  polyLog,
  derivative,
  apply,
  ...PRIMES.map(primeOf),
  bracketed("Floor", "\\lfloor", "\\rfloor"),
  bracketed("Ceil", "\\lceil", "\\rceil"),
  beta,
  betaRoman,
  square,
  escapedText,
  eulerGamma,
  exp,
  signOut("Divide"),
  multiply,
  add,
  logBase("Log", 10),
  logBase("Log2", 2),
  logBase("Log10", 10),
  logBase("Lb", 2),
];

let probed = false;

/** Marks the `landed` Unicode symbols that this compute-engine parses as their command (the
 *  blackboard sets, once it ships them), which are written as Unicode from then on. */
export function probeLanded(): void {
  if (probed) return;
  probed = true;
  const syntax = new LatexSyntax();
  const read = (tex: string) => JSON.stringify(syntax.parse(tex));
  markLanded(
    UNICODE_TEX.filter((s) => s.landed && read(`x\\in ${s.char}`) === read(`x\\in ${s.command}`)).map((s) => s.char),
  );
}

/** A `LatexSyntax` that writes the Unicode list's symbols as Unicode, whichever route wrote
 *  them (a head's entry, a symbol's name, a template), and reads them as their commands. */
export class DisplayLatexSyntax extends LatexSyntax {
  override serialize(...args: Parameters<LatexSyntax["serialize"]>): string {
    return unicodeTeX(super.serialize(...args));
  }

  override parse(latex: string, options?: Parameters<LatexSyntax["parse"]>[1]): ReturnType<LatexSyntax["parse"]> {
    return super.parse(commandTeX(latex), options);
  }
}

/**
 * `LATEX_DICTIONARY` with the default entries for `CONVENTIONAL_LATEX`'s names
 * dropped, and the conventional ones appended in their place. Two entries for the
 * same `name` is a dictionary-shape warning at construction time (not an error —
 * the later entry still wins — but the default is removed first to build clean).
 */
export function conventionalLatexDictionary(): readonly Entry[] {
  probeLanded();
  const entries = CONVENTIONAL_LATEX;
  const names = new Set(entries.map((e) => e.name));
  const base = LATEX_DICTIONARY.filter((entry) => {
    const name = (entry as { name?: string }).name;
    return !name || !names.has(name);
  });
  return [...base, ...entries];
}
