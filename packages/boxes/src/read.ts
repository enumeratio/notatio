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
import { type Box, type BoxNode, isBoxHead, optionsOfBox, tokenClass } from "./box.ts";
import {
  APPLY_FUNCTION,
  FUNCTIONS,
  INVISIBLE_TIMES,
  makeBareBoxes,
  RELATIONS,
  SYMBOLS,
  setAmbiguousNotation,
} from "./make.ts";
import { ENGINE_NOTATION } from "./notation-engine.ts";
import type { Notation } from "./notation.ts";

/** A box tree that is not an expression, or that the reader does not cover. */
export class MakeExpressionError extends Error {
  override name = "MakeExpressionError";
}

export interface MakeExpressionOptions {
  /** Heads a call's written name stands for (`{ μ: "MoebiusMu" }`), before the built-in function names. */
  readonly heads?: Readonly<Record<string, string>>;
  /**
   * The notation rules a head is read back from, as `makeBoxes` takes them: what a box that one
   * of them writes (`F_n`, `(a)_n`, `μ(n)`) reads as. Compute-engine's own heads are always read.
   */
  readonly notation?: Notation;
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

/** Each opener and the closers it takes (an interval may mix them: `[a, b)`, `]a, b[`, ISO 80000-2). */
const CLOSERS: Record<string, readonly string[]> = {
  "(": [")", "]"],
  "[": ["]", ")", "["],
  "]": ["[", "]"],
  "⟦": ["⟧"],
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

/** A `Function`'s parameters are names: `i` there is the letter its body uses, not the imaginary unit. */
function parameters(fn: Json[]): Json {
  const [head, body, ...names] = fn as [string, Json, ...Json[]];
  let renamed = body;
  const letters = names.map((name) => {
    const rebound = bound(name, renamed);
    renamed = rebound.body;
    return rebound.variable;
  });
  return [head, renamed, ...letters] as Json;
}

/** A notation rule's boxes for a head of `arity` operands, each one a `SLOTS` placeholder. */
interface Pattern {
  readonly head: string;
  readonly arity: number;
  readonly items: readonly Box[];
  /** How many of its leaves are written out, not an operand's place. */
  readonly literals: number;
}

/** The pattern that fits a box wins by what it spells out: more boxes, then more of them written
 *  literally (`(a^{-1} mod n)` is a modular inverse, though `(a^b mod n)` fits it too). */
const rank = (p: Pattern): [number, number] => [p.items.length, p.literals];
const tied = (best: Pattern, next: Pattern): boolean => {
  const [a, b] = [rank(best), rank(next)];
  return a[0] === b[0] && a[1] === b[1];
};
const compare = (a: Pattern, b: Pattern): number => b.items.length - a.items.length || b.literals - a.literals;

interface Notated {
  /** Patterns by their first box, longest first. */
  readonly byFirst: ReadonlyMap<string, readonly Pattern[]>;
  /** Names a notation writes a call with (`μ`, `ζ`). */
  readonly calls: ReadonlySet<string>;
  /** The patterns of heads kept in a `TagBox`, by head: read by the tag, never by their look. */
  readonly tagged: ReadonlyMap<string, readonly Pattern[]>;
}

/** Placeholder operands a rule is run on: each a symbol `makeBoxes` writes as itself. */
const SLOTS = ["\uE000", "\uE001", "\uE002", "\uE003"];
const slotOf = (box: Box): number => (typeof box === "string" ? SLOTS.indexOf(box) : -1);

const firstKey = (box: Box | undefined): string =>
  typeof box === "string" ? `t:${box}` : Array.isArray(box) ? `n:${box[0]}` : "";

/** `box` against a pattern: equal, except that each placeholder stands for (and binds) one operand's boxes. */
function matches(pattern: unknown, box: unknown, binds: Map<number, Box>): boolean {
  const slot = slotOf(pattern as Box);
  if (slot >= 0) {
    const bound = binds.get(slot);
    if (bound === undefined) binds.set(slot, box as Box);
    return bound === undefined || JSON.stringify(bound) === JSON.stringify(box);
  }
  if (Array.isArray(pattern))
    return Array.isArray(box) && box.length === pattern.length && pattern.every((p, i) => matches(p, box[i], binds));
  if (typeof pattern === "object" && pattern !== null) return JSON.stringify(pattern) === JSON.stringify(box);
  return pattern === box;
}

const literalsIn = (box: unknown): number =>
  Array.isArray(box) ? box.reduce<number>((n, x) => n + literalsIn(x), 0) : slotOf(box as Box) >= 0 ? 0 : 1;

const mentions = (box: unknown, slot: string): boolean =>
  box === slot || (Array.isArray(box) && box.some((x) => mentions(x, slot)));

const NOTHING: Notated = { byFirst: new Map(), calls: new Set(), tagged: new Map() };

/** Operand names a structural reading is run on: placeholders are not symbols the reader knows. */
const NAMES = ["opA", "opB", "opC", "opD"];
const named = (box: unknown): unknown =>
  Array.isArray(box) ? box.map(named) : slotOf(box as Box) >= 0 ? NAMES[slotOf(box as Box)] : box;

/** Whether `box` writes out a name (`F`, `μ`, `1`): a letter or a number that is not an operand's place. */
const writesName = (box: unknown): boolean =>
  Array.isArray(box)
    ? box.slice(isBoxHead(box[0]) ? 1 : 0).some(writesName)
    : typeof box === "string" && slotOf(box) < 0 && box !== "mod" && tokenClass(box) !== "operator";

const mentionsHead = (json: Json, head: string): boolean =>
  json === head || (Array.isArray(json) && json.some((x) => mentionsHead(x as Json, head)));

/**
 * Whether a head's boxes name nothing: they are operands in a bracket, a script or a fraction,
 * which any other expression of that structure writes the same (a quotient in parentheses,
 * `(a)_n`). A reading of the boxes that finds the head itself leaves nothing to tell apart.
 */
function generic({ head, items }: Pattern): boolean {
  if (writesName(items)) return false;
  const operandsOnly = (json: Json): boolean =>
    Array.isArray(json)
      ? (json as Json[]).slice(1).every(operandsOnly)
      : typeof json === "string" && NAMES.includes(json);
  try {
    const json = new Reader(named(items) as Box[], {}, NOTHING).whole();
    return operandsOnly(json) && !mentionsHead(json, head);
  } catch {
    return false;
  }
}

/**
 * What each rule writes, learned by running it: for every head and arity, the boxes of the head
 * applied to placeholders. A head whose rule declines (it writes a call by name) or drops an
 * operand has no pattern. Heads whose patterns come out the same, and a pattern that is only
 * operands in a structure, are ambiguous: `makeBoxes` keeps their head in a `TagBox`, and the
 * reader takes it from there. The rest are read by their look.
 */
function notatedFrom(notation: Notation): Notated {
  const byShape = new Map<string, Pattern[]>();
  for (const head of Object.keys(notation)) {
    for (let arity = 1; arity <= SLOTS.length; arity++) {
      let box: Box;
      try {
        box = makeBareBoxes([head, ...SLOTS.slice(0, arity)] as never, notation);
      } catch {
        continue;
      }
      const items = isNodeOf(box, "RowBox") ? rowItems(box) : [box];
      if (items[0] === head || !SLOTS.slice(0, arity).every((s) => mentions(box, s))) continue;
      const shape = JSON.stringify(items);
      byShape.set(shape, [...(byShape.get(shape) ?? []), { head, arity, items, literals: literalsIn(items) }]);
    }
  }
  const byFirst = new Map<string, Pattern[]>();
  const tagged = new Map<string, Pattern[]>();
  const calls = new Set<string>();
  for (const patterns of byShape.values()) {
    const [pattern] = patterns;
    const [first, second] = pattern!.items;
    if (typeof first === "string" && second === APPLY_FUNCTION) calls.add(first);
    if (patterns.length > 1 || generic(pattern!)) {
      for (const p of patterns) tagged.set(p.head, [...(tagged.get(p.head) ?? []), p]);
      continue;
    }
    if (slotOf(first!) >= 0) continue;
    const key = firstKey(first);
    byFirst.set(key, [...(byFirst.get(key) ?? []), pattern!].toSorted(compare));
  }
  return { byFirst, calls, tagged };
}

let defaults: Notated | undefined;
const cache = new WeakMap<Notation, Notated>();

/** The patterns of compute-engine's notation, and of `extra` over it. */
function notatedBy(extra: Notation | undefined): Notated {
  if (extra === undefined || Object.keys(extra).length === 0) return (defaults ??= notatedFrom(ENGINE_NOTATION));
  let found = cache.get(extra);
  if (found === undefined) cache.set(extra, (found = notatedFrom({ ...ENGINE_NOTATION, ...extra })));
  return found;
}

setAmbiguousNotation((extra) => {
  const { tagged } = notatedBy(extra);
  return new Set([...tagged.values()].flatMap((patterns) => patterns.map((p) => `${p.head}/${p.arity}`)));
});

class Reader {
  pos = 0;
  /** Inside `]a, b[` (or `[a, b[`): a `[` after an operand closes the interval, it is no factor. */
  closesInterval = false;
  constructor(
    readonly items: readonly Box[],
    readonly options: MakeExpressionOptions,
    readonly notated: Notated,
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
    return new Reader(items, this.options, this.notated).whole();
  }

  /** One box read as an expression of its own. */
  box(box: Box): Json {
    return this.sub(isNodeOf(box, "RowBox") ? rowItems(box) : [box]);
  }

  atomOf(box: Box): Atom {
    return new Reader([box], this.options, this.notated).primary();
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
    const operands = [this.symmetricDifference()];
    const heads: string[] = [];
    for (let head = this.relationHead(); head !== undefined; head = this.relationHead()) {
      this.pos++;
      heads.push(head);
      operands.push(this.symmetricDifference());
    }
    if (heads.length === 0) return operands[0]!;
    if (heads.every((h) => h === heads[0])) return [heads[0]!, ...operands] as Json;
    return ["And", ...heads.map((h, i) => [h, operands[i], operands[i + 1]])] as unknown as Json;
  }

  relationHead(): string | undefined {
    const t = this.peek();
    return typeof t === "string" ? RELATION_OF.get(t) : undefined;
  }

  /** `a △ b △ c`, one call: looser than a sum, tighter than a relation. */
  symmetricDifference(): Json {
    const operands = [this.add()];
    while (this.eat("△")) operands.push(this.add());
    return operands.length === 1 ? operands[0]! : (["SymmetricDifference", ...operands] as Json);
  }

  add(): Json {
    const terms: Json[] = [this.setOperators(this.signed())];
    let last: Json | undefined;
    let subtracted = false;
    for (;;) {
      const t = this.peek();
      if (t !== "+" && !isMinus(t)) break;
      this.pos++;
      const term = this.setOperators(this.multiply());
      subtracted = isMinus(t);
      last = term;
      terms.push(subtracted ? negate(term) : term);
    }
    if (terms.length === 1) return terms[0]!;
    if (terms.length === 2 && subtracted && !isNumberLiteral(last!)) return ["Subtract", terms[0], last] as Json;
    return ["Add", ...terms] as Json;
  }

  /**
   * `∪` and `∩` after `first`, between a sum and a product as in compute-engine. A run of one
   * operator is one call (`a ∪ b ∪ c`); a different operator after it nests to the right, as
   * compute-engine reads `a ∪ b ∩ c` as `Union(a, Intersection(b, c))`.
   */
  setOperators(first: Json): Json {
    const glyph = this.peek();
    if (glyph !== "∪" && glyph !== "∩") return first;
    const operands = [first];
    while (this.eat(glyph)) {
      const next = this.multiply();
      if (this.peek() === glyph) operands.push(next);
      else {
        operands.push(this.setOperators(next));
        break;
      }
    }
    return [glyph === "∪" ? "Union" : "Intersection", ...operands] as Json;
  }

  /** `a ∖ b ∖ c`, one call, binding tighter than a product. */
  setMinus(): Json {
    const operands = [this.factor()];
    while (this.eat("∖")) operands.push(this.factor());
    return operands.length === 1 ? operands[0]! : (["SetMinus", ...operands] as Json);
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
    let factors: Json[] = [this.setMinus()];
    const fold = (): Json => (factors.length === 1 ? factors[0]! : (["Multiply", ...factors] as Json));
    for (;;) {
      const t = this.peek();
      if (typeof t === "string") {
        if (TIMES.has(t)) {
          this.pos++;
          const next = this.setMinus();
          const scientific = t === "×" && factors.length === 1 ? scientificNumber(factors[0]!, next) : undefined;
          factors = scientific === undefined ? [...factors, next] : [scientific];
          continue;
        }
        if (DIVIDES.has(t)) {
          this.pos++;
          factors = [["Divide", fold(), this.setMinus()] as Json];
          continue;
        }
        if (t === "mod") {
          this.pos++;
          factors = [["Mod", fold(), this.setMinus()] as Json];
          continue;
        }
      }
      if (!this.startsFactor(t)) break;
      factors.push(this.setMinus());
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
    if (t === "[" && this.closesInterval) return false;
    return SYMBOL_OF.has(t) || ["(", "[", "{", "⌊", "⌈", "⟨", "⟦", "∑", "∏", "∫"].includes(t);
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
        if (Array.isArray(json) && json[0] === "Function") json = parameters(json);
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
    return this.options.heads?.[name] ?? FUNCTION_OF.get(name) ?? name;
  }

  callable(name: string): boolean {
    return (
      FUNCTION_OF.has(name) ||
      CALLABLE.test(name) ||
      this.options.heads?.[name] !== undefined ||
      this.notated.calls.has(name)
    );
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
    const reader = new Reader(items, this.options, this.notated);
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
    const head = this.notation();
    if (head !== undefined) return head;
    this.pos++;
    return typeof item === "string" ? this.token(item) : this.node(item);
  }

  /** The head a registered notation writes the boxes at the cursor as, with its operands read. */
  notation(): Atom | undefined {
    const first = this.items[this.pos];
    const candidates = this.notated.byFirst.get(firstKey(first));
    if (candidates === undefined) return undefined;
    let best: { pattern: Pattern; binds: Map<number, Box> } | undefined;
    for (const pattern of candidates) {
      if (best !== undefined && !tied(best.pattern, pattern)) break;
      const binds = new Map<number, Box>();
      const fits =
        this.pos + pattern.items.length <= this.items.length &&
        pattern.items.every((p, k) => matches(p, this.items[this.pos + k]!, binds)) &&
        binds.size === pattern.arity;
      if (!fits || this.written(pattern)) continue;
      // Two heads that one notation writes alike are not told apart: read it by structure.
      if (best !== undefined) return undefined;
      best = { pattern, binds };
    }
    if (best === undefined) return undefined;
    this.pos += best.pattern.items.length;
    const operands = Array.from({ length: best.pattern.arity }, (_, i) => this.box(best.binds.get(i)!));
    return atom([best.pattern.head, ...operands] as Json);
  }

  /** `inner` read as `head` when the notation keeps that head in a `TagBox`, with a pattern that fits. */
  tagged(inner: Box, head: string): Atom | undefined {
    const items = isNodeOf(inner, "RowBox") ? rowItems(inner) : [inner];
    for (const pattern of this.notated.tagged.get(head) ?? []) {
      const binds = new Map<number, Box>();
      if (
        items.length === pattern.items.length &&
        pattern.items.every((p, k) => matches(p, items[k]!, binds)) &&
        binds.size === pattern.arity
      )
        return atom([head, ...Array.from({ length: pattern.arity }, (_, i) => this.box(binds.get(i)!))] as Json);
    }
    return undefined;
  }

  /** `[a, b]` tagged `Interval` is a closed interval, not the list it looks like. */
  closed(inner: Box, name: string): Atom {
    const read = this.atomOf(inner);
    const json = read.json;
    return name === "Interval" && Array.isArray(json) && json[0] === "List" && json.length === 3
      ? atom(["Interval", json[1], json[2]] as Json)
      : read;
  }

  /** Whether the caller's `heads` already say what the call a pattern starts with stands for. */
  written({ items }: Pattern): boolean {
    return typeof items[0] === "string" && this.options.heads?.[items[0]] !== undefined;
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
    const outer = this.closesInterval;
    this.closesInterval = open === "]" || (open === "[" && !this.items.slice(this.pos).includes("]"));
    let elements: Json[];
    try {
      elements = this.peek() !== undefined && CLOSERS[open]!.includes(this.peek() as string) ? [] : this.list();
    } finally {
      this.closesInterval = outer;
    }
    const end = this.peek();
    if (typeof end !== "string" || !CLOSERS[open]!.includes(end)) return decline(`an unclosed ${open}`, end);
    this.pos++;
    const only = elements[0];
    if (elements.length === 1 && Array.isArray(only) && only[0] === "Sequence") elements = only.slice(1) as Json[];
    const one = (head: string): Json =>
      elements.length === 1 ? ([head, elements[0]] as Json) : decline(`${head} of ${elements.length} operands`);
    // A bracket that faces away from its operand leaves that end out: `(a`, `a]` ... `]a`, `b[`.
    const interval = (): Json =>
      elements.length === 2
        ? ([
            "Interval",
            open === "(" || open === "]" ? ["Open", elements[0]] : elements[0],
            end === ")" || end === "[" ? ["Open", elements[1]] : elements[1],
          ] as Json)
        : decline("an interval of other than two ends");
    switch (open) {
      case "(":
        if (end === "]") return interval();
        return elements.length === 1 ? elements[0]! : (["Tuple", ...elements] as Json);
      case "[":
        return end === ")" || end === "[" ? interval() : (["List", ...elements] as Json);
      case "]":
        return interval();
      case "⟦":
        return elements.length === 2
          ? (["Range", ...elements] as Json)
          : decline("an integer range of other than two ends");
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
        const variables = this.leibniz(top, bottom);
        if (variables !== undefined) return atom(["D", this.multiply(), ...variables] as Json);
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
        return this.atomOf(args[1]!);
      // A tag that names a head kept there reads as that head, its operands from the boxes inside.
      case "TagBox":
        return (
          this.tagged(args[1]!, args[2] as unknown as string) ?? this.closed(args[1]!, args[2] as unknown as string)
        );
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
    if (sup === "∁") return atom(["Complement", this.box(base)] as Json);
    // `f^(n)`: the n-th derivative, not a power with its exponent in parentheses.
    const orders = this.fencedRow(sup) ? this.orders(rowItems(sup).slice(1, -1)) : undefined;
    const derivable = typeof base === "string" ? tokenClass(base) === "identifier" : isNodeOf(base, "RowBox");
    if (derivable && orders !== undefined && (orders.every((n) => typeof n === "number") || typeof base === "string"))
      return atom(["Derivative", this.box(base), ...orders] as Json);
    if (typeof base === "string" && FUNCTION_OF.has(base) && base !== "mod") {
      return atom(["Power", [this.callee(base), ...this.functionArguments()], this.box(sup)] as Json);
    }
    return atom(["Power", this.box(base), this.box(sup)] as Json);
  }

  /** The orders of `f^(n)`, `f^(0, 1)` or `f^(k)`: a count per argument, or a symbolic order. */
  orders(items: readonly Box[]): Json[] | undefined {
    if (items.length === 0) return undefined;
    const parts: Box[][] = [[]];
    for (const item of items) {
      if (item === ",") parts.push([]);
      else parts.at(-1)!.push(item);
    }
    if (parts.some((part) => part.length === 0)) return undefined;
    return parts.map((part) =>
      part.length === 1 && /^\d+$/.test(part[0] as string) ? Number(part[0]) : this.sub(part),
    );
  }

  subscript(base: Box, sub: Box): Atom {
    if (base === "log") return atom(["Log", ...this.functionArguments(), this.box(sub)] as Json);
    if (base === "∫") return atom(this.integral(sub, undefined));
    const name = subscriptedName(base, sub);
    if (name !== undefined) return { json: name, name };
    return atom(["Subscript", this.box(base), this.box(sub)] as Json);
  }

  /** The variables of a Leibniz fraction: `d/dx`, `d²/dx²` or `d²/dx dy`. */
  leibniz(top: Box, bottom: Box): Json[] | undefined {
    const order = top === "d" ? 1 : isNodeOf(top, "SuperscriptBox") && top[1] === "d" ? Number(top[2]) : NaN;
    if (!(order >= 1) || !isNodeOf(bottom, "RowBox")) return undefined;
    const items = rowItems(bottom);
    if (items[0] === "d" && items.length > 1) {
      const power = items[1];
      if (order > 1 && items.length === 2 && isNodeOf(power, "SuperscriptBox") && power[2] === String(order))
        return Array<Json>(order).fill(this.box(power[1] as Box));
      return order === 1 ? [this.sub(items.slice(1))] : undefined;
    }
    const each = items.map((item) =>
      isNodeOf(item, "RowBox") && rowItems(item)[0] === "d" ? this.sub(rowItems(item).slice(1)) : undefined,
    );
    return order > 1 && each.length === order && each.every((v) => v !== undefined) ? (each as Json[]) : undefined;
  }

  /** `i = 1, 3, …` under a big operator: the variable, first term and step. */
  steppedRange(under: Box | undefined): { variable: Json; lower: Json; step: Json } | undefined {
    if (!isNodeOf(under, "RowBox")) return undefined;
    const items = rowItems(under);
    if (items.at(-1) !== "…" || items.at(-2) !== ",") return undefined;
    const head = items.slice(0, -2);
    const equal = head.indexOf("=");
    const comma = head.indexOf(",");
    if (equal < 1 || comma < equal + 2) return undefined;
    const lower = this.sub(head.slice(equal + 1, comma));
    return {
      variable: this.sub(head.slice(0, equal)),
      lower,
      step: ["Subtract", this.sub(head.slice(comma + 1)), lower] as Json,
    };
  }

  /** `∑`/`∏` with their bounds, over the product that follows. */
  bigOperator(symbol: string, under: Box | undefined, over: Box | undefined): Json {
    const stepped = this.steppedRange(under);
    const written = under === undefined || stepped !== undefined ? undefined : this.box(under);
    const upper = over === undefined ? undefined : this.box(over);
    let variable: Json | undefined;
    let limits: Json | undefined = written;
    if (stepped !== undefined) {
      variable = stepped.variable;
      limits = ["Limits", variable, stepped.lower, upper ?? "Nothing", stepped.step] as Json;
    } else if (Array.isArray(written) && written[0] === "Equal" && written.length === 3) {
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
    const head = symbol === "∑" ? "Sum" : "Product";
    // An operator directly inside another is a further `Limits` of the one Sum, the outer first.
    return Array.isArray(bound_.body) && bound_.body[0] === head
      ? ([head, (bound_.body as readonly Json[])[1]!, fixed, ...(bound_.body as readonly Json[]).slice(2)] as Json)
      : ([head, bound_.body, fixed] as Json);
  }

  /** `∫ f dx` and its bounds; the differential is the first `d x` after the integrand. */
  integral(lower: Box | undefined, upper: Box | undefined): Json {
    let end = this.pos;
    let variable: Json | undefined;
    let next = this.pos;
    // An integral inside this one takes the first differential after its own integrand.
    let inner = 0;
    for (; end < this.items.length; end++) {
      const item = this.items[end]!;
      if (isIntegralSign(item)) {
        inner++;
        continue;
      }
      const differential =
        isNodeOf(item, "RowBox") && rowItems(item)[0] === "d" && rowItems(item).length > 1
          ? { variable: () => this.sub(rowItems(item).slice(1)), width: 1 }
          : item === "d" && end + 1 < this.items.length
            ? { variable: () => this.atomOf(this.items[end + 1]!).json, width: 2 }
            : undefined;
      if (differential === undefined) continue;
      if (inner-- > 0) {
        end += differential.width - 1;
        continue;
      }
      variable = differential.variable();
      next = end + differential.width;
      break;
    }
    if (variable === undefined) return decline("an integral with no differential");
    const integrand = end === this.pos ? 1 : this.sub(this.items.slice(this.pos, end));
    this.pos = next;
    const { variable: v, body } = bound(variable, integrand);
    const lo = lower === undefined ? undefined : this.box(lower);
    const hi = upper === undefined ? undefined : this.box(upper);
    const bounds: Json = lo === undefined ? v : (["Limits", v, lo, ...(hi === undefined ? [] : [hi])] as Json);
    // An integral directly inside another is a further `Limits` of the one Integrate, the outer first.
    return Array.isArray(body) && body[0] === "Integrate"
      ? (["Integrate", (body as readonly Json[])[1]!, bounds, ...(body as readonly Json[]).slice(2)] as Json)
      : (["Integrate", body, bounds] as Json);
  }

  /** `lim` under `x → a`, over the product that follows. */
  limit(under: Box): Json {
    const items = isNodeOf(under, "RowBox") ? rowItems(under) : [under];
    const arrow = items.indexOf("→");
    // `a⁺` and `a⁻` are the side the limit is taken from.
    const point = items.slice(arrow + 1);
    const last = point.at(-1);
    const side = isNodeOf(last, "SuperscriptBox") ? { "+": 1, "−": -1 }[last[2] as string] : undefined;
    const to = this.sub(side === undefined ? point : [...point.slice(0, -1), (last as BoxNode)[1] as Box]);
    const sides = side === undefined ? [] : [side];
    if (arrow < 0) return ["Limit", this.multiply(), to, ...sides] as Json;
    const { variable: v, body } = bound(this.sub(items.slice(0, arrow)), this.multiply());
    return ["Limit", ["Function", ["Block", body], v], to, ...sides] as Json;
  }
}

/** `∫`, bare or with bounds. */
const isIntegralSign = (item: Box): boolean =>
  item === "∫" || ((isNodeOf(item, "SubscriptBox") || isNodeOf(item, "SubsuperscriptBox")) && item[1] === "∫");

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
  return new Reader([box], options, notatedBy(options.notation)).whole();
}
