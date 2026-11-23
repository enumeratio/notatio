// An item the pinned compiler would compile wrong carries its reason instead of code (`declined`). It
// still draws, through the interpreter, and says so only to the debug log; with no interpreter either, the
// plot says why it cannot draw.

import { ComputeEngine } from "@cortex-js/compute-engine";
import type { BoxNode } from "@notatio/boxes";
import { afterEach, expect, test, vi } from "vite-plus/test";
import { compilePlot } from "../src/plot-compile.ts";
import {
  CURVE_SPEC,
  curvesOf,
  figurePlanOf,
  interpretedSampler,
  loadCompiled,
  lonePlotOf,
} from "../src/plot-sample.ts";
import { plotOfText } from "../src/symbols.ts";

const ce = new ComputeEngine();
// 2 / Csch(x) is 2 sinh x; compiled, its reciprocal is dropped (compute-engine 0.187).
const TEXT = "Plot(2 / Csch(x), (x, -2, 2), PlotRange -> (-8, 8))";
const compiled = compilePlot(ce, ["Divide", 2, ["Csch", "x"]], CURVE_SPEC);
const settings = plotOfText(TEXT)!.settings;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("a declined item has no code, only its reason", () => {
  expect(compiled.items[0]!.code).toBeUndefined();
  expect(compiled.items[0]!.declined).toMatch(/^ce-0187:[a-z-]+: /);
});

test("a declined item draws through the interpreter, and its points are the true values", () => {
  const loaded = loadCompiled(compiled, { evaluate: interpretedSampler(ce as never) });
  expect(loaded.failed).toBeUndefined();
  const curves = curvesOf(settings, loaded);
  if (!("series" in curves)) throw new Error("no series");
  const points = curves.series[0]!.points.filter((p) => Number.isFinite(p.y) && Math.abs(p.x) > 0.05);
  expect(points.length).toBeGreaterThan(20);
  for (const p of points) expect(p.y).toBeCloseTo(2 * Math.sinh(p.x), 6);
  const box = figurePlanOf(lonePlotOf("Plot", settings)!).draw([loaded]) as BoxNode;
  expect(Array.isArray(box)).toBe(true);
});

test("the reason reaches the debug log", async () => {
  vi.resetModules();
  vi.stubGlobal("localStorage", { getItem: () => "plot" });
  const log = vi.spyOn(console, "debug").mockImplementation(() => {});
  const fresh = await import("../src/plot-sample.ts");
  fresh.loadCompiled(compiled, { evaluate: fresh.interpretedSampler(ce as never) });
  expect(log).toHaveBeenCalledWith(
    "notatio:plot",
    "declined to compiled code",
    compiled.items[0]!.declined,
    expect.any(String),
  );
});

test("with no interpreter either, the plot says why it cannot draw, not that it has nothing", () => {
  const loaded = loadCompiled(compiled);
  expect(loaded.failed).toBe(compiled.items[0]!.declined);
  expect(curvesOf(settings, loaded)).toEqual({ failed: compiled.items[0]!.declined });
  expect(figurePlanOf(lonePlotOf("Plot", settings)!).draw([loaded])).toEqual({ failed: compiled.items[0]!.declined });
});
