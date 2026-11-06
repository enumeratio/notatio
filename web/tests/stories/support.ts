// Helpers the site specs share: reading what a reader sees (an output's text form, a curve's
// shape, a canvas grid's cells) without reaching into an element's internals more than once.

import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/** An output's retypeable text, the `input-form` its element carries once evaluated. */
export function outForm(out: Locator): Promise<string | null> {
  return out.getAttribute("input-form");
}

/** Waits for a `notatio-out` to settle and returns its text form. */
export async function settled(out: Locator): Promise<string> {
  await expect(out).toHaveAttribute("input-form", /./);
  return (await outForm(out))!;
}

/** A knob or slider element (`role=slider`) moved to `target` with the arrow keys. */
export async function keyKnob(knob: Locator, target: number, step = 1): Promise<void> {
  await knob.focus();
  const value = async () => Number(await knob.getAttribute("aria-valuenow"));
  const key = target > (await value()) ? "ArrowRight" : "ArrowLeft";
  for (let guard = 0; guard < 200 && (await value()) !== target; guard++) {
    await knob.press(key);
    // A key press lands one step; wait for the attribute to follow before pressing again.
    await expect.poll(value).not.toBeNaN();
  }
  expect(Math.abs((await value()) - target)).toBeLessThan(step / 2);
}

/** A plotted curve read back in data units. The path sits in the plot's clip group; x runs
 *  linearly between the first two axis labels, y between the last two (top, then bottom). */
export interface Curve {
  xs: number[];
  ys: number[];
  xRange: [number, number];
  yRange: [number, number];
}

export async function curveOf(svg: Locator): Promise<Curve> {
  // The plot draws after its element upgrades; wait for a path with real points.
  let raw: { d: string; labels: string[]; x: number; y: number; w: number; h: number } | undefined;
  await expect(async () => {
    raw = await svg.evaluate((node) => {
      const path = node.querySelector("g[clip-path] path");
      const clip = node.querySelector("clipPath rect");
      const num = (name: string) => Number(clip?.getAttribute(name));
      return {
        d: path?.getAttribute("d") ?? "",
        labels: [...node.querySelectorAll("text")].map((t) => t.textContent ?? ""),
        x: num("x"),
        y: num("y"),
        w: num("width"),
        h: num("height"),
      };
    });
    expect([...raw.d.matchAll(/[ML]/g)].length).toBeGreaterThan(10);
  }).toPass();
  const { d, labels, x, y, w, h } = raw!;
  const [xmin, xmax, ymax, ymin] = labels.slice(0, 4).map(Number);
  const pts = [...d.matchAll(/[ML]\s*(-?[\d.]+)[ ,](-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  // The domain ends sit 3 px inside the clip box (the plot's inset); the frame is the clip box's height.
  const x0 = x + 3;
  const x1 = x + w - 3;
  return {
    xs: pts.map(([px]) => xmin + ((px - x0) / (x1 - x0)) * (xmax - xmin)),
    ys: pts.map(([, py]) => ymax - ((py - y) / h) * (ymax - ymin)),
    xRange: [xmin, xmax],
    yRange: [ymin, ymax],
  };
}

/** Maxima of sin(a x) strictly inside (lo, hi): where a x = pi/2 + 2 pi k. */
export function sineMaxima(a: number, lo: number, hi: number): number {
  let count = 0;
  for (let k = -50; k <= 50; k++) {
    const x = (Math.PI / 2 + 2 * Math.PI * k) / a;
    if (x > lo && x < hi) count++;
  }
  return count;
}

/** How many local maxima a curve has, ignoring wiggles under `prominence` of its range. */
export function peaks(ys: number[], prominence = 0.05): number {
  const span = Math.max(...ys) - Math.min(...ys);
  let count = 0;
  let rising = false;
  let low = ys[0];
  let high = ys[0];
  for (const y of ys) {
    if (rising) {
      if (y > high) high = y;
      else if (high - y > span * prominence) {
        count++;
        rising = false;
        low = y;
      }
    } else if (y < low) low = y;
    else if (y - low > span * prominence) {
      rising = true;
      high = y;
    }
  }
  return count;
}

/** The painted cells of a canvas table (an `ArrayPlot`): where its colored pixels start and how
 *  big a cell is, so a test can hover a cell by row and column and count same-colored blobs. */
export interface CellGrid {
  canvas: Locator;
  /** CSS pixels from the canvas's top-left to the first colored cell. */
  x0: number;
  y0: number;
  pitch: number;
}

/** Waits until the table's tiles are painted, then measures them; `painted` is how many cells
 *  per side are colored (an uncolored zero row and column are not). */
export async function cellGrid(page: Page, painted: number): Promise<CellGrid> {
  const tiles = page.locator("canvas.graphics-box-tiles").first();
  await expect(async () => {
    const colors = await tiles.evaluate((c: HTMLCanvasElement) => {
      const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
      const seen = new Set<number>();
      for (let i = 0; i < d.length; i += 28) if (d[i + 3] > 0) seen.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
      return seen.size;
    });
    expect(colors).toBeGreaterThan(2);
  }).toPass();
  const box = await tiles.evaluate((c: HTMLCanvasElement) => {
    const w = c.width;
    const d = c.getContext("2d")!.getImageData(0, 0, w, c.height).data;
    let x0 = w;
    let x1 = 0;
    let y0 = c.height;
    let y1 = 0;
    for (let y = 0; y < c.height; y++)
      for (let x = 0; x < w; x++)
        if (d[(y * w + x) * 4 + 3] > 0) {
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
          y0 = Math.min(y0, y);
          y1 = Math.max(y1, y);
        }
    return { x0, x1, y0, y1, scale: c.getBoundingClientRect().width / w };
  });
  const pitch = ((box.x1 - box.x0 + 1) * box.scale) / painted;
  return { canvas: tiles, x0: box.x0 * box.scale, y0: box.y0 * box.scale, pitch };
}

/** Hover the cell in `row`, `col` (counted from the first painted cell, so 0 is the first colored one). */
export async function hoverCell(page: Page, grid: CellGrid, row: number, col: number): Promise<void> {
  const box = (await grid.canvas.boundingBox())!;
  await page.mouse.move(box.x + grid.x0 + (col + 0.5) * grid.pitch, box.y + grid.y0 + (row + 0.5) * grid.pitch);
}

/**
 * Cells of `canvas` whose color is within `slack` of `rgb`, as the count of separate blobs (4-connected).
 * Only pixels that are visibly painted count: a seam pixel at alpha 1 reads back as white and shows nothing.
 */
export function countBlobs(canvas: Locator, rgb: [number, number, number], slack = 12): Promise<number> {
  return canvas.evaluate(
    (c: HTMLCanvasElement, [target, tol]: [[number, number, number], number]) => {
      const { width: w, height: h } = c;
      const d = c.getContext("2d")!.getImageData(0, 0, w, h).data;
      const on = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++)
        on[i] =
          d[i * 4 + 3] >= 128 &&
          Math.abs(d[i * 4] - target[0]) <= tol &&
          Math.abs(d[i * 4 + 1] - target[1]) <= tol &&
          Math.abs(d[i * 4 + 2] - target[2]) <= tol
            ? 1
            : 0;
      let blobs = 0;
      const stack: number[] = [];
      for (let i = 0; i < w * h; i++) {
        if (!on[i]) continue;
        blobs++;
        stack.push(i);
        on[i] = 0;
        while (stack.length) {
          const j = stack.pop()!;
          const x = j % w;
          for (const n of [x > 0 ? j - 1 : -1, x < w - 1 ? j + 1 : -1, j - w, j + w])
            if (n >= 0 && n < w * h && on[n]) {
              on[n] = 0;
              stack.push(n);
            }
        }
      }
      return blobs;
    },
    [rgb, slack] as [[number, number, number], number],
  );
}
