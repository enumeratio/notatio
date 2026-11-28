import { deflateSync } from "node:zlib";
import { expect, test } from "vite-plus/test";
import { changedHeads, describeSelection, headPath, MAX_HEADS } from "./changed-heads.ts";
import { chunkRows, COLUMN_WIDTH, fitSize, MAX_IMAGE_HEIGHT, pngSize, sheetHtml, sheetPages } from "./sheet.ts";

/** A real, decodable PNG of one gray pixel row `width` by `height`. */
function png(width: number, height: number): Uint8Array {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (bytes: Uint8Array) => {
    let c = 0xffffffff;
    for (const byte of bytes) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Uint8Array) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const out = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(crc(body), 8 + data.length);
    return out;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 0; // grayscale
  const rows = Buffer.alloc((width + 1) * height, 0x80);
  for (let y = 0; y < height; y++) rows[y * (width + 1)] = 0; // filter: none
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", new Uint8Array()),
  ]);
}

test("changedHeads reads heads from every record file and both layouts", () => {
  const selection = changedHeads([
    "packages/formats/reference/Plot/index.md",
    "packages/formats/reference/Plot/examples.tsv",
    "packages/formats/reference/BarChart/examples.values.wolfram.tsv",
    "packages/reference/entries/Zeta/examples.values.mpmath.tsv",
    "packages/reference/entries/Gamma/index.md",
  ]);
  expect(selection).toEqual({ heads: ["BarChart", "Gamma", "Plot", "Zeta"], total: 4, capped: false });
});

test("changedHeads ignores files that are not a head's page", () => {
  const selection = changedHeads([
    "packages/formats/src/plot.ts",
    "packages/formats/reference/Plot/notes.txt",
    "packages/formats/reference/README.md",
    "packages/reference/entries/index.md",
    "packages/reference/src/entries/Zeta/index.md",
    "web/reference/symbol/[name].md",
    "docs/reference/Plot/index.md",
  ]);
  expect(selection).toEqual({ heads: [], total: 0, capped: false });
});

test("changedHeads caps the heads and says so", () => {
  const paths = Array.from(
    { length: MAX_HEADS + 3 },
    (_, i) => `packages/formats/reference/Head${String(i).padStart(2, "0")}/index.md`,
  );
  const selection = changedHeads(paths);
  expect(selection.heads).toHaveLength(MAX_HEADS);
  expect(selection.total).toBe(MAX_HEADS + 3);
  expect(selection.capped).toBe(true);
  expect(describeSelection(selection)).toContain(`only ${MAX_HEADS} of ${MAX_HEADS + 3}`);
  expect(changedHeads(paths, 2).heads).toEqual(["Head00", "Head01"]);
});

test("describeSelection and headPath", () => {
  expect(describeSelection(changedHeads([]))).toMatch(/No reference head/);
  expect(describeSelection(changedHeads(["packages/formats/reference/Plot/index.md"]))).toBe(
    "1 reference head changed: Plot.",
  );
  expect(headPath("Plot")).toBe("/reference/symbol/Plot/");
});

test("pngSize reads a PNG's header and refuses other bytes", () => {
  expect(pngSize(png(37, 11))).toEqual({ width: 37, height: 11 });
  expect(pngSize(new Uint8Array([1, 2, 3]))).toBeUndefined();
  expect(pngSize(new Uint8Array(40))).toBeUndefined();
});

test("fitSize shrinks to the column and the height cap and never enlarges", () => {
  expect(fitSize({ width: 100, height: 50 })).toEqual({ width: 100, height: 50 });
  expect(fitSize({ width: COLUMN_WIDTH * 2, height: 100 })).toEqual({ width: COLUMN_WIDTH, height: 50 });
  expect(fitSize({ width: 100, height: MAX_IMAGE_HEIGHT * 2 })).toEqual({ width: 50, height: MAX_IMAGE_HEIGHT });
});

test("chunkRows splits into sheets of at most the given size", () => {
  expect(chunkRows([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  expect(chunkRows([], 2)).toEqual([]);
});

test("sheetHtml lays out a row per example with the three conditions", () => {
  const a = png(40, 20);
  const html = sheetHtml("Plot", [
    { label: "first", cells: [{ png: a }, { png: a }, { png: a }] },
    { label: "<second>", cells: [{ png: a }, { error: "timed out" }, { png: new Uint8Array([0, 1]) }] },
  ]);
  expect(html).toContain("<h1>Plot</h1>");
  for (const condition of ["light", "dark", "400 px"]) expect(html).toContain(`>${condition}</div>`);
  expect(html.match(/<img /g)).toHaveLength(4);
  expect(html).toContain(`data:image/png;base64,${Buffer.from(a).toString("base64")}`);
  expect(html).toContain('width="40" height="20"');
  expect(html).toContain("&lt;second&gt;");
  expect(html).toContain("timed out");
  expect(html).toContain("not a PNG");
});

test("sheetHtml marks a missing cell rather than dropping the column", () => {
  const html = sheetHtml("Plot", [{ label: "only", cells: [{ png: png(4, 4) }] }]);
  expect(html.match(/no screenshot/g)).toHaveLength(2);
});

test("sheetPages splits long heads into titled parts", () => {
  const rows = Array.from({ length: 5 }, (_, i) => ({ label: `e${i}`, cells: [{ png: png(4, 4) }] }));
  expect(sheetPages("Plot", rows, 10)).toHaveLength(1);
  const pages = sheetPages("Plot", rows, 2);
  expect(pages).toHaveLength(3);
  expect(pages[0]).toContain("Plot (part 1 of 3)");
  expect(pages[2]).toContain("Plot (part 3 of 3)");
});
