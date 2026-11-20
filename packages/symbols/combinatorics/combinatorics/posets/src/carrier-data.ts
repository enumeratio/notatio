// Carrier data for the posets area. The value is the list of lower covers: entry i holds the
// elements that i covers, ascending, each less than i (a natural labeling), transitively reduced.

import type { Carrier } from "@notatio/structures";

export const POSETS_CARRIERS: readonly Carrier[] = [
  {
    name: "Poset",
    readable: true,
    type: "poset",
    shape: "list<list<integer>>",
    id: "poset",
    plural: "Posets",
  },
];
