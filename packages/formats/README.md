# @notatio/formats

A Wolfram-style format registry — `Import`/`Export` over MathJSON, Wolfram Language, TeX,
AsciiMath, MathML, code targets (Python/JS/GLSL), and images. Reach for this when
you have a boxed expression and need it as text in some notation, or text in some
notation and need it back as an expression.

## Entry points

- `.` — the registry (`registerFileFormat`, `getFormat`, `exportTo`, `importFrom`,
  `fileFormat`, `sniffFormat`, `mimeTypeToFormatList`) and the built-in formats,
  registered as a side effect of import.
- `./node` — adds the PNG codec (needs the native rasterizer, [`raster`](../raster/README.md)) and
  file I/O (`writeFormat`/`readFormat`); also registers the browser-safe formats, so a
  Node consumer imports just this.
- `./expression` — `parseExpression`/`serializeExpression`: Epsil in and out, the syntax
  every `notatio-*` attribute and editable cell is written in. No statements or effects
  (assignment, declarations, pragmas) — `parseExpression` reports those rather than
  evaluating them.
- `./inputform` — `toInputForm`: an expression printed as Epsil you could retype, with a
  normalization pass over compute-engine's raw and canonical serializations (written in
  [`engine`](../engine/README.md), re-exported here).
- `./fullform` — `toFullForm`: the expression's tree as Epsil, every head an explicit call
  (`Take(List(a, b, c), 2)`), no operators or sugar; `parseEpsil` reads it back as the same
  uncanonical MathJSON. Wolfram's FullForm is the `WL` format.
- `./tex` — `portableTeX`: compute-engine's LaTeX rewritten for a document (amsmath/amssymb
  macros in place of MathLive-only commands like `\imaginaryI`).
- `./typeset` — `typeset` (TeX to KaTeX HTML) and `renderSummary`, below.
- `./mathml`, `./asciimath` — MathMLForm and AsciiMath, in and out. Writing is built on
  [`boxes`](../boxes/README.md)'s presentation tree. `fromAsciiMath` reads AsciiMath by way
  of TeX (asciimath2tex, then compute-engine's LaTeX parser), so it reads what that TeX
  covers; `asciiMathToTeX` gives the intermediate TeX.

## Usage

```ts
import { exportTo, fileFormat, getFormat, importFrom } from "@notatio/formats";

exportTo(box(["Binomial", 10, 3]), "WL"); // "Binomial[10, 3]"
exportTo(box(["Add", ["Power", "x", 2], 1]), "JavaScript"); // contains "x"
importFrom("Binomial[10, 3]", "WL"); // ["Binomial", 10, 3]

getFormat("numpy")?.name; // "Python"
fileFormat("out/plot.png")?.name; // "PNG"
```

A format name resolves case-insensitively and by alias (`numpy` → `Python`,
`WolframLanguage` → `WL`). Text formats consume a boxed compute-engine expression; image
formats consume an SVG string — the registry stays value-agnostic about which.

## Rendering a record's summary

A record's `summary` (and a caption) is markdown with `$…$` TeX islands. `renderSummary` turns one
into an HTML string, the function notatio's own site uses:

```ts
import { renderSummary } from "@notatio/formats/typeset";

renderSummary("The subsets of $\\{1, \\dots, n\\}$, see [[Subsets]] and `Count`.", {
  link: (head) => `/reference/${head}/`, // optional: without it `[[Head]]` stays text
});
```

Islands are typeset by KaTeX (strict, with notatio's Unicode allowances); the text around them is
escaped, and code spans, emphasis and links are read. It is synchronous and needs no DOM, so it
runs the same in Node and in a browser, and it never throws: an island KaTeX cannot parse comes
out as its source in a `katex-error` span.

The HTML carries KaTeX's class names, so the page needs KaTeX's stylesheet and fonts, which ship
with the `katex` package: `import "katex/dist/katex.min.css"` (or link `dist/katex.min.css`
beside its `fonts/` directory).

## Graphics as values

`Image` and `Rasterize` (`declareGraphics`) let an expression hold a picture rather than
a bespoke element special-casing it: `Image` carries a URI, so it serializes and behaves
the same in Node and a browser. `setRasterizer` installs the pixel-producing backend;
[`raster`](../raster/README.md) supplies Node's.

## Where to go next

- [`/reference/formats/`](https://notatio.app/reference/formats/) — every form and syntax, with worked
  examples (InputForm, LaTeX, MathJSON, AsciiMath).
- [`boxes`](../boxes/README.md) — the presentation tree these serializers and MathML/AsciiMath
  parsers are built on.
- [Boxes](https://github.com/enumeratio/notatio/wiki/Boxes) — the design behind boxes and the
  formats built on them.
