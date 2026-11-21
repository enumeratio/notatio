// Graphics primitives -- Wolfram's `Point`, `Line`, `Circle`, `Disk`, `Arrow`, `Text`,
// `Polygon`, `Rectangle` -- read off MathJSON into a shape a plot can draw in its own
// coordinates. This is what a `Epilog -> …` (or `Prolog -> …`) option carries: not a
// picture of its own, but marks on somebody else's.

import type { MathJsonExpression } from "@cortex-js/compute-engine/epsil";
import { directive, type GraphicsLook } from "./directives.ts";

type Json = MathJsonExpression;
export type Point = readonly [number, number];

/** A primitive's geometry, and the look the directives before it give it (none: the drawer's own). */
export type Primitive = (
  | { kind: "point"; points: Point[] }
  | { kind: "line"; points: Point[] }
  | { kind: "arrow"; points: Point[] }
  | { kind: "circle"; center: Point; r: number; filled: boolean }
  | { kind: "polygon"; points: Point[] }
  | { kind: "rectangle"; min: Point; max: Point }
  | { kind: "text"; text: string; at: Point }
) & { look?: GraphicsLook };

const headOf = (node: unknown): string | undefined => {
  const fn = Array.isArray(node) ? node : (node as { fn?: unknown[] })?.fn;
  return Array.isArray(fn) && typeof fn[0] === "string" ? fn[0] : undefined;
};

const opsOf = (node: unknown): Json[] => {
  const fn = Array.isArray(node) ? node : (node as { fn?: unknown[] })?.fn;
  return Array.isArray(fn) ? (fn.slice(1) as Json[]) : [];
};

/**
 * A coordinate, a radius or an angle as a number: a literal, or arithmetic over literals and `Pi`
 * (`Pi/2`, `Sqrt(2)`, `2 Pi/3`). A held `Graphics` is not evaluated, so its numbers are read here.
 */
const numOf = (node: unknown): number | undefined => {
  if (typeof node === "number") return node;
  if (node === "Pi") return Math.PI;
  if (node === "ExponentialE") return Math.E;
  const num = (node as { num?: unknown })?.num;
  if (typeof num === "string" || typeof num === "number") return Number(num);
  const head = headOf(node);
  if (head === undefined) return undefined;
  const args = opsOf(node).map(numOf);
  if (args.length === 0 || args.some((a) => a === undefined)) return undefined;
  const [a, b] = args as number[];
  switch (head) {
    case "Negate":
      return -a!;
    case "Add":
      return (args as number[]).reduce((x, y) => x + y, 0);
    case "Subtract":
      return b === undefined ? undefined : a! - b;
    case "Multiply":
      return (args as number[]).reduce((x, y) => x * y, 1);
    case "Divide":
    case "Rational":
      return b === undefined ? undefined : a! / b;
    case "Power":
      return b === undefined ? undefined : a! ** b;
    case "Sqrt":
      return Math.sqrt(a!);
    case "Sin":
      return Math.sin(a!);
    case "Cos":
      return Math.cos(a!);
    default:
      return undefined;
  }
};

const strOf = (node: unknown): string | undefined => {
  if (typeof node === "string" && node.length >= 2 && node.startsWith("'") && node.endsWith("'")) {
    return node.slice(1, -1);
  }
  const str = (node as { str?: unknown })?.str;
  return typeof str === "string" ? str : undefined;
};

const entriesOf = (node: Json): Json[] | undefined => {
  const head = headOf(node);
  if (head === "Tuple" || head === "List") return opsOf(node);
  if (head === "Delimiter") {
    const inner = opsOf(node)[0];
    return headOf(inner) === "Sequence" ? opsOf(inner) : inner === undefined ? [] : [inner];
  }
  return undefined;
};

/** `(x, y)` as a point, or undefined. */
export function pointOf(node: Json): Point | undefined {
  const parts = entriesOf(node);
  if (parts === undefined || parts.length !== 2) return undefined;
  const x = numOf(parts[0]);
  const y = numOf(parts[1]);
  return x === undefined || y === undefined ? undefined : [x, y];
}

/** One point, or a list of them, as a list. */
function pointsOf(node: Json): Point[] {
  const one = pointOf(node);
  if (one !== undefined) return [one];
  return (entriesOf(node) ?? []).map(pointOf).filter((p): p is Point => p !== undefined);
}

/** The paths in a `Line` or `Arrow` argument: one list of points, or a list of such lists. */
function pathsOf(node: Json): Point[][] {
  const entries = entriesOf(node) ?? [];
  const nested =
    entries.length > 0 && entries.every((e) => pointOf(e) === undefined && (entriesOf(e)?.length ?? 0) > 0);
  return nested ? entries.map(pointsOf) : [pointsOf(node)];
}

/** Samples along a curve drawn as a polyline. */
const CURVE_SAMPLES = 64;

/** An ellipse's arc from `from` to `to` (radians, counterclockwise), as points. */
function arcOf(center: Point, [rx, ry]: Point, from: number, to: number): Point[] {
  const n = Math.max(2, Math.ceil((CURVE_SAMPLES * Math.abs(to - from)) / (2 * Math.PI)));
  return Array.from({ length: n + 1 }, (_, k): Point => {
    const a = from + ((to - from) * k) / n;
    return [center[0] + rx * Math.cos(a), center[1] + ry * Math.sin(a)];
  });
}

/** A radius argument: one number, or `[rx, ry]`. */
function radiiOf(node: Json | undefined): Point | undefined {
  if (node === undefined) return [1, 1];
  const r = numOf(node);
  return r === undefined ? pointOf(node) : [r, r];
}

/** Composite Bézier curves of `degree` through control points, sampled (Wolfram's `BezierCurve`). */
function bezierOf(control: readonly Point[], degree = 3): Point[] {
  const out: Point[] = [];
  const steps = CURVE_SAMPLES / 2;
  // Each piece starts on the last point of the one before; a short last piece is of lower degree.
  for (let i = 0; i + 1 < control.length; i += degree) {
    const piece = control.slice(i, i + degree + 1);
    for (let k = i === 0 ? 0 : 1; k <= steps; k++) {
      // De Casteljau.
      let level: Point[] = [...piece];
      const t = k / steps;
      while (level.length > 1)
        level = level.slice(1).map((q, m): Point => {
          const from = level[m]!;
          return [from[0] + (q[0] - from[0]) * t, from[1] + (q[1] - from[1]) * t];
        });
      out.push(level[0]!);
    }
  }
  return out;
}

/** A clamped uniform cubic B-spline through control points, sampled (Wolfram's `BSplineCurve`). */
function bsplineOf(control: readonly Point[]): Point[] {
  const n = control.length;
  if (n < 2) return [...control];
  const degree = Math.min(3, n - 1);
  const knots = Array.from({ length: n + degree + 1 }, (_, i) => (i <= degree ? 0 : i >= n ? n - degree : i - degree));
  const span = n - degree;
  const at = (u: number): Point => {
    // De Boor.
    let k = Math.min(n - 1, Math.max(degree, Math.floor(u) + degree));
    if (u >= span) k = n - 1;
    const d = Array.from({ length: degree + 1 }, (_, j) => [...control[j + k - degree]!] as [number, number]);
    for (let r = 1; r <= degree; r++)
      for (let j = degree; j >= r; j--) {
        const lo = knots[j + k - degree]!;
        const hi = knots[j + 1 + k - r]!;
        const a = hi === lo ? 0 : (u - lo) / (hi - lo);
        d[j] = [d[j - 1]![0] + (d[j]![0] - d[j - 1]![0]) * a, d[j - 1]![1] + (d[j]![1] - d[j - 1]![1]) * a];
      }
    return d[degree]!;
  };
  const steps = CURVE_SAMPLES * Math.max(1, Math.ceil(span / 2));
  return Array.from({ length: steps + 1 }, (_, k) => at((span * k) / steps));
}

/** A primitive with every point moved by `f`; a circle becomes its outline, which `f` may not keep round. */
function moved(p: Primitive, f: (q: Point) => Point): Primitive {
  const look = p.look === undefined ? {} : { look: p.look };
  switch (p.kind) {
    case "point":
    case "line":
    case "arrow":
    case "polygon":
      return { ...p, points: p.points.map(f) };
    case "circle": {
      const ring = arcOf(p.center, [p.r, p.r], 0, 2 * Math.PI).map(f);
      return p.filled
        ? { kind: "polygon", points: ring.slice(0, -1), ...look }
        : { kind: "line", points: ring, ...look };
    }
    case "rectangle":
      return {
        kind: "polygon",
        points: [p.min, [p.max[0], p.min[1]] as Point, p.max, [p.min[0], p.max[1]] as Point].map(f),
        ...look,
      };
    default:
      return { ...p, at: f(p.at) };
  }
}

/** `GraphicsComplex(points, primitives)`: each index in a primitive's coordinates replaced by its point. */
function indexed(node: Json, points: readonly Json[]): Json {
  const head = headOf(node);
  if (head === "List" || head === "Tuple") return [head, ...opsOf(node).map((op) => indexed(op, points))] as Json;
  const n = numOf(node);
  if (n !== undefined && Number.isInteger(n) && points[n - 1] !== undefined) return points[n - 1]!;
  return node;
}
const COORDINATES: ReadonlySet<string> = new Set([
  "Point",
  "Line",
  "Arrow",
  "Polygon",
  "Triangle",
  "BezierCurve",
  "BSplineCurve",
]);
function resolved(node: Json, points: readonly Json[]): Json {
  const head = headOf(node);
  if (head === undefined) return node;
  const ops = opsOf(node);
  if (COORDINATES.has(head)) return [head, indexed(ops[0]!, points), ...ops.slice(1)] as Json;
  return [head, ...ops.map((op) => resolved(op, points))] as Json;
}

const styled = (look: GraphicsLook): { look?: GraphicsLook } => (Object.keys(look).length > 0 ? { look } : {});

/**
 * The primitives in an expression: one, or a list of them, nested lists flattened. A directive in a
 * list (`Red`, `Thick`, `Opacity(0.4)`) styles the primitives after it in that list and in the lists
 * inside it, and ends where its list does, as in Wolfram; `Style(primitive, directive…)` styles one.
 */
export function primitivesOf(node: Json, look: GraphicsLook = {}): Primitive[] {
  const head = headOf(node);
  const ops = opsOf(node);
  const one = (primitive: Primitive): Primitive[] => [{ ...primitive, ...styled(look) }];
  switch (head) {
    case "Point":
      return ops[0] === undefined ? [] : one({ kind: "point", points: pointsOf(ops[0]) });
    case "Line":
    case "Arrow":
      return ops[0] === undefined
        ? []
        : pathsOf(ops[0]).flatMap((points) => one({ kind: head === "Line" ? "line" : "arrow", points }));
    case "Polygon":
    case "Triangle":
      return ops[0] === undefined ? [] : one({ kind: "polygon", points: pointsOf(ops[0]) });
    case "BezierCurve":
      return ops[0] === undefined ? [] : one({ kind: "line", points: bezierOf(pointsOf(ops[0])) });
    case "BSplineCurve":
      return ops[0] === undefined ? [] : one({ kind: "line", points: bsplineOf(pointsOf(ops[0])) });
    case "Circle":
    case "Disk": {
      const center: Point = ops[0] === undefined ? [0, 0] : (pointOf(ops[0]) ?? [0, 0]);
      const radii = radiiOf(ops[1]) ?? [1, 1];
      const angles = ops[2] === undefined ? undefined : pointOf(ops[2]);
      const filled = head === "Disk";
      // A whole circle keeps its center and radius; an ellipse, an arc or a sector is its outline.
      if (angles === undefined && radii[0] === radii[1]) return one({ kind: "circle", center, r: radii[0], filled });
      const arc = arcOf(center, radii, angles?.[0] ?? 0, angles?.[1] ?? 2 * Math.PI);
      if (!filled) return one({ kind: "line", points: arc });
      return one({ kind: "polygon", points: angles === undefined ? arc.slice(0, -1) : [center, ...arc] });
    }
    case "Annulus": {
      // The outer ring, then the inner one the other way round: the hole is left unfilled.
      const center: Point = ops[0] === undefined ? [0, 0] : (pointOf(ops[0]) ?? [0, 0]);
      const [inner, outer] = (ops[1] === undefined ? undefined : pointOf(ops[1])) ?? [0.5, 1];
      const ring = (r: number): Point[] => arcOf(center, [r, r], 0, 2 * Math.PI);
      return one({ kind: "polygon", points: [...ring(outer), ...ring(inner).toReversed()] });
    }
    case "Rectangle": {
      const min: Point = ops[0] === undefined ? [0, 0] : (pointOf(ops[0]) ?? [0, 0]);
      const max: Point = ops[1] === undefined ? [min[0] + 1, min[1] + 1] : (pointOf(ops[1]) ?? [1, 1]);
      return one({ kind: "rectangle", min, max });
    }
    case "Text": {
      const text = strOf(ops[0]) ?? "";
      const at: Point = ops[1] === undefined ? [0, 0] : (pointOf(ops[1]) ?? [0, 0]);
      return one({ kind: "text", text, at });
    }
    case "Translate": {
      const by = ops[1] === undefined ? undefined : pointOf(ops[1]);
      const inner = ops[0] === undefined ? [] : primitivesOf(ops[0], look);
      return by === undefined ? inner : inner.map((p) => moved(p, (q) => [q[0] + by[0], q[1] + by[1]]));
    }
    case "Rotate": {
      const angle = ops[1] === undefined ? undefined : numOf(ops[1]);
      const about: Point = ops[2] === undefined ? [0, 0] : (pointOf(ops[2]) ?? [0, 0]);
      const inner = ops[0] === undefined ? [] : primitivesOf(ops[0], look);
      if (angle === undefined) return inner;
      const [c, sn] = [Math.cos(angle), Math.sin(angle)];
      return inner.map((p) =>
        moved(p, ([x, y]) => [
          about[0] + (x - about[0]) * c - (y - about[1]) * sn,
          about[1] + (x - about[0]) * sn + (y - about[1]) * c,
        ]),
      );
    }
    case "Scale": {
      const by = ops[1] === undefined ? undefined : radiiOf(ops[1]);
      const about: Point = ops[2] === undefined ? [0, 0] : (pointOf(ops[2]) ?? [0, 0]);
      const inner = ops[0] === undefined ? [] : primitivesOf(ops[0], look);
      return by === undefined
        ? inner
        : inner.map((p) =>
            moved(p, ([x, y]) => [about[0] + (x - about[0]) * by[0], about[1] + (y - about[1]) * by[1]]),
          );
    }
    case "GraphicsComplex": {
      const points = ops[0] === undefined ? [] : (entriesOf(ops[0]) ?? []);
      return ops[1] === undefined ? [] : primitivesOf(resolved(ops[1], points), look);
    }
    case "Style": {
      const own = ops.slice(1).reduce<GraphicsLook>((l, d) => directive(l, d) ?? l, look);
      return ops[0] === undefined ? [] : primitivesOf(ops[0], own);
    }
    case "List":
    case "Tuple": {
      const out: Primitive[] = [];
      let current = look;
      for (const op of ops) {
        const next = directive(current, op);
        if (next !== undefined) current = next;
        else out.push(...primitivesOf(op, current));
      }
      return out;
    }
    default:
      return [];
  }
}

const n2 = (x: number): string => String(Math.round(x * 100) / 100);
const esc = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * The primitives as SVG, through a plot's own data-to-pixel mapping. `stroke` is the
 * colour they take; a text is set small and centred on its point.
 */
export function primitivesSvg(
  primitives: readonly Primitive[],
  toPixel: (x: number, y: number) => [number, number],
  stroke = "currentColor",
): string {
  const px = (p: Point): string => toPixel(p[0], p[1]).map(n2).join(",");
  let out = "";
  for (const p of primitives) {
    switch (p.kind) {
      case "point":
        for (const q of p.points) {
          const [x, y] = toPixel(q[0], q[1]);
          out += `<circle cx="${n2(x)}" cy="${n2(y)}" r="3" fill="${stroke}"/>`;
        }
        break;
      case "line":
      case "arrow":
        if (p.points.length >= 2) {
          out += `<polyline points="${p.points.map(px).join(" ")}" fill="none" stroke="${stroke}" stroke-width="1.5"${p.kind === "arrow" ? ' marker-end="url(#notatio-arrow)"' : ""}/>`;
        }
        break;
      case "polygon":
        if (p.points.length >= 3) {
          out += `<polygon points="${p.points.map(px).join(" ")}" fill="${stroke}" fill-opacity="0.25" stroke="${stroke}" stroke-width="1"/>`;
        }
        break;
      case "circle": {
        const [cx, cy] = toPixel(p.center[0], p.center[1]);
        const [rx] = toPixel(p.center[0] + p.r, p.center[1]);
        const [, ry] = toPixel(p.center[0], p.center[1] + p.r);
        out += `<ellipse cx="${n2(cx)}" cy="${n2(cy)}" rx="${n2(Math.abs(rx - cx))}" ry="${n2(Math.abs(ry - cy))}" fill="${p.filled ? stroke : "none"}" fill-opacity="${p.filled ? 0.35 : 0}" stroke="${stroke}" stroke-width="1.5"/>`;
        break;
      }
      case "rectangle": {
        const [x0, y0] = toPixel(p.min[0], p.min[1]);
        const [x1, y1] = toPixel(p.max[0], p.max[1]);
        out += `<rect x="${n2(Math.min(x0, x1))}" y="${n2(Math.min(y0, y1))}" width="${n2(Math.abs(x1 - x0))}" height="${n2(Math.abs(y1 - y0))}" fill="${stroke}" fill-opacity="0.2" stroke="${stroke}" stroke-width="1"/>`;
        break;
      }
      case "text": {
        const [x, y] = toPixel(p.at[0], p.at[1]);
        out += `<text x="${n2(x)}" y="${n2(y)}" font-size="10" text-anchor="middle" dominant-baseline="middle" fill="${stroke}">${esc(p.text)}</text>`;
        break;
      }
    }
  }
  return out;
}
