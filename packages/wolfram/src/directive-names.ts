// Wolfram's named colors and style words: symbols that stand for a graphics directive (`Red` is
// `RGBColor[1, 0, 0]`, `Thick` is `Thickness[Large]`), and the size words a directive takes. Ours
// read the same names inside a `Graphics` and a `PlotStyle`, so in an argument position they are
// Wolfram's own, never a free variable. A color of ours Wolfram does not name (`Gold`, `Teal`) is
// not here, and is written in our context. `tests/to-wolfram.test.ts` holds every name to `System``.

/** The named colors. */
const COLORS = [
  "Red",
  "Green",
  "Blue",
  "Black",
  "White",
  "Gray",
  "Cyan",
  "Magenta",
  "Yellow",
  "Brown",
  "Orange",
  "Pink",
  "Purple",
];

export const DIRECTIVE_NAMES: readonly string[] = [
  ...COLORS,
  ...COLORS.filter((color) => color !== "Black" && color !== "White").map((color) => `Light${color}`),
  "Transparent",
  "Thin",
  "Thick",
  "Dashed",
  "Dotted",
  "DotDashed",
  "Tiny",
  "Small",
  "Medium",
  "Large",
];
