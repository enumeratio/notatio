// MakeExpression -- boxes read back as an expression, the inverse of `makeBoxes`. A pure
// function of the box tree (no engine, no canonicalization): the tree comes back raw, as
// MathJSON compute-engine boxes and canonicalizes.
//
// A box that carries its expression (an `InterpretationBox`) reads as exactly that
// expression. Everything else is read by structure: the box kind says what it is
// (a fraction, a power, a radical), and a row's tokens are parsed by operator precedence,
// the inverse of the parenthesization `makeBoxes` applies. A reading that two heads
// share (`(a, b)` is a tuple or an open interval, `|x|` an abs or a norm of one bar) goes
// to the likelier head. What cannot be read as an expression (a figure, a control, a layout,
// an error box, boxes the grammar does not cover) throws `MakeExpressionError`, never a guess.

import type { MathJsonExpression as Json } from "@cortex-js/compute-engine/epsil";
import { type Box, type BoxNode, optionsOfBox, tokenClass } from "./box.ts";
import { APPLY_FUNCTION, FUNCTIONS, INVISIBLE_TIMES, RELATIONS, SYMBOLS } from "./make.ts";

/** A box tree that is not an expression, or that the reader does not cover. */
export class MakeExpressionError extends Error {
  override name = "MakeExpressionError";
}

export interface MakeExpressionOptions {
  /** Heads a call's written name stands for (`{ μ: "MoebiusMu" }`), before the built-in function names. */
  readonly heads?: Readonly<Record<string, string>>;
}

const decline = (why: string, box?: unknown): never => {
  throw new MakeExpressionError(box === undefined ? why : `${why}: ${JSON.stringify(box)?.slice(0, 120)}`);
};

/** The first name written as each glyph wins, so a constant (`Pi`) beats a letter (`pi`). */
const SYMBOL_OF = new Map<string, string>();
for (const [name, glyph] of Object.entries(SYMBOLS))
  if (glyph !== "" && !SYMBOL_OF.has(glyph)) SYMBOL_OF.set(glyph, name);
// compute-engine spells infinity `PositiveInfinity`.
SYMBOL_OF.set("∞", "PositiveInfinity");

/** The Greek letters alone: an index `x_α` stays a letter, where a lone `e` or `i` is a constant. */
const CONSTANTS = new Set(["Pi", "EulerGamma", "GoldenRatio"]);
const GREEK_OF = new Map<string, string>();
for (const [name, glyph] of Object.entries(SYMBOLS))
  if (/^\p{Script=Greek}$/u.test(glyph) && !CONSTANTS.has(name) && !GREEK_OF.has(glyph)) GREEK_OF.set(glyph, name);

const FUNCTION_OF = new Map<string, string>();
for (const [head, name] of Object.entries(FUNCTIONS)) if (!FUNCTION_OF.has(name)) FUNCTION_OF.set(name, head);

for (const [name, head] of [
  ["erf", "Erf"],
  ["erfc", "Erfc"],
] as const)
  FUNCTION_OF.set(name, head);

/** Letters the engine's notation writes a head with (`μ(n)`): read as that head when written as a call. */
const LETTER_HEAD: Readonly<Record<string, string>> = {
  μ: "MoebiusMu",
  φ: "Totient",
  π: "PrimePi",
  ω: "PrimeNu",
  Ω: "PrimeOmega",
  λ: "CarmichaelLambda",
  ψ: "Digamma",
  ζ: "Zeta",
  Φ: "LerchPhi",
};

const RELATION_OF = new Map<string, string>(Object.entries(RELATIONS).map(([head, glyph]) => [glyph, head]));
for (const [ascii, head] of [
  ["<=", "LessEqual"],
  [">=", "GreaterEqual"],
  ["!=", "NotEqual"],
  ["==", "Equal"],
] as const)
  RELATION_OF.set(ascii, head);

const TIMES = new Set([INVISIBLE_TIMES, "⋅", "×", "*", "·", "∗"]);
const isMinus = (t: unknown): boolean => t === "−" || t === "-";
const DIVIDES = new Set(["/", "÷"]);
const PRIMES: Record<string, number> = { "′": 1, "″": 2, "‴": 3 };

/** Each opener and the closers it takes (a half-open interval mixes them). */
const CLOSERS: Record<string, readonly string[]> = {
  "(": [")", "]"],
  "[": ["]", ")"],
  "{": ["}"],
  "|": ["|"],
  "‖": ["‖"],
  "⌊": ["⌋"],
  "⌈": ["⌉"],
  "⟨": ["⟩"],
};
const BRACKET_CLOSE: Record<string, string> = { "(": ")", "[": "]", "{": "}", "|": "|", "‖": "‖" };

/** A name written as a function that takes bare arguments (`f`, `g`, `h`). */
const CALLABLE = /^[fgh]$/;
/** Constants that are also the usual name of a bound variable (`Σ_{i=1}`, `e` in an index). */
const REBOUND = new Set(["ImaginaryUnit", "ExponentialE"]);

interface Atom {
  readonly json: Json;
  /** The written name, when the atom is a bare symbol that a call can head. */
  readonly name?: string;
}
const atom = (json: Json): Atom => ({ json });

const isNodeOf = (box: Box | undefined, head: string): box is BoxNode => Array.isArray(box) && box[0] === head;
const rowItems = (box: BoxNode): readonly Box[] => (box as readonly unknown[])[1] as readonly Box[];

/** A written number: a JavaScript number where its spelling survives, else the exact digits. */
function numberJson(digits: string): Json {
  const n = Number(digits);
  return Number.isFinite(n) && String(n) === digits ? n : { num: digits };
}

/** The digits of a `{ num }` literal. */
const digitsOf = (x: Json): string | undefined => {
  const num = (x as { num?: unknown } | null)?.num;
  return typeof num === "string" ? num : undefined;
};

function negate(x: Json): Json {
  if (typeof x === "number") return -x;
  const digits = digitsOf(x);
  if (digits !== undefined) return { num: digits.startsWith("-") ? digits.slice(1) : `-${digits}` };
  return ["Negate", x];
}

const isNumberLiteral = (x: Json): boolean => typeof x === "number" || digitsOf(x) !== undefined;

/** `body` with the symbol `from` written `to`. */
function rename(body: Json, from: string, to: string): Json {
  if (body === from) return to;
  if (Array.isArray(body)) return body.map((x) => rename(x as Json, from, to)) as unknown as Json;
  return body;
}

/** A bound variable that reads as a constant (`i`) is the letter in its scope. */
function bound(variable: Json, body: Json): { variable: Json; body: Json } {
  if (typeof variable !== "string" || !REBOUND.has(variable)) return { variable, body };
  const letter = SYMBOLS[variable]!;
  return { variable: letter, body: rename(body, variable, letter) };
}

class Reader {
  pos = 0;
  constructor(
    readonly items: readonly Box[],
    readonly options: MakeExpressionOptions,
  ) {}

  peek(offset = 0): Box | undefined {
    return this.items[this.pos + offset];
  }

  eat(token: string): boolean {
    if (this.peek() !== token) return false;
    this.pos++;
    return true;
  }

  /** `items` read whole, as an expression of their own. */
  sub(items: readonly Box[]): Json {
    return new Reader(items, this.options).whole();
  }

  /** One box read as an expression of its own. */
  box(box: Box): Json {
    return this.sub(isNodeOf(box, "RowBox") ? rowItems(box) : [box]);
  }

  atomOf(box: Box): Atom {
    return new Reader([box], this.options).primary();
  }

  /** Every item, as one expression (several comma-separated are a `Sequence`). */
  whole(): Json {
    if (this.items.length === 0) return "Nothing";
    const list = this.list();
    if (this.pos < this.items.length) decline("unexpected", this.peek());
    return list.length === 1 ? list[0]! : (["Sequence", ...list] as Json);
  }

  list(): Json[] {
    const out: Json[] = [];
    do out.push(this.logic());
    while (this.eat(","));
    return out;
  }

  logic(): Json {
    const first = this.or();
    const op = this.peek();
    if (op !== "⇒" && op !== "⇔") return first;
    const operands = [first];
    while (this.eat(op)) operands.push(this.or());
    return [op === "⇒" ? "Implies" : "Equivalent", ...operands] as Json;
  }

  or(): Json {
    const operands = [this.and()];
    while (this.eat("∨")) operands.push(this.and());
    return operands.length === 1 ? operands[0]! : (["Or", ...operands] as Json);
  }

  and(): Json {
    const operands = [this.not()];
    while (this.eat("∧")) operands.push(this.not());
    return operands.length === 1 ? operands[0]! : (["And", ...operands] as Json);
  }

  not(): Json {
    return this.eat("¬") ? (["Not", this.not()] as Json) : this.relation();
  }

  relation(): Json {
    const operands = [this.add()];
    const heads: string[] = [];
    for (let head = this.relationHead(); head !== undefined; head = this.relationHead()) {
      this.pos++;
      heads.push(head);
      operands.push(this.add());
    }
    if (heads.length === 0) return operands[0]!;
    if (heads.every((h) => h === heads[0])) return [heads[0]!, ...operands] as Json;
    return ["And", ...heads.map((h, i) => [h, operands[i], operands[i + 1]])] as unknown as Json;
  }

  relationHead(): string | undefined {
    const t = this.peek();
    return typeof t === "string" ? RELATION_OF.get(t) : undefined;
  }

  add(): Json {
    const terms: Json[] = [this.signed()];
    let last: Json | undefined;
    let subtracted = false;
    for (;;) {
      const t = this.peek();
      if (t !== "+" && !isMinus(t)) break;
      this.pos++;
      const term = this.multiply();
      subtracted = isMinus(t);
      last = term;
      terms.push(subtracted ? negate(term) : term);
    }
    if (terms.length === 1) return terms[0]!;
    if (terms.length === 2 && subtracted && !isNumberLiteral(last!)) return ["Subtract", terms[0], last] as Json;
    return ["Add", ...terms] as Json;
  }

  /** A term with its sign: `−a b` is the negation of the product. */
  signed(): Json {
    if (isMinus(this.peek())) {
      this.pos++;
      return negate(this.multiply());
    }
    this.eat("+");
    return this.multiply();
  }

  multiply(): Json {
    let factors: Json[] = [this.factor()];
    const fold = (): Json => (factors.length === 1 ? factors[0]! : (["Multiply", ...factors] as Json));
    for (;;) {
      const t = this.peek();
      if (typeof t === "string") {
        if (TIMES.has(t)) {
          this.pos++;
          const next = this.factor();
          const scientific = t === "×" && factors.length === 1 ? scientificNumber(factors[0]!, next) : undefined;
          factors = scientific === undefined ? [...factors, next] : [scientific];
          continue;
        }
        if (DIVIDES.has(t)) {
          this.pos++;
          factors = [["Divide", fold(), this.factor()] as Json];
          continue;
        }
        if (t === "mod") {
          this.pos++;
          factors = [["Mod", fold(), this.factor()] as Json];
          continue;
        }
      }
      if (!this.startsFactor(t)) break;
      factors.push(this.factor());
    }
    return fold();
  }

  /** Whether `t` begins a factor written with no operator before it (`2x`, `x(y+1)`). */
  startsFactor(t: Box | undefined): boolean {
    if (t === undefined) return false;
    if (typeof t !== "string") return true;
    if (t === "mod" || t === "") return false;
    const kind = tokenClass(t);
    if (kind !== "operator") return true;
    return SYMBOL_OF.has(t) || ["(", "[", "{", "⌊", "⌈", "⟨", "∑", "∏", "∫"].includes(t);
  }

  factor(): Json {
    if (isMinus(this.peek())) {
      this.pos++;
      return negate(this.factor());
    }
    return this.postfix(this.primary());
  }

  postfix(start: Atom): Json {
    let { json, name } = start;
    for (;;) {
      const t = this.peek();
      if (t === "!" || t === "!!") {
        this.pos++;
        json = [t === "!" ? "Factorial" : "Factorial2", json] as Json;
        name = undefined;
      } else if (typeof t === "string" && PRIMES[t] !== undefined) {
        this.pos++;
        json = ["Derivative", json, PRIMES[t]!] as Json;
        name = undefined;
      } else if (
        t === APPLY_FUNCTION ||
        ((t === "(" || this.fencedRow(t)) && name !== undefined && this.callable(name))
      ) {
        this.eat(APPLY_FUNCTION);
        const args = this.arguments();
        json = (name === undefined ? ["Apply", json, ...args] : [this.callee(name, args.length), ...args]) as Json;
        name = undefined;
      } else if (name !== undefined && FUNCTION_OF.has(name) && name !== "mod" && this.startsFactor(t)) {
        // `sin x`: a named function with its argument written bare.
        json = [this.callee(name), this.factor()] as Json;
        name = undefined;
      } else return json;
    }
  }

  callee(name: string, argc = 1): string {
    // `ζ(s, a)` is the Hurwitz zeta.
    if (name === "ζ" && argc === 2) return "HurwitzZeta";
    return this.options.heads?.[name] ?? FUNCTION_OF.get(name) ?? LETTER_HEAD[name] ?? name;
  }

  callable(name: string): boolean {
    return FUNCTION_OF.has(name) || CALLABLE.test(name) || this.options.heads?.[name] !== undefined;
  }

  /** A call's parenthesised arguments, as one fenced row or as flat tokens. */
  arguments(): Json[] {
    const group = this.peek();
    if (this.fencedRow(group)) {
      this.pos++;
      const inner = rowItems(group).slice(1, -1);
      return inner.length === 0 ? [] : this.listOf(inner);
    }
    if (!this.eat("(")) decline("a call without arguments", group);
    const args = this.peek() === ")" ? [] : this.list();
    if (!this.eat(")")) decline("an unclosed call", this.peek());
    return args;
  }

  /** A row that is `( … )` and nothing else. */
  fencedRow(box: Box | undefined): box is BoxNode {
    if (!isNodeOf(box, "RowBox")) return false;
    const items = rowItems(box);
    return items.length >= 2 && items[0] === "(" && items[items.length - 1] === ")";
  }

  listOf(items: readonly Box[]): Json[] {
    const reader = new Reader(items, this.options);
    const list = reader.list();
    if (reader.pos < items.length) decline("unexpected", reader.peek());
    return list;
  }

  /** What a named function is applied to: parenthesised, or the next factor. */
  functionArguments(): Json[] {
    this.eat(APPLY_FUNCTION);
    if (this.peek() === "(" || this.fencedRow(this.peek())) return this.arguments();
    if (!this.startsFactor(this.peek())) return decline("a function without an argument", this.peek());
    return [this.factor()];
  }

  primary(): Atom {
    const item = this.items[this.pos];
    if (item === undefined) return decline("an expression ends early");
    this.pos++;
    return typeof item === "string" ? this.token(item) : this.node(item);
  }

  token(t: string): Atom {
    const kind = tokenClass(t);
    if (kind === "number") {
      const next = this.peek();
      if (isNodeOf(next, "OverscriptBox") && next[2] === "‾" && typeof next[1] === "string" && /^\d+$/.test(next[1])) {
        this.pos++;
        return atom({ num: `${t}(${next[1]})` });
      }
      return atom(numberJson(t));
    }
    const symbol = SYMBOL_OF.get(t);
    if (kind === "identifier") {
      if (t === "") return atom("Nothing");
      return { json: symbol ?? FUNCTION_OF.get(t) ?? t, name: t };
    }
    if (symbol !== undefined) return atom(symbol);
    // A pattern's wildcard (`_`, `_x`, `__`): the symbol as written.
    if (/^_+\w*$/.test(t)) return atom(t);
    switch (t) {
      // `!n`: the subfactorial `makeBoxes` writes before its operand.
      case "!":
        return atom(["Subfactorial", this.factor()] as Json);
      case "∑":
      case "∏":
        return atom(this.bigOperator(t, undefined, undefined));
      case "∫":
        return atom(this.integral(undefined, undefined));
    }
    if (CLOSERS[t] !== undefined) return atom(this.fenced(t));
    return decline("an operator with no operand", t);
  }

  /** What follows an opener, to its closer. */
  fenced(open: string): Json {
    const first = this.peek();
    const closer = BRACKET_CLOSE[open];
    if (isNodeOf(first, "GridBox") && closer !== undefined && this.peek(1) === closer) {
      this.pos += 2;
      return matrix(this, first, open);
    }
    if (open === "{" && isNodeOf(first, "GridBox") && this.peek(1) !== "}") {
      this.pos++;
      return piecewise(this, first);
    }
    if (isNodeOf(first, "FractionBox") && optionsOfBox(first).FractionLine === false && this.peek(1) === closer) {
      this.pos += 2;
      return this.binomial(first);
    }
    let elements: Json[] =
      this.peek() !== undefined && CLOSERS[open]!.includes(this.peek() as string) ? [] : this.list();
    const end = this.peek();
    if (typeof end !== "string" || !CLOSERS[open]!.includes(end)) return decline(`an unclosed ${open}`, end);
    this.pos++;
    const only = elements[0];
    if (elements.length === 1 && Array.isArray(only) && only[0] === "Sequence") elements = only.slice(1) as Json[];
    const one = (head: string): Json =>
      elements.length === 1 ? ([head, elements[0]] as Json) : decline(`${head} of ${elements.length} operands`);
    const interval = (): Json =>
      elements.length === 2
        ? ([
            "Interval",
            open === "(" ? ["Open", elements[0]] : elements[0],
            end === ")" ? ["Open", elements[1]] : elements[1],
          ] as Json)
        : decline("a half-open interval of other than two ends");
    switch (open) {
      case "(":
        if (end === "]") return interval();
        return elements.length === 1 ? elements[0]! : (["Tuple", ...elements] as Json);
      case "[":
        return end === ")" ? interval() : (["List", ...elements] as Json);
      case "{":
        return ["Set", ...elements] as Json;
      case "|":
        return one("Abs");
      case "‖":
        return one("Norm");
      case "⌊":
        return one("Floor");
      case "⌈":
        return one("Ceil");
      default:
        return decline("a bracket with no expression", open);
    }
  }

  /** `(n k)` over no line: a binomial, or a multinomial of several parts. */
  binomial(box: BoxNode): Json {
    const [, top, bottom] = box as unknown as [string, Box, Box];
    const parts = this.box(bottom);
    if (Array.isArray(parts) && parts[0] === "Sequence") return ["Multinomial", ...(parts as Json[]).slice(1)] as Json;
    return ["Binomial", this.box(top), parts] as Json;
  }

  node(box: BoxNode): Atom {
    const args = box as unknown as readonly Box[];
    switch (box[0]) {
      case "RowBox": {
        const items = rowItems(box);
        return items.length === 1 ? this.atomOf(items[0]!) : atom(this.sub(items));
      }
      case "TextBox":
        return atom({ str: args[1] as string });
      case "FractionBox": {
        if (optionsOfBox(box).FractionLine === false) return decline("a fraction with no line", box);
        const [, top, bottom] = args as [unknown, Box, Box];
        if (top === "d" && isNodeOf(bottom, "RowBox") && rowItems(bottom)[0] === "d" && rowItems(bottom).length > 1) {
          // Leibniz: `d/dx f`.
          const variable = this.sub(rowItems(bottom).slice(1));
          return atom(["D", this.multiply(), variable] as Json);
        }
        return atom(["Divide", this.box(top), this.box(bottom)] as Json);
      }
      case "SqrtBox":
        return atom(["Sqrt", this.box(args[1]!)] as Json);
      case "RadicalBox":
        return atom(["Root", this.box(args[1]!), this.box(args[2]!)] as Json);
      case "SuperscriptBox":
        return this.power(args[1]!, args[2]!);
      case "SubscriptBox":
        return this.subscript(args[1]!, args[2]!);
      case "SubsuperscriptBox": {
        const [, base, sub, sup] = args as [unknown, Box, Box, Box];
        if (base === "∫") return atom(this.integral(sub, sup));
        const lowered = this.subscript(base, sub).json;
        return atom(["Power", lowered, this.box(sup)] as Json);
      }
      case "UnderscriptBox": {
        const [, base, under] = args as [unknown, Box, Box];
        if (base === "lim") return atom(this.limit(under));
        if (base === "∑" || base === "∏") return atom(this.bigOperator(base, under, undefined));
        return decline("an underscript that is not a limit or a big operator", box);
      }
      case "UnderoverscriptBox": {
        const [, base, under, over] = args as [unknown, Box, Box, Box];
        if (base === "∑" || base === "∏") return atom(this.bigOperator(base, under, over));
        return decline("an underoverscript that is not a big operator", box);
      }
      // What draws or places an expression is transparent to it.
      case "StyleBox":
      case "FrameBox":
      case "PanelBox":
      case "PaneBox":
      case "TooltipBox":
      case "TagBox":
        return this.atomOf(args[1]!);
      case "FormBox":
        return args[2] === "TeXForm" ? decline("TeX as written", box) : this.atomOf(args[1]!);
      // The box carries what it stands for.
      case "InterpretationBox":
        return atom(args[2] as unknown as Json);
      default:
        return decline("not an expression", box[0]);
    }
  }

  power(base: Box, sup: Box): Atom {
    if (typeof sup === "string" && PRIMES[sup] !== undefined)
      return atom(["Derivative", this.box(base), PRIMES[sup]] as Json);
    // `f^(n)`: the n-th derivative, not a power with its exponent in parentheses.
    const order = this.fencedRow(sup) && rowItems(sup).length === 3 ? rowItems(sup)[1] : undefined;
    const derivable = typeof base === "string" ? tokenClass(base) === "identifier" : isNodeOf(base, "RowBox");
    if (derivable && typeof order === "string" && /^\d+$/.test(order))
      return atom(["Derivative", this.box(base), Number(order)] as Json);
    if (typeof base === "string" && FUNCTION_OF.has(base) && base !== "mod") {
      return atom(["Power", [this.callee(base), ...this.functionArguments()], this.box(sup)] as Json);
    }
    return atom(["Power", this.box(base), this.box(sup)] as Json);
  }

  subscript(base: Box, sub: Box): Atom {
    if (base === "log") return atom(["Log", ...this.functionArguments(), this.box(sub)] as Json);
    if (base === "∫") return atom(this.integral(sub, undefined));
    const name = subscriptedName(base, sub);
    if (name !== undefined) return { json: name, name };
    return atom(["Subscript", this.box(base), this.box(sub)] as Json);
  }

  /** `∑`/`∏` with their bounds, over the product that follows. */
  bigOperator(symbol: string, under: Box | undefined, over: Box | undefined): Json {
    const written = under === undefined ? undefined : this.box(under);
    const upper = over === undefined ? undefined : this.box(over);
    let variable: Json | undefined;
    let limits: Json | undefined = written;
    if (Array.isArray(written) && written[0] === "Equal" && written.length === 3) {
      variable = written[1] as Json;
      limits = ["Limits", variable, written[2], ...(upper === undefined ? [] : [upper])] as Json;
    } else if (written !== undefined && upper !== undefined) {
      variable = written;
      limits = ["Limits", written, "Nothing", upper] as Json;
    }
    const body = this.multiply();
    if (limits === undefined) return [symbol === "∑" ? "Sum" : "Product", body] as Json;
    const bound_ = bound(variable ?? "", body);
    const fixed = variable === undefined ? limits : rename(limits, variable as string, bound_.variable as string);
    return [symbol === "∑" ? "Sum" : "Product", bound_.body, fixed] as Json;
  }

  /** `∫ f dx` and its bounds; the differential is the first `d x` after the integrand. */
  integral(lower: Box | undefined, upper: Box | undefined): Json {
    let end = this.pos;
    let variable: Json | undefined;
    let next = this.pos;
    for (; end < this.items.length; end++) {
      const item = this.items[end]!;
      if (isNodeOf(item, "RowBox") && rowItems(item)[0] === "d" && rowItems(item).length > 1) {
        variable = this.sub(rowItems(item).slice(1));
        next = end + 1;
        break;
      }
      if (item === "d" && end + 1 < this.items.length) {
        variable = this.atomOf(this.items[end + 1]!).json;
        next = end + 2;
        break;
      }
    }
    if (variable === undefined) return decline("an integral with no differential");
    const integrand = end === this.pos ? 1 : this.sub(this.items.slice(this.pos, end));
    this.pos = next;
    const { variable: v, body } = bound(variable, integrand);
    const lo = lower === undefined ? undefined : this.box(lower);
    const hi = upper === undefined ? undefined : this.box(upper);
    const bounds: Json = lo === undefined ? v : (["Limits", v, lo, ...(hi === undefined ? [] : [hi])] as Json);
    return ["Integrate", body, bounds] as Json;
  }

  /** `lim` under `x → a`, over the product that follows. */
  limit(under: Box): Json {
    const items = isNodeOf(under, "RowBox") ? rowItems(under) : [under];
    const arrow = items.indexOf("→");
    if (arrow < 0) return ["Limit", this.multiply(), this.sub(items)] as Json;
    const variable = this.sub(items.slice(0, arrow));
    const to = this.sub(items.slice(arrow + 1));
    const { variable: v, body } = bound(variable, this.multiply());
    return ["Limit", ["Function", ["Block", body], v], to] as Json;
  }
}

/** `10^k` after a mantissa, as `m × 10^k`: the number written in scientific notation. */
function scientificNumber(mantissa: Json, power: Json): Json | undefined {
  if (!isNumberLiteral(mantissa) || !Array.isArray(power) || power[0] !== "Power" || power[1] !== 10) return undefined;
  const exponent = power[2];
  if (typeof exponent !== "number" || !Number.isInteger(exponent)) return undefined;
  const digits = typeof mantissa === "number" ? String(mantissa) : (mantissa as { num: string }).num;
  return numberJson(`${digits}e${exponent}`);
}

/** `x_1`, `α_max`: a symbol whose name has an underscore. A script that is not a plain name is no symbol. */
function subscriptedName(base: Box, sub: Box): string | undefined {
  if (typeof base !== "string" || base === "" || tokenClass(base) !== "identifier") return undefined;
  if (SYMBOL_OF.has(base) && !GREEK_OF.has(base)) return undefined;
  const script = typeof sub === "string" ? scriptName(sub) : isNodeOf(sub, "SubscriptBox") ? nested(sub) : undefined;
  return script === undefined ? undefined : `${GREEK_OF.get(base) ?? base}_${script}`;
}

const scriptName = (sub: string): string | undefined =>
  /^\d+$/.test(sub) ? sub : tokenClass(sub) === "identifier" && sub !== "" ? (GREEK_OF.get(sub) ?? sub) : undefined;

const nested = (sub: BoxNode): string | undefined => {
  const [, base, script] = sub as unknown as [string, Box, Box];
  return subscriptedName(base, script);
};

/** A grid in `open … close`, as a matrix. */
function matrix(reader: Reader, grid: BoxNode, open: string): Json {
  const rows = (grid as unknown as [string, readonly (readonly Box[])[]])[1];
  const list = ["List", ...rows.map((r) => ["List", ...r.map((cell) => reader.box(cell))])] as unknown as Json;
  return open === "(" ? (["Matrix", list] as Json) : (["Matrix", list, `'${open}${BRACKET_CLOSE[open]}'`] as Json);
}

/** `{` over a grid of `value, if condition` rows: a piecewise function, `Which(condition, value, …)`. */
function piecewise(reader: Reader, grid: BoxNode): Json {
  const rows = (grid as unknown as [string, readonly (readonly Box[])[]])[1];
  const parts: Json[] = [];
  for (const cells of rows) {
    if (cells.length !== 2) return decline("a piecewise row of other than two cells", cells);
    const [value, condition] = cells as [Box, Box];
    const tail = isNodeOf(condition, "RowBox") ? rowItems(condition) : [condition];
    const lead = tail[0];
    if (isNodeOf(lead, "TextBox") && lead[1] === "otherwise" && tail.length === 1)
      parts.push("True", reader.box(value));
    else if (isNodeOf(lead, "TextBox") && /^if\s*$/.test(lead[1] as string))
      parts.push(reader.sub(tail.slice(1)), reader.box(value));
    else return decline("a piecewise condition", condition);
  }
  return ["Which", ...parts] as Json;
}

/**
 * `box` read back as an expression: the inverse of `makeBoxes`, from a box tree alone. The
 * expression an `InterpretationBox` carries is returned as it is; any other box is read by its
 * structure, so what `makeBoxes` writes comes back as the same tree up to spellings the
 * notation shares (`Subtract` and `Add` of a `Negate`, `Divide` and `Rational`, a half-open
 * `Interval` and a pair), and is the same expression once canonical.
 *
 * Throws `MakeExpressionError` for boxes that are not an expression (graphics, controls,
 * layouts, TeX as written, errors) or that the reader does not cover.
 */
export function makeExpression(box: Box, options: MakeExpressionOptions = {}): Json {
  return new Reader([box], options).whole();
}
