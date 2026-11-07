---
name: LargestInducedStarSize
domain: Graph statistics
signature: LargestInducedStarSize(graph)
summary: "The most vertices that induce a star: one vertex adjacent to all the others, which are not adjacent to each other. A single vertex is a star."
catalog:
  - system: findstat
    identity: St001674
    url: https://www.findstat.org/St001674
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: LargestInducedStarSize(graph)
    description: "The most vertices that induce a star: one vertex adjacent to all the others, which are not adjacent to each other. A single vertex is a star."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001674. A set is a star when it has one fewer edges than vertices and a vertex with all the others as neighbors. The graph with no vertices gives 0.
