// A predicate over the plane as one real function, positive inside (the wiki's Speculative-Plotting,
// §3.1). Every route samples that function with the ordinary real compile, so the region a shader
// fills and the boundary marching squares traces are the same function, and no route depends on how a
// compile target treats booleans. Pure MathJSON in, MathJSON out; engine-free.

// `unknown` already admits `undefined`, which `marginOf` and `levelOf` return for what they decline.
type Json = unknown;

const headOf = (json: Json): string | undefined =>
  Array.isArray(json) && typeof json[0] === "string" ? json[0] : undefined;
const argsOf = (json: Json): readonly Json[] => (Array.isArray(json) ? json.slice(1) : []);

/** `a < b` is `b - a`; the same for `<=`, since a boundary has no area. */
const ASCENDING: ReadonlySet<string> = new Set(["Less", "LessEqual"]);
const DESCENDING: ReadonlySet<string> = new Set(["Greater", "GreaterEqual"]);

const least = (parts: readonly Json[]): Json => (parts.length === 1 ? parts[0] : ["Min", ...parts]);
const greatest = (parts: readonly Json[]): Json => (parts.length === 1 ? parts[0] : ["Max", ...parts]);

/**
 * The margin of a predicate: a real expression that is positive exactly where the predicate holds.
 * A comparison is the gap between its sides (a chain `a < b < c` the least of its gaps), `And` the
 * least of its parts, `Or` the greatest, `Not` the negation. Undefined for anything else
 * (`Element(x, Integers)`, an equation, a quantifier): such a region is declined, not guessed.
 */
export function marginOf(json: Json): Json {
  const head = headOf(json);
  const args = argsOf(json);
  if (json === "True") return 1;
  if (json === "False") return -1;
  if (head === undefined) return undefined;
  if (ASCENDING.has(head) || DESCENDING.has(head)) {
    if (args.length < 2) return undefined;
    const gaps = args
      .slice(1)
      .map((right, k): Json => (ASCENDING.has(head) ? ["Subtract", right, args[k]] : ["Subtract", args[k], right]));
    return least(gaps);
  }
  if (head === "And" || head === "Or") {
    const parts = args.map(marginOf);
    if (parts.length === 0 || parts.some((p) => p === undefined)) return undefined;
    return head === "And" ? least(parts) : greatest(parts);
  }
  if (head === "Not" && args.length === 1) {
    const inner = marginOf(args[0]);
    return inner === undefined ? undefined : ["Negate", inner];
  }
  return undefined;
}

/** The function whose zero set an equation `a == b` is: `a - b`. Undefined for anything but an equation of two sides. */
export function levelOf(json: Json): Json {
  const args = argsOf(json);
  return headOf(json) === "Equal" && args.length === 2 ? ["Subtract", args[0], args[1]] : undefined;
}

const itemsOf = (json: Json): readonly Json[] => (headOf(json) === "List" ? argsOf(json) : [json]);

/** What a field plot samples: real functions of the plot's two variables, and how to read them. */
export interface FieldSources {
  /**
   * - `value`: one function, drawn by its values (`ContourPlot(f, …)`, `DensityPlot`).
   * - `curves`: a function per equation, each drawn where it is zero (`ContourPlot(f == g, …)`).
   * - `regions`: a margin per predicate, each filled where it is positive (`RegionPlot`).
   */
  readonly kind: "value" | "curves" | "regions";
  readonly sources: readonly Json[];
}

/**
 * The functions `head`'s first argument asks to be sampled. A `RegionPlot` takes a predicate or a
 * list of them; a `ContourPlot` of an equation (or a list of equations) is its implicit curves.
 * Undefined when a predicate has no margin.
 */
export function fieldSourcesOf(head: string, body: Json): FieldSources | undefined {
  if (head === "RegionPlot") {
    const margins = itemsOf(body).map(marginOf);
    return margins.length === 0 || margins.some((m) => m === undefined)
      ? undefined
      : { kind: "regions", sources: margins };
  }
  if (head === "ContourPlot") {
    const levels = itemsOf(body).map(levelOf);
    if (levels.length > 0 && levels.every((l) => l !== undefined)) return { kind: "curves", sources: levels };
  }
  return { kind: "value", sources: [body] };
}

/**
 * A `RegionFunction`'s margin and the names it is written over. Its value is a predicate over the
 * plot's own variables, or Wolfram's pure function (`Function(body, x, y)` here), whose parameters
 * stand for the plot's variables in order. Undefined when the predicate has no margin.
 */
export function regionFunctionOf(value: Json): { margin: Json; params: readonly string[] } | undefined {
  const isFunction = headOf(value) === "Function";
  const [body, ...params] = isFunction ? argsOf(value) : [value];
  const margin = marginOf(body);
  if (margin === undefined || !params.every((p) => typeof p === "string")) return undefined;
  return { margin, params: params as string[] };
}
