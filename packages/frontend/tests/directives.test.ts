// Directives, and the look a primitive is drawn with: Wolfram's scoping, list by list.

import { type BoxNode, optionsOfBox } from "@notatio/boxes";
import { expect, test } from "vite-plus/test";
import { directive, lookOf, pixels } from "../src/directives.ts";
import { colorOf, paintOf } from "../src/graphics-rules.ts";
import { plotBox } from "../src/plot-box.ts";
import { primitivesOf } from "../src/primitives.ts";

const at = (x: number, y: number): unknown[] => ["Tuple", x, y];
const RED = colorOf("Red")!;
const BLUE = colorOf("Blue")!;

test("a directive styles what follows it in its list, and ends where the list does", () => {
  const marks = primitivesOf([
    "List",
    "Red",
    ["Disk", at(0, 0)],
    ["List", ["Opacity", 0.4], "Blue", ["Disk", at(1, 0)]],
    ["Circle", at(2, 0)],
  ] as never);
  expect(marks.map((m) => m.look)).toEqual([{ color: RED }, { color: BLUE, opacity: 0.4 }, { color: RED }]);
});

test("a primitive before any directive has no look, and Style styles one primitive", () => {
  const marks = primitivesOf([
    "List",
    ["Point", at(0, 0)],
    ["Style", ["Line", ["List", at(0, 0), at(1, 1)]], "Thick", "Dashed"],
    ["Point", at(1, 1)],
  ] as never);
  expect(marks[0]!.look).toBeUndefined();
  expect(marks[1]!.look).toEqual({ thickness: { px: 2.5 }, dashing: [{ px: 6 }, { px: 4 }] });
  expect(marks[2]!.look).toBeUndefined();
});

test("sizes are px in their Absolute forms and fractions of the plot's width otherwise", () => {
  const look = lookOf(["Directive", ["Thickness", 0.01], ["AbsolutePointSize", 8], ["Dashing", ["List", 0.02, 0.01]]])!;
  expect(look.thickness).toEqual({ scaled: 0.01 });
  expect(pixels(look.thickness!)).toBeCloseTo(3);
  expect(look.pointSize).toEqual({ px: 8 });
  expect(look.dashing!.map(pixels)).toEqual([6, 3]);
  expect(lookOf(["PointSize", "Large"])!.pointSize).toEqual({ px: 9 });
});

test("EdgeForm and FaceForm hold a look of their own, or none", () => {
  const look = lookOf(["List", ["EdgeForm", "Black"], ["FaceForm"], "Red"])!;
  expect(look.edge).toEqual({ color: "#000000" });
  expect(look.face).toBeNull();
  expect(lookOf(["EdgeForm", "None"])!.edge).toBeNull();
});

test("what is not a directive is not read as one", () => {
  expect(directive({}, ["Disk", at(0, 0)])).toBeUndefined();
  expect(directive({}, ["Thickness", "Wide"])).toBeUndefined();
  expect(directive({}, at(0, 0))).toBeUndefined();
});

test("colors: Hue, a hex in RGBColor, and an opacity as a last argument", () => {
  expect(colorOf(["Hue", 0])).toBe("#ff0000");
  expect(colorOf(["Hue", 1 / 3])).toBe("#00ff00");
  expect(colorOf(["Hue", 0.5, 0, 0.5])).toBe("#808080");
  expect(colorOf(["RGBColor", "'#336699'"])).toBe("#336699");
  expect(paintOf(["RGBColor", 1, 0, 0, 0.25])).toEqual({ paint: "#ff0000", opacity: 0.25 });
  expect(directive({}, ["GrayLevel", 0, 0.5])).toEqual({ color: "#000000", opacity: 0.5 });
});

const looksOf = (epilog: unknown): Record<string, unknown>[] => {
  const box = plotBox(
    [
      {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
      },
    ],
    { epilog: primitivesOf(epilog as never) },
  );
  return ((box as BoxNode)[1] as BoxNode[])
    .filter((mark) => mark[0] === "StyleBox" && (mark[1] as BoxNode)[2] === "Epilog")
    .map((mark) => ({
      ...(mark[2] as Record<string, unknown>),
      prim: optionsOfBox((mark[1] as BoxNode)[1] as BoxNode),
    }));
};

test("a filled mark is the color in force, opaque, and outlined only by an EdgeForm", () => {
  const [plain, styled, outlined] = looksOf([
    "List",
    ["Disk", at(0, 0), 0.2],
    ["List", "Red", ["Disk", at(1, 1), 0.2]],
    [
      "List",
      ["EdgeForm", ["Directive", "Black", "Thick"]],
      "Blue",
      ["Opacity", 0.5],
      ["Rectangle", at(0, 0), at(1, 1)],
    ],
  ]);
  // No directive: the page's foreground, as Wolfram's is black.
  expect(plain!["FaceForm"]).toContain("--notatio-fg");
  expect(plain).toMatchObject({ Opacity: 1 });
  expect(plain!["EdgeForm"]).toBeUndefined();
  expect(styled).toMatchObject({ FaceForm: RED, Opacity: 1 });
  expect(styled!["EdgeForm"]).toBeUndefined();
  expect(outlined).toMatchObject({ FaceForm: BLUE, Opacity: 0.5, EdgeForm: [["#000000", 2.5, 0.5, []]] });
});

test("points and arrows take their sizes, lines their stroke", () => {
  const [dot, shaft, dashed] = looksOf([
    "List",
    "Red",
    ["PointSize", 0.02],
    ["Point", at(0, 0)],
    ["Arrowheads", 0.05],
    ["Arrow", ["List", at(0, 0), at(1, 1)]],
    ["List", "Dotted", ["AbsoluteThickness", 3], ["Line", ["List", at(0, 0), at(1, 0)]]],
  ]);
  expect(dot).toMatchObject({ FaceForm: RED, PointSize: 6 });
  expect((shaft!["prim"] as Record<string, unknown>)["Arrowheads"]).toBe(0.05);
  expect(dashed!["EdgeForm"]).toEqual([[RED, 3, 1, [1.5, 3]]]);
});
