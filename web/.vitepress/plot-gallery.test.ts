// The plot gallery lists every drawing example the records hold, and each card links to an example
// that is on its head's page. The first block reads the records; the second reads the built site
// (like the ledger test, it is skipped where there is none).

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
// Loaded here, not on the first lowering: the front end takes seconds to load on a busy machine,
// and that load is not what the lowering case measures.
import "@notatio/frontend";
import { referenceData } from "@notatio/reference/node";
import { describe, expect, it } from "vite-plus/test";
import { EXCLUDED_HEADS, exampleHref, FAMILIES, familyOf, galleryOf, listed } from "./data/plot-gallery.ts";
import { entries } from "./data/reference-node.ts";
import { recordsRoot } from "./data/records-root.ts";

// The records as the loader reads them, before the site assembles its stubs around them.
const records = referenceData(recordsRoot).entries;
const drawing = records.flatMap((entry) =>
  entry.examples.filter((example) => listed(entry, example)).map((example) => `${entry.name}/${example.id}`),
);
const cards = galleryOf(entries).flatMap((family) => family.cards);

describe("the gallery's data", () => {
  it("holds a card for every drawing example in the records, once", () => {
    expect(drawing.length).toBeGreaterThan(100);
    expect(cards.map((card) => `${card.head}/${card.id}`).toSorted()).toEqual(drawing.toSorted());
  });

  it("leaves out what a head's page does not show, and what is no picture", () => {
    const hidden = records.flatMap((entry) =>
      entry.examples.filter((e) => e.role === "test" || e.role === "triage").map((e) => `${entry.name}/${e.id}`),
    );
    const listed = new Set(cards.map((card) => `${card.head}/${card.id}`));
    expect(hidden.filter((key) => listed.has(key))).toEqual([]);
    // A control is drawn by its own element, not as a plot.
    expect(cards.filter((card) => card.head === "Slider")).toEqual([]);
  });

  it("links each card to an example of its head's record", () => {
    for (const card of cards) {
      const entry = records.find((e) => e.name === card.head);
      expect(
        entry?.examples.some((e) => e.id === card.id),
        card.href,
      ).toBe(true);
      expect(card.href).toBe(exampleHref(card.head, card.id));
    }
  });

  it("lowers each card to the element that draws it, as the page does when it scrolls in", async () => {
    const { plotMarkupOfJson } = await import("./data/plot-markup.ts");
    const markup = await Promise.all(cards.map((card) => plotMarkupOfJson(card.expr)));
    const none = cards.filter((_, i) => markup[i] === undefined).map((card) => card.href);
    expect(none).toEqual([]);
    expect(markup.every((m) => /^<(graphics-box|graphics-3d-box|notatio-complex-plot(-3d)?) /.test(m!))).toBe(true);
  });

  it("puts a head's drawing in the family its head names", () => {
    expect(familyOf("Plot")).toBe("curves");
    expect(familyOf("ContourPlot")).toBe("fields");
    expect(familyOf("StreamPlot")).toBe("vector-fields");
    expect(familyOf("Plot3D")).toBe("surfaces");
    expect(familyOf("ComplexPlot")).toBe("complex");
    expect(familyOf("PieChart")).toBe("charts");
    expect(familyOf("Graphics")).toBe("graphics");
    expect(new Set(FAMILIES.map((f) => f.id)).size).toBe(FAMILIES.length);
  });

  it("groups ArrayPlot with the charts, and the fields are the contour, density and region plots", () => {
    expect(familyOf("ArrayPlot")).toBe("charts");
    const fields = galleryOf(entries).find((f) => f.id === "fields")!;
    expect(new Set(fields.cards.map((c) => c.drawn))).toEqual(
      new Set(["ContourPlot", "DensityPlot", "RegionPlot", "ListContourPlot", "ListDensityPlot"]),
    );
  });

  it("orders each family by its stated heads, the rest after them by name", () => {
    for (const family of galleryOf(entries)) {
      const spec = FAMILIES.find((f) => f.id === family.id)!;
      const stated = spec.heads as readonly string[];
      const seen = family.cards.map((c) => c.drawn).filter((head, i, all) => all.indexOf(head) === i);
      const inList = seen.filter((head) => stated.includes(head));
      const after = seen.filter((head) => !stated.includes(head));
      expect(seen, family.id).toEqual([...inList, ...after]);
      expect(inList, family.id).toEqual(stated.filter((head) => inList.includes(head)));
      expect(after, family.id).toEqual(after.toSorted((a, b) => a.localeCompare(b, "en")));
    }
    expect(galleryOf(entries)[0]!.cards[0]!.drawn).toBe("Plot");
  });

  it("shows DiscretePlot's examples, which its page draws as stems", () => {
    expect(EXCLUDED_HEADS.size).toBe(0);
    expect(cards.filter((c) => c.head === "DiscretePlot").length).toBeGreaterThan(0);
  });
});

const dist = resolve(import.meta.dirname, "dist");
const built = existsSync(resolve(dist, "explore/plots/index.html"));
const html = (path: string): string => readFileSync(resolve(dist, path), "utf8");

describe.skipIf(!built)("the gallery in the built site", () => {
  it("renders a card for each drawing example", () => {
    const page = html("explore/plots/index.html");
    expect([...page.matchAll(/data-card="([^"]+)"/g)].map((m) => m[1]!).toSorted()).toEqual(drawing.toSorted());
  });

  it("links each card to an anchor on its head's built page", () => {
    const page = html("explore/plots/index.html");
    const hrefs = [...page.matchAll(/class="plot-card-link"[^>]*href="([^"]+)"/g)].map((m) => m[1]!);
    expect(hrefs.length).toBe(drawing.length);
    for (const href of hrefs) {
      const [path, anchor] = href.split("#");
      expect(existsSync(resolve(dist, `${path!.slice(1)}.html`)), href).toBe(true);
      expect(html(`${path!.slice(1)}.html`), href).toContain(`id="${anchor}"`);
    }
  });

  it("is linked from the explore index and from a plotting head's page", () => {
    expect(html("explore/index.html")).toContain('href="/explore/plots/"');
    expect(html("reference/symbol/Plot.html")).toContain('href="/explore/plots/"');
    expect(html("reference/symbol/Sin.html")).not.toContain('href="/explore/plots/"');
  });
});
