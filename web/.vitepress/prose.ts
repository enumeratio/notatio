// Record prose (summaries, details, captions, notes) through the prose boxes
// (https://github.com/enumeratio/notatio/wiki/Boxes): markdown read into boxes, then HTML, with `$…$`
// typeset from its TeX as written. Synchronous, so the same call renders at build
// and in the browser. A line of prose is `renderSummary` from `@notatio/formats/typeset`, the
// function the published package exports; the block forms here are the site's own.

import { type Box } from "@notatio/boxes";
import { readMarkdown, toHtml } from "@notatio/boxes/render";
import { type ProseOptions, renderSummary, typesetProse } from "@notatio/formats/typeset";

export type { ProseOptions };

/** HTML for TeX, memoised: a page repeats its formulas, and the site repeats its pages. */
export const tex = typesetProse;

/** One line of prose (a summary, a caption) as inline HTML. */
export const renderInline = renderSummary;

/** Prose as block HTML; a single paragraph stays inline, for a list item or a table cell. */
export function renderBlock(markdown: string, options: ProseOptions = {}): string {
  const cells = readMarkdown(markdown);
  const only = cells.length === 1 ? (cells[0] as readonly [string, Box, string]) : undefined;
  return toHtml(only?.[2] === "Text" ? only[1] : cells, { tex, ...options });
}

/** A whole markdown document (a record's body) as block HTML. */
export const renderProse = (markdown: string, options: ProseOptions = {}): string =>
  toHtml(readMarkdown(markdown), { tex, ...options });
