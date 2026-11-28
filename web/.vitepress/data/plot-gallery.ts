// The plot gallery's cards: every reference example whose value draws a picture, read from the
// records at build (`/explore/plots/`). Nothing is listed here but how the families are told apart;
// an example joins the page by drawing, and a head by having one.

import { renderingOf } from "@notatio/frontend/symbols";
import type { ReferenceEntry, ReferenceExample } from "@notatio/reference";

/** The elements that draw a picture; a control, a layout box or a readout is not one. */
const PICTURE_TAGS: ReadonlySet<string> = new Set([
  "graphics-box",
  "graphics-3d-box",
  "notatio-complex-plot",
  "notatio-complex-plot-3d",
]);

/** An example the page leaves out: a case kept as data, one waiting in triage, one that is not yet true. */
const HIDDEN_ROLES: ReadonlySet<string> = new Set(["test", "triage", "aspirational"]);

/**
 * The families, and in each the heads in the order the page shows them; a head not listed follows,
 * in name order. A drawing no family names is a graphic.
 */
export const FAMILIES = [
  {
    id: "curves",
    title: "Curves",
    heads: ["Plot", "ParametricPlot", "PolarPlot", "ListPlot", "ListLinePlot", "ListPolarPlot"],
  },
  {
    id: "fields",
    title: "Fields",
    heads: ["ContourPlot", "DensityPlot", "RegionPlot", "ListContourPlot", "ListDensityPlot"],
  },
  { id: "vector-fields", title: "Vector fields", heads: ["VectorPlot", "StreamPlot"] },
  { id: "surfaces", title: "Surfaces", heads: ["Plot3D", "ListPlot3D", "BarChart3D", "Graphics3D"] },
  { id: "complex", title: "Complex", heads: ["ComplexPlot", "ComplexPlot3D"] },
  {
    id: "charts",
    title: "Charts",
    heads: ["BarChart", "PieChart", "Chart", "BoxWhiskerChart", "Histogram", "ArrayPlot", "Dendrogram"],
  },
  { id: "graphics", title: "Graphics", heads: [] },
] as const;

export type FamilyId = (typeof FAMILIES)[number]["id"];

/** The family a head's examples sit in; a drawing no other family names is a graphic. */
export const familyOf = (head: string): FamilyId =>
  FAMILIES.find((family) => (family.heads as readonly string[]).includes(head))?.id ?? "graphics";

/**
 * Heads left out although their examples are pictures. DiscretePlot: its page draws it empty (a known
 * page defect, BL-628 slice 5), so a card would show a blank plot; it returns when the head draws.
 */
export const EXCLUDED_HEADS: ReadonlySet<string> = new Set(["DiscretePlot"]);

/** Whether the example's value is a picture and the reference page shows it. */
export function draws(example: ReferenceExample): boolean {
  if (example.role !== undefined && HIDDEN_ROLES.has(example.role)) return false;
  if (example.boxes?.head === "GraphicsBox" || example.boxes?.head === "Graphics3DBox") return true;
  try {
    const tag = renderingOf(example.expr as never)?.tag;
    return tag !== undefined && PICTURE_TAGS.has(tag);
  } catch {
    return false;
  }
}

export interface GalleryCard {
  /** The head whose record holds the example. */
  head: string;
  id: string;
  caption?: string;
  /** The head the example calls (`Plot`), which names its family; it is the record's own head unless the example calls another. */
  drawn: string;
  /** Where the example is on its head's page. */
  href: string;
  /** The example's MathJSON: the picture is lowered from it in the browser, when the card scrolls into view. */
  expr: unknown;
}

export interface GalleryFamily {
  id: FamilyId;
  title: string;
  cards: GalleryCard[];
}

/** The reference page of `head`, and `id`'s anchor on it (ReferencePage.vue's `example/<id>`). */
export const exampleHref = (head: string, id: string): string => `/reference/symbol/${head}#example/${id}`;

/** The head an example calls (`Plot`), which names its family; the record's own head unless it calls another. */
const drawnHead = (entry: ReferenceEntry, example: ReferenceExample): string =>
  Array.isArray(example.expr) && typeof example.expr[0] === "string" ? example.expr[0] : entry.name;

/** Whether the gallery lists the example of `entry`'s record. */
export const listed = (entry: ReferenceEntry, example: ReferenceExample): boolean =>
  !EXCLUDED_HEADS.has(entry.name) && !EXCLUDED_HEADS.has(drawnHead(entry, example)) && draws(example);

/** The place of `head` in its family's order: its index in the list, and after the list by name. */
function rank(family: (typeof FAMILIES)[number], head: string): number {
  const at = (family.heads as readonly string[]).indexOf(head);
  return at === -1 ? family.heads.length : at;
}

/** The drawing examples of `entries`, by family in the order above, each family in its heads' order (a head's own examples in record order). */
export function galleryOf(entries: readonly ReferenceEntry[]): GalleryFamily[] {
  const families: GalleryFamily[] = FAMILIES.map(({ id, title }) => ({ id, title, cards: [] }));
  for (const entry of entries) {
    for (const example of entry.examples ?? []) {
      if (!listed(entry, example)) continue;
      const drawn = drawnHead(entry, example);
      const family = families.find((f) => f.id === familyOf(drawn))!;
      family.cards.push({
        head: entry.name,
        id: example.id,
        ...(example.caption === undefined ? {} : { caption: example.caption }),
        drawn,
        href: exampleHref(entry.name, example.id),
        expr: example.expr,
      });
    }
  }
  for (const family of families) {
    const spec = FAMILIES.find((f) => f.id === family.id)!;
    family.cards = family.cards
      .map((card, at) => ({ card, at }))
      .toSorted(
        (a, b) =>
          rank(spec, a.card.drawn) - rank(spec, b.card.drawn) ||
          (rank(spec, a.card.drawn) === spec.heads.length ? a.card.drawn.localeCompare(b.card.drawn, "en") : 0) ||
          a.at - b.at,
      )
      .map(({ card }) => card);
  }
  return families.filter((family) => family.cards.length > 0);
}

/** The heads that have a card: each links to the gallery from its page. */
export const headsWithCards = (entries: readonly ReferenceEntry[]): Set<string> =>
  new Set(galleryOf(entries).flatMap((family) => family.cards.map((card) => card.head)));
