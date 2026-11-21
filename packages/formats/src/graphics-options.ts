// Engine-free, so a page that only draws can read it without loading compute-engine.

import recorded from "../generated/graphics-options.json" with { type: "json" };

/**
 * The options of the layers a `Show` holds that have no record of their own: they are written only
 * inside a `Show`, so they have no page. A head with a record declares its options there.
 */
const LAYER_OPTIONS: Readonly<Record<string, readonly string[]>> = {
  LatticeTiles: ["ColorRules", "ColorMixing", "BoundaryStyle", "Embedding"],
  StrandDiagram: ["ColorRules", "ColorMixing", "BoundaryStyle"],
  CellDiagram: ["ColorRules", "ColorMixing", "BoundaryStyle"],
  TreeDiagram: ["ColorRules", "ColorMixing", "BoundaryStyle"],
  PathDiagram: ["ColorRules", "ColorMixing", "BoundaryStyle"],
  PolytopeFaces: ["ColorRules", "ColorMixing", "BoundaryStyle", "MeshCellLabel", "PlotLabel"],
};

/**
 * The options a graphics head declares: its record's `options` (built into
 * generated/graphics-options.json), or a layer's above. An argument `Name -> v` is an option of
 * its head exactly when `Name` is listed for that head; any other rule is an argument, so a layer's
 * `ColorRules -> [IsPrime -> Teal]` keeps `IsPrime -> Teal` as a rule. The markup reader reads a
 * child element named for one of these as that option (`<Show><PlotLabel>…</PlotLabel></Show>`).
 * Wolfram's names where Wolfram has the option; `ColorMixing`, `Selection` and `GestureHandling`
 * are ours.
 */
export const GRAPHICS_OPTIONS: Readonly<Record<string, readonly string[]>> = {
  ...(recorded as Record<string, readonly string[]>),
  ...LAYER_OPTIONS,
};

const NONE: ReadonlySet<string> = new Set();
const sets = new Map<string, ReadonlySet<string>>();

/** The options `head` declares, as a set: empty for a head that declares none. */
export function declaredOptions(head: string): ReadonlySet<string> {
  const names = GRAPHICS_OPTIONS[head];
  if (names === undefined) return NONE;
  let set = sets.get(head);
  if (set === undefined) sets.set(head, (set = new Set(names)));
  return set;
}
