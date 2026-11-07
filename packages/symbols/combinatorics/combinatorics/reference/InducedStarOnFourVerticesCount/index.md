---
name: InducedStarOnFourVerticesCount
domain: Graph statistics
signature: InducedStarOnFourVerticesCount(graph)
summary: "The sets of four vertices that induce a star: three edges, and one vertex has all three others as neighbors."
catalog:
  - system: findstat
    identity: St001307
    url: https://www.findstat.org/St001307
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: InducedStarOnFourVerticesCount(graph)
    description: "The sets of four vertices that induce a star: three edges, and one vertex has all three others as neighbors."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001307. The graph with no vertices gives 0.
