// A region plot as a `GraphicsBox` (the wiki's Speculative-Plotting, §3.3): each region's margin
// sampled on a grid in, one `RasterBox` of the fills (mixed where regions overlap) and a `LineBox` per
// boundary out. Shares contour.ts's `grid[j][i]` convention. This is the drawing every environment
// has; a page with a shader draws the same margins per pixel.

import { type Box, type BoxNode, graphics, line, raster, style, tag } from "@enumeratio/boxes";
import { fieldFrame, marchingSquares } from "./contour.ts";
import { type ColorMixing, mixColors } from "./graphics-rules.ts";
import { renderPlot } from "./plot-box.ts";
import { categoryColors, type ColorOptions, plotPalette } from "./plot-color.ts";

type Grid = readonly (readonly number[])[];

/** A region's fill: a color and how opaque it is. */
export interface RegionFill {
  readonly color: string;
  readonly opacity: number;
}

export interface RegionOptions extends ColorOptions {
  width?: number;
  height?: number;
  /** Draw the axis frame with range labels (default true). */
  axes?: boolean;
  /** `PlotStyle`: a fill per region, in order; a region past the list takes its category color. */
  fills?: readonly (RegionFill | undefined)[];
  /** `BoundaryStyle`: one color for every boundary, or `null` for none; each region's own color otherwise. */
  boundary?: string | null;
  /** How overlapping fills combine (`ColorMixing`; `"First"`, Wolfram's `Automatic`, paints each over the last). */
  mixing?: ColorMixing;
  xLabel?: string;
  yLabel?: string;
  title?: string;
}

/** A fill's opacity when `PlotStyle` gives none: translucent, so an overlap and the grid lines read through it. */
export const REGION_OPACITY = 0.35;
/** A boundary's width, in px. */
export const BOUNDARY_WIDTH = 1.5;

/** How each of `count` regions is painted: its fill, and its boundary's color (`null`: none drawn). */
export function regionPaints(
  count: number,
  opts: RegionOptions = {},
): { fills: RegionFill[]; edges: (string | null)[] } {
  const colors = categoryColors(plotPalette(opts), count);
  const fills = colors.map((color, k): RegionFill => opts.fills?.[k] ?? { color, opacity: REGION_OPACITY });
  return { fills, edges: fills.map((fill) => (opts.boundary === null ? null : (opts.boundary ?? fill.color))) };
}

/** Subsamples per side a boundary cell's coverage is counted on. */
const COVERAGE_SIDE = 4;

/**
 * The share of a cell where the margin is positive, from its four corner samples: 1 or 0 when they
 * agree, else counted on a `COVERAGE_SIDE`² lattice of the bilinear interpolant, so a boundary cell is
 * shaded by how much of it the region holds. A cell with a non-finite corner holds none.
 */
export function coverage(tl: number, tr: number, br: number, bl: number): number {
  if (![tl, tr, br, bl].every(Number.isFinite)) return 0;
  const inside = [tl, tr, br, bl].filter((v) => v > 0).length;
  if (inside === 4) return 1;
  if (inside === 0) return 0;
  let hits = 0;
  for (let j = 0; j < COVERAGE_SIDE; j++) {
    const v = (j + 0.5) / COVERAGE_SIDE;
    for (let i = 0; i < COVERAGE_SIDE; i++) {
      const u = (i + 0.5) / COVERAGE_SIDE;
      const top = tl + (tr - tl) * u;
      const bottom = bl + (br - bl) * u;
      if (top + (bottom - top) * v > 0) hits++;
    }
  }
  return hits / COVERAGE_SIDE ** 2;
}

/** `grid` with every sample outside the region (`inside <= 0`, or not finite) made `NaN`, which no field plot draws. */
export function maskGrid(grid: Grid, inside: Grid): number[][] {
  return grid.map((row, j) => row.map((v, i) => ((inside[j]?.[i] ?? Number.NaN) > 0 ? v : Number.NaN)));
}

/**
 * Margins (each sampled at `xs` × `ys`) as a region plot's `GraphicsBox`: one `RasterBox` whose cells
 * are the regions' fills mixed, each at its opacity times the cell's coverage, and a `LineBox` per
 * region along its boundary, the zero contour of its margin. A pure function of its inputs.
 */
export function regionPlotBox(
  margins: readonly Grid[],
  xs: readonly number[],
  ys: readonly number[],
  opts: RegionOptions = {},
): Box {
  const first = margins[0] ?? [];
  const ny = first.length;
  const nx = ny > 0 ? first[0]!.length : 0;
  const ready =
    nx >= 2 &&
    ny >= 2 &&
    xs.length >= nx &&
    ys.length >= ny &&
    margins.every((g) => g.length === ny && g.every((r) => r.length === nx));
  const options = fieldFrame(first, xs, ys, opts, ready);
  if (!ready) return graphics([], options);

  const { fills, edges } = regionPaints(margins.length, opts);
  const mixing = opts.mixing === undefined || opts.mixing === "First" ? "Normal" : opts.mixing;
  // Rows run from the least y up, columns from the least x: a descending axis is turned round.
  let cells = Array.from({ length: ny - 1 }, (_, j) =>
    Array.from({ length: nx - 1 }, (_, i) => {
      const layers = margins.flatMap((g, k): [string, number][] => {
        const share = coverage(g[j]![i]!, g[j]![i + 1]!, g[j + 1]![i + 1]!, g[j + 1]![i]!);
        return share > 0 ? [[fills[k]!.color, fills[k]!.opacity * share]] : [];
      });
      return mixColors(layers, mixing) ?? "";
    }),
  );
  if (ys[ny - 1]! < ys[0]!) cells = cells.toReversed();
  if (xs[nx - 1]! < xs[0]!) cells = cells.map((r) => r.toReversed());
  const [xlo, xhi] = [Math.min(...xs.slice(0, nx)), Math.max(...xs.slice(0, nx))];
  const [ylo, yhi] = [Math.min(...ys.slice(0, ny)), Math.max(...ys.slice(0, ny))];
  const marks: Box[] = [
    tag(
      raster({
        Colors: cells,
        DataRange: [
          [xlo, xhi],
          [ylo, yhi],
        ],
      }),
      "Region",
    ),
  ];
  margins.forEach((g, k) => {
    const edge = edges[k];
    if (edge === null || edge === undefined) return;
    const segments = marchingSquares(g, xs.slice(0, nx), ys.slice(0, ny), 0);
    if (segments.length === 0) return;
    marks.push(
      style(
        tag(
          line({
            Points: segments.flatMap(([a, b]) => [
              [a.x, a.y],
              [b.x, b.y],
            ]),
            Breaks: segments.map((_, s) => 2 * s).filter((s) => s > 0),
          }),
          "Boundary",
        ),
        { EdgeForm: [[edge, BOUNDARY_WIDTH, 1, []]] },
      ),
    );
  });
  return graphics(marks, options);
}

/** `regionPlotBox` drawn: the SVG a page, a build or an export shows. */
export function regionSvg(
  margins: readonly Grid[],
  xs: readonly number[],
  ys: readonly number[],
  opts: RegionOptions = {},
): string {
  return renderPlot(regionPlotBox(margins, xs, ys, opts) as BoxNode).svg;
}
