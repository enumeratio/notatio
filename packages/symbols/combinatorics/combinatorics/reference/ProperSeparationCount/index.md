---
name: ProperSeparationCount
domain: Graph statistics
signature: ProperSeparationCount(graph)
summary: The pairs of sets covering the vertices, each with a vertex the other lacks, and no edge between those vertices.
signatures:
  - call: ProperSeparationCount(graph)
    description: The pairs of sets covering the vertices, each with a vertex the other lacks, and no edge between those vertices.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St001799
    url: https://www.findstat.org/St001799
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001799. A separation is a nonempty set of vertices (one side only), a nonempty set of the vertices outside it and its neighbors (the other side only), and the rest in both; each is met from either side, hence the half. The graph with no vertices gives 0.
