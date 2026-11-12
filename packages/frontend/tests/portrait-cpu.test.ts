import { expect, test } from "vite-plus/test";
import { complexFunction, Uncertain } from "../src/complex-eval.ts";
import { portraitShader } from "../src/complex-plot.ts";
import { gradientNamed, reverseGradient, sampleGradient, hexToRgb } from "../src/palettes.ts";
import {
  glslFloat,
  hatchColor,
  maskColor,
  PORTRAIT,
  polarColor,
  POLE_COLOR,
  ZERO_COLOR,
} from "../src/portrait-color.ts";
import {
  gradientRamp,
  portraitPixel,
  renderPortrait,
  type PortraitHooks,
  type PortraitSettings,
} from "../src/portrait-cpu.ts";

const phase = gradientRamp(gradientNamed("phase"));
const settings = (over: Partial<PortraitSettings> = {}): PortraitSettings => ({
  f: complexFunction(["Sin", "z"])!,
  view: { center: [0, 0], extent: 2.4, mask: 0 },
  width: 20,
  height: 12,
  ramp: phase,
  ...over,
});

test("the shader is written from the same constants the CPU applies", () => {
  const src = portraitShader("vec2(0.0)");
  for (const [name, text] of [
    ["turn", `argOf(polar.xy) * ${glslFloat(PORTRAIT.turn)}`],
    ["bandsPerNeper", `logMag * ${glslFloat(PORTRAIT.bandsPerNeper)}`],
    ["baseGain", `mix(base * ${glslFloat(PORTRAIT.baseGain)}, 1.0, ${glslFloat(PORTRAIT.bandLift)} * bands)`],
    ["saturation", `mix(1.0, ${glslFloat(PORTRAIT.satFloor)}, ${glslFloat(PORTRAIT.satDrop)} * bands)`],
    ["gamma", `vec3(${glslFloat(PORTRAIT.gamma)})`],
    ["mask", `${glslFloat(PORTRAIT.maskGround)} + ${glslFloat(PORTRAIT.maskCheck)}`],
    [
      "hatch",
      `${glslFloat(PORTRAIT.hatchGround)} + ${glslFloat(PORTRAIT.hatchStripe)} * step(0.5, fract((frag.x + frag.y) / ${glslFloat(PORTRAIT.hatchPeriod)}))`,
    ],
  ] as const)
    expect(src, name).toContain(text);
});

test("the CPU ramp is the gradient the shader blends, to the byte", () => {
  for (const name of ["phase", "viridis", "turbo", "sinebow"]) {
    const g = gradientNamed(name);
    const ramp = gradientRamp(g);
    for (let k = 0; k <= 20; k++) {
      const [r, gr, b] = ramp(k / 20);
      const [hr, hg, hb] = hexToRgb(sampleGradient(g, k / 20));
      // sampleGradient is a 256-entry table of bytes.
      for (const [a, e] of [
        [r, hr],
        [gr, hg],
        [b, hb],
      ] as const)
        expect(Math.abs(a - e), `${name} ${k}`).toBeLessThan(0.012);
    }
  }
});

test("poles are white, zeros black, and the argument picks the hue", () => {
  expect(polarColor(0, Number.POSITIVE_INFINITY, phase)).toEqual(POLE_COLOR);
  expect(polarColor(0, Number.NEGATIVE_INFINITY, phase)).toEqual(ZERO_COLOR);
  const [r, g, b] = polarColor(0, 0, phase);
  expect(r).toBeGreaterThan(g);
  expect(r).toBeGreaterThan(b);
  // Half a turn round is the opposite hue: cyan, where red was.
  const [r2, g2, b2] = polarColor(Math.PI, 0, phase);
  expect(r2).toBeLessThan(Math.min(g2, b2));
});

test("reverse turns the gradient round", () => {
  const back = gradientRamp(reverseGradient(gradientNamed("viridis")));
  const fwd = gradientRamp(gradientNamed("viridis"));
  for (const t of [0, 0.3, 0.8]) {
    const [a, b] = [back(t), fwd(1 - t)];
    a.forEach((v, i) => expect(v).toBeCloseTo(b[i]!, 6));
  }
});

test("brightness grows with the magnitude", () => {
  const lum = (m: number) => polarColor(1, m, (() => [1, 1, 1]) as never)[0];
  expect(lum(-4)).toBeLessThan(lum(-1));
  expect(lum(-1)).toBeLessThan(lum(3));
});

test("a pixel is the evaluator's value at its center, colored by the mapping", () => {
  const s = settings();
  const f = s.f;
  for (const [x, y] of [
    [0, 0],
    [5, 3],
    [19, 11],
    [10, 6],
  ] as const) {
    const re = ((x + 0.5) / 20 - 0.5) * 2.4 * (20 / 12);
    const im = ((12 - y - 0.5) / 12 - 0.5) * 2.4;
    const w = f([re, im]);
    expect(portraitPixel(s, x, y)).toEqual(polarColor(Math.atan2(w[1], w[0]), Math.log(Math.hypot(w[0], w[1])), phase));
  }
});

test("a point the evaluator declines is hatched, never colored", () => {
  const declines = settings({
    f: ([re]) => {
      if (re > 0) throw new Uncertain();
      return [Number.NaN, 0];
    },
  });
  // Left of the axis NaN, right of it Uncertain: both are the hatch, at the pixel's own phase.
  expect(portraitPixel(declines, 2, 4)).toEqual(hatchColor(2.5, 12 - 4 - 0.5));
  expect(portraitPixel(declines, 17, 4)).toEqual(hatchColor(17.5, 12 - 4 - 0.5));
  // An infinity is a pole, not a decline.
  expect(portraitPixel(settings({ f: () => [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY] }), 3, 3)).toEqual(
    POLE_COLOR,
  );
});

test("the hatch alternates along the diagonals", () => {
  const seen = new Set<number>();
  for (let x = 0; x < 16; x++) seen.add(hatchColor(x + 0.5, 0.5)[0]);
  expect([...seen].toSorted((a, b) => a - b)).toEqual([
    PORTRAIT.hatchGround,
    PORTRAIT.hatchGround + PORTRAIT.hatchStripe,
  ]);
});

test("mask dims outside its radius and leaves the inside to the value", () => {
  const s = settings({ view: { center: [0, 0], extent: 2.4, mask: 1 } });
  const inside = portraitPixel(s, 10, 6); // near the origin
  const outside = portraitPixel(s, 0, 0); // |z| > 1 at the corner
  expect(outside[0]).toBeLessThan(0.1);
  expect(outside).toEqual(maskColor((0.5 / 20 - 0.5) * 2.4 * (20 / 12), ((12 - 0.5) / 12 - 0.5) * 2.4));
  expect(inside).not.toEqual(maskColor(0, 0));
});

const hooks = (over: Partial<PortraitHooks> = {}): PortraitHooks => ({
  paint: () => {},
  yieldToEventLoop: () => Promise.resolve(),
  cancelled: () => false,
  now: () => 0,
  ...over,
});

test("the progressive render ends with every pixel the one-pass render gives", async () => {
  const s = settings({ width: 37, height: 29 });
  const rgba = new Uint8ClampedArray(37 * 29 * 4);
  const done = await renderPortrait(s, rgba, hooks());
  expect(done).toEqual({ step: 1, complete: true });
  for (const [x, y] of [
    [0, 0],
    [36, 28],
    [8, 8],
    [9, 17],
    [20, 3],
  ] as const) {
    const o = (y * 37 + x) * 4;
    const want = portraitPixel(s, x, y).map((v) => Math.round(v * 255));
    expect([...rgba.subarray(o, o + 4)]).toEqual([...want, 255]);
  }
});

test("a coarse frame covers the canvas before any refinement", async () => {
  const s = settings({ width: 40, height: 24 });
  const rgba = new Uint8ClampedArray(40 * 24 * 4);
  let first: Uint8ClampedArray | undefined;
  await renderPortrait(s, rgba, hooks({ paint: (d) => (first ??= d.slice()) }));
  // The first paint is the 8-pixel pass: every alpha is set.
  for (let i = 3; i < first!.length; i += 4) expect(first![i]).toBe(255);
});

test("a new view cancels the render at its next yield", async () => {
  const s = settings({ width: 200, height: 200 });
  let t = 0;
  let yields = 0;
  const result = await renderPortrait(
    s,
    new Uint8ClampedArray(200 * 200 * 4),
    hooks({ now: () => (t += 5), cancelled: () => ++yields >= 2 }),
  );
  expect(result.complete).toBe(false);
});

test("past the budget the render stops where it is and says which pass it reached", async () => {
  const s = settings({ width: 200, height: 200 });
  let t = 0;
  const result = await renderPortrait(s, new Uint8ClampedArray(200 * 200 * 4), hooks({ now: () => (t += 1) }), 600);
  expect(result.complete).toBe(false);
  expect([0, 8, 4, 2]).toContain(result.step);
});
