// A contact sheet's layout: rows are a head's examples, columns are the conditions each was shot in.
// Pure: it reads the size of given PNGs and writes one HTML page of data-URL images, which the shooter
// screenshots in the browser (no PNG decoder or encoder is needed here).

/** The conditions, in column order. */
export const CONDITIONS = ["light", "dark", "400 px"] as const;
export type Condition = (typeof CONDITIONS)[number];

/** A cell: the example's screenshot, or why there is none. */
export type Cell = { png: Uint8Array } | { error: string };

export interface SheetRow {
  /** The example's id. */
  label: string;
  /** One cell per condition, in `CONDITIONS` order. */
  cells: readonly Cell[];
}

/** Rows per sheet image, so a sheet stays under the browser's 16,384 px screenshot limit. */
export const ROWS_PER_SHEET = 6;
/** Widest an image is drawn, in CSS pixels, so a wide example doesn't stretch its column. */
export const COLUMN_WIDTH = 520;
/** Tallest an image is drawn, so a long example doesn't take the sheet. */
export const MAX_IMAGE_HEIGHT = 700;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** The pixel size a PNG's header states, or undefined when the bytes are not a PNG. */
export function pngSize(png: Uint8Array): { width: number; height: number } | undefined {
  if (png.length < 24 || PNG_SIGNATURE.some((byte, i) => png[i] !== byte)) return undefined;
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  // IHDR: 8-byte signature, 4-byte length, "IHDR", then width and height as 32-bit big-endian integers.
  if (view.getUint32(12) !== 0x49484452) return undefined;
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

/** The size to draw an image of `size`: shrunk to fit the column and the height cap, never enlarged. */
export function fitSize(
  size: { width: number; height: number },
  maxWidth: number = COLUMN_WIDTH,
  maxHeight: number = MAX_IMAGE_HEIGHT,
): { width: number; height: number } {
  const scale = Math.min(1, maxWidth / size.width, maxHeight / size.height);
  return { width: Math.max(1, Math.round(size.width * scale)), height: Math.max(1, Math.round(size.height * scale)) };
}

/** The rows split into sheets of at most `perSheet`. */
export function chunkRows<T>(rows: readonly T[], perSheet: number = ROWS_PER_SHEET): T[][] {
  const sheets: T[][] = [];
  for (let i = 0; i < rows.length; i += perSheet) sheets.push(rows.slice(i, i + perSheet));
  return sheets;
}

const escapeHtml = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

function cellHtml(cell: Cell | undefined): string {
  if (cell === undefined) return `<div class="missing">no screenshot</div>`;
  if ("error" in cell) return `<div class="missing">${escapeHtml(cell.error)}</div>`;
  const size = pngSize(cell.png);
  if (size === undefined) return `<div class="missing">not a PNG</div>`;
  const { width, height } = fitSize(size);
  const src = `data:image/png;base64,${Buffer.from(cell.png).toString("base64")}`;
  return `<img src="${src}" width="${width}" height="${height}" alt="">`;
}

/** The HTML page of one sheet: a title, a header row naming the conditions, then a row per example. */
export function sheetHtml(title: string, rows: readonly SheetRow[]): string {
  const header = CONDITIONS.map((condition) => `<div class="head">${escapeHtml(condition)}</div>`).join("");
  const body = rows
    .map(
      (row) =>
        `<div class="label">${escapeHtml(row.label)}</div>` +
        CONDITIONS.map((_, i) => `<div class="cell">${cellHtml(row.cells[i])}</div>`).join(""),
    )
    .join("\n");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
body { margin: 0; padding: 16px; background: #fff; color: #222; font: 14px/1.4 system-ui, sans-serif; }
h1 { margin: 0 0 12px; font-size: 20px; }
.grid { display: grid; grid-template-columns: 160px repeat(${CONDITIONS.length}, max-content); gap: 8px 12px; align-items: start; }
.head { font-weight: 600; border-bottom: 1px solid #999; }
.label { font: 12px ui-monospace, monospace; word-break: break-all; }
.cell { border: 1px solid #ccc; min-width: 120px; }
.cell img { display: block; }
.missing { padding: 8px; color: #a00; font-size: 12px; max-width: ${COLUMN_WIDTH}px; }
</style></head><body>
<h1>${escapeHtml(title)}</h1>
<div class="grid"><div class="head">example</div>${header}
${body}
</div></body></html>
`;
}

/** The HTML pages for a head, one per `perSheet` rows, titled with the head and the part. */
export function sheetPages(head: string, rows: readonly SheetRow[], perSheet: number = ROWS_PER_SHEET): string[] {
  const parts = chunkRows(rows, perSheet);
  return parts.map((part, i) =>
    sheetHtml(parts.length === 1 ? head : `${head} (part ${i + 1} of ${parts.length})`, part),
  );
}
