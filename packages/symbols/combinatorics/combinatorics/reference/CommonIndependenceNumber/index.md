---
name: CommonIndependenceNumber
domain: Graph statistics
signature: CommonIndependenceNumber(graph)
summary: The most vertices r such that every vertex lies in an independent set of at least r vertices.
signatures:
  - call: CommonIndependenceNumber(graph)
    description: The most vertices r such that every vertex lies in an independent set of at least r vertices.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St001829
    url: https://www.findstat.org/St001829
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001829: the fewest, over the vertices, of the largest independent set holding the vertex. The graph with no vertices gives 0.
