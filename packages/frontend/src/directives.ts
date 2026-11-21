// Graphics directives, read from MathJSON: what Wolfram's `Red`, `Opacity(0.4)`, `Thick`,
// `Dashed`, `PointSize(0.02)`, `EdgeForm(…)` say about how the primitives after them are drawn.
// A directive changes a `GraphicsLook`; a primitive is drawn with the look in force where it stands
// (`primitivesOf` walks a list and carries it). `PlotStyle` reads a curve's look the same way.

import { argsOf, headOf, type Json } from "./frame-json.ts";
import { paintOf } from "./graphics-rules.ts";

/** A length: CSS pixels (`AbsoluteThickness`), or a fraction of the plot's width (`Thickness`). */
export type Size = { readonly px: number } | { readonly scaled: number };

/**
 * How a primitive is drawn. A member left out is the drawer's own default, so an empty look
 * changes nothing.
 */
export interface GraphicsLook {
  /** The color in force: lines, points and text take it, and faces unless `face` says otherwise. */
  readonly color?: string;
  readonly opacity?: number;
  readonly thickness?: Size;
  /** Dash and gap lengths; empty is solid. */
  readonly dashing?: readonly Size[];
  readonly pointSize?: Size;
  /** An arrowhead's length, as a fraction of the plot's width (Wolfram's `Arrowheads`). */
  readonly arrowheads?: number;
  /** `EdgeForm`: the outline of a filled primitive; `null` draws none. */
  readonly edge?: GraphicsLook | null;
  /** `FaceForm`: the inside of a filled primitive; `null` fills none. */
  readonly face?: GraphicsLook | null;
  readonly fontSize?: number;
}

/** The plot width a fraction is taken of: the plot area of a figure at its natural size. */
export const NOMINAL_WIDTH = 300;

/** A size in CSS pixels. */
export const pixels = (size: Size): number => ("px" in size ? size.px : size.scaled * NOMINAL_WIDTH);

const numberOf = (json: Json): number | undefined => {
  if (typeof json === "number") return json;
  if (headOf(json) === "Negate") {
    const inner = numberOf(argsOf(json)[0]);
    return inner === undefined ? undefined : -inner;
  }
  if (headOf(json) === "Rational") {
    const [p, q] = argsOf(json).map(numberOf);
    return p !== undefined && q ? p / q : undefined;
  }
  const num = (json as { num?: unknown } | null)?.num;
  return typeof num === "string" || typeof num === "number" ? Number(num) : undefined;
};
const symbolOf = (json: Json): string | undefined => (typeof json === "string" ? json : undefined);

/** Wolfram's size words, in CSS pixels: a line's width and a point's diameter. Ours: Wolfram's are printer's points. */
const THICKNESS: Readonly<Record<string, number>> = { Tiny: 0.5, Small: 1, Medium: 1.5, Large: 2.5 };
const POINT_SIZE: Readonly<Record<string, number>> = { Tiny: 2, Small: 4, Medium: 6, Large: 9 };
const THICKNESS_WORDS: Readonly<Record<string, number>> = { Thin: 1, Thick: 2.5 };
const DASH_WORDS: Readonly<Record<string, readonly number[]>> = {
  Dashed: [6, 4],
  Dotted: [1.5, 3],
  DotDashed: [1.5, 3, 6, 3],
};

/** A size from a head's one argument: a number in `unit`, or one of Wolfram's size words. */
function sizeOf(json: Json, unit: "px" | "scaled", words: Readonly<Record<string, number>>): Size | undefined {
  const word = symbolOf(json);
  if (word !== undefined && word in words) return { px: words[word]! };
  const n = numberOf(json);
  if (n === undefined || !(n >= 0)) return undefined;
  return unit === "px" ? { px: n } : { scaled: n };
}

/** Dashes from `Dashing(r)`, `Dashing([r1, r2, …])` and their `Absolute` forms. */
function dashesOf(json: Json, unit: "px" | "scaled"): readonly Size[] | undefined {
  const parts = headOf(json) === "List" ? argsOf(json) : [json];
  const sizes = parts.map((part) => sizeOf(part, unit, {}));
  return sizes.every((s): s is Size => s !== undefined) ? sizes : undefined;
}

/** The look `EdgeForm(…)` or `FaceForm(…)` holds: `null` for none (no argument, or `None`). */
function formOf(json: Json): GraphicsLook | null | undefined {
  const args = argsOf(json);
  if (args.length === 0 || args[0] === "None") return null;
  return args.reduce<GraphicsLook | undefined>(
    (look, arg) => (look === undefined ? undefined : directive(look, arg)),
    {},
  );
}

/**
 * `look` after the directive `json`, or undefined when `json` is not a directive (a primitive, or
 * something unread): the caller tells the two apart by this.
 */
export function directive(look: GraphicsLook, json: Json): GraphicsLook | undefined {
  const head = headOf(json);
  const args = argsOf(json);
  const word = symbolOf(json);
  if (word !== undefined && word in THICKNESS_WORDS) return { ...look, thickness: { px: THICKNESS_WORDS[word]! } };
  if (word !== undefined && word in DASH_WORDS)
    return { ...look, dashing: DASH_WORDS[word]!.map((px): Size => ({ px })) };
  switch (head) {
    case "Directive":
      return args.reduce<GraphicsLook | undefined>((l, arg) => (l === undefined ? undefined : directive(l, arg)), look);
    case "Opacity": {
      // `Opacity(a)` is the opacity from here on; `Opacity(a, color)` a color with its own.
      if (args.length !== 1) break;
      const a = numberOf(args[0]);
      return a === undefined ? undefined : { ...look, opacity: a };
    }
    case "Thickness":
    case "AbsoluteThickness": {
      const thickness = sizeOf(args[0], head === "Thickness" ? "scaled" : "px", THICKNESS);
      return thickness && { ...look, thickness };
    }
    case "PointSize":
    case "AbsolutePointSize": {
      const pointSize = sizeOf(args[0], head === "PointSize" ? "scaled" : "px", POINT_SIZE);
      return pointSize && { ...look, pointSize };
    }
    case "Dashing":
    case "AbsoluteDashing": {
      const dashing = dashesOf(args[0], head === "Dashing" ? "scaled" : "px");
      return dashing && { ...look, dashing };
    }
    case "Arrowheads": {
      const arrowheads = numberOf(args[0]);
      return arrowheads === undefined ? undefined : { ...look, arrowheads };
    }
    case "FontSize": {
      const fontSize = numberOf(args[0]);
      return fontSize === undefined ? undefined : { ...look, fontSize };
    }
    case "EdgeForm":
    case "FaceForm": {
      const form = formOf(json);
      return form === undefined ? undefined : { ...look, [head === "EdgeForm" ? "edge" : "face"]: form };
    }
    default:
  }
  // A color, with the opacity it carries (`Opacity(0.4, Blue)`, `RGBColor(r, g, b, a)`).
  const painted = paintOf(json);
  if (!painted || typeof painted.paint !== "string") return undefined;
  return { ...look, color: painted.paint, ...(painted.opacity !== 1 && { opacity: painted.opacity }) };
}

/** The look a style value gives on its own: one directive, a `Directive(…)`, or a list read in order. */
export function lookOf(json: Json, base: GraphicsLook = {}): GraphicsLook | undefined {
  if (headOf(json) !== "List") return directive(base, json);
  return argsOf(json).reduce<GraphicsLook | undefined>(
    (l, arg) => (l === undefined ? undefined : directive(l, arg)),
    base,
  );
}
