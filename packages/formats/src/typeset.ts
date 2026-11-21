// The one place TeX becomes HTML for the sites and elements: `$…$` islands in prose, and the
// LaTeX compute-engine writes for an expression. Callers ask for markup, not for KaTeX, so a
// different typesetter (MathLive's static renderer) is a change here and nowhere else.

import { katexStrict, readInlineMarkdown, toHtml, trustExpression } from "@notatio/boxes/render";
import katex from "katex";
import { portableTeX } from "./tex.ts";

export interface TypesetOptions {
  /** Display style (a `$$…$$` block) rather than inline. */
  readonly display?: boolean;
  /**
   * The TeX is an expression's, as compute-engine writes it for MathLive: made portable first,
   * and the `data-expr` of an interpretation kept. Prose TeX is the author's, trusted with nothing.
   */
  readonly expression?: boolean;
}

/** HTML (and MathML) for TeX. A formula that does not parse is shown as written, not thrown. */
export function typeset(latex: string, { display = false, expression = false }: TypesetOptions = {}): string {
  return katex.renderToString(expression ? portableTeX(latex) : latex, {
    displayMode: display,
    throwOnError: false,
    output: "htmlAndMathml",
    strict: katexStrict(),
    ...(expression ? { trust: trustExpression } : {}),
  });
}

const escapeHtml = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const memo = new Map<string, string>();

/** `typeset` for prose TeX, memoised: a page repeats its formulas, and the site repeats its pages. */
export function typesetProse(latex: string, display: boolean): string {
  const key = `${display ? "D" : "I"}${latex}`;
  let html = memo.get(key);
  if (html === undefined) {
    try {
      html = typeset(latex, { display });
    } catch {
      // KaTeX reports a bad formula as markup; anything it still throws shows the source.
      html = `<span class="katex-error">${escapeHtml(latex)}</span>`;
    }
    memo.set(key, html);
  }
  return html;
}

export interface ProseOptions {
  /** The href for `[[Head]]`, or `undefined` to leave the name as text. */
  readonly link?: (head: string) => string | undefined;
}

/**
 * One line of record prose (a summary, a caption) as inline HTML: markdown with `$…$` islands
 * typeset by KaTeX (strict, as the site), the text around them escaped, code spans, emphasis and
 * links read. Synchronous and DOM-free, so it renders in Node and in a browser alike, and a
 * formula KaTeX cannot parse comes out as its source in a `katex-error` span. Pair it with
 * `katex/dist/katex.min.css`.
 */
export function renderSummary(markdown: string, options: ProseOptions = {}): string {
  return toHtml(readInlineMarkdown(markdown), { tex: typesetProse, ...options });
}
