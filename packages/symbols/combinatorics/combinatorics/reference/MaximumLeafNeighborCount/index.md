---
name: MaximumLeafNeighborCount
domain: Graph statistics
signature: MaximumLeafNeighborCount(graph)
summary: The most neighbors of degree 1 a vertex has.
catalog:
  - system: findstat
    identity: St001826
    url: https://www.findstat.org/St001826
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: MaximumLeafNeighborCount(graph)
    description: The most neighbors of degree 1 a vertex has.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001826. The graph with no vertices gives 0.
