# AsciiMath

AsciiMath is a plain-text math notation (e.g. `sin(x)/2`). The `AsciiMath` format
in `@notatio/formats` (alias `asciimath`, extension `.am`) writes it and reads it.

## Output

An expression prints as AsciiMath (`x^2 <= pi`, `sqrt(x)`, `x in RR`); it surfaces as
the **AsciiMathForm** output form:

<notatio-out value='["Divide", ["Sin", "x"], 2]' format="mathjson" form="asciimath" label="Out" />

## Input

`importFrom(text, "AsciiMath", { ce })` (or `fromAsciiMath`) reads AsciiMath text as an
expression. It converts the text to TeX with asciimath2tex and has compute-engine parse
that, so it reads what asciimath2tex turns into TeX that compute-engine understands:
fractions, powers, roots, Greek letters, relations, sums with limits
(`sum_(n=1)^oo 1/n^2`). Text asciimath2tex converts to TeX compute-engine cannot parse
comes back as an error expression, and the round trip from an expression to AsciiMath and
back is not exact for every form.

`ce.parse` itself still reads only [LaTeX](/reference/formats/latex), and a
`notatio-*` attribute reads Epsil, so AsciiMath must go through this format first.

## Footgun

- **Don't paste AsciiMath into a LaTeX field.** Simple cases (`1/2`, `x^2`) may
  happen to parse because the syntaxes overlap, but anything with AsciiMath-only
  spelling (`sqrt x`, `sin x` without a command) will misparse. Read it with the
  AsciiMath format, or write LaTeX (`\sqrt{x}`, `\sin x`) or MathJSON.
