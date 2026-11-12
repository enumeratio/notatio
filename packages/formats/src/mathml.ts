// MathMLForm -- an expression printed as presentation MathML: its traditional notation as
// boxes (`makeBoxes`), and the boxes as MathML; a pure function of the MathJSON tree, so it
// can be golden-tested. Read back, MathML is boxes (`parseMathML`), and boxes become an
// expression with `makeExpression`, through their LaTeX only for the boxes it declines.
// See https://github.com/enumeratio/notatio/wiki/Boxes.

import type { ComputeEngine } from "@cortex-js/compute-engine";
import type { MathJsonExpression } from "@cortex-js/compute-engine/epsil";
import { type Box, makeBoxes, makeExpression, MakeExpressionError, notationOf } from "@enumeratio/boxes";
import {
  commandTeX,
  type MathMLOptions,
  parseMathML,
  toLatex,
  toMathML as boxesToMathML,
} from "@enumeratio/boxes/render";

export type { MathMLOptions };

/** Print `json` as presentation MathML. */
export const toMathML = (json: MathJsonExpression, options: MathMLOptions = {}): string =>
  boxesToMathML(makeBoxes(json), options);

/** Boxes read as an expression (canonical, as the engine boxes it): by makeExpression, with the
 *  notation registered on `ce` read back to its heads, and through their LaTeX, as commands (any
 *  engine reads them), for the boxes it declines. */
export const boxesToExpression = (boxes: Box, ce: ComputeEngine): MathJsonExpression => {
  try {
    return ce.box(makeExpression(boxes, { notation: notationOf(ce) }) as never).json as MathJsonExpression;
  } catch (error) {
    if (!(error instanceof MakeExpressionError)) throw error;
    return ce.parse(commandTeX(toLatex(boxes))).json as MathJsonExpression;
  }
};

/** Read presentation MathML as an expression. */
export const fromMathML = (xml: string, ce: ComputeEngine): MathJsonExpression =>
  boxesToExpression(parseMathML(xml), ce);
