---
name: InducedDiamondCount
domain: Graph statistics
signature: InducedDiamondCount(graph)
summary: "The sets of four vertices that induce a diamond: a cycle on four vertices with one chord, five edges."
catalog:
  - system: findstat
    identity: St001310
    url: https://www.findstat.org/St001310
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: InducedDiamondCount(graph)
    description: "The sets of four vertices that induce a diamond: a cycle on four vertices with one chord, five edges."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001310. The only graph on four vertices with five edges is the diamond. The graph with no vertices gives 0.
