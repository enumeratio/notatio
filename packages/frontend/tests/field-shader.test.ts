// A field shader's source and its uniforms: what the page's WebGL draws a region plot from.

import { expect, test } from "vite-plus/test";
import { fieldShader, fieldUniform, fitsFieldShader, MAX_FIELDS, MAX_PARAMS } from "../src/field-shader.ts";
import { fieldPaintsOf } from "../src/plot-lowering.ts";

const unit = "float field0(float x, float y, float _a) { return _a - x * x - y * y; }\n";

test("regions are filled in order and their edges drawn over the fills", () => {
  const source = fieldShader(unit + unit.replace("field0", "field1"), {
    kind: "regions",
    count: 2,
    params: 1,
    mask: false,
  });
  expect(source.startsWith("#version 300 es")).toBe(true);
  expect(source).toContain("float m1 = field1(x, y, prm.k[0][0]);");
  const order = ["cover(m0)", "cover(m1)", "stroke(m0", "stroke(m1"].map((part) => source.indexOf(part));
  expect(order.every((at) => at > 0)).toBe(true);
  expect(order).toEqual(order.toSorted((a, b) => a - b));
});

test("curves have no fill, and a mask bounds a fill and stops an edge", () => {
  const curves = fieldShader(unit, { kind: "curves", count: 1, params: 1, mask: false });
  expect(curves).not.toContain("cover(m0)");
  expect(curves).toContain("stroke(m0, prm.edge[0].a)");
  const masked = fieldShader(unit + unit.replace("field0", "field1"), {
    kind: "regions",
    count: 1,
    params: 1,
    mask: true,
  });
  expect(masked).toContain("float inside = field1(x, y, prm.k[0][0]);");
  expect(masked).toContain("cover(min(m0, inside))");
  expect(masked).toContain("stroke(m0, prm.edge[0].a) * step(0.0, inside)");
});

test("a parameter past the fourth reads the next slot", () => {
  const source = fieldShader(unit, { kind: "curves", count: 1, params: 6, mask: false });
  expect(source).toContain("prm.k[1][1])");
});

test("the uniform block holds the view, the size, the parameters and the paints", () => {
  const f = fieldUniform({ x: [-3, 3], y: [-2, 2] }, 600, 400, [1.5], {
    fills: [{ color: "#ff0000", opacity: 0.35 }],
    edges: ["#0000ff", null],
    width: 1.5,
  });
  expect(Array.from(f.slice(0, 6))).toEqual([-3, -2, 3, 2, 600, 400]);
  expect(f[8]).toBe(1.5);
  const fill = 8 + MAX_PARAMS;
  expect(Array.from(f.slice(fill, fill + 4))).toEqual([1, 0, 0, Math.fround(0.35)]);
  const edge = fill + MAX_FIELDS * 4;
  expect(Array.from(f.slice(edge, edge + 8))).toEqual([0, 0, 1, 1.5, 0, 0, 0, 0]);
});

test("a plot past the shader's slots takes the CPU route", () => {
  expect(fitsFieldShader(MAX_FIELDS, 0, false)).toBe(true);
  expect(fitsFieldShader(MAX_FIELDS, 0, true)).toBe(false);
  expect(fitsFieldShader(1, MAX_PARAMS + 1, false)).toBe(false);
  expect(fitsFieldShader(0, 0, false)).toBe(false);
});

test("a region plot's paints are its box's, and a plot only the box can paint has none", () => {
  const regions = { field: "regions" };
  const paints = fieldPaintsOf("RegionPlot", regions, 2)!;
  expect(paints.fills).toHaveLength(2);
  expect(paints.edges).toEqual(paints.fills!.map((fill) => fill.color));
  expect(fieldPaintsOf("RegionPlot", { ...regions, "boundary-style": '"None"' }, 1)!.edges).toEqual([null]);
  expect(fieldPaintsOf("RegionPlot", { ...regions, "color-mixing": "Screen" }, 2)).toBeUndefined();
  const curves = fieldPaintsOf("ContourPlot", { field: "curves" }, 3)!;
  expect(curves.fills).toBeUndefined();
  expect(curves.edges).toHaveLength(3);
  expect(fieldPaintsOf("ContourPlot", {}, 1)).toBeUndefined();
});
